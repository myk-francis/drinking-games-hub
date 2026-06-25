import test from "node:test";
import assert from "node:assert/strict";

import type { CoupCard, CoupRoomState } from "./room-state";

import {
  chooseCoupExchange,
  chooseCoupReveal,
  createInitialCoupState,
  declareCoupAction,
  respondToCoupDecision,
} from "./coup-engine";

function card(id: string, role: CoupCard["role"], revealed = false): CoupCard {
  return { id, role, revealed };
}

function createDeterministicState(): CoupRoomState {
  return {
    status: "ACTION",
    roundNumber: 1,
    playerOrder: ["a", "b"],
    currentPlayerId: "a",
    winnerPlayerId: null,
    deck: [
      card("deck-1", "DUKE"),
      card("deck-2", "CAPTAIN"),
      card("deck-3", "AMBASSADOR"),
      card("deck-4", "CONTESSA"),
    ],
    handsByPlayerId: {
      a: [card("a-1", "DUKE"), card("a-2", "ASSASSIN")],
      b: [card("b-1", "CAPTAIN"), card("b-2", "AMBASSADOR")],
    },
    coinsByPlayerId: {
      a: 2,
      b: 2,
    },
    pendingAction: null,
    pendingBlock: null,
    pendingReveal: null,
    pendingExchange: null,
    lastAction: null,
    history: [],
  };
}

test("createInitialCoupState deals two hidden cards and two coins to each player", () => {
  const state = createInitialCoupState(["a", "b", "c"]);

  assert.equal(state.currentPlayerId, "a");
  assert.equal(state.deck.length, 9);
  assert.equal(state.handsByPlayerId.a.length, 2);
  assert.equal(state.handsByPlayerId.b.length, 2);
  assert.equal(state.handsByPlayerId.c.length, 2);
  assert.equal(state.coinsByPlayerId.a, 2);
  assert.equal(state.coinsByPlayerId.b, 2);
  assert.equal(state.coinsByPlayerId.c, 2);
  assert.ok(state.handsByPlayerId.a.every((entry) => entry.revealed === false));
});

test("income adds one coin and passes the turn", () => {
  const state = createDeterministicState();

  declareCoupAction({
    state,
    playerId: "a",
    actionType: "INCOME",
  });

  assert.equal(state.coinsByPlayerId.a, 3);
  assert.equal(state.currentPlayerId, "b");
  assert.equal(state.status, "ACTION");
});

test("players with ten or more coins must coup", () => {
  const state = createDeterministicState();
  state.coinsByPlayerId.a = 10;

  assert.throws(
    () =>
      declareCoupAction({
        state,
        playerId: "a",
        actionType: "INCOME",
      }),
    /must Coup/i,
  );
});

test("a failed action challenge reveals the actor and ends the turn", () => {
  const state = createDeterministicState();
  state.handsByPlayerId.a = [card("a-1", "CAPTAIN"), card("a-2", "ASSASSIN")];

  declareCoupAction({
    state,
    playerId: "a",
    actionType: "TAX",
  });

  respondToCoupDecision({
    state,
    playerId: "b",
    response: "CHALLENGE",
  });

  assert.equal(state.status, "REVEAL_INFLUENCE");
  chooseCoupReveal({
    state,
    playerId: "a",
    cardId: "a-1",
  });

  assert.equal(state.currentPlayerId, "b");
  assert.equal(state.status, "ACTION");
  assert.equal(
    state.handsByPlayerId.a.find((entry) => entry.id === "a-1")?.revealed,
    true,
  );
});

test("a false assassination block causes the target to lose two influence and ends the game", () => {
  const state = createDeterministicState();
  state.coinsByPlayerId.a = 3;

  declareCoupAction({
    state,
    playerId: "a",
    actionType: "ASSASSINATE",
    targetPlayerId: "b",
  });

  respondToCoupDecision({
    state,
    playerId: "b",
    response: "BLOCK_CONTESSA",
  });

  respondToCoupDecision({
    state,
    playerId: "a",
    response: "CHALLENGE",
  });

  assert.equal(state.status, "REVEAL_INFLUENCE");
  chooseCoupReveal({
    state,
    playerId: "b",
    cardId: "b-1",
  });

  assert.equal(state.status, "ENDED");
  assert.equal(state.winnerPlayerId, "a");
  assert.ok(state.handsByPlayerId.b.every((entry) => entry.revealed));
});

test("allowing a Duke block on foreign aid advances the turn instead of freezing the game", () => {
  const state = createDeterministicState();

  declareCoupAction({
    state,
    playerId: "a",
    actionType: "FOREIGN_AID",
  });

  respondToCoupDecision({
    state,
    playerId: "b",
    response: "BLOCK_DUKE",
  });

  respondToCoupDecision({
    state,
    playerId: "a",
    response: "ALLOW",
  });

  assert.equal(state.status, "ACTION");
  assert.equal(state.currentPlayerId, "b");
  assert.equal(state.pendingAction, null);
  assert.equal(state.pendingBlock, null);
  assert.equal(state.coinsByPlayerId.a, 2);
  assert.match(state.lastAction ?? "", /block stood/i);
});

test("losing one influence does not end the game if the player still has another hidden card", () => {
  const state = createDeterministicState();
  state.coinsByPlayerId.a = 7;

  declareCoupAction({
    state,
    playerId: "a",
    actionType: "COUP",
    targetPlayerId: "b",
  });

  assert.equal(state.status, "REVEAL_INFLUENCE");

  chooseCoupReveal({
    state,
    playerId: "b",
    cardId: "b-1",
  });

  assert.equal(state.status, "ACTION");
  assert.equal(state.winnerPlayerId, null);
  assert.equal(state.currentPlayerId, "b");
  assert.equal(
    state.handsByPlayerId.b.filter((entry) => !entry.revealed).length,
    1,
  );
});

test("exchange lets the acting player keep the chosen hidden influences", () => {
  const state = createDeterministicState();

  declareCoupAction({
    state,
    playerId: "a",
    actionType: "EXCHANGE",
  });

  respondToCoupDecision({
    state,
    playerId: "b",
    response: "ALLOW",
  });

  assert.equal(state.status, "EXCHANGE");
  const drawnIds = state.pendingExchange?.drawnCards.map((entry) => entry.id) ?? [];
  assert.equal(drawnIds.length, 2);

  chooseCoupExchange({
    state,
    playerId: "a",
    keptCardIds: ["a-2", drawnIds[0]],
  });

  const keptRoles = state.handsByPlayerId.a
    .filter((entry) => !entry.revealed)
    .map((entry) => entry.id);
  assert.deepEqual(keptRoles.sort(), ["a-2", drawnIds[0]].sort());
  assert.equal(state.status, "ACTION");
  assert.equal(state.currentPlayerId, "b");
});

test("history records key coup events", () => {
  const state = createDeterministicState();

  declareCoupAction({
    state,
    playerId: "a",
    actionType: "TAX",
  });

  respondToCoupDecision({
    state,
    playerId: "b",
    response: "ALLOW",
  });

  assert.ok(state.history.some((entry) => entry.message.includes("declared Tax")));
  assert.ok(state.history.some((entry) => entry.message.includes("Tax resolved")));
});
