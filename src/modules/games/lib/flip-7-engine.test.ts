import test from "node:test";
import assert from "node:assert/strict";

import type {
  Flip7ActionCard,
  Flip7Card,
  Flip7ModifierCard,
  Flip7PlayerState,
  Flip7RoomState,
} from "./room-state";

import {
  createFlip7Deck,
  createInitialFlip7State,
  flip7AdvanceRound,
  flip7ChooseTarget,
  flip7Hit,
  flip7Stay,
  getFlip7RoundScore,
} from "./flip-7-engine";

function numberCard(id: string, value: number): Flip7Card {
  return {
    id,
    kind: "NUMBER",
    value,
  };
}

function modifierCard(
  id: string,
  modifier: Flip7ModifierCard["modifier"],
): Flip7Card {
  return {
    id,
    kind: "MODIFIER",
    modifier,
  };
}

function actionCard(id: string, action: Flip7ActionCard["action"]): Flip7Card {
  return {
    id,
    kind: "ACTION",
    action,
  };
}

function playerState(
  cards: Flip7Card[] = [],
  overrides: Partial<Flip7PlayerState> = {},
): Flip7PlayerState {
  return {
    cards,
    active: true,
    stayed: false,
    busted: false,
    frozen: false,
    protectedBySecondChance: false,
    hasFlippedSeven: false,
    ...overrides,
  };
}

function createDeterministicState(): Flip7RoomState {
  return {
    status: "ROUND_DECISION",
    roundNumber: 1,
    playerOrder: ["a", "b", "c"],
    roundStarterPlayerId: "a",
    currentPlayerId: "a",
    drawPile: [],
    discardPile: [],
    playerStatesById: {
      a: playerState([numberCard("a-3", 3)]),
      b: playerState([numberCard("b-4", 4)]),
      c: playerState([numberCard("c-5", 5)]),
    },
    scoresByPlayerId: {
      a: 0,
      b: 0,
      c: 0,
    },
    lastRoundScoresByPlayerId: {},
    initialDealIndex: 3,
    queuedActions: [],
    pendingAction: null,
    resolutionContext: null,
    targetScore: 200,
    winnerPlayerId: null,
    pointPlayerIds: [],
    drinkPlayerIds: [],
    lastAction: null,
    history: [],
  };
}

test("flip 7 deck uses numbers 1 through 12 only and totals 93 cards", () => {
  const deck = createFlip7Deck();
  const numberValues = deck
    .filter((card) => card.kind === "NUMBER")
    .map((card) => card.value);

  assert.equal(deck.length, 93);
  assert.ok(numberValues.every((value) => value >= 1 && value <= 12));
  assert.ok(!numberValues.includes(0));
});

test("initial flip 7 state accounts for the whole deck", () => {
  const state = createInitialFlip7State(["a", "b", "c"]);
  const cardsInPlayers = Object.values(state.playerStatesById).reduce(
    (sum, player) => sum + player.cards.length,
    0,
  );

  assert.equal(
    state.drawPile.length + state.discardPile.length + cardsInPlayers,
    93,
  );
  assert.ok(
    ["INITIAL_DEAL", "AWAITING_ACTION_TARGET", "ROUND_DECISION"].includes(
      state.status,
    ),
  );
});

test("stay removes a player from active turns and advances to the next player", () => {
  const state = createDeterministicState();

  flip7Stay({
    state,
    playerId: "a",
  });

  assert.equal(state.playerStatesById.a.active, false);
  assert.equal(state.playerStatesById.a.stayed, true);
  assert.equal(state.currentPlayerId, "b");
  assert.equal(state.status, "ROUND_DECISION");
});

test("duplicate number busts without second chance", () => {
  const state = createDeterministicState();
  state.drawPile = [numberCard("draw-3", 3)];

  flip7Hit({
    state,
    playerId: "a",
  });

  assert.equal(state.playerStatesById.a.busted, true);
  assert.equal(state.playerStatesById.a.active, false);
  assert.equal(state.currentPlayerId, "b");
});

test("second chance consumes protection and prevents a bust", () => {
  const state = createDeterministicState();
  state.playerStatesById.a = playerState(
    [numberCard("a-5", 5), actionCard("a-second", "SECOND_CHANCE")],
    {
      protectedBySecondChance: true,
    },
  );
  state.drawPile = [numberCard("draw-5", 5)];

  flip7Hit({
    state,
    playerId: "a",
  });

  assert.equal(state.playerStatesById.a.busted, false);
  assert.equal(state.playerStatesById.a.protectedBySecondChance, false);
  assert.equal(
    state.playerStatesById.a.cards.some(
      (card) => card.kind === "ACTION" && card.action === "SECOND_CHANCE",
    ),
    false,
  );
  assert.equal(state.currentPlayerId, "b");
});

