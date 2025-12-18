import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/db";

export const commentsRouter = createTRPCRouter({
  createComment: baseProcedure
    .input(
      z.object({
        playerId: z.string(),
        playerName: z.string(),
        playerRating: z.string(),
        roomId: z.string(),
        comment: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const commentsCount = await prisma.comment.count({
        where: {
          roomId: input.roomId,
        },
      });

      const playersCount = await prisma.player.count({
        where: {
          roomId: input.roomId,
        },
      });

      if (commentsCount >= playersCount) {
        return null;
      }
      const comment = await prisma.comment.create({
        data: {
          playerId: input.playerId,
          playerName: input.playerName,
          raiting: Number(input.playerRating),
          roomId: input.roomId,
          content: input.comment,
        },
      });
      return comment;
    }),

  getCommentsByRoomId: baseProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ input }) => {
      const comments = await prisma.comment.findMany({
        where: {
          roomId: input.roomId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return comments;
    }),
});
