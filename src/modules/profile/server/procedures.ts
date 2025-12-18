import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/db";

export const profileRouter = createTRPCRouter({
  /**
   * PROFILE SUMMARY (TOP STATS)
   */
  summary: baseProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const userId = input.userId;

      // Rooms created by user
      const rooms = await prisma.room.findMany({
        where: {
          userId: userId,
        },
        select: {
          id: true,
          players: {
            select: {
              id: true,
              drinks: true,
            },
          },
        },
      });

      const totalRooms = rooms.length;

      let totalPlayers = 0;
      let totalDrinks = 0;

      rooms.forEach((room) => {
        totalPlayers += room.players.length;

        room.players.forEach((player) => {
          totalDrinks += player.drinks ?? 0;
        });
      });

      return {
        totalRooms,
        totalPlayers,
        totalDrinks,
      };
    }),

  /**
   * ROOMS / GAMES CREATED BY USER
   */
  myRooms: baseProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const userId = input.userId;

      return await prisma.room.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          createdAt: true,
          gameEnded: true,
          rounds: true,
          game: {
            select: {
              id: true,
              name: true,
            },
          },
          players: {
            select: {
              id: true,
              drinks: true,
            },
          },
        },
      });
    }),

  summaryPerMonth: baseProcedure
    .input(
      z.object({
        userId: z.string(),
        month: z.string(),
      })
    )
    .query(async ({ input }) => {
      const userId = input.userId;
      const month = input.month;
      // Rooms created by user
      const rooms = await prisma.room.findMany({
        where: {
          userId: userId,
          createdAt: {
            gte: new Date(month),
            lt: new Date(
              new Date(month).setMonth(new Date(month).getMonth() + 1)
            ),
          },
        },
        select: {
          id: true,
          players: {
            select: {
              id: true,
              drinks: true,
            },
          },
        },
      });

      const totalRooms = rooms.length;

      let totalPlayers = 0;
      let totalDrinks = 0;

      rooms.forEach((room) => {
        totalPlayers += room.players.length;

        room.players.forEach((player) => {
          totalDrinks += player.drinks ?? 0;
        });
      });

      return {
        totalRooms,
        totalPlayers,
        totalDrinks,
      };
    }),

  /**
   * ROOMS / GAMES CREATED BY USER
   */
  myRoomsPerMonth: baseProcedure
    .input(
      z.object({
        userId: z.string(),
        month: z.string(),
      })
    )
    .query(async ({ input }) => {
      const userId = input.userId;
      const month = input.month;

      return await prisma.room.findMany({
        where: {
          userId: userId,
          createdAt: {
            gte: new Date(month),
            lt: new Date(
              new Date(month).setMonth(new Date(month).getMonth() + 1)
            ),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          createdAt: true,
          gameEnded: true,
          rounds: true,
          game: {
            select: {
              id: true,
              name: true,
            },
          },
          players: {
            select: {
              id: true,
              drinks: true,
            },
          },
        },
      });
    }),
});
