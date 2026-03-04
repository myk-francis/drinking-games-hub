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
const CONNECT_LETTERS_TIMER_SECONDS = 10;
const GHOST_TEARS_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const REACTION_COOLDOWN_MS = 10 * 60 * 1000;
const JOKER_LOOP_CARDS_PER_PLAYER = 12;
const JOKER_LOOP_JOKER_KEY = "__JOKER__";
const JOKER_LOOP_CARD_TEMPLATES: JokerLoopCardTemplate[] = [
  { word: "Sun", icon: "☀️" },
  { word: "Moon", icon: "🌙" },
  { word: "Star", icon: "⭐" },
  { word: "Cloud", icon: "☁️" },
  { word: "Rain", icon: "🌧️" },
  { word: "Snow", icon: "❄️" },
  { word: "Fire", icon: "🔥" },
  { word: "Water", icon: "💧" },
  { word: "Leaf", icon: "🍃" },
  { word: "Tree", icon: "🌳" },
  { word: "Rose", icon: "🌹" },
  { word: "Apple", icon: "🍎" },
  { word: "Orange", icon: "🍊" },
  { word: "Lemon", icon: "🍋" },
  { word: "Grape", icon: "🍇" },
  { word: "Cherry", icon: "🍒" },
  { word: "Cake", icon: "🍰" },
  { word: "Candy", icon: "🍬" },
  { word: "Coffee", icon: "☕" },
  { word: "Pizza", icon: "🍕" },
  { word: "Burger", icon: "🍔" },
  { word: "Taco", icon: "🌮" },
  { word: "Ball", icon: "⚽" },
  { word: "Dice", icon: "🎲" },
  { word: "Music", icon: "🎵" },
  { word: "Drum", icon: "🥁" },
  { word: "Guitar", icon: "🎸" },
  { word: "Book", icon: "📘" },
  { word: "Pen", icon: "🖊️" },
  { word: "Clock", icon: "⏰" },
  { word: "Phone", icon: "📱" },
  { word: "Camera", icon: "📷" },
  { word: "Car", icon: "🚗" },
  { word: "Train", icon: "🚆" },
  { word: "Plane", icon: "✈️" },
  { word: "Boat", icon: "⛵" },
  { word: "House", icon: "🏠" },
  { word: "Castle", icon: "🏰" },
  { word: "Key", icon: "🔑" },
  { word: "Lock", icon: "🔒" },
  { word: "Crown", icon: "👑" },
  { word: "Ring", icon: "💍" },
  { word: "Gem", icon: "💎" },
  { word: "Rocket", icon: "🚀" },
  { word: "Robot", icon: "🤖" },
  { word: "Alien", icon: "👽" },
  { word: "Ghost", icon: "👻" },
  { word: "Cat", icon: "🐱" },
  { word: "Dog", icon: "🐶" },
  { word: "Lion", icon: "🦁" },
  { word: "Tiger", icon: "🐯" },
  { word: "Panda", icon: "🐼" },
  { word: "Fox", icon: "🦊" },
  { word: "Owl", icon: "🦉" },
  { word: "Bee", icon: "🐝" },
  { word: "Fish", icon: "🐟" },
  { word: "Whale", icon: "🐋" },
  { word: "Octopus", icon: "🐙" },
  { word: "Anchor", icon: "⚓" },
  { word: "Map", icon: "🗺️" },
];

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

type ConnectLettersPhase =
  | "READY"
  | "TIMER_RUNNING"
  | "AWAITING_JUDGMENT"
  | "ROUND_COMPLETE";

type ConnectLettersState = {
  status: "PLAYING" | "ENDED";
  playerOrder: string[];
  currentPair: [string, string] | null;
  usedPairKeys: string[];
  usedLetterKeys: string[];
  roundNumber: number;
  phase: ConnectLettersPhase;
  startLetter: string;
  endLetter: string;
  timerSeconds: number;
  activeChallengerId: string | null;
  activeGuesserId: string | null;
  attemptStartedAt: string | null;
  roundWinnerPlayerId: string | null;
  roundLoserPlayerId: string | null;
};

type GhostTearsPhase = "PICKING" | "AWAITING_JUDGMENT";

type GhostTearsState = {
  status: "PLAYING" | "ENDED";
  playerOrder: string[];
  currentPlayerId: string | null;
  previousPlayerId: string | null;
  phase: GhostTearsPhase;
  letterSequence: string[];
  challengerPlayerId: string | null;
  challengedPlayerId: string | null;
  lastLoserPlayerId: string | null;
  roundNumber: number;
  alphabet: string[];
};

type JokerLoopCardTemplate = {
  word: string;
  icon: string;
};

type JokerLoopCard = JokerLoopCardTemplate & {
  id: string;
  pairKey: string | null;
  isJoker: boolean;
};

type JokerLoopPhase = "REORDERING" | "PICKING" | "ROUND_RESOLUTION" | "ENDED";

type JokerLoopState = {
  status: "PLAYING" | "ENDED";
  phase: JokerLoopPhase;
  roundNumber: number;
  playerOrder: string[];
  roundParticipantIds: string[];
  activeGiverPlayerId: string | null;
  activePickerPlayerId: string | null;
  drawnThisRoundPlayerIds: string[];
  readyByPlayerId: Record<string, boolean>;
  handsByPlayerId: Record<string, JokerLoopCard[]>;
  jokerHolderPlayerId: string | null;
  lastRoundClearedPlayerIds: string[];
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

function getConnectLettersPairKey(playerAId: string, playerBId: string): string {
  return [playerAId, playerBId].sort().join("&");
}

function getAllConnectLettersPairs(playerIds: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < playerIds.length; i += 1) {
    for (let j = i + 1; j < playerIds.length; j += 1) {
      pairs.push([playerIds[i], playerIds[j]]);
    }
  }
  return pairs;
}

function getConnectLettersLetterKey(startLetter: string, endLetter: string): string {
  return `${startLetter}${endLetter}`;
}

function getAllConnectLettersRanges(): { startLetter: string; endLetter: string }[] {
  const ranges: { startLetter: string; endLetter: string }[] = [];
  for (let startIndex = 0; startIndex < 26; startIndex += 1) {
    for (let endIndex = 0; endIndex < 26; endIndex += 1) {
      ranges.push({
        startLetter: String.fromCharCode(65 + startIndex),
        endLetter: String.fromCharCode(65 + endIndex),
      });
    }
  }
  return ranges;
}

function pickNextConnectLettersRange(
  usedLetterKeys: string[],
): {
  range: { startLetter: string; endLetter: string };
  nextUsedLetterKeys: string[];
} {
  const allRanges = getAllConnectLettersRanges();
  const used = new Set(usedLetterKeys);
  const availableRanges = allRanges.filter(
    ({ startLetter, endLetter }) =>
      !used.has(getConnectLettersLetterKey(startLetter, endLetter)),
  );
  const candidateRanges = availableRanges.length > 0 ? availableRanges : allRanges;
  const chosenRange =
    candidateRanges[Math.floor(Math.random() * candidateRanges.length)];
  const chosenKey = getConnectLettersLetterKey(
    chosenRange.startLetter,
    chosenRange.endLetter,
  );

  return {
    range: chosenRange,
    nextUsedLetterKeys:
      availableRanges.length > 0 ? [...usedLetterKeys, chosenKey] : [chosenKey],
  };
}

function pickNextConnectLettersPair(
  playerIds: string[],
  usedPairKeys: string[],
): { pair: [string, string]; nextUsedPairKeys: string[] } | null {
  const allPairs = getAllConnectLettersPairs(playerIds);
  if (!allPairs.length) {
    return null;
  }

  const used = new Set(usedPairKeys);
  const availablePairs = allPairs.filter(
    ([playerAId, playerBId]) =>
      !used.has(getConnectLettersPairKey(playerAId, playerBId)),
  );
  const candidatePairs = availablePairs.length > 0 ? availablePairs : allPairs;
  const chosenPair =
    candidatePairs[Math.floor(Math.random() * candidatePairs.length)];
  const chosenKey = getConnectLettersPairKey(chosenPair[0], chosenPair[1]);

  return {
    pair: chosenPair,
    nextUsedPairKeys:
      availablePairs.length > 0 ? [...usedPairKeys, chosenKey] : [chosenKey],
  };
}

