import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { cookies } from "next/headers";

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

const teamInfoSchema = z.object({
  teamName: z.string().min(1, { message: "Team name is required" }),
  players: z
    .array(z.string())
    .min(1, { message: "At least 1 players are required" })
    .max(10, { message: "Maximum 10 players are allowed" }),
});

export const gamesRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => {
    const games = await prisma.game.findMany({
      where: {
        published: false, // Only fetch published games
      },
      orderBy: {
        updatedAt: "asc",
      },
      include: {
        questions: false, // Include questions if needed
      },
    });

    return games;
  }),
  getRounds: baseProcedure.query(async () => {
    const rounds = await prisma.parms.findMany({
      where: {
        type: "ROUNDS",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return rounds.map((round) => ({
      id: round.id,
      name: round.name,
      value: round.value,
    }));
  }),
  getEditions: baseProcedure.query(async () => {
    const editions = await prisma.parms.findMany({
      where: {
        type: "EDITIONS",
      },
      orderBy: {
        id: "asc",
      },
    });

    return editions.map((round) => ({
      id: round.id,
      name: round.name,
      value: round.value,
    }));
  }),
  getRoomById: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1, { message: " Room ID is required" }),
      }),
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
        players: z.array(z.string()).optional(),
        userId: z.string(),
        selectedRounds: z.number(),
        teamsInfo: z.array(teamInfoSchema).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const sessionId = (await cookies()).get("sessionId")?.value;
        if (!sessionId) return null;

        const session = await prisma.session.findUnique({
          where: { id: sessionId },
          include: { user: true },
        });

        if (!session?.user) return null;

        const transaction = await prisma.transaction.findFirst({
          where: {
            userId: session.user.id,
          },
          orderBy: {
            createdAt: "desc", // Sorts by newest first
          },
        });

        if (
          !transaction ||
          (transaction.assignedRooms <= transaction.usedRooms &&
            (transaction.profileType === "GUEST" ||
              transaction.profileType === "PREMIUM"))
        ) {
          throw new Error("No available rooms. Please purchase more rooms.");
        }

        if (
          transaction.profileType === "GUEST" ||
          transaction.profileType === "PREMIUM"
        ) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              usedRooms: transaction.usedRooms + 1,
            },
          });
        }

        const game = await prisma.game.findFirst({
          where: {
            code: input.selectedGame,
          },
        });

        if (!game) {
          throw new Error("Game not found");
        }

        if (input.selectedGame === "triviyay") {
          if (!input.teamsInfo || input.teamsInfo.length < 1) {
            throw new Error("Please add at least one team with players.");
          }
          const players = input.teamsInfo.flatMap((teamInfo) =>
            teamInfo.players.map((name) => ({
              name,
              points: 0,
              drinks: 0,
              team: teamInfo.teamName,
            })),
          );

          const teams = input.teamsInfo.map((team) => team.teamName);

          const createdRoom = await prisma.room.create({
            data: {
              gameId: game.id,
              rounds: input.selectedRounds,
              currentRound: input.selectedRounds > 0 ? 1 : 0,
              userId: input.userId, // Assuming a default user ID for now
              playingTeams: teams,
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

          let currentQuestionId = null;

          currentQuestionId =
            createdRoom.game.questions[
              Math.floor(Math.random() * createdRoom.game.questions.length)
            ]?.id || null;

          const createdRoomId = createdRoom.id;
          await prisma.room.update({
            where: { id: createdRoomId },
            data: {
              currentPlayerId:
                teams[Math.floor(Math.random() * teams.length)]?.toString() ||
                "",
              previousPlayersIds: [],
              currentQuestionId: currentQuestionId,
              previousQuestionsId: [],
              allPairIds: [],
              previousPairIds: [],
              previousPlayedTeams: [],
              playerOneId: "",
              playerTwoId: "",
              questionAVotes: [],
              questionBVotes: [],
              currentAnswer: null,
            },
          });

          return createdRoom;
        } else {
          const players =
            input?.players?.map((name) => ({
              name,
              points: 0,
              drinks: 0,
            })) || [];

          const createdRoom = await prisma.room.create({
            data: {
              gameId: game.id,
              rounds: input.selectedRounds,
              currentRound: input.selectedRounds > 0 ? 1 : 0,
              userId: input.userId, // Assuming a default user ID for now
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

          const allPairs = [];
          const createdRoomPlayers = createdRoom.players;
          const previousPairIds = [];
          let playerOneId = "";
          let playerTwoId = "";
          if (input.selectedGame === "verbal-charades") {
            for (let i = 0; i < createdRoom.players.length; i++) {
              for (let j = i + 1; j < createdRoom.players.length; j++) {
                const pairKey = [
                  createdRoomPlayers[i].id,
                  createdRoomPlayers[j].id,
                ].join("&");
                const opositePairKey = [
                  createdRoomPlayers[j].id,
                  createdRoomPlayers[i].id,
                ].join("&");
                allPairs.push(pairKey);
                allPairs.push(opositePairKey);
              }
            }
          }

          if (allPairs.length > 0) {
            const randomPairIndex = Math.floor(Math.random() * allPairs.length);
            const randomPair = allPairs[randomPairIndex];
            previousPairIds.push(randomPair);
            const [playerOne, playerTwo] = randomPair.split("&");
            playerOneId = playerOne;
            playerTwoId = playerTwo;
          }

          let currentQuestionId = null;

          if (input.selectedGame === "truth-or-drink") {
            currentQuestionId =
              createdRoom.game.questions.filter(
                (q) => q.edition === createdRoom.rounds,
              )[
                Math.floor(
                  Math.random() *
                    createdRoom.game.questions.filter(
                      (q) => q.edition === createdRoom.rounds,
                    ).length,
                )
              ]?.id || null;
          } else {
            currentQuestionId =
              createdRoom.game.questions[
                Math.floor(Math.random() * createdRoom.game.questions.length)
              ]?.id || null;
          }

          const createdRoomId = createdRoom.id;
          await prisma.room.update({
            where: { id: createdRoomId },
            data: {
              currentPlayerId:
                createdRoom.players[
                  Math.floor(Math.random() * createdRoom.players.length)
                ]?.id,
              previousPlayersIds: [],
              currentQuestionId: currentQuestionId,
              previousQuestionsId: [],
              allPairIds: allPairs,
              previousPairIds: previousPairIds,
              playerOneId: playerOneId || "",
              playerTwoId: playerTwoId || "",
              questionAVotes: [],
              questionBVotes: [],
              currentAnswer: null,
            },
          });

          return createdRoom;
        }
      } catch (error) {
        console.error("Failed to create room:", error);
        throw new Error("Failed to create room");
      }
    }),
  endGame: baseProcedure
    .input(
      z.object({
        roomId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: {
            gameEnded: true,
            gameEndedAt: new Date(),
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
      }),
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
          (id) => ![...previousPlayersIds, input.currentPlayerId].includes(id),
        );

        if (players.length === 2) {
          previousPlayersIds = [];
          previousPlayersIds.push(input.currentPlayerId);
          nextPlayerId = players.filter(
            (id) => !previousPlayersIds.includes(id),
          )[0];
        } else {
          if (playersWhoHaveNotPlayed.length > 0) {
            nextPlayerId = playersWhoHaveNotPlayed[0];
            previousPlayersIds = [...previousPlayersIds, input.currentPlayerId];
          } else {
            const availablePlayers = players.filter(
              (id) => id !== input.currentPlayerId,
            );
            nextPlayerId =
              availablePlayers[
                Math.floor(Math.random() * availablePlayers.length)
              ];
            previousPlayersIds = [];
          }
        }

        let nextQuestionId = null;

        const questions = room.game.questions.map((obj) => obj.id);
        const questionsForTruthOrDrink = room.game.questions
          .filter((q) => q.edition === room.rounds)
          .map((obj) => obj.id);
        let previousQuestionsIds = room.previousQuestionsId || [];
        const questionsWhichHaveNotPlayed = questions.filter(
          (id) =>
            ![...previousQuestionsIds, input.currentQuestionId].includes(id),
        );
        const questionsWhichHaveNotPlayedForTruthOrDrink =
          questionsForTruthOrDrink.filter(
            (id) =>
              ![...previousQuestionsIds, input.currentQuestionId].includes(id),
          );

        if (input.gamecode === "truth-or-drink") {
          if (questionsWhichHaveNotPlayedForTruthOrDrink?.length > 0) {
            nextQuestionId =
              questionsWhichHaveNotPlayedForTruthOrDrink[
                Math.floor(
                  Math.random() *
                    questionsWhichHaveNotPlayedForTruthOrDrink.length,
                )
              ];
            previousQuestionsIds = [
              ...previousQuestionsIds,
              parseInt(input.currentQuestionId),
            ];
          } else {
            nextQuestionId =
              room.game.questions.filter((q) => q.edition === room.rounds)[
                Math.floor(
                  Math.random() *
                    room.game.questions.filter((q) => q.edition === room.rounds)
                      .length,
                )
              ]?.id || null;
            previousQuestionsIds = [];
          }
        } else {
          if (questionsWhichHaveNotPlayed?.length > 0) {
            nextQuestionId =
              questionsWhichHaveNotPlayed[
                Math.floor(Math.random() * questionsWhichHaveNotPlayed.length)
              ];
            previousQuestionsIds = [
              ...previousQuestionsIds,
              parseInt(input.currentQuestionId),
            ];
          } else {
            nextQuestionId =
              room.game.questions[
                Math.floor(Math.random() * room.game.questions.length)
              ]?.id || null;
            previousQuestionsIds = [];
          }
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
      }),
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
            ![...previousQuestionsIds, input.currentQuestionId].includes(id),
        );

        if (questionsWhichHaveNotPlayed?.length > 0) {
          nextQuestionId =
            questionsWhichHaveNotPlayed[
              Math.floor(Math.random() * questionsWhichHaveNotPlayed.length)
            ];
          previousQuestionsIds = [
            ...previousQuestionsIds,
            parseInt(input.currentQuestionId),
          ];
        } else {
          nextQuestionId =
            room.game.questions[
              Math.floor(Math.random() * room.game.questions.length)
            ]?.id || null;
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
        card: z.number().optional(),
      }),
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
          (id) => ![...previousPlayersIds, input.currentPlayerId].includes(id),
        );

        if (players.length === 2) {
          previousPlayersIds = [];
          previousPlayersIds.push(input.currentPlayerId);
          nextPlayerId = players.filter(
            (id) => !previousPlayersIds.includes(id),
          )[0];
        } else {
          if (playersWhoHaveNotPlayed.length > 0) {
            nextPlayerId = playersWhoHaveNotPlayed[0];
            previousPlayersIds = [...previousPlayersIds, input.currentPlayerId];
          } else {
            const availablePlayers = players.filter(
              (id) => id !== input.currentPlayerId,
            );
            nextPlayerId =
              availablePlayers[
                Math.floor(Math.random() * availablePlayers.length)
              ];
            previousPlayersIds = [];
          }
        }

        const previousCards = room.previousCards || [];
        let correctPrediction = false;
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
          correctPrediction = true;
        } else {
          playerDrinks += 1;
        }

        let currentRound = room.currentRound || 0;

        if (room.rounds !== 0) {
          currentRound += 1;
        }

        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: {
            currentPlayerId: nextPlayerId,
            currentCard: currentCard,
            lastCard: currentCard,
            lastPlayerId: input.currentPlayerId,
            previousCards: previousCards,
            previousPlayersIds: previousPlayersIds,
            correctPrediction: correctPrediction,
            currentRound: currentRound,
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

        if (room.rounds !== 0 && currentRound > room.rounds) {
          const updatedRoom = await prisma.room.update({
            where: { id: input.roomId },
            data: {
              gameEnded: true,
            },
          });

          return updatedRoom;
        }

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
      }),
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
          (id) => ![...previousPlayersIds, input.currentPlayerId].includes(id),
        );

        if (players.length === 2) {
          previousPlayersIds = [];
          previousPlayersIds.push(input.currentPlayerId);
          nextPlayerId = players.filter(
            (id) => !previousPlayersIds.includes(id),
          )[0];
        } else {
          if (playersWhoHaveNotPlayed.length > 0) {
            nextPlayerId = playersWhoHaveNotPlayed[0];
            previousPlayersIds = [...previousPlayersIds, input.currentPlayerId];
          } else {
            const availablePlayers = players.filter(
              (id) => id !== input.currentPlayerId,
            );
            nextPlayerId =
              availablePlayers[
                Math.floor(Math.random() * availablePlayers.length)
              ];
            previousPlayersIds = [];
          }
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
      }),
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
            ![...previousQuestionsIds, input.currentQuestionId].includes(id),
        );

        if (questionsWhichHaveNotPlayed?.length > 0) {
          nextQuestionId =
            questionsWhichHaveNotPlayed[
              Math.floor(Math.random() * questionsWhichHaveNotPlayed.length)
            ];
          previousQuestionsIds = [
            ...previousQuestionsIds,
            parseInt(input.currentQuestionId),
          ];
        } else {
          nextQuestionId =
            room.game.questions[
              Math.floor(Math.random() * room.game.questions.length)
            ]?.id || null;
          previousQuestionsIds = [];
        }

        if (input.gamecode !== "pick-a-card") {
          await prisma.player.updateMany({
            where: {
              roomId: input.roomId,
            },
            data: {
              points: 0, // Reset points for all players
              drinks: 0, // Reset drinks for all players
            },
          });
        }

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

  nextCharadeCard: baseProcedure
    .input(
      z.object({
        roomId: z.string(),
        result: z.string(),
        playerOneId: z.string(),
        playerTwoId: z.string(),
        currentQuestionId: z.string(),
      }),
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
            ![...previousQuestionsIds, input.currentQuestionId].includes(id),
        );

        if (questionsWhichHaveNotPlayed?.length > 0) {
          nextQuestionId =
            questionsWhichHaveNotPlayed[
              Math.floor(Math.random() * questionsWhichHaveNotPlayed.length)
            ];
          previousQuestionsIds = [
            ...previousQuestionsIds,
            parseInt(input.currentQuestionId),
          ];
        } else {
          nextQuestionId =
            room.game.questions[
              Math.floor(Math.random() * room.game.questions.length)
            ]?.id || null;
          previousQuestionsIds = [];
        }

        const unusedPairs = room.allPairIds.filter(
          (pair) => !room.previousPairIds.includes(pair),
        );
        if (unusedPairs.length > 0) {
          const randomPairIndex = Math.floor(
            Math.random() * unusedPairs.length,
          );
          const randomPair = unusedPairs[randomPairIndex];
          const [playerOneId, playerTwoId] = randomPair.split("&");

          await prisma.room.update({
            where: { id: input.roomId },
            data: {
              currentQuestionId: nextQuestionId ?? null,
              previousQuestionsId: previousQuestionsIds,
              playerOneId: playerOneId,
              playerTwoId: playerTwoId,
              previousPairIds: [...room.previousPairIds, randomPair],
            },
          });
        } else {
          const randomPairIndex = Math.floor(
            Math.random() * room.allPairIds.length,
          );
          const randomPair = room.allPairIds[randomPairIndex];
          const [playerOne, playerTwo] = randomPair.split("&");
          await prisma.room.update({
            where: { id: input.roomId },
            data: {
              currentQuestionId: nextQuestionId ?? null,
              previousQuestionsId: previousQuestionsIds,
              playerOneId: playerOne,
              playerTwoId: playerTwo,
              previousPairIds: [randomPair],
            },
          });
        }

        const playerOnePoints =
          room.players.find((player) => player.id === input.playerOneId)
            ?.points || 0;
        const playerOneDrinks =
          room.players.find((player) => player.id === input.playerOneId)
            ?.drinks || 0;
        const playerTwoPoints =
          room.players.find((player) => player.id === input.playerTwoId)
            ?.points || 0;
        const playerTwoDrinks =
          room.players.find((player) => player.id === input.playerTwoId)
            ?.drinks || 0;

        if (input.result === "CORRECT") {
          await prisma.player.update({
            where: { id: input.playerOneId },
            data: {
              points: playerOnePoints + 1,
            },
          });

          await prisma.player.update({
            where: { id: input.playerTwoId },
            data: {
              points: playerTwoPoints + 1,
            },
          });
        } else {
          await prisma.player.update({
            where: { id: input.playerOneId },
            data: {
              drinks: playerOneDrinks + 1,
            },
          });

          await prisma.player.update({
            where: { id: input.playerTwoId },
            data: {
              drinks: playerTwoDrinks + 1,
            },
          });
        }

        return true;
      } catch (error) {
        console.error("Failed to update room:", error);
        throw new Error("Failed to update room");
      }
    }),

  nextCatherineCard: baseProcedure
    .input(
      z.object({
        roomId: z.string(),
        result: z.string(),
        currentPlayerId: z.string(),
        currentQuestionId: z.string(),
      }),
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
          (id) => ![...previousPlayersIds, input.currentPlayerId].includes(id),
        );

        if (players.length === 2) {
          previousPlayersIds = [];
          previousPlayersIds.push(input.currentPlayerId);
          nextPlayerId = players.filter(
            (id) => !previousPlayersIds.includes(id),
          )[0];
        } else {
          if (playersWhoHaveNotPlayed.length > 0) {
            nextPlayerId = playersWhoHaveNotPlayed[0];
            previousPlayersIds = [...previousPlayersIds, input.currentPlayerId];
          } else {
            const availablePlayers = players.filter(
              (id) => id !== input.currentPlayerId,
            );
            nextPlayerId =
              availablePlayers[
                Math.floor(Math.random() * availablePlayers.length)
              ];
            previousPlayersIds = [];
          }
        }

        let nextQuestionId = null;

        const questions = room.game.questions.map((obj) => obj.id);
        let previousQuestionsIds = room.previousQuestionsId || [];
        const questionsWhichHaveNotPlayed = questions.filter(
          (id) =>
            ![...previousQuestionsIds, input.currentQuestionId].includes(id),
        );

        if (questionsWhichHaveNotPlayed?.length > 0) {
          nextQuestionId =
            questionsWhichHaveNotPlayed[
              Math.floor(Math.random() * questionsWhichHaveNotPlayed.length)
            ];
          previousQuestionsIds = [
            ...previousQuestionsIds,
            parseInt(input.currentQuestionId),
          ];
        } else {
          nextQuestionId =
            room.game.questions[
              Math.floor(Math.random() * room.game.questions.length)
            ]?.id || null;
          previousQuestionsIds = [];
        }

        await prisma.room.update({
          where: { id: input.roomId },
          data: {
            currentQuestionId: nextQuestionId ?? null,
            previousQuestionsId: previousQuestionsIds,
            previousPlayersIds: previousPlayersIds,
            currentPlayerId: nextPlayerId,
          },
        });

        const currentPlayerPoints =
          room.players.find((player) => player.id === input.currentPlayerId)
            ?.points || 0;
        const currentPlayerDrinks =
          room.players.find((player) => player.id === input.currentPlayerId)
            ?.drinks || 0;

        if (input.result === "CORRECT") {
          await prisma.player.update({
            where: { id: input.currentPlayerId },
            data: {
              points: currentPlayerPoints + 1,
            },
          });
        } else {
          await prisma.player.update({
            where: { id: input.currentPlayerId },
            data: {
              drinks: currentPlayerDrinks + 1,
            },
          });
        }

        return true;
      } catch (error) {
        console.error("Failed to update room:", error);
        throw new Error("Failed to update room");
      }
    }),

  voteQuestion: baseProcedure
    .input(
      z.object({
        roomId: z.string(),
        vote: z.string(),
        currentPlayerId: z.string(),
      }),
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
          (id) => ![...previousPlayersIds, input.currentPlayerId].includes(id),
        );

        if (players.length === 2) {
          previousPlayersIds = [];
          previousPlayersIds.push(input.currentPlayerId);
          nextPlayerId = players.filter(
            (id) => !previousPlayersIds.includes(id),
          )[0];
        } else {
          if (playersWhoHaveNotPlayed.length > 0) {
            nextPlayerId = playersWhoHaveNotPlayed[0];
            previousPlayersIds = [...previousPlayersIds, input.currentPlayerId];
          } else {
            const availablePlayers = players.filter(
              (id) => id !== input.currentPlayerId,
            );
            nextPlayerId =
              availablePlayers[
                Math.floor(Math.random() * availablePlayers.length)
              ];
            previousPlayersIds = [];
          }
        }

        const questionAVotes = room.questionAVotes || [];
        const questionBVotes = room.questionBVotes || [];

        if (input.vote === "A") {
          questionAVotes.push(input.currentPlayerId);
        } else {
          questionBVotes.push(input.currentPlayerId);
        }

        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: {
            currentPlayerId: nextPlayerId,
            previousPlayersIds: previousPlayersIds,
            questionAVotes: questionAVotes,
            questionBVotes: questionBVotes,
          },
        });

        return updatedRoom;
      } catch (error) {
        console.error("Failed to update room:", error);
        throw new Error("Failed to update room");
      }
    }),

  voteTruthLie: baseProcedure
    .input(
      z.object({
        roomId: z.string(),
        playerId: z.string(),
        vote: z.enum(["TRUTH", "LIE"]),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const room = await prisma.room.findFirst({
          where: {
            id: input.roomId,
          },
          include: {
            players: true,
            game: true,
          },
        });

        if (!room) {
          throw new Error("Room not found");
        }

        if (room.currentAnswer) {
          return room;
        }

        const questionAVotes = room.questionAVotes || [];
        const questionBVotes = room.questionBVotes || [];

        const cleanedAVotes = questionAVotes.filter(
          (id) => id !== input.playerId,
        );
        const cleanedBVotes = questionBVotes.filter(
          (id) => id !== input.playerId,
        );

        if (input.vote === "TRUTH") {
          cleanedAVotes.push(input.playerId);
        } else {
          cleanedBVotes.push(input.playerId);
        }

        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: {
            questionAVotes: cleanedAVotes,
            questionBVotes: cleanedBVotes,
          },
        });

        return updatedRoom;
      } catch (error) {
        console.error("Failed to vote truth/lie", error);
        throw new Error("Failed to vote truth/lie");
      }
    }),

  revealTruthLie: baseProcedure
    .input(
      z.object({
        roomId: z.string(),
        playerId: z.string(),
        answer: z.enum(["TRUTH", "LIE"]),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const room = await prisma.room.findFirst({
          where: {
            id: input.roomId,
          },
          include: {
            players: true,
            game: true,
          },
        });

        if (!room) {
          throw new Error("Room not found");
        }

        if (room.currentPlayerId !== input.playerId) {
          throw new Error("Only the current player can reveal the answer");
        }

        const totalVotes =
          (room.questionAVotes?.length || 0) +
          (room.questionBVotes?.length || 0);
        const requiredVotes = Math.max(0, room.players.length - 1);
        if (totalVotes < requiredVotes) {
          throw new Error("Not all players have voted yet");
        }

        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: {
            currentAnswer: input.answer,
          },
        });

        return updatedRoom;
      } catch (error) {
        console.error("Failed to reveal truth/lie", error);
        throw new Error("Failed to reveal truth/lie");
      }
    }),

  nextTruthLieCard: baseProcedure
    .input(
      z.object({
        roomId: z.string(),
        currentQuestionId: z.string(),
        currentPlayerId: z.string(),
      }),
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

        if (!room.currentAnswer) {
          throw new Error("Answer has not been revealed");
        }

        const truthVoters = room.questionAVotes || [];
        const lieVoters = room.questionBVotes || [];

        if (room.currentAnswer === "TRUTH") {
          if (truthVoters.length > 0) {
            await prisma.player.updateMany({
              where: { id: { in: truthVoters } },
              data: { points: { increment: 1 } },
            });
          }
          if (lieVoters.length > 0) {
            await prisma.player.updateMany({
              where: { id: { in: lieVoters } },
              data: { drinks: { increment: 1 } },
            });
          }
        } else {
          if (lieVoters.length > 0) {
            await prisma.player.updateMany({
              where: { id: { in: lieVoters } },
              data: { points: { increment: 1 } },
            });
          }
          if (truthVoters.length > 0) {
            await prisma.player.updateMany({
              where: { id: { in: truthVoters } },
              data: { drinks: { increment: 1 } },
            });
          }
        }

        let nextPlayerId = "";
        const players = room.players.map((obj) => obj.id);
        let previousPlayersIds = room.previousPlayersIds || [];
        const playersWhoHaveNotPlayed = players.filter(
          (id) => ![...previousPlayersIds, input.currentPlayerId].includes(id),
        );

        if (players.length === 2) {
          previousPlayersIds = [];
          previousPlayersIds.push(input.currentPlayerId);
          nextPlayerId = players.filter(
            (id) => !previousPlayersIds.includes(id),
          )[0];
        } else {
          if (playersWhoHaveNotPlayed.length > 0) {
            nextPlayerId = playersWhoHaveNotPlayed[0];
            previousPlayersIds = [...previousPlayersIds, input.currentPlayerId];
          } else {
            const availablePlayers = players.filter(
              (id) => id !== input.currentPlayerId,
            );
            nextPlayerId =
              availablePlayers[
                Math.floor(Math.random() * availablePlayers.length)
              ];
            previousPlayersIds = [];
          }
        }

        let nextQuestionId = null;
        const questions = room.game.questions.map((obj) => obj.id);
        let previousQuestionsIds = room.previousQuestionsId || [];
        const questionsWhichHaveNotPlayed = questions.filter(
          (id) =>
            ![...previousQuestionsIds, input.currentQuestionId].includes(id),
        );

        if (questionsWhichHaveNotPlayed?.length > 0) {
          nextQuestionId =
            questionsWhichHaveNotPlayed[
              Math.floor(Math.random() * questionsWhichHaveNotPlayed.length)
            ];
          previousQuestionsIds = [
            ...previousQuestionsIds,
            parseInt(input.currentQuestionId),
          ];
        } else {
          nextQuestionId =
            room.game.questions[
              Math.floor(Math.random() * room.game.questions.length)
            ]?.id || null;
          previousQuestionsIds = [];
        }

        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: {
            currentPlayerId: nextPlayerId,
            previousPlayersIds: previousPlayersIds,
            currentQuestionId: nextQuestionId ?? null,
            previousQuestionsId: previousQuestionsIds,
            questionAVotes: [],
            questionBVotes: [],
            currentAnswer: null,
          },
        });

        return updatedRoom;
      } catch (error) {
        console.error("Failed to generate next truth/lie card:", error);
        throw new Error("Failed to generate next truth/lie card");
      }
    }),

  nextWouldRatherQuestion: baseProcedure
    .input(
      z.object({
        gamecode: z.string(),
        roomId: z.string(),
        currentQuestionId: z.string(),
      }),
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
            ![...previousQuestionsIds, input.currentQuestionId].includes(id),
        );

        if (questionsWhichHaveNotPlayed?.length > 0) {
          nextQuestionId =
            questionsWhichHaveNotPlayed[
              Math.floor(Math.random() * questionsWhichHaveNotPlayed.length)
            ];
          previousQuestionsIds = [
            ...previousQuestionsIds,
            parseInt(input.currentQuestionId),
          ];
        } else {
          nextQuestionId =
            room.game.questions[
              Math.floor(Math.random() * room.game.questions.length)
            ]?.id || null;
          previousQuestionsIds = [];
        }

        if (
          room?.questionAVotes.length > 0 &&
          room?.questionBVotes.length > 0 &&
          room?.questionAVotes.length === room?.questionBVotes.length
        ) {
          for (const player of room.players) {
            if (room.questionAVotes.includes(player.id)) {
              await prisma.player.update({
                where: { id: player.id },
                data: {
                  drinks: player?.drinks || 0 + 1,
                },
              });
            }
          }

          for (const player of room.players) {
            if (room.questionBVotes.includes(player.id)) {
              await prisma.player.update({
                where: { id: player.id },
                data: {
                  drinks: player?.drinks || 0 + 1,
                },
              });
            }
          }
        }

        if (
          room?.questionAVotes.length > 0 &&
          room?.questionBVotes.length > 0 &&
          room?.questionAVotes.length > room?.questionBVotes.length
        ) {
          for (const player of room.players) {
            if (room.questionBVotes.includes(player.id)) {
              await prisma.player.update({
                where: { id: player.id },
                data: {
                  drinks: player?.drinks || 0 + 1,
                },
              });
            }
          }

          for (const player of room.players) {
            if (room.questionAVotes.includes(player.id)) {
              await prisma.player.update({
                where: { id: player.id },
                data: {
                  points: player?.points || 0 + 1,
                },
              });
            }
          }
        }

        if (
          room?.questionAVotes.length > 0 &&
          room?.questionBVotes.length > 0 &&
          room?.questionAVotes.length < room?.questionBVotes.length
        ) {
          for (const player of room.players) {
            if (room.questionAVotes.includes(player.id)) {
              await prisma.player.update({
                where: { id: player.id },
                data: {
                  drinks: player?.drinks || 0 + 1,
                },
              });
            }
          }

          for (const player of room.players) {
            if (room.questionBVotes.includes(player.id)) {
              await prisma.player.update({
                where: { id: player.id },
                data: {
                  points: player?.points || 0 + 1,
                },
              });
            }
          }
        }

        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: {
            currentQuestionId: nextQuestionId ?? null,
            previousQuestionsId: previousQuestionsIds,
            questionAVotes: [],
            questionBVotes: [],
          },
        });

        return updatedRoom;
      } catch (error) {
        console.error("Failed to update question:", error);
        throw new Error("Failed to update question");
      }
    }),

  updatePlayerStatsPOD: baseProcedure
    .input(
      z.object({
        gamecode: z.string(),
        roomId: z.string(),
        points: z.string(),
        drinks: z.string(),
        currentPlayerId: z.string(),
        currentQuestionId: z.string(),
      }),
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
          (id) => ![...previousPlayersIds, input.currentPlayerId].includes(id),
        );

        if (players.length === 2) {
          previousPlayersIds = [];
          previousPlayersIds.push(input.currentPlayerId);
          nextPlayerId = players.filter(
            (id) => !previousPlayersIds.includes(id),
          )[0];
        } else {
          if (playersWhoHaveNotPlayed.length > 0) {
            nextPlayerId = playersWhoHaveNotPlayed[0];
            previousPlayersIds = [...previousPlayersIds, input.currentPlayerId];
          } else {
            const availablePlayers = players.filter(
              (id) => id !== input.currentPlayerId,
            );
            nextPlayerId =
              availablePlayers[
                Math.floor(Math.random() * availablePlayers.length)
              ];
            previousPlayersIds = [];
          }
        }

        let nextQuestionId = null;

        const questions = room.game.questions.map((obj) => obj.id);

        let previousQuestionsIds = room.previousQuestionsId || [];
        const questionsWhichHaveNotPlayed = questions.filter(
          (id) =>
            ![...previousQuestionsIds, input.currentQuestionId].includes(id),
        );

        if (questionsWhichHaveNotPlayed?.length > 0) {
          nextQuestionId =
            questionsWhichHaveNotPlayed[
              Math.floor(Math.random() * questionsWhichHaveNotPlayed.length)
            ];
          previousQuestionsIds = [
            ...previousQuestionsIds,
            parseInt(input.currentQuestionId),
          ];
        } else {
          nextQuestionId =
            room.game.questions[
              Math.floor(Math.random() * room.game.questions.length)
            ]?.id || null;
          previousQuestionsIds = [];
        }

        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: {
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
          },
        });

        return updatedRoom;
      } catch (error) {
        console.error("Failed to update room:", error);
        throw new Error("Failed to update room");
      }
    }),

  nextCardPOD: baseProcedure
    .input(
      z.object({
        gamecode: z.string(),
        roomId: z.string(),
        currentPlayerId: z.string(),
        currentQuestionId: z.string(),
      }),
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
          (id) => ![...previousPlayersIds, input.currentPlayerId].includes(id),
        );

        if (input.gamecode === "imposter") {
          const availablePlayers = players.filter(
            (id) => id !== input.currentPlayerId,
          );
          nextPlayerId =
            availablePlayers[
              Math.floor(Math.random() * availablePlayers.length)
            ];
        } else {
          if (players.length === 2) {
            previousPlayersIds = [];
            previousPlayersIds.push(input.currentPlayerId);
            nextPlayerId = players.filter(
              (id) => !previousPlayersIds.includes(id),
            )[0];
          } else {
            if (playersWhoHaveNotPlayed.length > 0) {
              nextPlayerId = playersWhoHaveNotPlayed[0];
              previousPlayersIds = [
                ...previousPlayersIds,
                input.currentPlayerId,
              ];
            } else {
              const availablePlayers = players.filter(
                (id) => id !== input.currentPlayerId,
              );
              nextPlayerId =
                availablePlayers[
                  Math.floor(Math.random() * availablePlayers.length)
                ];
              previousPlayersIds = [];
            }
          }
        }

        let nextQuestionId = null;

        const questions = room.game.questions.map((obj) => obj.id);

        let previousQuestionsIds = room.previousQuestionsId || [];
        const questionsWhichHaveNotPlayed = questions.filter(
          (id) =>
            ![...previousQuestionsIds, input.currentQuestionId].includes(id),
        );

        if (questionsWhichHaveNotPlayed?.length > 0) {
          nextQuestionId =
            questionsWhichHaveNotPlayed[
              Math.floor(Math.random() * questionsWhichHaveNotPlayed.length)
            ];
          previousQuestionsIds = [
            ...previousQuestionsIds,
            parseInt(input.currentQuestionId),
          ];
        } else {
          nextQuestionId =
            room.game.questions[
              Math.floor(Math.random() * room.game.questions.length)
            ]?.id || null;
          previousQuestionsIds = [];
        }

        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: {
            currentPlayerId: nextPlayerId,
            previousPlayersIds: previousPlayersIds,
            currentQuestionId: nextQuestionId ?? null,
            previousQuestionsId: previousQuestionsIds,
          },
        });

        return updatedRoom;
      } catch (error) {
        console.error("Failed to update room:", error);
        throw new Error("Failed to update room");
      }
    }),

  addNewPlayer: baseProcedure
    .input(
      z.object({
        gamecode: z.string(),
        roomId: z.string(),
        newPlayer: z.string(),
      }),
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

        const newPlayer = await prisma.player.create({
          data: {
            name: input.newPlayer,
            roomId: input.roomId,
            points: 0,
            drinks: 0,
          },
        });

        if (input.gamecode === "verbal-charades") {
          const allPairs = room.allPairIds || [];
          const createdRoomPlayers = room.players;
          if (input.gamecode === "verbal-charades") {
            for (let i = 0; i < room.players.length; i++) {
              const pairKey = [newPlayer.id, createdRoomPlayers[i].id].join(
                "&",
              );
              const opositePairKey = [
                createdRoomPlayers[i].id,
                newPlayer.id,
              ].join("&");
              allPairs.push(pairKey);
              allPairs.push(opositePairKey);
            }
          }

          await prisma.room.update({
            where: { id: input.roomId },
            data: {
              allPairIds: allPairs,
            },
          });
        }

        return true;
      } catch (error) {
        console.error("Failed to update room:", error);
        throw new Error("Failed to update room");
      }
    }),

  addNewPlayerToTeam: baseProcedure
    .input(
      z.object({
        gamecode: z.string(),
        roomId: z.string(),
        newPlayer: z.string(),
        team: z.string(),
      }),
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

        await prisma.player.create({
          data: {
            name: input.newPlayer,
            roomId: input.roomId,
            points: 0,
            drinks: 0,
            team: input.team,
          },
        });

        return true;
      } catch (error) {
        console.error("Failed to add player to team", error);
        throw new Error("Failed to add player to team");
      }
    }),

  nextCardCategory: baseProcedure
    .input(
      z.object({
        roomId: z.string(),
        currentPlayingTeam: z.string(),
        winningTeams: z.array(z.string()),
        currentQuestionId: z.string(),
        forefit: z.boolean().optional(),
      }),
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

        let nextPlayingTeam = "";

        // const players = room.players.map((obj) => obj.id);
        const teams = room.playingTeams || [];
        let previousTeams = room.previousPlayedTeams || [];
        const teamsWhoHaveNotPlayed = teams.filter(
          (id) => ![...previousTeams, input.currentPlayingTeam].includes(id),
        );

        if (teams.length === 2) {
          previousTeams = [];
          previousTeams.push(input.currentPlayingTeam);
          nextPlayingTeam = teams.filter(
            (id) => !previousTeams.includes(id),
          )[0];
        } else {
          if (teamsWhoHaveNotPlayed.length > 0) {
            nextPlayingTeam = teamsWhoHaveNotPlayed[0];
            previousTeams = [...previousTeams, input.currentPlayingTeam];
          } else {
            const availableTeams = teams.filter(
              (teamName: string) => teamName !== input.currentPlayingTeam,
            );
            nextPlayingTeam =
              availableTeams[Math.floor(Math.random() * availableTeams.length)];
            previousTeams = [];
          }
        }

        let nextQuestionId = null;

        const questions = room.game.questions.map((obj) => obj.id);

        let previousQuestionsIds = room.previousQuestionsId || [];
        const questionsWhichHaveNotPlayed = questions.filter(
          (id) =>
            ![...previousQuestionsIds, input.currentQuestionId].includes(id),
        );

        if (questionsWhichHaveNotPlayed?.length > 0) {
          nextQuestionId =
            questionsWhichHaveNotPlayed[
              Math.floor(Math.random() * questionsWhichHaveNotPlayed.length)
            ];
          previousQuestionsIds = [
            ...previousQuestionsIds,
            parseInt(input.currentQuestionId),
          ];
        } else {
          nextQuestionId =
            room.game.questions[
              Math.floor(Math.random() * room.game.questions.length)
            ]?.id || null;
          previousQuestionsIds = [];
        }

        if (input.winningTeams.length > 0) {
          for (let index = 0; index < input.winningTeams.length; index++) {
            const element = input.winningTeams[index];
            await prisma.player.updateMany({
              where: {
                team: element,
              },
              data: {
                points: {
                  increment: 1,
                },
              },
            });
          }

          const losingTeams = teams.filter(
            (teamName: string) =>
              ![input.winningTeams, input.currentPlayingTeam].includes(
                teamName,
              ),
          );

          for (let index = 0; index < losingTeams.length; index++) {
            const element = losingTeams[index];
            await prisma.player.updateMany({
              where: {
                team: element,
              },
              data: {
                drinks: {
                  increment: 1,
                },
              },
            });
          }
        }

        if (input.forefit === false && input.winningTeams.length === 0) {
          const losingTeams = teams.filter(
            (teamName: string) =>
              ![input.winningTeams, input.currentPlayingTeam].includes(
                teamName,
              ),
          );

          for (let index = 0; index < losingTeams.length; index++) {
            const element = losingTeams[index];
            await prisma.player.updateMany({
              where: {
                team: element,
              },
              data: {
                drinks: {
                  increment: 1,
                },
              },
            });
          }
        }

        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: {
            currentPlayerId: nextPlayingTeam,
            previousPlayedTeams: previousTeams,
            currentQuestionId: nextQuestionId ?? null,
            previousQuestionsId: previousQuestionsIds,
          },
        });

        return updatedRoom;
      } catch (error) {
        console.error("Failed to generate category card:", error);
        throw new Error("Failed to generate category card");
      }
    }),

  checkForOpenRooms: baseProcedure.query(async () => {
    try {
      const openRooms = await prisma.room.findMany({
        where: {
          gameEnded: false,
          // createdAt: {
          //   gt: new Date(Date.now() - 120 * 60 * 1000), // 2 hours
          // },
        },
      });

      const filteredOpenRooms = openRooms.filter((room) => {
        const roomAgeInMs = Date.now() - room.createdAt.getTime();
        return roomAgeInMs >= 120 * 60 * 1000; // 2 hours
      });

      return filteredOpenRooms;
    } catch (error) {
      console.error("Failed to fetch open rooms:", error);
      throw new Error("Failed to fetch open rooms");
    }
  }),

  closeOpenRooms: baseProcedure.mutation(async () => {
    try {
      const openRooms = await prisma.room.findMany({
        where: {
          gameEnded: false,
          createdAt: {
            gt: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
          },
        },
      });

      const filteredOpenRooms = openRooms.filter((room) => {
        const roomAgeInMs = Date.now() - room.createdAt.getTime();
        return roomAgeInMs >= 120 * 60 * 1000; // 2 hours old
      });

      for (const room of filteredOpenRooms) {
        await prisma.room.update({
          where: { id: room.id },
          data: {
            gameEnded: true,
            gameEndedAt: new Date(room.createdAt.getTime() + 120 * 60 * 1000), // Set to 2 hours from creation
          },
        });
      }

      return true;
    } catch (error) {
      console.error("Failed to close open rooms:", error);
      throw new Error("Failed to close open rooms");
    }
  }),
});
