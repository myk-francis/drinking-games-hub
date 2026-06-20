export type CodenamesTeam = "RED" | "BLUE";
export type CodenamesAssignment = "RED" | "BLUE" | "NEUTRAL" | "ASSASSIN";

export type BadPeopleStatus =
  | "DICTATOR_PICK"
  | "PLAYERS_GUESS"
  | "REVEALED"
  | "ENDED";

export type BadPeopleRoomState = {
  status: BadPeopleStatus;
  roundNumber: number;
  playerOrder: string[];
  dictatorPlayerId: string | null;
  dictatorVotePlayerId: string | null;
  guessesByPlayerId: Record<string, string>;
  doubleDownUsedPlayerIds: string[];
  doubleDownActivePlayerIds: string[];
  revealedPlayerId: string | null;
  winnerPlayerIds: string[];
  scoreTarget: number;
};

export type BadChoicesCardType =
  | "QUESTION"
  | "SKIP"
  | "DRAW_ONE"
  | "DRAW_TWO"
  | "ALL_PLAY";

export type BadChoicesPromptAnswer = "YES" | "NO";
export type BadChoicesStatus =
  | "PLAYING"
  | "AWAITING_TARGET_ANSWER"
  | "AWAITING_ALL_PLAY_ANSWERS"
  | "ENDED";

export type BadChoicesRoomState = {
  status: BadChoicesStatus;
  roundNumber: number;
  playerOrder: string[];
  handsByPlayerId: Record<string, number[]>;
  drawPile: number[];
  discardPile: number[];
  activeCardId: number | null;
  activeTargetPlayerId: string | null;
  allPlayAnswersByPlayerId: Record<string, BadChoicesPromptAnswer>;
  pendingSkipCountsByPlayerId: Record<string, number>;
  winnerPlayerId: string | null;
  lastResult: string | null;
};

export type SpinBottleMode =
  | "CLASSIC"
  | "PARTY"
  | "FLIRTY"
  | "SAFE"
  | "CHAOTIC";

export type SpinBottleStatus = "READY" | "AWAITING_ACTION";

export type SpinBottleRoomState = {
  status: SpinBottleStatus;
  mode: SpinBottleMode;
  roundNumber: number;
  playerOrder: string[];
  currentSpinnerPlayerId: string | null;
  targetPlayerId: string | null;
  direction: 1 | -1;
  spinSequence: number;
  spinStartedAt: string | null;
  spinDurationMs: number;
  finalAngle: number;
  lastTargetPlayerId: string | null;
  lastActionLabel: string | null;
};

export type CodenamesRoomState = {
  status: "LOBBY" | "PLAYING" | "ENDED";
  board: number[];
  assignments: Record<number, CodenamesAssignment>;
  startingTeam: CodenamesTeam;
  turnTeam: CodenamesTeam;
  guessesRemaining: number | null;
  winner: CodenamesTeam | null;
};

export type MemoryChainRoomState = {
  status: "PLAYING" | "ENDED";
  board: number[];
  sequence: number[];
  revealed: number[];
  progress: number;
  winnerPlayerId: string | null;
  pendingMissQuestionId: number | null;
  pendingMissNextPlayerId: string | null;
};

export type GuessTheNumberFeedback = "PENDING" | "UP" | "DOWN" | "CORRECT";

export type GuessTheNumberRoundGuess = {
  guess: number;
  feedback: GuessTheNumberFeedback;
};

export type GuessTheNumberRoundSummaryEntry = {
  guesserPlayerId: string;
  guess: number;
  feedback: Exclude<GuessTheNumberFeedback, "PENDING">;
};

export type GuessTheNumberRoundSummary = {
  targetPlayerId: string;
  targetNumber: number;
  entries: GuessTheNumberRoundSummaryEntry[];
};

