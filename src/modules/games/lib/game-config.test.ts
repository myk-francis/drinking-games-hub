import test from "node:test";
import assert from "node:assert/strict";

import {
  getGameMaxPlayers,
  getGameMinPlayers,
  isCreateRoomDisabled,
} from "./game-config";

test("coup uses a two-player minimum in the game config", () => {
  assert.equal(getGameMinPlayers("coup"), 2);
});

test("coup uses a six-player maximum in the game config", () => {
  assert.equal(getGameMaxPlayers("coup"), 6);
});

test("create room stays disabled for coup until enough players are added", () => {
  assert.equal(
    isCreateRoomDisabled({
      isCreatingRoom: false,
      selectedGame: "coup",
      playersCount: 1,
      teamsCount: 0,
    }),
    true,
  );

  assert.equal(
    isCreateRoomDisabled({
      isCreatingRoom: false,
      selectedGame: "coup",
      playersCount: 2,
      teamsCount: 0,
    }),
    false,
  );

  assert.equal(
    isCreateRoomDisabled({
      isCreatingRoom: false,
      selectedGame: "coup",
      playersCount: 7,
      teamsCount: 0,
    }),
    true,
  );
});
