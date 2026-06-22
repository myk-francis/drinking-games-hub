import type {
  Flip7ActionCard,
  Flip7ActionType,
  Flip7Card,
  Flip7ModifierCard,
  Flip7ModifierType,
  Flip7NumberCard,
  Flip7PlayerState,
  Flip7QueuedAction,
  Flip7RoomState,
} from "./room-state";

const FLIP7_TARGET_SCORE = 200;

const FLIP7_MODIFIER_VALUES: Record<Exclude<Flip7ModifierType, "MULTIPLY_TWO">, number> =
  {
    PLUS_TWO: 2,
    PLUS_FOUR: 4,
    PLUS_SIX: 6,
    PLUS_EIGHT: 8,
    PLUS_TEN: 10,
  };

function createHistoryId(state: Flip7RoomState): string {
  return `flip7-${state.roundNumber}-${state.history.length + 1}`;
}

function pushHistory(state: Flip7RoomState, message: string) {
  state.history.push({
    id: createHistoryId(state),
    message,
  });
  state.lastAction = message;
}

function createNumberCard(value: number, copy: number): Flip7NumberCard {
  return {
    id: `flip7-number-${value}-${copy}`,
    kind: "NUMBER",
    value,
  };
}

function createModifierCard(
  modifier: Flip7ModifierType,
  index: number,
): Flip7ModifierCard {
  return {
    id: `flip7-modifier-${modifier}-${index}`,
    kind: "MODIFIER",
    modifier,
  };
}

function createActionCard(action: Flip7ActionType, index: number): Flip7ActionCard {
  return {
    id: `flip7-action-${action}-${index}`,
    kind: "ACTION",
    action,
  };
}

export function createFlip7Deck(): Flip7Card[] {
  const deck: Flip7Card[] = [];

  for (let value = 1; value <= 12; value += 1) {
    for (let copy = 1; copy <= value; copy += 1) {
      deck.push(createNumberCard(value, copy));
    }
  }

  (
    [
      "PLUS_TWO",
      "PLUS_FOUR",
      "PLUS_SIX",
      "PLUS_EIGHT",
      "PLUS_TEN",
      "MULTIPLY_TWO",
    ] as const
  ).forEach((modifier, index) => {
    deck.push(createModifierCard(modifier, index + 1));
  });

  (["FREEZE", "FLIP_THREE", "SECOND_CHANCE"] as const).forEach((action) => {
    for (let index = 1; index <= 3; index += 1) {
      deck.push(createActionCard(action, index));
    }
  });

  return deck;
}

function shuffleCards(cards: Flip7Card[]): Flip7Card[] {
  const deck = [...cards];

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck;
}

function createPlayerState(): Flip7PlayerState {
  return {
    cards: [],
    active: true,
    stayed: false,
    busted: false,
    frozen: false,
    protectedBySecondChance: false,
    hasFlippedSeven: false,
  };
}

function getPlayerState(state: Flip7RoomState, playerId: string): Flip7PlayerState {
  const playerState = state.playerStatesById[playerId];
  if (!playerState) {
    throw new Error("Player is not part of this Flip 7 room.");
  }
  return playerState;
}

function getNumberValues(playerState: Flip7PlayerState): number[] {
  return playerState.cards
    .filter((card): card is Flip7NumberCard => card.kind === "NUMBER")
    .map((card) => card.value);
}

function getUniqueNumberCount(playerState: Flip7PlayerState): number {
  return new Set(getNumberValues(playerState)).size;
}

function getModifierCards(playerState: Flip7PlayerState): Flip7ModifierCard[] {
  return playerState.cards.filter(
    (card): card is Flip7ModifierCard => card.kind === "MODIFIER",
  );
}

function getActivePlayerIds(state: Flip7RoomState): string[] {
  return state.playerOrder.filter((playerId) => getPlayerState(state, playerId).active);
}

function getNextActivePlayerId(
  state: Flip7RoomState,
  afterPlayerId: string | null,
): string | null {
  const activePlayerIds = getActivePlayerIds(state);
  if (activePlayerIds.length === 0) return null;

  if (!afterPlayerId) {
    return activePlayerIds[0] ?? null;
  }

  const startIndex = state.playerOrder.indexOf(afterPlayerId);
  if (startIndex === -1) {
    return activePlayerIds[0] ?? null;
  }

  for (let offset = 1; offset <= state.playerOrder.length; offset += 1) {
    const playerId = state.playerOrder[(startIndex + offset) % state.playerOrder.length];
    if (getPlayerState(state, playerId).active) {
      return playerId;
    }
  }

  return null;
}