export type GuessTheNumberRoomState = {
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

export type ConnectLettersPhase =
  | "READY"
  | "TIMER_RUNNING"
  | "AWAITING_JUDGMENT"
  | "ROUND_COMPLETE";

export type ConnectLettersRoomState = {
  status: "PLAYING" | "ENDED";
  playerOrder: string[];
  currentPair: [string, string] | null;
  usedPairKeys: string[];
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

export type GhostTearsPhase = "PICKING" | "AWAITING_JUDGMENT";

export type GhostTearsRoomState = {
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

export type WhoAmIRoomState = {
  status: "PLAYING" | "ROUND_WON";
  roundNumber: number;
  assignmentsByPlayerId: Record<string, number>;
  usedQuestionIds: number[];
  winnerPlayerId: string | null;
};

export type NameTheSongVerdict = "CORRECT" | "WRONG";

export type NameTheSongRoomState = {
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

export type GuessTheMovieVerdict = "CORRECT" | "WRONG";

export type GuessTheMovieRoomState = {
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

export type RideTheBusSuit = "HEARTS" | "DIAMONDS" | "CLUBS" | "SPADES";
export type RideTheBusColor = "RED" | "BLACK";
export type RideTheBusStep = "COLOR" | "HIGHER_LOWER" | "INSIDE_OUTSIDE" | "SUIT";
export type RideTheBusPhase = "MAIN" | "BUS" | "ESCAPED";

export type RideTheBusCard = {
  rank: number;
  suit: RideTheBusSuit;
  color: RideTheBusColor;
};

export type RideTheBusLastResult =
  | "CORRECT"
  | "WRONG"
  | "COMPLETED_MAIN"
  | "BUS_ASSIGNED"
  | "ESCAPED"
  | null;

export type RideTheBusRoomState = {
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

export type BlackjackSuit = "HEARTS" | "DIAMONDS" | "CLUBS" | "SPADES";
export type BlackjackCard = {
  rank: number;
  suit: BlackjackSuit;
};
export type BlackjackRoundPhase =
  | "PLAYER_TURNS"
  | "DEALER_TURN"
  | "ROUND_RESULT";
export type BlackjackPlayerResult =
  | "BLACKJACK"
  | "WIN"
  | "LOSE"
  | "PUSH"
  | "BUST";

export type BlackjackRoomState = {
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

export type PokerSuit = "HEARTS" | "DIAMONDS" | "CLUBS" | "SPADES";
export type PokerCard = {
  rank: number;
  suit: PokerSuit;
};
export type PokerPhase =
  | "PRE_FLOP"
  | "FLOP"
  | "TURN"
  | "RIVER"
  | "SHOWDOWN";
export type PokerPlayerAction = "NONE" | "CHECK" | "CALL" | "BET" | "FOLD";

export type PokerRoomState = {
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

export type JokerLoopCard = {
  id: string;
  word: string;
  icon: string;
  pairKey: string | null;
  isJoker: boolean;
};

export type JokerLoopPhase = "REORDERING" | "PICKING" | "ROUND_RESOLUTION" | "ENDED";

export type JokerLoopRoomState = {
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

export type UnoColor = "RED" | "YELLOW" | "GREEN" | "BLUE" | "WILD";
export type UnoCardKind =
  | "NUMBER"
  | "SKIP"
  | "REVERSE"
  | "DRAW_TWO"
  | "WILD"
  | "WILD_DRAW_FOUR";

export type UnoCard = {
  id: string;
  color: UnoColor;
  kind: UnoCardKind;
  value: number | null;
  label: string;
};

export type UnoRoomState = {
  status: "LOBBY" | "PLAYING" | "ENDED";
  roundNumber: number;
  playerOrder: string[];
  currentPlayerId: string | null;
  direction: 1 | -1;
  drawPile: UnoCard[];
  discardPile: UnoCard[];
  handsByPlayerId: Record<string, UnoCard[]>;
  activeColor: Exclude<UnoColor, "WILD"> | null;
  pendingDrawAmount: number;
  winnerPlayerId: string | null;
  drawnCardThisTurnId: string | null;
  lastAction: string | null;
};

export const NAME_THE_SONG_TIMER_SECONDS = 5;
export const GUESS_THE_MOVIE_TIMER_SECONDS = 5;

export function parseBadChoicesState(
  raw: string | null | undefined,
): BadChoicesRoomState {
  const fallback: BadChoicesRoomState = {
    status: "PLAYING",
    roundNumber: 1,
    playerOrder: [],
    handsByPlayerId: {},
    drawPile: [],
    discardPile: [],
    activeCardId: null,
    activeTargetPlayerId: null,
    allPlayAnswersByPlayerId: {},
    pendingSkipCountsByPlayerId: {},
    winnerPlayerId: null,
    lastResult: null,
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<BadChoicesRoomState>;
    const playerOrder = Array.isArray(parsed.playerOrder)
      ? parsed.playerOrder.filter(
          (playerId): playerId is string => typeof playerId === "string",
        )
      : [];

    const parseNumberList = (value: unknown) =>
      Array.isArray(value)
        ? value.filter(
            (cardId): cardId is number =>
              typeof cardId === "number" && Number.isFinite(cardId),
          )
        : [];

    const handsByPlayerId =
      parsed.handsByPlayerId && typeof parsed.handsByPlayerId === "object"
        ? Object.fromEntries(
            Object.entries(parsed.handsByPlayerId).map(([playerId, cards]) => [
              playerId,
              parseNumberList(cards),
            ]),
          )
        : {};

    const allPlayAnswersByPlayerId =
      parsed.allPlayAnswersByPlayerId &&
      typeof parsed.allPlayAnswersByPlayerId === "object"
        ? Object.fromEntries(
            Object.entries(parsed.allPlayAnswersByPlayerId).filter(
              ([playerId, answer]) =>
                typeof playerId === "string" &&
                (answer === "YES" || answer === "NO"),
            ),
          )
        : {};

    const pendingSkipCountsByPlayerId =
      parsed.pendingSkipCountsByPlayerId &&
      typeof parsed.pendingSkipCountsByPlayerId === "object"
        ? Object.fromEntries(
            Object.entries(parsed.pendingSkipCountsByPlayerId).map(
              ([playerId, count]) => [
                playerId,
                typeof count === "number" && Number.isFinite(count) && count > 0
                  ? Math.floor(count)
                  : 0,
              ],
            ),
          )
        : {};

    return {
      status:
        parsed.status === "AWAITING_TARGET_ANSWER" ||
        parsed.status === "AWAITING_ALL_PLAY_ANSWERS" ||
        parsed.status === "ENDED"
          ? parsed.status
          : "PLAYING",
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber > 0
          ? parsed.roundNumber
          : 1,
      playerOrder,
      handsByPlayerId,
      drawPile: parseNumberList(parsed.drawPile),
      discardPile: parseNumberList(parsed.discardPile),
      activeCardId:
        typeof parsed.activeCardId === "number" &&
        Number.isFinite(parsed.activeCardId)
          ? parsed.activeCardId
          : null,
      activeTargetPlayerId:
        typeof parsed.activeTargetPlayerId === "string"
          ? parsed.activeTargetPlayerId
          : null,
      allPlayAnswersByPlayerId,
      pendingSkipCountsByPlayerId,
      winnerPlayerId:
        typeof parsed.winnerPlayerId === "string" ? parsed.winnerPlayerId : null,
      lastResult:
        typeof parsed.lastResult === "string" ? parsed.lastResult : null,
    };
  } catch {
    return fallback;
  }
}

export function parseBadPeopleState(
  raw: string | null | undefined,
): BadPeopleRoomState {
  const fallback: BadPeopleRoomState = {
    status: "DICTATOR_PICK",
    roundNumber: 1,
    playerOrder: [],
    dictatorPlayerId: null,
    dictatorVotePlayerId: null,
    guessesByPlayerId: {},
    doubleDownUsedPlayerIds: [],
    doubleDownActivePlayerIds: [],
    revealedPlayerId: null,
    winnerPlayerIds: [],
    scoreTarget: 7,
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<BadPeopleRoomState>;
    const parsePlayerIdList = (value: unknown) =>
      Array.isArray(value)
        ? value.filter(
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [];

    const guessesByPlayerId =
      parsed.guessesByPlayerId && typeof parsed.guessesByPlayerId === "object"
        ? Object.fromEntries(
            Object.entries(parsed.guessesByPlayerId).filter(
              ([playerId, guessedPlayerId]) =>
                typeof playerId === "string" && typeof guessedPlayerId === "string",
            ),
          )
        : {};

    return {
      status:
        parsed.status === "PLAYERS_GUESS" ||
        parsed.status === "REVEALED" ||
        parsed.status === "ENDED"
          ? parsed.status
          : "DICTATOR_PICK",
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber > 0
          ? parsed.roundNumber
          : 1,
      playerOrder: parsePlayerIdList(parsed.playerOrder),
      dictatorPlayerId:
        typeof parsed.dictatorPlayerId === "string"
          ? parsed.dictatorPlayerId
          : null,
      dictatorVotePlayerId:
        typeof parsed.dictatorVotePlayerId === "string"
          ? parsed.dictatorVotePlayerId
          : null,
      guessesByPlayerId,
      doubleDownUsedPlayerIds: parsePlayerIdList(parsed.doubleDownUsedPlayerIds),
      doubleDownActivePlayerIds: parsePlayerIdList(
        parsed.doubleDownActivePlayerIds,
      ),
      revealedPlayerId:
        typeof parsed.revealedPlayerId === "string"
          ? parsed.revealedPlayerId
          : null,
      winnerPlayerIds: parsePlayerIdList(parsed.winnerPlayerIds),
      scoreTarget:
        typeof parsed.scoreTarget === "number" &&
        Number.isFinite(parsed.scoreTarget) &&
        parsed.scoreTarget > 0
          ? parsed.scoreTarget
          : 7,
    };
  } catch {
    return fallback;
  }
}

export function parseSpinBottleState(
  raw: string | null | undefined,
): SpinBottleRoomState {
  const fallback: SpinBottleRoomState = {
    status: "READY",
    mode: "CLASSIC",
    roundNumber: 1,
    playerOrder: [],
    currentSpinnerPlayerId: null,
    targetPlayerId: null,
    direction: 1,
    spinSequence: 0,
    spinStartedAt: null,
    spinDurationMs: 4200,
    finalAngle: 0,
    lastTargetPlayerId: null,
    lastActionLabel: null,
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<SpinBottleRoomState>;
    const parsePlayerId = (value: unknown) =>
      typeof value === "string" ? value : null;

    return {
      status: parsed.status === "AWAITING_ACTION" ? "AWAITING_ACTION" : "READY",
      mode:
        parsed.mode === "PARTY" ||
        parsed.mode === "FLIRTY" ||
        parsed.mode === "SAFE" ||
        parsed.mode === "CHAOTIC"
          ? parsed.mode
          : "CLASSIC",
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber > 0
          ? parsed.roundNumber
          : 1,
      playerOrder: Array.isArray(parsed.playerOrder)
        ? parsed.playerOrder.filter(
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [],
      currentSpinnerPlayerId: parsePlayerId(parsed.currentSpinnerPlayerId),
      targetPlayerId: parsePlayerId(parsed.targetPlayerId),
      direction: parsed.direction === -1 ? -1 : 1,
      spinSequence:
        typeof parsed.spinSequence === "number" &&
        Number.isFinite(parsed.spinSequence) &&
        parsed.spinSequence >= 0
          ? parsed.spinSequence
          : 0,
      spinStartedAt:
        typeof parsed.spinStartedAt === "string" ? parsed.spinStartedAt : null,
      spinDurationMs:
        typeof parsed.spinDurationMs === "number" &&
        Number.isFinite(parsed.spinDurationMs) &&
        parsed.spinDurationMs >= 0
          ? parsed.spinDurationMs
          : 4200,
      finalAngle:
        typeof parsed.finalAngle === "number" && Number.isFinite(parsed.finalAngle)
          ? parsed.finalAngle
          : 0,
      lastTargetPlayerId: parsePlayerId(parsed.lastTargetPlayerId),
      lastActionLabel:
        typeof parsed.lastActionLabel === "string" ? parsed.lastActionLabel : null,
    };
  } catch {
    return fallback;
  }
}

export function parseCodenamesState(
  raw: string | null | undefined,
): CodenamesRoomState {
  const fallback: CodenamesRoomState = {
    status: "LOBBY",
    board: [],
    assignments: {},
    startingTeam: "RED",
    turnTeam: "RED",
    guessesRemaining: null,
    winner: null,
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<CodenamesRoomState>;
    return {
      status:
        parsed.status === "PLAYING" || parsed.status === "ENDED"
          ? parsed.status
          : "LOBBY",
      board: Array.isArray(parsed.board)
        ? parsed.board.filter((id): id is number => typeof id === "number")
        : [],
      assignments: (parsed.assignments || {}) as Record<
        number,
        CodenamesAssignment
      >,
      startingTeam:
        parsed.startingTeam === "BLUE" ? parsed.startingTeam : "RED",
      turnTeam: parsed.turnTeam === "BLUE" ? parsed.turnTeam : "RED",
      guessesRemaining:
        typeof parsed.guessesRemaining === "number"
          ? parsed.guessesRemaining
          : null,
      winner:
        parsed.winner === "RED" || parsed.winner === "BLUE"
          ? parsed.winner
          : null,
    };
  } catch {
    return fallback;
  }
}

export function parseMemoryChainState(
  raw: string | null | undefined,
): MemoryChainRoomState {
  const fallback: MemoryChainRoomState = {
    status: "PLAYING",
    board: [],
    sequence: [],
    revealed: [],
    progress: 0,
    winnerPlayerId: null,
    pendingMissQuestionId: null,
    pendingMissNextPlayerId: null,
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<MemoryChainRoomState>;
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
        typeof parsed.pendingMissQuestionId === "number"
          ? parsed.pendingMissQuestionId
          : null,
      pendingMissNextPlayerId:
        typeof parsed.pendingMissNextPlayerId === "string"
          ? parsed.pendingMissNextPlayerId
          : null,
    };
  } catch {
    return fallback;
  }
}

export function parseGuessTheNumberState(
  raw: string | null | undefined,
): GuessTheNumberRoomState {
  const fallback: GuessTheNumberRoomState = {
    status: "SETUP",
    minValue: 0,
    maxValue: 100,
    playerNumbers: {},
    playerOrder: [],
    currentRoundGuesses: {},
    roundHistory: [],
    completedTargetPlayerIds: [],
    playerDiscoveries: {},
    winnerPlayerId: null,
    winnerTargetPlayerId: null,
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<GuessTheNumberRoomState>;
    const playerNumbers =
      parsed.playerNumbers && typeof parsed.playerNumbers === "object"
        ? Object.fromEntries(
            Object.entries(parsed.playerNumbers).map(([playerId, value]) => [
              playerId,
              typeof value === "number" && Number.isFinite(value) ? value : null,
            ]),
          )
        : {};

    const currentRoundGuesses =
      parsed.currentRoundGuesses && typeof parsed.currentRoundGuesses === "object"
        ? Object.fromEntries(
            Object.entries(parsed.currentRoundGuesses)
              .map(([playerId, value]) => {
                if (!value || typeof value !== "object") return null;
                const guess = (value as GuessTheNumberRoundGuess).guess;
                const feedback = (value as GuessTheNumberRoundGuess).feedback;
                if (
                  typeof guess !== "number" ||
                  !Number.isFinite(guess) ||
                  (feedback !== "PENDING" &&
                    feedback !== "UP" &&
                    feedback !== "DOWN" &&
                    feedback !== "CORRECT")
                ) {
                  return null;
                }

                return [
                  playerId,
                  {
                    guess,
                    feedback,
                  } satisfies GuessTheNumberRoundGuess,
                ];
              })
              .filter(
                (
                  entry,
                ): entry is [string, GuessTheNumberRoundGuess] => entry !== null,
              ),
          )
        : {};

    const roundHistory = Array.isArray(parsed.roundHistory)
      ? parsed.roundHistory
          .map((round) => {
            if (!round || typeof round !== "object") return null;
            if (
              typeof round.targetPlayerId !== "string" ||
              typeof round.targetNumber !== "number"
            ) {
              return null;
            }

            const entries = Array.isArray(round.entries)
              ? round.entries.filter(
                  (
                    entry,
                  ): entry is GuessTheNumberRoundSummaryEntry =>
                    Boolean(entry) &&
                    typeof entry === "object" &&
                    typeof entry.guesserPlayerId === "string" &&
                    typeof entry.guess === "number" &&
                    (entry.feedback === "UP" ||
                      entry.feedback === "DOWN" ||
                      entry.feedback === "CORRECT"),
                )
              : [];

            return {
              targetPlayerId: round.targetPlayerId,
              targetNumber: round.targetNumber,
              entries,
            } satisfies GuessTheNumberRoundSummary;
          })
          .filter(
            (round): round is GuessTheNumberRoundSummary => round !== null,
          )
      : [];

    const playerDiscoveries =
      parsed.playerDiscoveries && typeof parsed.playerDiscoveries === "object"
        ? Object.fromEntries(
            Object.entries(parsed.playerDiscoveries).map(([playerId, value]) => [
              playerId,
              Array.isArray(value)
                ? value.filter((targetId): targetId is string => typeof targetId === "string")
                : [],
            ]),
          )
        : {};

    return {
      status:
        parsed.status === "PLAYING" || parsed.status === "ENDED"
          ? parsed.status
          : "SETUP",
      minValue:
        typeof parsed.minValue === "number" && Number.isFinite(parsed.minValue)
          ? parsed.minValue
          : 0,
      maxValue:
        typeof parsed.maxValue === "number" && Number.isFinite(parsed.maxValue)
          ? parsed.maxValue
          : 100,
      playerNumbers,
      playerOrder: Array.isArray(parsed.playerOrder)
        ? parsed.playerOrder.filter(
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [],
      currentRoundGuesses,
      roundHistory,
      completedTargetPlayerIds: Array.isArray(parsed.completedTargetPlayerIds)
        ? parsed.completedTargetPlayerIds.filter(
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [],
      playerDiscoveries,
      winnerPlayerId:
        typeof parsed.winnerPlayerId === "string" ? parsed.winnerPlayerId : null,
      winnerTargetPlayerId:
        typeof parsed.winnerTargetPlayerId === "string"
          ? parsed.winnerTargetPlayerId
          : null,
    };
  } catch {
    return fallback;
  }
}

export function parseConnectLettersState(
  raw: string | null | undefined,
): ConnectLettersRoomState {
  const fallback: ConnectLettersRoomState = {
    status: "PLAYING",
    playerOrder: [],
    currentPair: null,
    usedPairKeys: [],
    roundNumber: 1,
    phase: "READY",
    startLetter: "A",
    endLetter: "F",
    timerSeconds: 10,
    activeChallengerId: null,
    activeGuesserId: null,
    attemptStartedAt: null,
    roundWinnerPlayerId: null,
    roundLoserPlayerId: null,
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<ConnectLettersRoomState>;
    const parsedPair: ConnectLettersRoomState["currentPair"] =
      Array.isArray(parsed.currentPair) &&
      parsed.currentPair.length === 2 &&
      typeof parsed.currentPair[0] === "string" &&
      typeof parsed.currentPair[1] === "string"
        ? [parsed.currentPair[0], parsed.currentPair[1]]
        : null;

    return {
      status: parsed.status === "ENDED" ? "ENDED" : "PLAYING",
      playerOrder: Array.isArray(parsed.playerOrder)
        ? parsed.playerOrder.filter(
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [],
      currentPair: parsedPair,
      usedPairKeys: Array.isArray(parsed.usedPairKeys)
        ? parsed.usedPairKeys.filter(
            (item): item is string => typeof item === "string",
          )
        : [],
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber > 0
          ? parsed.roundNumber
          : 1,
      phase:
        parsed.phase === "TIMER_RUNNING" ||
        parsed.phase === "AWAITING_JUDGMENT" ||
        parsed.phase === "ROUND_COMPLETE"
          ? parsed.phase
          : "READY",
      startLetter:
        typeof parsed.startLetter === "string" && /^[A-Z]$/.test(parsed.startLetter)
          ? parsed.startLetter
          : "A",
      endLetter:
        typeof parsed.endLetter === "string" && /^[A-Z]$/.test(parsed.endLetter)
          ? parsed.endLetter
          : "F",
      timerSeconds:
        typeof parsed.timerSeconds === "number" &&
        Number.isFinite(parsed.timerSeconds) &&
        parsed.timerSeconds > 0
          ? parsed.timerSeconds
          : 10,
      activeChallengerId:
        typeof parsed.activeChallengerId === "string"
          ? parsed.activeChallengerId
          : null,
      activeGuesserId:
        typeof parsed.activeGuesserId === "string" ? parsed.activeGuesserId : null,
      attemptStartedAt:
        typeof parsed.attemptStartedAt === "string" ? parsed.attemptStartedAt : null,
      roundWinnerPlayerId:
        typeof parsed.roundWinnerPlayerId === "string"
          ? parsed.roundWinnerPlayerId
          : null,
      roundLoserPlayerId:
        typeof parsed.roundLoserPlayerId === "string"
          ? parsed.roundLoserPlayerId
          : null,
    };
  } catch {
    return fallback;
  }
}

export function parseGhostTearsState(
  raw: string | null | undefined,
): GhostTearsRoomState {
  const fallback: GhostTearsRoomState = {
    status: "PLAYING",
    playerOrder: [],
    currentPlayerId: null,
    previousPlayerId: null,
    phase: "PICKING",
    letterSequence: [],
    challengerPlayerId: null,
    challengedPlayerId: null,
    lastLoserPlayerId: null,
    roundNumber: 1,
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<GhostTearsRoomState>;
    const parsedAlphabet = Array.isArray(parsed.alphabet)
      ? parsed.alphabet.filter(
          (letter): letter is string =>
            typeof letter === "string" && /^[A-Z]$/.test(letter),
        )
      : fallback.alphabet;

    return {
      status: parsed.status === "ENDED" ? "ENDED" : "PLAYING",
      playerOrder: Array.isArray(parsed.playerOrder)
        ? parsed.playerOrder.filter(
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [],
      currentPlayerId:
        typeof parsed.currentPlayerId === "string" ? parsed.currentPlayerId : null,
      previousPlayerId:
        typeof parsed.previousPlayerId === "string"
          ? parsed.previousPlayerId
          : null,
      phase: parsed.phase === "AWAITING_JUDGMENT" ? "AWAITING_JUDGMENT" : "PICKING",
      letterSequence: Array.isArray(parsed.letterSequence)
        ? parsed.letterSequence.filter(
            (letter): letter is string =>
              typeof letter === "string" && /^[A-Z]$/.test(letter),
          )
        : [],
      challengerPlayerId:
        typeof parsed.challengerPlayerId === "string"
          ? parsed.challengerPlayerId
          : null,
      challengedPlayerId:
        typeof parsed.challengedPlayerId === "string"
          ? parsed.challengedPlayerId
          : null,
      lastLoserPlayerId:
        typeof parsed.lastLoserPlayerId === "string"
          ? parsed.lastLoserPlayerId
          : null,
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber > 0
          ? parsed.roundNumber
          : 1,
      alphabet: parsedAlphabet.length > 0 ? parsedAlphabet : fallback.alphabet,
    };
  } catch {
    return fallback;
  }
}

export function parseWhoAmIState(raw: string | null | undefined): WhoAmIRoomState {
  const fallback: WhoAmIRoomState = {
    status: "PLAYING",
    roundNumber: 1,
    assignmentsByPlayerId: {},
    usedQuestionIds: [],
    winnerPlayerId: null,
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<WhoAmIRoomState>;
    const assignmentsByPlayerId =
      parsed.assignmentsByPlayerId &&
      typeof parsed.assignmentsByPlayerId === "object"
        ? Object.fromEntries(
            Object.entries(parsed.assignmentsByPlayerId).filter(
              ([playerId, questionId]) =>
                typeof playerId === "string" && typeof questionId === "number",
            ),
          )
        : {};

    return {
      status: parsed.status === "ROUND_WON" ? "ROUND_WON" : "PLAYING",
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber > 0
          ? parsed.roundNumber
          : 1,
      assignmentsByPlayerId,
      usedQuestionIds: Array.isArray(parsed.usedQuestionIds)
        ? parsed.usedQuestionIds.filter(
            (questionId): questionId is number => typeof questionId === "number",
          )
        : [],
      winnerPlayerId:
        typeof parsed.winnerPlayerId === "string"
          ? parsed.winnerPlayerId
          : null,
    };
  } catch {
    return fallback;
  }
}

export function parseNameTheSongState(
  raw: string | null | undefined,
): NameTheSongRoomState {
  const fallback: NameTheSongRoomState = {
    status: "READY",
    roundNumber: 1,
    currentQuestionId: null,
    usedQuestionIds: [],
    buzzedPlayerId: null,
    attemptStartedAt: null,
    verdict: null,
    pointPlayerIds: [],
    drinkPlayerIds: [],
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<NameTheSongRoomState>;
    return {
      status:
        parsed.status === "BUZZED" || parsed.status === "ROUND_RESULT"
          ? parsed.status
          : "READY",
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber > 0
          ? parsed.roundNumber
          : 1,
      currentQuestionId:
        typeof parsed.currentQuestionId === "number"
          ? parsed.currentQuestionId
          : null,
      usedQuestionIds: Array.isArray(parsed.usedQuestionIds)
        ? parsed.usedQuestionIds.filter(
            (questionId): questionId is number => typeof questionId === "number",
          )
        : [],
      buzzedPlayerId:
        typeof parsed.buzzedPlayerId === "string" ? parsed.buzzedPlayerId : null,
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
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [],
      drinkPlayerIds: Array.isArray(parsed.drinkPlayerIds)
        ? parsed.drinkPlayerIds.filter(
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [],
    };
  } catch {
    return fallback;
  }
}

export function parseGuessTheMovieState(
  raw: string | null | undefined,
): GuessTheMovieRoomState {
  const fallback: GuessTheMovieRoomState = {
    status: "READY",
    roundNumber: 1,
    currentQuestionId: null,
    usedQuestionIds: [],
    buzzedPlayerId: null,
    attemptStartedAt: null,
    verdict: null,
    pointPlayerIds: [],
    drinkPlayerIds: [],
    selectedCategory: 0,
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<GuessTheMovieRoomState>;
    return {
      status:
        parsed.status === "BUZZED" || parsed.status === "ROUND_RESULT"
          ? parsed.status
          : "READY",
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber > 0
          ? parsed.roundNumber
          : 1,
      currentQuestionId:
        typeof parsed.currentQuestionId === "number"
          ? parsed.currentQuestionId
          : null,
      usedQuestionIds: Array.isArray(parsed.usedQuestionIds)
        ? parsed.usedQuestionIds.filter(
            (questionId): questionId is number => typeof questionId === "number",
          )
        : [],
      buzzedPlayerId:
        typeof parsed.buzzedPlayerId === "string" ? parsed.buzzedPlayerId : null,
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
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [],
      drinkPlayerIds: Array.isArray(parsed.drinkPlayerIds)
        ? parsed.drinkPlayerIds.filter(
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [],
      selectedCategory:
        typeof parsed.selectedCategory === "number" &&
        Number.isFinite(parsed.selectedCategory)
          ? parsed.selectedCategory
          : 0,
    };
  } catch {
    return fallback;
  }
}

export function parseRideTheBusState(
  raw: string | null | undefined,
): RideTheBusRoomState {
  const fallback: RideTheBusRoomState = {
    status: "PLAYING",
    phase: "MAIN",
    playerOrder: [],
    currentPlayerId: null,
    activeStep: "COLOR",
    activeCards: [],
    completedPlayerIds: [],
    resetsByPlayerId: {},
    busRiderPlayerId: null,
    escapedPlayerId: null,
    lastResult: null,
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<RideTheBusRoomState>;
    const activeCards = Array.isArray(parsed.activeCards)
      ? parsed.activeCards
          .filter(
            (card): card is RideTheBusCard =>
              Boolean(card) &&
              typeof card === "object" &&
              typeof card.rank === "number" &&
              (card.suit === "HEARTS" ||
                card.suit === "DIAMONDS" ||
                card.suit === "CLUBS" ||
                card.suit === "SPADES") &&
              (card.color === "RED" || card.color === "BLACK"),
          )
          .map((card) => ({
            rank: card.rank,
            suit: card.suit,
            color: card.color,
          }))
      : [];

    return {
      status: parsed.status === "ENDED" ? "ENDED" : "PLAYING",
      phase:
        parsed.phase === "BUS" || parsed.phase === "ESCAPED"
          ? parsed.phase
          : "MAIN",
      playerOrder: Array.isArray(parsed.playerOrder)
        ? parsed.playerOrder.filter(
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [],
      currentPlayerId:
        typeof parsed.currentPlayerId === "string" ? parsed.currentPlayerId : null,
      activeStep:
        parsed.activeStep === "HIGHER_LOWER" ||
        parsed.activeStep === "INSIDE_OUTSIDE" ||
        parsed.activeStep === "SUIT"
          ? parsed.activeStep
          : "COLOR",
      activeCards,
      completedPlayerIds: Array.isArray(parsed.completedPlayerIds)
        ? parsed.completedPlayerIds.filter(
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [],
      resetsByPlayerId:
        parsed.resetsByPlayerId && typeof parsed.resetsByPlayerId === "object"
          ? Object.fromEntries(
              Object.entries(parsed.resetsByPlayerId).map(([playerId, value]) => [
                playerId,
                typeof value === "number" && Number.isFinite(value) ? value : 0,
              ]),
            )
          : {},
      busRiderPlayerId:
        typeof parsed.busRiderPlayerId === "string"
          ? parsed.busRiderPlayerId
          : null,
      escapedPlayerId:
        typeof parsed.escapedPlayerId === "string"
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

export function parseBlackjackState(
  raw: string | null | undefined,
): BlackjackRoomState {
  const fallback: BlackjackRoomState = {
    status: "PLAYING",
    roundNumber: 1,
    phase: "PLAYER_TURNS",
    playerOrder: [],
    currentPlayerId: null,
    dealerHand: [],
    deck: [],
    handsByPlayerId: {},
    stoodPlayerIds: [],
    bustedPlayerIds: [],
    finishedPlayerIds: [],
    resultByPlayerId: {},
    hiddenDealerCard: true,
  };

  const parseCard = (value: unknown): BlackjackCard | null => {
    if (!value || typeof value !== "object") return null;
    const card = value as Partial<BlackjackCard>;
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
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<BlackjackRoomState>;
    const playerOrder = Array.isArray(parsed.playerOrder)
      ? parsed.playerOrder.filter(
          (playerId): playerId is string => typeof playerId === "string",
        )
      : [];

    const handsByPlayerId =
      parsed.handsByPlayerId && typeof parsed.handsByPlayerId === "object"
        ? Object.fromEntries(
            Object.entries(parsed.handsByPlayerId).map(([playerId, hand]) => [
              playerId,
              Array.isArray(hand)
                ? hand
                    .map((card) => parseCard(card))
                    .filter((card): card is BlackjackCard => card !== null)
                : [],
            ]),
          )
        : {};

    const parsePlayerIdList = (value: unknown) =>
      Array.isArray(value)
        ? value.filter(
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [];

    const resultByPlayerId =
      parsed.resultByPlayerId && typeof parsed.resultByPlayerId === "object"
        ? Object.fromEntries(
            Object.entries(parsed.resultByPlayerId).map(([playerId, result]) => [
              playerId,
              result === "BLACKJACK" ||
              result === "WIN" ||
              result === "LOSE" ||
              result === "PUSH" ||
              result === "BUST"
                ? result
                : null,
            ]),
          )
        : {};

    return {
      status: parsed.status === "ENDED" ? "ENDED" : "PLAYING",
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber > 0
          ? parsed.roundNumber
          : 1,
      phase:
        parsed.phase === "DEALER_TURN" || parsed.phase === "ROUND_RESULT"
          ? parsed.phase
          : "PLAYER_TURNS",
      playerOrder,
      currentPlayerId:
        typeof parsed.currentPlayerId === "string" ? parsed.currentPlayerId : null,
      dealerHand: Array.isArray(parsed.dealerHand)
        ? parsed.dealerHand
            .map((card) => parseCard(card))
            .filter((card): card is BlackjackCard => card !== null)
        : [],
      deck: Array.isArray(parsed.deck)
        ? parsed.deck
            .map((card) => parseCard(card))
            .filter((card): card is BlackjackCard => card !== null)
        : [],
      handsByPlayerId,
      stoodPlayerIds: parsePlayerIdList(parsed.stoodPlayerIds),
      bustedPlayerIds: parsePlayerIdList(parsed.bustedPlayerIds),
      finishedPlayerIds: parsePlayerIdList(parsed.finishedPlayerIds),
      resultByPlayerId,
      hiddenDealerCard: parsed.hiddenDealerCard !== false,
    };
  } catch {
    return fallback;
  }
}

export function parsePokerState(
  raw: string | null | undefined,
): PokerRoomState {
  const fallback: PokerRoomState = {
    status: "PLAYING",
    roundNumber: 1,
    phase: "PRE_FLOP",
    startingStack: 10000,
    betStep: 1000,
    playerOrder: [],
    currentPlayerId: null,
    dealerPlayerId: null,
    smallBlindPlayerId: null,
    bigBlindPlayerId: null,
    smallBlindAmount: 1000,
    bigBlindAmount: 2000,
    currentBet: 0,
    pot: 0,
    deck: [],
    communityCards: [],
    holeCardsByPlayerId: {},
    stackByPlayerId: {},
    playerBets: {},
    totalContributionsByPlayerId: {},
    actedPlayerIds: [],
    foldedPlayerIds: [],
    allInPlayerIds: [],
    lastActionByPlayerId: {},
    lastActionPlayerId: null,
    lastActionAmount: null,
    winnerPlayerIds: [],
    handLabelByPlayerId: {},
  };

  const parseCard = (value: unknown): PokerCard | null => {
    if (!value || typeof value !== "object") return null;
    const card = value as Partial<PokerCard>;
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
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<PokerRoomState>;
    const playerOrder = Array.isArray(parsed.playerOrder)
      ? parsed.playerOrder.filter(
          (playerId): playerId is string => typeof playerId === "string",
        )
      : [];

    const parsePlayerIdList = (value: unknown) =>
      Array.isArray(value)
        ? value.filter(
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [];

    const holeCardsByPlayerId =
      parsed.holeCardsByPlayerId && typeof parsed.holeCardsByPlayerId === "object"
        ? Object.fromEntries(
            Object.entries(parsed.holeCardsByPlayerId).map(([playerId, hand]) => [
              playerId,
              Array.isArray(hand)
                ? hand
                    .map((card) => parseCard(card))
                    .filter((card): card is PokerCard => card !== null)
                : [],
            ]),
          )
        : {};

    const numericRecord = (value: unknown) =>
      value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, item]) => [
              key,
              typeof item === "number" && Number.isFinite(item) ? item : 0,
            ]),
          )
        : {};

    const actionRecord =
      parsed.lastActionByPlayerId && typeof parsed.lastActionByPlayerId === "object"
        ? Object.fromEntries(
            Object.entries(parsed.lastActionByPlayerId).map(([playerId, action]) => [
              playerId,
              action === "CHECK" ||
              action === "CALL" ||
              action === "BET" ||
              action === "FOLD"
                ? action
                : "NONE",
            ]),
          )
        : {};

    const handLabelByPlayerId =
      parsed.handLabelByPlayerId && typeof parsed.handLabelByPlayerId === "object"
        ? Object.fromEntries(
            Object.entries(parsed.handLabelByPlayerId).map(([playerId, label]) => [
              playerId,
              typeof label === "string" ? label : null,
            ]),
          )
        : {};

    return {
      status: parsed.status === "ENDED" ? "ENDED" : "PLAYING",
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber > 0
          ? parsed.roundNumber
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
          : 10000,
      betStep:
        typeof parsed.betStep === "number" && Number.isFinite(parsed.betStep)
          ? parsed.betStep
          : 1000,
      playerOrder,
      currentPlayerId:
        typeof parsed.currentPlayerId === "string" ? parsed.currentPlayerId : null,
      dealerPlayerId:
        typeof parsed.dealerPlayerId === "string" ? parsed.dealerPlayerId : null,
      smallBlindPlayerId:
        typeof parsed.smallBlindPlayerId === "string"
          ? parsed.smallBlindPlayerId
          : null,
      bigBlindPlayerId:
        typeof parsed.bigBlindPlayerId === "string" ? parsed.bigBlindPlayerId : null,
      smallBlindAmount:
        typeof parsed.smallBlindAmount === "number" &&
        Number.isFinite(parsed.smallBlindAmount)
          ? parsed.smallBlindAmount
          : 1000,
      bigBlindAmount:
        typeof parsed.bigBlindAmount === "number" &&
        Number.isFinite(parsed.bigBlindAmount)
          ? parsed.bigBlindAmount
          : 2000,
      currentBet:
        typeof parsed.currentBet === "number" && Number.isFinite(parsed.currentBet)
          ? parsed.currentBet
          : 0,
      pot: typeof parsed.pot === "number" && Number.isFinite(parsed.pot) ? parsed.pot : 0,
      deck: Array.isArray(parsed.deck)
        ? parsed.deck
            .map((card) => parseCard(card))
            .filter((card): card is PokerCard => card !== null)
        : [],
      communityCards: Array.isArray(parsed.communityCards)
        ? parsed.communityCards
            .map((card) => parseCard(card))
            .filter((card): card is PokerCard => card !== null)
        : [],
      holeCardsByPlayerId,
      stackByPlayerId: numericRecord(parsed.stackByPlayerId),
      playerBets: numericRecord(parsed.playerBets),
      totalContributionsByPlayerId: numericRecord(
        parsed.totalContributionsByPlayerId,
      ),
      actedPlayerIds: parsePlayerIdList(parsed.actedPlayerIds),
      foldedPlayerIds: parsePlayerIdList(parsed.foldedPlayerIds),
      allInPlayerIds: parsePlayerIdList(parsed.allInPlayerIds),
      lastActionByPlayerId: actionRecord as Record<string, PokerPlayerAction>,
      lastActionPlayerId:
        typeof parsed.lastActionPlayerId === "string" ? parsed.lastActionPlayerId : null,
      lastActionAmount:
        typeof parsed.lastActionAmount === "number" && Number.isFinite(parsed.lastActionAmount)
          ? parsed.lastActionAmount
          : null,
      winnerPlayerIds: parsePlayerIdList(parsed.winnerPlayerIds),
      handLabelByPlayerId,
    };
  } catch {
    return fallback;
  }
}

export function parseJokerLoopState(
  raw: string | null | undefined,
): JokerLoopRoomState {
  const fallback: JokerLoopRoomState = {
    status: "PLAYING",
    phase: "REORDERING",
    roundNumber: 1,
    playerOrder: [],
    roundParticipantIds: [],
    activeGiverPlayerId: null,
    activePickerPlayerId: null,
    drawnThisRoundPlayerIds: [],
    readyByPlayerId: {},
    handsByPlayerId: {},
    jokerHolderPlayerId: null,
    lastRoundClearedPlayerIds: [],
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<JokerLoopRoomState>;
    const playerOrder = Array.isArray(parsed.playerOrder)
      ? parsed.playerOrder.filter(
          (playerId): playerId is string => typeof playerId === "string",
        )
      : [];

    const handsByPlayerId: Record<string, JokerLoopCard[]> = {};
    if (parsed.handsByPlayerId && typeof parsed.handsByPlayerId === "object") {
      for (const [playerId, rawHand] of Object.entries(parsed.handsByPlayerId)) {
        if (!Array.isArray(rawHand)) {
          handsByPlayerId[playerId] = [];
          continue;
        }
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
      playerOrder,
      roundParticipantIds: Array.isArray(parsed.roundParticipantIds)
        ? parsed.roundParticipantIds.filter(
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [],
      activeGiverPlayerId:
        typeof parsed.activeGiverPlayerId === "string"
          ? parsed.activeGiverPlayerId
          : null,
      activePickerPlayerId:
        typeof parsed.activePickerPlayerId === "string"
          ? parsed.activePickerPlayerId
          : null,
      drawnThisRoundPlayerIds: Array.isArray(parsed.drawnThisRoundPlayerIds)
        ? parsed.drawnThisRoundPlayerIds.filter(
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [],
      readyByPlayerId:
        parsed.readyByPlayerId && typeof parsed.readyByPlayerId === "object"
          ? Object.fromEntries(
              Object.entries(parsed.readyByPlayerId).map(([playerId, value]) => [
                playerId,
                Boolean(value),
              ]),
            )
          : {},
      handsByPlayerId,
      jokerHolderPlayerId:
        typeof parsed.jokerHolderPlayerId === "string"
          ? parsed.jokerHolderPlayerId
          : null,
      lastRoundClearedPlayerIds: Array.isArray(parsed.lastRoundClearedPlayerIds)
        ? parsed.lastRoundClearedPlayerIds.filter(
            (playerId): playerId is string => typeof playerId === "string",
          )
        : [],
    };
  } catch {
    return fallback;
  }
}

export function parseUnoState(
  raw: string | null | undefined,
): UnoRoomState {
  const fallback: UnoRoomState = {
    status: "LOBBY",
    roundNumber: 0,
    playerOrder: [],
    currentPlayerId: null,
    direction: 1,
    drawPile: [],
    discardPile: [],
    handsByPlayerId: {},
    activeColor: null,
    pendingDrawAmount: 0,
    winnerPlayerId: null,
    drawnCardThisTurnId: null,
    lastAction: null,
  };

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<UnoRoomState>;
    const playerOrder = Array.isArray(parsed.playerOrder)
      ? parsed.playerOrder.filter(
          (playerId): playerId is string => typeof playerId === "string",
        )
      : [];

    const parseUnoCard = (rawCard: unknown): UnoCard | null => {
      if (!rawCard || typeof rawCard !== "object") return null;
      const card = rawCard as Partial<UnoCard>;
      const validColor =
        card.color === "RED" ||
        card.color === "YELLOW" ||
        card.color === "GREEN" ||
        card.color === "BLUE" ||
        card.color === "WILD";
      const validKind =
        card.kind === "NUMBER" ||
        card.kind === "SKIP" ||
        card.kind === "REVERSE" ||
        card.kind === "DRAW_TWO" ||
        card.kind === "WILD" ||
        card.kind === "WILD_DRAW_FOUR";

      if (
        typeof card.id !== "string" ||
        !validColor ||
        !validKind ||
        (card.value !== null &&
          card.value !== undefined &&
          (typeof card.value !== "number" || !Number.isFinite(card.value))) ||
        typeof card.label !== "string"
      ) {
        return null;
      }

      return {
        id: card.id,
        color: card.color as UnoColor,
        kind: card.kind as UnoCardKind,
        value: typeof card.value === "number" ? card.value : null,
        label: card.label,
      };
    };

    const parseUnoCardList = (rawCards: unknown): UnoCard[] =>
      Array.isArray(rawCards)
        ? rawCards
            .map((card) => parseUnoCard(card))
            .filter((card): card is UnoCard => card !== null)
        : [];

    const handsByPlayerId: Record<string, UnoCard[]> = {};
    if (parsed.handsByPlayerId && typeof parsed.handsByPlayerId === "object") {
      for (const [playerId, rawHand] of Object.entries(parsed.handsByPlayerId)) {
        handsByPlayerId[playerId] = parseUnoCardList(rawHand);
      }
    }

    return {
      status:
        parsed.status === "PLAYING" || parsed.status === "ENDED"
          ? parsed.status
          : "LOBBY",
      roundNumber:
        typeof parsed.roundNumber === "number" &&
        Number.isFinite(parsed.roundNumber) &&
        parsed.roundNumber >= 0
          ? parsed.roundNumber
          : 0,
      playerOrder,
      currentPlayerId:
        typeof parsed.currentPlayerId === "string" ? parsed.currentPlayerId : null,
      direction: parsed.direction === -1 ? -1 : 1,
      drawPile: parseUnoCardList(parsed.drawPile),
      discardPile: parseUnoCardList(parsed.discardPile),
      handsByPlayerId,
      activeColor:
        parsed.activeColor === "RED" ||
        parsed.activeColor === "YELLOW" ||
        parsed.activeColor === "GREEN" ||
        parsed.activeColor === "BLUE"
          ? parsed.activeColor
          : null,
      pendingDrawAmount:
        typeof parsed.pendingDrawAmount === "number" &&
        Number.isFinite(parsed.pendingDrawAmount) &&
        parsed.pendingDrawAmount >= 0
          ? parsed.pendingDrawAmount
          : 0,
      winnerPlayerId:
        typeof parsed.winnerPlayerId === "string" ? parsed.winnerPlayerId : null,
      drawnCardThisTurnId:
        typeof parsed.drawnCardThisTurnId === "string"
          ? parsed.drawnCardThisTurnId
          : null,
      lastAction:
        typeof parsed.lastAction === "string" ? parsed.lastAction : null,
    };
  } catch {
    return fallback;
  }
}
