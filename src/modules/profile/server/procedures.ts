import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/db";

interface TimeEntry {
  createdAt: string | Date;
  endedAt: string | Date;
}

function getMostFrequent(arr: string[]) {
  // Step 1: Create a frequency map (count each name)
  const counts = arr.reduce((acc: Record<string, number>, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  // Step 2: Find the key with the highest value
  return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
}

function formatDuration(ms: number): string {
  const totalSeconds: number = Math.floor(ms / 1000);
  const totalMinutes: number = Math.floor(totalSeconds / 60);
  const totalHours: number = Math.floor(totalMinutes / 60);

  const seconds: string = (totalSeconds % 60).toString().padStart(2, "0");
  const minutes: string = (totalMinutes % 60).toString().padStart(2, "0");
  const hours: string = totalHours.toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

const calculateTotalMs = (list: TimeEntry[]): number => {
  return list.reduce((acc: number, item: TimeEntry): number => {
    const start = new Date(item.createdAt).getTime();
    const end = new Date(item.endedAt).getTime();

    // Ensure we don't add NaN if dates are invalid
    const duration = !isNaN(start) && !isNaN(end) ? end - start : 0;
    return acc + duration;
  }, 0);
};

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
          createdAt: true,
          gameEndedAt: true,
          gameEnded: true,
          players: {
            select: {
              id: true,
              drinks: true,
            },
          },
          game: {
            select: {
              id: true,
              name: true,
            },
          },
          comments: {
            select: {
              id: true,
              raiting: true,
            },
          },
        },
      });

      const totalRooms = rooms.length;

      let totalPlayers = 0;
      let totalDrinks = 0;
      let totalGames = 0;
      let totalComments = 0;
      let totalRatings = 0;
      const mostPlayedGames: string[] = [];
      const listOfTimeEntries: TimeEntry[] = [];

      rooms.forEach((room) => {
        totalPlayers += room.players.length;

        room.players.forEach((player) => {
          totalDrinks += player.drinks ?? 0;
        });

        if (room.game) {
          if (!mostPlayedGames.includes(room.game.name)) {
            totalGames += 1;
          }
          mostPlayedGames.push(room.game.name);
        }

        if (room.gameEndedAt) {
          listOfTimeEntries.push({
            createdAt: new Date(room.createdAt),
            endedAt: new Date(room.gameEndedAt),
          });
        }

        totalComments += room.comments.length;

        room.comments.forEach((comment) => {
          totalRatings += comment.raiting;
        });
      });

      const totalDuration: number = calculateTotalMs(listOfTimeEntries);
      const formattedTime: string = formatDuration(totalDuration);

      return {
        totalRooms,
        totalPlayers,
        totalDrinks,
        totalGames,
        totalComments,
        totalRatings: totalRatings / totalComments || 0,
        mostPlayedGame: getMostFrequent(mostPlayedGames),
        totalDuration: formattedTime,
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
          comments: {
            select: {
              id: true,
              raiting: true,
            },
          },
        },
      });
    }),
});
