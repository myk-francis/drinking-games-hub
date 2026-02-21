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

const CODENAMES_TEAM_VALUES = ["RED", "BLUE"] as const;
const CODENAMES_ASSIGNMENT_VALUES = [
  "RED",
  "BLUE",
  "NEUTRAL",
  "ASSASSIN",
] as const;
const MEMORY_CHAIN_CARD_COUNT = 12;
const GUESS_THE_NUMBER_MIN = 0;
const GUESS_THE_NUMBER_MAX = 100;

type CodenamesTeam = (typeof CODENAMES_TEAM_VALUES)[number];
type CodenamesAssignment = (typeof CODENAMES_ASSIGNMENT_VALUES)[number];

type CodenamesState = {
  status: "LOBBY" | "PLAYING" | "ENDED";
  board: number[];
  assignments: Record<number, CodenamesAssignment>;
  startingTeam: CodenamesTeam;
  turnTeam: CodenamesTeam;
  guessesRemaining: number | null;
  winner: CodenamesTeam | null;
};

type MemoryChainState = {
  status: "PLAYING" | "ENDED";
  board: number[];
  sequence: number[];
  revealed: number[];
  progress: number;
  winnerPlayerId: string | null;
  pendingMissQuestionId: number | null;
  pendingMissNextPlayerId: string | null;
};

type GuessTheNumberFeedback = "PENDING" | "UP" | "DOWN" | "CORRECT";

type GuessTheNumberRoundGuess = {
  guess: number;
  feedback: GuessTheNumberFeedback;
};

type GuessTheNumberRoundSummaryEntry = {
  guesserPlayerId: string;
  guess: number;
  feedback: Exclude<GuessTheNumberFeedback, "PENDING">;
};

type GuessTheNumberRoundSummary = {
  targetPlayerId: string;
  targetNumber: number;
  entries: GuessTheNumberRoundSummaryEntry[];
};

type GuessTheNumberState = {
  status: "SETUP" | "PLAYING" | "ENDED";
  minValue: number;
  maxValue: number;
  playerNumbers: Record<string, number | null>;
  playerOrder: string[];
  currentRoundGuesses: Record<string, GuessTheNumberRoundGuess>;
  roundHistory: GuessTheNumberRoundSummary[];
  completedTargetPlayerIds: string[];
  playerDiscoveries: Record<string, string[]>;
  winnerPlayerId: string | null;
  winnerTargetPlayerId: string | null;
};

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function getOtherCodenamesTeam(team: CodenamesTeam): CodenamesTeam {
  return team === "RED" ? "BLUE" : "RED";
}

function getDefaultCodenamesState(): CodenamesState {
  return {
    status: "LOBBY",
    board: [],
    assignments: {},
    startingTeam: "RED",
    turnTeam: "RED",
    guessesRemaining: null,
    winner: null,
  };
}

function parseCodenamesState(raw: string | null): CodenamesState {
  if (!raw) {
    return getDefaultCodenamesState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CodenamesState>;
    const status =
      parsed.status === "LOBBY" ||
      parsed.status === "PLAYING" ||
      parsed.status === "ENDED"
        ? parsed.status
        : "LOBBY";
    const startingTeam =
      parsed.startingTeam === "RED" || parsed.startingTeam === "BLUE"
        ? parsed.startingTeam
        : "RED";
    const turnTeam =
      parsed.turnTeam === "RED" || parsed.turnTeam === "BLUE"
        ? parsed.turnTeam
        : startingTeam;
    const winner =
      parsed.winner === "RED" || parsed.winner === "BLUE"
        ? parsed.winner
        : null;

    const board = Array.isArray(parsed.board)
      ? parsed.board.filter((id) => typeof id === "number")
      : [];

    const assignments: Record<number, CodenamesAssignment> = {};
    const rawAssignments = parsed.assignments ?? {};
    for (const [questionId, assignment] of Object.entries(rawAssignments)) {
      const parsedQuestionId = Number(questionId);
      if (
        Number.isFinite(parsedQuestionId) &&
        typeof assignment === "string" &&
        CODENAMES_ASSIGNMENT_VALUES.includes(assignment as CodenamesAssignment)
      ) {
        assignments[parsedQuestionId] = assignment as CodenamesAssignment;
      }
    }

    const guessesRemaining =
      typeof parsed.guessesRemaining === "number" &&
      Number.isFinite(parsed.guessesRemaining)
        ? parsed.guessesRemaining
        : null;

    return {
      status,
      board,
      assignments,
      startingTeam,
      turnTeam,
      guessesRemaining,
      winner,
    };
  } catch {
    return getDefaultCodenamesState();
  }
}

function getDefaultMemoryChainState(): MemoryChainState {
  return {
    status: "PLAYING",
    board: [],
    sequence: [],
    revealed: [],
    progress: 0,
    winnerPlayerId: null,
    pendingMissQuestionId: null,
    pendingMissNextPlayerId: null,
  };
}

function parseMemoryChainState(raw: string | null): MemoryChainState {
  if (!raw) {
    return getDefaultMemoryChainState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MemoryChainState>;
    return {
      status: parsed.status === "ENDED" ? "ENDED" : "PLAYING",
      board: Array.isArray(parsed.board)
        ? parsed.board.filter((id): id is number => typeof id === "number")
        : [],
      sequence: Array.isArray(parsed.sequence)
        ? parsed.sequence.filter((id): id is number => typeof id === "number")
        : [],
      revealed: Array.isArray(parsed.revealed)
        ? parsed.revealed.filter((id): id is number => typeof id === "number")
        : [],
      progress:
        typeof parsed.progress === "number" && Number.isFinite(parsed.progress)
          ? parsed.progress
          : 0,
      winnerPlayerId:
        typeof parsed.winnerPlayerId === "string" ? parsed.winnerPlayerId : null,
      pendingMissQuestionId:
        typeof parsed.pendingMissQuestionId === "number" &&
        Number.isFinite(parsed.pendingMissQuestionId)
          ? parsed.pendingMissQuestionId
          : null,
      pendingMissNextPlayerId:
        typeof parsed.pendingMissNextPlayerId === "string"
          ? parsed.pendingMissNextPlayerId
          : null,
    };
  } catch {
    return getDefaultMemoryChainState();
  }
}