test("freeze keeps the target's score but removes them from the round", () => {
  const state = createDeterministicState();
  state.status = "AWAITING_ACTION_TARGET";
  state.pendingAction = {
    id: "freeze-1",
    sourcePlayerId: "a",
    actionType: "FREEZE",
    allowedTargetPlayerIds: ["b", "c"],
  };
  state.resolutionContext = {
    kind: "TURN_END",
    playerId: "a",
  };

  flip7ChooseTarget({
    state,
    playerId: "a",
    targetPlayerId: "b",
  });

  assert.equal(state.playerStatesById.b.frozen, true);
  assert.equal(state.playerStatesById.b.active, false);
  assert.equal(state.currentPlayerId, "c");
  assert.equal(state.status, "ROUND_DECISION");
});

test("flip three queues newly revealed action cards after the three-card sequence", () => {
  const state = createDeterministicState();
  state.status = "AWAITING_ACTION_TARGET";
  state.pendingAction = {
    id: "flip-three-1",
    sourcePlayerId: "a",
    actionType: "FLIP_THREE",
    allowedTargetPlayerIds: ["b"],
  };
  state.resolutionContext = {
    kind: "TURN_END",
    playerId: "a",
  };
  state.drawPile = [
    numberCard("draw-2", 2),
    actionCard("draw-freeze", "FREEZE"),
    numberCard("draw-4", 4),
  ];

  flip7ChooseTarget({
    state,
    playerId: "a",
    targetPlayerId: "b",
  });

  assert.equal(
    state.playerStatesById.b.cards.filter((card) => card.kind === "NUMBER").length,
    3,
  );
  assert.equal(state.status, "AWAITING_ACTION_TARGET");
  assert.equal(state.pendingAction?.actionType, "FREEZE");
  assert.equal(state.pendingAction?.sourcePlayerId, "b");
});

test("x2 only multiplies the number subtotal before plus modifiers are added", () => {
  const score = getFlip7RoundScore(
    playerState([
      numberCard("n3", 3),
      numberCard("n4", 4),
      numberCard("n12", 12),
      modifierCard("m2", "MULTIPLY_TWO"),
      modifierCard("m10", "PLUS_TEN"),
    ]),
  );

  assert.equal(score, 48);
});

test("flipping seven unique numbers ends the round and adds the +15 bonus", () => {
  const state = createDeterministicState();
  state.playerStatesById.a = playerState([
    numberCard("n1", 1),
    numberCard("n2", 2),
    numberCard("n3", 3),
    numberCard("n4", 4),
    numberCard("n5", 5),
    numberCard("n6", 6),
  ]);
  state.playerStatesById.b = playerState([numberCard("b-10", 10)], {
    active: false,
    stayed: true,
  });
  state.playerStatesById.c = playerState([numberCard("c-9", 9)], {
    active: false,
    stayed: true,
  });
  state.drawPile = [numberCard("draw-7", 7)];

  flip7Hit({
    state,
    playerId: "a",
  });

  assert.equal(state.status, "ROUND_OVER");
  assert.equal(state.lastRoundScoresByPlayerId.a, 43);
  assert.equal(state.playerStatesById.a.hasFlippedSeven, true);
});

test("a tie above the target score continues the game into another round", () => {
  const state = createDeterministicState();
  state.scoresByPlayerId = {
    a: 190,
    b: 190,
    c: 0,
  };
  state.playerStatesById.a = playerState([numberCard("a-12", 12)]);
  state.playerStatesById.b = playerState([numberCard("b-12", 12)], {
    active: false,
    stayed: true,
  });
  state.playerStatesById.c = playerState([], {
    active: false,
    stayed: true,
  });

  flip7Stay({
    state,
    playerId: "a",
  });

  assert.equal(state.status, "ROUND_OVER");
  assert.equal(state.winnerPlayerId, null);

  flip7AdvanceRound({ state });

  assert.equal(state.roundNumber, 2);
  assert.ok(["INITIAL_DEAL", "AWAITING_ACTION_TARGET", "ROUND_DECISION"].includes(state.status));
});

test("a unique leader above the target score ends the game and assigns points/drinks", () => {
  const state = createDeterministicState();
  state.scoresByPlayerId = {
    a: 195,
    b: 100,
    c: 50,
  };
  state.playerStatesById.a = playerState([numberCard("a-7", 7)]);
  state.playerStatesById.b = playerState([numberCard("b-9", 9)], {
    active: false,
    stayed: true,
  });
  state.playerStatesById.c = playerState([numberCard("c-8", 8)], {
    active: false,
    stayed: true,
  });

  flip7Stay({
    state,
    playerId: "a",
  });

  assert.equal(state.status, "ENDED");
  assert.equal(state.winnerPlayerId, "a");
  assert.deepEqual(state.pointPlayerIds, ["a"]);
  assert.deepEqual(state.drinkPlayerIds.sort(), ["b", "c"]);
});
