export const ROOM_GIF_MESSAGE_PREFIX = "__ROOM_GIF__:";
export const LIVE_ROOM_SEND_COOLDOWN_MS = 10 * 60 * 1000;

export type RoomGifMessagePayload = {
  type: "gif";
  gifId: string;
  gifUrl: string;
  gifMp4Url?: string | null;
  previewUrl?: string | null;
  title?: string | null;
};

export type ParsedRoomGifMessage = RoomGifMessagePayload & {
  type: "gif";
};

export function encodeRoomGifMessage(payload: RoomGifMessagePayload): string {
  return `${ROOM_GIF_MESSAGE_PREFIX}${JSON.stringify(payload)}`;
}

export function parseRoomGifMessage(
  content: string | null | undefined,
): ParsedRoomGifMessage | null {
  if (!content?.startsWith(ROOM_GIF_MESSAGE_PREFIX)) {
    return null;
  }

  try {
    const parsed = JSON.parse(content.slice(ROOM_GIF_MESSAGE_PREFIX.length)) as
      | Partial<RoomGifMessagePayload>
      | null;

    if (
      !parsed ||
      parsed.type !== "gif" ||
      typeof parsed.gifId !== "string" ||
      parsed.gifId.trim() === "" ||
      typeof parsed.gifUrl !== "string" ||
      parsed.gifUrl.trim() === ""
    ) {
      return null;
    }

    return {
      type: "gif",
      gifId: parsed.gifId,
      gifUrl: parsed.gifUrl,
      gifMp4Url:
        typeof parsed.gifMp4Url === "string" && parsed.gifMp4Url.trim() !== ""
          ? parsed.gifMp4Url
          : null,
      previewUrl:
        typeof parsed.previewUrl === "string" && parsed.previewUrl.trim() !== ""
          ? parsed.previewUrl
          : null,
      title:
        typeof parsed.title === "string" && parsed.title.trim() !== ""
          ? parsed.title
          : null,
    };
  } catch {
    return null;
  }
}
