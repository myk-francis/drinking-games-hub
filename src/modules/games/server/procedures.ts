import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { cookies } from "next/headers";
import type { Prisma } from "../../../../prisma/generated/prisma/client";

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
const NAME_THE_SONG_TIMER_SECONDS = 5;
const GUESS_THE_MOVIE_TIMER_SECONDS = 5;
const GUESS_THE_MOVIE_ALL_CATEGORY = 0;
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

type WhoAmIState = {
  status: "PLAYING" | "ROUND_WON";
  roundNumber: number;
  assignmentsByPlayerId: Record<string, number>;
  usedQuestionIds: number[];
  winnerPlayerId: string | null;
};

type NameTheSongVerdict = "CORRECT" | "WRONG";

type NameTheSongState = {
  status: "READY" | "BUZZED" | "ROUND_RESULT";
  roundNumber: number;
  currentQuestionId: number | null;
  usedQuestionIds: number[];
  buzzedPlayerId: string | null;
  attemptStartedAt: string | null;
  verdict: NameTheSongVerdict | null;
  pointPlayerIds: string[];
  drinkPlayerIds: string[];
};

type GuessTheMovieVerdict = "CORRECT" | "WRONG";

type GuessTheMovieState = {
  status: "READY" | "BUZZED" | "ROUND_RESULT";
  roundNumber: number;
  currentQuestionId: number | null;
  usedQuestionIds: number[];
  buzzedPlayerId: string | null;
  attemptStartedAt: string | null;
  verdict: GuessTheMovieVerdict | null;
  pointPlayerIds: string[];
  drinkPlayerIds: string[];
  selectedCategory: number;
};

type RideTheBusSuit = "HEARTS" | "DIAMONDS" | "CLUBS" | "SPADES";
type RideTheBusColor = "RED" | "BLACK";
type RideTheBusStep = "COLOR" | "HIGHER_LOWER" | "INSIDE_OUTSIDE" | "SUIT";
type RideTheBusPhase = "MAIN" | "BUS" | "ESCAPED";
type RideTheBusCard = {
  rank: number;
  suit: RideTheBusSuit;
  color: RideTheBusColor;
};
type RideTheBusLastResult =
  | "CORRECT"
  | "WRONG"
  | "COMPLETED_MAIN"
  | "BUS_ASSIGNED"
  | "ESCAPED"
  | null;

type RideTheBusState = {
  status: "PLAYING" | "ENDED";
  phase: RideTheBusPhase;
  playerOrder: string[];
  currentPlayerId: string | null;
  activeStep: RideTheBusStep;
  activeCards: RideTheBusCard[];
  completedPlayerIds: string[];
  resetsByPlayerId: Record<string, number>;
  busRiderPlayerId: string | null;
  escapedPlayerId: string | null;
  lastResult: RideTheBusLastResult;
};

type BlackjackSuit = "HEARTS" | "DIAMONDS" | "CLUBS" | "SPADES";
type BlackjackRoundPhase = "PLAYER_TURNS" | "DEALER_TURN" | "ROUND_RESULT";
type BlackjackPlayerResult = "BLACKJACK" | "WIN" | "LOSE" | "PUSH" | "BUST";
type BlackjackCard = {
  rank: number;
  suit: BlackjackSuit;
};

type BlackjackState = {
  status: "PLAYING" | "ENDED";
  roundNumber: number;
  phase: BlackjackRoundPhase;
  playerOrder: string[];
  currentPlayerId: string | null;
  dealerHand: BlackjackCard[];
  deck: BlackjackCard[];
  handsByPlayerId: Record<string, BlackjackCard[]>;
  stoodPlayerIds: string[];
  bustedPlayerIds: string[];
  finishedPlayerIds: string[];
  resultByPlayerId: Record<string, BlackjackPlayerResult | null>;
  hiddenDealerCard: boolean;
};

type PokerSuit = "HEARTS" | "DIAMONDS" | "CLUBS" | "SPADES";
type PokerCard = {
  rank: number;
  suit: PokerSuit;
};
type PokerPhase = "PRE_FLOP" | "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";
type PokerPlayerAction = "NONE" | "CHECK" | "CALL" | "BET" | "FOLD";

type PokerState = {
  status: "PLAYING" | "ENDED";
  roundNumber: number;
  phase: PokerPhase;
  startingStack: number;
  betStep: number;
  playerOrder: string[];
  currentPlayerId: string | null;
  dealerPlayerId: string | null;
  smallBlindPlayerId: string | null;
  bigBlindPlayerId: string | null;
  smallBlindAmount: number;
  bigBlindAmount: number;
  currentBet: number;
  pot: number;
  deck: PokerCard[];
  communityCards: PokerCard[];
  holeCardsByPlayerId: Record<string, PokerCard[]>;
  stackByPlayerId: Record<string, number>;
  playerBets: Record<string, number>;
  totalContributionsByPlayerId: Record<string, number>;
  actedPlayerIds: string[];
  foldedPlayerIds: string[];
  allInPlayerIds: string[];
  lastActionByPlayerId: Record<string, PokerPlayerAction>;
  lastActionPlayerId: string | null;
  lastActionAmount: number | null;
  winnerPlayerIds: string[];
  handLabelByPlayerId: Record<string, string | null>;
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

function buildWhoAmIAssignments(
  playerIds: string[],
  questionIds: number[],
): Record<string, number> {
  if (questionIds.length < playerIds.length) {
    throw new Error(
      `Who Am I requires at least ${playerIds.length} cards for this room.`,
    );
  }

  const selectedQuestionIds = shuffleArray(questionIds).slice(0, playerIds.length);
  return Object.fromEntries(
    playerIds.map((playerId, index) => [playerId, selectedQuestionIds[index]]),
  );
}

function buildWhoAmIState(
  playerIds: string[],
  questionIds: number[],
  previousState?: WhoAmIState,
): WhoAmIState {
  const previousUsedQuestionIds = previousState?.usedQuestionIds ?? [];
  const availableQuestionIds = questionIds.filter(
    (questionId) => !previousUsedQuestionIds.includes(questionId),
  );
  const sourceQuestionIds =
    availableQuestionIds.length >= playerIds.length
      ? availableQuestionIds
      : questionIds;
  const assignmentsByPlayerId = buildWhoAmIAssignments(
    playerIds,
    sourceQuestionIds,
  );
  const assignedQuestionIds = Object.values(assignmentsByPlayerId);

  return {
    status: "PLAYING",
    roundNumber: (previousState?.roundNumber ?? 0) + 1,
    assignmentsByPlayerId,
    usedQuestionIds:
      sourceQuestionIds === questionIds
        ? assignedQuestionIds
        : [...previousUsedQuestionIds, ...assignedQuestionIds],
    winnerPlayerId: null,
  };
}

function parseWhoAmIState(
  raw: string | null,
  playerIds: string[],
): WhoAmIState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WhoAmIState>;
    const rawAssignments =
      parsed.assignmentsByPlayerId &&
      typeof parsed.assignmentsByPlayerId === "object"
        ? parsed.assignmentsByPlayerId
        : {};
    const assignmentsByPlayerId: Record<string, number> = {};

    for (const playerId of playerIds) {
      const questionId = (rawAssignments as Record<string, unknown>)[playerId];
      if (typeof questionId === "number" && Number.isFinite(questionId)) {
        assignmentsByPlayerId[playerId] = questionId;
      }
    }

    return {
      status: parsed.status === "ROUND_WON" ? "ROUND_WON" : "PLAYING",
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber >= 1
          ? parsed.roundNumber
          : 1,
      assignmentsByPlayerId,
      usedQuestionIds: Array.isArray(parsed.usedQuestionIds)
        ? parsed.usedQuestionIds.filter(
            (questionId): questionId is number => typeof questionId === "number",
          )
        : [],
      winnerPlayerId:
        typeof parsed.winnerPlayerId === "string" &&
        playerIds.includes(parsed.winnerPlayerId)
          ? parsed.winnerPlayerId
          : null,
    };
  } catch {
    return null;
  }
}

function getNextNameTheSongQuestion(
  questionIds: number[],
  previousUsedQuestionIds: number[],
): { currentQuestionId: number | null; usedQuestionIds: number[] } {
  if (questionIds.length === 0) {
    return {
      currentQuestionId: null,
      usedQuestionIds: [],
    };
  }

  const availableQuestionIds = questionIds.filter(
    (questionId) => !previousUsedQuestionIds.includes(questionId),
  );
  const sourceQuestionIds =
    availableQuestionIds.length > 0 ? availableQuestionIds : questionIds;
  const currentQuestionId = shuffleArray(sourceQuestionIds)[0] ?? null;

  return {
    currentQuestionId,
    usedQuestionIds:
      currentQuestionId === null
        ? []
        : sourceQuestionIds === questionIds
          ? [currentQuestionId]
          : [...previousUsedQuestionIds, currentQuestionId],
  };
}

function buildNameTheSongState(
  questionIds: number[],
  previousState?: NameTheSongState,
): NameTheSongState {
  const nextQuestion = getNextNameTheSongQuestion(
    questionIds,
    previousState?.usedQuestionIds ?? [],
  );

  return {
    status: "READY",
    roundNumber: (previousState?.roundNumber ?? 0) + 1,
    currentQuestionId: nextQuestion.currentQuestionId,
    usedQuestionIds: nextQuestion.usedQuestionIds,
    buzzedPlayerId: null,
    attemptStartedAt: null,
    verdict: null,
    pointPlayerIds: [],
    drinkPlayerIds: [],
  };
}

function getGuessTheMovieQuestionIds(
  questions: Array<{ id: number; edition: number | null }>,
  selectedCategory: number,
): number[] {
  if (selectedCategory === GUESS_THE_MOVIE_ALL_CATEGORY) {
    return questions.map((question) => question.id);
  }

  return questions
    .filter((question) => question.edition === selectedCategory)
    .map((question) => question.id);
}

function buildGuessTheMovieState(
  questionIds: number[],
  selectedCategory: number,
  previousState?: GuessTheMovieState,
): GuessTheMovieState {
  const nextQuestion = getNextNameTheSongQuestion(
    questionIds,
    previousState?.usedQuestionIds ?? [],
  );

  return {
    status: "READY",
    roundNumber: (previousState?.roundNumber ?? 0) + 1,
    currentQuestionId: nextQuestion.currentQuestionId,
    usedQuestionIds: nextQuestion.usedQuestionIds,
    buzzedPlayerId: null,
    attemptStartedAt: null,
    verdict: null,
    pointPlayerIds: [],
    drinkPlayerIds: [],
    selectedCategory,
  };
}

function parseNameTheSongState(
  raw: string | null,
  playerIds: string[],
  questionIds: number[],
): NameTheSongState {
  const fallback = buildNameTheSongState(questionIds);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<NameTheSongState>;
    const normalizedQuestionId =
      typeof parsed.currentQuestionId === "number" &&
      questionIds.includes(parsed.currentQuestionId)
        ? parsed.currentQuestionId
        : fallback.currentQuestionId;

    return {
      status:
        parsed.status === "BUZZED" || parsed.status === "ROUND_RESULT"
          ? parsed.status
          : "READY",
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber >= 1
          ? parsed.roundNumber
          : fallback.roundNumber,
      currentQuestionId: normalizedQuestionId,
      usedQuestionIds: Array.isArray(parsed.usedQuestionIds)
        ? parsed.usedQuestionIds.filter(
            (questionId): questionId is number =>
              typeof questionId === "number" && questionIds.includes(questionId),
          )
        : fallback.usedQuestionIds,
      buzzedPlayerId:
        typeof parsed.buzzedPlayerId === "string" &&
        playerIds.includes(parsed.buzzedPlayerId)
          ? parsed.buzzedPlayerId
          : null,
      attemptStartedAt:
        typeof parsed.attemptStartedAt === "string"
          ? parsed.attemptStartedAt
          : null,
      verdict:
        parsed.verdict === "CORRECT" || parsed.verdict === "WRONG"
          ? parsed.verdict
          : null,
      pointPlayerIds: Array.isArray(parsed.pointPlayerIds)
        ? parsed.pointPlayerIds.filter(
            (playerId): playerId is string =>
              typeof playerId === "string" && playerIds.includes(playerId),
          )
        : [],
      drinkPlayerIds: Array.isArray(parsed.drinkPlayerIds)
        ? parsed.drinkPlayerIds.filter(
            (playerId): playerId is string =>
              typeof playerId === "string" && playerIds.includes(playerId),
          )
        : [],
    };
  } catch {
    return fallback;
  }
}

