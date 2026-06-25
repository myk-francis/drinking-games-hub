import type {
  CoupActionType,
  CoupCard,
  CoupPendingAction,
  CoupPendingBlock,
  CoupPendingExchange,
  CoupPostRevealContinuation,
  CoupResponseType,
  CoupRole,
  CoupRoomState,
} from "./room-state";

const COUP_ROLES: readonly CoupRole[] = [
  "DUKE",
  "ASSASSIN",
  "CAPTAIN",
  "AMBASSADOR",
  "CONTESSA",
] as const;

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pushHistory(state: CoupRoomState, message: string) {
  const nextEntry = {
    id: `${Date.now()}-${state.history.length}`,
    message,
  };
  state.history = [...state.history.slice(-11), nextEntry];
}

function getHiddenCards(state: CoupRoomState, playerId: string): CoupCard[] {
  return (state.handsByPlayerId[playerId] ?? []).filter((card) => !card.revealed);
}

function isPlayerActive(state: CoupRoomState, playerId: string): boolean {
  return getHiddenCards(state, playerId).length > 0;
}

function getActivePlayerIds(state: CoupRoomState): string[] {
  return state.playerOrder.filter((playerId) => isPlayerActive(state, playerId));
}

function getNextActivePlayerId(
  state: CoupRoomState,
  currentPlayerId: string,
): string | null {
  const activePlayers = getActivePlayerIds(state);
  if (activePlayers.length <= 1) {
    return activePlayers[0] ?? null;
  }

  const currentIndex = activePlayers.indexOf(currentPlayerId);
  if (currentIndex === -1) {
    return activePlayers[0] ?? null;
  }

  return activePlayers[(currentIndex + 1) % activePlayers.length] ?? null;
}

function getActionClaimRole(actionType: CoupActionType): CoupRole | null {
  switch (actionType) {
    case "TAX":
      return "DUKE";
    case "ASSASSINATE":
      return "ASSASSIN";
    case "STEAL":
      return "CAPTAIN";
    case "EXCHANGE":
      return "AMBASSADOR";
    default:
      return null;
  }
}

function getResponseBlockRole(response: CoupResponseType): CoupRole | null {
  switch (response) {
    case "BLOCK_DUKE":
      return "DUKE";
    case "BLOCK_CONTESSA":
      return "CONTESSA";
    case "BLOCK_CAPTAIN":
      return "CAPTAIN";
    case "BLOCK_AMBASSADOR":
      return "AMBASSADOR";
    default:
      return null;
  }
}

function getActionLabel(actionType: CoupActionType): string {
  switch (actionType) {
    case "INCOME":
      return "Income";
    case "FOREIGN_AID":
      return "Foreign Aid";
    case "COUP":
      return "Coup";
    case "TAX":
      return "Tax";
    case "ASSASSINATE":
      return "Assassinate";
    case "STEAL":
      return "Steal";
    case "EXCHANGE":
      return "Exchange";
  }
}

function ensureActionPhase(state: CoupRoomState) {
  if (state.status !== "ACTION") {
    throw new Error("Finish the current Coup decision first.");
  }
}

function ensurePlayerTurn(state: CoupRoomState, playerId: string) {
  if (state.currentPlayerId !== playerId) {
    throw new Error("It is not your turn.");
  }
  if (!isPlayerActive(state, playerId)) {
    throw new Error("Eliminated players cannot act.");
  }
}

function drawCards(state: CoupRoomState, amount: number): CoupCard[] {
  if (state.deck.length < amount) {
    throw new Error("The Coup deck does not have enough cards left.");
  }

  return state.deck.splice(0, amount).map((card) => ({
    ...card,
    revealed: false,
  }));
}