function getDefaultGuessTheNumberState(
  playerIds: string[],
  startingTargetPlayerId: string | null,
): GuessTheNumberState {
  const normalizedOrder = startingTargetPlayerId
    ? [
        startingTargetPlayerId,
        ...playerIds.filter((id) => id !== startingTargetPlayerId),
      ]
    : [...playerIds];
  const playerNumbers: Record<string, number | null> = {};
  const playerDiscoveries: Record<string, string[]> = {};
  for (const playerId of playerIds) {
    playerNumbers[playerId] = null;
    playerDiscoveries[playerId] = [];
  }

  return {
    status: "SETUP",
    minValue: GUESS_THE_NUMBER_MIN,
    maxValue: GUESS_THE_NUMBER_MAX,
    playerNumbers,
    playerOrder: normalizedOrder,
    currentRoundGuesses: {},
    roundHistory: [],
    completedTargetPlayerIds: [],
    playerDiscoveries,
    winnerPlayerId: null,
    winnerTargetPlayerId: null,
  };
}

function parseGuessTheNumberState(
  raw: string | null,
  playerIds: string[],
  currentTargetPlayerId: string | null,
): GuessTheNumberState {
  const fallback = getDefaultGuessTheNumberState(playerIds, currentTargetPlayerId);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<GuessTheNumberState>;
    const normalizedOrder = [
      ...(Array.isArray(parsed.playerOrder)
        ? parsed.playerOrder.filter((id): id is string => playerIds.includes(id))
        : []),
      ...playerIds.filter(
        (id) => !(Array.isArray(parsed.playerOrder) && parsed.playerOrder.includes(id)),
      ),
    ];

    const parsedNumbers =
      parsed.playerNumbers && typeof parsed.playerNumbers === "object"
        ? parsed.playerNumbers
        : {};
    const playerNumbers: Record<string, number | null> = {};
    for (const playerId of playerIds) {
      const value = (parsedNumbers as Record<string, unknown>)[playerId];
      playerNumbers[playerId] =
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= GUESS_THE_NUMBER_MIN &&
        value <= GUESS_THE_NUMBER_MAX
          ? value
          : null;
    }

    const currentRoundGuesses: Record<string, GuessTheNumberRoundGuess> = {};
    const rawGuesses =
      parsed.currentRoundGuesses && typeof parsed.currentRoundGuesses === "object"
        ? parsed.currentRoundGuesses
        : {};
    for (const [playerId, value] of Object.entries(rawGuesses)) {
      if (!playerIds.includes(playerId) || typeof value !== "object" || !value) {
        continue;
      }
      const nextGuess = (value as { guess?: unknown; feedback?: unknown }).guess;
      const feedback = (value as { guess?: unknown; feedback?: unknown }).feedback;
      if (
        typeof nextGuess === "number" &&
        Number.isInteger(nextGuess) &&
        nextGuess >= GUESS_THE_NUMBER_MIN &&
        nextGuess <= GUESS_THE_NUMBER_MAX &&
        (feedback === "PENDING" ||
          feedback === "UP" ||
          feedback === "DOWN" ||
          feedback === "CORRECT")
      ) {
        currentRoundGuesses[playerId] = {
          guess: nextGuess,
          feedback,
        };
      }
    }

    const roundHistory = Array.isArray(parsed.roundHistory)
      ? parsed.roundHistory
          .map((round) => {
            if (!round || typeof round !== "object") return null;
            const targetPlayerId =
              typeof round.targetPlayerId === "string" &&
              playerIds.includes(round.targetPlayerId)
                ? round.targetPlayerId
                : null;
            const targetNumber =
              typeof round.targetNumber === "number" &&
              Number.isInteger(round.targetNumber) &&
              round.targetNumber >= GUESS_THE_NUMBER_MIN &&
              round.targetNumber <= GUESS_THE_NUMBER_MAX
                ? round.targetNumber
                : null;
            if (!targetPlayerId || targetNumber === null) return null;

            const entries = Array.isArray(round.entries)
              ? round.entries
                  .map((entry) => {
                    if (!entry || typeof entry !== "object") return null;
                    const guesserPlayerId =
                      typeof entry.guesserPlayerId === "string" &&
                      playerIds.includes(entry.guesserPlayerId)
                        ? entry.guesserPlayerId
                        : null;
                    const guess =
                      typeof entry.guess === "number" &&
                      Number.isInteger(entry.guess) &&
                      entry.guess >= GUESS_THE_NUMBER_MIN &&
                      entry.guess <= GUESS_THE_NUMBER_MAX
                        ? entry.guess
                        : null;
                    const feedback =
                      entry.feedback === "UP" ||
                      entry.feedback === "DOWN" ||
                      entry.feedback === "CORRECT"
                        ? entry.feedback
                        : null;

                    if (!guesserPlayerId || guess === null || !feedback) {
                      return null;
                    }

                    return {
                      guesserPlayerId,
                      guess,
                      feedback,
                    } satisfies GuessTheNumberRoundSummaryEntry;
                  })
                  .filter(
                    (entry): entry is GuessTheNumberRoundSummaryEntry =>
                      entry !== null,
                  )
              : [];

            return {
              targetPlayerId,
              targetNumber,
              entries,
            } satisfies GuessTheNumberRoundSummary;
          })
          .filter(
            (round): round is GuessTheNumberRoundSummary => round !== null,
          )
      : [];

    const completedTargetPlayerIds = Array.isArray(parsed.completedTargetPlayerIds)
      ? parsed.completedTargetPlayerIds.filter((id): id is string =>
          playerIds.includes(id),
        )
      : [];

    const playerDiscoveries: Record<string, string[]> = {};
    const rawDiscoveries =
      parsed.playerDiscoveries && typeof parsed.playerDiscoveries === "object"
        ? parsed.playerDiscoveries
        : {};
    for (const playerId of playerIds) {
      const rawTargets = (rawDiscoveries as Record<string, unknown>)[playerId];
      const targets = Array.isArray(rawTargets)
        ? rawTargets.filter(
            (targetId): targetId is string =>
              typeof targetId === "string" &&
              playerIds.includes(targetId) &&
              targetId !== playerId,
          )
        : [];
      playerDiscoveries[playerId] = Array.from(new Set(targets));
    }

    const allNumbersSet = playerIds.every((id) => playerNumbers[id] !== null);
    const status: GuessTheNumberState["status"] =
      parsed.status === "ENDED"
        ? "ENDED"
        : allNumbersSet
          ? "PLAYING"
          : "SETUP";

    return {
      status,
      minValue:
        typeof parsed.minValue === "number" &&
        Number.isFinite(parsed.minValue) &&
        parsed.minValue <= GUESS_THE_NUMBER_MIN
          ? parsed.minValue
          : GUESS_THE_NUMBER_MIN,
      maxValue:
        typeof parsed.maxValue === "number" &&
        Number.isFinite(parsed.maxValue) &&
        parsed.maxValue >= GUESS_THE_NUMBER_MAX
          ? parsed.maxValue
          : GUESS_THE_NUMBER_MAX,
      playerNumbers,
      playerOrder: normalizedOrder,
      currentRoundGuesses,
      roundHistory,
      completedTargetPlayerIds,
      playerDiscoveries,
      winnerPlayerId:
        typeof parsed.winnerPlayerId === "string" &&
        playerIds.includes(parsed.winnerPlayerId)
          ? parsed.winnerPlayerId
          : null,
      winnerTargetPlayerId:
        typeof parsed.winnerTargetPlayerId === "string" &&
        playerIds.includes(parsed.winnerTargetPlayerId)
          ? parsed.winnerTargetPlayerId
          : null,
    };
  } catch {
    return fallback;
  }
}