function getDefaultConnectLettersState(playerIds: string[]): ConnectLettersState {
  const normalizedOrder = [...playerIds];
  const initialPair = pickNextConnectLettersPair(normalizedOrder, []);
  const initialLetters = pickNextConnectLettersRange([]);

  return {
    status: initialPair ? "PLAYING" : "ENDED",
    playerOrder: normalizedOrder,
    currentPair: initialPair ? initialPair.pair : null,
    usedPairKeys: initialPair ? initialPair.nextUsedPairKeys : [],
    usedLetterKeys: initialLetters.nextUsedLetterKeys,
    roundNumber: initialPair ? 1 : 0,
    phase: initialPair ? "READY" : "ROUND_COMPLETE",
    startLetter: initialLetters.range.startLetter,
    endLetter: initialLetters.range.endLetter,
    timerSeconds: CONNECT_LETTERS_TIMER_SECONDS,
    activeChallengerId: null,
    activeGuesserId: null,
    attemptStartedAt: null,
    roundWinnerPlayerId: null,
    roundLoserPlayerId: null,
  };
}

function parseConnectLettersState(
  raw: string | null,
  playerIds: string[],
): ConnectLettersState {
  const fallback = getDefaultConnectLettersState(playerIds);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<ConnectLettersState>;
    const normalizedOrder = [
      ...(Array.isArray(parsed.playerOrder)
        ? parsed.playerOrder.filter((id): id is string => playerIds.includes(id))
        : []),
      ...playerIds.filter(
        (id) =>
          !(
            Array.isArray(parsed.playerOrder) && parsed.playerOrder.includes(id)
          ),
      ),
    ];

    const parsedPair: [string, string] | null =
      Array.isArray(parsed.currentPair) &&
      parsed.currentPair.length === 2 &&
      typeof parsed.currentPair[0] === "string" &&
      typeof parsed.currentPair[1] === "string" &&
      parsed.currentPair[0] !== parsed.currentPair[1] &&
      playerIds.includes(parsed.currentPair[0]) &&
      playerIds.includes(parsed.currentPair[1])
        ? [parsed.currentPair[0], parsed.currentPair[1]]
        : null;

    const nextPairSource =
      parsedPair ||
      pickNextConnectLettersPair(normalizedOrder, parsed.usedPairKeys ?? [])?.pair ||
      fallback.currentPair;

    const parsedStartLetter =
      typeof parsed.startLetter === "string" &&
      /^[A-Z]$/.test(parsed.startLetter)
        ? parsed.startLetter
        : null;
    const parsedEndLetter =
      typeof parsed.endLetter === "string" && /^[A-Z]$/.test(parsed.endLetter)
        ? parsed.endLetter
        : null;
    const normalizedUsedLetterKeys = Array.isArray(parsed.usedLetterKeys)
      ? parsed.usedLetterKeys.filter(
          (item): item is string => typeof item === "string" && item.length > 0,
        )
      : [];

    const letters =
      parsedStartLetter && parsedEndLetter
        ? { startLetter: parsedStartLetter, endLetter: parsedEndLetter }
        : pickNextConnectLettersRange(normalizedUsedLetterKeys).range;

    const currentLetterKey = getConnectLettersLetterKey(
      letters.startLetter,
      letters.endLetter,
    );
    const nextUsedLetterKeys = normalizedUsedLetterKeys.includes(currentLetterKey)
      ? normalizedUsedLetterKeys
      : [...normalizedUsedLetterKeys, currentLetterKey];

    const normalizedUsedPairKeys = Array.isArray(parsed.usedPairKeys)
      ? parsed.usedPairKeys.filter(
          (item): item is string => typeof item === "string" && item.length > 0,
        )
      : fallback.usedPairKeys;

    const activeChallengerId =
      typeof parsed.activeChallengerId === "string" &&
      playerIds.includes(parsed.activeChallengerId)
        ? parsed.activeChallengerId
        : null;
    const activeGuesserId =
      typeof parsed.activeGuesserId === "string" &&
      playerIds.includes(parsed.activeGuesserId)
        ? parsed.activeGuesserId
        : null;

    const phase: ConnectLettersPhase =
      parsed.phase === "TIMER_RUNNING" ||
      parsed.phase === "AWAITING_JUDGMENT" ||
      parsed.phase === "ROUND_COMPLETE"
        ? parsed.phase
        : "READY";
    const status: ConnectLettersState["status"] =
      parsed.status === "ENDED" || playerIds.length < 2 ? "ENDED" : "PLAYING";

    return {
      status,
      playerOrder: normalizedOrder,
      currentPair: nextPairSource,
      usedPairKeys: normalizedUsedPairKeys,
      usedLetterKeys: nextUsedLetterKeys,
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber >= 1
          ? parsed.roundNumber
          : fallback.roundNumber,
      phase: status === "ENDED" ? "ROUND_COMPLETE" : phase,
      startLetter: letters.startLetter,
      endLetter: letters.endLetter,
      timerSeconds:
        typeof parsed.timerSeconds === "number" &&
        Number.isFinite(parsed.timerSeconds) &&
        parsed.timerSeconds > 0
          ? parsed.timerSeconds
          : CONNECT_LETTERS_TIMER_SECONDS,
      activeChallengerId,
      activeGuesserId,
      attemptStartedAt:
        typeof parsed.attemptStartedAt === "string" ? parsed.attemptStartedAt : null,
      roundWinnerPlayerId:
        typeof parsed.roundWinnerPlayerId === "string" &&
        playerIds.includes(parsed.roundWinnerPlayerId)
          ? parsed.roundWinnerPlayerId
          : null,
      roundLoserPlayerId:
        typeof parsed.roundLoserPlayerId === "string" &&
        playerIds.includes(parsed.roundLoserPlayerId)
          ? parsed.roundLoserPlayerId
          : null,
    };
  } catch {
    return fallback;
  }
}

function getConnectLettersOpponent(
  pair: [string, string] | null,
  playerId: string,
): string | null {
  if (!pair) return null;
  if (pair[0] === playerId) return pair[1];
  if (pair[1] === playerId) return pair[0];
  return null;
}

function getDefaultGhostTearsState(
  playerIds: string[],
  startingCurrentPlayerId: string | null,
): GhostTearsState {
  const normalizedOrder = [...playerIds];
  const initialCurrentPlayerId =
    startingCurrentPlayerId && normalizedOrder.includes(startingCurrentPlayerId)
      ? startingCurrentPlayerId
      : normalizedOrder[0] ?? null;

  return {
    status: normalizedOrder.length < 2 ? "ENDED" : "PLAYING",
    playerOrder: normalizedOrder,
    currentPlayerId: initialCurrentPlayerId,
    previousPlayerId: null,
    phase: "PICKING",
    letterSequence: [],
    challengerPlayerId: null,
    challengedPlayerId: null,
    lastLoserPlayerId: null,
    roundNumber: 1,
    alphabet: [...GHOST_TEARS_ALPHABET],
  };
}