function proveClaim(
  state: CoupRoomState,
  playerId: string,
  role: CoupRole,
): boolean {
  const hand = state.handsByPlayerId[playerId] ?? [];
  const cardIndex = hand.findIndex((card) => !card.revealed && card.role === role);
  if (cardIndex === -1) {
    return false;
  }

  const provenCard = {
    ...hand[cardIndex],
    revealed: false,
  };
  state.deck = shuffleArray([...state.deck, provenCard]);
  const replacement = drawCards(state, 1)[0];
  hand[cardIndex] = replacement;
  state.handsByPlayerId[playerId] = hand;
  return true;
}

function maybeEndGame(state: CoupRoomState): boolean {
  const activePlayers = getActivePlayerIds(state);
  if (activePlayers.length > 1) {
    return false;
  }

  state.status = "ENDED";
  state.currentPlayerId = activePlayers[0] ?? null;
  state.winnerPlayerId = activePlayers[0] ?? null;
  state.pendingAction = null;
  state.pendingBlock = null;
  state.pendingExchange = null;
  state.pendingReveal = null;
  state.lastAction = activePlayers[0]
    ? "Only one player has influence left. Coup is over."
    : "Coup ended with no players remaining.";
  pushHistory(state, state.lastAction);
  return true;
}

function beginNextTurn(
  state: CoupRoomState,
  nextPlayerId: string | null,
  message: string,
): CoupRoomState {
  if (maybeEndGame(state)) {
    return state;
  }

  state.status = "ACTION";
  state.currentPlayerId = nextPlayerId;
  state.pendingAction = null;
  state.pendingBlock = null;
  state.pendingReveal = null;
  state.pendingExchange = null;
  state.lastAction = message;
  pushHistory(state, message);
  maybeEndGame(state);
  return state;
}

function beginReveal(
  state: CoupRoomState,
  playerId: string,
  influenceLosses: number,
  reason: string,
  continuation: CoupPostRevealContinuation,
): CoupRoomState {
  state.status = "REVEAL_INFLUENCE";
  state.pendingReveal = {
    playerId,
    remainingLosses: influenceLosses,
    reason,
    continuation,
  };
  state.pendingAction = null;
  state.pendingBlock = null;
  state.lastAction = reason;
  pushHistory(state, reason);
  return autoAdvanceReveal(state);
}

function continueAfterReveal(
  state: CoupRoomState,
  continuation: CoupPostRevealContinuation,
): CoupRoomState {
  if (maybeEndGame(state)) {
    return state;
  }

  if (continuation.type === "RESOLVE_ACTION") {
    return resolveDeclaredAction(state, continuation.action, continuation.message);
  }

  return beginNextTurn(state, continuation.nextPlayerId, continuation.message);
}

function autoAdvanceReveal(state: CoupRoomState): CoupRoomState {
  while (state.pendingReveal) {
    const pendingReveal = state.pendingReveal;
    const hiddenCards = getHiddenCards(state, pendingReveal.playerId);

    if (pendingReveal.remainingLosses <= 0 || hiddenCards.length === 0) {
      const continuation = pendingReveal.continuation;
      state.pendingReveal = null;
      return continueAfterReveal(state, continuation);
    }

    if (hiddenCards.length > 1) {
      state.status = "REVEAL_INFLUENCE";
      return state;
    }

    hiddenCards[0].revealed = true;
    pendingReveal.remainingLosses -= 1;
    state.lastAction = `${pendingReveal.reason} A hidden influence was revealed automatically.`;
    pushHistory(state, state.lastAction);

    if (maybeEndGame(state)) {
      return state;
    }
  }

  return state;
}

