import { prisma } from "@/lib/db";
import {
  encodeRoomGifMessage,
  LIVE_ROOM_SEND_COOLDOWN_MS,
} from "@/modules/lobby/lib/room-live-message";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";

const lobbyMessageInputSchema = z.object({
  roomId: z.string().min(1),
  playerId: z.string().min(1),
  playerName: z.string().min(1).max(50),
  content: z.string().trim().min(1).max(250),
});

const roomGifInputSchema = z.object({
  roomId: z.string().min(1),
  playerId: z.string().min(1),
  gifId: z.string().trim().min(1).max(100),
  gifUrl: z.string().url(),
  gifMp4Url: z.string().url().optional(),
  previewUrl: z.string().url().optional(),
  title: z.string().trim().max(120).optional(),
});

const gifSearchInputSchema = z.object({
  query: z.string().trim().min(2).max(50),
});

const KLIPY_API_BASE_URL = "https://api.klipy.com/api/v1";
const KLIPY_API_KEY = process.env.KLIPY_API_KEY;

function getKlipyApiKey() {
  if (!KLIPY_API_KEY) {
    throw new Error("GIF search is not configured right now.");
  }

  return KLIPY_API_KEY;
}

function getGifSearchErrorMessage(status: number) {
  if (status === 429) {
    return "GIF search is temporarily busy. Please try again in a moment.";
  }

  if (status === 401 || status === 403) {
    return "GIF search is temporarily unavailable right now.";
  }

  if (status >= 500) {
    return "GIF search is temporarily unreachable. Please try again shortly.";
  }

  return "Could not search GIFs right now.";
}

async function assertSharedSendCooldown(args: {
  roomId: string;
  playerId: string;
}) {
  const [lastReaction, lastGifMessage] = await Promise.all([
    prisma.reaction.findFirst({
      where: {
        roomId: args.roomId,
        senderPlayerId: args.playerId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    }),
    prisma.lobbyMessage.findFirst({
      where: {
        roomId: args.roomId,
        playerId: args.playerId,
        content: {
          startsWith: "__ROOM_GIF__:",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    }),
  ]);

  const lastSentAt = Math.max(
    lastReaction?.createdAt.getTime() ?? 0,
    lastGifMessage?.createdAt.getTime() ?? 0,
  );

  if (lastSentAt === 0) {
    return;
  }

  const elapsedMs = Date.now() - lastSentAt;
  if (elapsedMs >= LIVE_ROOM_SEND_COOLDOWN_MS) {
    return;
  }

  const remainingSeconds = Math.ceil(
    (LIVE_ROOM_SEND_COOLDOWN_MS - elapsedMs) / 1000,
  );
  throw new Error(`You can send again in ${remainingSeconds}s.`);
}

export const lobbyRouter = createTRPCRouter({
  searchGifs: baseProcedure
    .input(gifSearchInputSchema)
    .query(async ({ input }) => {
      try {
        const apiKey = getKlipyApiKey();
        const params = new URLSearchParams({
          q: input.query,
          per_page: "12",
          page: "1",
          rating: "pg-13",
          locale: "en_US",
        });

        const response = await fetch(
          `${KLIPY_API_BASE_URL}/${encodeURIComponent(apiKey)}/gifs/search?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(getGifSearchErrorMessage(response.status));
        }

        const data = (await response.json()) as {
          result?: boolean;
          data?: {
            data?: Array<{
              id?: number;
              slug?: string;
              title?: string;
              file?: {
                hd?: {
                  gif?: {
                    url?: string;
                    width?: number;
                    height?: number;
                  };
                  jpg?: {
                    url?: string;
                  };
                  mp4?: {
                    url?: string;
                  };
                };
                md?: {
                  gif?: {
                    url?: string;
                    width?: number;
                    height?: number;
                  };
                  jpg?: {
                    url?: string;
                  };
                  mp4?: {
                    url?: string;
                  };
                };
                sm?: {
                  gif?: {
                    url?: string;
                    width?: number;
                    height?: number;
                  };
                  jpg?: {
                    url?: string;
                  };
                  mp4?: {
                    url?: string;
                  };
                };
              };
            }>;
          };
        };

        return (data.data?.data ?? [])
          .map((gif) => {
            const preview = gif.file?.sm ?? gif.file?.md ?? gif.file?.hd;
            const original = gif.file?.hd ?? gif.file?.md ?? gif.file?.sm;
            const previewUrl = preview?.gif?.url ?? preview?.jpg?.url;
            const sendUrl = original?.gif?.url ?? preview?.gif?.url;

            if (!gif.id || !previewUrl || !sendUrl) {
              return null;
            }

            return {
              id: String(gif.id),
              title: gif.title?.trim() || "GIF",
              sourceUrl: gif.slug ? `https://klipy.com/gifs/${gif.slug}` : sendUrl,
              previewUrl,
              previewMp4Url: preview?.mp4?.url ?? null,
              sendUrl,
              sendMp4Url: original?.mp4?.url ?? preview?.mp4?.url ?? null,
              width: Number(preview?.gif?.width ?? 0),
              height: Number(preview?.gif?.height ?? 0),
            };
          })
          .filter((gif): gif is NonNullable<typeof gif> => gif !== null);
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }

        throw new Error(
          "GIF search is temporarily unreachable. Please try again shortly.",
        );
      }
    }),
  sendLobbyMessage: baseProcedure
    .input(lobbyMessageInputSchema)
    .mutation(async ({ input }) => {
      const room = await prisma.room.findUnique({
        where: { id: input.roomId },
        select: {
          id: true,
          gameEnded: true,
          status: true,
          players: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!room) {
        throw new Error("Room not found.");
      }

      if (room.gameEnded || room.status !== "LOBBY") {
        throw new Error("Lobby chat is only available before the game starts.");
      }

      const player = room.players.find((entry) => entry.id === input.playerId);
      if (!player) {
        throw new Error("Player not found in this room.");
      }

      return prisma.lobbyMessage.create({
        data: {
          roomId: input.roomId,
          playerId: input.playerId,
          playerName: player.name,
          content: input.content,
        },
      });
    }),

  sendRoomGif: baseProcedure
    .input(roomGifInputSchema)
    .mutation(async ({ input }) => {
      const room = await prisma.room.findUnique({
        where: { id: input.roomId },
        select: {
          id: true,
          gameEnded: true,
          players: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!room) {
        throw new Error("Room not found.");
      }

      if (room.gameEnded) {
        throw new Error("GIFs are only available while a game is active.");
      }

      const player = room.players.find((entry) => entry.id === input.playerId);
      if (!player) {
        throw new Error("Player not found in this room.");
      }

      await assertSharedSendCooldown({
        roomId: input.roomId,
        playerId: input.playerId,
      });

      return prisma.lobbyMessage.create({
        data: {
          roomId: input.roomId,
          playerId: input.playerId,
          playerName: player.name,
          content: encodeRoomGifMessage({
            type: "gif",
            gifId: input.gifId,
            gifUrl: input.gifUrl,
            gifMp4Url: input.gifMp4Url ?? null,
            previewUrl: input.previewUrl ?? null,
            title: input.title ?? null,
          }),
        },
      });
    }),

  getLobbyMessagesByRoomId: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      return prisma.lobbyMessage.findMany({
        where: {
          roomId: input.roomId,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 100,
      });
    }),
});