function parseGhostTearsState(
  raw: string | null,
  playerIds: string[],
  currentPlayerId: string | null,
): GhostTearsState {
  const fallback = getDefaultGhostTearsState(playerIds, currentPlayerId);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<GhostTearsState>;
    const normalizedOrder = [
      ...(Array.isArray(parsed.playerOrder)
        ? parsed.playerOrder.filter((id): id is string => playerIds.includes(id))
        : []),
      ...playerIds.filter(
        (id) =>
          !(Array.isArray(parsed.playerOrder) && parsed.playerOrder.includes(id)),
      ),
    ];

    const parsedCurrentPlayerId =
      typeof parsed.currentPlayerId === "string" &&
      playerIds.includes(parsed.currentPlayerId)
        ? parsed.currentPlayerId
        : fallback.currentPlayerId;
    const parsedPreviousPlayerId =
      typeof parsed.previousPlayerId === "string" &&
      playerIds.includes(parsed.previousPlayerId)
        ? parsed.previousPlayerId
        : null;

    const parsedPhase: GhostTearsPhase =
      parsed.phase === "AWAITING_JUDGMENT" ? "AWAITING_JUDGMENT" : "PICKING";
    const parsedChallengerPlayerId =
      typeof parsed.challengerPlayerId === "string" &&
      playerIds.includes(parsed.challengerPlayerId)
        ? parsed.challengerPlayerId
        : null;
    const parsedChallengedPlayerId =
      typeof parsed.challengedPlayerId === "string" &&
      playerIds.includes(parsed.challengedPlayerId)
        ? parsed.challengedPlayerId
        : null;

    const phase: GhostTearsPhase =
      parsedPhase === "AWAITING_JUDGMENT" &&
      parsedChallengerPlayerId &&
      parsedChallengedPlayerId &&
      parsedChallengerPlayerId !== parsedChallengedPlayerId
        ? "AWAITING_JUDGMENT"
        : "PICKING";

    return {
      status: normalizedOrder.length < 2 ? "ENDED" : "PLAYING",
      playerOrder: normalizedOrder,
      currentPlayerId: parsedCurrentPlayerId,
      previousPlayerId: parsedPreviousPlayerId,
      phase,
      letterSequence: Array.isArray(parsed.letterSequence)
        ? parsed.letterSequence.filter(
            (letter): letter is string =>
              typeof letter === "string" &&
              letter.length === 1 &&
              GHOST_TEARS_ALPHABET.includes(letter),
          )
        : [],
      challengerPlayerId: phase === "AWAITING_JUDGMENT" ? parsedChallengerPlayerId : null,
      challengedPlayerId: phase === "AWAITING_JUDGMENT" ? parsedChallengedPlayerId : null,
      lastLoserPlayerId:
        typeof parsed.lastLoserPlayerId === "string" &&
        playerIds.includes(parsed.lastLoserPlayerId)
          ? parsed.lastLoserPlayerId
          : null,
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber >= 1
          ? parsed.roundNumber
          : 1,
      alphabet: [...GHOST_TEARS_ALPHABET],
    };
  } catch {
    return fallback;
  }
}

function getNextPlayerIdInOrder(
  players: Array<{ id: string }>,
  currentPlayerId: string,
): string {
  if (players.length === 0) {
    return currentPlayerId;
  }

  const currentPlayerIndex = players.findIndex(
    (item) => item.id === currentPlayerId,
  );
  if (currentPlayerIndex < 0) {
    return players[0]?.id ?? currentPlayerId;
  }

  return players[(currentPlayerIndex + 1) % players.length]?.id ?? currentPlayerId;
}

function getNextPlayerWithCards(
  state: JokerLoopState,
  fromPlayerId: string,
): string | null {
  const startIndex = state.playerOrder.indexOf(fromPlayerId);
  if (startIndex === -1) {
    return null;
  }

  for (let step = 1; step <= state.playerOrder.length; step += 1) {
    const nextIndex = (startIndex + step) % state.playerOrder.length;
    const nextPlayerId = state.playerOrder[nextIndex];
    const nextHand = state.handsByPlayerId[nextPlayerId] ?? [];
    if (nextHand.length > 0) {
      return nextPlayerId;
    }
  }

  return null;
}

function findJokerHolder(handsByPlayerId: Record<string, JokerLoopCard[]>): string | null {
  for (const [playerId, hand] of Object.entries(handsByPlayerId)) {
    if (hand.some((card) => card.isJoker)) {
      return playerId;
    }
  }
  return null;
}

function removePairsFromHand(hand: JokerLoopCard[]): JokerLoopCard[] {
  const counts = new Map<string, number>();
  for (const card of hand) {
    if (card.isJoker || !card.pairKey) continue;
    counts.set(card.pairKey, (counts.get(card.pairKey) ?? 0) + 1);
  }

  const removalsByKey = new Map<string, number>();
  for (const [pairKey, count] of counts.entries()) {
    removalsByKey.set(pairKey, Math.floor(count / 2) * 2);
  }

  const next: JokerLoopCard[] = [];
  for (const card of hand) {
    if (card.isJoker || !card.pairKey) {
      next.push(card);
      continue;
    }

    const remaining = removalsByKey.get(card.pairKey) ?? 0;
    if (remaining > 0) {
      removalsByKey.set(card.pairKey, remaining - 1);
      continue;
    }
    next.push(card);
  }

  return next;
}

function buildJokerLoopState(playerIds: string[]): JokerLoopState {
  const pairCount = Math.floor((playerIds.length * JOKER_LOOP_CARDS_PER_PLAYER) / 2);
  if (pairCount > JOKER_LOOP_CARD_TEMPLATES.length) {
    throw new Error("Joker Loop card template pool is too small.");
  }

  const templates = shuffleArray(JOKER_LOOP_CARD_TEMPLATES).slice(0, pairCount);
  const deck: JokerLoopCard[] = [];
  for (const template of templates) {
    const pairKey = `${template.word}|${template.icon}`;
    deck.push({
      id: `${pairKey}:A:${Math.random().toString(36).slice(2, 9)}`,
      word: template.word,
      icon: template.icon,
      pairKey,
      isJoker: false,
    });
    deck.push({
      id: `${pairKey}:B:${Math.random().toString(36).slice(2, 9)}`,
      word: template.word,
      icon: template.icon,
      pairKey,
      isJoker: false,
    });
  }
  deck.push({
    id: `${JOKER_LOOP_JOKER_KEY}:${Math.random().toString(36).slice(2, 9)}`,
    word: "Joker",
    icon: "🃏",
    pairKey: null,
    isJoker: true,
  });

  const shuffledDeck = shuffleArray(deck);
  const handsByPlayerId: Record<string, JokerLoopCard[]> = {};
  for (const playerId of playerIds) {
    handsByPlayerId[playerId] = [];
  }

  for (let index = 0; index < shuffledDeck.length; index += 1) {
    const playerId = playerIds[index % playerIds.length];
    handsByPlayerId[playerId].push(shuffledDeck[index]);
  }

  for (const playerId of playerIds) {
    handsByPlayerId[playerId] = shuffleArray(handsByPlayerId[playerId]);
  }

  const activeGiverPlayerId =
    playerIds.find((playerId) => (handsByPlayerId[playerId] ?? []).length > 0) ?? null;
  const activePickerPlayerId = activeGiverPlayerId
    ? getNextPlayerWithCards(
        {
          status: "PLAYING",
          phase: "REORDERING",
          roundNumber: 1,
          playerOrder: playerIds,
          roundParticipantIds: playerIds.filter(
            (playerId) => (handsByPlayerId[playerId] ?? []).length > 0,
          ),
          activeGiverPlayerId,
          activePickerPlayerId: null,
          drawnThisRoundPlayerIds: [],
          readyByPlayerId: {},
          handsByPlayerId,
          jokerHolderPlayerId: null,
          lastRoundClearedPlayerIds: [],
        },
        activeGiverPlayerId,
      )
    : null;

  return {
    status: "PLAYING",
    phase: "REORDERING",
    roundNumber: 1,
    playerOrder: [...playerIds],
    roundParticipantIds: playerIds.filter(
      (playerId) => (handsByPlayerId[playerId] ?? []).length > 0,
    ),
    activeGiverPlayerId,
    activePickerPlayerId,
    drawnThisRoundPlayerIds: [],
    readyByPlayerId: Object.fromEntries(playerIds.map((playerId) => [playerId, false])),
    handsByPlayerId,
    jokerHolderPlayerId: findJokerHolder(handsByPlayerId),
    lastRoundClearedPlayerIds: [],
  };
}