function resolveDeclaredAction(
  state: CoupRoomState,
  action: CoupPendingAction,
  messagePrefix?: string,
): CoupRoomState {
  const nextPlayerId = getNextActivePlayerId(state, action.actorId);
  const actorCoins = state.coinsByPlayerId[action.actorId] ?? 0;

  switch (action.type) {
    case "INCOME":
      state.coinsByPlayerId[action.actorId] = actorCoins + 1;
      return beginNextTurn(
        state,
        nextPlayerId,
        `${messagePrefix ? `${messagePrefix} ` : ""}${getActionLabel(action.type)} resolved.`,
      );
    case "FOREIGN_AID":
      state.coinsByPlayerId[action.actorId] = actorCoins + 2;
      return beginNextTurn(
        state,
        nextPlayerId,
        `${messagePrefix ? `${messagePrefix} ` : ""}Foreign Aid resolved.`,
      );
    case "TAX":
      state.coinsByPlayerId[action.actorId] = actorCoins + 3;
      return beginNextTurn(
        state,
        nextPlayerId,
        `${messagePrefix ? `${messagePrefix} ` : ""}Tax resolved.`,
      );
    case "STEAL": {
      if (!action.targetPlayerId) {
        throw new Error("Steal requires a target.");
      }
      const targetCoins = state.coinsByPlayerId[action.targetPlayerId] ?? 0;
      const stolenCoins = Math.min(2, targetCoins);
      state.coinsByPlayerId[action.actorId] = actorCoins + stolenCoins;
      state.coinsByPlayerId[action.targetPlayerId] = targetCoins - stolenCoins;
      return beginNextTurn(
        state,
        nextPlayerId,
        `${messagePrefix ? `${messagePrefix} ` : ""}Steal resolved for ${stolenCoins} coin${stolenCoins === 1 ? "" : "s"}.`,
      );
    }
    case "COUP": {
      if (!action.targetPlayerId) {
        throw new Error("Coup requires a target.");
      }
      return beginReveal(
        state,
        action.targetPlayerId,
        1,
        `${messagePrefix ? `${messagePrefix} ` : ""}A Coup landed.`,
        {
          type: "END_TURN",
          nextPlayerId,
          message: "The Coup resolved.",
        },
      );
    }
    case "ASSASSINATE": {
      if (!action.targetPlayerId) {
        throw new Error("Assassinate requires a target.");
      }
      return beginReveal(
        state,
        action.targetPlayerId,
        1,
        `${messagePrefix ? `${messagePrefix} ` : ""}The assassination landed.`,
        {
          type: "END_TURN",
          nextPlayerId,
          message: "The assassination resolved.",
        },
      );
    }
    case "EXCHANGE": {
      const hiddenCards = getHiddenCards(state, action.actorId);
      const drawnCards = drawCards(state, 2);
      const pendingExchange: CoupPendingExchange = {
        playerId: action.actorId,
        keepCount: hiddenCards.length,
        drawnCards,
      };

      state.status = "EXCHANGE";
      state.currentPlayerId = action.actorId;
      state.pendingAction = null;
      state.pendingBlock = null;
      state.pendingReveal = null;
      state.pendingExchange = pendingExchange;
      state.lastAction = `${
        messagePrefix ? `${messagePrefix} ` : ""
      }Choose which influence cards to keep.`;
      pushHistory(state, state.lastAction);
      return state;
    }
  }
}

function getActionResponders(
  state: CoupRoomState,
  actorId: string,
): string[] {
  return getActivePlayerIds(state).filter((playerId) => playerId !== actorId);
}

function getAllowedActionResponses(
  action: CoupPendingAction,
  playerId: string,
): CoupResponseType[] {
  const baseResponses: CoupResponseType[] = ["ALLOW"];

  if (action.type !== "FOREIGN_AID" && action.claimedRole) {
    baseResponses.push("CHALLENGE");
  }

  if (action.type === "FOREIGN_AID") {
    baseResponses.push("BLOCK_DUKE");
  }

  if (action.targetPlayerId === playerId && action.type === "ASSASSINATE") {
    baseResponses.push("BLOCK_CONTESSA");
  }

  if (action.targetPlayerId === playerId && action.type === "STEAL") {
    baseResponses.push("BLOCK_CAPTAIN", "BLOCK_AMBASSADOR");
  }

  return baseResponses;
}

function getAllowedBlockResponses(): CoupResponseType[] {
  return ["ALLOW", "CHALLENGE"];
}

