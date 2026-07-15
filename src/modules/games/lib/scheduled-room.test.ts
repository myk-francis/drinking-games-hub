import assert from "node:assert/strict";
import test from "node:test";

import { getScheduledRoomState } from "./scheduled-room";

test("immediate rooms are live and playable", () => {
  const state = getScheduledRoomState({
    status: "LIVE",
    scheduledStartAt: null,
    gameEnded: false,
    now: new Date("2026-07-15T10:00:00.000Z"),
  });

  assert.deepEqual(state, {
    status: "LIVE",
    isScheduled: false,
    isPlayable: true,
    shouldAutoActivate: false,
    secondsUntilStart: null,
  });
});

test("scheduled rooms stay in the lobby before start time", () => {
  const state = getScheduledRoomState({
    status: "LOBBY",
    scheduledStartAt: new Date("2026-07-15T10:10:00.000Z"),
    gameEnded: false,
    now: new Date("2026-07-15T10:00:01.000Z"),
  });

  assert.equal(state.status, "LOBBY");
  assert.equal(state.isPlayable, false);
  assert.equal(state.shouldAutoActivate, false);
  assert.equal(state.secondsUntilStart, 599);
});

test("scheduled rooms auto-activate once the start time passes", () => {
  const state = getScheduledRoomState({
    status: "LOBBY",
    scheduledStartAt: new Date("2026-07-15T10:05:00.000Z"),
    gameEnded: false,
    now: new Date("2026-07-15T10:05:00.000Z"),
  });

  assert.equal(state.status, "LIVE");
  assert.equal(state.isPlayable, true);
  assert.equal(state.shouldAutoActivate, true);
  assert.equal(state.secondsUntilStart, 0);
});

test("ended rooms stay ended even if they were scheduled", () => {
  const state = getScheduledRoomState({
    status: "LIVE",
    scheduledStartAt: new Date("2026-07-15T10:05:00.000Z"),
    gameEnded: true,
    now: new Date("2026-07-15T10:06:00.000Z"),
  });

  assert.equal(state.status, "ENDED");
  assert.equal(state.isPlayable, false);
  assert.equal(state.shouldAutoActivate, false);
});