function getFirstActivePlayerAtOrAfter(
  state: Flip7RoomState,
  startingPlayerId: string | null,
): string | null {
  const activePlayerIds = getActivePlayerIds(state);
  if (activePlayerIds.length === 0) return null;

  if (!startingPlayerId) {
    return activePlayerIds[0] ?? null;
  }

  const startIndex = state.playerOrder.indexOf(startingPlayerId);
  if (startIndex === -1) {
    return activePlayerIds[0] ?? null;
  }

  for (let offset = 0; offset < state.playerOrder.length; offset += 1) {
    const playerId = state.playerOrder[(startIndex + offset) % state.playerOrder.length];
    if (getPlayerState(state, playerId).active) {
      return playerId;
    }
  }

  return null;
}

function getModifierBonus(playerState: Flip7PlayerState): number {
  return getModifierCards(playerState).reduce((sum, card) => {
    if (card.modifier === "MULTIPLY_TWO") return sum;
    return sum + FLIP7_MODIFIER_VALUES[card.modifier];
  }, 0);
}

function hasMultiplier(playerState: Flip7PlayerState): boolean {
  return getModifierCards(playerState).some(
    (card) => card.modifier === "MULTIPLY_TWO",
  );
}

export function getFlip7RoundScore(playerState: Flip7PlayerState): number {
  if (playerState.busted) {
    return 0;
  }

  const numberTotal = getNumberValues(playerState).reduce(
    (sum, value) => sum + value,
    0,
  );
  const multipliedTotal = hasMultiplier(playerState) ? numberTotal * 2 : numberTotal;
  const modifierBonus = getModifierBonus(playerState);
  const flip7Bonus = playerState.hasFlippedSeven ? 15 : 0;

  return multipliedTotal + modifierBonus + flip7Bonus;
}

function clearRoundControls(state: Flip7RoomState) {
  state.currentPlayerId = null;
  state.pendingAction = null;
  state.queuedActions = [];
  state.resolutionContext = null;
}

function hasRoundEnded(state: Flip7RoomState): boolean {
  return state.status === "ROUND_OVER" || state.status === "ENDED";
}

function finalizeRound(state: Flip7RoomState, reason: string) {
  if (state.status === "ROUND_OVER" || state.status === "ENDED") {
    return;
  }

  const roundScoresByPlayerId: Record<string, number> = {};
  let highestScore = -Infinity;

  for (const playerId of state.playerOrder) {
    const roundScore = getFlip7RoundScore(getPlayerState(state, playerId));
    roundScoresByPlayerId[playerId] = roundScore;
    state.scoresByPlayerId[playerId] = (state.scoresByPlayerId[playerId] ?? 0) + roundScore;
    highestScore = Math.max(highestScore, state.scoresByPlayerId[playerId] ?? 0);
  }

  state.lastRoundScoresByPlayerId = roundScoresByPlayerId;
  clearRoundControls(state);

  const leaders = state.playerOrder.filter(
    (playerId) => (state.scoresByPlayerId[playerId] ?? 0) === highestScore,
  );
  const eligibleLeaders = leaders.filter(
    (playerId) => (state.scoresByPlayerId[playerId] ?? 0) >= state.targetScore,
  );

  if (eligibleLeaders.length === 1) {
    state.status = "ENDED";
    state.winnerPlayerId = eligibleLeaders[0] ?? null;
    state.pointPlayerIds = state.winnerPlayerId ? [state.winnerPlayerId] : [];
    state.drinkPlayerIds = state.playerOrder.filter(
      (playerId) => playerId !== state.winnerPlayerId,
    );
    pushHistory(
      state,
      `${reason} ${state.winnerPlayerId} wins the game and gets +1 point. Everyone else drinks +1.`,
    );
    return;
  }

  state.status = "ROUND_OVER";
  state.winnerPlayerId = null;
  state.pointPlayerIds = [];
  state.drinkPlayerIds = [];
  pushHistory(state, `${reason} Round ${state.roundNumber} is over.`);
}

function maybeFinalizeRound(state: Flip7RoomState, reason: string) {
  if (getActivePlayerIds(state).length === 0) {
    finalizeRound(state, reason);
  }
}

function removeSecondChanceCard(playerState: Flip7PlayerState): Flip7ActionCard | null {
  const index = playerState.cards.findIndex(
    (card) => card.kind === "ACTION" && card.action === "SECOND_CHANCE",
  );
  if (index === -1) return null;
  const [removedCard] = playerState.cards.splice(index, 1);
  return removedCard?.kind === "ACTION" ? removedCard : null;
}