function parseGuessTheMovieState(
  raw: string | null,
  playerIds: string[],
  questionIds: number[],
  selectedCategory: number,
): GuessTheMovieState {
  const fallback = buildGuessTheMovieState(questionIds, selectedCategory);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<GuessTheMovieState>;
    const normalizedQuestionId =
      typeof parsed.currentQuestionId === "number" &&
      questionIds.includes(parsed.currentQuestionId)
        ? parsed.currentQuestionId
        : fallback.currentQuestionId;

    return {
      status:
        parsed.status === "BUZZED" || parsed.status === "ROUND_RESULT"
          ? parsed.status
          : "READY",
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber >= 1
          ? parsed.roundNumber
          : fallback.roundNumber,
      currentQuestionId: normalizedQuestionId,
      usedQuestionIds: Array.isArray(parsed.usedQuestionIds)
        ? parsed.usedQuestionIds.filter(
            (questionId): questionId is number =>
              typeof questionId === "number" && questionIds.includes(questionId),
          )
        : fallback.usedQuestionIds,
      buzzedPlayerId:
        typeof parsed.buzzedPlayerId === "string" &&
        playerIds.includes(parsed.buzzedPlayerId)
          ? parsed.buzzedPlayerId
          : null,
      attemptStartedAt:
        typeof parsed.attemptStartedAt === "string"
          ? parsed.attemptStartedAt
          : null,
      verdict:
        parsed.verdict === "CORRECT" || parsed.verdict === "WRONG"
          ? parsed.verdict
          : null,
      pointPlayerIds: Array.isArray(parsed.pointPlayerIds)
        ? parsed.pointPlayerIds.filter(
            (playerId): playerId is string =>
              typeof playerId === "string" && playerIds.includes(playerId),
          )
        : [],
      drinkPlayerIds: Array.isArray(parsed.drinkPlayerIds)
        ? parsed.drinkPlayerIds.filter(
            (playerId): playerId is string =>
              typeof playerId === "string" && playerIds.includes(playerId),
          )
        : [],
      selectedCategory:
        typeof parsed.selectedCategory === "number" &&
        Number.isFinite(parsed.selectedCategory)
          ? parsed.selectedCategory
          : selectedCategory,
    };
  } catch {
    return fallback;
  }
}

const RIDE_THE_BUS_SUITS: RideTheBusSuit[] = [
  "HEARTS",
  "DIAMONDS",
  "CLUBS",
  "SPADES",
];
const RIDE_THE_BUS_STEPS: RideTheBusStep[] = [
  "COLOR",
  "HIGHER_LOWER",
  "INSIDE_OUTSIDE",
  "SUIT",
];

function getDefaultRideTheBusState(playerIds: string[]): RideTheBusState {
  return {
    status: "PLAYING",
    phase: "MAIN",
    playerOrder: [...playerIds],
    currentPlayerId: playerIds[0] ?? null,
    activeStep: "COLOR",
    activeCards: [],
    completedPlayerIds: [],
    resetsByPlayerId: Object.fromEntries(
      playerIds.map((playerId) => [playerId, 0]),
    ),
    busRiderPlayerId: null,
    escapedPlayerId: null,
    lastResult: null,
  };
}

function parseRideTheBusCard(raw: unknown): RideTheBusCard | null {
  if (!raw || typeof raw !== "object") return null;
  const card = raw as Partial<RideTheBusCard>;
  if (
    typeof card.rank !== "number" ||
    !Number.isInteger(card.rank) ||
    card.rank < 1 ||
    card.rank > 13
  ) {
    return null;
  }
  if (
    card.suit !== "HEARTS" &&
    card.suit !== "DIAMONDS" &&
    card.suit !== "CLUBS" &&
    card.suit !== "SPADES"
  ) {
    return null;
  }

  return {
    rank: card.rank,
    suit: card.suit,
    color:
      card.suit === "HEARTS" || card.suit === "DIAMONDS" ? "RED" : "BLACK",
  };
}

function parseRideTheBusState(
  raw: string | null,
  playerIds: string[],
): RideTheBusState {
  const fallback = getDefaultRideTheBusState(playerIds);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<RideTheBusState>;
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

    const resetsByPlayerId: Record<string, number> = {};
    const rawResets =
      parsed.resetsByPlayerId && typeof parsed.resetsByPlayerId === "object"
        ? parsed.resetsByPlayerId
        : {};
    for (const playerId of normalizedOrder) {
      const value = (rawResets as Record<string, unknown>)[playerId];
      resetsByPlayerId[playerId] =
        typeof value === "number" && Number.isFinite(value) && value >= 0
          ? Math.floor(value)
          : 0;
    }

    const currentPlayerId =
      typeof parsed.currentPlayerId === "string" &&
      normalizedOrder.includes(parsed.currentPlayerId)
        ? parsed.currentPlayerId
        : normalizedOrder[0] ?? null;

    return {
      status: parsed.status === "ENDED" ? "ENDED" : "PLAYING",
      phase:
        parsed.phase === "BUS" || parsed.phase === "ESCAPED"
          ? parsed.phase
          : "MAIN",
      playerOrder: normalizedOrder,
      currentPlayerId,
      activeStep: RIDE_THE_BUS_STEPS.includes(parsed.activeStep as RideTheBusStep)
        ? (parsed.activeStep as RideTheBusStep)
        : "COLOR",
      activeCards: Array.isArray(parsed.activeCards)
        ? parsed.activeCards
            .map((card) => parseRideTheBusCard(card))
            .filter((card): card is RideTheBusCard => card !== null)
        : [],
      completedPlayerIds: Array.isArray(parsed.completedPlayerIds)
        ? parsed.completedPlayerIds.filter((playerId): playerId is string =>
            normalizedOrder.includes(playerId),
          )
        : [],
      resetsByPlayerId,
      busRiderPlayerId:
        typeof parsed.busRiderPlayerId === "string" &&
        normalizedOrder.includes(parsed.busRiderPlayerId)
          ? parsed.busRiderPlayerId
          : null,
      escapedPlayerId:
        typeof parsed.escapedPlayerId === "string" &&
        normalizedOrder.includes(parsed.escapedPlayerId)
          ? parsed.escapedPlayerId
          : null,
      lastResult:
        parsed.lastResult === "CORRECT" ||
        parsed.lastResult === "WRONG" ||
        parsed.lastResult === "COMPLETED_MAIN" ||
        parsed.lastResult === "BUS_ASSIGNED" ||
        parsed.lastResult === "ESCAPED"
          ? parsed.lastResult
          : null,
    };
  } catch {
    return fallback;
  }
}

function getNextRideTheBusStep(step: RideTheBusStep): RideTheBusStep | null {
  const index = RIDE_THE_BUS_STEPS.indexOf(step);
  if (index < 0 || index >= RIDE_THE_BUS_STEPS.length - 1) {
    return null;
  }
  return RIDE_THE_BUS_STEPS[index + 1] ?? null;
}

function drawRideTheBusCard(): RideTheBusCard {
  const suit = RIDE_THE_BUS_SUITS[Math.floor(Math.random() * RIDE_THE_BUS_SUITS.length)];
  const rank = Math.floor(Math.random() * 13) + 1;
  return {
    rank,
    suit,
    color: suit === "HEARTS" || suit === "DIAMONDS" ? "RED" : "BLACK",
  };
}

function getNextRideTheBusMainPlayer(
  state: RideTheBusState,
  fromPlayerId: string,
): string | null {
  if (state.playerOrder.length === 0) return null;
  const startIndex = state.playerOrder.indexOf(fromPlayerId);
  const normalizedStartIndex = startIndex >= 0 ? startIndex : -1;

  for (let step = 1; step <= state.playerOrder.length; step += 1) {
    const nextIndex = (normalizedStartIndex + step) % state.playerOrder.length;
    const nextPlayerId = state.playerOrder[nextIndex];
    if (!state.completedPlayerIds.includes(nextPlayerId)) {
      return nextPlayerId;
    }
  }

  return null;
}

function chooseRideTheBusRider(state: RideTheBusState): string | null {
  if (state.playerOrder.length === 0) return null;

  let chosenPlayerId = state.playerOrder[0] ?? null;
  let highestResets = -1;
  for (const playerId of state.playerOrder) {
    const resets = state.resetsByPlayerId[playerId] ?? 0;
    if (resets > highestResets) {
      highestResets = resets;
      chosenPlayerId = playerId;
    }
  }

  return chosenPlayerId;
}

const BLACKJACK_SUITS: BlackjackSuit[] = [
  "HEARTS",
  "DIAMONDS",
  "CLUBS",
  "SPADES",
];

function createBlackjackDeck(): BlackjackCard[] {
  return shuffleArray(
    BLACKJACK_SUITS.flatMap((suit) =>
      Array.from({ length: 13 }, (_, index) => ({
        rank: index + 1,
        suit,
      })),
    ),
  );
}

function getBlackjackCardValue(card: BlackjackCard): number {
  if (card.rank === 1) return 11;
  if (card.rank >= 10) return 10;
  return card.rank;
}

