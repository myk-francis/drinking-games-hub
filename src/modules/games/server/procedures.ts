import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const gamesRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => {
    const games = await prisma.game.findMany({
      orderBy: {
        updatedAt: "asc",
      },
      include: {
        questions: false, // Include questions if needed
      },
    });

    return games;
  }),
  getRoomById: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1, { message: " Room ID is required" }),
      })
    )
    .query(async ({ input }) => {
      const room = await prisma.room.findUnique({
        where: {
          id: input.roomId,
        },
        include: {
          players: true, // Include players in the room
          game: {
            include: {
              questions: true, // Include questions if needed
            },
          },
        },
      });

      return room;
    }),
  createRoom: baseProcedure
    .input(
      z.object({
        selectedGame: z.string().min(1, { message: " Game is required" }),
        players: z.array(z.string()).min(2).max(10),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const game = await prisma.game.findFirst({
          where: {
            code: input.selectedGame,
          },
        });

        if (!game) {
          throw new Error("Game not found");
        }

        const players = input.players.map((name) => ({
          name,
          points: 0,
          drinks: 0,
        }));

        const createdRoom = await prisma.room.create({
          data: {
            gameId: game.id,
            players: {
              create: players,
            },
          },
          include: {
            players: true,
            game: {
              include: {
                questions: true, // Include questions if needed
              },
            },
          },
        });

        const createdRoomId = createdRoom.id;
        await prisma.room.update({
          where: { id: createdRoomId },
          data: {
            currentPlayerId: createdRoom.players[0].id,
            previousPlayersIds: [],
            currentQuestionId: createdRoom.game.questions[0]?.id || null,
            previousQuestionsId: [],
          },
        });

        return createdRoom;
      } catch (error) {
        console.error("Failed to create room:", error);
        throw new Error("Failed to create room");
      }
    }),
  endGame: baseProcedure
    .input(
      z.object({
        roomId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: {
            gameEnded: true,
          },
        });

        return updatedRoom;
      } catch (error) {
        console.error("Failed to end room:", error);
        throw new Error("Failed to end room");
      }
    }),
  addPlayerStats: baseProcedure
    .input(
      z.object({
        gamecode: z.string(),
        roomId: z.string(),
        points: z.string(),
        drinks: z.string(),
        currentPlayerId: z.string(),
        currentQuestionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const room = await prisma.room.findFirst({
          where: {
            id: input.roomId,
          },
          include: {
            players: true,
            game: {
              include: {
                questions: true, // Include questions if needed
              },
            },
          },
        });

        if (!room) {
          throw new Error("Room not found");
        }

        let nextPlayerId = "";

        const players = room.players.map((obj) => obj.id);
        const previousPlayersIds = room.previousPlayersIds || [];
        let playersWhoHaveNotPlayed = players.filter(
          (id) => ![...previousPlayersIds, input.currentPlayerId].includes(id)
        );

        if (playersWhoHaveNotPlayed.length > 0) {
          nextPlayerId = playersWhoHaveNotPlayed[0];
        } else {
          nextPlayerId = room.players[0].id;
          playersWhoHaveNotPlayed = [];
        }

        let nextQuestionId = null;

        const questions = room.game.questions.map((obj) => obj.id);
        const previousQuestionsIds = room.previousQuestionsId || [];
        let questionsWhichHaveNotPlayed = questions.filter(
          (id) =>
            ![...previousQuestionsIds, input.currentQuestionId].includes(id)
        );

        if (questionsWhichHaveNotPlayed?.length > 0) {
          nextQuestionId = questionsWhichHaveNotPlayed[0];
        } else {
          nextQuestionId = room.game.questions[0]?.id || null;
          questionsWhichHaveNotPlayed = [];
        }

        let data = {};

        if (input.gamecode === "truth-or-drink") {
          data = {
            currentPlayerId: nextPlayerId,
            previousPlayersIds: [...previousPlayersIds, input.currentPlayerId],
            currentQuestionId: nextQuestionId ?? null,
            previousQuestionsId: [
              ...previousQuestionsIds,
              parseInt(input.currentQuestionId),
            ],
            players: {
              update: {
                where: {
                  id: input.currentPlayerId,
                },
                data: {
                  points: parseInt(input.points),
                  drinks: parseInt(input.drinks),
                },
              },
            },
          };
        } else {
          data = {
            players: {
              update: {
                where: {
                  id: input.currentPlayerId,
                },
                data: {
                  points: parseInt(input.points),
                  drinks: parseInt(input.drinks),
                },
              },
            },
          };
        }

        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: data,
        });

        return updatedRoom;
      } catch (error) {
        console.error("Failed to update room:", error);
        throw new Error("Failed to update room");
      }
    }),
  nextQuestion: baseProcedure
    .input(
      z.object({
        gamecode: z.string(),
        roomId: z.string(),
        currentQuestionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const room = await prisma.room.findFirst({
          where: {
            id: input.roomId,
          },
          include: {
            players: true,
            game: {
              include: {
                questions: true, // Include questions if needed
              },
            },
          },
        });

        if (!room) {
          throw new Error("Room not found");
        }

        let nextQuestionId = null;

        const questions = room.game.questions.map((obj) => obj.id);
        const previousQuestionsIds = room.previousQuestionsId || [];
        let questionsWhichHaveNotPlayed = questions.filter(
          (id) =>
            ![...previousQuestionsIds, input.currentQuestionId].includes(id)
        );

        if (questionsWhichHaveNotPlayed?.length > 0) {
          nextQuestionId = questionsWhichHaveNotPlayed[0];
        } else {
          nextQuestionId = room.game.questions[0]?.id || null;
          questionsWhichHaveNotPlayed = [];
        }

        let data = {};

        data = {
          currentQuestionId: nextQuestionId ?? null,
          previousQuestionsId: [
            ...previousQuestionsIds,
            parseInt(input.currentQuestionId),
          ],
        };

        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: data,
        });

        return updatedRoom;
      } catch (error) {
        console.error("Failed to update question:", error);
        throw new Error("Failed to update question");
      }
    }),
});