function drawCard(state: Flip7RoomState): Flip7Card | null {
  return state.drawPile.shift() ?? null;
}

function queueAction(
  state: Flip7RoomState,
  card: Flip7ActionCard,
  sourcePlayerId: string,
) {
  state.queuedActions.push({
    id: card.id,
    sourcePlayerId,
    actionType: card.action,
  });
}

function applyNumberCard(
  state: Flip7RoomState,
  playerId: string,
  card: Flip7NumberCard,
) {
  const playerState = getPlayerState(state, playerId);
  const currentValues = getNumberValues(playerState);

  if (currentValues.includes(card.value)) {
    if (playerState.protectedBySecondChance) {
      playerState.protectedBySecondChance = false;
      const secondChanceCard = removeSecondChanceCard(playerState);
      if (secondChanceCard) {
        state.discardPile.push(secondChanceCard);
      }
      state.discardPile.push(card);
      pushHistory(
        state,
        `${playerId} used Second Chance to survive a duplicate ${card.value}.`,
      );
      return;
    }

    playerState.cards.push(card);
    playerState.active = false;
    playerState.busted = true;
    pushHistory(state, `${playerId} busted by flipping a duplicate ${card.value}.`);
    return;
  }

  playerState.cards.push(card);
  pushHistory(state, `${playerId} revealed ${card.value}.`);

  if (getUniqueNumberCount(playerState) >= 7) {
    playerState.active = false;
    playerState.stayed = true;
    playerState.hasFlippedSeven = true;
    finalizeRound(state, `${playerId} flipped 7 unique numbers.`);
  }
}

function applyModifierCard(
  state: Flip7RoomState,
  playerId: string,
  card: Flip7ModifierCard,
) {
  const playerState = getPlayerState(state, playerId);
  playerState.cards.push(card);
  pushHistory(state, `${playerId} picked up ${card.modifier}.`);
}

function beginNextQueuedAction(state: Flip7RoomState) {
  if (hasRoundEnded(state)) return;
  if (state.pendingAction || state.queuedActions.length === 0) return;

  const nextAction = state.queuedActions.shift();
  if (!nextAction) return;

  const activePlayers = getActivePlayerIds(state);
  if (activePlayers.length === 0) {
    finalizeRound(state, "No active players remained.");
    return;
  }

  const allowedTargetPlayerIds =
    nextAction.actionType === "SECOND_CHANCE"
      ? activePlayers.filter(
          (playerId) => !getPlayerState(state, playerId).protectedBySecondChance,
        )
      : activePlayers;

  const effectiveTargets =
    allowedTargetPlayerIds.length > 0 ? allowedTargetPlayerIds : activePlayers;

  if (effectiveTargets.length === 1) {
    applyQueuedActionToTarget(state, nextAction, effectiveTargets[0]!);
    return;
  }

  state.status = "AWAITING_ACTION_TARGET";
  state.currentPlayerId = nextAction.sourcePlayerId;
  state.pendingAction = {
    id: nextAction.id,
    sourcePlayerId: nextAction.sourcePlayerId,
    actionType: nextAction.actionType,
    allowedTargetPlayerIds: effectiveTargets,
  };
  pushHistory(
    state,
    `${nextAction.sourcePlayerId} must choose a target for ${nextAction.actionType}.`,
  );
}

function resumeRoundFlow(state: Flip7RoomState) {
  if (hasRoundEnded(state)) return;
  if (state.pendingAction) return;

  if (state.queuedActions.length > 0) {
    beginNextQueuedAction(state);
    return;
  }

  if (state.resolutionContext?.kind === "INITIAL_DEAL") {
    continueInitialDeal(state);
    return;
  }

  if (state.resolutionContext?.kind === "TURN_END") {
    const finishedPlayerId = state.resolutionContext.playerId;
    state.resolutionContext = null;
    const nextPlayerId = getNextActivePlayerId(state, finishedPlayerId);
    if (!nextPlayerId) {
      finalizeRound(state, "All active players are done.");
      return;
    }
    state.status = "ROUND_DECISION";
    state.currentPlayerId = nextPlayerId;
    return;
  }
}