function getBlackjackHandTotal(cards: BlackjackCard[]): number {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    total += getBlackjackCardValue(card);
    if (card.rank === 1) {
      aces += 1;
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

function isBlackjackNatural(cards: BlackjackCard[]): boolean {
  return cards.length === 2 && getBlackjackHandTotal(cards) === 21;
}

function drawBlackjackCard(state: BlackjackState): BlackjackCard {
  if (state.deck.length === 0) {
    throw new Error("The blackjack deck is empty");
  }

  const nextCard = state.deck[0];
  state.deck = state.deck.slice(1);
  return nextCard;
}

function getNextBlackjackPlayerId(
  state: BlackjackState,
  fromPlayerId: string,
): string | null {
  const startIndex = state.playerOrder.indexOf(fromPlayerId);
  const normalizedStartIndex = startIndex >= 0 ? startIndex : -1;

  for (let step = 1; step <= state.playerOrder.length; step += 1) {
    const nextIndex = (normalizedStartIndex + step) % state.playerOrder.length;
    const nextPlayerId = state.playerOrder[nextIndex];
    const hand = state.handsByPlayerId[nextPlayerId] ?? [];
    if (hand.length > 0 && !state.finishedPlayerIds.includes(nextPlayerId)) {
      return nextPlayerId;
    }
  }

  return null;
}

function resolveBlackjackRound(state: BlackjackState): {
  pointPlayerIds: string[];
  drinkPlayerIds: string[];
} {
  state.phase = "DEALER_TURN";
  state.hiddenDealerCard = false;

  while (getBlackjackHandTotal(state.dealerHand) < 17) {
    state.dealerHand.push(drawBlackjackCard(state));
  }

  const dealerTotal = getBlackjackHandTotal(state.dealerHand);
  const dealerBust = dealerTotal > 21;
  const dealerBlackjack = isBlackjackNatural(state.dealerHand);
  const pointPlayerIds: string[] = [];
  const drinkPlayerIds: string[] = [];

  for (const playerId of state.playerOrder) {
    const hand = state.handsByPlayerId[playerId] ?? [];
    if (hand.length === 0) {
      state.resultByPlayerId[playerId] = null;
      continue;
    }

    const total = getBlackjackHandTotal(hand);
    const natural = isBlackjackNatural(hand);

    if (total > 21) {
      state.resultByPlayerId[playerId] = "BUST";
      drinkPlayerIds.push(playerId);
      continue;
    }

    if (natural && !dealerBlackjack) {
      state.resultByPlayerId[playerId] = "BLACKJACK";
      pointPlayerIds.push(playerId);
      continue;
    }

    if (dealerBust) {
      state.resultByPlayerId[playerId] = "WIN";
      pointPlayerIds.push(playerId);
      continue;
    }

    if (dealerBlackjack && !natural) {
      state.resultByPlayerId[playerId] = "LOSE";
      drinkPlayerIds.push(playerId);
      continue;
    }

    if (total > dealerTotal) {
      state.resultByPlayerId[playerId] = "WIN";
      pointPlayerIds.push(playerId);
    } else if (total < dealerTotal) {
      state.resultByPlayerId[playerId] = "LOSE";
      drinkPlayerIds.push(playerId);
    } else {
      state.resultByPlayerId[playerId] = "PUSH";
    }
  }

  state.phase = "ROUND_RESULT";
  state.currentPlayerId = null;

  return {
    pointPlayerIds,
    drinkPlayerIds,
  };
}

function createInitialBlackjackState(
  playerIds: string[],
  previousRoundNumber?: number,
): {
  state: BlackjackState;
  pointPlayerIds: string[];
  drinkPlayerIds: string[];
} {
  const deck = createBlackjackDeck();
  const handsByPlayerId = Object.fromEntries(
    playerIds.map((playerId) => [playerId, [] as BlackjackCard[]]),
  );
  const state: BlackjackState = {
    status: "PLAYING",
    roundNumber: Math.max(1, (previousRoundNumber ?? 0) + 1),
    phase: "PLAYER_TURNS",
    playerOrder: [...playerIds],
    currentPlayerId: playerIds[0] ?? null,
    dealerHand: [],
    deck,
    handsByPlayerId,
    stoodPlayerIds: [],
    bustedPlayerIds: [],
    finishedPlayerIds: [],
    resultByPlayerId: Object.fromEntries(
      playerIds.map((playerId) => [playerId, null]),
    ),
    hiddenDealerCard: true,
  };

  for (let pass = 0; pass < 2; pass += 1) {
    for (const playerId of playerIds) {
      state.handsByPlayerId[playerId]?.push(drawBlackjackCard(state));
    }
    state.dealerHand.push(drawBlackjackCard(state));
  }

  for (const playerId of playerIds) {
    const hand = state.handsByPlayerId[playerId] ?? [];
    if (isBlackjackNatural(hand)) {
      state.stoodPlayerIds.push(playerId);
      state.finishedPlayerIds.push(playerId);
    }
  }

  state.currentPlayerId =
    playerIds.find((playerId) => !state.finishedPlayerIds.includes(playerId)) ??
    null;

  if (!state.currentPlayerId && playerIds.length > 0) {
    return {
      state,
      ...resolveBlackjackRound(state),
    };
  }

  return {
    state,
    pointPlayerIds: [],
    drinkPlayerIds: [],
  };
}

function parseBlackjackCard(raw: unknown): BlackjackCard | null {
  if (!raw || typeof raw !== "object") return null;
  const card = raw as Partial<BlackjackCard>;
  if (
    typeof card.rank !== "number" ||
    !Number.isInteger(card.rank) ||
    card.rank < 1 ||
    card.rank > 13
  ) {
    return null;
  }
  if (
    card.suit !== "HEARTS" &&
    card.suit !== "DIAMONDS" &&
    card.suit !== "CLUBS" &&
    card.suit !== "SPADES"
  ) {
    return null;
  }

  return {
    rank: card.rank,
    suit: card.suit,
  };
}

function parseBlackjackState(
  raw: string | null,
  playerIds: string[],
): BlackjackState {
  const fallback = createInitialBlackjackState(playerIds, 0).state;
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<BlackjackState>;
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

    const dealerHand = Array.isArray(parsed.dealerHand)
      ? parsed.dealerHand
          .map((card) => parseBlackjackCard(card))
          .filter((card): card is BlackjackCard => card !== null)
      : [];
    const deck = Array.isArray(parsed.deck)
      ? parsed.deck
          .map((card) => parseBlackjackCard(card))
          .filter((card): card is BlackjackCard => card !== null)
      : [];

    const handsByPlayerId: Record<string, BlackjackCard[]> = {};
    for (const playerId of normalizedOrder) {
      const rawHand =
        parsed.handsByPlayerId && typeof parsed.handsByPlayerId === "object"
          ? (parsed.handsByPlayerId as Record<string, unknown>)[playerId]
          : [];
      handsByPlayerId[playerId] = Array.isArray(rawHand)
        ? rawHand
            .map((card) => parseBlackjackCard(card))
            .filter((card): card is BlackjackCard => card !== null)
        : [];
    }

    const normalizePlayerIdList = (value: unknown) =>
      Array.isArray(value)
        ? value.filter(
            (playerId): playerId is string =>
              typeof playerId === "string" && normalizedOrder.includes(playerId),
          )
        : [];

    const resultByPlayerId: Record<string, BlackjackPlayerResult | null> = {};
    for (const playerId of normalizedOrder) {
      const rawResult =
        parsed.resultByPlayerId && typeof parsed.resultByPlayerId === "object"
          ? (parsed.resultByPlayerId as Record<string, unknown>)[playerId]
          : null;
      resultByPlayerId[playerId] =
        rawResult === "BLACKJACK" ||
        rawResult === "WIN" ||
        rawResult === "LOSE" ||
        rawResult === "PUSH" ||
        rawResult === "BUST"
          ? rawResult
          : null;
    }

    const currentPlayerId =
      typeof parsed.currentPlayerId === "string" &&
      normalizedOrder.includes(parsed.currentPlayerId)
        ? parsed.currentPlayerId
        : normalizedOrder.find(
            (playerId) =>
              handsByPlayerId[playerId].length > 0 &&
              !normalizePlayerIdList(parsed.finishedPlayerIds).includes(playerId),
          ) ?? null;

    return {
      status: parsed.status === "ENDED" ? "ENDED" : "PLAYING",
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber > 0
          ? Math.floor(parsed.roundNumber)
          : 1,
      phase:
        parsed.phase === "DEALER_TURN" || parsed.phase === "ROUND_RESULT"
          ? parsed.phase
          : "PLAYER_TURNS",
      playerOrder: normalizedOrder,
      currentPlayerId,
      dealerHand,
      deck,
      handsByPlayerId,
      stoodPlayerIds: normalizePlayerIdList(parsed.stoodPlayerIds),
      bustedPlayerIds: normalizePlayerIdList(parsed.bustedPlayerIds),
      finishedPlayerIds: normalizePlayerIdList(parsed.finishedPlayerIds),
      resultByPlayerId,
      hiddenDealerCard: parsed.hiddenDealerCard !== false,
    };
  } catch {
    return fallback;
  }
}

const POKER_STARTING_STACK = 10_000;
const POKER_SMALL_BLIND_BASE = 1_000;
const POKER_BIG_BLIND_BASE = 2_000;
const POKER_BLIND_INCREASE_ROUNDS = 5;

type PokerBlindLevel = {
  smallBlind: number;
  bigBlind: number;
};

type PokerHandEvaluation = {
  category: number;
  values: number[];
  label: string;
};

function createPokerDeck(): PokerCard[] {
  return shuffleArray(
    BLACKJACK_SUITS.flatMap((suit) =>
      Array.from({ length: 13 }, (_, index) => ({
        rank: index + 1,
        suit,
      })),
    ),
  );
}

function drawPokerCard(state: PokerState): PokerCard {
  if (state.deck.length === 0) {
    throw new Error("The poker deck is empty");
  }

  const nextCard = state.deck[0];
  state.deck = state.deck.slice(1);
  return nextCard;
}

function getPokerBetStep(startingStack: number): number {
  return startingStack >= 40_000 ? 2_000 : 1_000;
}

function getPokerBlindLevel(roundNumber: number, startingStack: number): PokerBlindLevel {
  const multiplier =
    Math.floor(Math.max(0, roundNumber - 1) / POKER_BLIND_INCREASE_ROUNDS) + 1;
  const baseSmallBlind = Math.max(1_000, Math.floor(startingStack / 10));

  return {
    smallBlind: baseSmallBlind * multiplier,
    bigBlind: baseSmallBlind * 2 * multiplier,
  };
}

function getPokerNextSeat(
  playerOrder: string[],
  fromPlayerId: string | null,
  predicate?: (playerId: string) => boolean,
): string | null {
  if (playerOrder.length === 0) return null;
  const startIndex =
    fromPlayerId && playerOrder.includes(fromPlayerId)
      ? playerOrder.indexOf(fromPlayerId)
      : -1;

  for (let step = 1; step <= playerOrder.length; step += 1) {
    const nextIndex = (startIndex + step) % playerOrder.length;
    const playerId = playerOrder[nextIndex];
    if (!predicate || predicate(playerId)) {
      return playerId;
    }
  }

  return null;
}

function isPokerPlayerInHand(state: PokerState, playerId: string): boolean {
  return (state.holeCardsByPlayerId[playerId] ?? []).length > 0;
}

function isPokerPlayerFolded(state: PokerState, playerId: string): boolean {
  return state.foldedPlayerIds.includes(playerId);
}

function isPokerPlayerAllIn(state: PokerState, playerId: string): boolean {
  return state.allInPlayerIds.includes(playerId) || (state.stackByPlayerId[playerId] ?? 0) <= 0;
}

function getPokerEligiblePlayerIds(state: PokerState): string[] {
  return state.playerOrder.filter(
    (playerId) =>
      isPokerPlayerInHand(state, playerId) && !isPokerPlayerFolded(state, playerId),
  );
}

function getPokerActionablePlayerIds(state: PokerState): string[] {
  return getPokerEligiblePlayerIds(state).filter(
    (playerId) => !isPokerPlayerAllIn(state, playerId),
  );
}

function getPokerPlayersWithChips(state: PokerState): string[] {
  return state.playerOrder.filter((playerId) => (state.stackByPlayerId[playerId] ?? 0) > 0);
}

function getPokerMinimumAggressiveBetTotal(
  state: PokerState,
  playerId: string,
): number {
  const stack = state.stackByPlayerId[playerId] ?? 0;
  const currentStreetBet = state.playerBets[playerId] ?? 0;
  const minimumTarget =
    state.currentBet > 0
      ? state.currentBet + state.betStep
      : Math.max(
          state.betStep,
          Math.ceil(state.bigBlindAmount / state.betStep) * state.betStep,
        );

  return Math.min(stack + currentStreetBet, minimumTarget);
}

function postPokerForcedBet(
  state: PokerState,
  playerId: string | null,
  amount: number,
): number {
  if (!playerId) return 0;
  const stack = state.stackByPlayerId[playerId] ?? 0;
  const posted = Math.min(stack, amount);
  state.stackByPlayerId[playerId] = stack - posted;
  state.playerBets[playerId] = (state.playerBets[playerId] ?? 0) + posted;
  state.totalContributionsByPlayerId[playerId] =
    (state.totalContributionsByPlayerId[playerId] ?? 0) + posted;
  state.pot += posted;
  if (state.stackByPlayerId[playerId] === 0 && posted > 0) {
    state.allInPlayerIds = Array.from(
      new Set([...state.allInPlayerIds, playerId]),
    );
  }
  return posted;
}

function sortRanksDescending(values: number[]): number[] {
  return [...values].sort((a, b) => b - a);
}

function getStraightHighCard(ranks: number[]): number | null {
  const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => b - a);
  if (uniqueRanks.includes(14)) {
    uniqueRanks.push(1);
  }

  let streak = 1;
  for (let index = 0; index < uniqueRanks.length - 1; index += 1) {
    if (uniqueRanks[index] - 1 === uniqueRanks[index + 1]) {
      streak += 1;
      if (streak >= 5) {
        return uniqueRanks[index - 3];
      }
    } else {
      streak = 1;
    }
  }

  return null;
}

function getPokerCardRankValue(card: PokerCard): number {
  return card.rank === 1 ? 14 : card.rank;
}

function evaluateFiveCardPokerHand(cards: PokerCard[]): PokerHandEvaluation {
  const ranks = sortRanksDescending(cards.map(getPokerCardRankValue));
  const rankCounts = new Map<number, number>();
  for (const rank of ranks) {
    rankCounts.set(rank, (rankCounts.get(rank) ?? 0) + 1);
  }

  const entries = Array.from(rankCounts.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  const isFlush = cards.every((card) => card.suit === cards[0]?.suit);
  const straightHigh = getStraightHighCard(ranks);

  if (isFlush && straightHigh !== null) {
    return {
      category: 8,
      values: [straightHigh],
      label: straightHigh === 14 ? "Royal Flush" : "Straight Flush",
    };
  }

  if (entries[0]?.[1] === 4) {
    return {
      category: 7,
      values: [entries[0][0], entries[1]?.[0] ?? 0],
      label: "Four of a Kind",
    };
  }

  if (entries[0]?.[1] === 3 && entries[1]?.[1] === 2) {
    return {
      category: 6,
      values: [entries[0][0], entries[1][0]],
      label: "Full House",
    };
  }

  if (isFlush) {
    return {
      category: 5,
      values: ranks,
      label: "Flush",
    };
  }

  if (straightHigh !== null) {
    return {
      category: 4,
      values: [straightHigh],
      label: "Straight",
    };
  }

  if (entries[0]?.[1] === 3) {
    return {
      category: 3,
      values: [entries[0][0], ...entries.slice(1).map(([rank]) => rank)],
      label: "Three of a Kind",
    };
  }

  if (entries[0]?.[1] === 2 && entries[1]?.[1] === 2) {
    const pairRanks = entries
      .filter(([, count]) => count === 2)
      .map(([rank]) => rank)
      .sort((a, b) => b - a);
    const kicker = entries.find(([, count]) => count === 1)?.[0] ?? 0;
    return {
      category: 2,
      values: [...pairRanks, kicker],
      label: "Two Pair",
    };
  }

  if (entries[0]?.[1] === 2) {
    return {
      category: 1,
      values: [entries[0][0], ...entries.slice(1).map(([rank]) => rank)],
      label: "Pair",
    };
  }

  return {
    category: 0,
    values: ranks,
    label: "High Card",
  };
}

function comparePokerHands(
  left: PokerHandEvaluation,
  right: PokerHandEvaluation,
): number {
  if (left.category !== right.category) {
    return left.category - right.category;
  }

  const maxLength = Math.max(left.values.length, right.values.length);
  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = left.values[index] ?? 0;
    const rightValue = right.values[index] ?? 0;
    if (leftValue !== rightValue) {
      return leftValue - rightValue;
    }
  }

  return 0;
}

function getFiveCardCombinations(cards: PokerCard[]): PokerCard[][] {
  const combinations: PokerCard[][] = [];
  for (let a = 0; a < cards.length - 4; a += 1) {
    for (let b = a + 1; b < cards.length - 3; b += 1) {
      for (let c = b + 1; c < cards.length - 2; c += 1) {
        for (let d = c + 1; d < cards.length - 1; d += 1) {
          for (let e = d + 1; e < cards.length; e += 1) {
            combinations.push([cards[a], cards[b], cards[c], cards[d], cards[e]]);
          }
        }
      }
    }
  }
  return combinations;
}

function evaluateSevenCardPokerHand(cards: PokerCard[]): PokerHandEvaluation {
  const combinations = getFiveCardCombinations(cards);
  let best = evaluateFiveCardPokerHand(combinations[0] ?? cards.slice(0, 5));
  for (const combination of combinations.slice(1)) {
    const nextEvaluation = evaluateFiveCardPokerHand(combination);
    if (comparePokerHands(nextEvaluation, best) > 0) {
      best = nextEvaluation;
    }
  }
  return best;
}