function parseJokerLoopState(raw: string | null, playerIds: string[]): JokerLoopState {
  const fallback = buildJokerLoopState(playerIds);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<JokerLoopState>;
    const normalizedOrder = [
      ...(Array.isArray(parsed.playerOrder)
        ? parsed.playerOrder.filter((playerId): playerId is string =>
            playerIds.includes(playerId),
          )
        : []),
      ...playerIds.filter(
        (playerId) =>
          !(
            Array.isArray(parsed.playerOrder) &&
            parsed.playerOrder.includes(playerId)
          ),
      ),
    ];

    const handsByPlayerId: Record<string, JokerLoopCard[]> = {};
    for (const playerId of normalizedOrder) {
      const rawHand =
        parsed.handsByPlayerId &&
        typeof parsed.handsByPlayerId === "object" &&
        Array.isArray((parsed.handsByPlayerId as Record<string, unknown>)[playerId])
          ? ((parsed.handsByPlayerId as Record<string, unknown>)[
              playerId
            ] as unknown[])
          : [];
      handsByPlayerId[playerId] = rawHand
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const card = entry as Partial<JokerLoopCard>;
          if (
            typeof card.id !== "string" ||
            typeof card.word !== "string" ||
            typeof card.icon !== "string" ||
            typeof card.isJoker !== "boolean"
          ) {
            return null;
          }
          return {
            id: card.id,
            word: card.word,
            icon: card.icon,
            pairKey: typeof card.pairKey === "string" ? card.pairKey : null,
            isJoker: card.isJoker,
          } satisfies JokerLoopCard;
        })
        .filter((card): card is JokerLoopCard => card !== null);
    }

    const activeGiverPlayerId =
      typeof parsed.activeGiverPlayerId === "string" &&
      normalizedOrder.includes(parsed.activeGiverPlayerId)
        ? parsed.activeGiverPlayerId
        : fallback.activeGiverPlayerId;
    const activePickerPlayerId =
      typeof parsed.activePickerPlayerId === "string" &&
      normalizedOrder.includes(parsed.activePickerPlayerId)
        ? parsed.activePickerPlayerId
        : activeGiverPlayerId
          ? getNextPlayerWithCards(
              {
                ...fallback,
                playerOrder: normalizedOrder,
                handsByPlayerId,
              },
              activeGiverPlayerId,
            )
          : null;

    const roundParticipantIds = Array.isArray(parsed.roundParticipantIds)
      ? parsed.roundParticipantIds.filter((playerId): playerId is string =>
          normalizedOrder.includes(playerId),
        )
      : normalizedOrder.filter(
          (playerId) => (handsByPlayerId[playerId] ?? []).length > 0,
        );

    const readyByPlayerId: Record<string, boolean> = {};
    for (const playerId of normalizedOrder) {
      const value =
        parsed.readyByPlayerId &&
        typeof parsed.readyByPlayerId === "object" &&
        typeof (parsed.readyByPlayerId as Record<string, unknown>)[playerId] ===
          "boolean"
          ? ((parsed.readyByPlayerId as Record<string, unknown>)[
              playerId
            ] as boolean)
          : false;
      readyByPlayerId[playerId] = value;
    }

    return {
      status: parsed.status === "ENDED" ? "ENDED" : "PLAYING",
      phase:
        parsed.phase === "PICKING" ||
        parsed.phase === "ROUND_RESOLUTION" ||
        parsed.phase === "ENDED"
          ? parsed.phase
          : "REORDERING",
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber >= 1
          ? parsed.roundNumber
          : 1,
      playerOrder: normalizedOrder,
      roundParticipantIds,
      activeGiverPlayerId,
      activePickerPlayerId,
      drawnThisRoundPlayerIds: Array.isArray(parsed.drawnThisRoundPlayerIds)
        ? parsed.drawnThisRoundPlayerIds.filter((playerId): playerId is string =>
            normalizedOrder.includes(playerId),
          )
        : [],
      readyByPlayerId,
      handsByPlayerId,
      jokerHolderPlayerId: findJokerHolder(handsByPlayerId),
      lastRoundClearedPlayerIds: Array.isArray(parsed.lastRoundClearedPlayerIds)
        ? parsed.lastRoundClearedPlayerIds.filter((playerId): playerId is string =>
            normalizedOrder.includes(playerId),
          )
        : [],
    };
  } catch {
    return fallback;
  }
}

