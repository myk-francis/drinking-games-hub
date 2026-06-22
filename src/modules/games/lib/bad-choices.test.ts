import test from "node:test";
import assert from "node:assert/strict";

import type { BadChoicesRoomState } from "@/modules/games/lib/room-state";

import { redrawBadChoicesCards } from "./bad-choices";

function createState(): BadChoicesRoomState {
  return {
    status: "PLAYING",
    roundNumber: 1,
    playerOrder: ["a", "b"],
    handsByPlayerId: {
      a: [1, 2, 3],
      b: [4, 5, 6],
    },
    drawPile: [7, 8, 9],
    discardPile: [],
    activeCardId: null,
    activeTargetPlayerId: null,
    allPlayAnswersByPlayerId: {},
    pendingSkipCountsByPlayerId: {},
    winnerPlayerId: null,
    lastResult: null,
  };
}

test("redrawBadChoicesCards discards selected cards and draws the same amount", () => {
  const state = createState();

  const replacementCards = redrawBadChoicesCards({
    state,
    playerId: "a",
    cardIds: [1, 3],
  });

  assert.deepEqual(replacementCards, [7, 8]);
  assert.deepEqual(state.handsByPlayerId.a, [2, 7, 8]);
  assert.deepEqual(state.discardPile, [1, 3]);
  assert.deepEqual(state.drawPile, [9]);
});

test("redrawBadChoicesCards reshuffles the discard pile when the draw pile is empty", () => {
  const state = createState();
  state.drawPile = [];
  state.discardPile = [10, 11];

  const replacementCards = redrawBadChoicesCards({
    state,
    playerId: "a",
    cardIds: [1],
  });

  assert.equal(replacementCards.length, 1);
  assert.equal(state.handsByPlayerId.a.length, 3);
  assert.ok(!state.handsByPlayerId.a.includes(1));
});

test("redrawBadChoicesCards rejects cards that are not in the player's hand", () => {
  const state = createState();

  assert.throws(
    () =>
      redrawBadChoicesCards({
        state,
        playerId: "a",
        cardIds: [99],
      }),
    /only discard cards from your hand/i,
  );
});