function getPokerRoundDealerPlayerId(
  playerOrder: string[],
  previousDealerPlayerId: string | null,
  stackByPlayerId: Record<string, number>,
): string | null {
  const eligiblePlayers = playerOrder.filter(
    (playerId) => (stackByPlayerId[playerId] ?? 0) > 0,
  );
  if (eligiblePlayers.length === 0) return null;
  if (!previousDealerPlayerId || !eligiblePlayers.includes(previousDealerPlayerId)) {
    return eligiblePlayers[0] ?? null;
  }

  return (
    getPokerNextSeat(eligiblePlayers, previousDealerPlayerId) ??
    eligiblePlayers[0] ??
    null
  );
}

function getPokerNextActionPlayerId(
  state: PokerState,
  fromPlayerId: string | null,
): string | null {
  const actionablePlayers = getPokerActionablePlayerIds(state);
  if (actionablePlayers.length === 0) return null;

  return (
    getPokerNextSeat(actionablePlayers, fromPlayerId, (playerId) =>
      actionablePlayers.includes(playerId),
    ) ?? actionablePlayers[0] ?? null
  );
}

function isPokerBettingRoundComplete(state: PokerState): boolean {
  const actionablePlayers = getPokerActionablePlayerIds(state);
  if (actionablePlayers.length === 0) return true;

  return actionablePlayers.every((playerId) => {
    if (!state.actedPlayerIds.includes(playerId)) {
      return false;
    }
    return (state.playerBets[playerId] ?? 0) === state.currentBet;
  });
}

function dealPokerCommunityCards(state: PokerState, count: number) {
  for (let index = 0; index < count; index += 1) {
    state.communityCards.push(drawPokerCard(state));
  }
}

function resetPokerBettingRound(
  state: PokerState,
  nextPhase: Exclude<PokerPhase, "PRE_FLOP" | "SHOWDOWN">,
) {
  state.phase = nextPhase;
  state.currentBet = 0;
  state.playerBets = Object.fromEntries(
    state.playerOrder.map((playerId) => [playerId, 0]),
  );
  state.actedPlayerIds = [];
  state.lastActionByPlayerId = Object.fromEntries(
    state.playerOrder.map((playerId) => [playerId, "NONE" as PokerPlayerAction]),
  );
  state.currentPlayerId = getPokerNextActionPlayerId(state, state.dealerPlayerId);
}

function resolvePokerShowdown(state: PokerState): {
  pointPlayerIds: string[];
  drinkPlayerIds: string[];
} {
  const eligiblePlayers = getPokerEligiblePlayerIds(state);
  const pointPlayerIds: string[] = [];
  const drinkPlayerIds: string[] = [];

  if (eligiblePlayers.length === 1) {
    const soleWinnerId = eligiblePlayers[0];
    state.winnerPlayerIds = [soleWinnerId];
    state.handLabelByPlayerId[soleWinnerId] = "Last Player Standing";
  } else {
    let bestEvaluation: PokerHandEvaluation | null = null;
    const winningPlayerIds: string[] = [];

    for (const playerId of eligiblePlayers) {
      const evaluation = evaluateSevenCardPokerHand([
        ...(state.holeCardsByPlayerId[playerId] ?? []),
        ...state.communityCards,
      ]);
      state.handLabelByPlayerId[playerId] = evaluation.label;

      if (!bestEvaluation || comparePokerHands(evaluation, bestEvaluation) > 0) {
        bestEvaluation = evaluation;
        winningPlayerIds.splice(0, winningPlayerIds.length, playerId);
      } else if (bestEvaluation && comparePokerHands(evaluation, bestEvaluation) === 0) {
        winningPlayerIds.push(playerId);
      }
    }

    state.winnerPlayerIds = winningPlayerIds;
  }

  for (const playerId of state.winnerPlayerIds) {
    pointPlayerIds.push(playerId);
  }

  for (const playerId of state.playerOrder) {
    if ((state.holeCardsByPlayerId[playerId] ?? []).length === 0) continue;
    if (!state.winnerPlayerIds.includes(playerId)) {
      drinkPlayerIds.push(playerId);
    }
  }

  const winnerShare =
    state.winnerPlayerIds.length > 0
      ? Math.floor(state.pot / state.winnerPlayerIds.length)
      : 0;
  const remainder =
    state.winnerPlayerIds.length > 0 ? state.pot % state.winnerPlayerIds.length : 0;

  state.winnerPlayerIds.forEach((playerId, index) => {
    state.stackByPlayerId[playerId] =
      (state.stackByPlayerId[playerId] ?? 0) +
      winnerShare +
      (index === 0 ? remainder : 0);
  });

  state.phase = "SHOWDOWN";
  state.currentPlayerId = null;

  return {
    pointPlayerIds,
    drinkPlayerIds,
  };
}

function maybeResolvePokerByLastPlayer(state: PokerState):
  | { pointPlayerIds: string[]; drinkPlayerIds: string[] }
  | null {
  const eligiblePlayers = getPokerEligiblePlayerIds(state);
  if (eligiblePlayers.length > 1) return null;

  return resolvePokerShowdown(state);
}

function advancePokerStateAfterAction(state: PokerState): {
  pointPlayerIds: string[];
  drinkPlayerIds: string[];
} {
  const immediateResolution = maybeResolvePokerByLastPlayer(state);
  if (immediateResolution) {
    return immediateResolution;
  }

  if (!isPokerBettingRoundComplete(state)) {
    return {
      pointPlayerIds: [],
      drinkPlayerIds: [],
    };
  }

  if (state.phase === "PRE_FLOP") {
    dealPokerCommunityCards(state, 3);
    resetPokerBettingRound(state, "FLOP");
  } else if (state.phase === "FLOP") {
    dealPokerCommunityCards(state, 1);
    resetPokerBettingRound(state, "TURN");
  } else if (state.phase === "TURN") {
    dealPokerCommunityCards(state, 1);
    resetPokerBettingRound(state, "RIVER");
  } else {
    return resolvePokerShowdown(state);
  }

  while (state.currentPlayerId === null && getPokerActionablePlayerIds(state).length === 0) {
    const phase = state.phase as PokerPhase;

    if (phase === "FLOP") {
      dealPokerCommunityCards(state, 1);
      resetPokerBettingRound(state, "TURN");
    } else if (phase === "TURN") {
      dealPokerCommunityCards(state, 1);
      resetPokerBettingRound(state, "RIVER");
    } else if (phase === "RIVER") {
      return resolvePokerShowdown(state);
    } else {
      break;
    }
  }

  return {
    pointPlayerIds: [],
    drinkPlayerIds: [],
  };
}

function parsePokerCard(raw: unknown): PokerCard | null {
  if (!raw || typeof raw !== "object") return null;
  const card = raw as Partial<PokerCard>;
  if (
    typeof card.rank !== "number" ||
    !Number.isInteger(card.rank) ||
    card.rank < 1 ||
    card.rank > 13
  ) {
    return null;
  }
  if (
    card.suit !== "HEARTS" &&
    card.suit !== "DIAMONDS" &&
    card.suit !== "CLUBS" &&
    card.suit !== "SPADES"
  ) {
    return null;
  }

  return {
    rank: card.rank,
    suit: card.suit,
  };
}