async function applyGhostTearsRoundOutcome(
  tx: { player: typeof prisma.player },
  roomId: string,
  playerIds: string[],
  loserPlayerId: string,
) {
  await tx.player.updateMany({
    where: {
      roomId,
      id: {
        in: playerIds,
      },
      points: null,
    },
    data: {
      points: 0,
    },
  });

  await tx.player.updateMany({
    where: {
      roomId,
      id: {
        in: playerIds,
      },
      drinks: null,
    },
    data: {
      drinks: 0,
    },
  });

  await tx.player.update({
    where: {
      id: loserPlayerId,
    },
    data: {
      drinks: {
        increment: 1,
      },
    },
  });

  const winners = playerIds.filter((id) => id !== loserPlayerId);
  if (winners.length > 0) {
    await tx.player.updateMany({
      where: {
        roomId,
        id: {
          in: winners,
        },
      },
      data: {
        points: {
          increment: 1,
        },
      },
    });
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
  getTopPlayersByGame: baseProcedure
    .input(
      z.object({
        gameCode: z.string().min(1, { message: "Game code is required" }),
      }),
    )
    .query(async ({ input }) => {
      const players = await prisma.player.findMany({
        where: {
          room: {
            game: {
              code: input.gameCode,
            },
          },
        },
        select: {
          name: true,
          points: true,
          drinks: true,
        },
      });

      const totalsByName = new Map<
        string,
        {
          id: string;
          name: string;
          points: number;
          drinks: number;
          ratio: number;
        }
      >();

      for (const player of players) {
        const normalizedName = player.name.trim().toLowerCase();
        const current = totalsByName.get(normalizedName) ?? {
          id: `name:${normalizedName}`,
          name: player.name,
          points: 0,
          drinks: 0,
          ratio: 0,
        };

        current.points += Math.max(0, player.points ?? 0);
        current.drinks += Math.max(0, player.drinks ?? 0);
        current.ratio = current.points / Math.max(1, current.drinks);

        totalsByName.set(normalizedName, current);
      }

      return Array.from(totalsByName.values())
        .filter((entry) => entry.points > 0 || entry.drinks > 0)
        .sort((a, b) => {
          if (b.ratio !== a.ratio) return b.ratio - a.ratio;
          if (b.points !== a.points) return b.points - a.points;
          if (a.drinks !== b.drinks) return a.drinks - b.drinks;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 10);
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
  getRoomReactions: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1, { message: "Room ID is required" }),
      }),
    )
    .query(async ({ input }) => {
      const reactions = await prisma.reaction.findMany({
        where: {
          roomId: input.roomId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 120,
        include: {
          senderPlayer: {
            select: {
              id: true,
              name: true,
            },
          },
          targetPlayer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return reactions.reverse();
    }),
  sendReaction: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1, { message: "Room ID is required" }),
        senderPlayerId: z.string().min(1, { message: "Sender is required" }),
        targetPlayerId: z.string().optional(),
        emoji: z
          .string()
          .trim()
          .min(1, { message: "Emoji is required" })
          .max(8, { message: "Invalid emoji" }),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await prisma.room.findUnique({
        where: {
          id: input.roomId,
        },
        select: {
          id: true,
          gameEnded: true,
          players: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!room) {
        throw new Error("Room not found");
      }
      if (room.gameEnded) {
        throw new Error("Reactions are only available while a game is active.");
      }

      const playerIds = new Set(room.players.map((player) => player.id));
      if (!playerIds.has(input.senderPlayerId)) {
        throw new Error("Sender is not in this room.");
      }
      if (input.targetPlayerId && !playerIds.has(input.targetPlayerId)) {
        throw new Error("Target player is not in this room.");
      }

      const lastReaction = await prisma.reaction.findFirst({
        where: {
          roomId: input.roomId,
          senderPlayerId: input.senderPlayerId,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          createdAt: true,
        },
      });

      if (lastReaction) {
        const elapsedMs = Date.now() - lastReaction.createdAt.getTime();
        if (elapsedMs < REACTION_COOLDOWN_MS) {
          const remainingSeconds = Math.ceil(
            (REACTION_COOLDOWN_MS - elapsedMs) / 1000,
          );
          throw new Error(
            `You can send your next reaction in ${remainingSeconds}s.`,
          );
        }
      }

      const created = await prisma.reaction.create({
        data: {
          roomId: input.roomId,
          senderPlayerId: input.senderPlayerId,
          targetPlayerId: input.targetPlayerId ?? null,
          emoji: input.emoji,
        },
      });

      return created;
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
        if (
          input.selectedGame === "connect-the-letters" &&
          (input.players?.length || 0) < 2
        ) {
          throw new Error("Connect The Letters requires at least 2 players.");
        }
        if (
          input.selectedGame === "ghost-tears" &&
          (input.players?.length || 0) < 2
        ) {
          throw new Error("Ghost Tears requires at least 2 players.");
        }
        if (
          input.selectedGame === "joker-loop" &&
          (input.players?.length || 0) < 2
        ) {
          throw new Error("Joker Loop requires at least 2 players.");
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
          let jokerLoopCurrentPlayerId: string | null = null;

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
          if (input.selectedGame === "connect-the-letters") {
            const playerIds = createdRoom.players.map((player) => player.id);
            roomCurrentAnswer = JSON.stringify(
              getDefaultConnectLettersState(playerIds),
            );
          }
          if (input.selectedGame === "ghost-tears") {
            const playerIds = createdRoom.players.map((player) => player.id);
            roomCurrentAnswer = JSON.stringify(
              getDefaultGhostTearsState(playerIds, randomCurrentPlayerId),
            );
          }
          if (input.selectedGame === "joker-loop") {
            const playerIds = createdRoom.players.map((player) => player.id);
            const jokerLoopState = buildJokerLoopState(playerIds);
            roomCurrentAnswer = JSON.stringify(jokerLoopState);
            jokerLoopCurrentPlayerId = jokerLoopState.activeGiverPlayerId;
          }

          const createdRoomId = createdRoom.id;
          await prisma.room.update({
            where: { id: createdRoomId },
            data: {
              currentPlayerId:
                input.selectedGame === "joker-loop"
                  ? jokerLoopCurrentPlayerId
                  : randomCurrentPlayerId,
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

  imposterResolveRound: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        currentPlayerId: z.string().min(1),
        currentQuestionId: z.string().min(1),
        wasFound: z.boolean(),
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
        if (room.game.code !== "imposter") {
          throw new Error("This room is not Imposter");
        }
        if (room.currentPlayerId !== input.currentPlayerId) {
          throw new Error("Only the current imposter can resolve this round");
        }
        if (room.players.length < 2) {
          throw new Error("Imposter requires at least 2 players");
        }

        const allPlayerIds = room.players.map((player) => player.id);
        const otherPlayerIds = allPlayerIds.filter(
          (playerId) => playerId !== input.currentPlayerId,
        );
        const nextPlayerId = getNextPlayerIdInOrder(
          room.players,
          input.currentPlayerId,
        );

        let nextQuestionId: number | null = null;
        let previousQuestionsIds = room.previousQuestionsId || [];
        const parsedCurrentQuestionId = Number.parseInt(input.currentQuestionId, 10);
        const excludedQuestionIds = Number.isFinite(parsedCurrentQuestionId)
          ? [...previousQuestionsIds, parsedCurrentQuestionId]
          : [...previousQuestionsIds];

        const allQuestionIds = room.game.questions.map((question) => question.id);
        const remainingQuestionIds = allQuestionIds.filter(
          (questionId) => !excludedQuestionIds.includes(questionId),
        );

        if (remainingQuestionIds.length > 0) {
          nextQuestionId =
            remainingQuestionIds[
              Math.floor(Math.random() * remainingQuestionIds.length)
            ];
          if (Number.isFinite(parsedCurrentQuestionId)) {
            previousQuestionsIds = [...previousQuestionsIds, parsedCurrentQuestionId];
          }
        } else {
          nextQuestionId =
            room.game.questions[
              Math.floor(Math.random() * room.game.questions.length)
            ]?.id || null;
          previousQuestionsIds = [];
        }

        await prisma.$transaction(async (tx) => {
          if (input.wasFound) {
            await tx.player.update({
              where: { id: input.currentPlayerId },
              data: {
                drinks: {
                  increment: 1,
                },
              },
            });

            await tx.player.updateMany({
              where: {
                roomId: input.roomId,
                id: {
                  in: otherPlayerIds,
                },
              },
              data: {
                points: {
                  increment: 1,
                },
              },
            });
          } else {
            await tx.player.update({
              where: { id: input.currentPlayerId },
              data: {
                points: {
                  increment: 1,
                },
              },
            });

            await tx.player.updateMany({
              where: {
                roomId: input.roomId,
                id: {
                  in: otherPlayerIds,
                },
              },
              data: {
                drinks: {
                  increment: 1,
                },
              },
            });
          }

          await tx.room.update({
            where: { id: input.roomId },
            data: {
              currentPlayerId: nextPlayerId,
              currentQuestionId: nextQuestionId,
              previousQuestionsId: previousQuestionsIds,
            },
          });
        });

        return {
          nextPlayerId,
          nextQuestionId,
          wasFound: input.wasFound,
        };
      } catch (error) {
        console.error("Failed to resolve imposter round:", error);
        throw new Error("Failed to resolve imposter round");
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

      const nextPlayerId = getNextPlayerIdInOrder(room.players, input.playerId);

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
              currentPlayerId: gameEnded ? input.playerId : nextPlayerId,
              currentAnswer: JSON.stringify(state),
              gameEnded,
              gameEndedAt: gameEnded ? new Date() : null,
            },
          });
        });

        return {
          result,
          progress: state.progress,
          nextPlayerId: gameEnded ? input.playerId : nextPlayerId,
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

        if (feedback === "CORRECT") {
          await tx.player.update({
            where: {
              id: input.playerId,
            },
            data: {
              points: {
                increment: 1,
              },
            },
          });
        } else {
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

  connectLettersBuzz: baseProcedure
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
      if (room.game.code !== "connect-the-letters") {
        throw new Error("This room is not Connect The Letters");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (room.players.length < 2) {
        throw new Error("At least 2 players are required");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parseConnectLettersState(room.currentAnswer, playerIds);
      if (state.status !== "PLAYING") {
        throw new Error("Game is not in playing state");
      }
      if (state.phase !== "READY") {
        throw new Error("This round has already started");
      }
      if (!state.currentPair || !state.currentPair.includes(input.playerId)) {
        throw new Error("You are not in the current pair");
      }

      const opponentPlayerId = getConnectLettersOpponent(
        state.currentPair,
        input.playerId,
      );
      if (!opponentPlayerId) {
        throw new Error("Could not resolve opponent");
      }

      state.phase = "TIMER_RUNNING";
      // The player who buzzes is judged first.
      state.activeGuesserId = input.playerId;
      state.activeChallengerId = opponentPlayerId;
      state.attemptStartedAt = new Date().toISOString();
      state.roundWinnerPlayerId = null;
      state.roundLoserPlayerId = null;

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentPlayerId: input.playerId,
          currentAnswer: JSON.stringify(state),
        },
      });

      return {
        challengerPlayerId: opponentPlayerId,
        guesserPlayerId: input.playerId,
      };
    }),

  connectLettersStopTimer: baseProcedure
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
      if (room.game.code !== "connect-the-letters") {
        throw new Error("This room is not Connect The Letters");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parseConnectLettersState(room.currentAnswer, playerIds);
      if (state.phase !== "TIMER_RUNNING") {
        throw new Error("Timer is not running");
      }
      if (!state.currentPair || !state.currentPair.includes(input.playerId)) {
        throw new Error("Only players in the current pair can stop timer");
      }

      state.phase = "AWAITING_JUDGMENT";

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentAnswer: JSON.stringify(state),
        },
      });

      return {
        awaitingJudgment: true,
      };
    }),

  connectLettersJudge: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
        verdict: z.enum(["RIGHT", "WRONG"]),
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
      if (room.game.code !== "connect-the-letters") {
        throw new Error("This room is not Connect The Letters");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parseConnectLettersState(room.currentAnswer, playerIds);
      if (state.phase !== "AWAITING_JUDGMENT") {
        throw new Error("No active judgment to resolve");
      }
      if (state.activeChallengerId !== input.playerId) {
        throw new Error("Only the challenger can judge");
      }

      const challengerPlayerId = state.activeChallengerId;
      const guesserPlayerId = state.activeGuesserId;
      if (!challengerPlayerId || !guesserPlayerId) {
        throw new Error("Round state is invalid");
      }

      if (input.verdict === "RIGHT") {
        state.phase = "ROUND_COMPLETE";
        state.roundWinnerPlayerId = guesserPlayerId;
        state.roundLoserPlayerId = challengerPlayerId;
        state.attemptStartedAt = null;

        await prisma.$transaction(async (tx) => {
          await tx.player.updateMany({
            where: {
              id: guesserPlayerId,
              points: null,
            },
            data: {
              points: 0,
            },
          });
          await tx.player.updateMany({
            where: {
              id: challengerPlayerId,
              drinks: null,
            },
            data: {
              drinks: 0,
            },
          });

          await tx.player.update({
            where: {
              id: guesserPlayerId,
            },
            data: {
              points: {
                increment: 1,
              },
            },
          });

          await tx.player.update({
            where: {
              id: challengerPlayerId,
            },
            data: {
              drinks: {
                increment: 1,
              },
            },
          });

          await tx.room.update({
            where: { id: input.roomId },
            data: {
              currentPlayerId: guesserPlayerId,
              currentAnswer: JSON.stringify(state),
            },
          });
        });

        return {
          phase: state.phase,
          winnerPlayerId: guesserPlayerId,
          loserPlayerId: challengerPlayerId,
        };
      }

      state.phase = "TIMER_RUNNING";
      state.activeChallengerId = guesserPlayerId;
      state.activeGuesserId = challengerPlayerId;
      state.attemptStartedAt = new Date().toISOString();
      state.roundWinnerPlayerId = null;
      state.roundLoserPlayerId = null;

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentPlayerId: challengerPlayerId,
          currentAnswer: JSON.stringify(state),
        },
      });

      return {
        phase: state.phase,
        winnerPlayerId: null,
        loserPlayerId: null,
      };
    }),

  connectLettersNextRound: baseProcedure
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
      if (room.game.code !== "connect-the-letters") {
        throw new Error("This room is not Connect The Letters");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (room.players.length < 2) {
        throw new Error("At least 2 players are required");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parseConnectLettersState(room.currentAnswer, playerIds);
      if (state.phase !== "ROUND_COMPLETE") {
        throw new Error("Finish this round first");
      }
      if (
        !state.currentPair ||
        (input.playerId !== state.currentPair[0] &&
          input.playerId !== state.currentPair[1] &&
          input.playerId !== state.roundWinnerPlayerId)
      ) {
        throw new Error(
          "Only the current pair or round winner can start the next round",
        );
      }

      const nextPair = pickNextConnectLettersPair(playerIds, state.usedPairKeys);
      if (!nextPair) {
        throw new Error("No player pair available");
      }
      const nextLetters = pickNextConnectLettersRange(state.usedLetterKeys);

      state.status = "PLAYING";
      state.currentPair = nextPair.pair;
      state.usedPairKeys = nextPair.nextUsedPairKeys;
      state.usedLetterKeys = nextLetters.nextUsedLetterKeys;
      state.roundNumber = state.roundNumber + 1;
      state.phase = "READY";
      state.startLetter = nextLetters.range.startLetter;
      state.endLetter = nextLetters.range.endLetter;
      state.activeChallengerId = null;
      state.activeGuesserId = null;
      state.attemptStartedAt = null;
      state.roundWinnerPlayerId = null;
      state.roundLoserPlayerId = null;

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentPlayerId: nextPair.pair[0],
          currentAnswer: JSON.stringify(state),
        },
      });

      return {
        roundNumber: state.roundNumber,
        currentPair: state.currentPair,
      };
    }),

  connectLettersRedrawLetters: baseProcedure
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
      if (room.game.code !== "connect-the-letters") {
        throw new Error("This room is not Connect The Letters");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parseConnectLettersState(room.currentAnswer, playerIds);
      if (!state.currentPair || !state.currentPair.includes(input.playerId)) {
        throw new Error("Only the active pair can redraw letters");
      }
      if (state.phase === "ROUND_COMPLETE") {
        throw new Error("Round already complete. Move to next round.");
      }

      const nextLetters = pickNextConnectLettersRange(state.usedLetterKeys);
      state.usedLetterKeys = nextLetters.nextUsedLetterKeys;
      state.startLetter = nextLetters.range.startLetter;
      state.endLetter = nextLetters.range.endLetter;
      state.phase = "READY";
      state.activeChallengerId = null;
      state.activeGuesserId = null;
      state.attemptStartedAt = null;
      state.roundWinnerPlayerId = null;
      state.roundLoserPlayerId = null;

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentPlayerId: state.currentPair[0],
          currentAnswer: JSON.stringify(state),
        },
      });

      return {
        startLetter: state.startLetter,
        endLetter: state.endLetter,
      };
    }),

  ghostTearsPickLetter: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
        letter: z.string().min(1).max(1),
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
      if (room.game.code !== "ghost-tears") {
        throw new Error("This room is not Ghost Tears");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (room.players.length < 2) {
        throw new Error("At least 2 players are required");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parseGhostTearsState(
        room.currentAnswer,
        playerIds,
        room.currentPlayerId,
      );
      if (state.status !== "PLAYING") {
        throw new Error("Game is not in playing state");
      }
      if (state.phase !== "PICKING") {
        throw new Error("Resolve the current challenge first");
      }
      if (state.currentPlayerId !== input.playerId) {
        throw new Error("It is not your turn");
      }

      const normalizedLetter = input.letter.toUpperCase();
      if (!GHOST_TEARS_ALPHABET.includes(normalizedLetter)) {
        throw new Error("Invalid letter");
      }

      const nextPlayerId = getNextPlayerIdInOrder(room.players, input.playerId);
      if (!nextPlayerId) {
        throw new Error("Could not choose the next player");
      }

      state.letterSequence = [...state.letterSequence, normalizedLetter];
      state.previousPlayerId = input.playerId;
      state.currentPlayerId = nextPlayerId;
      state.challengerPlayerId = null;
      state.challengedPlayerId = null;

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentPlayerId: nextPlayerId,
          currentAnswer: JSON.stringify(state),
        },
      });

      return {
        sequence: state.letterSequence,
        currentPlayerId: nextPlayerId,
        previousPlayerId: state.previousPlayerId,
      };
    }),

  ghostTearsChallenge: baseProcedure
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
      if (room.game.code !== "ghost-tears") {
        throw new Error("This room is not Ghost Tears");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (room.players.length < 2) {
        throw new Error("At least 2 players are required");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parseGhostTearsState(
        room.currentAnswer,
        playerIds,
        room.currentPlayerId,
      );
      if (state.status !== "PLAYING") {
        throw new Error("Game is not in playing state");
      }
      if (state.phase !== "PICKING") {
        throw new Error("Challenge is already in progress");
      }
      if (state.currentPlayerId !== input.playerId) {
        throw new Error("Only current player can challenge");
      }
      if (!state.previousPlayerId) {
        throw new Error("There is no previous player to challenge yet");
      }
      if (state.previousPlayerId === input.playerId) {
        throw new Error("You cannot challenge yourself");
      }

      state.phase = "AWAITING_JUDGMENT";
      state.challengerPlayerId = input.playerId;
      state.challengedPlayerId = state.previousPlayerId;

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentPlayerId: input.playerId,
          currentAnswer: JSON.stringify(state),
        },
      });

      return {
        challengerPlayerId: state.challengerPlayerId,
        challengedPlayerId: state.challengedPlayerId,
      };
    }),

  ghostTearsJudge: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
        verdict: z.enum(["CORRECT", "WRONG"]),
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
      if (room.game.code !== "ghost-tears") {
        throw new Error("This room is not Ghost Tears");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (room.players.length < 2) {
        throw new Error("At least 2 players are required");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parseGhostTearsState(
        room.currentAnswer,
        playerIds,
        room.currentPlayerId,
      );
      if (state.phase !== "AWAITING_JUDGMENT") {
        throw new Error("No challenge is waiting for judgment");
      }
      if (state.challengerPlayerId !== input.playerId) {
        throw new Error("Only the challenger can judge");
      }
      if (!state.challengerPlayerId || !state.challengedPlayerId) {
        throw new Error("Challenge state is invalid");
      }

      const loserPlayerId =
        input.verdict === "CORRECT"
          ? state.challengerPlayerId
          : state.challengedPlayerId;

      state.lastLoserPlayerId = loserPlayerId;
      state.roundNumber = state.roundNumber + 1;
      state.phase = "PICKING";
      state.letterSequence = [];
      state.previousPlayerId = null;
      state.challengerPlayerId = null;
      state.challengedPlayerId = null;
      state.currentPlayerId = input.playerId;

      await prisma.$transaction(async (tx) => {
        await applyGhostTearsRoundOutcome(
          tx,
          input.roomId,
          playerIds,
          loserPlayerId,
        );

        await tx.room.update({
          where: { id: input.roomId },
          data: {
            currentPlayerId: state.currentPlayerId,
            currentAnswer: JSON.stringify(state),
          },
        });
      });

      return {
        loserPlayerId,
        verdict: input.verdict,
        currentPlayerId: state.currentPlayerId,
      };
    }),

  ghostTearsForfeit: baseProcedure
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
      if (room.game.code !== "ghost-tears") {
        throw new Error("This room is not Ghost Tears");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (room.players.length < 2) {
        throw new Error("At least 2 players are required");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parseGhostTearsState(
        room.currentAnswer,
        playerIds,
        room.currentPlayerId,
      );
      if (state.phase !== "PICKING") {
        throw new Error("Finish judging the active challenge first");
      }
      if (state.currentPlayerId !== input.playerId) {
        throw new Error("Only the current player can forfeit");
      }

      const nextCurrentPlayerId = getNextPlayerIdInOrder(
        room.players,
        input.playerId,
      );
      if (!nextCurrentPlayerId) {
        throw new Error("Could not choose the next player");
      }

      state.lastLoserPlayerId = input.playerId;
      state.roundNumber = state.roundNumber + 1;
      state.phase = "PICKING";
      state.letterSequence = [];
      state.previousPlayerId = null;
      state.challengerPlayerId = null;
      state.challengedPlayerId = null;
      state.currentPlayerId = nextCurrentPlayerId;

      await prisma.$transaction(async (tx) => {
        await applyGhostTearsRoundOutcome(
          tx,
          input.roomId,
          playerIds,
          input.playerId,
        );

        await tx.room.update({
          where: { id: input.roomId },
          data: {
            currentPlayerId: nextCurrentPlayerId,
            currentAnswer: JSON.stringify(state),
          },
        });
      });

      return {
        loserPlayerId: input.playerId,
        nextCurrentPlayerId,
      };
    }),

  ghostTearsRestart: baseProcedure
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
      if (room.game.code !== "ghost-tears") {
        throw new Error("This room is not Ghost Tears");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (!room.players.some((player) => player.id === input.playerId)) {
        throw new Error("Player not in room");
      }

      const playerIds = room.players.map((player) => player.id);
      const nextCurrentPlayerId = getNextPlayerIdInOrder(
        room.players,
        room.currentPlayerId ?? "",
      );
      const nextState = getDefaultGhostTearsState(playerIds, nextCurrentPlayerId);

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentPlayerId: nextState.currentPlayerId,
          currentAnswer: JSON.stringify(nextState),
        },
      });

      return {
        currentPlayerId: nextState.currentPlayerId,
      };
    }),

  jokerLoopReorderCard: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
        cardId: z.string().min(1),
        direction: z.enum(["UP", "DOWN"]),
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

      if (!room) throw new Error("Room not found");
      if (room.game.code !== "joker-loop") {
        throw new Error("This room is not Joker Loop");
      }
      if (room.gameEnded) throw new Error("Game already ended");

      const playerIds = room.players.map((player) => player.id);
      const state = parseJokerLoopState(room.currentAnswer, playerIds);
      if (state.status !== "PLAYING") {
        throw new Error("Joker Loop has ended. Restart to play again.");
      }
      if (state.phase !== "REORDERING") {
        throw new Error("Reordering is only allowed before Ready.");
      }
      if (state.activeGiverPlayerId !== input.playerId) {
        throw new Error("Only the active giver can reorder cards.");
      }

      const hand = [...(state.handsByPlayerId[input.playerId] ?? [])];
      const index = hand.findIndex((card) => card.id === input.cardId);
      if (index === -1) throw new Error("Card not found in your hand.");

      const targetIndex = input.direction === "UP" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= hand.length) {
        return {
          handCount: hand.length,
        };
      }

      [hand[index], hand[targetIndex]] = [hand[targetIndex], hand[index]];
      state.handsByPlayerId[input.playerId] = hand;
      state.readyByPlayerId[input.playerId] = false;

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentAnswer: JSON.stringify(state),
          currentPlayerId: state.activeGiverPlayerId,
        },
      });

      return {
        handCount: hand.length,
      };
    }),

  jokerLoopReady: baseProcedure
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

      if (!room) throw new Error("Room not found");
      if (room.game.code !== "joker-loop") {
        throw new Error("This room is not Joker Loop");
      }
      if (room.gameEnded) throw new Error("Game already ended");

      const playerIds = room.players.map((player) => player.id);
      const state = parseJokerLoopState(room.currentAnswer, playerIds);
      if (state.status !== "PLAYING") {
        throw new Error("Joker Loop has ended. Restart to play again.");
      }
      if (state.phase !== "REORDERING") {
        throw new Error("You can only mark ready during reordering.");
      }
      if (state.activeGiverPlayerId !== input.playerId) {
        throw new Error("Only the active giver can mark ready.");
      }
      if (!state.activePickerPlayerId) {
        throw new Error("No picker available for this turn.");
      }

      state.readyByPlayerId[input.playerId] = true;
      state.phase = "PICKING";

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentAnswer: JSON.stringify(state),
          currentPlayerId: state.activePickerPlayerId,
        },
      });

      return {
        activePickerPlayerId: state.activePickerPlayerId,
      };
    }),

  jokerLoopPickCard: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
        pickedIndex: z.number().int().min(0),
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

      if (!room) throw new Error("Room not found");
      if (room.game.code !== "joker-loop") {
        throw new Error("This room is not Joker Loop");
      }
      if (room.gameEnded) throw new Error("Game already ended");

      const playerIds = room.players.map((player) => player.id);
      const state = parseJokerLoopState(room.currentAnswer, playerIds);
      if (state.status !== "PLAYING") {
        throw new Error("Joker Loop has ended. Restart to play again.");
      }
      if (state.phase !== "PICKING") {
        throw new Error("The giver must click Ready before a pick.");
      }
      if (state.activePickerPlayerId !== input.playerId) {
        throw new Error("Only the active picker can draw a card.");
      }
      if (!state.activeGiverPlayerId) {
        throw new Error("No active giver.");
      }
      if (!state.readyByPlayerId[state.activeGiverPlayerId]) {
        throw new Error("The giver must mark ready first.");
      }

      const giverId = state.activeGiverPlayerId;
      const pickerId = input.playerId;
      const giverHand = [...(state.handsByPlayerId[giverId] ?? [])];
      const pickerHand = [...(state.handsByPlayerId[pickerId] ?? [])];

      if (giverHand.length === 0) {
        throw new Error("The giver has no cards.");
      }
      if (input.pickedIndex >= giverHand.length) {
        throw new Error("Invalid card pick.");
      }

      const [pickedCard] = giverHand.splice(input.pickedIndex, 1);
      pickerHand.push(pickedCard);
      state.handsByPlayerId[giverId] = giverHand;
      state.handsByPlayerId[pickerId] = pickerHand;
      state.readyByPlayerId[giverId] = false;
      if (!state.drawnThisRoundPlayerIds.includes(giverId)) {
        state.drawnThisRoundPlayerIds.push(giverId);
      }
      state.jokerHolderPlayerId = findJokerHolder(state.handsByPlayerId);

      const isRoundComplete =
        state.roundParticipantIds.length > 0 &&
        state.drawnThisRoundPlayerIds.length >= state.roundParticipantIds.length;

      if (isRoundComplete) {
        state.phase = "ROUND_RESOLUTION";
        state.activeGiverPlayerId = null;
        state.activePickerPlayerId = null;
      } else {
        const nextGiver = pickerId;
        const nextPicker = getNextPlayerWithCards(state, nextGiver);
        if (!nextPicker || nextPicker === nextGiver) {
          state.phase = "ROUND_RESOLUTION";
          state.activeGiverPlayerId = null;
          state.activePickerPlayerId = null;
        } else {
          state.phase = "REORDERING";
          state.activeGiverPlayerId = nextGiver;
          state.activePickerPlayerId = nextPicker;
        }
      }

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentAnswer: JSON.stringify(state),
          currentPlayerId: state.activeGiverPlayerId,
        },
      });

      return {
        phase: state.phase,
        nextGiverPlayerId: state.activeGiverPlayerId,
        nextPickerPlayerId: state.activePickerPlayerId,
      };
    }),

  jokerLoopNextRound: baseProcedure
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

      if (!room) throw new Error("Room not found");
      if (room.game.code !== "joker-loop") {
        throw new Error("This room is not Joker Loop");
      }
      if (room.gameEnded) throw new Error("Game already ended");
      if (!room.players.some((player) => player.id === input.playerId)) {
        throw new Error("Player not in room");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parseJokerLoopState(room.currentAnswer, playerIds);
      if (state.status !== "PLAYING") {
        throw new Error("Joker Loop has ended. Restart to play again.");
      }
      if (state.phase !== "ROUND_RESOLUTION") {
        throw new Error("Finish all picks before moving to next round.");
      }

      const beforeCounts = Object.fromEntries(
        playerIds.map((playerId) => [
          playerId,
          (state.handsByPlayerId[playerId] ?? []).length,
        ]),
      );

      const nextHandsByPlayerId: Record<string, JokerLoopCard[]> = {};
      for (const playerId of playerIds) {
        nextHandsByPlayerId[playerId] = removePairsFromHand(
          state.handsByPlayerId[playerId] ?? [],
        );
      }

      const clearedPlayerIds = playerIds.filter(
        (playerId) =>
          (beforeCounts[playerId] ?? 0) > 0 &&
          (nextHandsByPlayerId[playerId] ?? []).length === 0,
      );

      await prisma.$transaction(async (tx) => {
        await tx.player.updateMany({
          where: {
            roomId: input.roomId,
            id: {
              in: playerIds,
            },
            points: null,
          },
          data: {
            points: 0,
          },
        });

        await tx.player.updateMany({
          where: {
            roomId: input.roomId,
            id: {
              in: playerIds,
            },
            drinks: null,
          },
          data: {
            drinks: 0,
          },
        });

        if (clearedPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: clearedPlayerIds,
              },
            },
            data: {
              points: {
                increment: 1,
              },
            },
          });
        }

        state.handsByPlayerId = nextHandsByPlayerId;
        state.lastRoundClearedPlayerIds = clearedPlayerIds;
        state.jokerHolderPlayerId = findJokerHolder(state.handsByPlayerId);

        const totalCards = Object.values(state.handsByPlayerId).reduce(
          (sum, hand) => sum + hand.length,
          0,
        );
        const jokerHolder = state.jokerHolderPlayerId;
        const jokerHolderHand = jokerHolder ? state.handsByPlayerId[jokerHolder] ?? [] : [];
        const isEndState =
          totalCards === 1 && jokerHolderHand.length === 1 && jokerHolderHand[0].isJoker;

        if (isEndState && jokerHolder) {
          state.status = "ENDED";
          state.phase = "ENDED";
          state.activeGiverPlayerId = null;
          state.activePickerPlayerId = null;
          state.drawnThisRoundPlayerIds = [];
          state.roundParticipantIds = [];
          await tx.player.update({
            where: {
              id: jokerHolder,
            },
            data: {
              drinks: {
                increment: 1,
              },
            },
          });
        } else {
          state.roundNumber = state.roundNumber + 1;
          state.roundParticipantIds = state.playerOrder.filter(
            (playerId) => (state.handsByPlayerId[playerId] ?? []).length > 0,
          );
          state.drawnThisRoundPlayerIds = [];
          state.readyByPlayerId = Object.fromEntries(
            state.playerOrder.map((playerId) => [playerId, false]),
          );
          state.activeGiverPlayerId = state.roundParticipantIds[0] ?? null;
          state.activePickerPlayerId = state.activeGiverPlayerId
            ? getNextPlayerWithCards(state, state.activeGiverPlayerId)
            : null;
          if (
            !state.activeGiverPlayerId ||
            !state.activePickerPlayerId ||
            state.activeGiverPlayerId === state.activePickerPlayerId
          ) {
            state.status = "ENDED";
            state.phase = "ENDED";
            state.activeGiverPlayerId = null;
            state.activePickerPlayerId = null;
          } else {
            state.phase = "REORDERING";
          }
        }

        await tx.room.update({
          where: { id: input.roomId },
          data: {
            currentAnswer: JSON.stringify(state),
            currentPlayerId: state.activeGiverPlayerId,
          },
        });
      });

      return {
        status: state.status,
        phase: state.phase,
        roundNumber: state.roundNumber,
        clearedPlayerIds,
        jokerHolderPlayerId: state.jokerHolderPlayerId,
      };
    }),

  jokerLoopRestart: baseProcedure
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

      if (!room) throw new Error("Room not found");
      if (room.game.code !== "joker-loop") {
        throw new Error("This room is not Joker Loop");
      }
      if (!room.players.some((player) => player.id === input.playerId)) {
        throw new Error("Player not in room");
      }
      if (room.players.length < 2) {
        throw new Error("At least 2 players are required");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = buildJokerLoopState(playerIds);

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          gameEnded: false,
          gameEndedAt: null,
          currentPlayerId: state.activeGiverPlayerId,
          currentAnswer: JSON.stringify(state),
        },
      });

      return {
        roundNumber: state.roundNumber,
        activeGiverPlayerId: state.activeGiverPlayerId,
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

  getActivePlayersCount: baseProcedure.query(async () => {
    try {
      const activeWindowAgo = new Date(Date.now() - 15 * 60 * 1000);
      const activePlayersCount = await prisma.player.count({
        where: {
          room: {
            gameEnded: false,
            startedAt: {
              not: null,
            },
            updatedAt: {
              gte: activeWindowAgo,
            },
          },
        },
      });

      return { count: activePlayersCount };
    } catch (error) {
      console.error("Failed to fetch active players count:", error);
      throw new Error("Failed to fetch active players count");
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
