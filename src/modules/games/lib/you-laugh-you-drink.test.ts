import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDirectedPairs,
  getYouLaughYouDrinkOutcome,
} from "./you-laugh-you-drink";

test("buildDirectedPairs creates directional pairings for every player", () => {
  assert.deepEqual(buildDirectedPairs(["a", "b", "c"]), [
    "a&b",
    "a&c",
    "b&a",
    "b&c",
    "c&a",
    "c&b",
  ]);
});

test("laughed result rewards the attacker with a point and the target with a drink", () => {
  assert.deepEqual(getYouLaughYouDrinkOutcome("LAUGHED"), {
    attacker: { points: 1, drinks: 0 },
    target: { points: 0, drinks: 1 },
  });
});

test("straight face result flips the reward onto the target", () => {
  assert.deepEqual(getYouLaughYouDrinkOutcome("STRAIGHT_FACE"), {
    attacker: { points: 0, drinks: 1 },
    target: { points: 1, drinks: 0 },
  });
});
