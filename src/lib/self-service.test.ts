import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_PLAYERS_BY_GAME,
  MIN_PLAYERS_BY_GAME,
  getSelfServiceValidationError,
  normalizeSelfServicePayload,
} from "./self-service";

test("flip 7 is listed with a three-player minimum for self-service", () => {
  assert.equal(MIN_PLAYERS_BY_GAME["flip-7"], 3);
});

test("coup is listed with a two-player minimum for self-service", () => {
  assert.equal(MIN_PLAYERS_BY_GAME.coup, 2);
});

test("coup is listed with a six-player maximum for self-service", () => {
  assert.equal(MAX_PLAYERS_BY_GAME.coup, 6);
});

test("self-service validation blocks coup rooms with fewer than two players", () => {
  const error = getSelfServiceValidationError({
    version: 1,
    selectedGame: "coup",
    players: ["Alex"],
    selectedRounds: 0,
    selectedStake: 10000,
    teamsInfo: [],
  });

  assert.equal(error, "This game needs at least 2 players.");
});

test("self-service normalization trims coup players and removes duplicates", () => {
  const normalized = normalizeSelfServicePayload({
    version: 1,
    selectedGame: " coup ",
    players: [" Alex ", "Sam", "Alex", " "],
    selectedRounds: 0,
    selectedStake: 10000,
    teamsInfo: [],
  });

  assert.deepEqual(normalized.players, ["Alex", "Sam"]);
  assert.equal(normalized.selectedGame, "coup");
});

test("self-service validation blocks coup rooms with more than six players", () => {
  const error = getSelfServiceValidationError({
    version: 1,
    selectedGame: "coup",
    players: ["A", "B", "C", "D", "E", "F", "G"],
    selectedRounds: 0,
    selectedStake: 10000,
    teamsInfo: [],
  });

  assert.equal(error, "This game allows at most 6 players.");
});

test("self-service validation blocks flip 7 rooms with fewer than three players", () => {
  const error = getSelfServiceValidationError({
    version: 1,
    selectedGame: "flip-7",
    players: ["A", "B"],
    selectedRounds: 0,
    selectedStake: 10000,
    teamsInfo: [],
  });

  assert.equal(error, "This game needs at least 3 players.");
});