function buildInitialAction(
  state: CoupRoomState,
  actorId: string,
  actionType: CoupActionType,
  targetPlayerId: string | null,
): CoupPendingAction {
  return {
    type: actionType,
    actorId,
    targetPlayerId,
    claimedRole: getActionClaimRole(actionType),
    coinsCost:
      actionType === "COUP" ? 7 : actionType === "ASSASSINATE" ? 3 : 0,
    respondersPendingIds: getActionResponders(state, actorId),
  };
}

export function createInitialCoupState(playerIds: string[]): CoupRoomState {
  const shuffledDeck = shuffleArray(
    COUP_ROLES.flatMap((role) =>
      Array.from({ length: 3 }, (_, index) => ({
        id: `${role}-${index + 1}`,
        role,
        revealed: false,
      })),
    ),
  );

  const handsByPlayerId: Record<string, CoupCard[]> = {};
  for (const playerId of playerIds) {
    handsByPlayerId[playerId] = drawCards(
      {
        status: "ACTION",
        roundNumber: 1,
        playerOrder: [],
        currentPlayerId: null,
        winnerPlayerId: null,
        deck: shuffledDeck,
        handsByPlayerId: {},
        coinsByPlayerId: {},
        pendingAction: null,
        pendingBlock: null,
        pendingReveal: null,
        pendingExchange: null,
        lastAction: null,
        history: [],
      },
      2,
    );
  }

  const coinsByPlayerId = Object.fromEntries(
    playerIds.map((playerId) => [playerId, 2]),
  ) as Record<string, number>;

  return {
    status: "ACTION",
    roundNumber: 1,
    playerOrder: [...playerIds],
    currentPlayerId: playerIds[0] ?? null,
    winnerPlayerId: null,
    deck: shuffledDeck,
    handsByPlayerId,
    coinsByPlayerId,
    pendingAction: null,
    pendingBlock: null,
    pendingReveal: null,
    pendingExchange: null,
    lastAction: "Coup is ready. The first player may act.",
    history: [
      {
        id: "initial",
        message: "Coup is ready. The first player may act.",
      },
    ],
  };
}

export function declareCoupAction(args: {
  state: CoupRoomState;
  playerId: string;
  actionType: CoupActionType;
  targetPlayerId?: string | null;
}): CoupRoomState {
  const { state, playerId, actionType } = args;
  const targetPlayerId = args.targetPlayerId ?? null;

  ensureActionPhase(state);
  ensurePlayerTurn(state, playerId);

  const playerCoins = state.coinsByPlayerId[playerId] ?? 0;
  if (playerCoins >= 10 && actionType !== "COUP") {
    throw new Error("You must Coup when you start your turn with 10 or more coins.");
  }

  const activePlayers = getActivePlayerIds(state);
  if (["COUP", "ASSASSINATE", "STEAL"].includes(actionType)) {
    if (!targetPlayerId) {
      throw new Error("This action requires a target.");
    }
    if (targetPlayerId === playerId) {
      throw new Error("You cannot target yourself.");
    }
    if (!activePlayers.includes(targetPlayerId)) {
      throw new Error("Target player is already out of the game.");
    }
  }

  const action = buildInitialAction(state, playerId, actionType, targetPlayerId);

  if (actionType === "COUP") {
    if (playerCoins < 7) {
      throw new Error("You need 7 coins to launch a Coup.");
    }
    state.coinsByPlayerId[playerId] = playerCoins - 7;
    return resolveDeclaredAction(state, action);
  }

  if (actionType === "ASSASSINATE") {
    if (playerCoins < 3) {
      throw new Error("You need 3 coins to assassinate.");
    }
    state.coinsByPlayerId[playerId] = playerCoins - 3;
  }

  if (actionType === "INCOME") {
    return resolveDeclaredAction(state, action);
  }

  state.status = "ACTION_RESPONSE";
  state.pendingAction = action;
  state.pendingBlock = null;
  state.pendingReveal = null;
  state.pendingExchange = null;
  state.lastAction = `${getActionLabel(actionType)} was declared. Waiting for responses.`;
  pushHistory(
    state,
    `${playerId} declared ${getActionLabel(actionType)}${
      targetPlayerId ? ` targeting ${targetPlayerId}` : ""
    }.`,
  );

  if (action.respondersPendingIds.length === 0) {
    state.pendingAction = null;
    return resolveDeclaredAction(state, action);
  }

  return state;
}