async function normalizeCodenamesTeamStats(
  tx: { player: typeof prisma.player },
  roomId: string,
  team: CodenamesTeam,
) {
  await tx.player.updateMany({
    where: {
      roomId,
      team,
      points: null,
    },
    data: { points: 0 },
  });

  await tx.player.updateMany({
    where: {
      roomId,
      team,
      drinks: null,
    },
    data: { drinks: 0 },
  });
}

async function assignCodenamesSpymasters(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      players: {
        orderBy: {
          createdAt: "asc",
        },
      },
      game: true,
    },
  });

  if (!room) {
    throw new Error("Room not found");
  }
  if (room.game.code !== "codenames") {
    throw new Error("This room is not a Codenames game");
  }

  const redPlayers = room.players.filter((player) => player.team === "RED");
  const bluePlayers = room.players.filter((player) => player.team === "BLUE");
  const isReady =
    room.players.length >= 4 && redPlayers.length > 0 && bluePlayers.length > 0;

  if (!isReady) {
    return {
      isReady,
      redSpymasterId: room.playerOneId ?? null,
      blueSpymasterId: room.playerTwoId ?? null,
    };
  }

  const redSpymasterId = redPlayers[0]?.id ?? null;
  const blueSpymasterId = bluePlayers[0]?.id ?? null;

  if (
    room.playerOneId !== redSpymasterId ||
    room.playerTwoId !== blueSpymasterId ||
    room.playingTeams.join(",") !== "RED,BLUE"
  ) {
    await prisma.room.update({
      where: { id: roomId },
      data: {
        playerOneId: redSpymasterId,
        playerTwoId: blueSpymasterId,
        playingTeams: ["RED", "BLUE"],
      },
    });
  }

  return {
    isReady,
    redSpymasterId,
    blueSpymasterId,
  };
}