function drawAndResolveCard(
  state: Flip7RoomState,
  playerId: string,
  drawReason: "INITIAL_DEAL" | "TURN" | "FLIP_THREE",
) {
  const card = drawCard(state);
  if (!card) {
    finalizeRound(state, "The deck ran out.");
    return;
  }

  if (card.kind === "NUMBER") {
    applyNumberCard(state, playerId, card);
    if (state.status === "ROUND_OVER" || state.status === "ENDED") {
      return;
    }
    if (drawReason !== "FLIP_THREE") {
      maybeFinalizeRound(state, "All active players are done.");
    }
    return;
  }

  if (card.kind === "MODIFIER") {
    applyModifierCard(state, playerId, card);
    return;
  }

  if (!state.resolutionContext) {
    state.resolutionContext =
      drawReason === "INITIAL_DEAL"
        ? { kind: "INITIAL_DEAL" }
        : { kind: "TURN_END", playerId };
  }

  pushHistory(state, `${playerId} drew ${card.action}.`);
  queueAction(state, card, playerId);
}

function continueInitialDeal(state: Flip7RoomState) {
  if (hasRoundEnded(state)) return;

  state.status = "INITIAL_DEAL";
  state.currentPlayerId = null;

  while (
    state.initialDealIndex < state.playerOrder.length &&
    !state.pendingAction &&
    state.queuedActions.length === 0 &&
    state.status === "INITIAL_DEAL"
  ) {
    const playerId = state.playerOrder[state.initialDealIndex]!;
    state.initialDealIndex += 1;

    if (!getPlayerState(state, playerId).active) {
      continue;
    }

    drawAndResolveCard(state, playerId, "INITIAL_DEAL");
  }

  if (hasRoundEnded(state)) {
    return;
  }

  if (state.pendingAction || state.queuedActions.length > 0) {
    resumeRoundFlow(state);
    return;
  }

  if (state.initialDealIndex >= state.playerOrder.length) {
    state.resolutionContext = null;
    state.status = "ROUND_DECISION";
    state.currentPlayerId = getFirstActivePlayerAtOrAfter(
      state,
      state.roundStarterPlayerId,
    );
    if (!state.currentPlayerId) {
      finalizeRound(state, "No players remained after the initial deal.");
    }
  }
}

function applyQueuedActionToTarget(
  state: Flip7RoomState,
  queuedAction: Flip7QueuedAction,
  targetPlayerId: string,
) {
  const targetState = getPlayerState(state, targetPlayerId);
  const actionCard: Flip7ActionCard = {
    id: queuedAction.id,
    kind: "ACTION",
    action: queuedAction.actionType,
  };

  state.pendingAction = null;

  if (queuedAction.actionType === "FREEZE") {
    targetState.cards.push(actionCard);
    targetState.active = false;
    targetState.frozen = true;
    pushHistory(state, `${queuedAction.sourcePlayerId} froze ${targetPlayerId}.`);
    maybeFinalizeRound(state, "All active players are done.");
    resumeRoundFlow(state);
    return;
  }

  if (queuedAction.actionType === "SECOND_CHANCE") {
    if (!targetState.protectedBySecondChance) {
      targetState.cards.push(actionCard);
      targetState.protectedBySecondChance = true;
      pushHistory(
        state,
        `${queuedAction.sourcePlayerId} gave Second Chance to ${targetPlayerId}.`,
      );
    } else {
      state.discardPile.push(actionCard);
      pushHistory(
        state,
        `${queuedAction.sourcePlayerId} burned an extra Second Chance on ${targetPlayerId}.`,
      );
    }
    resumeRoundFlow(state);
    return;
  }

  targetState.cards.push(actionCard);
  pushHistory(
    state,
    `${queuedAction.sourcePlayerId} made ${targetPlayerId} Flip Three.`,
  );

  const newQueuedActions: Flip7QueuedAction[] = [];

  for (let drawCount = 0; drawCount < 3; drawCount += 1) {
    if (!targetState.active) break;
    if (hasRoundEnded(state)) break;

    const card = drawCard(state);
    if (!card) {
      finalizeRound(state, "The deck ran out.");
      break;
    }

    if (card.kind === "ACTION") {
      newQueuedActions.push({
        id: card.id,
        sourcePlayerId: targetPlayerId,
        actionType: card.action,
      });
      pushHistory(state, `${targetPlayerId} revealed ${card.action} during Flip Three.`);
      continue;
    }

    if (card.kind === "NUMBER") {
      applyNumberCard(state, targetPlayerId, card);
      continue;
    }

    applyModifierCard(state, targetPlayerId, card);
  }

  if (newQueuedActions.length > 0) {
    state.queuedActions = [...newQueuedActions, ...state.queuedActions];
  }

  maybeFinalizeRound(state, "All active players are done.");
  resumeRoundFlow(state);
}