export function respondToCoupDecision(args: {
  state: CoupRoomState;
  playerId: string;
  response: CoupResponseType;
}): CoupRoomState {
  const { state, playerId, response } = args;

  if (state.status === "ACTION_RESPONSE") {
    const action = state.pendingAction;
    if (!action) {
      throw new Error("No Coup action is waiting for a response.");
    }
    if (!action.respondersPendingIds.includes(playerId)) {
      throw new Error("You cannot respond to this action.");
    }

    const allowedResponses = getAllowedActionResponses(action, playerId);
    if (!allowedResponses.includes(response)) {
      throw new Error("That response is not allowed for this action.");
    }

    if (response === "ALLOW") {
      action.respondersPendingIds = action.respondersPendingIds.filter(
        (id) => id !== playerId,
      );
      if (action.respondersPendingIds.length === 0) {
        state.pendingAction = null;
        return resolveDeclaredAction(state, action);
      }
      state.lastAction = "Waiting for the remaining players to respond.";
      return state;
    }

    if (response === "CHALLENGE") {
      state.pendingAction = null;
      pushHistory(state, `${playerId} challenged the claim.`);

      if (!action.claimedRole) {
        throw new Error("This action cannot be challenged.");
      }

      const proved = proveClaim(state, action.actorId, action.claimedRole);
      const nextPlayerId = getNextActivePlayerId(state, action.actorId);
      if (proved) {
        return beginReveal(
          state,
          playerId,
          1,
          "Challenge failed. The claim was true.",
          {
            type: "RESOLVE_ACTION",
            action,
            message: "The challenge failed.",
          },
        );
      }

      return beginReveal(
        state,
        action.actorId,
        1,
        "Challenge succeeded. The claim was false.",
        {
          type: "END_TURN",
          nextPlayerId,
          message: "The bluff failed and the turn passed.",
        },
      );
    }

    const blockRole = getResponseBlockRole(response);
    if (!blockRole) {
      throw new Error("That block is not valid.");
    }

    const pendingBlock: CoupPendingBlock = {
      blockerId: playerId,
      claimedRole: blockRole,
      response,
      respondersPendingIds: getActivePlayerIds(state).filter(
        (id) => id !== playerId,
      ),
    };

    state.status = "BLOCK_RESPONSE";
    state.pendingBlock = pendingBlock;
    state.lastAction = "A block was declared. Waiting for challenges.";
    pushHistory(
      state,
      `${playerId} declared a block with ${blockRole}.`,
    );
    return state;
  }

  if (state.status === "BLOCK_RESPONSE") {
    const action = state.pendingAction;
    const block = state.pendingBlock;
    if (!action || !block) {
      throw new Error("No block is waiting for a response.");
    }

    if (!block.respondersPendingIds.includes(playerId)) {
      throw new Error("You cannot respond to this block.");
    }

    if (!getAllowedBlockResponses().includes(response)) {
      throw new Error("Only allow or challenge is valid right now.");
    }

    if (response === "ALLOW") {
      block.respondersPendingIds = block.respondersPendingIds.filter(
        (id) => id !== playerId,
      );
      if (block.respondersPendingIds.length === 0) {
        state.pendingAction = null;
        state.pendingBlock = null;
        return beginNextTurn(
          state,
          getNextActivePlayerId(state, action.actorId),
          "The block stood and the action was stopped.",
        );
      }
      state.lastAction = "Waiting for the remaining players to respond to the block.";
      return state;
    }

    state.pendingAction = null;
    state.pendingBlock = null;
    pushHistory(state, `${playerId} challenged the block.`);

    const proved = proveClaim(state, block.blockerId, block.claimedRole);
    const nextPlayerId = getNextActivePlayerId(state, action.actorId);
    if (proved) {
      return beginReveal(
        state,
        playerId,
        1,
        "Challenge failed. The block was real.",
        {
          type: "END_TURN",
          nextPlayerId,
          message: "The block succeeded and the turn passed.",
        },
      );
    }

    return beginReveal(
      state,
      block.blockerId,
      1,
      "Challenge succeeded. The block was false.",
      {
        type: "RESOLVE_ACTION",
        action,
        message: "The false block was broken.",
      },
    );
  }

  throw new Error("There is no Coup response window open right now.");
}

