import { prisma } from "@/lib/db";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";

const lobbyMessageInputSchema = z.object({
  roomId: z.string().min(1),
  playerId: z.string().min(1),
  playerName: z.string().min(1).max(50),
  content: z.string().trim().min(1).max(250),
});

export const lobbyRouter = createTRPCRouter({
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
