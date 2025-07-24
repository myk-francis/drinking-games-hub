import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { z } from "zod";

function generateUniqueCard(previousCards: number[]): number | null {
  const maxAttempts = 1000;
  const used = new Set(previousCards);

  for (let i = 0; i < maxAttempts; i++) {
    const num = Math.floor(Math.random() * 1000) + 1;
    if (!used.has(num)) {
      return num;
    }
  }

  // All numbers are used
  return null;
}

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
        let previousPlayersIds = room.previousPlayersIds || [];
        const playersWhoHaveNotPlayed = players.filter(
          (id) => ![...previousPlayersIds, input.currentPlayerId].includes(id)
        );

        if (playersWhoHaveNotPlayed.length > 0) {
          nextPlayerId = playersWhoHaveNotPlayed[0];
          previousPlayersIds = [...previousPlayersIds, input.currentPlayerId];
        } else {
          nextPlayerId = room.players[0].id;
          previousPlayersIds = [];
        }

        let nextQuestionId = null;

        const questions = room.game.questions.map((obj) => obj.id);
        let previousQuestionsIds = room.previousQuestionsId || [];
        const questionsWhichHaveNotPlayed = questions.filter(
          (id) =>
            ![...previousQuestionsIds, input.currentQuestionId].includes(id)
        );

        if (questionsWhichHaveNotPlayed?.length > 0) {
          nextQuestionId = questionsWhichHaveNotPlayed[0];
          previousQuestionsIds = [
            ...previousQuestionsIds,
            parseInt(input.currentQuestionId),
          ];
        } else {
          nextQuestionId = room.game.questions[0]?.id || null;
          previousQuestionsIds = [];
        }

        let data = {};

        if (input.gamecode === "truth-or-drink") {
          data = {
            currentPlayerId: nextPlayerId,
            previousPlayersIds: previousPlayersIds,
            currentQuestionId: nextQuestionId ?? null,
            previousQuestionsId: previousQuestionsIds,
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
        let previousQuestionsIds = room.previousQuestionsId || [];
        const questionsWhichHaveNotPlayed = questions.filter(
          (id) =>
            ![...previousQuestionsIds, input.currentQuestionId].includes(id)
        );

        if (questionsWhichHaveNotPlayed?.length > 0) {
          nextQuestionId = questionsWhichHaveNotPlayed[0];
          previousQuestionsIds = [
            ...previousQuestionsIds,
            parseInt(input.currentQuestionId),
          ];
        } else {
          nextQuestionId = room.game.questions[0]?.id || null;
          previousQuestionsIds = [];
        }

        let data = {};

        data = {
          currentQuestionId: nextQuestionId ?? null,
          previousQuestionsId: previousQuestionsIds,
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

  nextCard: baseProcedure
    .input(
      z.object({
        roomId: z.string(),
        currentPlayerId: z.string(),
        playersAns: z.string(),
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
        let playerPoints =
          room.players.find((player) => player.id === input.currentPlayerId)
            ?.points || 0;
        let playerDrinks =
          room.players.find((player) => player.id === input.currentPlayerId)
            ?.drinks || 0;

        const players = room.players.map((obj) => obj.id);
        let previousPlayersIds = room.previousPlayersIds || [];
        const playersWhoHaveNotPlayed = players.filter(
          (id) => ![...previousPlayersIds, input.currentPlayerId].includes(id)
        );

        if (playersWhoHaveNotPlayed.length > 0) {
          nextPlayerId = playersWhoHaveNotPlayed[0];
          previousPlayersIds = [...previousPlayersIds, input.currentPlayerId];
        } else {
          nextPlayerId = room.players[0].id;
          previousPlayersIds = [];
        }

        const previousCards = room.previousCards || [];
        const currentCard = generateUniqueCard(previousCards);

        if (currentCard !== null) {
          previousCards.push(currentCard); // if you want to keep track
        }

        if (
          (input.playersAns === "UP" &&
            (currentCard || 0) > (room.lastCard || 0)) ||
          (input.playersAns === "DOWN" &&
            (currentCard || 0) < (room.lastCard || 0))
        ) {
          playerPoints += 1;
        } else {
          playerDrinks += 1;
        }

        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: {
            currentPlayerId: nextPlayerId,
            currentCard: currentCard,
            lastCard: currentCard,
            previousCards: previousCards,
            previousPlayersIds: previousPlayersIds,
            players: {
              update: {
                where: {
                  id: input.currentPlayerId,
                },
                data: {
                  points: playerPoints,
                  drinks: playerDrinks,
                },
              },
            },
          },
        });

        return updatedRoom;
      } catch (error) {
        console.error("Failed to generate card:", error);
        throw new Error("Failed to generate card");
      }
    }),
  votePlayer: baseProcedure
    .input(
      z.object({
        gamecode: z.string(),
        roomId: z.string(),
        currentPlayerId: z.string(),
        votedPlayer: z.string(),
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
        let previousPlayersIds = room.previousPlayersIds || [];
        const playersWhoHaveNotPlayed = players.filter(
          (id) => ![...previousPlayersIds, input.currentPlayerId].includes(id)
        );

        if (playersWhoHaveNotPlayed.length > 0) {
          nextPlayerId = playersWhoHaveNotPlayed[0];
          previousPlayersIds = [...previousPlayersIds, input.currentPlayerId];
        } else {
          nextPlayerId = room.players[0].id;
          previousPlayersIds = [];
        }

        const votedPoints =
          room.players.find((player) => player.id === input.votedPlayer)
            ?.points || 0;

        let data = {};

        data = {
          currentPlayerId: nextPlayerId,
          previousPlayersIds: previousPlayersIds,
          players: {
            update: {
              where: {
                id: input.votedPlayer,
              },
              data: {
                points: votedPoints + 1, // Increment the voted player's points
              },
            },
          },
        };

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
  nextRound: baseProcedure
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
        let previousQuestionsIds = room.previousQuestionsId || [];
        const questionsWhichHaveNotPlayed = questions.filter(
          (id) =>
            ![...previousQuestionsIds, input.currentQuestionId].includes(id)
        );

        if (questionsWhichHaveNotPlayed?.length > 0) {
          nextQuestionId = questionsWhichHaveNotPlayed[0];
          previousQuestionsIds = [
            ...previousQuestionsIds,
            parseInt(input.currentQuestionId),
          ];
        } else {
          nextQuestionId = room.game.questions[0]?.id || null;
          previousQuestionsIds = [];
        }

        await prisma.player.updateMany({
          where: {
            roomId: input.roomId,
          },
          data: {
            points: 0, // Reset points for all players
            drinks: 0, // Reset drinks for all players
          },
        });

        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: {
            currentQuestionId: nextQuestionId ?? null,
            previousQuestionsId: previousQuestionsIds,
          },
        });

        return updatedRoom;
      } catch (error) {
        console.error("Failed to update question:", error);
        throw new Error("Failed to update question");
      }
    }),
});