function parsePokerState(raw: string | null, playerIds: string[]): PokerState {
  const baseStacks = Object.fromEntries(
    playerIds.map((playerId) => [playerId, POKER_STARTING_STACK]),
  );
  const fallbackState = createInitialPokerState(playerIds, baseStacks).state;
  if (!raw) return fallbackState;

  try {
    const parsed = JSON.parse(raw) as Partial<PokerState>;
    const playerOrder = [
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

    const holeCardsByPlayerId: Record<string, PokerCard[]> = {};
    for (const playerId of playerOrder) {
      const rawHand =
        parsed.holeCardsByPlayerId && typeof parsed.holeCardsByPlayerId === "object"
          ? (parsed.holeCardsByPlayerId as Record<string, unknown>)[playerId]
          : [];
      holeCardsByPlayerId[playerId] = Array.isArray(rawHand)
        ? rawHand
            .map((card) => parsePokerCard(card))
            .filter((card): card is PokerCard => card !== null)
        : [];
    }

    const numericRecord = (value: unknown, defaultValue = 0) =>
      Object.fromEntries(
        playerOrder.map((playerId) => {
          const nextValue =
            value && typeof value === "object"
              ? (value as Record<string, unknown>)[playerId]
              : undefined;
          return [
            playerId,
            typeof nextValue === "number" && Number.isFinite(nextValue)
              ? nextValue
              : defaultValue,
          ];
        }),
      );

    const lastActionByPlayerId = Object.fromEntries(
      playerOrder.map((playerId) => {
        const rawAction =
          parsed.lastActionByPlayerId && typeof parsed.lastActionByPlayerId === "object"
            ? (parsed.lastActionByPlayerId as Record<string, unknown>)[playerId]
            : undefined;
        return [
          playerId,
          rawAction === "CHECK" ||
          rawAction === "CALL" ||
          rawAction === "BET" ||
          rawAction === "FOLD"
            ? rawAction
            : "NONE",
        ];
      }),
    ) as Record<string, PokerPlayerAction>;

    const parsePlayerIdList = (value: unknown) =>
      Array.isArray(value)
        ? value.filter(
            (playerId): playerId is string => playerOrder.includes(playerId),
          )
        : [];

    const handLabelByPlayerId = Object.fromEntries(
      playerOrder.map((playerId) => {
        const rawLabel =
          parsed.handLabelByPlayerId &&
          typeof parsed.handLabelByPlayerId === "object"
            ? (parsed.handLabelByPlayerId as Record<string, unknown>)[playerId]
            : undefined;
        return [playerId, typeof rawLabel === "string" ? rawLabel : null];
      }),
    ) as Record<string, string | null>;

    return {
      status: parsed.status === "ENDED" ? "ENDED" : "PLAYING",
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber > 0
          ? Math.floor(parsed.roundNumber)
          : 1,
      phase:
        parsed.phase === "FLOP" ||
        parsed.phase === "TURN" ||
        parsed.phase === "RIVER" ||
        parsed.phase === "SHOWDOWN"
          ? parsed.phase
          : "PRE_FLOP",
      startingStack:
        typeof parsed.startingStack === "number" &&
        Number.isFinite(parsed.startingStack)
          ? parsed.startingStack
          : POKER_STARTING_STACK,
      betStep:
        typeof parsed.betStep === "number" && Number.isFinite(parsed.betStep)
          ? parsed.betStep
          : getPokerBetStep(
              typeof parsed.startingStack === "number" &&
                Number.isFinite(parsed.startingStack)
                ? parsed.startingStack
                : POKER_STARTING_STACK,
            ),
      playerOrder,
      currentPlayerId:
        typeof parsed.currentPlayerId === "string" &&
        playerOrder.includes(parsed.currentPlayerId)
          ? parsed.currentPlayerId
          : null,
      dealerPlayerId:
        typeof parsed.dealerPlayerId === "string" &&
        playerOrder.includes(parsed.dealerPlayerId)
          ? parsed.dealerPlayerId
          : null,
      smallBlindPlayerId:
        typeof parsed.smallBlindPlayerId === "string" &&
        playerOrder.includes(parsed.smallBlindPlayerId)
          ? parsed.smallBlindPlayerId
          : null,
      bigBlindPlayerId:
        typeof parsed.bigBlindPlayerId === "string" &&
        playerOrder.includes(parsed.bigBlindPlayerId)
          ? parsed.bigBlindPlayerId
          : null,
      smallBlindAmount:
        typeof parsed.smallBlindAmount === "number"
          ? parsed.smallBlindAmount
          : POKER_SMALL_BLIND_BASE,
      bigBlindAmount:
        typeof parsed.bigBlindAmount === "number"
          ? parsed.bigBlindAmount
          : POKER_BIG_BLIND_BASE,
      currentBet:
        typeof parsed.currentBet === "number" && Number.isFinite(parsed.currentBet)
          ? parsed.currentBet
          : 0,
      pot: typeof parsed.pot === "number" && Number.isFinite(parsed.pot) ? parsed.pot : 0,
      deck: Array.isArray(parsed.deck)
        ? parsed.deck
            .map((card) => parsePokerCard(card))
            .filter((card): card is PokerCard => card !== null)
        : [],
      communityCards: Array.isArray(parsed.communityCards)
        ? parsed.communityCards
            .map((card) => parsePokerCard(card))
            .filter((card): card is PokerCard => card !== null)
        : [],
      holeCardsByPlayerId,
      stackByPlayerId: numericRecord(parsed.stackByPlayerId, POKER_STARTING_STACK),
      playerBets: numericRecord(parsed.playerBets),
      totalContributionsByPlayerId: numericRecord(parsed.totalContributionsByPlayerId),
      actedPlayerIds: parsePlayerIdList(parsed.actedPlayerIds),
      foldedPlayerIds: parsePlayerIdList(parsed.foldedPlayerIds),
      allInPlayerIds: parsePlayerIdList(parsed.allInPlayerIds),
      lastActionByPlayerId,
      lastActionPlayerId:
        typeof parsed.lastActionPlayerId === "string" &&
        playerOrder.includes(parsed.lastActionPlayerId)
          ? parsed.lastActionPlayerId
          : null,
      lastActionAmount:
        typeof parsed.lastActionAmount === "number" && Number.isFinite(parsed.lastActionAmount)
          ? parsed.lastActionAmount
          : null,
      winnerPlayerIds: parsePlayerIdList(parsed.winnerPlayerIds),
      handLabelByPlayerId,
    };
  } catch {
    return fallbackState;
  }
}

function createInitialPokerState(
  playerIds: string[],
  existingStacks?: Record<string, number>,
  previousRoundNumber = 0,
  previousDealerPlayerId: string | null = null,
  startingStack = POKER_STARTING_STACK,
): {
  state: PokerState;
  pointPlayerIds: string[];
  drinkPlayerIds: string[];
} {
  const roundNumber = Math.max(1, previousRoundNumber + 1);
  const blindLevel = getPokerBlindLevel(roundNumber, startingStack);
  const betStep = getPokerBetStep(startingStack);
  const stackByPlayerId = Object.fromEntries(
    playerIds.map((playerId) => [
      playerId,
      existingStacks?.[playerId] ?? startingStack,
    ]),
  );
  const dealerPlayerId = getPokerRoundDealerPlayerId(
    playerIds,
    previousDealerPlayerId,
    stackByPlayerId,
  );
  const activeSeatPredicate = (playerId: string) => (stackByPlayerId[playerId] ?? 0) > 0;
  const smallBlindPlayerId = getPokerNextSeat(
    playerIds,
    dealerPlayerId,
    activeSeatPredicate,
  );
  const bigBlindPlayerId = getPokerNextSeat(
    playerIds,
    smallBlindPlayerId,
    activeSeatPredicate,
  );
  const deck = createPokerDeck();
  const state: PokerState = {
    status: "PLAYING",
    roundNumber,
    phase: "PRE_FLOP",
    startingStack,
    betStep,
    playerOrder: [...playerIds],
    currentPlayerId: null,
    dealerPlayerId,
    smallBlindPlayerId,
    bigBlindPlayerId,
    smallBlindAmount: blindLevel.smallBlind,
    bigBlindAmount: blindLevel.bigBlind,
    currentBet: blindLevel.bigBlind,
    pot: 0,
    deck,
    communityCards: [],
    holeCardsByPlayerId: Object.fromEntries(
      playerIds.map((playerId) => [playerId, [] as PokerCard[]]),
    ),
    stackByPlayerId,
    playerBets: Object.fromEntries(playerIds.map((playerId) => [playerId, 0])),
    totalContributionsByPlayerId: Object.fromEntries(
      playerIds.map((playerId) => [playerId, 0]),
    ),
    actedPlayerIds: [],
    foldedPlayerIds: [],
    allInPlayerIds: [],
    lastActionByPlayerId: Object.fromEntries(
      playerIds.map((playerId) => [playerId, "NONE" as PokerPlayerAction]),
    ),
    lastActionPlayerId: null,
    lastActionAmount: null,
    winnerPlayerIds: [],
    handLabelByPlayerId: Object.fromEntries(
      playerIds.map((playerId) => [playerId, null]),
    ),
  };

  const activePlayers = playerIds.filter((playerId) => activeSeatPredicate(playerId));
  for (let pass = 0; pass < 2; pass += 1) {
    for (const playerId of activePlayers) {
      state.holeCardsByPlayerId[playerId]?.push(drawPokerCard(state));
    }
  }

  postPokerForcedBet(state, smallBlindPlayerId, blindLevel.smallBlind);
  postPokerForcedBet(state, bigBlindPlayerId, blindLevel.bigBlind);
  state.currentBet = Math.max(
    state.playerBets[smallBlindPlayerId ?? ""] ?? 0,
    state.playerBets[bigBlindPlayerId ?? ""] ?? blindLevel.bigBlind,
  );
  state.currentPlayerId = getPokerNextActionPlayerId(state, bigBlindPlayerId);

  if (getPokerEligiblePlayerIds(state).length <= 1) {
    return {
      state,
      ...resolvePokerShowdown(state),
    };
  }

  return {
    state,
    pointPlayerIds: [],
    drinkPlayerIds: [],
  };
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

type PlayerAddedRoomContext = {
  id: string;
  allPairIds: string[];
  playingTeams: string[];
  currentAnswer: string | null;
  currentPlayerId: string | null;
  rounds: number;
  players: Array<{
    id: string;
    team: string;
  }>;
  game: {
    code: string;
    questions: Array<{
      id: number;
      edition: number | null;
    }>;
  };
};

type AddedPlayerContext = {
  id: string;
  team: string;
};

async function syncRoomStateAfterPlayerAdded(
  tx: Prisma.TransactionClient,
  room: PlayerAddedRoomContext,
  newPlayer: AddedPlayerContext,
) {
  const nextPlayers = [...room.players, newPlayer];
  const nextPlayerIds = nextPlayers.map((player) => player.id);

  switch (room.game.code) {
    case "verbal-charades":
    case "taboo-lite": {
      const allPairs = [...(room.allPairIds || [])];
      for (const existingPlayer of room.players) {
        allPairs.push([newPlayer.id, existingPlayer.id].join("&"));
        allPairs.push([existingPlayer.id, newPlayer.id].join("&"));
      }

      await tx.room.update({
        where: { id: room.id },
        data: {
          allPairIds: allPairs,
        },
      });
      return;
    }

    case "who-am-i": {
      const state = parseWhoAmIState(room.currentAnswer, nextPlayerIds);
      if (!state) {
        throw new Error("Who Am I state is missing");
      }

      const assignedQuestionIds = Object.values(state.assignmentsByPlayerId);
      const availableQuestionIds = room.game.questions
        .map((question) => question.id)
        .filter((questionId) => !assignedQuestionIds.includes(questionId));

      if (availableQuestionIds.length === 0) {
        throw new Error(
          "Who Am I needs at least one free card to add another player.",
        );
      }

      const newQuestionId = shuffleArray(availableQuestionIds)[0];
      state.assignmentsByPlayerId[newPlayer.id] = newQuestionId;
      if (!state.usedQuestionIds.includes(newQuestionId)) {
        state.usedQuestionIds = [...state.usedQuestionIds, newQuestionId];
      }

      await tx.room.update({
        where: { id: room.id },
        data: {
          currentAnswer: JSON.stringify(state),
        },
      });
      return;
    }

    case "name-the-song": {
      const questionIds = room.game.questions.map((question) => question.id);
      const state = parseNameTheSongState(
        room.currentAnswer,
        nextPlayerIds,
        questionIds,
      );

      await tx.room.update({
        where: { id: room.id },
        data: {
          currentAnswer: JSON.stringify(state),
        },
      });
      return;
    }

    case "guess-the-movie": {
      const questionIds = getGuessTheMovieQuestionIds(
        room.game.questions,
        room.rounds ?? GUESS_THE_MOVIE_ALL_CATEGORY,
      );
      const state = parseGuessTheMovieState(
        room.currentAnswer,
        nextPlayerIds,
        questionIds,
        room.rounds ?? GUESS_THE_MOVIE_ALL_CATEGORY,
      );

      await tx.room.update({
        where: { id: room.id },
        data: {
          currentAnswer: JSON.stringify(state),
        },
      });
      return;
    }

    case "ride-the-bus": {
      const state = parseRideTheBusState(room.currentAnswer, nextPlayerIds);
      if (!nextPlayerIds.includes(newPlayer.id)) {
        return;
      }

      state.playerOrder = nextPlayerIds;
      state.resetsByPlayerId[newPlayer.id] = 0;
      if (state.phase === "MAIN" && !state.completedPlayerIds.includes(newPlayer.id)) {
        state.completedPlayerIds = state.completedPlayerIds.filter(
          (playerId) => playerId !== newPlayer.id,
        );
      }
      if (!state.currentPlayerId) {
        state.currentPlayerId = nextPlayerIds[0] ?? null;
      }

      await tx.room.update({
        where: { id: room.id },
        data: {
          currentAnswer: JSON.stringify(state),
          currentPlayerId: state.currentPlayerId,
        },
      });
      return;
    }

    case "blackjack": {
      const state = parseBlackjackState(room.currentAnswer, nextPlayerIds);
      state.playerOrder = nextPlayerIds;
      state.handsByPlayerId[newPlayer.id] = state.handsByPlayerId[newPlayer.id] ?? [];
      state.resultByPlayerId[newPlayer.id] = state.resultByPlayerId[newPlayer.id] ?? null;
      state.stoodPlayerIds = state.stoodPlayerIds.filter(
        (playerId) => playerId !== newPlayer.id,
      );
      state.bustedPlayerIds = state.bustedPlayerIds.filter(
        (playerId) => playerId !== newPlayer.id,
      );
      state.finishedPlayerIds = state.finishedPlayerIds.filter(
        (playerId) => playerId !== newPlayer.id,
      );

      await tx.room.update({
        where: { id: room.id },
        data: {
          currentAnswer: JSON.stringify(state),
          currentPlayerId: state.currentPlayerId,
        },
      });
      return;
    }

    case "poker": {
      const state = parsePokerState(room.currentAnswer, nextPlayerIds);
      state.playerOrder = nextPlayerIds;
      state.holeCardsByPlayerId[newPlayer.id] = [];
      state.stackByPlayerId[newPlayer.id] = state.startingStack;
      state.playerBets[newPlayer.id] = 0;
      state.totalContributionsByPlayerId[newPlayer.id] = 0;
      state.lastActionByPlayerId[newPlayer.id] = "NONE";
      state.handLabelByPlayerId[newPlayer.id] = null;
      state.actedPlayerIds = state.actedPlayerIds.filter((playerId) => playerId !== newPlayer.id);
      state.foldedPlayerIds = state.foldedPlayerIds.filter((playerId) => playerId !== newPlayer.id);
      state.allInPlayerIds = state.allInPlayerIds.filter((playerId) => playerId !== newPlayer.id);
      state.winnerPlayerIds = state.winnerPlayerIds.filter((playerId) => playerId !== newPlayer.id);

      await tx.room.update({
        where: { id: room.id },
        data: {
          currentAnswer: JSON.stringify(state),
          currentPlayerId: state.currentPlayerId,
        },
      });
      return;
    }

    case "guess-the-number": {
      const state = parseGuessTheNumberState(
        room.currentAnswer,
        nextPlayerIds,
        room.currentPlayerId,
      );

      await tx.room.update({
        where: { id: room.id },
        data: {
          currentAnswer: JSON.stringify(state),
        },
      });
      return;
    }

    case "connect-the-letters": {
      const state = parseConnectLettersState(room.currentAnswer, nextPlayerIds);

      await tx.room.update({
        where: { id: room.id },
        data: {
          currentAnswer: JSON.stringify(state),
          currentPlayerId: state.currentPair?.[0] ?? room.currentPlayerId,
        },
      });
      return;
    }

    case "ghost-tears": {
      const state = parseGhostTearsState(
        room.currentAnswer,
        nextPlayerIds,
        room.currentPlayerId,
      );

      await tx.room.update({
        where: { id: room.id },
        data: {
          currentAnswer: JSON.stringify(state),
          currentPlayerId: state.currentPlayerId,
        },
      });
      return;
    }

    case "joker-loop": {
      const state = buildJokerLoopState(nextPlayerIds);

      await tx.room.update({
        where: { id: room.id },
        data: {
          currentAnswer: JSON.stringify(state),
          currentPlayerId: state.activeGiverPlayerId,
        },
      });
      return;
    }

    case "triviyay": {
      if (!newPlayer.team || room.playingTeams.includes(newPlayer.team)) {
        return;
      }

      await tx.room.update({
        where: { id: room.id },
        data: {
          playingTeams: [...room.playingTeams, newPlayer.team],
        },
      });
      return;
    }

    case "codenames": {
      if (!newPlayer.team) {
        return;
      }

      const redPlayers = nextPlayers.filter((player) => player.team === "RED");
      const bluePlayers = nextPlayers.filter((player) => player.team === "BLUE");

      await tx.room.update({
        where: { id: room.id },
        data: {
          playingTeams: ["RED", "BLUE"],
          playerOneId: redPlayers[0]?.id ?? null,
          playerTwoId: bluePlayers[0]?.id ?? null,
        },
      });
      return;
    }

    default:
      return;
  }
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
  getMovieCategories: baseProcedure.query(async () => {
    const categories = await prisma.parms.findMany({
      where: {
        type: "MOVIE_CATEGORY",
      },
      orderBy: {
        value: "asc",
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      value: category.value,
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
              hasChangedName: true,
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
        selectedStake: z.number().int().min(10000).max(50000).optional().default(10000),
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
        if (
          input.selectedGame === "who-am-i" &&
          (input.players?.length || 0) < 2
        ) {
          throw new Error("Who Am I requires at least 2 players.");
        }
        if (
          input.selectedGame === "name-the-song" &&
          (input.players?.length || 0) < 2
        ) {
          throw new Error("Name The Song requires at least 2 players.");
        }
        if (
          input.selectedGame === "guess-the-movie" &&
          (input.players?.length || 0) < 2
        ) {
          throw new Error("Guess The Movie requires at least 2 players.");
        }
        if (
          input.selectedGame === "ride-the-bus" &&
          (input.players?.length || 0) < 2
        ) {
          throw new Error("Ride the Bus requires at least 2 players.");
        }
        if (
          input.selectedGame === "blackjack" &&
          (input.players?.length || 0) < 1
        ) {
          throw new Error("Blackjack requires at least 1 player.");
        }
        if (
          input.selectedGame === "poker" &&
          (input.players?.length || 0) < 2
        ) {
          throw new Error("Poker requires at least 2 players.");
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
          let rideTheBusCurrentPlayerId: string | null = null;
          let blackjackCurrentPlayerId: string | null = null;
          let blackjackPointPlayerIds: string[] = [];
          let blackjackDrinkPlayerIds: string[] = [];
          let pokerCurrentPlayerId: string | null = null;

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
          if (input.selectedGame === "who-am-i") {
            const playerIds = createdRoom.players.map((player) => player.id);
            const questionIds = createdRoom.game.questions.map((question) => question.id);
            roomCurrentAnswer = JSON.stringify(
              buildWhoAmIState(playerIds, questionIds),
            );
          }
          if (input.selectedGame === "name-the-song") {
            const questionIds = createdRoom.game.questions.map(
              (question) => question.id,
            );
            roomCurrentAnswer = JSON.stringify(
              buildNameTheSongState(questionIds),
            );
          }
          if (input.selectedGame === "guess-the-movie") {
            const questionIds = getGuessTheMovieQuestionIds(
              createdRoom.game.questions,
              createdRoom.rounds ?? GUESS_THE_MOVIE_ALL_CATEGORY,
            );
            if (questionIds.length === 0) {
              throw new Error(
                "No movies are available for the selected category.",
              );
            }
            roomCurrentAnswer = JSON.stringify(
              buildGuessTheMovieState(
                questionIds,
                createdRoom.rounds ?? GUESS_THE_MOVIE_ALL_CATEGORY,
              ),
            );
          }
          if (input.selectedGame === "ride-the-bus") {
            const playerIds = createdRoom.players.map((player) => player.id);
            const rideTheBusState = getDefaultRideTheBusState(playerIds);
            roomCurrentAnswer = JSON.stringify(rideTheBusState);
            rideTheBusCurrentPlayerId = rideTheBusState.currentPlayerId;
          }
          if (input.selectedGame === "blackjack") {
            const playerIds = createdRoom.players.map((player) => player.id);
            const blackjackSetup = createInitialBlackjackState(playerIds);
            const blackjackState = blackjackSetup.state;
            roomCurrentAnswer = JSON.stringify(blackjackState);
            blackjackCurrentPlayerId = blackjackState.currentPlayerId;
            blackjackPointPlayerIds = blackjackSetup.pointPlayerIds;
            blackjackDrinkPlayerIds = blackjackSetup.drinkPlayerIds;
          }
          if (input.selectedGame === "poker") {
            const playerIds = createdRoom.players.map((player) => player.id);
            const pokerSetup = createInitialPokerState(
              playerIds,
              undefined,
              0,
              null,
              input.selectedStake,
            );
            roomCurrentAnswer = JSON.stringify(pokerSetup.state);
            pokerCurrentPlayerId = pokerSetup.state.currentPlayerId;
          }

          const createdRoomId = createdRoom.id;
          await prisma.room.update({
            where: { id: createdRoomId },
            data: {
              currentPlayerId:
                input.selectedGame === "joker-loop"
                  ? jokerLoopCurrentPlayerId
                  : input.selectedGame === "ride-the-bus"
                    ? rideTheBusCurrentPlayerId
                  : input.selectedGame === "blackjack"
                    ? blackjackCurrentPlayerId
                  : input.selectedGame === "poker"
                    ? pokerCurrentPlayerId
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
              currentRound:
                input.selectedGame === "who-am-i" ||
                input.selectedGame === "name-the-song" ||
                input.selectedGame === "guess-the-movie" ||
                input.selectedGame === "blackjack" ||
                input.selectedGame === "poker"
                  ? 1
                  : undefined,
            },
          });

          if (blackjackPointPlayerIds.length > 0) {
            await prisma.player.updateMany({
              where: {
                roomId: createdRoomId,
                id: {
                  in: blackjackPointPlayerIds,
                },
              },
              data: {
                points: {
                  increment: 1,
                },
              },
            });
          }

          if (blackjackDrinkPlayerIds.length > 0) {
            await prisma.player.updateMany({
              where: {
                roomId: createdRoomId,
                id: {
                  in: blackjackDrinkPlayerIds,
                },
              },
              data: {
                drinks: {
                  increment: 1,
                },
              },
            });
          }

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

        await prisma.$transaction(async (tx) => {
          const newPlayer = await tx.player.create({
            data: {
              name: input.newPlayer,
              roomId: input.roomId,
              points: 0,
              drinks: 0,
              team: "",
            },
          });

          await syncRoomStateAfterPlayerAdded(tx, room, {
            id: newPlayer.id,
            team: newPlayer.team,
          });
        });

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

        await prisma.$transaction(async (tx) => {
          const newPlayer = await tx.player.create({
            data: {
              name: input.newPlayer,
              roomId: input.roomId,
              points: 0,
              drinks: 0,
              team: input.team,
            },
          });

          await syncRoomStateAfterPlayerAdded(tx, room, {
            id: newPlayer.id,
            team: newPlayer.team,
          });
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

  changePlayerName: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
        newName: z.string().trim().min(1).max(40),
      }),
    )
    .mutation(async ({ input }) => {
      const room = await prisma.room.findUnique({
        where: { id: input.roomId },
        include: {
          players: {
            select: {
              id: true,
              name: true,
              hasChangedName: true,
            },
          },
        },
      });

      if (!room) {
        throw new Error("Room not found");
      }

      const player = room.players.find((item) => item.id === input.playerId);
      if (!player) {
        throw new Error("Player not found");
      }
      if (player.hasChangedName) {
        throw new Error("You can only change your name once.");
      }
      if (player.name.toLowerCase() === input.newName.toLowerCase()) {
        throw new Error("Please enter a different name.");
      }

      const duplicatePlayer = room.players.find(
        (item) =>
          item.id !== input.playerId &&
          item.name.toLowerCase() === input.newName.toLowerCase(),
      );

      if (duplicatePlayer) {
        throw new Error("Another player already uses this name");
      }

      await prisma.player.update({
        where: {
          id: input.playerId,
        },
        data: {
          name: input.newName,
          hasChangedName: true,
        },
      });

      return {
        playerId: input.playerId,
        name: input.newName,
      };
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
      const pointPlayerId =
        input.verdict === "RIGHT" ? guesserPlayerId : challengerPlayerId;
      const drinkPlayerId =
        input.verdict === "RIGHT" ? challengerPlayerId : guesserPlayerId;
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

      await prisma.$transaction(async (tx) => {
        await tx.player.updateMany({
          where: {
            id: pointPlayerId,
            points: null,
          },
          data: {
            points: 0,
          },
        });
        await tx.player.updateMany({
          where: {
            id: drinkPlayerId,
            drinks: null,
          },
          data: {
            drinks: 0,
          },
        });

        await tx.player.update({
          where: {
            id: pointPlayerId,
          },
          data: {
            points: {
              increment: 1,
            },
          },
        });

        await tx.player.update({
          where: {
            id: drinkPlayerId,
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
            currentPlayerId: nextPair.pair[0],
            currentAnswer: JSON.stringify(state),
          },
        });
      });

      return {
        phase: state.phase,
        verdict: input.verdict,
        pointPlayerId,
        drinkPlayerId,
        roundNumber: state.roundNumber,
        currentPair: state.currentPair,
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

  nameTheSongBuzz: baseProcedure
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
          game: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!room) throw new Error("Room not found");
      if (room.game.code !== "name-the-song") {
        throw new Error("This room is not Name The Song");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (!room.players.some((player) => player.id === input.playerId)) {
        throw new Error("Player not found in room");
      }

      const playerIds = room.players.map((player) => player.id);
      const questionIds = room.game.questions.map((question) => question.id);
      const state = parseNameTheSongState(room.currentAnswer, playerIds, questionIds);

      if (state.status !== "READY") {
        throw new Error("A player has already buzzed for this song");
      }
      if (!state.currentQuestionId) {
        throw new Error("No song is available for this round");
      }

      state.status = "BUZZED";
      state.buzzedPlayerId = input.playerId;
      state.attemptStartedAt = new Date().toISOString();
      state.verdict = null;
      state.pointPlayerIds = [];
      state.drinkPlayerIds = [];

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentPlayerId: input.playerId,
          currentAnswer: JSON.stringify(state),
        },
      });

      return {
        buzzedPlayerId: input.playerId,
        timerSeconds: NAME_THE_SONG_TIMER_SECONDS,
      };
    }),

  nameTheSongJudge: baseProcedure
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
          game: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!room) throw new Error("Room not found");
      if (room.game.code !== "name-the-song") {
        throw new Error("This room is not Name The Song");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }

      const playerIds = room.players.map((player) => player.id);
      const questionIds = room.game.questions.map((question) => question.id);
      const state = parseNameTheSongState(room.currentAnswer, playerIds, questionIds);

      if (state.status !== "BUZZED") {
        throw new Error("There is no active attempt to judge");
      }
      if (!state.buzzedPlayerId || state.buzzedPlayerId !== input.playerId) {
        throw new Error("Only the buzzing player can resolve this round");
      }
      if (!state.attemptStartedAt) {
        throw new Error("Round timer is missing");
      }

      const startedAt = new Date(state.attemptStartedAt).getTime();
      if (
        Number.isFinite(startedAt) &&
        Date.now() - startedAt < NAME_THE_SONG_TIMER_SECONDS * 1000
      ) {
        throw new Error("Wait for the 5-second answer time to finish");
      }

      const otherPlayerIds = playerIds.filter(
        (playerId) => playerId !== state.buzzedPlayerId,
      );

      state.status = "ROUND_RESULT";
      state.verdict = input.verdict;
      state.attemptStartedAt = null;
      state.pointPlayerIds =
        input.verdict === "CORRECT" ? [state.buzzedPlayerId] : otherPlayerIds;
      state.drinkPlayerIds =
        input.verdict === "CORRECT" ? otherPlayerIds : [state.buzzedPlayerId];

      await prisma.$transaction(async (tx) => {
        if (state.pointPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: state.pointPlayerIds,
              },
            },
            data: {
              points: {
                increment: 1,
              },
            },
          });
        }

        if (state.drinkPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: state.drinkPlayerIds,
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
            currentAnswer: JSON.stringify(state),
          },
        });
      });

      return {
        verdict: input.verdict,
        pointPlayerIds: state.pointPlayerIds,
        drinkPlayerIds: state.drinkPlayerIds,
      };
    }),

  nameTheSongNextRound: baseProcedure
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
          game: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!room) throw new Error("Room not found");
      if (room.game.code !== "name-the-song") {
        throw new Error("This room is not Name The Song");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (!room.players.some((player) => player.id === input.playerId)) {
        throw new Error("Player not found in room");
      }
      if (room.players.length < 2) {
        throw new Error("At least 2 players are required");
      }

      const playerIds = room.players.map((player) => player.id);
      const questionIds = room.game.questions.map((question) => question.id);
      const state = parseNameTheSongState(room.currentAnswer, playerIds, questionIds);

      const nextState = buildNameTheSongState(questionIds, state);

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentPlayerId: null,
          currentRound: nextState.roundNumber,
          currentAnswer: JSON.stringify(nextState),
        },
      });

      return {
        roundNumber: nextState.roundNumber,
      };
    }),

  guessTheMovieBuzz: baseProcedure
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
          game: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!room) throw new Error("Room not found");
      if (room.game.code !== "guess-the-movie") {
        throw new Error("This room is not Guess The Movie");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (!room.players.some((player) => player.id === input.playerId)) {
        throw new Error("Player not found in room");
      }

      const playerIds = room.players.map((player) => player.id);
      const questionIds = getGuessTheMovieQuestionIds(
        room.game.questions,
        room.rounds ?? GUESS_THE_MOVIE_ALL_CATEGORY,
      );
      const state = parseGuessTheMovieState(
        room.currentAnswer,
        playerIds,
        questionIds,
        room.rounds ?? GUESS_THE_MOVIE_ALL_CATEGORY,
      );

      if (state.status !== "READY") {
        throw new Error("A player has already buzzed for this movie");
      }
      if (!state.currentQuestionId) {
        throw new Error("No movie is available for this round");
      }

      state.status = "BUZZED";
      state.buzzedPlayerId = input.playerId;
      state.attemptStartedAt = new Date().toISOString();
      state.verdict = null;
      state.pointPlayerIds = [];
      state.drinkPlayerIds = [];

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentPlayerId: input.playerId,
          currentAnswer: JSON.stringify(state),
        },
      });

      return {
        buzzedPlayerId: input.playerId,
        timerSeconds: GUESS_THE_MOVIE_TIMER_SECONDS,
      };
    }),

  guessTheMovieJudge: baseProcedure
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
          game: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!room) throw new Error("Room not found");
      if (room.game.code !== "guess-the-movie") {
        throw new Error("This room is not Guess The Movie");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }

      const playerIds = room.players.map((player) => player.id);
      const questionIds = getGuessTheMovieQuestionIds(
        room.game.questions,
        room.rounds ?? GUESS_THE_MOVIE_ALL_CATEGORY,
      );
      const state = parseGuessTheMovieState(
        room.currentAnswer,
        playerIds,
        questionIds,
        room.rounds ?? GUESS_THE_MOVIE_ALL_CATEGORY,
      );

      if (state.status !== "BUZZED") {
        throw new Error("There is no active attempt to judge");
      }
      if (!state.buzzedPlayerId || state.buzzedPlayerId !== input.playerId) {
        throw new Error("Only the buzzing player can resolve this round");
      }
      if (!state.attemptStartedAt) {
        throw new Error("Round timer is missing");
      }

      const startedAt = new Date(state.attemptStartedAt).getTime();
      if (
        Number.isFinite(startedAt) &&
        Date.now() - startedAt < GUESS_THE_MOVIE_TIMER_SECONDS * 1000
      ) {
        throw new Error("Wait for the 5-second answer time to finish");
      }

      const otherPlayerIds = playerIds.filter(
        (playerId) => playerId !== state.buzzedPlayerId,
      );

      state.status = "ROUND_RESULT";
      state.verdict = input.verdict;
      state.attemptStartedAt = null;
      state.pointPlayerIds =
        input.verdict === "CORRECT" ? [state.buzzedPlayerId] : otherPlayerIds;
      state.drinkPlayerIds =
        input.verdict === "CORRECT" ? otherPlayerIds : [state.buzzedPlayerId];

      await prisma.$transaction(async (tx) => {
        if (state.pointPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: state.pointPlayerIds,
              },
            },
            data: {
              points: {
                increment: 1,
              },
            },
          });
        }

        if (state.drinkPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: state.drinkPlayerIds,
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
            currentAnswer: JSON.stringify(state),
          },
        });
      });

      return {
        verdict: input.verdict,
        pointPlayerIds: state.pointPlayerIds,
        drinkPlayerIds: state.drinkPlayerIds,
      };
    }),

  guessTheMovieNextRound: baseProcedure
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
          game: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!room) throw new Error("Room not found");
      if (room.game.code !== "guess-the-movie") {
        throw new Error("This room is not Guess The Movie");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (!room.players.some((player) => player.id === input.playerId)) {
        throw new Error("Player not found in room");
      }
      if (room.players.length < 2) {
        throw new Error("At least 2 players are required");
      }

      const playerIds = room.players.map((player) => player.id);
      const selectedCategory = room.rounds ?? GUESS_THE_MOVIE_ALL_CATEGORY;
      const questionIds = getGuessTheMovieQuestionIds(
        room.game.questions,
        selectedCategory,
      );
      if (questionIds.length === 0) {
        throw new Error("No movies are available for this category");
      }

      const state = parseGuessTheMovieState(
        room.currentAnswer,
        playerIds,
        questionIds,
        selectedCategory,
      );
      const nextState = buildGuessTheMovieState(
        questionIds,
        selectedCategory,
        state,
      );

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentPlayerId: null,
          currentRound: nextState.roundNumber,
          currentAnswer: JSON.stringify(nextState),
        },
      });

      return {
        roundNumber: nextState.roundNumber,
      };
    }),

  pokerCall: baseProcedure
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
      if (room.game.code !== "poker") {
        throw new Error("This room is not Poker");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parsePokerState(room.currentAnswer, playerIds);
      if (state.phase === "SHOWDOWN") {
        throw new Error("Start the next hand first");
      }
      if (state.currentPlayerId !== input.playerId) {
        throw new Error("It is not your turn");
      }

      const stack = state.stackByPlayerId[input.playerId] ?? 0;
      const toCall = Math.max(
        0,
        state.currentBet - (state.playerBets[input.playerId] ?? 0),
      );
      const posted = Math.min(stack, toCall);

      state.stackByPlayerId[input.playerId] = stack - posted;
      state.playerBets[input.playerId] =
        (state.playerBets[input.playerId] ?? 0) + posted;
      state.totalContributionsByPlayerId[input.playerId] =
        (state.totalContributionsByPlayerId[input.playerId] ?? 0) + posted;
      state.pot += posted;
      state.lastActionByPlayerId[input.playerId] = toCall === 0 ? "CHECK" : "CALL";
      state.lastActionPlayerId = input.playerId;
      state.lastActionAmount = posted;
      state.actedPlayerIds = Array.from(
        new Set([...state.actedPlayerIds, input.playerId]),
      );
      if (state.stackByPlayerId[input.playerId] === 0) {
        state.allInPlayerIds = Array.from(
          new Set([...state.allInPlayerIds, input.playerId]),
        );
      }

      state.currentPlayerId = getPokerNextActionPlayerId(state, input.playerId);
      const roundResolution = advancePokerStateAfterAction(state);
      const phaseAfterAction = state.phase as PokerPhase;
      const gameEnded =
        phaseAfterAction === "SHOWDOWN" && getPokerPlayersWithChips(state).length < 2;
      if (gameEnded) {
        state.status = "ENDED";
      }

      await prisma.$transaction(async (tx) => {
        if (roundResolution.pointPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: roundResolution.pointPlayerIds,
              },
            },
            data: {
              points: {
                increment: 1,
              },
            },
          });
        }

        if (roundResolution.drinkPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: roundResolution.drinkPlayerIds,
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
            currentPlayerId: gameEnded ? null : state.currentPlayerId,
            currentAnswer: JSON.stringify(state),
            ...(gameEnded
              ? {
                  gameEnded: true,
                  gameEndedAt: new Date(),
                }
              : {}),
          },
        });
      });

      return {
        action: state.lastActionByPlayerId[input.playerId],
        currentPlayerId: state.currentPlayerId,
        phase: state.phase as PokerPhase,
        pot: state.pot,
        currentBet: state.currentBet,
        winnerPlayerIds: state.winnerPlayerIds,
        gameEnded,
      };
    }),

  pokerBet: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
        amount: z.number().int().positive(),
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
      if (room.game.code !== "poker") {
        throw new Error("This room is not Poker");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parsePokerState(room.currentAnswer, playerIds);
      if (state.phase === "SHOWDOWN") {
        throw new Error("Start the next hand first");
      }
      if (state.currentPlayerId !== input.playerId) {
        throw new Error("It is not your turn");
      }
      const stack = state.stackByPlayerId[input.playerId] ?? 0;
      const currentStreetBet = state.playerBets[input.playerId] ?? 0;
      const minBet = getPokerMinimumAggressiveBetTotal(state, input.playerId);
      if (stack <= 0) {
        throw new Error("You have no chips left to bet");
      }

      const maxTotalBet = stack + currentStreetBet;
      const betAmount = Math.min(maxTotalBet, input.amount);
      if (betAmount < minBet) {
        throw new Error(`Minimum bet total is ${minBet}.`);
      }
      if (betAmount > maxTotalBet) {
        throw new Error("You cannot bet more chips than you have.");
      }
      if (betAmount !== maxTotalBet && betAmount % state.betStep !== 0) {
        throw new Error(`Bet must move in steps of ${state.betStep}.`);
      }
      if (betAmount <= 0) {
        throw new Error("You have no chips left to bet");
      }

      const posted = betAmount - currentStreetBet;
      if (posted <= 0) {
        throw new Error("Choose a larger bet amount.");
      }

      state.stackByPlayerId[input.playerId] = stack - posted;
      state.playerBets[input.playerId] = betAmount;
      state.totalContributionsByPlayerId[input.playerId] =
        (state.totalContributionsByPlayerId[input.playerId] ?? 0) + posted;
      state.pot += posted;
      state.currentBet = betAmount;
      state.lastActionByPlayerId[input.playerId] = "BET";
      state.lastActionPlayerId = input.playerId;
      state.lastActionAmount = betAmount;
      state.actedPlayerIds = [input.playerId];
      if (state.stackByPlayerId[input.playerId] === 0) {
        state.allInPlayerIds = Array.from(
          new Set([...state.allInPlayerIds, input.playerId]),
        );
      }

      state.currentPlayerId = getPokerNextActionPlayerId(state, input.playerId);
      const roundResolution = advancePokerStateAfterAction(state);
      const phaseAfterAction = state.phase as PokerPhase;
      const gameEnded =
        phaseAfterAction === "SHOWDOWN" && getPokerPlayersWithChips(state).length < 2;
      if (gameEnded) {
        state.status = "ENDED";
      }

      await prisma.$transaction(async (tx) => {
        if (roundResolution.pointPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: roundResolution.pointPlayerIds,
              },
            },
            data: {
              points: {
                increment: 1,
              },
            },
          });
        }

        if (roundResolution.drinkPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: roundResolution.drinkPlayerIds,
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
            currentPlayerId: gameEnded ? null : state.currentPlayerId,
            currentAnswer: JSON.stringify(state),
            ...(gameEnded
              ? {
                  gameEnded: true,
                  gameEndedAt: new Date(),
                }
              : {}),
          },
        });
      });

      return {
        currentPlayerId: state.currentPlayerId,
        phase: state.phase as PokerPhase,
        pot: state.pot,
        currentBet: state.currentBet,
        winnerPlayerIds: state.winnerPlayerIds,
        gameEnded,
      };
    }),

  pokerFold: baseProcedure
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
      if (room.game.code !== "poker") {
        throw new Error("This room is not Poker");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parsePokerState(room.currentAnswer, playerIds);
      if (state.phase === "SHOWDOWN") {
        throw new Error("Start the next hand first");
      }
      if (state.currentPlayerId !== input.playerId) {
        throw new Error("It is not your turn");
      }

      state.foldedPlayerIds = Array.from(
        new Set([...state.foldedPlayerIds, input.playerId]),
      );
      state.actedPlayerIds = Array.from(
        new Set([...state.actedPlayerIds, input.playerId]),
      );
      state.lastActionByPlayerId[input.playerId] = "FOLD";
      state.lastActionPlayerId = input.playerId;
      state.lastActionAmount = 0;

      state.currentPlayerId = getPokerNextActionPlayerId(state, input.playerId);
      const roundResolution = advancePokerStateAfterAction(state);
      const phaseAfterAction = state.phase as PokerPhase;
      const gameEnded =
        phaseAfterAction === "SHOWDOWN" && getPokerPlayersWithChips(state).length < 2;
      if (gameEnded) {
        state.status = "ENDED";
      }

      await prisma.$transaction(async (tx) => {
        if (roundResolution.pointPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: roundResolution.pointPlayerIds,
              },
            },
            data: {
              points: {
                increment: 1,
              },
            },
          });
        }

        if (roundResolution.drinkPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: roundResolution.drinkPlayerIds,
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
            currentPlayerId: gameEnded ? null : state.currentPlayerId,
            currentAnswer: JSON.stringify(state),
            ...(gameEnded
              ? {
                  gameEnded: true,
                  gameEndedAt: new Date(),
                }
              : {}),
          },
        });
      });

      return {
        currentPlayerId: state.currentPlayerId,
        phase: state.phase as PokerPhase,
        winnerPlayerIds: state.winnerPlayerIds,
        gameEnded,
      };
    }),

  pokerNextRound: baseProcedure
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
      if (room.game.code !== "poker") {
        throw new Error("This room is not Poker");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parsePokerState(room.currentAnswer, playerIds);
      if (state.phase !== "SHOWDOWN") {
        throw new Error("Finish the current hand first");
      }

      const playersWithChips = playerIds.filter(
        (playerId) => (state.stackByPlayerId[playerId] ?? 0) > 0,
      );
      if (playersWithChips.length < 2) {
        state.status = "ENDED";

        await prisma.room.update({
          where: { id: input.roomId },
          data: {
            currentPlayerId: null,
            currentAnswer: JSON.stringify(state),
            gameEnded: true,
            gameEndedAt: new Date(),
          },
        });

        return {
          roundNumber: state.roundNumber,
          currentPlayerId: null,
          gameEnded: true,
        };
      }

      const nextSetup = createInitialPokerState(
        playerIds,
        state.stackByPlayerId,
        state.roundNumber,
        state.dealerPlayerId,
        state.startingStack,
      );

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentPlayerId: nextSetup.state.currentPlayerId,
          currentAnswer: JSON.stringify(nextSetup.state),
          currentRound: nextSetup.state.roundNumber,
        },
      });

      return {
        roundNumber: nextSetup.state.roundNumber,
        currentPlayerId: nextSetup.state.currentPlayerId,
        gameEnded: false,
      };
    }),

  blackjackHit: baseProcedure
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
      if (room.game.code !== "blackjack") {
        throw new Error("This room is not Blackjack");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (!room.players.some((player) => player.id === input.playerId)) {
        throw new Error("Player not found in room");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parseBlackjackState(room.currentAnswer, playerIds);

      if (state.phase !== "PLAYER_TURNS") {
        throw new Error("Wait for the next round to start");
      }
      if (!state.currentPlayerId || state.currentPlayerId !== input.playerId) {
        throw new Error("It is not your turn");
      }

      const hand = [...(state.handsByPlayerId[input.playerId] ?? [])];
      if (hand.length === 0) {
        throw new Error("You are joining on the next round");
      }

      hand.push(drawBlackjackCard(state));
      state.handsByPlayerId[input.playerId] = hand;

      const total = getBlackjackHandTotal(hand);
      let pointPlayerIds: string[] = [];
      let drinkPlayerIds: string[] = [];

      if (total >= 21) {
        if (!state.finishedPlayerIds.includes(input.playerId)) {
          state.finishedPlayerIds.push(input.playerId);
        }

        if (total > 21) {
          if (!state.bustedPlayerIds.includes(input.playerId)) {
            state.bustedPlayerIds.push(input.playerId);
          }
        } else if (!state.stoodPlayerIds.includes(input.playerId)) {
          state.stoodPlayerIds.push(input.playerId);
        }

        const nextPlayerId = getNextBlackjackPlayerId(state, input.playerId);
        if (nextPlayerId) {
          state.currentPlayerId = nextPlayerId;
        } else {
          const roundResolution = resolveBlackjackRound(state);
          pointPlayerIds = roundResolution.pointPlayerIds;
          drinkPlayerIds = roundResolution.drinkPlayerIds;
        }
      }

      await prisma.$transaction(async (tx) => {
        if (pointPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: pointPlayerIds,
              },
            },
            data: {
              points: {
                increment: 1,
              },
            },
          });
        }

        if (drinkPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: drinkPlayerIds,
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
            currentPlayerId: state.currentPlayerId,
            currentAnswer: JSON.stringify(state),
          },
        });
      });

      return {
        playerId: input.playerId,
        total,
        currentPlayerId: state.currentPlayerId,
        phase: state.phase as BlackjackRoundPhase,
        pointPlayerIds,
        drinkPlayerIds,
        resultByPlayerId: state.resultByPlayerId,
      };
    }),

  blackjackStand: baseProcedure
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
      if (room.game.code !== "blackjack") {
        throw new Error("This room is not Blackjack");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (!room.players.some((player) => player.id === input.playerId)) {
        throw new Error("Player not found in room");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parseBlackjackState(room.currentAnswer, playerIds);

      if (state.phase !== "PLAYER_TURNS") {
        throw new Error("Wait for the next round to start");
      }
      if (!state.currentPlayerId || state.currentPlayerId !== input.playerId) {
        throw new Error("It is not your turn");
      }

      if ((state.handsByPlayerId[input.playerId] ?? []).length === 0) {
        throw new Error("You are joining on the next round");
      }

      if (!state.stoodPlayerIds.includes(input.playerId)) {
        state.stoodPlayerIds.push(input.playerId);
      }
      if (!state.finishedPlayerIds.includes(input.playerId)) {
        state.finishedPlayerIds.push(input.playerId);
      }

      let pointPlayerIds: string[] = [];
      let drinkPlayerIds: string[] = [];
      const nextPlayerId = getNextBlackjackPlayerId(state, input.playerId);
      if (nextPlayerId) {
        state.currentPlayerId = nextPlayerId;
      } else {
        const roundResolution = resolveBlackjackRound(state);
        pointPlayerIds = roundResolution.pointPlayerIds;
        drinkPlayerIds = roundResolution.drinkPlayerIds;
      }

      await prisma.$transaction(async (tx) => {
        if (pointPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: pointPlayerIds,
              },
            },
            data: {
              points: {
                increment: 1,
              },
            },
          });
        }

        if (drinkPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: drinkPlayerIds,
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
            currentPlayerId: state.currentPlayerId,
            currentAnswer: JSON.stringify(state),
          },
        });
      });

      return {
        playerId: input.playerId,
        currentPlayerId: state.currentPlayerId,
        phase: state.phase as BlackjackRoundPhase,
        pointPlayerIds,
        drinkPlayerIds,
        resultByPlayerId: state.resultByPlayerId,
      };
    }),

  blackjackNextRound: baseProcedure
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
      if (room.game.code !== "blackjack") {
        throw new Error("This room is not Blackjack");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (!room.players.some((player) => player.id === input.playerId)) {
        throw new Error("Player not found in room");
      }

      const playerIds = room.players.map((player) => player.id);
      const currentState = parseBlackjackState(room.currentAnswer, playerIds);
      if (currentState.phase !== "ROUND_RESULT") {
        throw new Error("Finish the current round first");
      }

      const nextRoundSetup = createInitialBlackjackState(
        playerIds,
        currentState.roundNumber,
      );
      const nextState = nextRoundSetup.state;

      await prisma.$transaction(async (tx) => {
        if (nextRoundSetup.pointPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: nextRoundSetup.pointPlayerIds,
              },
            },
            data: {
              points: {
                increment: 1,
              },
            },
          });
        }

        if (nextRoundSetup.drinkPlayerIds.length > 0) {
          await tx.player.updateMany({
            where: {
              roomId: input.roomId,
              id: {
                in: nextRoundSetup.drinkPlayerIds,
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
            currentPlayerId: nextState.currentPlayerId,
            currentAnswer: JSON.stringify(nextState),
            currentRound: nextState.roundNumber,
          },
        });
      });

      return {
        roundNumber: nextState.roundNumber,
        currentPlayerId: nextState.currentPlayerId,
      };
    }),

  rideTheBusGuess: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        playerId: z.string().min(1),
        guess: z.enum([
          "RED",
          "BLACK",
          "HIGHER",
          "LOWER",
          "INSIDE",
          "OUTSIDE",
          "HEARTS",
          "DIAMONDS",
          "CLUBS",
          "SPADES",
        ]),
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
      if (room.game.code !== "ride-the-bus") {
        throw new Error("This room is not Ride the Bus");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (!room.players.some((player) => player.id === input.playerId)) {
        throw new Error("Player not found in room");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parseRideTheBusState(room.currentAnswer, playerIds);

      if (state.status !== "PLAYING" || state.phase === "ESCAPED") {
        throw new Error("Ride the Bus has already ended");
      }
      if (!state.currentPlayerId || state.currentPlayerId !== input.playerId) {
        throw new Error("It is not your turn");
      }

      const drawnCard = drawRideTheBusCard();
      let isCorrect = false;

      if (state.activeStep === "COLOR") {
        isCorrect = input.guess === drawnCard.color;
      } else if (state.activeStep === "HIGHER_LOWER") {
        const firstCard = state.activeCards[0];
        if (!firstCard) {
          throw new Error("Missing first card");
        }
        isCorrect =
          (input.guess === "HIGHER" && drawnCard.rank > firstCard.rank) ||
          (input.guess === "LOWER" && drawnCard.rank < firstCard.rank);
      } else if (state.activeStep === "INSIDE_OUTSIDE") {
        const firstCard = state.activeCards[0];
        const secondCard = state.activeCards[1];
        if (!firstCard || !secondCard) {
          throw new Error("Missing comparison cards");
        }
        const low = Math.min(firstCard.rank, secondCard.rank);
        const high = Math.max(firstCard.rank, secondCard.rank);
        isCorrect =
          (input.guess === "INSIDE" &&
            drawnCard.rank > low &&
            drawnCard.rank < high) ||
          (input.guess === "OUTSIDE" &&
            (drawnCard.rank < low || drawnCard.rank > high));
      } else if (state.activeStep === "SUIT") {
        isCorrect = input.guess === drawnCard.suit;
      }

      return prisma.$transaction(async (tx) => {
        const nextState: RideTheBusState = {
          ...state,
          activeCards: [...state.activeCards, drawnCard],
          lastResult: isCorrect ? "CORRECT" : "WRONG",
          resetsByPlayerId: {
            ...state.resetsByPlayerId,
          },
        };

        if (!isCorrect) {
          nextState.resetsByPlayerId[input.playerId] =
            (nextState.resetsByPlayerId[input.playerId] ?? 0) + 1;
          nextState.activeCards = [];
          nextState.activeStep = "COLOR";

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

          await tx.room.update({
            where: { id: input.roomId },
            data: {
              currentAnswer: JSON.stringify(nextState),
              currentPlayerId: nextState.currentPlayerId,
            },
          });

          return {
            result: "WRONG" as const,
            phase: nextState.phase,
            currentPlayerId: nextState.currentPlayerId,
            activeStep: nextState.activeStep,
            busRiderPlayerId: nextState.busRiderPlayerId,
            escapedPlayerId: nextState.escapedPlayerId,
            drawnCard,
          };
        }

        const nextStep = getNextRideTheBusStep(state.activeStep);
        if (nextStep) {
          nextState.activeStep = nextStep;

          await tx.room.update({
            where: { id: input.roomId },
            data: {
              currentAnswer: JSON.stringify(nextState),
              currentPlayerId: nextState.currentPlayerId,
            },
          });

          return {
            result: "CORRECT" as const,
            phase: nextState.phase,
            currentPlayerId: nextState.currentPlayerId,
            activeStep: nextState.activeStep,
            busRiderPlayerId: nextState.busRiderPlayerId,
            escapedPlayerId: nextState.escapedPlayerId,
            drawnCard,
          };
        }

        if (state.phase === "BUS") {
          nextState.phase = "ESCAPED";
          nextState.status = "ENDED";
          nextState.escapedPlayerId = input.playerId;
          nextState.lastResult = "ESCAPED";

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

          await tx.room.update({
            where: { id: input.roomId },
            data: {
              gameEnded: true,
              gameEndedAt: new Date(),
              currentAnswer: JSON.stringify(nextState),
              currentPlayerId: input.playerId,
            },
          });

          return {
            result: "ESCAPED" as const,
            phase: nextState.phase,
            currentPlayerId: nextState.currentPlayerId,
            activeStep: nextState.activeStep,
            busRiderPlayerId: nextState.busRiderPlayerId,
            escapedPlayerId: nextState.escapedPlayerId,
            drawnCard,
          };
        }

        nextState.completedPlayerIds = Array.from(
          new Set([...nextState.completedPlayerIds, input.playerId]),
        );
        nextState.activeCards = [];
        nextState.activeStep = "COLOR";

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

        const nextMainPlayer = getNextRideTheBusMainPlayer(nextState, input.playerId);
        if (nextMainPlayer) {
          nextState.currentPlayerId = nextMainPlayer;
          nextState.lastResult = "COMPLETED_MAIN";

          await tx.room.update({
            where: { id: input.roomId },
            data: {
              currentAnswer: JSON.stringify(nextState),
              currentPlayerId: nextMainPlayer,
            },
          });

          return {
            result: "COMPLETED_MAIN" as const,
            phase: nextState.phase,
            currentPlayerId: nextState.currentPlayerId,
            activeStep: nextState.activeStep,
            busRiderPlayerId: nextState.busRiderPlayerId,
            escapedPlayerId: nextState.escapedPlayerId,
            drawnCard,
          };
        }

        const busRiderPlayerId = chooseRideTheBusRider(nextState);
        nextState.phase = "BUS";
        nextState.busRiderPlayerId = busRiderPlayerId;
        nextState.currentPlayerId = busRiderPlayerId;
        nextState.lastResult = "BUS_ASSIGNED";

        await tx.room.update({
          where: { id: input.roomId },
          data: {
            currentAnswer: JSON.stringify(nextState),
            currentPlayerId: busRiderPlayerId,
          },
        });

        return {
          result: "BUS_ASSIGNED" as const,
          phase: nextState.phase,
          currentPlayerId: nextState.currentPlayerId,
          activeStep: nextState.activeStep,
          busRiderPlayerId: nextState.busRiderPlayerId,
          escapedPlayerId: nextState.escapedPlayerId,
          drawnCard,
        };
      });
    }),

  whoAmIWinRound: baseProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        winnerPlayerId: z.string().min(1),
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

      if (!room) throw new Error("Room not found");
      if (room.game.code !== "who-am-i") {
        throw new Error("This room is not Who Am I");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (!room.players.some((player) => player.id === input.winnerPlayerId)) {
        throw new Error("Winner not found in room");
      }

      const playerIds = room.players.map((player) => player.id);
      const state = parseWhoAmIState(room.currentAnswer, playerIds);
      if (!state) {
        throw new Error("Who Am I state is missing");
      }
      if (state.status !== "PLAYING") {
        throw new Error("Finish the current round before choosing another winner");
      }
      if (!state.assignmentsByPlayerId[input.winnerPlayerId]) {
        throw new Error(
          "This player does not have an assigned card in the current round",
        );
      }

      state.status = "ROUND_WON";
      state.winnerPlayerId = input.winnerPlayerId;

      await prisma.$transaction(async (tx) => {
        await tx.player.update({
          where: {
            id: input.winnerPlayerId,
          },
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
              not: input.winnerPlayerId,
            },
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
            currentPlayerId: input.winnerPlayerId,
            currentAnswer: JSON.stringify(state),
          },
        });
      });

      return {
        winnerPlayerId: input.winnerPlayerId,
      };
    }),

  whoAmINextRound: baseProcedure
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
          game: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!room) throw new Error("Room not found");
      if (room.game.code !== "who-am-i") {
        throw new Error("This room is not Who Am I");
      }
      if (room.gameEnded) {
        throw new Error("Game already ended");
      }
      if (room.players.length < 2) {
        throw new Error("At least 2 players are required");
      }

      const playerIds = room.players.map((player) => player.id);
      const questionIds = room.game.questions.map((question) => question.id);
      const state = parseWhoAmIState(room.currentAnswer, playerIds);
      if (!state) {
        throw new Error("Who Am I state is missing");
      }
      if (state.status !== "ROUND_WON" || !state.winnerPlayerId) {
        throw new Error("Choose a winner before moving to the next round");
      }
      if (state.winnerPlayerId !== input.playerId) {
        throw new Error("Only the winning player can start the next round");
      }

      const nextState = buildWhoAmIState(playerIds, questionIds, state);

      await prisma.room.update({
        where: { id: input.roomId },
        data: {
          currentPlayerId: null,
          currentRound: nextState.roundNumber,
          currentAnswer: JSON.stringify(nextState),
        },
      });

      return {
        roundNumber: nextState.roundNumber,
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