export const gamesRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => {
    const games = await prisma.game.findMany({
      where: {
        published: true, // Only fetch published games
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
  getRoomState: baseProcedure
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
        select: {
          id: true,
          gameId: true,
          gameEnded: true,
          userId: true,
          currentPlayerId: true,
          playerOneId: true,
          playerTwoId: true,
          previousPairIds: true,
          allPairIds: true,
          previousPlayersIds: true,
          currentQuestionId: true,
          previousQuestionsId: true,
          currentCard: true,
          lastCard: true,
          lastPlayerId: true,
          previousCards: true,
          correctPrediction: true,
          rounds: true,
          currentRound: true,
          questionAVotes: true,
          questionBVotes: true,
          playingTeams: true,
          previousPlayedTeams: true,
          startedAt: true,
          gameEndedAt: true,
          createdAt: true,
          updatedAt: true,
          currentAnswer: true,
          players: {
            select: {
              id: true,
              name: true,
              points: true,
              drinks: true,
              team: true,
            },
          },
          game: {
            select: {
              id: true,
              code: true,
              name: true,
              questions: true, // Include questions if needed
            },
          },
        },
      });

      if (!room) {
        return null;
      }

      const currentQuestion = room.currentQuestionId
        ? await prisma.question.findUnique({
            where: { id: room.currentQuestionId },
            select: { id: true, text: true, answer: true, edition: true },
          })
        : null;

      return { ...room, currentQuestion };
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

        if (
          input.selectedGame === "memory-chain" &&
          (input.players?.length || 0) < 2
        ) {
          throw new Error("Memory Chain requires at least 2 players.");
        }
        if (
          input.selectedGame === "guess-the-number" &&
          (input.players?.length || 0) < 2
        ) {
          throw new Error("Guess The Number requires at least 2 players.");
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
          if (
            input.selectedGame === "verbal-charades" ||
            input.selectedGame === "taboo-lite"
          ) {
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
          let roomCurrentAnswer: string | null = null;

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

          if (input.selectedGame === "memory-chain") {
            const allWordIds = createdRoom.game.questions.map(
              (question) => question.id,
            );
            if (allWordIds.length < MEMORY_CHAIN_CARD_COUNT) {
              throw new Error(
                `Memory Chain requires at least ${MEMORY_CHAIN_CARD_COUNT} words`,
              );
            }

            const board = shuffleArray(allWordIds).slice(
              0,
              MEMORY_CHAIN_CARD_COUNT,
            );
            const sequence = shuffleArray(board);
            roomCurrentAnswer = JSON.stringify({
              status: "PLAYING",
              board,
              sequence,
              revealed: [],
              progress: 0,
              winnerPlayerId: null,
              pendingMissQuestionId: null,
              pendingMissNextPlayerId: null,
            } satisfies MemoryChainState);
          }

          const randomCurrentPlayerId =
            createdRoom.players[
              Math.floor(Math.random() * createdRoom.players.length)
            ]?.id ?? null;

          if (input.selectedGame === "guess-the-number") {
            const playerIds = createdRoom.players.map((player) => player.id);
            roomCurrentAnswer = JSON.stringify(
              getDefaultGuessTheNumberState(playerIds, randomCurrentPlayerId),
            );
          }

          const createdRoomId = createdRoom.id;
          await prisma.room.update({
            where: { id: createdRoomId },
            data: {
              currentPlayerId: randomCurrentPlayerId,
              previousPlayersIds: [],
              currentQuestionId: currentQuestionId,
              previousQuestionsId: [],
              allPairIds: allPairs,
              previousPairIds: previousPairIds,
              playerOneId: playerOneId || "",
              playerTwoId: playerTwoId || "",
              questionAVotes: [],
              questionBVotes: [],
              currentAnswer: roomCurrentAnswer,
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
            ![
              ...previousQuestionsIds,
              parseInt(input.currentQuestionId),
            ].includes(id),
        );
        const questionsWhichHaveNotPlayedForTruthOrDrink =
          questionsForTruthOrDrink.filter(
            (id) =>
              ![
                ...previousQuestionsIds,
                parseInt(input.currentQuestionId),
              ].includes(id),
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
            ![
              ...previousQuestionsIds,
              parseInt(input.currentQuestionId),
            ].includes(id),
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
            ![
              ...previousQuestionsIds,
              parseInt(input.currentQuestionId),
            ].includes(id),
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
            ![
              ...previousQuestionsIds,
              parseInt(input.currentQuestionId),
            ].includes(id),
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
            ![
              ...previousQuestionsIds,
              parseInt(input.currentQuestionId),
            ].includes(id),
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
          const availableQuestions = questions.filter(
            (id) => id !== parseInt(input.currentQuestionId),
          );
          nextQuestionId =
            availableQuestions[
              Math.floor(Math.random() * availableQuestions.length)
            ];
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
            ![
              ...previousQuestionsIds,
              parseInt(input.currentQuestionId),
            ].includes(id),
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

  paranoiaVote: baseProcedure
    .input(
      z.object({
        roomId: z.string(),
        playerId: z.string(),
        votedPlayerId: z.string(),
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

        if (room.game.code !== "paranoia") {
          throw new Error("This room is not a Paranoia game");
        }

        if (room.currentAnswer) {
          throw new Error("Round already revealed");
        }

        if (room.currentPlayerId === input.playerId) {
          throw new Error("Current player cannot vote");
        }

        if (input.votedPlayerId === room.currentPlayerId) {
          throw new Error("Cannot vote for the current player");
        }

        const voter = room.players.find((player) => player.id === input.playerId);
        if (!voter) {
          throw new Error("Voter not found");
        }

        const votedPlayer = room.players.find(
          (player) => player.id === input.votedPlayerId,
        );
        if (!votedPlayer) {
          throw new Error("Selected player not found");
        }

        const questionAVotes = [...(room.questionAVotes || [])];
        const questionBVotes = [...(room.questionBVotes || [])];

        if (questionAVotes.includes(input.playerId)) {
          throw new Error("You already voted this round");
        }

        questionAVotes.push(input.playerId);
        questionBVotes.push(input.votedPlayerId);

        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: {
            questionAVotes,
            questionBVotes,
          },
        });

        return updatedRoom;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        console.error("Failed to submit paranoia vote", {
          roomId: input.roomId,
          playerId: input.playerId,
          votedPlayerId: input.votedPlayerId,
          error,
        });
        throw new Error("Failed to submit paranoia vote");
      }
    }),

  paranoiaReveal: baseProcedure
    .input(
      z.object({
        roomId: z.string(),
        playerId: z.string(),
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

        if (room.game.code !== "paranoia") {
          throw new Error("This room is not a Paranoia game");
        }

        if (room.currentPlayerId !== input.playerId) {
          throw new Error("Only the current player can reveal");
        }

        const totalVotes = room.questionAVotes?.length || 0;
        const requiredVotes = Math.max(0, room.players.length - 1);
        if (totalVotes < requiredVotes) {
          throw new Error("Not all players have voted yet");
        }

        if ((room.questionBVotes?.length || 0) === 0) {
          throw new Error("No votes found for this round");
        }

        const voteCounts = (room.questionBVotes || []).reduce(
          (acc, playerId) => {
            acc[playerId] = (acc[playerId] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        const rankedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
        const highestCount = rankedVotes[0]?.[1] || 0;
        const topPlayers = rankedVotes
          .filter(([, count]) => count === highestCount)
          .map(([playerId]) => playerId);
        const selectedPlayerId =
          topPlayers[Math.floor(Math.random() * topPlayers.length)] || "";

        if (!selectedPlayerId) {
          throw new Error("Failed to resolve revealed player");
        }

        await prisma.player.update({
          where: { id: selectedPlayerId },
          data: {
            points: {
              increment: 1,
            },
          },
        });

        const updatedRoom = await prisma.room.update({
          where: { id: input.roomId },
          data: {
            currentAnswer: selectedPlayerId,
          },
        });

        return updatedRoom;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        console.error("Failed to reveal paranoia result", {
          roomId: input.roomId,
          playerId: input.playerId,
          error,
        });
        throw new Error("Failed to reveal paranoia result");
      }
    }),

  paranoiaNextCard: baseProcedure
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
                questions: true,
              },
            },
          },
        });

        if (!room) {
          throw new Error("Room not found");
        }

        if (room.game.code !== "paranoia") {
          throw new Error("This room is not a Paranoia game");
        }

        if (room.currentPlayerId !== input.currentPlayerId) {
          throw new Error("Only the current player can move to next question");
        }

        if (!room.currentAnswer) {
          throw new Error("Reveal the result before moving on");
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
            ![
              ...previousQuestionsIds,
              parseInt(input.currentQuestionId),
            ].includes(id),
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
            previousPlayersIds,
            currentQuestionId: nextQuestionId ?? null,
            previousQuestionsId: previousQuestionsIds,
            questionAVotes: [],
            questionBVotes: [],
            currentAnswer: null,
          },
        });

        return updatedRoom;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        console.error("Failed to move to next paranoia card", {
          roomId: input.roomId,
          currentQuestionId: input.currentQuestionId,
          currentPlayerId: input.currentPlayerId,
          error,
        });
        throw new Error("Failed to move to next paranoia card");
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
            ![
              ...previousQuestionsIds,
              parseInt(input.currentQuestionId),
            ].includes(id),
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
            ![
              ...previousQuestionsIds,
              parseInt(input.currentQuestionId),
            ].includes(id),
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
            ![
              ...previousQuestionsIds,
              parseInt(input.currentQuestionId),
            ].includes(id),
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

        if (
          input.gamecode === "verbal-charades" ||
          input.gamecode === "taboo-lite"
        ) {
          const allPairs = room.allPairIds || [];
          const createdRoomPlayers = room.players;
          if (
            input.gamecode === "verbal-charades" ||
            input.gamecode === "taboo-lite"
          ) {
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
            ![
              ...previousQuestionsIds,
              parseInt(input.currentQuestionId),
            ].includes(id),
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
              ![...input.winningTeams, input.currentPlayingTeam].includes(
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

  assignPlayerTeam: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
        team: z.enum(CODENAMES_TEAM_VALUES),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await prisma.room.findUnique({
        where: { id: input.roomId },
        include: {
          players: true,
          game: true,
        },
      });

      if (!room) {
        throw new Error("Room not found");
      }
      if (room.game.code !== "codenames") {
        throw new Error("This assignment flow is only for Codenames");
      }

      const player = room.players.find((item) => item.id === input.playerId);
      if (!player) {
        throw new Error("Player not found");
      }

      await prisma.player.update({
        where: { id: input.playerId },
        data: {
          team: input.team,
        },
      });

      return assignCodenamesSpymasters(input.roomId);
    }),

  codenamesAutoAssignSpymasters: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      return assignCodenamesSpymasters(input.roomId);
    }),

  codenamesStart: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await prisma.room.findUnique({
        where: { id: input.roomId },
        include: {
          players: {
            orderBy: {
              createdAt: "asc",
            },
          },
          game: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!room) {
        throw new Error("Room not found");
      }
      if (room.game.code !== "codenames") {
        throw new Error("This room is not a Codenames game");
      }

      const redPlayers = room.players.filter((player) => player.team === "RED");
      const bluePlayers = room.players.filter(
        (player) => player.team === "BLUE",
      );
      if (
        room.players.length < 4 ||
        redPlayers.length < 1 ||
        bluePlayers.length < 1
      ) {
        throw new Error("Need at least 4 players and both teams represented");
      }

      const spymasterAssignment = await assignCodenamesSpymasters(input.roomId);
      if (
        !spymasterAssignment.redSpymasterId ||
        !spymasterAssignment.blueSpymasterId
      ) {
        throw new Error("Failed to assign spymasters");
      }

      const allQuestionIds = room.game.questions.map((question) => question.id);
      if (allQuestionIds.length < 25) {
        throw new Error("Codenames requires at least 25 words");
      }

      const board = shuffleArray(allQuestionIds).slice(0, 25);
      const startingTeam: CodenamesTeam = Math.random() >= 0.5 ? "RED" : "BLUE";
      const otherTeam = getOtherCodenamesTeam(startingTeam);
      const assignmentPool = shuffleArray<CodenamesAssignment>([
        ...Array(9).fill(startingTeam),
        ...Array(8).fill(otherTeam),
        ...Array(7).fill("NEUTRAL"),
        "ASSASSIN",
      ]);
      const assignments: Record<number, CodenamesAssignment> = {};
      board.forEach((questionId, index) => {
        assignments[questionId] = assignmentPool[index] ?? "NEUTRAL";
      });

      const state: CodenamesState = {
        status: "PLAYING",
        board,
        assignments,
        startingTeam,
        turnTeam: startingTeam,
        guessesRemaining: null,
        winner: null,
      };

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          // Codenames state is persisted in Room.currentAnswer.
          currentAnswer: JSON.stringify(state),
          // Revealed cards are persisted in Room.previousQuestionsId.
          previousQuestionsId: [],
          // Spymasters live in Room.playerOneId (RED) and Room.playerTwoId (BLUE).
          playerOneId: spymasterAssignment.redSpymasterId,
          playerTwoId: spymasterAssignment.blueSpymasterId,
          playingTeams: ["RED", "BLUE"],
          gameEnded: false,
          gameEndedAt: null,
          startedAt: new Date(),
        },
      });

      return true;
    }),

  codenamesSetGuesses: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
        number: z.number().int().min(1).max(9),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await prisma.room.findUnique({
        where: { id: input.roomId },
        include: {
          players: true,
          game: true,
        },
      });

      if (!room) {
        throw new Error("Room not found");
      }
      if (room.game.code !== "codenames") {
        throw new Error("This room is not a Codenames game");
      }

      const player = room.players.find((item) => item.id === input.playerId);
      if (!player) {
        throw new Error("Player not found");
      }

      const state = parseCodenamesState(room.currentAnswer);
      if (state.status !== "PLAYING" || state.winner) {
        throw new Error("Game is not in playing state");
      }

      const expectedSpymasterId =
        state.turnTeam === "RED" ? room.playerOneId : room.playerTwoId;
      if (!expectedSpymasterId || expectedSpymasterId !== input.playerId) {
        throw new Error("Only the active spymaster can set guesses");
      }

      state.guessesRemaining = input.number + 1;

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentAnswer: JSON.stringify(state),
        },
      });

      return true;
    }),

  codenamesGuess: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
        questionId: z.number().int(),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await prisma.room.findUnique({
        where: { id: input.roomId },
        include: {
          players: true,
          game: true,
        },
      });

      if (!room) {
        throw new Error("Room not found");
      }
      if (room.game.code !== "codenames") {
        throw new Error("This room is not a Codenames game");
      }

      const player = room.players.find((item) => item.id === input.playerId);
      if (!player) {
        throw new Error("Player not found");
      }

      const state = parseCodenamesState(room.currentAnswer);
      if (state.status !== "PLAYING" || state.winner) {
        throw new Error("Game is not in playing state");
      }
      if (player.team !== state.turnTeam) {
        throw new Error("Only active team can guess");
      }

      const turnSpymasterId =
        state.turnTeam === "RED" ? room.playerOneId : room.playerTwoId;
      if (turnSpymasterId && turnSpymasterId === input.playerId) {
        throw new Error("Spymaster cannot make guesses");
      }
      if (!state.board.includes(input.questionId)) {
        throw new Error("Card is not in this board");
      }
      if (room.previousQuestionsId.includes(input.questionId)) {
        throw new Error("Card already revealed");
      }

      const assignment = state.assignments[input.questionId] ?? "NEUTRAL";
      const revealedIds = [...room.previousQuestionsId, input.questionId];
      const guessingTeam = state.turnTeam;
      let endTurn = false;
      let gameEnded = false;

      await prisma.$transaction(async (tx) => {
        if (assignment === guessingTeam) {
          await normalizeCodenamesTeamStats(tx, room.id, guessingTeam);
          await tx.player.updateMany({
            where: {
              roomId: room.id,
              team: guessingTeam,
            },
            data: {
              points: {
                increment: 1,
              },
            },
          });

          if (state.guessesRemaining !== null) {
            state.guessesRemaining = Math.max(state.guessesRemaining - 1, 0);
          }
          const allOwnCardsRevealed = state.board
            .filter(
              (questionId) => state.assignments[questionId] === guessingTeam,
            )
            .every((questionId) => revealedIds.includes(questionId));

          if (allOwnCardsRevealed) {
            state.status = "ENDED";
            state.winner = guessingTeam;
            gameEnded = true;
          } else if (
            state.guessesRemaining !== null &&
            state.guessesRemaining <= 0
          ) {
            endTurn = true;
          }
        } else if (assignment === "NEUTRAL") {
          await normalizeCodenamesTeamStats(tx, room.id, guessingTeam);
          await tx.player.updateMany({
            where: {
              roomId: room.id,
              team: guessingTeam,
            },
            data: {
              drinks: {
                increment: 1,
              },
            },
          });
          endTurn = true;
        } else if (assignment === "ASSASSIN") {
          await normalizeCodenamesTeamStats(tx, room.id, guessingTeam);
          await tx.player.updateMany({
            where: {
              roomId: room.id,
              team: guessingTeam,
            },
            data: {
              drinks: {
                increment: 1,
              },
            },
          });

          state.status = "ENDED";
          state.winner = getOtherCodenamesTeam(guessingTeam);
          gameEnded = true;
        } else {
          const opponentTeam = assignment;

          await normalizeCodenamesTeamStats(tx, room.id, guessingTeam);
          await normalizeCodenamesTeamStats(tx, room.id, opponentTeam);

          await tx.player.updateMany({
            where: {
              roomId: room.id,
              team: guessingTeam,
            },
            data: {
              drinks: {
                increment: 1,
              },
            },
          });
          await tx.player.updateMany({
            where: {
              roomId: room.id,
              team: opponentTeam,
            },
            data: {
              points: {
                increment: 1,
              },
            },
          });

          const allOpponentCardsRevealed = state.board
            .filter(
              (questionId) => state.assignments[questionId] === opponentTeam,
            )
            .every((questionId) => revealedIds.includes(questionId));

          if (allOpponentCardsRevealed) {
            state.status = "ENDED";
            state.winner = opponentTeam;
            gameEnded = true;
          } else {
            endTurn = true;
          }
        }

        if (!gameEnded && endTurn) {
          state.turnTeam = getOtherCodenamesTeam(guessingTeam);
          state.guessesRemaining = null;
        }

        await tx.room.update({
          where: { id: room.id },
          data: {
            previousQuestionsId: revealedIds,
            currentAnswer: JSON.stringify(state),
            gameEnded,
            gameEndedAt: gameEnded ? new Date() : null,
          },
        });
      });

      return true;
    }),

  codenamesEndTurn: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await prisma.room.findUnique({
        where: { id: input.roomId },
        include: {
          players: true,
          game: true,
        },
      });

      if (!room) {
        throw new Error("Room not found");
      }
      if (room.game.code !== "codenames") {
        throw new Error("This room is not a Codenames game");
      }

      const player = room.players.find((item) => item.id === input.playerId);
      if (!player) {
        throw new Error("Player not found");
      }

      const state = parseCodenamesState(room.currentAnswer);
      if (state.status !== "PLAYING" || state.winner) {
        throw new Error("Game is not in playing state");
      }
      if (player.team !== state.turnTeam) {
        throw new Error("Only active team can end turn");
      }

      state.turnTeam = getOtherCodenamesTeam(state.turnTeam);
      state.guessesRemaining = null;

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentAnswer: JSON.stringify(state),
        },
      });

      return true;
    }),

  memoryChainGuess: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
        questionId: z.number().int(),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await prisma.room.findUnique({
        where: { id: input.roomId },
        include: {
          players: {
            orderBy: {
              createdAt: "asc",
            },
          },
          game: true,
        },
      });

      if (!room) {
        throw new Error("Room not found");
      }
      if (room.game.code !== "memory-chain") {
        throw new Error("This room is not a Memory Chain game");
      }

      if (room.currentPlayerId !== input.playerId) {
        throw new Error("It is not your turn");
      }

      const player = room.players.find((item) => item.id === input.playerId);
      if (!player) {
        throw new Error("Player not found");
      }

      const state = parseMemoryChainState(room.currentAnswer);
      if (state.status !== "PLAYING") {
        throw new Error("Game is not in playing state");
      }
      if (state.pendingMissQuestionId) {
        throw new Error("Finish this turn first using Next Player");
      }
      if (!state.board.includes(input.questionId)) {
        throw new Error("Card is not in this board");
      }
      if (
        state.sequence.length !== MEMORY_CHAIN_CARD_COUNT ||
        state.board.length !== MEMORY_CHAIN_CARD_COUNT
      ) {
        throw new Error("Game board is not initialized correctly");
      }

      const expectedQuestionId = state.sequence[state.progress];
      if (typeof expectedQuestionId !== "number") {
        throw new Error("No expected card available");
      }

      const currentPlayerIndex = room.players.findIndex(
        (item) => item.id === input.playerId,
      );
      const nextPlayerId =
        room.players[
          currentPlayerIndex >= 0
            ? (currentPlayerIndex + 1) % room.players.length
            : 0
        ]?.id ?? input.playerId;

      if (input.questionId === expectedQuestionId) {
        const nextProgress = state.progress + 1;
        state.progress = nextProgress;
        if (!state.revealed.includes(input.questionId)) {
          state.revealed = [...state.revealed, input.questionId];
        }

        let result: "CORRECT" | "WIN" = "CORRECT";
        let gameEnded = false;
        if (nextProgress >= state.sequence.length) {
          state.status = "ENDED";
          state.winnerPlayerId = input.playerId;
          result = "WIN";
          gameEnded = true;
        }
        state.pendingMissQuestionId = null;
        state.pendingMissNextPlayerId = null;

        await prisma.$transaction(async (tx) => {
          await tx.player.update({
            where: {
              id: input.playerId,
            },
            data: {
              points: (player.points ?? 0) + 1,
            },
          });

          await tx.room.update({
            where: { id: input.roomId },
            data: {
              currentAnswer: JSON.stringify(state),
              gameEnded,
              gameEndedAt: gameEnded ? new Date() : null,
            },
          });
        });

        return {
          result,
          progress: state.progress,
          nextPlayerId: input.playerId,
        };
      }

      state.progress = 0;
      state.revealed = [];
      state.pendingMissQuestionId = input.questionId;
      state.pendingMissNextPlayerId = nextPlayerId;

      await prisma.$transaction(async (tx) => {
        await tx.player.update({
          where: {
            id: input.playerId,
          },
          data: {
            drinks: (player.drinks ?? 0) + 1,
          },
        });

        await tx.room.update({
          where: { id: input.roomId },
          data: {
            currentAnswer: JSON.stringify(state),
          },
        });
      });

      return {
        result: "MISS" as const,
        progress: 0,
        nextPlayerId,
      };
    }),

  memoryChainNextPlayer: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await prisma.room.findUnique({
        where: { id: input.roomId },
        include: {
          players: {
            orderBy: {
              createdAt: "asc",
            },
          },
          game: true,
        },
      });

      if (!room) {
        throw new Error("Room not found");
      }
      if (room.game.code !== "memory-chain") {
        throw new Error("This room is not a Memory Chain game");
      }
      if (room.currentPlayerId !== input.playerId) {
        throw new Error("Only the current player can pass turn");
      }

      const state = parseMemoryChainState(room.currentAnswer);
      if (!state.pendingMissQuestionId) {
        return { resolved: false };
      }

      const nextPlayerId =
        state.pendingMissNextPlayerId ||
        room.players[0]?.id ||
        room.currentPlayerId ||
        "";

      state.pendingMissQuestionId = null;
      state.pendingMissNextPlayerId = null;
      state.progress = 0;
      state.revealed = [];

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentPlayerId: nextPlayerId,
          currentAnswer: JSON.stringify(state),
        },
      });

      return { resolved: true, nextPlayerId };
    }),

  guessNumberSetPlayerNumber: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
        number: z.number().int().min(GUESS_THE_NUMBER_MIN).max(GUESS_THE_NUMBER_MAX),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await prisma.room.findUnique({
        where: { id: input.roomId },
        include: {
          players: {
            orderBy: {
              createdAt: "asc",
            },
          },
          game: true,
        },
      });

      if (!room) {
        throw new Error("Room not found");
      }
      if (room.game.code !== "guess-the-number") {
        throw new Error("This room is not Guess The Number");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }

      const player = room.players.find((item) => item.id === input.playerId);
      if (!player) {
        throw new Error("Player not found");
      }

      const playerIds = room.players.map((item) => item.id);
      const state = parseGuessTheNumberState(
        room.currentAnswer,
        playerIds,
        room.currentPlayerId,
      );

      state.playerNumbers[input.playerId] = input.number;
      if (!state.playerOrder.length) {
        state.playerOrder = [...playerIds];
      }

      const allNumbersSet = playerIds.every(
        (playerId) => state.playerNumbers[playerId] !== null,
      );
      if (allNumbersSet && state.status !== "ENDED") {
        state.status = "PLAYING";
      } else if (!allNumbersSet && state.status !== "ENDED") {
        state.status = "SETUP";
      }

      const nextCurrentPlayerId =
        room.currentPlayerId && playerIds.includes(room.currentPlayerId)
          ? room.currentPlayerId
          : state.playerOrder[0] || playerIds[0] || null;

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentPlayerId: nextCurrentPlayerId,
          currentAnswer: JSON.stringify(state),
        },
      });

      return {
        status: state.status,
        allNumbersSet,
      };
    }),

  guessNumberSubmitGuess: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
        guess: z.number().int().min(GUESS_THE_NUMBER_MIN).max(GUESS_THE_NUMBER_MAX),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await prisma.room.findUnique({
        where: { id: input.roomId },
        include: {
          players: {
            orderBy: {
              createdAt: "asc",
            },
          },
          game: true,
        },
      });

      if (!room) {
        throw new Error("Room not found");
      }
      if (room.game.code !== "guess-the-number") {
        throw new Error("This room is not Guess The Number");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }

      const targetPlayerId = room.currentPlayerId;
      if (!targetPlayerId) {
        throw new Error("No target player selected");
      }
      if (input.playerId === targetPlayerId) {
        throw new Error("Target player cannot guess");
      }

      const player = room.players.find((item) => item.id === input.playerId);
      if (!player) {
        throw new Error("Player not found");
      }

      const playerIds = room.players.map((item) => item.id);
      const state = parseGuessTheNumberState(
        room.currentAnswer,
        playerIds,
        targetPlayerId,
      );
      if (state.status !== "PLAYING") {
        throw new Error("All players must set their secret number first");
      }
      if (state.playerNumbers[targetPlayerId] === null) {
        throw new Error("Target player still needs to set a number");
      }

      const existing = state.currentRoundGuesses[input.playerId];
      if (existing) {
        throw new Error("You already guessed this round");
      }

      const targetNumber = state.playerNumbers[targetPlayerId];
      if (targetNumber === null) {
        throw new Error("Target player still needs to set a number");
      }
      const feedback: Exclude<GuessTheNumberFeedback, "PENDING"> =
        input.guess === targetNumber
          ? "CORRECT"
          : input.guess < targetNumber
            ? "UP"
            : "DOWN";

      state.currentRoundGuesses[input.playerId] = {
        guess: input.guess,
        feedback,
      };

      if (!Array.isArray(state.playerDiscoveries[input.playerId])) {
        state.playerDiscoveries[input.playerId] = [];
      }

      if (feedback === "CORRECT") {
        const updatedDiscoveries = Array.from(
          new Set([
            ...state.playerDiscoveries[input.playerId],
            targetPlayerId,
          ]),
        );
        state.playerDiscoveries[input.playerId] = updatedDiscoveries;

        if (updatedDiscoveries.length >= Math.max(playerIds.length - 1, 1)) {
          state.status = "ENDED";
          state.winnerPlayerId = input.playerId;
          state.winnerTargetPlayerId = targetPlayerId;
        }
      }

      const expectedGuessers = playerIds.filter((id) => id !== targetPlayerId);
      const everyoneGuessed = expectedGuessers.every(
        (guesserId) => Boolean(state.currentRoundGuesses[guesserId]),
      );

      let nextTargetPlayerId: string | null = null;
      let gameEnded = false;

      if (everyoneGuessed) {
        const entries = expectedGuessers
          .map((guesserId) => {
            const guessEntry = state.currentRoundGuesses[guesserId];
            if (!guessEntry) return null;
            const normalizedFeedback: Exclude<
              GuessTheNumberFeedback,
              "PENDING"
            > =
              guessEntry.feedback === "PENDING"
                ? guessEntry.guess === targetNumber
                  ? "CORRECT"
                  : guessEntry.guess < targetNumber
                    ? "UP"
                    : "DOWN"
                : guessEntry.feedback;
            return {
              guesserPlayerId: guesserId,
              guess: guessEntry.guess,
              feedback: normalizedFeedback,
            } satisfies GuessTheNumberRoundSummaryEntry;
          })
          .filter(
            (entry): entry is GuessTheNumberRoundSummaryEntry => entry !== null,
          );

        state.roundHistory = [
          ...state.roundHistory,
          {
            targetPlayerId,
            targetNumber,
            entries,
          },
        ];

        state.currentRoundGuesses = {};

        const normalizedOrder =
          state.playerOrder.filter((playerId) => playerIds.includes(playerId))
            .length > 0
            ? state.playerOrder.filter((playerId) => playerIds.includes(playerId))
            : playerIds;
        const targetIndex = normalizedOrder.indexOf(targetPlayerId);
        nextTargetPlayerId =
          normalizedOrder[
            targetIndex >= 0
              ? (targetIndex + 1) % normalizedOrder.length
              : 0
          ] || null;
      }

      await prisma.$transaction(async (tx) => {
        await tx.room.update({
          where: { id: input.roomId },
          data: {
            currentPlayerId: state.status !== "ENDED" && everyoneGuessed
              ? nextTargetPlayerId ?? room.currentPlayerId
              : room.currentPlayerId,
            currentAnswer: JSON.stringify(state),
            gameEnded: room.gameEnded,
            gameEndedAt: room.gameEndedAt,
          },
        });

        if (feedback !== "CORRECT") {
          await tx.player.update({
            where: {
              id: input.playerId,
            },
            data: {
              drinks: {
                increment: 1,
              },
            },
          });
        }
      });

      return {
        feedback,
        roundCompleted: everyoneGuessed,
        nextTargetPlayerId,
        gameEnded: false,
        winnerPlayerId: state.winnerPlayerId,
      };
    }),

  checkForOpenRooms: baseProcedure.query(async () => {
    try {
      const twoHoursAgo = new Date(Date.now() - 120 * 60 * 1000);
      const openRooms = await prisma.room.findMany({
        where: {
          gameEnded: false,
          createdAt: {
            lte: twoHoursAgo,
          },
        },
      });
      return openRooms;
    } catch (error) {
      console.error("Failed to fetch open rooms:", error);
      throw new Error("Failed to fetch open rooms");
    }
  }),

  closeOpenRooms: baseProcedure.mutation(async () => {
    try {
      const twoHoursAgo = new Date(Date.now() - 120 * 60 * 1000);
      await prisma.room.updateMany({
        where: {
          gameEnded: false,
          createdAt: {
            lte: twoHoursAgo,
          },
        },
        data: {
          gameEnded: true,
          gameEndedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error("Failed to close open rooms:", error);
      throw new Error("Failed to close open rooms");
    }
  }),
});