export function chooseCoupReveal(args: {
  state: CoupRoomState;
  playerId: string;
  cardId: string;
}): CoupRoomState {
  const { state, playerId, cardId } = args;
  if (state.status !== "REVEAL_INFLUENCE" || !state.pendingReveal) {
    throw new Error("No one needs to reveal influence right now.");
  }
  if (state.pendingReveal.playerId !== playerId) {
    throw new Error("Only the affected player can choose which influence to reveal.");
  }

  const hand = state.handsByPlayerId[playerId] ?? [];
  const card = hand.find((entry) => entry.id === cardId);
  if (!card || card.revealed) {
    throw new Error("Choose one of your hidden influence cards.");
  }

  card.revealed = true;
  state.pendingReveal.remainingLosses -= 1;
  state.lastAction = `${state.pendingReveal.reason} ${card.role} was revealed.`;
  pushHistory(state, state.lastAction);

  if (maybeEndGame(state)) {
    return state;
  }

  return autoAdvanceReveal(state);
}

export function chooseCoupExchange(args: {
  state: CoupRoomState;
  playerId: string;
  keptCardIds: string[];
}): CoupRoomState {
  const { state, playerId, keptCardIds } = args;
  if (state.status !== "EXCHANGE" || !state.pendingExchange) {
    throw new Error("No exchange is waiting to be completed.");
  }
  if (state.pendingExchange.playerId !== playerId) {
    throw new Error("Only the acting player can complete the exchange.");
  }

  const keepIdSet = new Set(keptCardIds);
  if (keepIdSet.size !== keptCardIds.length) {
    throw new Error("Choose each influence card only once.");
  }
  if (keptCardIds.length !== state.pendingExchange.keepCount) {
    throw new Error(`Choose exactly ${state.pendingExchange.keepCount} cards to keep.`);
  }

  const hand = state.handsByPlayerId[playerId] ?? [];
  const revealedCards = hand.filter((card) => card.revealed);
  const hiddenCards = hand.filter((card) => !card.revealed);
  const optionCards = [...hiddenCards, ...state.pendingExchange.drawnCards];

  for (const cardId of keptCardIds) {
    if (!optionCards.some((card) => card.id === cardId)) {
      throw new Error("You can only keep cards that are in the exchange pool.");
    }
  }

  const keptCards = keptCardIds.map((cardId) => {
    const card = optionCards.find((entry) => entry.id === cardId);
    if (!card) {
      throw new Error("Invalid exchange selection.");
    }
    return {
      ...card,
      revealed: false,
    };
  });

  const returnedCards = optionCards
    .filter((card) => !keepIdSet.has(card.id))
    .map((card) => ({
      ...card,
      revealed: false,
    }));

  state.handsByPlayerId[playerId] = [...revealedCards, ...keptCards];
  state.deck = shuffleArray([...state.deck, ...returnedCards]);
  pushHistory(state, `${playerId} completed the Ambassador exchange.`);

  const nextPlayerId = getNextActivePlayerId(state, playerId);
  state.pendingExchange = null;
  return beginNextTurn(state, nextPlayerId, "Exchange resolved.");
}
