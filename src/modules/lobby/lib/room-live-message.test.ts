import assert from "node:assert/strict";
import test from "node:test";

import {
  encodeRoomGifMessage,
  parseRoomGifMessage,
} from "./room-live-message";

test("encodes and parses a room gif message payload", () => {
  const encoded = encodeRoomGifMessage({
    type: "gif",
    gifId: "abc123",
    gifUrl: "https://media.example.com/original.gif",
    gifMp4Url: "https://media.example.com/original.mp4",
    previewUrl: "https://media.example.com/preview.gif",
    title: "celebration",
  });

  assert.deepEqual(parseRoomGifMessage(encoded), {
    type: "gif",
    gifId: "abc123",
    gifUrl: "https://media.example.com/original.gif",
    gifMp4Url: "https://media.example.com/original.mp4",
    previewUrl: "https://media.example.com/preview.gif",
    title: "celebration",
  });
});

test("ignores plain text messages", () => {
  assert.equal(parseRoomGifMessage("hello there"), null);
});

test("rejects malformed gif payloads", () => {
  assert.equal(parseRoomGifMessage('__ROOM_GIF__:{"type":"gif"}'), null);
});