function setupRound(state: Flip7RoomState) {
  state.status = "INITIAL_DEAL";
  state.drawPile = shuffleCards(createFlip7Deck());
  state.discardPile = [];
  state.initialDealIndex = 0;
  state.pendingAction = null;
  state.queuedActions = [];
  state.resolutionContext = null;
  state.currentPlayerId = null;
  state.winnerPlayerId = null;
  state.pointPlayerIds = [];
  state.drinkPlayerIds = [];
  state.lastRoundScoresByPlayerId = {};

  const starterIndex = (state.roundNumber - 1) % Math.max(1, state.playerOrder.length);
  state.roundStarterPlayerId = state.playerOrder[starterIndex] ?? null;

  for (const playerId of state.playerOrder) {
    state.playerStatesById[playerId] = createPlayerState();
    state.scoresByPlayerId[playerId] = state.scoresByPlayerId[playerId] ?? 0;
  }

  continueInitialDeal(state);
}

export function createInitialFlip7State(playerIds: string[]): Flip7RoomState {
  const state: Flip7RoomState = {
    status: "INITIAL_DEAL",
    roundNumber: 1,
    playerOrder: [...playerIds],
    roundStarterPlayerId: playerIds[0] ?? null,
    currentPlayerId: null,
    drawPile: [],
    discardPile: [],
    playerStatesById: Object.fromEntries(
      playerIds.map((playerId) => [playerId, createPlayerState()]),
    ),
    scoresByPlayerId: Object.fromEntries(playerIds.map((playerId) => [playerId, 0])),
    lastRoundScoresByPlayerId: {},
    initialDealIndex: 0,
    queuedActions: [],
    pendingAction: null,
    resolutionContext: null,
    targetScore: FLIP7_TARGET_SCORE,
    winnerPlayerId: null,
    pointPlayerIds: [],
    drinkPlayerIds: [],
    lastAction: null,
    history: [],
  };

  setupRound(state);
  return state;
}

export function flip7Stay(args: { state: Flip7RoomState; playerId: string }) {
  const { state, playerId } = args;

  if (state.status !== "ROUND_DECISION" || state.currentPlayerId !== playerId) {
    throw new Error("It is not this player's decision turn.");
  }

  const playerState = getPlayerState(state, playerId);
  if (!playerState.active) {
    throw new Error("This player is no longer active in the round.");
  }

  playerState.active = false;
  playerState.stayed = true;
  state.resolutionContext = {
    kind: "TURN_END",
    playerId,
  };
  pushHistory(state, `${playerId} stayed and banked the round.`);
  resumeRoundFlow(state);
}

export function flip7Hit(args: { state: Flip7RoomState; playerId: string }) {
  const { state, playerId } = args;

  if (state.status !== "ROUND_DECISION" || state.currentPlayerId !== playerId) {
    throw new Error("It is not this player's decision turn.");
  }

  const playerState = getPlayerState(state, playerId);
  if (!playerState.active) {
    throw new Error("This player is no longer active in the round.");
  }

  state.resolutionContext = {
    kind: "TURN_END",
    playerId,
  };
  drawAndResolveCard(state, playerId, "TURN");

  if (hasRoundEnded(state)) {
    state.resolutionContext = null;
    return;
  }

  if (state.queuedActions.length > 0 || state.pendingAction) {
    resumeRoundFlow(state);
    return;
  }

  resumeRoundFlow(state);
}

export function flip7ChooseTarget(args: {
  state: Flip7RoomState;
  playerId: string;
  targetPlayerId: string;
}) {
  const { state, playerId, targetPlayerId } = args;

  if (state.status !== "AWAITING_ACTION_TARGET" || !state.pendingAction) {
    throw new Error("There is no pending Flip 7 action to target.");
  }

  if (state.pendingAction.sourcePlayerId !== playerId) {
    throw new Error("Only the player who drew the action can choose the target.");
  }

  if (!state.pendingAction.allowedTargetPlayerIds.includes(targetPlayerId)) {
    throw new Error("That target is not legal for this action.");
  }

  applyQueuedActionToTarget(
    state,
    {
      id: state.pendingAction.id,
      sourcePlayerId: state.pendingAction.sourcePlayerId,
      actionType: state.pendingAction.actionType,
    },
    targetPlayerId,
  );
}

export function flip7AdvanceRound(args: { state: Flip7RoomState }) {
  const { state } = args;

  if (state.status !== "ROUND_OVER") {
    throw new Error("A new Flip 7 round can only start after the current round ends.");
  }

  state.roundNumber += 1;
  setupRound(state);
}
