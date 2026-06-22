/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
"use client";

import Image from "next/image";
import React from "react";
import { ChevronDown, Club, Film } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import PokerRoom from "./PokerRoom";
import UnoRoom from "./UnoRoom";

const PARTY_TABLE_STYLES = {
  default: {
    shell:
      "border-white/20 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_rgba(10,14,24,0.9)_58%,_rgba(5,7,12,0.98)_100%)]",
    chip: "bg-white/12 text-white/80 border-white/15",
    action: "border-white/15 bg-white/10 text-white",
    tip: "border-white/10 bg-black/25 text-white/80",
    promptAccent: "from-white/95 via-slate-50 to-slate-100",
    corner: "Table Deck",
    tipTitle: "Table Flow",
    tipText: "Clean prompt in the middle, quick action on the side, same rhythm as Poker.",
  },
  "never-have-i-ever": {
    shell:
      "border-rose-300/25 bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.28),_rgba(24,12,22,0.92)_58%,_rgba(10,6,12,0.98)_100%)]",
    chip: "border-rose-300/20 bg-rose-400/15 text-rose-100",
    action: "border-rose-300/20 bg-rose-400/12 text-rose-50",
    tip: "border-orange-300/15 bg-orange-400/10 text-orange-50/85",
    promptAccent: "from-white via-rose-50 to-orange-50",
    corner: "Confession",
    tipTitle: "Sip Check",
    tipText: "Keep the prompt bright and the action obvious so players react fast.",
  },
  imposter: {
    shell:
      "border-fuchsia-300/25 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.22),_rgba(18,11,27,0.93)_58%,_rgba(8,4,14,0.98)_100%)]",
    chip: "border-fuchsia-300/20 bg-fuchsia-400/12 text-fuchsia-100",
    action: "border-fuchsia-300/20 bg-fuchsia-400/10 text-fuchsia-50",
    tip: "border-cyan-300/15 bg-cyan-400/10 text-cyan-50/85",
    promptAccent: "from-white via-fuchsia-50 to-violet-50",
    corner: "Cover Story",
    tipTitle: "Hidden Role",
    tipText: "The prompt stays clean while the side panel carries the tension.",
  },
  "truth-or-drink": {
    shell:
      "border-cyan-300/25 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.24),_rgba(10,20,30,0.93)_58%,_rgba(4,8,14,0.98)_100%)]",
    chip: "border-cyan-300/20 bg-cyan-400/12 text-cyan-100",
    action: "border-cyan-300/20 bg-cyan-400/10 text-cyan-50",
    tip: "border-emerald-300/15 bg-emerald-400/10 text-emerald-50/85",
    promptAccent: "from-white via-cyan-50 to-sky-50",
    corner: "Truth Call",
    tipTitle: "Decision Point",
    tipText: "This layout makes the question feel like a featured card and the choice feel immediate.",
  },
  "pick-a-card": {
    shell:
      "border-amber-300/25 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.24),_rgba(28,16,12,0.93)_58%,_rgba(12,8,6,0.98)_100%)]",
    chip: "border-amber-300/20 bg-amber-400/12 text-amber-100",
    action: "border-amber-300/20 bg-amber-400/10 text-amber-50",
    tip: "border-rose-300/15 bg-rose-400/10 text-rose-50/85",
    promptAccent: "from-white via-amber-50 to-rose-50",
    corner: "Drawn Card",
    tipTitle: "Card Energy",
    tipText: "A card game should feel dealt, not dumped into a text box.",
  },
  "higher-lower": {
    shell:
      "border-indigo-300/25 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.24),_rgba(12,14,32,0.93)_58%,_rgba(5,7,14,0.98)_100%)]",
    chip: "border-indigo-300/20 bg-indigo-400/12 text-indigo-100",
    action: "border-indigo-300/20 bg-indigo-400/10 text-indigo-50",
    tip: "border-emerald-300/15 bg-emerald-400/10 text-emerald-50/85",
    promptAccent: "from-white via-indigo-50 to-sky-50",
    corner: "Read The Run",
    tipTitle: "Fast Read",
    tipText: "One giant value, two bold calls, and a side summary keeps this game snappy.",
  },
  "most-likely": {
    shell:
      "border-lime-300/25 bg-[radial-gradient(circle_at_top,_rgba(132,204,22,0.22),_rgba(16,24,12,0.93)_58%,_rgba(8,12,6,0.98)_100%)]",
    chip: "border-lime-300/20 bg-lime-400/12 text-lime-100",
    action: "border-lime-300/20 bg-lime-400/10 text-lime-50",
    tip: "border-emerald-300/15 bg-emerald-400/10 text-emerald-50/85",
    promptAccent: "from-white via-lime-50 to-emerald-50",
    corner: "Spotlight Vote",
    tipTitle: "Vote Pressure",
    tipText: "Keep the prompt prominent and the vote buttons easy to scan in a crowd.",
  },
  "verbal-charades": {
    shell:
      "border-orange-300/25 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.24),_rgba(29,16,10,0.93)_58%,_rgba(12,8,5,0.98)_100%)]",
    chip: "border-orange-300/20 bg-orange-400/12 text-orange-100",
    action: "border-orange-300/20 bg-orange-400/10 text-orange-50",
    tip: "border-yellow-300/15 bg-yellow-400/10 text-yellow-50/85",
    promptAccent: "from-white via-orange-50 to-amber-50",
    corner: "Act It Out",
    tipTitle: "Stage Notes",
    tipText: "The acting pair, timer, and resolution controls now read like one matched set.",
  },
  "you-laugh-you-drink": {
    shell:
      "border-amber-300/25 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.24),_rgba(39,16,16,0.93)_58%,_rgba(18,7,7,0.98)_100%)]",
    chip: "border-amber-300/20 bg-amber-400/12 text-amber-100",
    action: "border-rose-300/20 bg-rose-400/10 text-rose-50",
    tip: "border-yellow-300/15 bg-yellow-400/10 text-yellow-50/85",
    promptAccent: "from-white via-amber-50 to-rose-50",
    corner: "Straight Face",
    tipTitle: "Face-Off Rule",
    tipText:
      "Attacker judges the laugh. If the target breaks, they drink. If they hold steady, the pressure flips back.",
  },
  "truth-or-lie": {
    shell:
      "border-violet-300/25 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.24),_rgba(17,13,31,0.93)_58%,_rgba(7,5,14,0.98)_100%)]",
    chip: "border-violet-300/20 bg-violet-400/12 text-violet-100",
    action: "border-violet-300/20 bg-violet-400/10 text-violet-50",
    tip: "border-pink-300/15 bg-pink-400/10 text-pink-50/85",
    promptAccent: "from-white via-violet-50 to-fuchsia-50",
    corner: "Bluff Check",
    tipTitle: "Reveal Timing",
    tipText: "Voting and reveal moments should feel dramatic without getting cluttered.",
  },
  "would-you-rather": {
    shell:
      "border-blue-300/25 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.24),_rgba(12,16,30,0.93)_58%,_rgba(5,8,15,0.98)_100%)]",
    chip: "border-blue-300/20 bg-blue-400/12 text-blue-100",
    action: "border-blue-300/20 bg-blue-400/10 text-blue-50",
    tip: "border-orange-300/15 bg-orange-400/10 text-orange-50/85",
    promptAccent: "from-white via-blue-50 to-orange-50",
    corner: "Split Choice",
    tipTitle: "Crowd Split",
    tipText: "The choice card is the star and the side panel shows where the room is leaning.",
  },
  triviyay: {
    shell:
      "border-purple-300/25 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.24),_rgba(18,11,29,0.93)_58%,_rgba(8,5,14,0.98)_100%)]",
    chip: "border-purple-300/20 bg-purple-400/12 text-purple-100",
    action: "border-purple-300/20 bg-purple-400/10 text-purple-50",
    tip: "border-amber-300/15 bg-amber-400/10 text-amber-50/85",
    promptAccent: "from-white via-purple-50 to-pink-50",
    corner: "Category Card",
    tipTitle: "Team Table",
    tipText: "Judging teams and category calls should feel structured, not improvised.",
  },
  "catherines-special": {
    shell:
      "border-emerald-300/25 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.24),_rgba(10,24,18,0.93)_58%,_rgba(4,10,7,0.98)_100%)]",
    chip: "border-emerald-300/20 bg-emerald-400/12 text-emerald-100",
    action: "border-emerald-300/20 bg-emerald-400/10 text-emerald-50",
    tip: "border-cyan-300/15 bg-cyan-400/10 text-cyan-50/85",
    promptAccent: "from-white via-emerald-50 to-cyan-50",
    corner: "Math Head",
    tipTitle: "Mental Sprint",
    tipText: "Timer, answer reveal, and result controls now sit inside one stronger card frame.",
  },
};

function getPartyTableStyle(gameCode: string) {
  return PARTY_TABLE_STYLES[gameCode] ?? PARTY_TABLE_STYLES.default;
}

function PartyStageButton({
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<typeof Button> & {
  tone?: "neutral" | "accent" | "success" | "danger" | "warning";
}) {
  const toneClasses = {
    neutral: "bg-white/12 text-white hover:bg-white/18",
    accent: "bg-cyan-500 text-slate-950 hover:bg-cyan-400",
    success: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
    danger: "bg-rose-500 text-white hover:bg-rose-400",
    warning: "bg-amber-400 text-slate-950 hover:bg-amber-300",
  };

  return (
    <Button
      {...props}
      className={cn(
        "min-w-[11rem] rounded-xl px-5 py-6 text-sm font-semibold shadow-lg transition-transform duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50",
        toneClasses[tone],
        className,
      )}
    />
  );
}

function PartyMetricCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning";
}) {
  const toneClasses = {
    neutral: "border-white/15 bg-white/10 text-white",
    accent: "border-cyan-300/20 bg-cyan-400/10 text-cyan-50",
    success: "border-emerald-300/20 bg-emerald-400/10 text-emerald-50",
    warning: "border-amber-300/20 bg-amber-400/10 text-amber-50",
  };

  return (
    <div className={cn("rounded-2xl border p-4 backdrop-blur-sm", toneClasses[tone])}>
      <p className="text-[11px] uppercase tracking-[0.22em] opacity-65">{label}</p>
      <p className="mt-3 text-2xl font-black leading-none sm:text-3xl">{value}</p>
      {hint ? <p className="mt-2 text-sm opacity-80">{hint}</p> : null}
    </div>
  );
}

function PartyGameLayout({
  gameCode,
  eyebrow,
  title,
  subtitle,
  actionSummary,
  actionHint,
  metrics = [],
  children,
  aside,
}: {
  gameCode: string;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actionSummary: React.ReactNode;
  actionHint: React.ReactNode;
  metrics?: Array<{
    label: React.ReactNode;
    value: React.ReactNode;
    hint?: React.ReactNode;
    tone?: "neutral" | "accent" | "success" | "warning";
  }>;
  children?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const style = getPartyTableStyle(gameCode);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div
        className={cn(
          "relative overflow-hidden rounded-[2rem] border p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:p-5 lg:p-6",
          style.shell,
        )}
      >
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute left-6 top-6 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-black/35 blur-3xl" />
        </div>

        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            {metrics.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {metrics.map((metric, index) => (
                  <PartyMetricCard key={index} {...metric} />
                ))}
              </div>
            ) : null}

            <div className="rounded-[1.75rem] border border-white/15 bg-black/20 p-4 backdrop-blur-sm sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("rounded-full border px-3 py-1", style.chip)}>
                  {eyebrow}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full border-white/15 bg-black/15 px-3 py-1 text-white/75"
                >
                  Poker Line
                </Badge>
              </div>

              <div
                className={cn(
                  "mt-4 rounded-[1.6rem] border border-slate-200/70 bg-gradient-to-br p-5 text-slate-950 shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:p-7",
                  style.promptAccent,
                )}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  <span>{eyebrow}</span>
                  <span>{style.corner}</span>
                </div>

                <div className="py-8 text-center sm:py-10">
                  <p className="text-balance text-3xl font-black leading-tight sm:text-4xl">
                    {title}
                  </p>
                  {subtitle ? (
                    <p className="mx-auto mt-4 max-w-2xl text-balance text-sm leading-6 text-slate-600 sm:text-base">
                      {subtitle}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  <span>Last Sip Wins</span>
                  <span>{style.corner}</span>
                </div>
              </div>

              {children ? (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  {children}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className={cn("rounded-[1.5rem] border p-4 backdrop-blur-sm", style.action)}>
              <p className="text-[11px] uppercase tracking-[0.24em] opacity-65">
                Last Player Action
              </p>
              <p className="mt-3 text-lg font-bold leading-snug sm:text-xl">
                {actionSummary}
              </p>
              <p className="mt-2 text-sm opacity-85">{actionHint}</p>
            </div>

            {aside ?? (
              <div className={cn("rounded-[1.5rem] border p-4 backdrop-blur-sm", style.tip)}>
                <p className="text-[11px] uppercase tracking-[0.24em] opacity-65">
                  {style.tipTitle}
                </p>
                <p className="mt-3 text-sm leading-6">{style.tipText}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(function GameContentRenderer(props: any) {
  const {
    actualPlayer,
    badChoicesAnswer,
    badChoicesCards,
    badChoicesPlayCard,
    badChoicesRedrawCards,
    badChoicesState,
    spinBottleChooseAction,
    spinBottleMode,
    spinBottleSpin,
    spinBottleState,
    actionButtonText,
    badPeopleDictatorVote,
    badPeopleGuess,
    badPeopleNextRound,
    badPeopleReveal,
    badPeopleState,
    blackjackDealerRevealPending,
    blackjackHit,
    blackjackNextRound,
    blackjackStand,
    blackjackState,
    clicked,
    codenamesBoard,
    codenamesEndTurn,
    codenamesGuess,
    codenamesIsReadyToStart,
    codenamesSelectedCardId,
    codenamesStart,
    codenamesState,
    connectLettersNextRound,
    connectLettersRedrawCooldown,
    connectLettersSecondsLeft,
    connectLettersState,
    currentQuestion,
    getBlackjackCardClasses,
    getBlackjackCardLabel,
    getBlackjackRoundExplanation,
    ghostTearsJudge,
    ghostTearsRestart,
    ghostTearsState,
    ghostTearsChallenge,
    ghostTearsForfeit,
    ghostTearsPickLetter,
    guessNumberSetPlayerNumber,
    guessNumberState,
    guessTheMovieBuzz,
    guessTheMovieJudge,
    guessTheMovieQuestion,
    guessTheMovieSecondsLeft,
    guessTheMovieState,
    handleStart,
    handleStop,
    isRunning,
    jokerLoopHighlightedIndex,
    jokerLoopNextRound,
    jokerLoopPickCard,
    jokerLoopReady,
    jokerLoopReorderCard,
    jokerLoopRestart,
    jokerLoopState,
    kingsCupCardInfo,
    memoryChainBoard,
    memoryChainGuess,
    memoryChainNextPlayer,
    memoryChainSequence,
    memoryChainState,
    nameTheSongBuzz,
    nameTheSongJudge,
    nameTheSongQuestion,
    nameTheSongSecondsLeft,
    nameTheSongState,
    nextCatherineCard,
    nextCharadeCard,
    nextYouLaughYouDrinkCard,
    nextCardCategory,
    nextCardPOD,
    nextQuestion,
    nextRound,
    nextTruthLieCard,
    nextWouldRatherQuestion,
    OptionsColors,
    paranoiaNextCard,
    paranoiaReveal,
    paranoiaVote,
    parseNameTheSongPrompt,
    players,
    pokerBet,
    pokerBetDraft,
    pokerBetPickerOpen,
    pokerCall,
    pokerFold,
    pokerNextRound,
    pokerState,
    questionTypePickACard,
    revealTruthLie,
    rideTheBusGuess,
    rideTheBusState,
    room,
    secretPickerOpenStart,
    selectedGame,
    SelectedOption,
    setForfited,
    setClicked,
    setCodenamesSelectedCardId,
    setGuessPickerOpenStart,
    setJokerLoopHighlightedIndex,
    setPokerBetDraft,
    setPokerBetPickerOpen,
    setSecretPickerOpenStart,
    setShowPokerHandRankings,
    setWinningTeams,
    showPokerHandRankings,
    tabooForbiddenWords,
    unoDrawCard,
    unoPendingWildCardId,
    unoPassTurn,
    unoPlayCard,
    unoSetPendingWildCardId,
    unoStart,
    unoState,
    timeLeft,
    updatePlayerStatsPOD,
    updateRoom,
    vote,
    voteQuestion,
    voteTruthLie,
    formatTime,
    generateCard,
    getBlackjackHandTotal,
    getBlackjackResultBadgeClasses,
    getBlackjackResultLabel,
    whoAmICards,
    whoAmINextRound,
    whoAmINotes,
    whoAmIState,
    whoAmIWinRound,
    winningTeams,
    getMovieCategoryLabel,
    getRideTheBusCardLabel,
    getRideTheBusStepLabel,
    guessPickerOpenStart,
    imposterResolveRound,
    connectLettersBuzz,
    connectLettersJudge,
    connectLettersRedrawLetters,
    connectLettersStopTimer,
    connectLettersTimerDuration,
    removeVowels,
    wouldRatherResult,
  } = props;
  const roomState = room;

  const currentPlayer = room?.currentPlayerId
    ? players.find((p) => p.id === room.currentPlayerId)?.name ||
      "Unknown Player"
    : "No player selected";
  const getPlayerNameById = React.useCallback(
    (playerId: string | null | undefined) => {
      if (!playerId) return "Player";
      return players.find((player) => player.id === playerId)?.name || "Player";
    },
    [players],
  );
  const actualPlayerName = actualPlayer
    ? getPlayerNameById(actualPlayer)
    : "You";

  const teams = room?.playingTeams || [];
  const [badPeopleUseDoubleDown, setBadPeopleUseDoubleDown] = React.useState(false);
  const [badChoicesSelectedCardId, setBadChoicesSelectedCardId] = React.useState(null);
  const [badChoicesDiscardIds, setBadChoicesDiscardIds] = React.useState<number[]>([]);
  const [badChoicesSelectedTargetId, setBadChoicesSelectedTargetId] = React.useState("");
  const [spinBottleRotation, setSpinBottleRotation] = React.useState(0);
  const [spinBottleTransitionMs, setSpinBottleTransitionMs] = React.useState(0);
  const [spinBottleNow, setSpinBottleNow] = React.useState(() => Date.now());

  const badChoicesCardMap = React.useMemo(
    () => new Map((badChoicesCards || []).map((card) => [card.id, card])),
    [badChoicesCards],
  );

  const getBadChoicesCardType = React.useCallback((card) => {
    if (!card?.answer) return "QUESTION";
    if (card.answer === "SKIP") return "SKIP";
    if (card.answer === "DRAW_ONE") return "DRAW_ONE";
    if (card.answer === "DRAW_TWO") return "DRAW_TWO";
    if (card.answer === "ALL_PLAY") return "ALL_PLAY";
    return "QUESTION";
  }, []);

  React.useEffect(() => {
    setBadPeopleUseDoubleDown(false);
  }, [
    actualPlayer,
    badPeopleState?.dictatorPlayerId,
    badPeopleState?.revealedPlayerId,
    badPeopleState?.roundNumber,
    badPeopleState?.status,
  ]);

  const previousBadChoicesSnapshotRef = React.useRef({
    actualPlayer,
    turnPlayerId: room?.currentPlayerId ?? null,
    roundNumber: badChoicesState?.roundNumber ?? 1,
    status: badChoicesState?.status ?? "PLAYING",
    activeCardId: badChoicesState?.activeCardId ?? null,
  });

  React.useEffect(() => {
    const previous = previousBadChoicesSnapshotRef.current;
    const nextSnapshot = {
      actualPlayer,
      turnPlayerId: room?.currentPlayerId ?? null,
      roundNumber: badChoicesState?.roundNumber ?? 1,
      status: badChoicesState?.status ?? "PLAYING",
      activeCardId: badChoicesState?.activeCardId ?? null,
    };

    const shouldResetSelection =
      previous.actualPlayer !== nextSnapshot.actualPlayer ||
      previous.turnPlayerId !== nextSnapshot.turnPlayerId ||
      previous.roundNumber !== nextSnapshot.roundNumber ||
      previous.status !== nextSnapshot.status ||
      previous.activeCardId !== nextSnapshot.activeCardId;

    if (shouldResetSelection) {
      setBadChoicesSelectedCardId(null);
      setBadChoicesDiscardIds([]);
      setBadChoicesSelectedTargetId("");
    }

    previousBadChoicesSnapshotRef.current = nextSnapshot;
  }, [
    actualPlayer,
    room?.currentPlayerId,
    badChoicesState?.activeCardId,
    badChoicesState?.roundNumber,
    badChoicesState?.status,
  ]);

  React.useEffect(() => {
    if (selectedGame !== "spin-the-bottle") {
      return;
    }

    const hasActiveSpin =
      Boolean(spinBottleState?.spinStartedAt) &&
      spinBottleState?.status === "AWAITING_ACTION";
    if (!hasActiveSpin) {
      setSpinBottleNow(Date.now());
      return;
    }

    const intervalId = window.setInterval(() => {
      setSpinBottleNow(Date.now());
    }, 120);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedGame, spinBottleState?.spinStartedAt, spinBottleState?.status]);

  React.useEffect(() => {
    if (selectedGame !== "spin-the-bottle") {
      setSpinBottleRotation(0);
      setSpinBottleTransitionMs(0);
      return;
    }

    if (!spinBottleState?.spinStartedAt) {
      setSpinBottleTransitionMs(0);
      setSpinBottleRotation(spinBottleState?.finalAngle || 0);
      return;
    }

    const endsAt =
      new Date(spinBottleState.spinStartedAt).getTime() +
      (spinBottleState.spinDurationMs || 0);
    const remainingMs = Math.max(0, endsAt - Date.now());

    if (remainingMs === 0) {
      setSpinBottleTransitionMs(0);
      setSpinBottleRotation(spinBottleState.finalAngle || 0);
      return;
    }

    setSpinBottleTransitionMs(remainingMs);
    requestAnimationFrame(() => {
      setSpinBottleRotation(spinBottleState.finalAngle || 0);
    });
  }, [
    selectedGame,
    spinBottleState?.finalAngle,
    spinBottleState?.spinDurationMs,
    spinBottleState?.spinSequence,
    spinBottleState?.spinStartedAt,
  ]);

  const currentTeamLeaderId = React.useCallback(() => {
    if (selectedGame !== "triviyay") {
      return "";
    }

    const teamPlayers = players.filter((p) => p.team === room?.currentPlayerId);
    return teamPlayers[0]?.id || "";
  }, [players, room?.currentPlayerId, selectedGame]);

  const renderGameSpecificContent = () => {
    switch (selectedGame) {
      case "never-have-i-ever":
        return (
          <PartyGameLayout
            gameCode="never-have-i-ever"
            eyebrow="Never Have I Ever"
            title={
              currentQuestion?.text ||
              "No question available. Please wait for the next round."
            }
            subtitle="Players who have done it take a drink. Keep the confession quick and keep the table moving."
            actionSummary={
              clicked
                ? `${actualPlayerName} locked in their move for this card.`
                : `${currentPlayer} is setting the tone for the round.`
            }
            actionHint={
              clicked
                ? "Use the next card when the room is ready for a fresh confession."
                : "Mark the sip or jump straight to the next question."
            }
            metrics={[
              {
                label: "Round",
                value: room?.currentRound || 1,
                hint: "Prompt deck live",
                tone: "accent",
              },
              {
                label: "Your Drinks",
                value:
                  room?.players?.find((player) => player.id === actualPlayer)?.drinks ||
                  0,
                hint: "Current tally",
                tone: "warning",
              },
              {
                label: "Turn Focus",
                value: currentPlayer,
                hint: "Keep it honest",
              },
            ]}
          >
            {!clicked && (
              <PartyStageButton
                  onClick={() => {
                    updateRoom.mutate({
                      gamecode: "never-have-i-ever",
                      roomId: room.id,
                      points: String(
                        room?.players?.find((p) => p.id === actualPlayer)
                          ?.points || 0,
                      ),
                      drinks: String(
                        //@ts-expect-error leave it
                        room?.players?.find((p) => p.id === actualPlayer)
                          ?.drinks + 1 || 0,
                      ),
                      currentPlayerId: actualPlayer ?? "",
                      currentQuestionId:
                        room.currentQuestionId == null
                          ? ""
                          : String(room.currentQuestionId),
                    });
                    setClicked(true);
                  }}
                  tone="warning"
                >
                  Took a Drink
              </PartyStageButton>
            )}
            {selectedGame === "never-have-i-ever" && !clicked && (
              <PartyStageButton
                  onClick={() => {
                    nextQuestion.mutate({
                      gamecode: "never-have-i-ever",
                      roomId: room.id,
                      currentQuestionId:
                        room.currentQuestionId == null
                          ? ""
                          : String(room.currentQuestionId),
                    });
                    setClicked(true);
                  }}
                  tone="accent"
                >
                  Next Question
              </PartyStageButton>
            )}
          </PartyGameLayout>
        );

      case "imposter":
        return (
          <PartyGameLayout
            gameCode="imposter"
            eyebrow="Imposter"
            title={
              actualPlayer === room?.currentPlayerId
                ? "IMPOSTER"
                : currentQuestion?.text ||
                  "No question available. Please wait for the next round."
            }
            subtitle={
              actualPlayer === room?.currentPlayerId
                ? "Choose the round outcome. Were you discovered or did you stay hidden?"
                : "Study the clue, read the room, and figure out who is bluffing."
            }
            actionSummary={
              actualPlayer === room?.currentPlayerId
                ? "The imposter is resolving the round."
                : `${currentPlayer} is holding the secret while everyone else investigates.`
            }
            actionHint={
              actualPlayer === room?.currentPlayerId
                ? "Lock the result when the table has called it."
                : "Only the imposter can finish this round from here."
            }
            metrics={[
              {
                label: "Status",
                value:
                  actualPlayer === room?.currentPlayerId ? "Undercover" : "Hunting",
                hint: "One role is hidden",
                tone: "accent",
              },
              {
                label: "Key Player",
                value: currentPlayer,
                hint: "Current secret holder",
              },
              {
                label: "Round",
                value: room?.currentRound || 1,
                hint: "Trust nobody",
                tone: "warning",
              },
            ]}
          >
            {actualPlayer === room?.currentPlayerId ? (
              <>
                <PartyStageButton
                  onClick={() => {
                    if (clicked) return;
                    imposterResolveRound.mutate({
                      roomId: room.id,
                      currentPlayerId: room.currentPlayerId ?? "",
                      currentQuestionId:
                        room.currentQuestionId == null
                          ? ""
                          : String(room.currentQuestionId),
                      wasFound: true,
                    });
                    setClicked(true);
                  }}
                  tone="danger"
                  disabled={clicked || imposterResolveRound.isPending}
                >
                  I Was Caught
                </PartyStageButton>
                <PartyStageButton
                  onClick={() => {
                    if (clicked) return;
                    imposterResolveRound.mutate({
                      roomId: room.id,
                      currentPlayerId: room.currentPlayerId ?? "",
                      currentQuestionId:
                        room.currentQuestionId == null
                          ? ""
                          : String(room.currentQuestionId),
                      wasFound: false,
                    });
                    setClicked(true);
                  }}
                  tone="success"
                  disabled={clicked || imposterResolveRound.isPending}
                >
                  I Stayed Hidden
                </PartyStageButton>
              </>
            ) : (
              <div className="rounded-2xl border border-white/15 bg-white/8 px-5 py-4 text-sm text-white/75">
                Waiting for the imposter to resolve this round.
              </div>
            )}
          </PartyGameLayout>
        );

      case "truth-or-drink":
        return (
          <PartyGameLayout
            gameCode="truth-or-drink"
            eyebrow="Truth or Drink"
            title={
              currentQuestion?.text ||
              "No question available. Please wait for the next round."
            }
            subtitle="A clean answer earns the point. A sip keeps the mystery alive."
            actionSummary={
              actualPlayer === room?.currentPlayerId
                ? clicked
                  ? `${actualPlayerName} already made the call on this question.`
                  : "Decision live: answer truthfully or take the drink."
                : `Waiting for ${currentPlayer} to respond to the card.`
            }
            actionHint="The active player owns the decision while everyone else watches the fallout."
            metrics={[
              {
                label: "Turn",
                value: currentPlayer,
                hint: "Current hot seat",
                tone: "accent",
              },
              {
                label: "Your Points",
                value:
                  room?.players?.find((player) => player.id === actualPlayer)?.points ||
                  0,
                hint: "Truth wins",
                tone: "success",
              },
              {
                label: "Your Drinks",
                value:
                  room?.players?.find((player) => player.id === actualPlayer)?.drinks ||
                  0,
                hint: "Sip total",
                tone: "warning",
              },
            ]}
          >
            {actualPlayer === room?.currentPlayerId && !clicked && (
              <>
                <PartyStageButton
                  onClick={() => {
                    updateRoom.mutate({
                      gamecode: "truth-or-drink",
                      roomId: room.id,
                      points: String(
                        //@ts-expect-error leave it
                        room?.players?.find(
                          (p) => p.id === room.currentPlayerId,
                        )?.points + 1 || 0,
                      ),
                      drinks: String(
                        room?.players?.find(
                          (p) => p.id === room.currentPlayerId,
                        )?.drinks || 0,
                      ),
                      currentPlayerId: room.currentPlayerId ?? "",
                      currentQuestionId:
                        room.currentQuestionId == null
                          ? ""
                          : String(room.currentQuestionId),
                    });
                    setClicked(true);
                  }}
                  tone="success"
                >
                  Answered Truthfully
                </PartyStageButton>
                <PartyStageButton
                  onClick={() => {
                    updateRoom.mutate({
                      gamecode: "truth-or-drink",
                      roomId: room.id,
                      points: String(
                        room?.players?.find(
                          (p) => p.id === room.currentPlayerId,
                        )?.points || 0,
                      ),
                      drinks: String(
                        //@ts-expect-error leave it
                        room?.players?.find(
                          (p) => p.id === room.currentPlayerId,
                        )?.drinks + 1 || 0,
                      ),
                      currentPlayerId: room.currentPlayerId ?? "",
                      currentQuestionId:
                        room.currentQuestionId == null
                          ? ""
                          : String(room.currentQuestionId),
                    });
                    setClicked(true);
                  }}
                  tone="warning"
                >
                  Took a Drink
                </PartyStageButton>
              </>
            )}
          </PartyGameLayout>
        );

      case "pick-a-card":
        return (
          <PartyGameLayout
            gameCode="pick-a-card"
            eyebrow={questionTypePickACard || "Pick a Card"}
            title={currentQuestion?.text || "No question available. Please wait for the next round."}
            subtitle="Resolve the drawn card, score it if you win it, or take the sip and keep the deck moving."
            actionSummary={
              currentQuestion?.edition === 3
                ? `${currentPlayer} is holding a transition card.`
                : `${currentPlayer} drew a ${String(questionTypePickACard || "fresh").toLowerCase()} card.`
            }
            actionHint={
              currentQuestion?.edition === 3
                ? "Flip forward when the room is ready."
                : "Play the effect cleanly, then send the next card."
            }
            metrics={[
              {
                label: "Card Type",
                value: questionTypePickACard || "Mystery",
                hint: "Current pull",
                tone: "accent",
              },
              {
                label: "Turn",
                value: currentPlayer,
                hint: "Resolve the draw",
              },
              {
                label: "Mode",
                value: currentQuestion?.edition === 3 ? "Flip" : "Play",
                hint: "Deck behavior",
                tone: "warning",
              },
            ]}
          >
            <div className="text-xl text-yellow-400 mb-4">
              <p>{questionTypePickACard}</p>
            </div>
            <div className="text-xl text-emerald-400 mb-4">
              👤 {currentPlayer}&apos;s Turn
            </div>
            <div className="text-xl mb-6 text-white leading-relaxed">
              {currentQuestion?.text ||
                "No question available. Please wait for the next round."}
            </div>
            {actualPlayer === room?.currentPlayerId &&
              !clicked &&
              currentQuestion?.edition !== 3 && (
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      updatePlayerStatsPOD.mutate({
                        gamecode: "pick-a-card",
                        roomId: room.id,
                        points: String(
                          //@ts-expect-error leave it
                          room?.players?.find(
                            (p) => p.id === room.currentPlayerId,
                          )?.points + 1 || 0,
                        ),
                        drinks: String(
                          room?.players?.find(
                            (p) => p.id === room.currentPlayerId,
                          )?.drinks || 0,
                        ),
                        currentPlayerId: room.currentPlayerId ?? "",
                        currentQuestionId:
                          room.currentQuestionId == null
                            ? ""
                            : String(room.currentQuestionId),
                      });
                      setClicked(true);
                    }}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    {actionButtonText}
                  </button>
                  <button
                    onClick={() => {
                      updatePlayerStatsPOD.mutate({
                        gamecode: "pick-a-card",
                        roomId: room.id,
                        points: String(
                          room?.players?.find(
                            (p) => p.id === room.currentPlayerId,
                          )?.points || 0,
                        ),
                        drinks: String(
                          //@ts-expect-error leave it
                          room?.players?.find(
                            (p) => p.id === room.currentPlayerId,
                          )?.drinks + 1 || 0,
                        ),
                        currentPlayerId: room.currentPlayerId ?? "",
                        currentQuestionId:
                          room.currentQuestionId == null
                            ? ""
                            : String(room.currentQuestionId),
                      });
                      setClicked(true);
                    }}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Took a Drink
                  </button>
                </div>
              )}
            {!clicked && currentQuestion?.edition === 3 && (
              <button
                onClick={() => {
                  nextCardPOD.mutate({
                    gamecode: "pick-a-card",
                    roomId: room.id,
                    currentQuestionId:
                      room.currentQuestionId == null
                        ? ""
                        : String(room.currentQuestionId),
                    currentPlayerId: room.currentPlayerId ?? "",
                  });
                  setClicked(true);
                }}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white font-semibold transition-colors"
              >
                Next Card
              </button>
            )}
          </PartyGameLayout>
        );

      case "kings-cup":
        return (
          <div className="text-center">
            <div className="text-xl text-yellow-400 mb-4">
              {kingsCupCardInfo}
            </div>
            <div className="text-xl text-emerald-400 mb-4">
              👤 {currentPlayer}&apos;s Turn
            </div>
            <div className="text-xl mb-6 text-white leading-relaxed">
              {currentQuestion?.text ||
                "No rule card available. Please draw the next card."}
            </div>
            {currentQuestion?.edition === 13 && (
              <p className="text-red-300 mb-4">
                If this is the last King, drink the center cup and end the
                round.
              </p>
            )}
            {actualPlayer === room?.currentPlayerId && !clicked && (
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    nextCardPOD.mutate({
                      gamecode: "kings-cup",
                      roomId: room.id,
                      currentQuestionId:
                        room.currentQuestionId == null
                          ? ""
                          : String(room.currentQuestionId),
                      currentPlayerId: room.currentPlayerId ?? "",
                    });
                    setClicked(true);
                  }}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Next Card
                </button>
                <button
                  onClick={() => {
                    updatePlayerStatsPOD.mutate({
                      gamecode: "kings-cup",
                      roomId: room.id,
                      points: String(
                        room?.players?.find(
                          (p) => p.id === room.currentPlayerId,
                        )?.points || 0,
                      ),
                      drinks: String(
                        (room?.players?.find(
                          (p) => p.id === room.currentPlayerId,
                        )?.drinks || 0) + 1,
                      ),
                      currentPlayerId: room.currentPlayerId ?? "",
                      currentQuestionId:
                        room.currentQuestionId == null
                          ? ""
                          : String(room.currentQuestionId),
                    });
                    setClicked(true);
                  }}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Took a Drink
                </button>
              </div>
            )}
          </div>
        );

      case "higher-lower":
        return (
          <PartyGameLayout
            gameCode="higher-lower"
            eyebrow="Higher or Lower"
            title={room?.currentCard || 500}
            subtitle="Will the next number land higher or lower on the next reveal?"
            actionSummary={
              room?.lastPlayerId
                ? `${getPlayerNameById(room.lastPlayerId)} ${
                    room?.correctPrediction ? "nailed the call." : "missed the call."
                  }`
                : `${currentPlayer} is up to read the next number.`
            }
            actionHint="Keep the current value front and center so the decision feels instant."
            metrics={[
              {
                label: "Turn",
                value: currentPlayer,
                hint: "Current caller",
                tone: "accent",
              },
              {
                label: "Round",
                value: room?.currentRound || 1,
                hint: `of ${room?.rounds || 1}`,
              },
              {
                label: "Last Result",
                value:
                  room?.lastPlayerId && room?.correctPrediction !== undefined
                    ? room?.correctPrediction
                      ? "Win"
                      : "Loss"
                    : "Pending",
                hint: "Previous call",
                tone: room?.correctPrediction ? "success" : "warning",
              },
            ]}
          >
            <div className="text-xl text-pink-400 mb-4">
              {room?.lastPlayerId !== undefined &&
                room?.lastPlayerId &&
                `Result: ${
                  room?.players?.find((p) => p.id === room.lastPlayerId)?.name
                } - ${room?.correctPrediction ? "Won ✅ " : "Lost ❌ "}`}
            </div>
            <div className="text-xl text-emerald-400 mb-4">
              👤 {currentPlayer}&apos;s Turn
            </div>
            <div className="text-6xl mb-6 text-white font-bold">
              {room?.currentCard || 500}
            </div>
            <p className="text-lg text-white/80 mb-6">
              Will the next card be higher or lower (1-1000)?
            </p>
            {actualPlayer === room?.currentPlayerId &&
              (room?.currentRound || 0) <= room?.rounds &&
              !clicked && (
                <>
                  <PartyStageButton
                    onClick={() => {
                      generateCard.mutate({
                        roomId: room.id,
                        playersAns: "UP",
                        currentPlayerId: room.currentPlayerId ?? "",
                      });
                      setClicked(true);
                    }}
                    tone="success"
                  >
                    Higher ⬆️
                  </PartyStageButton>
                  <PartyStageButton
                    onClick={() => {
                      generateCard.mutate({
                        roomId: room.id,
                        playersAns: "DOWN",
                        currentPlayerId: room.currentPlayerId ?? "",
                      });
                      setClicked(true);
                    }}
                    tone="danger"
                  >
                    Lower ⬇️
                  </PartyStageButton>
                </>
              )}
          </PartyGameLayout>
        );

      case "most-likely":
        return (
          <PartyGameLayout
            gameCode="most-likely"
            eyebrow="Most Likely To"
            title={
              currentQuestion?.text ||
              "No question available. Please wait for the next round."
            }
            subtitle="Vote for the player who fits the prompt best, then push the deck to the next question."
            actionSummary={
              clicked
                ? `${actualPlayerName} has already cast a vote this round.`
                : `Voting is open while ${currentPlayer} steers the card flow.`
            }
            actionHint="Make the crowd choices feel fast and obvious so the room stays loud."
            metrics={[
              {
                label: "Turn",
                value: currentPlayer,
                hint: "Controls the round",
                tone: "accent",
              },
              {
                label: "Players",
                value: players.length,
                hint: "Eligible chaos",
              },
              {
                label: "Round",
                value: room?.currentRound || 1,
                hint: "Vote and move",
                tone: "warning",
              },
            ]}
          >
            {actualPlayer === room?.currentPlayerId && (
              <>
                <div className="flex gap-3 justify-center flex-wrap">
                  {players.map((player) => {
                    if (actualPlayer !== player.id && !clicked) {
                      return (
                        <PartyStageButton
                          key={player.id}
                          onClick={() => {
                            vote.mutate({
                              roomId: room.id,
                              votedPlayer: player.id,
                              currentPlayerId: room.currentPlayerId ?? "",
                              gamecode: "most-likely",
                            });
                            setClicked(true);
                          }}
                          tone="accent"
                          className="min-w-[9rem] py-5"
                        >
                          Vote: {player.name}
                        </PartyStageButton>
                      );
                    }
                  })}
                </div>
              </>
            )}
            {!clicked && (
              <PartyStageButton
                onClick={() => {
                  nextRound.mutate({
                    gamecode: "most-likely",
                    roomId: room.id,
                    currentQuestionId:
                      room.currentQuestionId == null
                        ? ""
                        : String(room.currentQuestionId),
                  });
                  setClicked(true);
                }}
                tone="warning"
              >
                Next Question
              </PartyStageButton>
            )}
          </PartyGameLayout>
        );

      case "spin-the-bottle": {
        const orderedSpinPlayers =
          (spinBottleState?.playerOrder || [])
            .map((playerId) => players.find((player) => player.id === playerId))
            .filter(Boolean) || [];
        const spinnerPlayerName =
          players.find(
            (player) => player.id === spinBottleState.currentSpinnerPlayerId,
          )?.name || "Unknown Player";
        const targetPlayerName =
          players.find((player) => player.id === spinBottleState.targetPlayerId)?.name ||
          "Unknown Player";
        const lastTargetPlayerName =
          players.find(
            (player) => player.id === spinBottleState.lastTargetPlayerId,
          )?.name || "Unknown Player";
        const spinEndsAt = spinBottleState.spinStartedAt
          ? new Date(spinBottleState.spinStartedAt).getTime() +
            (spinBottleState.spinDurationMs || 0)
          : 0;
        const isSpinAnimating =
          spinBottleState.status === "AWAITING_ACTION" &&
          Boolean(spinBottleState.targetPlayerId) &&
          spinEndsAt > spinBottleNow;
        const canCurrentPlayerSpin =
          actualPlayer === spinBottleState.currentSpinnerPlayerId &&
          spinBottleState.status === "READY";
        const canChooseSpinAction =
          actualPlayer === spinBottleState.targetPlayerId &&
          spinBottleState.status === "AWAITING_ACTION" &&
          !isSpinAnimating &&
          Boolean(spinBottleState.targetPlayerId);
        const circleSize = orderedSpinPlayers.length > 8 ? 372 : 336;
        const outerRingInset = orderedSpinPlayers.length > 8 ? "18%" : "20%";
        const innerRingInset = orderedSpinPlayers.length > 8 ? "28%" : "30%";
        const playerLabelRadiusPercent = orderedSpinPlayers.length > 8 ? 44 : 43;
        const angleStep = 360 / Math.max(orderedSpinPlayers.length, 1);

        return (
          <div className="w-full">
            <style>{`
              @keyframes spin-bottle-target-pulse {
                0%, 100% {
                  transform: translate(var(--label-x), var(--label-y)) translate(-50%, -50%) scale(1.02);
                  text-shadow: 0 0 12px rgba(110, 231, 183, 0.35);
                }
                50% {
                  transform: translate(var(--label-x), var(--label-y)) translate(-50%, -50%) scale(1.14);
                  text-shadow: 0 0 22px rgba(110, 231, 183, 0.72);
                }
              }
            `}</style>
            <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {spinBottleMode?.shortName || "Classic"} Mode
                </Badge>
                <Badge variant="outline">
                  Spinner: {spinnerPlayerName}
                </Badge>
                <Badge className="bg-fuchsia-600">
                  Spin {spinBottleState.roundNumber}
                </Badge>
              </div>
              <p className="mt-4 text-sm text-white/80">
                The server picks the target first, then every phone animates the
                same spin toward that player.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="min-w-0 rounded-[2rem] border border-white/20 bg-[radial-gradient(circle_at_50%_35%,rgba(236,72,153,0.2),rgba(17,24,39,0.12)_45%,rgba(9,9,11,0.55)_100%)] p-3 backdrop-blur-sm sm:p-8 lg:p-12">
                <div
                  className="relative mx-auto aspect-square w-full"
                  style={{ maxWidth: `${circleSize}px` }}
                >
                  <div className="absolute inset-[16%] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.16),rgba(236,72,153,0.06)_45%,transparent_72%)] blur-2xl" />
                  <div className="absolute rounded-full border border-dashed border-white/15" style={{ inset: outerRingInset }} />
                  <div className="absolute rounded-full border border-white/8" style={{ inset: innerRingInset }} />
                  {orderedSpinPlayers.map((player, index) => {
                    const angle =
                      (-90 + index * angleStep) *
                      (Math.PI / 180);
                    const labelX = 50 + Math.cos(angle) * playerLabelRadiusPercent;
                    const labelY = 50 + Math.sin(angle) * playerLabelRadiusPercent;
                    const isTarget =
                      player.id === spinBottleState.targetPlayerId &&
                      (isSpinAnimating || spinBottleState.status === "AWAITING_ACTION");
                    const isLastTarget =
                      !spinBottleState.targetPlayerId &&
                      player.id === spinBottleState.lastTargetPlayerId;
                    const isSpinner = player.id === spinBottleState.currentSpinnerPlayerId;

                    return (
                      <div
                        key={player.id}
                        className={`absolute left-1/2 top-1/2 w-20 text-center text-xs font-semibold leading-tight sm:w-24 sm:text-sm ${
                          isTarget
                            ? "[animation:spin-bottle-target-pulse_1.35s_ease-in-out_infinite]"
                            : isLastTarget
                              ? "scale-105"
                              : isSpinner
                                ? "scale-105"
                                : "scale-100"
                        }`}
                        style={{
                          left: `${labelX}%`,
                          top: `${labelY}%`,
                          ["--label-x" as string]: "0px",
                          ["--label-y" as string]: "0px",
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <div
                          className={`max-w-full truncate ${
                            isTarget
                              ? "text-emerald-100"
                              : isLastTarget
                                ? "text-amber-100"
                                : isSpinner
                                  ? "text-fuchsia-100"
                                  : "text-white/80"
                          }`}
                        >
                          {player.name}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() =>
                      canCurrentPlayerSpin
                        ? spinBottleSpin.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer || "",
                          })
                        : undefined
                    }
                    disabled={!canCurrentPlayerSpin || spinBottleSpin.isPending}
                    aria-label="Spin bottle"
                    className="absolute left-1/2 top-1/2 z-10 flex h-[58%] w-[28%] -translate-x-1/2 -translate-y-1/2 items-center justify-center outline-none transition-transform duration-300 disabled:cursor-not-allowed"
                  >
                    <div
                      className="relative flex h-full w-full items-center justify-center"
                      style={{
                        transform: `rotate(${spinBottleRotation}deg)`,
                        transition:
                          spinBottleTransitionMs > 0
                            ? `transform ${spinBottleTransitionMs}ms cubic-bezier(0.12, 0.86, 0.18, 1)`
                            : "none",
                      }}
                    >
                      <Image
                        src="/beer.png"
                        alt="Beer bottle"
                        fill
                        sizes="(max-width: 768px) 28vw, 108px"
                        className="pointer-events-none select-none object-contain drop-shadow-[0_14px_24px_rgba(0,0,0,0.5)]"
                      />
                      <div className="pointer-events-none absolute inset-[18%] rounded-[50%] bg-[radial-gradient(circle_at_50%_50%,rgba(94,234,212,0.06),rgba(94,234,212,0.02)_38%,rgba(17,24,39,0)_72%)] mix-blend-soft-light" />
                    </div>
                  </button>
                </div>
              </div>

              <div className="min-w-0 space-y-4">
                <div className="min-w-0 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  {isSpinAnimating ? (
                    <>
                      <p className="break-words text-sm uppercase tracking-[0.24em] text-fuchsia-200/80">
                        Spinning
                      </p>
                      <p className="mt-2 break-words text-xl font-bold text-white">
                        {spinnerPlayerName} spun toward {targetPlayerName}
                      </p>
                      <p className="mt-2 break-words text-sm text-white/75">
                        All screens should land on the same player.
                      </p>
                    </>
                  ) : spinBottleState.status === "AWAITING_ACTION" &&
                    spinBottleState.targetPlayerId ? (
                    <>
                      <p className="break-words text-sm uppercase tracking-[0.24em] text-emerald-200/80">
                        Landed On
                      </p>
                      <p className="mt-2 break-words text-2xl font-bold text-white">
                        {targetPlayerName}
                      </p>
                      <p className="mt-2 break-words text-sm text-white/75">
                        {actualPlayer === spinBottleState.targetPlayerId
                          ? "You choose what happens next."
                          : `${targetPlayerName} chooses what happens next.`}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="break-words text-sm uppercase tracking-[0.24em] text-cyan-200/80">
                        Ready
                      </p>
                      <p className="mt-2 break-words text-xl font-bold text-white">
                        {spinnerPlayerName} is up
                      </p>
                      <p className="mt-2 break-words text-sm text-white/75">
                        Tap spin when everyone is ready.
                      </p>
                    </>
                  )}
                </div>

                {spinBottleState.lastActionLabel && (
                  <div className="min-w-0 rounded-xl border border-amber-300/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(255,255,255,0.08))] p-4 backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/90">
                      Chosen Outcome
                    </p>
                    <p className="mt-3 break-words text-xl font-bold text-white sm:text-2xl">
                      {spinBottleState.lastActionLabel}
                    </p>
                    <p className="mt-2 break-words text-sm text-amber-100/85">
                      Selected for {lastTargetPlayerName}
                    </p>
                  </div>
                )}

                <div className="min-w-0 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white">Mode outcomes</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(spinBottleMode?.actions || []).map((action) => (
                      <Badge key={action} variant="outline" className="border-white/20">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>

                {canCurrentPlayerSpin && (
                  <Button
                    className="w-full bg-fuchsia-600 hover:bg-fuchsia-700"
                    onClick={() =>
                      spinBottleSpin.mutate({
                        roomId: room?.id || "",
                        playerId: actualPlayer || "",
                      })
                    }
                    disabled={spinBottleSpin.isPending}
                  >
                    Spin Bottle
                  </Button>
                )}

                {canChooseSpinAction && (
                  <div className="min-w-0 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                    <p className="break-words text-sm font-semibold text-white">
                      Choose the outcome for {targetPlayerName}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {(spinBottleMode?.actions || []).map((action) => (
                        <Button
                          key={action}
                          variant="outline"
                          className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                          onClick={() =>
                            spinBottleChooseAction.mutate({
                              roomId: room?.id || "",
                              playerId: actualPlayer || "",
                              actionLabel: action,
                            })
                          }
                          disabled={spinBottleChooseAction.isPending}
                        >
                          {action}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {!canCurrentPlayerSpin &&
                  !(canChooseSpinAction && !isSpinAnimating) && (
                    <p className="min-w-0 break-words text-sm text-white/70">
                      {actualPlayer === spinBottleState.targetPlayerId &&
                      spinBottleState.status === "AWAITING_ACTION" &&
                      !isSpinAnimating
                        ? "Your turn to choose the outcome."
                        : actualPlayer === spinBottleState.currentSpinnerPlayerId
                        ? "Waiting for the bottle to settle."
                        : spinBottleState.status === "AWAITING_ACTION" &&
                            spinBottleState.targetPlayerId &&
                            !isSpinAnimating
                          ? `Waiting for ${targetPlayerName} to choose the outcome.`
                          : `Waiting for ${spinnerPlayerName} to spin.`}
                    </p>
                  )}
              </div>
            </div>
          </div>
        );
      }

      case "bad-choices": {
        const turnPlayerId = room?.currentPlayerId || null;
        const turnPlayerName =
          players.find((player) => player.id === turnPlayerId)?.name || "Unknown Player";
        const activeCard =
          badChoicesCardMap.get(badChoicesState.activeCardId) || currentQuestion || null;
        const myHandIds = actualPlayer
          ? badChoicesState.handsByPlayerId[actualPlayer] || []
          : [];
        const myHandCards = myHandIds
          .map((cardId) => badChoicesCardMap.get(cardId))
          .filter(Boolean);
        const selectedBadChoicesCard =
          badChoicesCardMap.get(badChoicesSelectedCardId) || null;
        const selectedBadChoicesCardType = getBadChoicesCardType(
          selectedBadChoicesCard,
        );
        const needsBadChoicesTarget =
          selectedBadChoicesCardType === "QUESTION" ||
          selectedBadChoicesCardType === "SKIP" ||
          selectedBadChoicesCardType === "DRAW_ONE" ||
          selectedBadChoicesCardType === "DRAW_TWO";
        const canPlaySelectedBadChoicesCard =
          Boolean(actualPlayer) &&
          actualPlayer === turnPlayerId &&
          badChoicesState.status === "PLAYING" &&
          selectedBadChoicesCard &&
          (!needsBadChoicesTarget || Boolean(badChoicesSelectedTargetId));
        const canRedrawBadChoicesCards =
          Boolean(actualPlayer) &&
          actualPlayer === turnPlayerId &&
          badChoicesState.status === "PLAYING" &&
          badChoicesDiscardIds.length > 0;
        const allPlayResponders = players.filter(
          (player) => player.id !== turnPlayerId,
        );
        const iAlreadyAnsweredAllPlay = actualPlayer
          ? Boolean(badChoicesState.allPlayAnswersByPlayerId[actualPlayer])
          : false;
        const targetPlayerName =
          players.find((player) => player.id === badChoicesState.activeTargetPlayerId)?.name ||
          "Unknown Player";

        return (
          <div className="w-full">
            <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Turn {badChoicesState.roundNumber}
                </Badge>
                <Badge variant="outline">
                  Current player: {turnPlayerName}
                </Badge>
                <Badge className="bg-rose-600">
                  {badChoicesState.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <p className="mt-4 text-lg text-white leading-relaxed">
                {activeCard?.text ||
                  "Build a good read, pick the right target, and empty your hand first."}
              </p>
              <p className="mt-3 text-sm text-white/75">
                Ask a player a card you think they will answer yes to. Yes means
                you discard it. No means it comes back to your hand. First player
                out wins.
              </p>
              {badChoicesState.lastResult && (
                <p className="mt-3 text-sm text-emerald-200">
                  {badChoicesState.lastResult}
                </p>
              )}
            </div>

            <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`rounded-xl border p-4 ${
                    player.id === turnPlayerId
                      ? "border-amber-300/40 bg-amber-500/10"
                      : "border-white/15 bg-black/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{player.name}</p>
                    <Badge variant="secondary">
                      {badChoicesState.handsByPlayerId[player.id]?.length || 0} cards
                    </Badge>
                  </div>
                  {player.id === badChoicesState.activeTargetPlayerId && (
                    <p className="mt-2 text-sm text-cyan-200">Answering now</p>
                  )}
                  {badChoicesState.status === "AWAITING_ALL_PLAY_ANSWERS" &&
                    player.id !== turnPlayerId && (
                      <p className="mt-2 text-sm text-white/70">
                        {badChoicesState.allPlayAnswersByPlayerId[player.id]
                          ? "Answered"
                          : "Waiting"}
                      </p>
                    )}
                </div>
              ))}
            </div>

            {badChoicesState.status === "PLAYING" && (
              <div className="rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
                {actualPlayer === turnPlayerId ? (
                  <>
                    <p className="mb-4 text-white/85">
                      Pick a card from your hand, then choose a target if that
                      card needs one.
                    </p>
                    <p className="mb-4 text-sm text-white/65">
                      Or spend your turn discarding selected cards to draw the
                      same number of new ones.
                    </p>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {myHandCards.map((card) => {
                        const cardType = getBadChoicesCardType(card);
                        const isSelected = badChoicesSelectedCardId === card.id;
                        const isMarkedForDiscard = badChoicesDiscardIds.includes(card.id);

                        return (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => setBadChoicesSelectedCardId(card.id)}
                            className={`rounded-xl border p-4 text-left transition ${
                              isSelected
                                ? "border-cyan-300 bg-cyan-500/15"
                                : "border-white/15 bg-black/20 hover:bg-white/10"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <Badge
                                className={
                                  cardType === "QUESTION"
                                    ? "bg-sky-600"
                                    : cardType === "ALL_PLAY"
                                      ? "bg-fuchsia-600"
                                      : "bg-amber-600"
                                }
                            >
                                {cardType === "QUESTION"
                                  ? "Question"
                                  : cardType === "DRAW_ONE"
                                    ? "Draw 1"
                                    : cardType === "DRAW_TWO"
                                      ? "Draw 2"
                                      : cardType.replaceAll("_", " ")}
                              </Badge>
                              {isSelected && <Badge variant="secondary">Selected</Badge>}
                            </div>
                            <p className="mt-3 text-sm text-white/90">{card.text}</p>
                            <div className="mt-4 flex items-center justify-between gap-3">
                              <span className="text-xs uppercase tracking-[0.18em] text-white/50">
                                Turn redraw
                              </span>
                              <Button
                                type="button"
                                variant={isMarkedForDiscard ? "default" : "outline"}
                                className={
                                  isMarkedForDiscard
                                    ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                                    : "border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                                }
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setBadChoicesDiscardIds((current) =>
                                    current.includes(card.id)
                                      ? current.filter((id) => id !== card.id)
                                      : [...current, card.id],
                                  );
                                }}
                              >
                                {isMarkedForDiscard ? "Marked" : "Discard"}
                              </Button>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-500/10 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            Redraw instead of playing
                          </p>
                          <p className="mt-1 text-sm text-white/75">
                            Discard {badChoicesDiscardIds.length} selected card
                            {badChoicesDiscardIds.length === 1 ? "" : "s"},
                            draw the same number, then wait for your next turn.
                          </p>
                        </div>
                        <Button
                          className="bg-amber-400 text-slate-950 hover:bg-amber-300"
                          disabled={
                            !canRedrawBadChoicesCards ||
                            badChoicesRedrawCards.isPending
                          }
                          onClick={() =>
                            badChoicesRedrawCards.mutate({
                              roomId: room?.id || "",
                              playerId: actualPlayer || "",
                              cardIds: badChoicesDiscardIds,
                            })
                          }
                        >
                          Redraw Selected Cards
                        </Button>
                      </div>
                    </div>

                    {selectedBadChoicesCard && (
                      <div className="mt-5 rounded-xl border border-white/15 bg-black/20 p-4">
                        <p className="text-sm font-semibold text-white">
                          Ready to play
                        </p>
                        <p className="mt-2 text-sm text-white/80">
                          {selectedBadChoicesCard.text}
                        </p>

                        {needsBadChoicesTarget && (
                          <div className="mt-4">
                            <p className="mb-2 text-sm text-white/75">
                              Choose a target
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {players
                                .filter((player) => player.id !== actualPlayer)
                                .map((player) => (
                                  <Button
                                    key={player.id}
                                    type="button"
                                    variant={
                                      badChoicesSelectedTargetId === player.id
                                        ? "default"
                                        : "outline"
                                    }
                                    className={
                                      badChoicesSelectedTargetId === player.id
                                        ? "bg-cyan-600 hover:bg-cyan-700"
                                        : "border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                                    }
                                    onClick={() =>
                                      setBadChoicesSelectedTargetId(player.id)
                                    }
                                  >
                                    {player.name}
                                  </Button>
                                ))}
                            </div>
                          </div>
                        )}

                        <Button
                          className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                          disabled={
                            !canPlaySelectedBadChoicesCard ||
                            badChoicesPlayCard.isPending
                          }
                          onClick={() =>
                            badChoicesPlayCard.mutate({
                              roomId: room?.id || "",
                              playerId: actualPlayer || "",
                              cardId: selectedBadChoicesCard.id,
                              ...(needsBadChoicesTarget
                                ? {
                                    targetPlayerId: badChoicesSelectedTargetId,
                                  }
                                : {}),
                            })
                          }
                        >
                          Play Card
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-white/80">
                    Waiting for {turnPlayerName} to choose a card.
                  </p>
                )}
              </div>
            )}

            {badChoicesState.status === "AWAITING_TARGET_ANSWER" && (
              <div className="rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-white/85">
                  {turnPlayerName} asked {targetPlayerName}:
                </p>
                <p className="mt-3 text-lg text-white">
                  {activeCard?.text || "No active card found."}
                </p>

                {actualPlayer === badChoicesState.activeTargetPlayerId ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={badChoicesAnswer.isPending}
                      onClick={() =>
                        badChoicesAnswer.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer || "",
                          answer: "YES",
                        })
                      }
                    >
                      Yes
                    </Button>
                    <Button
                      className="bg-rose-600 hover:bg-rose-700"
                      disabled={badChoicesAnswer.isPending}
                      onClick={() =>
                        badChoicesAnswer.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer || "",
                          answer: "NO",
                        })
                      }
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-white/75">
                    Waiting for {targetPlayerName} to answer.
                  </p>
                )}
              </div>
            )}

            {badChoicesState.status === "AWAITING_ALL_PLAY_ANSWERS" && (
              <div className="rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-white/85">
                  All Play: everyone except {turnPlayerName} answers this card.
                </p>
                <p className="mt-3 text-lg text-white">
                  {activeCard?.text || "No active card found."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {allPlayResponders.map((player) => (
                    <Badge
                      key={player.id}
                      variant={
                        badChoicesState.allPlayAnswersByPlayerId[player.id]
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {player.name}:{" "}
                      {badChoicesState.allPlayAnswersByPlayerId[player.id]
                        ? "Answered"
                        : "Waiting"}
                    </Badge>
                  ))}
                </div>

                {actualPlayer &&
                actualPlayer !== turnPlayerId &&
                !iAlreadyAnsweredAllPlay ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={badChoicesAnswer.isPending}
                      onClick={() =>
                        badChoicesAnswer.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer,
                          answer: "YES",
                        })
                      }
                    >
                      Yes
                    </Button>
                    <Button
                      className="bg-rose-600 hover:bg-rose-700"
                      disabled={badChoicesAnswer.isPending}
                      onClick={() =>
                        badChoicesAnswer.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer,
                          answer: "NO",
                        })
                      }
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-white/75">
                    {actualPlayer === turnPlayerId
                      ? "Waiting for everyone else to answer."
                      : iAlreadyAnsweredAllPlay
                        ? "Your answer is locked in."
                        : "Waiting for the remaining answers."}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      }

      case "bad-people": {
        const dictatorName =
          players.find((player) => player.id === badPeopleState.dictatorPlayerId)?.name ||
          "Unknown Player";
        const revealedPlayerName =
          players.find((player) => player.id === badPeopleState.revealedPlayerId)?.name ||
          "Unknown Player";
        const isDictator = actualPlayer === badPeopleState.dictatorPlayerId;
        const hasGuessed = actualPlayer
          ? Boolean(badPeopleState.guessesByPlayerId[actualPlayer])
          : false;
        const usedDoubleDown = actualPlayer
          ? badPeopleState.doubleDownUsedPlayerIds.includes(actualPlayer)
          : false;
        const canUseDoubleDown =
          Boolean(actualPlayer) && !isDictator && !hasGuessed && !usedDoubleDown;
        const waitingOnPlayers = players.filter(
          (player) =>
            player.id !== badPeopleState.dictatorPlayerId &&
            !badPeopleState.guessesByPlayerId[player.id],
        );
        const revealedResults = players
          .filter((player) => player.id !== badPeopleState.dictatorPlayerId)
          .map((player) => {
            const guessedPlayerId = badPeopleState.guessesByPlayerId[player.id] || null;
            const guessedPlayerName =
              players.find((entry) => entry.id === guessedPlayerId)?.name || "No guess";
            const usedDoubleDownThisRound =
              badPeopleState.doubleDownActivePlayerIds.includes(player.id);
            const guessedCorrectly =
              guessedPlayerId !== null &&
              guessedPlayerId === badPeopleState.revealedPlayerId;
            return {
              playerId: player.id,
              playerName: player.name,
              guessedPlayerName,
              guessedCorrectly,
              usedDoubleDownThisRound,
              score: guessedCorrectly ? (usedDoubleDownThisRound ? 2 : 1) : 0,
            };
          });

        return (
          <div className="w-full">
            <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Round {badPeopleState.roundNumber}
                </Badge>
                <Badge variant="outline">
                  Dictator: {dictatorName}
                </Badge>
                <Badge variant="outline">
                  First to {badPeopleState.scoreTarget} points
                </Badge>
                <Badge
                  className={
                    badPeopleState.status === "DICTATOR_PICK"
                      ? "bg-amber-600"
                      : badPeopleState.status === "PLAYERS_GUESS"
                        ? "bg-sky-600"
                        : "bg-emerald-600"
                  }
                >
                  {badPeopleState.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <p className="mt-4 text-lg text-white leading-relaxed">
                {currentQuestion?.text ||
                  "No question available. Please wait for the next round."}
              </p>
              <p className="mt-3 text-sm text-white/75">
                The dictator secretly picks who fits the prompt best. Everyone
                else tries to guess that pick. Matching the dictator earns 1
                point, or 2 with your one-time Double Down card.
              </p>
            </div>

            {badPeopleState.status === "DICTATOR_PICK" && (
              <div className="rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
                {isDictator ? (
                  <>
                    <p className="mb-4 text-white/85">
                      Make your secret pick. Everyone else will try to predict it.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {players.map((player) => (
                        <Button
                          key={player.id}
                          onClick={() =>
                            badPeopleDictatorVote.mutate({
                              roomId: room?.id || "",
                              playerId: actualPlayer || "",
                              votedPlayerId: player.id,
                            })
                          }
                          disabled={!actualPlayer || badPeopleDictatorVote.isPending}
                          className="bg-rose-600 hover:bg-rose-700"
                        >
                          Secret pick: {player.name}
                        </Button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-white/80">
                    Waiting for {dictatorName} to make a secret pick.
                  </p>
                )}
              </div>
            )}

            {badPeopleState.status === "PLAYERS_GUESS" && (
              <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
                <div className="rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
                  {isDictator ? (
                    <>
                      <p className="text-white/85">
                        Your secret pick is locked. Waiting for guesses from:
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {waitingOnPlayers.length === 0 ? (
                          <Badge className="bg-emerald-600">Everyone guessed</Badge>
                        ) : (
                          waitingOnPlayers.map((player) => (
                            <Badge key={player.id} variant="secondary">
                              {player.name}
                            </Badge>
                          ))
                        )}
                      </div>
                      {waitingOnPlayers.length === 0 && (
                        <Button
                          className="mt-5 bg-purple-600 hover:bg-purple-700"
                          onClick={() =>
                            badPeopleReveal.mutate({
                              roomId: room?.id || "",
                              playerId: actualPlayer || "",
                            })
                          }
                          disabled={!actualPlayer || badPeopleReveal.isPending}
                        >
                          Reveal Round
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="mb-4 text-white/85">
                        Guess who {dictatorName} secretly picked.
                      </p>
                      {canUseDoubleDown && (
                        <button
                          type="button"
                          onClick={() =>
                            setBadPeopleUseDoubleDown((current) => !current)
                          }
                          className={`mb-4 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                            badPeopleUseDoubleDown
                              ? "border-amber-300 bg-amber-500/20 text-amber-100"
                              : "border-white/20 bg-black/20 text-white/80 hover:bg-white/10"
                          }`}
                        >
                          {badPeopleUseDoubleDown
                            ? "Double Down active: worth 2 points"
                            : "Use Double Down card"}
                        </button>
                      )}
                      {usedDoubleDown && (
                        <p className="mb-4 text-sm text-amber-200">
                          You already used your Double Down card in an earlier round.
                        </p>
                      )}
                      {hasGuessed ? (
                        <p className="text-white/80">
                          Your guess is locked in. Wait for the reveal.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-3 justify-center">
                          {players.map((player) => (
                            <Button
                              key={player.id}
                              onClick={() =>
                                badPeopleGuess.mutate({
                                  roomId: room?.id || "",
                                  playerId: actualPlayer || "",
                                  guessedPlayerId: player.id,
                                  useDoubleDown: badPeopleUseDoubleDown,
                                })
                              }
                              disabled={!actualPlayer || badPeopleGuess.isPending}
                              className="bg-sky-600 hover:bg-sky-700"
                            >
                              Guess: {player.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white">Guess Board</h3>
                  <div className="mt-4 space-y-2">
                    {players
                      .filter((player) => player.id !== badPeopleState.dictatorPlayerId)
                      .map((player) => {
                        const guessed = Boolean(badPeopleState.guessesByPlayerId[player.id]);
                        const doubled = badPeopleState.doubleDownActivePlayerIds.includes(
                          player.id,
                        );
                        return (
                          <div
                            key={player.id}
                            className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                          >
                            <span className="text-white">{player.name}</span>
                            <div className="flex items-center gap-2">
                              {doubled && (
                                <Badge className="bg-amber-600">Double Down</Badge>
                              )}
                              <Badge variant={guessed ? "secondary" : "outline"}>
                                {guessed ? "Guessed" : "Waiting"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {badPeopleState.status === "REVEALED" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-5 text-center backdrop-blur-sm">
                  <p className="text-sm uppercase tracking-[0.2em] text-emerald-200/80">
                    Dictator Pick
                  </p>
                  <p className="mt-3 text-3xl font-extrabold text-white">
                    {revealedPlayerName}
                  </p>
                </div>

                <div className="rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white">Round Results</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {revealedResults.map((result) => (
                      <div
                        key={result.playerId}
                        className={`rounded-xl border p-4 ${
                          result.guessedCorrectly
                            ? "border-emerald-300/30 bg-emerald-500/10"
                            : "border-white/10 bg-black/20"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-white">{result.playerName}</p>
                          <Badge
                            className={
                              result.guessedCorrectly ? "bg-emerald-600" : "bg-zinc-700"
                            }
                          >
                            {result.guessedCorrectly ? `+${result.score}` : "0"}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm text-white/75">
                          Guessed: {result.guessedPlayerName}
                        </p>
                        {result.usedDoubleDownThisRound && (
                          <p className="mt-2 text-sm text-amber-200">
                            Double Down used
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {isDictator ? (
                    <Button
                      className="mt-5 bg-yellow-500 text-white hover:bg-yellow-600"
                      onClick={() =>
                        badPeopleNextRound.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer || "",
                          currentQuestionId:
                            room?.currentQuestionId == null
                              ? ""
                              : String(room.currentQuestionId),
                        })
                      }
                      disabled={!actualPlayer || badPeopleNextRound.isPending}
                    >
                      Next Round
                    </Button>
                  ) : (
                    <p className="mt-5 text-sm text-white/75">
                      Waiting for {dictatorName} to start the next round.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }

      case "paranoia": {
        const isCurrentPlayer = actualPlayer === room?.currentPlayerId;
        const revealedPlayerId = room?.currentAnswer || "";
        const hasVoted = room?.questionAVotes?.includes(actualPlayer) || false;
        const totalVotes = room?.questionAVotes?.length || 0;
        const requiredVotes = Math.max(0, players.length - 1);
        const allVoted = totalVotes >= requiredVotes;
        const voteCounts = (room?.questionBVotes || []).reduce(
          (acc, playerId) => {
            acc[playerId] = (acc[playerId] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
        const sortedVotes = Object.entries(voteCounts).sort(
          (a, b) => b[1] - a[1],
        );
        const revealedPlayerName =
          players.find((player) => player.id === revealedPlayerId)?.name ||
          "Unknown Player";

        return (
          <div className="text-center">
            <div className="text-xl text-emerald-400 mb-4">
              👤 {currentPlayer}&apos;s Turn
            </div>
            <div className="text-2xl mb-6 text-white leading-relaxed">
              {currentQuestion?.text ||
                "No question available. Please wait for the next round."}
            </div>

            {!revealedPlayerId && (
              <>
                <p className="text-lg text-white/80 mb-4">
                  Vote anonymously for who fits this {voteGameName} prompt best.
                </p>
                <p className="text-sm text-white/70 mb-6">
                  Votes in: {totalVotes}/{requiredVotes}
                </p>

                {!isCurrentPlayer && (
                  <div className="flex gap-3 justify-center flex-wrap mb-4">
                    {players
                      .filter((player) => player.id !== room?.currentPlayerId)
                      .map((player) => (
                        <button
                          key={player.id}
                          onClick={() => {
                            paranoiaVote.mutate({
                              roomId: room.id,
                              playerId: actualPlayer,
                              votedPlayerId: player.id,
                            });
                          }}
                          disabled={
                            hasVoted || !actualPlayer || paranoiaVote.isPending
                          }
                          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                        >
                          Select: {player.name}
                        </button>
                      ))}
                  </div>
                )}

                {isCurrentPlayer && !allVoted && (
                  <p className="text-white/70">
                    Waiting for everyone else to vote.
                  </p>
                )}

                {isCurrentPlayer && allVoted && (
                  <button
                    onClick={() => {
                      paranoiaReveal.mutate({
                        roomId: room.id,
                        playerId: actualPlayer,
                      });
                    }}
                    disabled={paranoiaReveal.isPending}
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
                  >
                    Reveal Result
                  </button>
                )}
              </>
            )}

            {revealedPlayerId && (
              <div className="mt-6">
                <div className="text-3xl font-extrabold text-yellow-300 animate-bounce">
                  Revealed: {revealedPlayerName}
                </div>
                <div className="mt-4 text-white/80">
                  Top votes:
                  {sortedVotes.length === 0 && " none"}
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {sortedVotes.slice(0, 5).map(([playerId, count]) => {
                    const playerName =
                      players.find((player) => player.id === playerId)?.name ||
                      "Unknown";
                    return (
                      <Badge key={playerId} variant="secondary">
                        {playerName}: {count}
                      </Badge>
                    );
                  })}
                </div>

                {isCurrentPlayer && (
                  <button
                    onClick={() => {
                      paranoiaNextCard.mutate({
                        roomId: room?.id || "",
                        currentQuestionId:
                          room?.currentQuestionId == null
                            ? ""
                            : String(room.currentQuestionId),
                        currentPlayerId: room?.currentPlayerId ?? "",
                      });
                    }}
                    disabled={paranoiaNextCard.isPending}
                    className="mt-6 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
                  >
                    Next Question
                  </button>
                )}
              </div>
            )}
          </div>
        );
      }

      case "verbal-charades":
        const PlayerOne = room?.playerOneId
          ? players.find((p) => p.id === room.playerOneId)?.name ||
            "Unknown Player"
          : "No player selected";
        const PlayerTwo = room?.playerTwoId
          ? players.find((p) => p.id === room.playerTwoId)?.name ||
            "Unknown Player"
          : "No player selected";
        return (
          <PartyGameLayout
            gameCode="verbal-charades"
            eyebrow="Verbal Charades"
            title={currentQuestion?.text || "No question available. Please wait for the next round."}
            subtitle="One player acts it out, one player guesses, and the timer keeps the pressure on."
            actionSummary={
              isRunning
                ? `${PlayerOne} is performing while ${PlayerTwo} tries to land the guess.`
                : timeLeft === 0
                  ? "Timer ended. Judge the round."
                  : "Round is staged and ready to start."
            }
            actionHint="Keep the pair, timer, and resolution controls visible like a single table flow."
            metrics={[
              { label: "Actor", value: PlayerOne, hint: "Player one", tone: "accent" },
              { label: "Guesser", value: PlayerTwo, hint: "Player two" },
              { label: "Clock", value: formatTime(timeLeft), hint: "Live timer", tone: "warning" },
            ]}
          >
            <div className="text-xl text-emerald-400 mb-4">
              👤 {PlayerOne} ➕ {PlayerTwo} {"📒"}
            </div>
            {actualPlayer === room?.playerOneId && (
              <div className="text-6xl mb-6 text-white font-bold">
                {formatTime(timeLeft)}
              </div>
            )}
            {actualPlayer === room?.playerTwoId ? (
              <p className="text-lg text-white/80 mb-6">
                Dont let the drink catch up to you now 🍻
              </p>
            ) : (
              !isRunning && (
                <p className="text-lg text-white/80 mb-6">
                  {currentQuestion?.text ||
                    "No question available. Please wait for the next round."}
                </p>
              )
            )}
            {actualPlayer === room?.playerOneId && timeLeft !== 0 && (
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleStop}
                  disabled={!isRunning}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Stop ⏰
                </button>
                <button
                  onClick={() => handleStart()}
                  disabled={isRunning || timeLeft === 0}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Start ⏰
                </button>
              </div>
            )}
            {actualPlayer === room?.playerOneId &&
              timeLeft === 0 &&
              !clicked && (
                <div className="flex gap-4 justify-center mt-4">
                  <button
                    onClick={() => {
                      nextCharadeCard.mutate({
                        roomId: room.id,
                        result: "INCORRECT",
                        playerOneId: room.playerOneId ?? "",
                        playerTwoId: room.playerTwoId ?? "",
                        currentQuestionId:
                          room.currentQuestionId == null
                            ? ""
                            : String(room.currentQuestionId),
                      });
                      setClicked(true);
                    }}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Failed ❌
                  </button>
                  <button
                    onClick={() => {
                      nextCharadeCard.mutate({
                        roomId: room.id,
                        result: "CORRECT",
                        playerOneId: room.playerOneId ?? "",
                        playerTwoId: room.playerTwoId ?? "",
                        currentQuestionId:
                          room.currentQuestionId == null
                            ? ""
                            : String(room.currentQuestionId),
                      });
                      setClicked(true);
                    }}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Passed ✅
                  </button>
                </div>
              )}
          </PartyGameLayout>
        );

      case "you-laugh-you-drink": {
        const attackerName = room?.playerOneId
          ? players.find((player) => player.id === room.playerOneId)?.name ||
            "Unknown Player"
          : "No player selected";
        const targetName = room?.playerTwoId
          ? players.find((player) => player.id === room.playerTwoId)?.name ||
            "Unknown Player"
          : "No player selected";
        const isAttacker = actualPlayer === room?.playerOneId;
        const isTarget = actualPlayer === room?.playerTwoId;
        const promptTitle = isAttacker
          ? currentQuestion?.text ||
            "No card available. Please wait for the next round."
          : `${attackerName} is trying to make ${targetName} laugh.`;

        return (
          <PartyGameLayout
            gameCode="you-laugh-you-drink"
            eyebrow="You Laugh, You Drink"
            title={promptTitle}
            subtitle="One attacker performs the bit, one target tries not to crack, and the room scores the face-off."
            actionSummary={`${attackerName} is attacking ${targetName}.`}
            actionHint="Attacker resolves the round: laugh means target drinks, stone face means attacker drinks."
            metrics={[
              {
                label: "Attacker",
                value: attackerName,
                hint: "Runs the bit",
                tone: "accent",
              },
              { label: "Target", value: targetName, hint: "Must not laugh" },
              {
                label: "Stakes",
                value: "+1",
                hint: "Point or drink each round",
                tone: "warning",
              },
            ]}
            aside={
              <div className="rounded-[1.5rem] border border-yellow-300/15 bg-yellow-400/10 p-4 text-yellow-50/85 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.24em] opacity-65">
                  Round Rules
                </p>
                <div className="mt-3 space-y-3 text-sm leading-6">
                  <p>
                    If {targetName} laughs: {targetName} drinks +1 and{" "}
                    {attackerName} gets 1 point.
                  </p>
                  <p>
                    If {targetName} stays straight: {targetName} gets 1 point
                    and {attackerName} drinks +1.
                  </p>
                </div>
              </div>
            }
          >
            <div className="w-full max-w-3xl space-y-4 text-center">
              <div className="rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/75">
                {attackerName} vs {targetName}
              </div>

              {isAttacker ? (
                <div className="rounded-3xl border border-amber-300/20 bg-amber-400/10 p-5 text-left text-white shadow-lg">
                  <p className="text-xs uppercase tracking-[0.24em] text-amber-100/80">
                    Your Card
                  </p>
                  <p className="mt-3 text-lg font-semibold leading-7 text-white">
                    {currentQuestion?.text ||
                      "No card available. Please wait for the next round."}
                  </p>
                  <p className="mt-3 text-sm text-white/75">
                    Perform it however you want, watch {targetName}, then lock
                    in the result.
                  </p>
                </div>
              ) : isTarget ? (
                <div className="rounded-3xl border border-rose-300/20 bg-rose-400/10 p-5 text-white shadow-lg">
                  <p className="text-xs uppercase tracking-[0.24em] text-rose-100/80">
                    Hold The Line
                  </p>
                  <p className="mt-3 text-lg font-semibold">
                    {attackerName} is coming for your straight face. No smiling,
                    no cracking.
                  </p>
                </div>
              ) : (
                <div className="rounded-3xl border border-white/15 bg-white/8 p-5 text-white shadow-lg">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                    Watch The Face-Off
                  </p>
                  <p className="mt-3 text-lg font-semibold">
                    {attackerName} is trying to break {targetName}. Keep score
                    honest.
                  </p>
                </div>
              )}

              {isAttacker && !clicked ? (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <PartyStageButton
                    tone="danger"
                    disabled={nextYouLaughYouDrinkCard.isPending}
                    onClick={() => {
                      setClicked(true);
                      nextYouLaughYouDrinkCard.mutate({
                        roomId: room?.id || "",
                        result: "LAUGHED",
                        attackerPlayerId: room?.playerOneId ?? "",
                        targetPlayerId: room?.playerTwoId ?? "",
                        currentQuestionId:
                          room?.currentQuestionId == null
                            ? ""
                            : String(room.currentQuestionId),
                      });
                    }}
                  >
                    They Laughed
                  </PartyStageButton>
                  <PartyStageButton
                    tone="success"
                    disabled={nextYouLaughYouDrinkCard.isPending}
                    onClick={() => {
                      setClicked(true);
                      nextYouLaughYouDrinkCard.mutate({
                        roomId: room?.id || "",
                        result: "STRAIGHT_FACE",
                        attackerPlayerId: room?.playerOneId ?? "",
                        targetPlayerId: room?.playerTwoId ?? "",
                        currentQuestionId:
                          room?.currentQuestionId == null
                            ? ""
                            : String(room.currentQuestionId),
                      });
                    }}
                  >
                    Stone Face
                  </PartyStageButton>
                </div>
              ) : null}
            </div>
          </PartyGameLayout>
        );
      }

      case "taboo-lite":
        const tabooClueGiver = room?.playerOneId
          ? players.find((p) => p.id === room.playerOneId)?.name ||
            "Unknown Player"
          : "No player selected";
        const tabooGuesser = room?.playerTwoId
          ? players.find((p) => p.id === room.playerTwoId)?.name ||
            "Unknown Player"
          : "No player selected";
        const isClueGiver = actualPlayer === room?.playerOneId;
        const isGuesser = actualPlayer === room?.playerTwoId;

        return (
          <div className="text-center">
            <div className="text-xl text-emerald-400 mb-4">
              👤 {tabooClueGiver} ➕ {tabooGuesser} {"🧠"}
            </div>
            {isClueGiver && (
              <div className="text-6xl mb-6 text-white font-bold">
                {formatTime(timeLeft)}
              </div>
            )}
            {isClueGiver ? (
              <div className="mb-6">
                <p className="text-lg text-white/80 mb-2">Target Word</p>
                <p className="text-4xl font-extrabold text-cyan-300 mb-4">
                  {currentQuestion?.text ||
                    "No card available. Please wait for the next one."}
                </p>
                <p className="text-lg text-white/80 mb-2">Forbidden Words</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {tabooForbiddenWords.length > 0 ? (
                    tabooForbiddenWords.map((word) => (
                      <Badge key={word} variant="secondary">
                        {word}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-white/70">No forbidden words</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-lg text-white/80 mb-6">
                {isGuesser
                  ? "Listen to clues and guess the target word before time runs out."
                  : "Watch the round. Only the clue giver can see the card."}
              </p>
            )}

            {isClueGiver && timeLeft !== 0 && (
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleStop}
                  disabled={!isRunning}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Stop ⏰
                </button>
                <button
                  onClick={() => handleStart()}
                  disabled={isRunning || timeLeft === 0}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Start ⏰
                </button>
              </div>
            )}

            {isClueGiver && timeLeft === 0 && !clicked && (
              <div className="flex gap-4 justify-center mt-4">
                <button
                  onClick={() => {
                    nextCharadeCard.mutate({
                      roomId: room.id,
                      result: "INCORRECT",
                      playerOneId: room.playerOneId ?? "",
                      playerTwoId: room.playerTwoId ?? "",
                      currentQuestionId:
                        room.currentQuestionId == null
                          ? ""
                          : String(room.currentQuestionId),
                    });
                    setClicked(true);
                  }}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Failed ❌
                </button>
                <button
                  onClick={() => {
                    nextCharadeCard.mutate({
                      roomId: room.id,
                      result: "CORRECT",
                      playerOneId: room.playerOneId ?? "",
                      playerTwoId: room.playerTwoId ?? "",
                      currentQuestionId:
                        room.currentQuestionId == null
                          ? ""
                          : String(room.currentQuestionId),
                    });
                    setClicked(true);
                  }}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Passed ✅
                </button>
              </div>
            )}
          </div>
        );

      case "catherines-special":
        return (
          <PartyGameLayout
            gameCode="catherines-special"
            eyebrow="Math Head"
            title={currentQuestion?.text || "No question available. Please wait for the next round."}
            subtitle="Race the timer, solve it cleanly, then reveal the answer when the countdown hits zero."
            actionSummary={
              timeLeft === 0
                ? `${currentPlayer} reached the end of the timer and needs to score the round.`
                : `${currentPlayer} is in the mental sprint.`
            }
            actionHint="This mode feels better when the timer and answer reveal share the same card frame."
            metrics={[
              { label: "Turn", value: currentPlayer, hint: "Current solver", tone: "accent" },
              { label: "Clock", value: formatTime(timeLeft), hint: "Round timer", tone: "warning" },
              { label: "Answer", value: timeLeft === 0 || actualPlayer !== room?.currentPlayerId ? "Visible" : "Hidden", hint: "Reveal state" },
            ]}
          >
            <div className="text-xl text-emerald-400 mb-4">
              👤 {currentPlayer}&apos;s Turn
            </div>
            {actualPlayer === room?.currentPlayerId && (
              <div className="text-6xl mb-6 text-white font-bold">
                {formatTime(timeLeft)}
              </div>
            )}
            <p className="text-lg text-white/80 mb-6">
              {currentQuestion?.text ||
                "No question available. Please wait for the next round."}
            </p>
            {((actualPlayer === room?.currentPlayerId && timeLeft === 0) ||
              actualPlayer !== room?.currentPlayerId) && (
              <p className="text-lg text-white/80 mb-6">
                Answer:{" "}
                {currentQuestion?.answer ||
                  "No answer available. Please wait for the next round."}
              </p>
            )}
            {actualPlayer === room?.currentPlayerId && timeLeft !== 0 && (
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleStop}
                  disabled={!isRunning}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Stop ⏰
                </button>
                <button
                  onClick={() => handleStart()}
                  disabled={isRunning || timeLeft === 0}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Start ⏰
                </button>
              </div>
            )}
            {actualPlayer === room?.currentPlayerId &&
              timeLeft === 0 &&
              !clicked && (
                <div className="flex gap-4 justify-center mt-4">
                  <button
                    onClick={() => {
                      nextCatherineCard.mutate({
                        roomId: room.id,
                        result: "INCORRECT",
                        currentPlayerId: room.currentPlayerId ?? "",
                        currentQuestionId:
                          room.currentQuestionId == null
                            ? ""
                            : String(room.currentQuestionId),
                      });
                      setClicked(true);
                    }}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Failed ❌
                  </button>
                  <button
                    onClick={() => {
                      nextCatherineCard.mutate({
                        roomId: room.id,
                        result: "CORRECT",
                        currentPlayerId: room.currentPlayerId ?? "",
                        currentQuestionId:
                          room.currentQuestionId == null
                            ? ""
                            : String(room.currentQuestionId),
                      });
                      setClicked(true);
                    }}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Passed ✅
                  </button>
                </div>
              )}
          </PartyGameLayout>
        );

      case "truth-or-lie": {
        const currentCategory =
          currentQuestion?.text ||
          "No category available. Please wait for the next round.";
        const answerRevealed = Boolean(room?.currentAnswer);
        const hasVoted =
          room?.questionAVotes?.includes(actualPlayer) ||
          room?.questionBVotes?.includes(actualPlayer);
        const isCurrentPlayer = actualPlayer === room?.currentPlayerId;
        const totalVotes =
          (room?.questionAVotes?.length || 0) +
          (room?.questionBVotes?.length || 0);
        const requiredVotes = Math.max(0, players.length - 1);
        const allVoted = totalVotes >= requiredVotes;
        const correctVotes =
          room?.currentAnswer === "TRUTH"
            ? room?.questionAVotes?.length || 0
            : room?.questionBVotes?.length || 0;
        const wrongVotes =
          room?.currentAnswer === "TRUTH"
            ? room?.questionBVotes?.length || 0
            : room?.questionAVotes?.length || 0;
        const playerVotedTruth =
          room?.questionAVotes?.includes(actualPlayer) || false;
        const playerVotedLie =
          room?.questionBVotes?.includes(actualPlayer) || false;
        const playerVoted = playerVotedTruth || playerVotedLie;
        const playerCorrect =
          room?.currentAnswer === "TRUTH" ? playerVotedTruth : playerVotedLie;

        return (
          <PartyGameLayout
            gameCode="truth-or-lie"
            eyebrow="Truth or Lie"
            title={`Card: ${currentCategory}`}
            subtitle="Everyone votes first. The storyteller reveals only after the table commits."
            actionSummary={
              answerRevealed
                ? `${currentPlayer} revealed ${room?.currentAnswer}.`
                : isCurrentPlayer
                  ? `Waiting for votes (${totalVotes}/${requiredVotes}) before the reveal.`
                  : playerVoted
                    ? `${actualPlayerName} locked a ${playerVotedTruth ? "TRUTH" : "LIE"} vote.`
                    : "Voting is live."
            }
            actionHint="Poker-style side state works especially well here because reveal timing matters."
            metrics={[
              { label: "Turn", value: currentPlayer, hint: "Story holder", tone: "accent" },
              { label: "Votes", value: `${totalVotes}/${requiredVotes}`, hint: "Table locked?" },
              { label: "Reveal", value: answerRevealed ? room?.currentAnswer : "Hidden", hint: "Current state", tone: answerRevealed ? "warning" : "success" },
            ]}
          >
            <div className="text-xl text-emerald-400 mb-4">
              👤 {currentPlayer}&apos;s Turn
            </div>

            <div className="text-2xl mb-6 text-white font-bold">
              Card: {currentCategory}
            </div>

            {!answerRevealed && (
              <>
                <div className="flex gap-4 justify-center ">
                  <button
                    onClick={() => {
                      if (isCurrentPlayer) {
                        revealTruthLie.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer || "",
                          answer: "TRUTH",
                        });
                        return;
                      }

                      voteTruthLie.mutate({
                        roomId: room?.id || "",
                        playerId: actualPlayer || "",
                        vote: "TRUTH",
                      });
                    }}
                    disabled={
                      hasVoted ||
                      !actualPlayer ||
                      (isCurrentPlayer && !allVoted)
                    }
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors w-32"
                  >
                    TRUTH
                  </button>
                  <button
                    onClick={() => {
                      if (isCurrentPlayer) {
                        revealTruthLie.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer || "",
                          answer: "LIE",
                        });
                        return;
                      }

                      voteTruthLie.mutate({
                        roomId: room?.id || "",
                        playerId: actualPlayer || "",
                        vote: "LIE",
                      });
                    }}
                    disabled={
                      hasVoted ||
                      !actualPlayer ||
                      (isCurrentPlayer && !allVoted)
                    }
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors w-32"
                  >
                    LIE
                  </button>
                </div>
                {isCurrentPlayer && !allVoted && (
                  <p className="mt-4 text-white/70">
                    Waiting for votes ({totalVotes}/{requiredVotes})
                  </p>
                )}
              </>
            )}

            {answerRevealed && (
              <div className="mt-6">
                <div
                  className={`text-3xl font-extrabold ${
                    playerVoted && !playerCorrect
                      ? "text-red-300"
                      : "text-yellow-300"
                  } animate-bounce`}
                >
                  Answer: {room?.currentAnswer}
                </div>
                <div className="mt-4 text-white/80">
                  Correct: {correctVotes} · Wrong: {wrongVotes}
                </div>

                {isCurrentPlayer && (
                  <button
                    onClick={() => {
                      nextTruthLieCard.mutate({
                        roomId: room?.id || "",
                        currentQuestionId:
                          room?.currentQuestionId == null
                            ? ""
                            : String(room.currentQuestionId),
                        currentPlayerId: room?.currentPlayerId ?? "",
                      });
                    }}
                    className="mt-6 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Next Card
                  </button>
                )}
              </div>
            )}
          </PartyGameLayout>
        );
      }

      case "would-you-rather":
        return (
          <PartyGameLayout
            gameCode="would-you-rather"
            eyebrow="Would You Rather"
            title={currentQuestion?.text || "No question available. Please wait for the next round."}
            subtitle="Force the room to choose a side, then reveal which option won the crowd."
            actionSummary={wouldRatherResult || `Votes are building while ${currentPlayer} drives the round.`}
            actionHint="The side card now keeps the running room verdict visible instead of burying it under the prompt."
            metrics={[
              { label: "Turn", value: currentPlayer, hint: "Current voter", tone: "accent" },
              { label: "Option A", value: room?.questionAVotes.length || 0, hint: "Votes" },
              { label: "Option B", value: room?.questionBVotes.length || 0, hint: "Votes", tone: "warning" },
            ]}
          >
            <div className="text-xl text-pink-400 mb-4">
              {wouldRatherResult}
            </div>
            <div className="text-xl text-emerald-400 mb-4">
              👤 {currentPlayer}&apos;s Turn
            </div>
            <div className="text-2xl mb-6 text-white font-bold">
              {currentQuestion?.text ||
                "No question available. Please wait for the next round."}
            </div>

            {actualPlayer === room?.currentPlayerId &&
              !room.questionAVotes.includes(actualPlayer) &&
              !room.questionBVotes.includes(actualPlayer) &&
              !clicked && (
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      voteQuestion.mutate({
                        roomId: room.id,
                        vote: "A",
                        currentPlayerId: room.currentPlayerId ?? "",
                      });
                      setClicked(true);
                    }}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Rather 🅰️
                  </button>
                  <button
                    onClick={() => {
                      voteQuestion.mutate({
                        roomId: room.id,
                        vote: "B",
                        currentPlayerId: room.currentPlayerId ?? "",
                      });
                      setClicked(true);
                    }}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Rather 🅱️
                  </button>
                </div>
              )}

            {room?.questionAVotes.length + room?.questionBVotes.length >=
              room?.players.length && (
              <button
                onClick={() => {
                  nextWouldRatherQuestion.mutate({
                    gamecode: "would-you-rather",
                    roomId: room.id,
                    currentQuestionId:
                      room.currentQuestionId == null
                        ? ""
                        : String(room.currentQuestionId),
                  });
                  setClicked(true);
                }}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white font-semibold transition-colors mt-4"
              >
                Next Question
              </button>
            )}
          </PartyGameLayout>
        );

      case "triviyay":
        return (
          <PartyGameLayout
            gameCode="triviyay"
            eyebrow="TriviYay"
            title={currentQuestion?.text || "No question available. Please wait for the next round."}
            subtitle="Category card up front, team judgment controls below, same table cadence as Poker."
            actionSummary={
              clicked
                ? "Winning teams are locked in for this category."
                : `Team ${room?.currentPlayerId || "?"} is judging the current category.`
            }
            actionHint="This is now framed like a scoreboard decision, not a loose admin action."
            metrics={[
              { label: "Judging Team", value: room?.currentPlayerId || "-", hint: "Current lead", tone: "accent" },
              { label: "Teams", value: teams.length, hint: "In rotation" },
              { label: "Round", value: room?.currentRound || 1, hint: "Category count", tone: "warning" },
            ]}
          >
            <div className="text-xl text-emerald-400 mb-4">
              👤 {room?.currentPlayerId}&apos;s Turn
            </div>
            <div className="text-2xl mb-6 text-white font-semibold mt-4">
              Category:{" "}
              {currentQuestion?.text ||
                "No question available. Please wait for the next round."}
            </div>
            {actualPlayer === currentTeamLeaderId() && !clicked && (
              <>
                <div className="my-4 ">Select Winning Teams</div>
                {teams.length > 0 && (
                  <div className="flex flex-wrap gap-3 my-4 justify-center">
                    {[...teams, "FORFEIT"]
                      ?.filter((team) => team !== room?.currentPlayerId)
                      .map((team) => (
                        <div
                          onClick={() => SelectedOption({ option: team })}
                          key={team}
                          className={`flex items-center gap-2  rounded-full px-4 py-2 ${OptionsColors(team)}  cursor-pointer hover:scale-105 transition-transform duration-300 ease-in-out`}
                        >
                          <span>{team}</span>
                        </div>
                      ))}
                  </div>
                )}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      nextCardCategory.mutate({
                        roomId: room.id,
                        currentPlayingTeam: room.currentPlayerId ?? "",
                        winningTeams: winningTeams,
                        forefit: forfited,
                        currentQuestionId:
                          room.currentQuestionId == null
                            ? ""
                            : String(room.currentQuestionId),
                      });
                      setClicked(true);
                      setWinningTeams([]);
                      setForfited(false);
                    }}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Next Category
                  </button>
                </div>
              </>
            )}
          </PartyGameLayout>
        );

      case "guess-the-number": {
        const numberGroups: { start: number; end: number; values: number[] }[] =
          [];
        for (
          let start = guessNumberState.minValue;
          start <= guessNumberState.maxValue;
          start += 20
        ) {
          const end = Math.min(start + 19, guessNumberState.maxValue);
          numberGroups.push({
            start,
            end,
            values: Array.from(
              { length: end - start + 1 },
              (_, index) => start + index,
            ),
          });
        }

        const targetPlayerId = room?.currentPlayerId || "";
        const targetPlayerName =
          players.find((player) => player.id === targetPlayerId)?.name ||
          "Unknown";
        const isTargetPlayer = actualPlayer === targetPlayerId;
        const allNumbersSet =
          players.length > 1 &&
          players.every(
            (player) => guessNumberState.playerNumbers[player.id] !== null,
          );
        const mySecretNumber = actualPlayer
          ? guessNumberState.playerNumbers[actualPlayer]
          : null;
        const currentTargetNumberSet =
          targetPlayerId &&
          guessNumberState.playerNumbers[targetPlayerId] !== null;
        const guessers = players.filter(
          (player) => player.id !== targetPlayerId,
        );
        const myCurrentGuess = actualPlayer
          ? guessNumberState.currentRoundGuesses[actualPlayer]
          : undefined;
        const myDiscoveries = actualPlayer
          ? guessNumberState.playerDiscoveries[actualPlayer] || []
          : [];
        const targetDiscoveriesToWin = Math.max(players.length - 1, 1);
        const winnerName = guessNumberState.winnerPlayerId
          ? players.find(
              (player) => player.id === guessNumberState.winnerPlayerId,
            )?.name || "Unknown"
          : null;
        const winnerTargetName = guessNumberState.winnerTargetPlayerId
          ? players.find(
              (player) => player.id === guessNumberState.winnerTargetPlayerId,
            )?.name || "Unknown"
          : null;

        const toDisplayFeedback = (feedback: GuessTheNumberFeedback) => {
          if (feedback === "UP") return "⬆️ Go Higher";
          if (feedback === "DOWN") return "⬇️ Go Lower";
          if (feedback === "CORRECT") return "✅ Correct";
          return "⏳ Waiting";
        };

        return (
          <div className="w-full">
            <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Status: {guessNumberState.status}
                </Badge>
                <Badge variant="outline">
                  Range: {guessNumberState.minValue}-{guessNumberState.maxValue}
                </Badge>
                <Badge variant="outline">Target: {targetPlayerName}</Badge>
                {actualPlayer && (
                  <Badge variant="outline">
                    Found: {myDiscoveries.length}/{targetDiscoveriesToWin}
                  </Badge>
                )}
                {winnerName && (
                  <Badge className="bg-emerald-600">Winner: {winnerName}</Badge>
                )}
              </div>

              {!allNumbersSet && (
                <p className="mt-3 text-sm text-amber-200">
                  Waiting for all players to set their secret number.
                </p>
              )}
              {guessNumberState.status === "PLAYING" && (
                <p className="mt-3 text-sm text-white/90">
                  Everyone guesses {targetPlayerName}&apos;s number once. Hint
                  is automatic and turn rotates automatically after all players
                  guessed.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="space-y-4">
                {mySecretNumber === null || mySecretNumber === undefined ? (
                  <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold mb-3">
                      Your Secret Number
                    </h3>
                    <p className="mb-3 text-sm text-white/80">
                      Tap a range row, then tap a number card to save.
                    </p>
                    <div className="space-y-2">
                      {numberGroups.map((group) => {
                        const isExpanded =
                          secretPickerOpenStart === group.start;
                        return (
                          <div
                            key={`secret-${group.start}-${group.end}`}
                            className="rounded-lg border border-white/20 bg-black/20"
                          >
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                setSecretPickerOpenStart(
                                  isExpanded ? null : group.start,
                                )
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  setSecretPickerOpenStart(
                                    isExpanded ? null : group.start,
                                  );
                                }
                              }}
                              className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm font-semibold transition hover:bg-white/10"
                            >
                              <span>
                                {group.start}-{group.end}
                              </span>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform duration-200 ${
                                  isExpanded ? "rotate-180" : "rotate-0"
                                }`}
                              />
                            </div>
                            {isExpanded && (
                              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 border-t border-white/15 p-3">
                                {group.values.map((value) => (
                                  <button
                                    key={`secret-value-${value}`}
                                    onClick={() => {
                                      if (!actualPlayer) {
                                        toast.error(
                                          "Select your player first.",
                                        );
                                        return;
                                      }
                                      guessNumberSetPlayerNumber.mutate({
                                        roomId: room?.id || "",
                                        playerId: actualPlayer,
                                        number: value,
                                      });
                                    }}
                                    disabled={
                                      !actualPlayer ||
                                      guessNumberSetPlayerNumber.isPending ||
                                      guessNumberState.status === "ENDED"
                                    }
                                    className={`rounded-md border px-2 py-2 text-sm font-semibold transition ${
                                      mySecretNumber === value
                                        ? "border-emerald-300 bg-emerald-500/30 text-emerald-100"
                                        : "border-white/20 bg-slate-900/70 text-white hover:scale-[1.02] hover:bg-slate-800"
                                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                                  >
                                    {value}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {!actualPlayer && (
                      <p className="mt-2 text-sm text-amber-200">
                        Select your player first.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-4 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold mb-2">
                      Your Secret Number
                    </h3>
                    <div className="text-4xl font-extrabold text-emerald-200">
                      {mySecretNumber}
                    </div>
                    <p className="mt-2 text-sm text-emerald-100/90">
                      Keep this number private.
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-3">Current Round</h3>

                  {!isTargetPlayer && guessNumberState.status === "PLAYING" && (
                    <div className="space-y-3">
                      <p className="text-sm text-white/80">
                        Pick one number card to guess {targetPlayerName}
                        &apos;s number.
                      </p>
                      <div className="space-y-2">
                        {numberGroups.map((group) => {
                          const isExpanded =
                            guessPickerOpenStart === group.start;
                          return (
                            <div
                              key={`guess-${group.start}-${group.end}`}
                              className="rounded-lg border border-white/20 bg-black/20"
                            >
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                  setGuessPickerOpenStart(
                                    isExpanded ? null : group.start,
                                  )
                                }
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  ) {
                                    event.preventDefault();
                                    setGuessPickerOpenStart(
                                      isExpanded ? null : group.start,
                                    );
                                  }
                                }}
                                className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm font-semibold transition hover:bg-white/10"
                              >
                                <span>
                                  {group.start}-{group.end}
                                </span>
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform duration-200 ${
                                    isExpanded ? "rotate-180" : "rotate-0"
                                  }`}
                                />
                              </div>
                              {isExpanded && (
                                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 border-t border-white/15 p-3">
                                  {group.values.map((value) => (
                                    <button
                                      key={`guess-value-${value}`}
                                      onClick={() => {
                                        guessNumberSubmitGuess.mutate({
                                          roomId: room?.id || "",
                                          playerId: actualPlayer || "",
                                          guess: value,
                                        });
                                      }}
                                      disabled={
                                        !actualPlayer ||
                                        !allNumbersSet ||
                                        !currentTargetNumberSet ||
                                        targetPlayerId === actualPlayer ||
                                        Boolean(myCurrentGuess) ||
                                        guessNumberSubmitGuess.isPending
                                      }
                                      className={`rounded-md border px-2 py-2 text-sm font-semibold transition ${
                                        myCurrentGuess?.guess === value
                                          ? "border-cyan-300 bg-cyan-500/30 text-cyan-100"
                                          : "border-white/20 bg-slate-900/70 text-white hover:scale-[1.02] hover:bg-slate-800"
                                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                                    >
                                      {value}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {myCurrentGuess && (
                        <p className="text-sm text-white/90">
                          Your guess:{" "}
                          <span className="font-semibold">
                            {myCurrentGuess.guess}
                          </span>{" "}
                          - {toDisplayFeedback(myCurrentGuess.feedback)}
                        </p>
                      )}
                    </div>
                  )}

                  {isTargetPlayer && guessNumberState.status === "PLAYING" && (
                    <div className="space-y-3">
                      <p className="text-sm text-white/90">
                        Other players are guessing your number. The app gives
                        automatic hints and rotates round automatically.
                      </p>
                    </div>
                  )}

                  {guessNumberState.status === "ENDED" && (
                    <div className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 p-3 text-emerald-100">
                      <p className="font-semibold">
                        Winner: {winnerName || "Unknown"}
                      </p>
                      {winnerTargetName && (
                        <p className="text-sm mt-1">
                          Final number found: {winnerTargetName}&apos;s.
                        </p>
                      )}
                      <p className="text-sm mt-1">
                        Win condition: find all other players&apos; numbers.
                      </p>
                      <p className="text-sm mt-1">
                        Controls are locked. End the room manually when ready.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-3">Round Guesses</h3>
                  <div className="space-y-2">
                    {guessers.map((player) => {
                      const entry =
                        guessNumberState.currentRoundGuesses[player.id];
                      return (
                        <div
                          key={player.id}
                          className="rounded-md border border-white/15 bg-black/20 px-3 py-2 text-sm"
                        >
                          <div className="font-semibold">{player.name}</div>
                          <div className="text-white/90">
                            {entry
                              ? `${entry.guess} - ${toDisplayFeedback(
                                  entry.feedback,
                                )}`
                              : "No guess yet"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-3">
                    Previous Rounds
                  </h3>
                  <div className="max-h-80 overflow-auto space-y-3 pr-1">
                    {guessNumberState.roundHistory.length === 0 && (
                      <p className="text-sm text-white/70">
                        No completed rounds yet.
                      </p>
                    )}
                    {[...guessNumberState.roundHistory]
                      .reverse()
                      .map((round, index) => {
                        const roundTargetName =
                          players.find(
                            (player) => player.id === round.targetPlayerId,
                          )?.name || "Unknown";
                        return (
                          <div
                            key={`${round.targetPlayerId}-${index}`}
                            className="rounded-md border border-white/15 bg-black/20 p-3"
                          >
                            <div className="mb-2 text-sm font-semibold">
                              Target: {roundTargetName}
                            </div>
                            <div className="space-y-1 text-xs text-white/90">
                              {round.entries.map((entry) => {
                                const guesserName =
                                  players.find(
                                    (player) =>
                                      player.id === entry.guesserPlayerId,
                                  )?.name || "Unknown";
                                return (
                                  <div
                                    key={`${entry.guesserPlayerId}-${entry.guess}`}
                                  >
                                    {guesserName}: {entry.guess} -{" "}
                                    {toDisplayFeedback(entry.feedback)}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "joker-loop": {
        const giverId = jokerLoopState.activeGiverPlayerId;
        const pickerId = jokerLoopState.activePickerPlayerId;
        const giverName =
          players.find((player) => player.id === giverId)?.name || "Unknown";
        const pickerName =
          players.find((player) => player.id === pickerId)?.name || "Unknown";
        const jokerHolderName =
          players.find(
            (player) => player.id === jokerLoopState.jokerHolderPlayerId,
          )?.name || "Unknown";
        const isGiver = actualPlayer === giverId;
        const isPicker = actualPlayer === pickerId;
        const giverHand = giverId
          ? (jokerLoopState.handsByPlayerId[giverId] ?? [])
          : [];
        const myHand = actualPlayer
          ? (jokerLoopState.handsByPlayerId[actualPlayer] ?? [])
          : [];
        const activeGiverReady = giverId
          ? Boolean(jokerLoopState.readyByPlayerId[giverId])
          : false;
        const drawProgress = `${jokerLoopState.drawnThisRoundPlayerIds.length}/${jokerLoopState.roundParticipantIds.length}`;
        const hiddenCardCount = giverHand.length;

        return (
          <div className="w-full space-y-4">
            <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  Round: {jokerLoopState.roundNumber}
                </Badge>
                <Badge variant="outline">
                  Phase: {jokerLoopState.phase.replaceAll("_", " ")}
                </Badge>
                <Badge variant="outline">Draws done: {drawProgress}</Badge>
                <Badge variant="outline">Joker holder: {jokerHolderName}</Badge>
              </div>
              {giverId && pickerId && (
                <p className="mt-3 text-sm text-white/90">
                  Giver: <span className="font-semibold">{giverName}</span> to
                  Picker: <span className="font-semibold">{pickerName}</span>
                </p>
              )}
              {jokerLoopState.status === "ENDED" && (
                <p className="mt-2 text-sm text-amber-200">
                  Game ended. {jokerHolderName} is left with the Joker and
                  drinks +1.
                </p>
              )}
              {jokerLoopState.lastRoundClearedPlayerIds.length > 0 && (
                <p className="mt-2 text-sm text-emerald-200">
                  Last round cleared:{" "}
                  {jokerLoopState.lastRoundClearedPlayerIds
                    .map(
                      (playerId) =>
                        players.find((player) => player.id === playerId)
                          ?.name || "Unknown",
                    )
                    .join(", ")}
                </p>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <h3 className="mb-3 text-lg font-semibold">Your Hand</h3>
                {!actualPlayer && (
                  <p className="text-sm text-amber-200">
                    Select your player first.
                  </p>
                )}
                {actualPlayer && myHand.length === 0 && (
                  <p className="text-sm text-white/80">
                    You are out for now (no cards).
                  </p>
                )}
                <div className="space-y-2">
                  {myHand.map((card, index) => {
                    const highlighted =
                      isGiver && jokerLoopHighlightedIndex === index;
                    return (
                      <div
                        key={card.id}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                          highlighted
                            ? "border-cyan-300 bg-cyan-500/20"
                            : "border-white/20 bg-black/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{card.icon}</span>
                          <span className="font-semibold">{card.word}</span>
                        </div>
                        {isGiver && jokerLoopState.phase === "REORDERING" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setJokerLoopHighlightedIndex(index);
                                jokerLoopReorderCard.mutate({
                                  roomId: room?.id || "",
                                  playerId: actualPlayer,
                                  cardId: card.id,
                                  direction: "UP",
                                });
                              }}
                              disabled={
                                index === 0 || jokerLoopReorderCard.isPending
                              }
                            >
                              Up
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setJokerLoopHighlightedIndex(index);
                                jokerLoopReorderCard.mutate({
                                  roomId: room?.id || "",
                                  playerId: actualPlayer,
                                  cardId: card.id,
                                  direction: "DOWN",
                                });
                              }}
                              disabled={
                                index === myHand.length - 1 ||
                                jokerLoopReorderCard.isPending
                              }
                            >
                              Down
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {isGiver && jokerLoopState.phase === "REORDERING" && (
                  <div className="mt-3">
                    <Button
                      onClick={() =>
                        jokerLoopReady.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer,
                        })
                      }
                      disabled={jokerLoopReady.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Ready
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <h3 className="mb-3 text-lg font-semibold">
                  Pick From {giverName}
                </h3>
                {jokerLoopState.phase === "PICKING" ? (
                  <>
                    <p className="mb-3 text-sm text-white/85">
                      Picker sees hidden cards only. Giver sees real cards.
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {Array.from({ length: hiddenCardCount }, (_, index) => {
                        const highlighted = jokerLoopHighlightedIndex === index;
                        return (
                          <button
                            key={`hidden-${index}`}
                            type="button"
                            onClick={() => {
                              setJokerLoopHighlightedIndex(index);
                              jokerLoopPickCard.mutate({
                                roomId: room?.id || "",
                                playerId: actualPlayer || "",
                                pickedIndex: index,
                              });
                            }}
                            disabled={
                              !isPicker ||
                              !activeGiverReady ||
                              jokerLoopPickCard.isPending
                            }
                            className={`rounded-lg border px-3 py-4 text-sm font-semibold transition ${
                              highlighted
                                ? "border-cyan-300 bg-cyan-500/20"
                                : "border-white/20 bg-slate-900/70 hover:bg-slate-800"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            Hidden Card {index + 1}
                          </button>
                        );
                      })}
                    </div>
                    {!isPicker && (
                      <p className="mt-3 text-sm text-white/70">
                        Waiting for picker: {pickerName}
                      </p>
                    )}
                    {isPicker && !activeGiverReady && (
                      <p className="mt-3 text-sm text-amber-200">
                        Waiting for {giverName} to click Ready.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-white/80">
                    Hidden pick cards appear here when phase is PICKING.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  jokerLoopNextRound.mutate({
                    roomId: room?.id || "",
                    playerId: actualPlayer || "",
                  })
                }
                disabled={
                  !actualPlayer ||
                  jokerLoopState.phase !== "ROUND_RESOLUTION" ||
                  jokerLoopNextRound.isPending
                }
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Next Round (Remove Pairs)
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  jokerLoopRestart.mutate({
                    roomId: room?.id || "",
                    playerId: actualPlayer || "",
                  })
                }
                disabled={!actualPlayer || jokerLoopRestart.isPending}
              >
                Restart With New Shuffle
              </Button>
            </div>
          </div>
        );
      }

      case "ghost-tears": {
        const currentPlayerName =
          players.find(
            (player) => player.id === ghostTearsState.currentPlayerId,
          )?.name || "Unknown";
        const previousPlayerName =
          players.find(
            (player) => player.id === ghostTearsState.previousPlayerId,
          )?.name || "None";
        const challengerName =
          players.find(
            (player) => player.id === ghostTearsState.challengerPlayerId,
          )?.name || "Unknown";
        const challengedName =
          players.find(
            (player) => player.id === ghostTearsState.challengedPlayerId,
          )?.name || "Unknown";
        const lastLoserName =
          players.find(
            (player) => player.id === ghostTearsState.lastLoserPlayerId,
          )?.name || "None";
        const currentWord = ghostTearsState.letterSequence.join("");
        const isCurrentPlayer =
          actualPlayer === ghostTearsState.currentPlayerId;
        const canJudge =
          ghostTearsState.phase === "AWAITING_JUDGMENT" &&
          actualPlayer === ghostTearsState.challengerPlayerId;

        if (players.length < 2) {
          return (
            <div className="rounded-xl border border-white/20 bg-white/10 p-6 text-center">
              <p className="text-amber-200">
                Ghost Tears needs at least 2 players.
              </p>
            </div>
          );
        }

        return (
          <div className="w-full">
            <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Round: {ghostTearsState.roundNumber}
                </Badge>
                <Badge variant="outline">
                  Phase: {ghostTearsState.phase.replaceAll("_", " ")}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-white/90">
                Current player:{" "}
                <span className="font-semibold text-cyan-200">
                  {currentPlayerName}
                </span>
              </p>
              <p className="text-sm text-white/80">
                Previous player:{" "}
                <span className="font-semibold">{previousPlayerName}</span>
              </p>
              <p className="text-sm text-white/80">
                Current letters:{" "}
                <span className="font-mono text-lg tracking-[0.25em] text-fuchsia-200">
                  {currentWord || "-"}
                </span>
              </p>
              <p className="text-sm text-white/80">
                Last loser:{" "}
                <span className="font-semibold">{lastLoserName}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <h3 className="mb-3 text-lg font-semibold">
                  Choose Next Letter
                </h3>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                  {ghostTearsState.alphabet.map((letter) => (
                    <Button
                      key={letter}
                      type="button"
                      size="sm"
                      onClick={() =>
                        ghostTearsPickLetter.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer || "",
                          letter,
                        })
                      }
                      disabled={
                        !isCurrentPlayer ||
                        ghostTearsState.phase !== "PICKING" ||
                        ghostTearsPickLetter.isPending
                      }
                      className="h-9 bg-cyan-600 hover:bg-cyan-700"
                    >
                      {letter}
                    </Button>
                  ))}
                </div>
              </div>

              {ghostTearsState.phase === "PICKING" && (
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold">
                    Current Player Actions
                  </h3>
                  <p className="mt-2 text-sm text-white/85">
                    Pick a letter, challenge the previous player, or forfeit
                    this round.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button
                      onClick={() =>
                        ghostTearsChallenge.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer || "",
                        })
                      }
                      disabled={
                        !isCurrentPlayer ||
                        !ghostTearsState.previousPlayerId ||
                        ghostTearsChallenge.isPending
                      }
                      variant="secondary"
                    >
                      Challenge Previous
                    </Button>
                    <Button
                      onClick={() =>
                        ghostTearsForfeit.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer || "",
                        })
                      }
                      disabled={!isCurrentPlayer || ghostTearsForfeit.isPending}
                      variant="destructive"
                    >
                      Forfeit Round
                    </Button>
                  </div>
                </div>
              )}

              {ghostTearsState.phase === "AWAITING_JUDGMENT" && (
                <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 p-4">
                  <h3 className="text-lg font-semibold">Challenge Judgment</h3>
                  <p className="mt-2 text-sm text-amber-100">
                    {challengedName} must complete the word. {challengerName}{" "}
                    decides:
                  </p>
                  <p className="mt-1 text-sm text-amber-100/90">
                    Correct: {challengerName} drinks +1, all others +1 point.
                  </p>
                  <p className="text-sm text-amber-100/90">
                    Wrong: {challengedName} drinks +1, all others +1 point.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button
                      onClick={() =>
                        ghostTearsJudge.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer || "",
                          verdict: "CORRECT",
                        })
                      }
                      disabled={!canJudge || ghostTearsJudge.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Correct
                    </Button>
                    <Button
                      onClick={() =>
                        ghostTearsJudge.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer || "",
                          verdict: "WRONG",
                        })
                      }
                      disabled={!canJudge || ghostTearsJudge.isPending}
                      variant="destructive"
                    >
                      Wrong
                    </Button>
                  </div>
                  {!canJudge && (
                    <p className="mt-2 text-sm text-amber-100/85">
                      Waiting for judge: {challengerName}
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <Button
                  onClick={() =>
                    ghostTearsRestart.mutate({
                      roomId: room?.id || "",
                      playerId: actualPlayer || "",
                    })
                  }
                  disabled={!actualPlayer || ghostTearsRestart.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Restart Game
                </Button>
              </div>
            </div>
          </div>
        );
      }

      case "connect-the-letters": {
        const currentPair = connectLettersState.currentPair;
        const playerOneId = currentPair?.[0] ?? "";
        const playerTwoId = currentPair?.[1] ?? "";
        const playerOneName =
          players.find((player) => player.id === playerOneId)?.name ||
          "Player 1";
        const playerTwoName =
          players.find((player) => player.id === playerTwoId)?.name ||
          "Player 2";
        const challengerPlayerName =
          players.find(
            (player) => player.id === connectLettersState.activeChallengerId,
          )?.name || "Unknown";
        const guesserPlayerName =
          players.find(
            (player) => player.id === connectLettersState.activeGuesserId,
          )?.name || "Unknown";
        const winnerPlayerName =
          players.find(
            (player) => player.id === connectLettersState.roundWinnerPlayerId,
          )?.name || "Unknown";
        const loserPlayerName =
          players.find(
            (player) => player.id === connectLettersState.roundLoserPlayerId,
          )?.name || "Unknown";
        const isInCurrentPair =
          Boolean(actualPlayer) && Boolean(currentPair?.includes(actualPlayer));
        const canJudge =
          connectLettersState.phase === "AWAITING_JUDGMENT" &&
          actualPlayer === connectLettersState.activeChallengerId;

        if (players.length < 2) {
          return (
            <div className="rounded-xl border border-white/20 bg-white/10 p-6 text-center">
              <p className="text-amber-200">
                Connect the Letters needs at least 2 players.
              </p>
            </div>
          );
        }

        return (
          <div className="w-full">
            <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Round: {connectLettersState.roundNumber}
                </Badge>
                <Badge variant="outline">
                  Phase: {connectLettersState.phase.replaceAll("_", " ")}
                </Badge>
              </div>
              <div className="mt-4 rounded-lg border border-white/20 bg-black/20 px-4 py-5 text-center">
                <p className="flex items-center justify-center gap-2 sm:gap-4 text-cyan-200 font-extrabold leading-none">
                  <span className="text-3xl sm:text-5xl md:text-6xl">
                    {connectLettersState.startLetter}
                  </span>
                  <span className="text-xl sm:text-4xl md:text-5xl text-white/70 tracking-tight sm:tracking-[0.08em]">
                    _______
                  </span>
                  <span className="text-3xl sm:text-5xl md:text-6xl">
                    {connectLettersState.endLetter}
                  </span>
                </p>
              </div>
              <p className="mt-3 text-sm text-white/85">
                Say a word that starts with{" "}
                <span className="font-semibold">
                  {connectLettersState.startLetter}
                </span>{" "}
                and ends with{" "}
                <span className="font-semibold">
                  {connectLettersState.endLetter}
                </span>
                . Your word must be longer than 4 letters.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
              <div className="space-y-4">
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold">Current Pair</h3>
                  <p className="mt-2 text-white/90">
                    {playerOneName} vs {playerTwoName}
                  </p>
                  <div className="mt-3">
                    <Button
                      onClick={() =>
                        connectLettersRedrawLetters.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer || "",
                        })
                      }
                      disabled={
                        !isInCurrentPair ||
                        connectLettersState.phase === "ROUND_COMPLETE" ||
                        connectLettersRedrawCooldown > 0 ||
                        connectLettersRedrawLetters.isPending
                      }
                      variant="outline"
                      className="border-cyan-300/40 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25"
                    >
                      {connectLettersRedrawCooldown > 0
                        ? `Redraw Letters (${connectLettersRedrawCooldown}s)`
                        : "Redraw Letters"}
                    </Button>
                  </div>
                </div>

                {connectLettersState.phase === "READY" && (
                  <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-4">
                    <p className="text-sm text-cyan-100">
                      First player to click answers first for{" "}
                      {connectLettersTimerDuration} seconds. Opponent judges
                      with ✅/❌.
                    </p>
                    <div className="mt-3">
                      <Button
                        onClick={() => {
                          if (!actualPlayer) {
                            toast.error("Select your player first.");
                            return;
                          }
                          connectLettersBuzz.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer,
                          });
                        }}
                        disabled={
                          !isInCurrentPair ||
                          connectLettersBuzz.isPending ||
                          !currentPair
                        }
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        I Have a Word
                      </Button>
                    </div>
                  </div>
                )}

                {connectLettersState.phase === "TIMER_RUNNING" && (
                  <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 p-4">
                    <p className="text-sm text-amber-100">
                      {guesserPlayerName} is guessing. Judge:{" "}
                      {challengerPlayerName}
                    </p>
                    <div className="mt-3 text-4xl font-extrabold text-amber-200">
                      {connectLettersSecondsLeft}s
                    </div>
                    <div className="mt-3">
                      <Button
                        onClick={() => {
                          if (!actualPlayer) {
                            toast.error("Select your player first.");
                            return;
                          }
                          connectLettersStopTimer.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer,
                          });
                        }}
                        disabled={
                          !isInCurrentPair || connectLettersStopTimer.isPending
                        }
                        variant="secondary"
                      >
                        End Timer
                      </Button>
                    </div>
                  </div>
                )}

                {connectLettersState.phase === "AWAITING_JUDGMENT" && (
                  <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-4">
                    <p className="text-sm text-emerald-100">
                      {challengerPlayerName}, was {guesserPlayerName} right?
                    </p>
                    <p className="mt-2 text-sm text-emerald-100/85">
                      Right: {guesserPlayerName} gets +1 point,{" "}
                      {challengerPlayerName} gets +1 drink.
                    </p>
                    <p className="text-sm text-emerald-100/85">
                      Wrong: {challengerPlayerName} gets +1 point,{" "}
                      {guesserPlayerName} gets +1 drink.
                    </p>
                    <div className="mt-3 flex gap-3">
                      <Button
                        onClick={() =>
                          connectLettersJudge.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer || "",
                            verdict: "RIGHT",
                          })
                        }
                        disabled={!canJudge || connectLettersJudge.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        ✅ Right
                      </Button>
                      <Button
                        onClick={() =>
                          connectLettersJudge.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer || "",
                            verdict: "WRONG",
                          })
                        }
                        disabled={!canJudge || connectLettersJudge.isPending}
                        variant="destructive"
                      >
                        ❌ Wrong
                      </Button>
                    </div>
                    {!canJudge && (
                      <p className="mt-2 text-sm text-emerald-100/80">
                        Waiting for judge: {challengerPlayerName}
                      </p>
                    )}
                  </div>
                )}

                {connectLettersState.phase === "ROUND_COMPLETE" && (
                  <div className="rounded-xl border border-purple-300/30 bg-purple-500/10 p-4">
                    <p className="text-sm text-purple-100">
                      Winner: {winnerPlayerName} (+1 point)
                    </p>
                    <p className="text-sm text-purple-100/90">
                      Drink: {loserPlayerName} (+1 drink)
                    </p>
                    <div className="mt-3">
                      <Button
                        onClick={() =>
                          connectLettersNextRound.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer || "",
                          })
                        }
                        disabled={
                          connectLettersNextRound.isPending || !actualPlayer
                        }
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Next Round
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-2">How to Win</h3>
                  <p className="text-sm text-white/85">
                    Click &quot;I Have a Word&quot;, the clicker answers for{" "}
                    {connectLettersTimerDuration} seconds, then the opponent
                    judges with ✅ or ❌.
                  </p>
                  <p className="mt-2 text-sm text-white/85">
                    On ✅: guesser +1 point, challenger +1 drink.
                  </p>
                  <p className="mt-2 text-sm text-white/85">
                    On ❌: timer swaps and the other player must guess.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "memory-chain": {
        const isMyTurn = actualPlayer === room?.currentPlayerId;
        const nextWord = memoryChainSequence[memoryChainState.progress];
        const pendingMissActive = Boolean(
          memoryChainState.pendingMissQuestionId,
        );
        const nextPlayerAfterMissName = memoryChainState.pendingMissNextPlayerId
          ? players.find(
              (player) =>
                player.id === memoryChainState.pendingMissNextPlayerId,
            )?.name || "next player"
          : "next player";
        const winnerName = memoryChainState.winnerPlayerId
          ? players.find(
              (player) => player.id === memoryChainState.winnerPlayerId,
            )?.name || "Unknown"
          : "";

        return (
          <div className="w-full">
            <div className="mb-4 sm:mb-6 rounded-xl border border-white/20 bg-white/10 p-3 sm:p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Progress: {memoryChainState.progress}/
                  {memoryChainSequence.length || 12}
                </Badge>
                <Badge variant="outline">Turn: {currentPlayer}</Badge>
                {memoryChainState.status === "ENDED" && (
                  <Badge className="bg-emerald-600">Winner: {winnerName}</Badge>
                )}
              </div>
              {memoryChainState.status === "PLAYING" && (
                <p className="mt-3 text-sm sm:text-base text-white/90">
                  Next word:{" "}
                  <span className="font-bold text-cyan-300">
                    {nextWord?.text || "Loading..."}
                  </span>
                </p>
              )}
              {pendingMissActive && (
                <p className="mt-2 text-sm text-red-300">
                  Wrong card is revealed. Click Next Player to continue turn to{" "}
                  {nextPlayerAfterMissName}.
                </p>
              )}
              {!isMyTurn && memoryChainState.status === "PLAYING" && (
                <p className="mt-2 text-sm text-amber-300">
                  Waiting for {currentPlayer} to pick the next card.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="rounded-xl border border-white/20 bg-white/10 p-2 sm:p-3 backdrop-blur-sm">
                <div className="grid grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2">
                  {memoryChainBoard.map((card) => {
                    const isMissCard =
                      memoryChainState.pendingMissQuestionId === card.id &&
                      pendingMissActive;
                    const isRevealed = card.revealed || isMissCard;
                    return (
                      <button
                        key={card.id}
                        onClick={() => {
                          if (pendingMissActive) {
                            toast.error("Wait for reset to finish.");
                            return;
                          }
                          if (!isMyTurn) {
                            toast.error("It is not your turn.");
                            return;
                          }
                          memoryChainGuess.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer || "",
                            questionId: card.id,
                          });
                        }}
                        disabled={
                          memoryChainState.status !== "PLAYING" ||
                          pendingMissActive ||
                          memoryChainGuess.isPending
                        }
                        className={`min-h-18 sm:min-h-24 rounded-md border p-1.5 sm:p-2 text-center text-[11px] sm:text-sm font-semibold transition whitespace-normal break-words leading-tight overflow-hidden ${
                          isMissCard
                            ? "bg-red-500/80 border-red-200 text-white"
                            : isRevealed
                              ? "bg-emerald-500/80 border-emerald-200 text-white"
                              : "bg-slate-900/70 border-white/20 text-white hover:scale-[1.02]"
                        }`}
                      >
                        {isRevealed ? card.text : "Hidden"}
                      </button>
                    );
                  })}
                </div>
                {pendingMissActive && isMyTurn && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      onClick={() =>
                        memoryChainNextPlayer.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer || "",
                        })
                      }
                      disabled={memoryChainNextPlayer.isPending}
                      className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600"
                    >
                      Next Player
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 p-3 sm:p-4 backdrop-blur-sm">
                <h3 className="text-base sm:text-lg font-semibold mb-3">
                  Word Order
                </h3>
                <div className="max-h-64 sm:max-h-96 overflow-auto space-y-2 pr-1">
                  {memoryChainSequence.map((item, index) => {
                    const isDone = index < memoryChainState.progress;
                    const isCurrent = index === memoryChainState.progress;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-md px-3 py-2 text-xs sm:text-sm ${
                          isDone
                            ? "bg-emerald-600/40 border border-emerald-300/40"
                            : isCurrent
                              ? "bg-cyan-600/30 border border-cyan-300/40"
                              : "bg-black/20 border border-white/10"
                        }`}
                      >
                        {index + 1}. {item.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "uno": {
        return (
          <UnoRoom
            actualPlayer={actualPlayer || ""}
            onDrawCard={() =>
              unoDrawCard.mutate({
                roomId: room?.id || "",
                playerId: actualPlayer || "",
              })
            }
            onPassTurn={() =>
              unoPassTurn.mutate({
                roomId: room?.id || "",
                playerId: actualPlayer || "",
              })
            }
            onPlayCard={(cardId, chosenColor) =>
              unoPlayCard.mutate({
                roomId: room?.id || "",
                playerId: actualPlayer || "",
                cardId,
                ...(chosenColor ? { chosenColor } : {}),
              })
            }
            onStartRound={() =>
              unoStart.mutate({
                roomId: room?.id || "",
                playerId: actualPlayer || "",
              })
            }
            players={players.map((player) => ({
              id: player.id,
              name: player.name,
            }))}
            pendingWildCardId={unoPendingWildCardId}
            roomId={room?.id || ""}
            setPendingWildCardId={unoSetPendingWildCardId}
            startPending={unoStart.isPending}
            turnActionPending={
              unoPlayCard.isPending || unoDrawCard.isPending || unoPassTurn.isPending
            }
            unoState={unoState}
          />
        );
      }

      case "poker": {
        return (
          <PokerRoom
            actualPlayer={actualPlayer || ""}
            getBlackjackCardClasses={getBlackjackCardClasses}
            getBlackjackCardLabel={getBlackjackCardLabel}
            onPokerBet={(amount) =>
              pokerBet.mutate({
                roomId: room?.id || "",
                playerId: actualPlayer || "",
                amount,
              })
            }
            onPokerCall={() =>
              pokerCall.mutate({
                roomId: room?.id || "",
                playerId: actualPlayer || "",
              })
            }
            onPokerFold={() =>
              pokerFold.mutate({
                roomId: room?.id || "",
                playerId: actualPlayer || "",
              })
            }
            onPokerNextRound={() =>
              pokerNextRound.mutate({
                roomId: room?.id || "",
                playerId: actualPlayer || "",
              })
            }
            onToggleHandRankings={() =>
              setShowPokerHandRankings((open) => !open)
            }
            onTogglePokerBetPicker={() =>
              setPokerBetPickerOpen((open) => !open)
            }
            players={players.map((player) => ({
              id: player.id,
              name: player.name,
            }))}
            pokerBetDraft={pokerBetDraft}
            pokerBetPickerOpen={pokerBetPickerOpen}
            pokerBetPending={pokerBet.isPending}
            pokerCallPending={pokerCall.isPending}
            pokerFoldPending={pokerFold.isPending}
            pokerNextRoundPending={pokerNextRound.isPending}
            pokerState={pokerState}
            setPokerBetDraft={setPokerBetDraft}
            setPokerBetPickerOpen={setPokerBetPickerOpen}
            showPokerHandRankings={showPokerHandRankings}
          />
        );
      }

      case "blackjack": {
        const isBlackjackPlayerTurns = blackjackState.phase === "PLAYER_TURNS";
        const isBlackjackRoundResult = blackjackState.phase === "ROUND_RESULT";
        const isDealerRevealPending =
          blackjackDealerRevealPending && !blackjackState.hiddenDealerCard;
        const isDealerEffectivelyHidden =
          blackjackState.hiddenDealerCard || isDealerRevealPending;
        const shouldKeepDealerPartiallyHidden =
          players.length > 1 && isBlackjackPlayerTurns;
        const dealerCards = shouldKeepDealerPartiallyHidden
          ? Array.from({
              length: Math.max(blackjackState.dealerHand.length, 2),
            }).map((_, index) =>
              index === 0 ? (blackjackState.dealerHand[0] ?? null) : null,
            )
          : isDealerEffectivelyHidden
            ? blackjackState.dealerHand.map((card, index) =>
                index === 1 ? null : card,
              )
            : blackjackState.dealerHand;
        const dealerVisibleTotal = shouldKeepDealerPartiallyHidden
          ? getBlackjackHandTotal(
              blackjackState.dealerHand.length > 0
                ? [blackjackState.dealerHand[0]]
                : [],
            )
          : isDealerEffectivelyHidden
            ? getBlackjackHandTotal(
                blackjackState.dealerHand.length > 0
                  ? [blackjackState.dealerHand[0]]
                  : [],
              )
            : getBlackjackHandTotal(blackjackState.dealerHand);
        const isMyTurn = actualPlayer === blackjackState.currentPlayerId;
        const myHand = actualPlayer
          ? (blackjackState.handsByPlayerId[actualPlayer] ?? [])
          : [];
        const currentTurnName = blackjackState.currentPlayerId
          ? players.find(
              (player) => player.id === blackjackState.currentPlayerId,
            )?.name || "Player"
          : "Dealer";
        const blackjackWinners = blackjackState.playerOrder.filter(
          (playerId) => {
            const result = blackjackState.resultByPlayerId[playerId];
            return result === "BLACKJACK" || result === "WIN";
          },
        );
        const blackjackLosers = blackjackState.playerOrder.filter(
          (playerId) => {
            const result = blackjackState.resultByPlayerId[playerId];
            return result === "LOSE" || result === "BUST";
          },
        );
        const blackjackPushes = blackjackState.playerOrder.filter(
          (playerId) => blackjackState.resultByPlayerId[playerId] === "PUSH",
        );
        const formatBlackjackPlayerNames = (playerIds: string[]) =>
          playerIds
            .map(
              (playerId) =>
                players.find((player) => player.id === playerId)?.name ||
                "Player",
            )
            .join(", ");
        const blackjackRoundExplanation = getBlackjackRoundExplanation({
          dealerHand: blackjackState.dealerHand,
          winners: blackjackWinners,
          losers: blackjackLosers,
          pushes: blackjackPushes,
        });

        return (
          <div className="w-full">
            <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Club className="h-3.5 w-3.5" />
                  Blackjack
                </Badge>
                <Badge variant="outline">
                  Round {blackjackState.roundNumber}
                </Badge>
                <Badge className="bg-emerald-700">
                  Phase: {blackjackState.phase.replaceAll("_", " ")}
                </Badge>
                {blackjackState.currentPlayerId && (
                  <Badge className="bg-cyan-700">Turn: {currentTurnName}</Badge>
                )}
              </div>
              <p className="mt-3 text-sm sm:text-base text-white/90">
                The app is the dealer. Beat the dealer without going over 21.
                Win for +1 point, lose for +1 drink, and pushes are safe.
              </p>
            </div>

            {isBlackjackRoundResult && (
              <div className="mb-6 rounded-2xl border border-cyan-300/20 bg-linear-to-r from-cyan-500/15 via-emerald-500/10 to-slate-900/50 p-4 backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-cyan-700">Round Summary</Badge>
                  <Badge variant="outline">
                    Dealer total:{" "}
                    {getBlackjackHandTotal(blackjackState.dealerHand)}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-emerald-300/25 bg-emerald-500/10 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">
                      Winners
                    </p>
                    <p className="mt-2 text-sm text-emerald-50">
                      {blackjackWinners.length > 0
                        ? formatBlackjackPlayerNames(blackjackWinners)
                        : "No winners this round"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-rose-300/25 bg-rose-500/10 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-rose-200/80">
                      Drinks
                    </p>
                    <p className="mt-2 text-sm text-rose-50">
                      {blackjackLosers.length > 0
                        ? formatBlackjackPlayerNames(blackjackLosers)
                        : "Nobody drinks this round"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-300/25 bg-amber-500/10 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">
                      Pushes
                    </p>
                    <p className="mt-2 text-sm text-amber-50">
                      {blackjackPushes.length > 0
                        ? formatBlackjackPlayerNames(blackjackPushes)
                        : "No pushes this round"}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-cyan-50/90">
                  {blackjackRoundExplanation}
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.15fr_1fr]">
              <div className="space-y-4">
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Dealer
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {dealerCards.map((card, index) => (
                      <div
                        key={`dealer-${index}`}
                        className={`flex h-20 w-16 items-center justify-center rounded-xl border text-sm font-semibold shadow-lg ${getBlackjackCardClasses(
                          card,
                        )}`}
                      >
                        {card ? getBlackjackCardLabel(card) : "Hidden"}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-cyan-200">
                    Total: {dealerVisibleTotal}
                    {shouldKeepDealerPartiallyHidden ||
                    isDealerEffectivelyHidden
                      ? "+"
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    {shouldKeepDealerPartiallyHidden
                      ? "With multiple players, one dealer up-card stays visible and the hole card reveals after everyone has hit or stood."
                      : isDealerRevealPending
                        ? "Dealer reveal incoming..."
                        : "Dealer reveals the hole card, then draws until reaching 17 or more."}
                  </p>
                </div>

                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Your hand
                  </p>
                  {myHand.length === 0 ? (
                    <p className="mt-3 text-sm text-white/70">
                      You joined after the round started. You&apos;ll be dealt
                      in on the next round.
                    </p>
                  ) : (
                    <>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {myHand.map((card, index) => (
                          <div
                            key={`my-${index}-${card.rank}-${card.suit}`}
                            className={`flex h-20 w-16 items-center justify-center rounded-xl border text-sm font-semibold shadow-lg ${getBlackjackCardClasses(
                              card,
                            )}`}
                          >
                            {getBlackjackCardLabel(card)}
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-sm text-emerald-200">
                        Total: {getBlackjackHandTotal(myHand)}
                      </p>
                    </>
                  )}

                  {isBlackjackPlayerTurns && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Button
                        onClick={() =>
                          blackjackHit.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer || "",
                          })
                        }
                        disabled={
                          !isMyTurn ||
                          blackjackHit.isPending ||
                          blackjackStand.isPending ||
                          myHand.length === 0
                        }
                        className="w-full bg-emerald-600 py-6 text-base hover:bg-emerald-700"
                      >
                        Hit
                      </Button>
                      <Button
                        onClick={() =>
                          blackjackStand.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer || "",
                          })
                        }
                        disabled={
                          !isMyTurn ||
                          blackjackHit.isPending ||
                          blackjackStand.isPending ||
                          myHand.length === 0
                        }
                        className="w-full bg-slate-700 py-6 text-base hover:bg-slate-800"
                      >
                        Stand
                      </Button>
                    </div>
                  )}

                  {!isMyTurn && isBlackjackPlayerTurns && (
                    <p className="mt-4 text-sm text-amber-300">
                      Waiting for {currentTurnName}.
                    </p>
                  )}

                  {isBlackjackRoundResult && (
                    <div className="mt-4">
                      <Button
                        onClick={() =>
                          blackjackNextRound.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer || "",
                          })
                        }
                        disabled={blackjackNextRound.isPending || !actualPlayer}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        Deal Next Round
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white">Table</h3>
                  <div className="mt-4 space-y-3">
                    {blackjackState.playerOrder.map((playerId) => {
                      const player = players.find(
                        (item) => item.id === playerId,
                      );
                      const hand =
                        blackjackState.handsByPlayerId[playerId] ?? [];
                      const total =
                        hand.length > 0 ? getBlackjackHandTotal(hand) : 0;
                      const result =
                        blackjackState.resultByPlayerId[playerId] ?? null;
                      const isCurrent =
                        blackjackState.currentPlayerId === playerId;

                      return (
                        <div
                          key={playerId}
                          className={`rounded-xl border p-3 ${
                            result
                              ? "border-emerald-300/30 bg-emerald-500/10"
                              : isCurrent
                                ? "border-cyan-300/30 bg-cyan-500/10"
                                : "border-white/10 bg-black/20"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-white">
                              {player?.name || "Player"}
                            </p>
                            <Badge
                              variant="outline"
                              className={getBlackjackResultBadgeClasses(result)}
                            >
                              {getBlackjackResultLabel(result)}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-white/75">
                            Cards:{" "}
                            {hand.length > 0
                              ? hand.map(getBlackjackCardLabel).join(", ")
                              : "Waiting for next round"}
                          </p>
                          <p className="mt-1 text-sm text-white/75">
                            Total: {hand.length > 0 ? total : "-"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "ride-the-bus": {
        const busRiderName = rideTheBusState.busRiderPlayerId
          ? players.find(
              (player) => player.id === rideTheBusState.busRiderPlayerId,
            )?.name || "Player"
          : "";
        const escapedName = rideTheBusState.escapedPlayerId
          ? players.find(
              (player) => player.id === rideTheBusState.escapedPlayerId,
            )?.name || "Player"
          : "";
        const isMyTurn = actualPlayer === rideTheBusState.currentPlayerId;
        const guessOptions =
          rideTheBusState.activeStep === "COLOR"
            ? ([
                { value: "RED", label: "Red" },
                { value: "BLACK", label: "Black" },
              ] as const)
            : rideTheBusState.activeStep === "HIGHER_LOWER"
              ? ([
                  { value: "HIGHER", label: "Higher" },
                  { value: "LOWER", label: "Lower" },
                ] as const)
              : rideTheBusState.activeStep === "INSIDE_OUTSIDE"
                ? ([
                    { value: "INSIDE", label: "Inside" },
                    { value: "OUTSIDE", label: "Outside" },
                  ] as const)
                : ([
                    { value: "HEARTS", label: "Hearts" },
                    { value: "DIAMONDS", label: "Diamonds" },
                    { value: "CLUBS", label: "Clubs" },
                    { value: "SPADES", label: "Spades" },
                  ] as const);
        const currentTurnName = rideTheBusState.currentPlayerId
          ? players.find(
              (player) => player.id === rideTheBusState.currentPlayerId,
            )?.name || "Player"
          : "Player";

        return (
          <div className="w-full">
            <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Ride the Bus</Badge>
                <Badge variant="outline">Phase: {rideTheBusState.phase}</Badge>
                <Badge className="bg-cyan-700">
                  {getRideTheBusStepLabel(rideTheBusState.activeStep)}
                </Badge>
                {busRiderName && (
                  <Badge className="bg-amber-600">
                    Bus Rider: {busRiderName}
                  </Badge>
                )}
                {escapedName && (
                  <Badge className="bg-emerald-600">
                    Escaped: {escapedName}
                  </Badge>
                )}
              </div>
              <p className="mt-3 text-sm sm:text-base text-white/90">
                Clear the four-step ladder. Any wrong guess gives you +1 drink
                and sends you back to step 1. After everyone clears the ladder,
                the player with the most resets rides the bus.
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.3fr_1fr]">
              <div className="space-y-4">
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-sm text-cyan-200">
                    Current turn: {currentTurnName}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {getRideTheBusStepLabel(rideTheBusState.activeStep)}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    {["COLOR", "HIGHER_LOWER", "INSIDE_OUTSIDE", "SUIT"].map(
                      (step, index) => {
                        const isComplete =
                          index < rideTheBusState.activeCards.length;
                        const isActive = step === rideTheBusState.activeStep;
                        return (
                          <div
                            key={step}
                            className={`rounded-lg border p-3 text-center ${
                              isComplete
                                ? "border-emerald-300/30 bg-emerald-500/10"
                                : isActive
                                  ? "border-cyan-300/30 bg-cyan-500/10"
                                  : "border-white/10 bg-black/20"
                            }`}
                          >
                            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                              Step {index + 1}
                            </p>
                            <p className="mt-2 text-sm text-white">
                              {step === "COLOR"
                                ? "Color"
                                : step === "HIGHER_LOWER"
                                  ? "High / Low"
                                  : step === "INSIDE_OUTSIDE"
                                    ? "Inside / Outside"
                                    : "Suit"}
                            </p>
                          </div>
                        );
                      },
                    )}
                  </div>

                  <div className="mt-4 rounded-xl border border-dashed border-cyan-300/30 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                      Current run cards
                    </p>
                    {rideTheBusState.activeCards.length === 0 ? (
                      <p className="mt-3 text-sm text-white/70">
                        No cards yet. A wrong guess clears this row and restarts
                        the run.
                      </p>
                    ) : (
                      <div className="mt-3 grid gap-3 sm:grid-cols-4">
                        {rideTheBusState.activeCards.map((card, index) => (
                          <div
                            key={`${card.rank}-${card.suit}-${index}`}
                            className="rounded-lg border border-white/10 bg-white/5 p-3 text-center"
                          >
                            <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                              Card {index + 1}
                            </p>
                            <p className="mt-2 font-semibold text-white">
                              {getRideTheBusCardLabel(card)}
                            </p>
                            <p className="mt-1 text-xs text-white/60">
                              {card.color}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {guessOptions.map((option) => (
                      <Button
                        key={option.value}
                        className="bg-cyan-600 hover:bg-cyan-700"
                        onClick={() =>
                          rideTheBusGuess.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer || "",
                            guess: option.value,
                          })
                        }
                        disabled={
                          !isMyTurn ||
                          !actualPlayer ||
                          rideTheBusGuess.isPending
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  {!actualPlayer && (
                    <p className="mt-3 text-sm text-amber-200">
                      Select your player first.
                    </p>
                  )}
                  {actualPlayer && !isMyTurn && (
                    <p className="mt-3 text-sm text-white/70">
                      Waiting for {currentTurnName} to make a guess.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold">Reset Board</h3>
                  <div className="mt-3 space-y-2">
                    {rideTheBusState.playerOrder.map((playerId) => {
                      const player = players.find(
                        (entry) => entry.id === playerId,
                      );
                      if (!player) return null;
                      const completed =
                        rideTheBusState.completedPlayerIds.includes(playerId);
                      const isRider =
                        rideTheBusState.busRiderPlayerId === playerId;
                      return (
                        <div
                          key={playerId}
                          className="rounded-lg border border-white/10 bg-black/20 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-white">
                              {player.name}
                            </p>
                            <div className="flex items-center gap-2">
                              {completed && (
                                <Badge className="bg-emerald-600">
                                  Cleared
                                </Badge>
                              )}
                              {isRider && (
                                <Badge className="bg-amber-600">
                                  Bus Rider
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-white/75">
                            Resets:{" "}
                            {rideTheBusState.resetsByPlayerId[playerId] ?? 0}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold">Rules</h3>
                  <p className="mt-2 text-sm text-white/85">
                    Step 1 guess red or black, step 2 higher or lower than the
                    first card, step 3 inside or outside the first two cards,
                    and step 4 guess the exact suit.
                  </p>
                  <p className="mt-2 text-sm text-white/85">
                    Any miss gives +1 drink and resets the run to the beginning.
                    After everyone clears the ladder, the highest-reset player
                    rides the bus until they finish a perfect run.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "guess-the-movie": {
        const buzzedPlayerName = guessTheMovieState.buzzedPlayerId
          ? players.find(
              (player) => player.id === guessTheMovieState.buzzedPlayerId,
            )?.name || "Player"
          : "Player";
        const isBuzzedPlayer =
          actualPlayer === guessTheMovieState.buzzedPlayerId;
        const isAnswerVisibleToViewer =
          guessTheMovieState.status === "ROUND_RESULT" ||
          (guessTheMovieState.status === "BUZZED" && !isBuzzedPlayer) ||
          (guessTheMovieState.status === "BUZZED" &&
            guessTheMovieSecondsLeft === 0);
        const pointPlayerNames = players
          .filter((player) =>
            guessTheMovieState.pointPlayerIds.includes(player.id),
          )
          .map((player) => player.name);
        const drinkPlayerNames = players
          .filter((player) =>
            guessTheMovieState.drinkPlayerIds.includes(player.id),
          )
          .map((player) => player.name);
        const selectedCategoryLabel = getMovieCategoryLabel(
          guessTheMovieState.selectedCategory,
        );
        const movieQuestionCategory = getMovieCategoryLabel(
          guessTheMovieQuestion?.edition,
        );

        return (
          <div className="w-full">
            <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Round {guessTheMovieState.roundNumber}
                </Badge>
                <Badge variant="outline">
                  Status: {guessTheMovieState.status.replaceAll("_", " ")}
                </Badge>
                <Badge className="bg-amber-600">{selectedCategoryLabel}</Badge>
                {guessTheMovieState.buzzedPlayerId && (
                  <Badge className="bg-rose-600">
                    Buzzed: {buzzedPlayerName}
                  </Badge>
                )}
              </div>
              <p className="mt-3 text-sm sm:text-base text-white/90">
                First player to buzz gets 5 seconds. Everyone except the buzzing
                player can see the movie answer immediately.
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.35fr_1fr]">
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                  Movie clue
                </p>
                <div className="mt-4 rounded-2xl border border-dashed border-amber-300/40 bg-black/20 px-4 py-8">
                  <div className="flex items-start gap-3">
                    <Film className="mt-1 h-6 w-6 shrink-0 text-amber-200" />
                    <p className="text-lg font-semibold leading-relaxed text-amber-50 sm:text-xl">
                      {guessTheMovieQuestion?.text || "Loading clue..."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                    Question category
                  </p>
                  <p className="mt-2 text-sm text-white/85">
                    {movieQuestionCategory}
                  </p>
                </div>

                {isAnswerVisibleToViewer && (
                  <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/70">
                      Movie answer
                    </p>
                    <p className="mt-2 text-2xl font-bold text-emerald-100">
                      {guessTheMovieQuestion?.answer || "Unknown movie"}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  {guessTheMovieState.status === "READY" && (
                    <>
                      <p className="text-sm text-white/85">
                        Buzz first if you know the movie.
                      </p>
                      <Button
                        className="mt-4 w-full bg-amber-600 hover:bg-amber-700"
                        onClick={() =>
                          guessTheMovieBuzz.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer || "",
                          })
                        }
                        disabled={
                          !actualPlayer ||
                          !guessTheMovieQuestion ||
                          guessTheMovieBuzz.isPending
                        }
                      >
                        I Know the Movie
                      </Button>
                      {!actualPlayer && (
                        <p className="mt-3 text-sm text-amber-200">
                          Select your player first.
                        </p>
                      )}
                    </>
                  )}

                  {guessTheMovieState.status === "BUZZED" && (
                    <>
                      <p className="text-sm text-white/85">
                        {buzzedPlayerName} is answering now.
                      </p>
                      <div className="mt-4 text-center">
                        <div className="text-5xl font-black text-amber-200">
                          {guessTheMovieSecondsLeft}s
                        </div>
                        <p className="mt-2 text-sm text-white/70">
                          The buzzing player confirms right or wrong after the
                          timer ends.
                        </p>
                      </div>

                      {guessTheMovieSecondsLeft === 0 ? (
                        isBuzzedPlayer ? (
                          <div className="mt-4 flex gap-3">
                            <Button
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() =>
                                guessTheMovieJudge.mutate({
                                  roomId: room?.id || "",
                                  playerId: actualPlayer || "",
                                  verdict: "CORRECT",
                                })
                              }
                              disabled={guessTheMovieJudge.isPending}
                            >
                              Correct
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() =>
                                guessTheMovieJudge.mutate({
                                  roomId: room?.id || "",
                                  playerId: actualPlayer || "",
                                  verdict: "WRONG",
                                })
                              }
                              disabled={guessTheMovieJudge.isPending}
                            >
                              Wrong
                            </Button>
                          </div>
                        ) : (
                          <p className="mt-4 text-sm text-white/75">
                            Waiting for {buzzedPlayerName} to confirm whether
                            they were right.
                          </p>
                        )
                      ) : (
                        <p className="mt-4 text-sm text-white/75">
                          {isBuzzedPlayer
                            ? "Everyone else can see the answer. Use the clue and say your answer out loud before time runs out."
                            : `You can already see the answer while ${buzzedPlayerName} thinks.`}
                        </p>
                      )}
                    </>
                  )}

                  {guessTheMovieState.status === "ROUND_RESULT" && (
                    <>
                      <p className="text-sm text-white/85">
                        {guessTheMovieState.verdict === "CORRECT"
                          ? `${buzzedPlayerName} got it right.`
                          : `${buzzedPlayerName} got it wrong.`}
                      </p>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-lg border border-emerald-300/25 bg-emerald-500/10 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/70">
                            Points +1
                          </p>
                          <p className="mt-1 text-sm text-emerald-100">
                            {pointPlayerNames.join(", ") || "None"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-amber-300/25 bg-amber-500/10 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-amber-100/70">
                            Drinks +1
                          </p>
                          <p className="mt-1 text-sm text-amber-100">
                            {drinkPlayerNames.join(", ") || "None"}
                          </p>
                        </div>
                      </div>
                      <Button
                        className="mt-4 w-full bg-sky-600 hover:bg-sky-700"
                        onClick={() =>
                          guessTheMovieNextRound.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer || "",
                          })
                        }
                        disabled={
                          !actualPlayer || guessTheMovieNextRound.isPending
                        }
                      >
                        Next Movie
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outline"
                    className="mt-4 w-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    onClick={() =>
                      guessTheMovieNextRound.mutate({
                        roomId: room?.id || "",
                        playerId: actualPlayer || "",
                      })
                    }
                    disabled={!actualPlayer || guessTheMovieNextRound.isPending}
                  >
                    Skip Movie
                  </Button>
                  {!actualPlayer && (
                    <p className="mt-3 text-sm text-amber-200">
                      Select your player first.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold">Scoring</h3>
                  <p className="mt-2 text-sm text-white/85">
                    On correct: the buzzing player gets +1 point and everyone
                    else gets +1 drink.
                  </p>
                  <p className="mt-2 text-sm text-white/85">
                    On wrong: the buzzing player gets +1 drink and everyone else
                    gets +1 point.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "name-the-song": {
        const songPrompt = parseNameTheSongPrompt(nameTheSongQuestion?.text);
        const buzzedPlayerName = nameTheSongState.buzzedPlayerId
          ? players.find(
              (player) => player.id === nameTheSongState.buzzedPlayerId,
            )?.name || "Player"
          : "Player";
        const maskedSongTitle = songPrompt.title
          ? removeVowels(songPrompt.title)
          : "";
        const isBuzzedPlayer = actualPlayer === nameTheSongState.buzzedPlayerId;
        const isAnswerRevealed =
          nameTheSongState.status === "ROUND_RESULT" ||
          (nameTheSongState.status === "BUZZED" &&
            nameTheSongSecondsLeft === 0);
        const pointPlayerNames = players
          .filter((player) =>
            nameTheSongState.pointPlayerIds.includes(player.id),
          )
          .map((player) => player.name);
        const drinkPlayerNames = players
          .filter((player) =>
            nameTheSongState.drinkPlayerIds.includes(player.id),
          )
          .map((player) => player.name);

        return (
          <div className="w-full">
            <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Round {nameTheSongState.roundNumber}
                </Badge>
                <Badge variant="outline">
                  Status: {nameTheSongState.status.replaceAll("_", " ")}
                </Badge>
                {nameTheSongState.buzzedPlayerId && (
                  <Badge className="bg-amber-600">
                    Buzzed: {buzzedPlayerName}
                  </Badge>
                )}
              </div>
              <p className="mt-3 text-sm sm:text-base text-white/90">
                The song title appears with no vowels. First player to buzz gets
                5 seconds to say the answer out loud.
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.35fr_1fr]">
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                  Song without vowels
                </p>
                <div className="mt-4 rounded-2xl border border-dashed border-cyan-300/40 bg-black/20 px-4 py-8 text-center">
                  <p className="text-3xl font-black tracking-[0.2em] text-cyan-100 sm:text-4xl">
                    {maskedSongTitle || "Loading"}
                  </p>
                </div>

                {isAnswerRevealed && (
                  <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/70">
                      Answer
                    </p>
                    <p className="mt-2 text-2xl font-bold text-emerald-100">
                      {songPrompt.title || "Unknown song"}
                    </p>
                    <p className="mt-2 text-sm text-emerald-100/80">
                      Artist: {songPrompt.artist || "Unknown artist"}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  {nameTheSongState.status === "READY" && (
                    <>
                      <p className="text-sm text-white/85">
                        Whoever knows it first should buzz in.
                      </p>
                      <Button
                        className="mt-4 w-full bg-fuchsia-600 hover:bg-fuchsia-700"
                        onClick={() =>
                          nameTheSongBuzz.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer || "",
                          })
                        }
                        disabled={
                          !actualPlayer ||
                          !nameTheSongQuestion ||
                          nameTheSongBuzz.isPending
                        }
                      >
                        I Know the Song
                      </Button>
                      {!actualPlayer && (
                        <p className="mt-3 text-sm text-amber-200">
                          Select your player first.
                        </p>
                      )}
                    </>
                  )}

                  {nameTheSongState.status === "BUZZED" && (
                    <>
                      <p className="text-sm text-white/85">
                        {buzzedPlayerName} is answering now.
                      </p>
                      <div className="mt-4 text-center">
                        <div className="text-5xl font-black text-amber-200">
                          {nameTheSongSecondsLeft}s
                        </div>
                        <p className="mt-2 text-sm text-white/70">
                          The answer reveals automatically when the timer hits
                          zero.
                        </p>
                      </div>

                      {isAnswerRevealed ? (
                        isBuzzedPlayer ? (
                          <div className="mt-4 flex gap-3">
                            <Button
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() =>
                                nameTheSongJudge.mutate({
                                  roomId: room?.id || "",
                                  playerId: actualPlayer || "",
                                  verdict: "CORRECT",
                                })
                              }
                              disabled={nameTheSongJudge.isPending}
                            >
                              Correct
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() =>
                                nameTheSongJudge.mutate({
                                  roomId: room?.id || "",
                                  playerId: actualPlayer || "",
                                  verdict: "WRONG",
                                })
                              }
                              disabled={nameTheSongJudge.isPending}
                            >
                              Wrong
                            </Button>
                          </div>
                        ) : (
                          <p className="mt-4 text-sm text-white/75">
                            Waiting for {buzzedPlayerName} to confirm whether
                            they were right.
                          </p>
                        )
                      ) : (
                        <p className="mt-4 text-sm text-white/75">
                          {isBuzzedPlayer
                            ? "Say the full title out loud before time runs out."
                            : `Waiting for ${buzzedPlayerName} to answer.`}
                        </p>
                      )}
                    </>
                  )}

                  {nameTheSongState.status === "ROUND_RESULT" && (
                    <>
                      <p className="text-sm text-white/85">
                        {nameTheSongState.verdict === "CORRECT"
                          ? `${buzzedPlayerName} got it right.`
                          : `${buzzedPlayerName} got it wrong.`}
                      </p>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-lg border border-emerald-300/25 bg-emerald-500/10 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/70">
                            Points +1
                          </p>
                          <p className="mt-1 text-sm text-emerald-100">
                            {pointPlayerNames.join(", ") || "None"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-amber-300/25 bg-amber-500/10 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-amber-100/70">
                            Drinks +1
                          </p>
                          <p className="mt-1 text-sm text-amber-100">
                            {drinkPlayerNames.join(", ") || "None"}
                          </p>
                        </div>
                      </div>
                      <Button
                        className="mt-4 w-full bg-sky-600 hover:bg-sky-700"
                        onClick={() =>
                          nameTheSongNextRound.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer || "",
                          })
                        }
                        disabled={
                          !actualPlayer || nameTheSongNextRound.isPending
                        }
                      >
                        Next Song
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outline"
                    className="mt-4 w-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    onClick={() =>
                      nameTheSongNextRound.mutate({
                        roomId: room?.id || "",
                        playerId: actualPlayer || "",
                      })
                    }
                    disabled={!actualPlayer || nameTheSongNextRound.isPending}
                  >
                    Skip Song
                  </Button>
                  {!actualPlayer && (
                    <p className="mt-3 text-sm text-amber-200">
                      Select your player first.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold">Scoring</h3>
                  <p className="mt-2 text-sm text-white/85">
                    On correct: the buzzing player gets +1 point and everyone
                    else gets +1 drink.
                  </p>
                  <p className="mt-2 text-sm text-white/85">
                    On wrong: the buzzing player gets +1 drink and everyone else
                    gets +1 point.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case "who-am-i": {
        const winnerName = whoAmIState.winnerPlayerId
          ? players.find((player) => player.id === whoAmIState.winnerPlayerId)
              ?.name || "Winner"
          : "";
        const canStartNextRound =
          Boolean(actualPlayer) &&
          actualPlayer === whoAmIState.winnerPlayerId &&
          whoAmIState.status === "ROUND_WON";

        return (
          <div className="w-full">
            <div className="mb-4 sm:mb-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Round {whoAmIState.roundNumber}
                </Badge>
                <Badge variant="outline">
                  {whoAmIState.status === "ROUND_WON"
                    ? `Winner: ${winnerName}`
                    : "Guess your hidden card"}
                </Badge>
              </div>
              <p className="mt-3 text-sm sm:text-base text-white/90">
                You can see every other player&apos;s word, but not your own.
                Say your guess out loud. When someone guesses correctly, tap
                their win button.
              </p>
              {actualPlayer && (
                <p className="mt-2 text-sm text-cyan-200">
                  Your card is hidden on this device. Everyone else should be
                  able to see it on theirs.
                </p>
              )}
              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Private notes
                    </p>
                    <p className="text-sm text-white/65">
                      Save clue ideas on this device only. Notes are read-only
                      after saving.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setWhoAmINotesOpen(true)}
                    disabled={!actualPlayer}
                    className="bg-amber-500 text-black hover:bg-amber-400"
                  >
                    Add note
                  </Button>
                </div>

                {!actualPlayer ? (
                  <p className="mt-3 text-sm text-amber-200">
                    Pick your player first to save private notes.
                  </p>
                ) : whoAmINotes.length === 0 ? (
                  <p className="mt-3 text-sm text-white/60">No notes yet.</p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {whoAmINotes.map((note, index) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                          Note {whoAmINotes.length - index}
                        </p>
                        <p className="mt-2 text-sm text-white/90">
                          {note.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {whoAmICards.map((card) => {
                const isMe = card.playerId === actualPlayer;
                return (
                  <div
                    key={card.playerId}
                    className={`rounded-xl border p-4 backdrop-blur-sm ${
                      isMe
                        ? "border-amber-300/40 bg-amber-500/10"
                        : "border-white/20 bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">
                        {card.playerName}
                      </p>
                      {isMe && <Badge className="bg-amber-600">You</Badge>}
                    </div>
                    <div className="mt-4 min-h-24 rounded-lg border border-white/15 bg-black/20 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.25em] text-white/55">
                        {isMe ? "Hidden card" : "Visible card"}
                      </p>
                      <p className="mt-3 text-xl font-bold text-white">
                        {isMe ? "???" : card.text}
                      </p>
                    </div>
                    {isMe && (
                      <Button
                        className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700"
                        onClick={() =>
                          whoAmIWinRound.mutate({
                            roomId: room?.id || "",
                            winnerPlayerId: card.playerId,
                          })
                        }
                        disabled={
                          whoAmIState.status !== "PLAYING" ||
                          whoAmIWinRound.isPending
                        }
                      >
                        I won
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              {whoAmIState.status === "ROUND_WON" ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-white/90">
                    {winnerName} won the round. They get +1 point and everyone
                    else gets +1 drink.
                  </p>
                  {canStartNextRound ? (
                    <Button
                      onClick={() =>
                        whoAmINextRound.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer,
                        })
                      }
                      disabled={whoAmINextRound.isPending}
                      className="bg-sky-600 hover:bg-sky-700"
                    >
                      Next Round
                    </Button>
                  ) : (
                    <p className="text-sm text-amber-200">
                      Waiting for {winnerName} to start the next round.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/80">
                  Keep guessing until someone gets it right. Use easy clues and
                  avoid giving away the exact word.
                </p>
              )}
            </div>
          </div>
        );
      }

      case "codenames": {
        const me = players.find((player) => player.id === actualPlayer);
        const myTeam = me?.team || "";
        const redPlayers = players.filter((player) => player.team === "RED");
        const bluePlayers = players.filter((player) => player.team === "BLUE");
        const isSpymaster =
          actualPlayer === room?.playerOneId ||
          actualPlayer === room?.playerTwoId;
        const activeSpymasterId =
          codenamesState.turnTeam === "RED"
            ? room?.playerOneId
            : room?.playerTwoId;
        const canEndTurn =
          codenamesState.status === "PLAYING" &&
          myTeam === codenamesState.turnTeam;
        const guessBlockReason = () => {
          if (codenamesState.status !== "PLAYING")
            return "Game is not in progress.";
          if (!actualPlayer) return "Select your player first.";
          if (!myTeam) return "Pick a team first.";
          if (myTeam !== codenamesState.turnTeam)
            return "It is not your team's turn.";
          if (actualPlayer === activeSpymasterId)
            return "Spymaster cannot guess. Let operatives guess.";
          return "";
        };

        return (
          <div className="w-full">
            <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Status: {codenamesState.status}
                </Badge>
                <Badge
                  className={
                    codenamesState.turnTeam === "RED"
                      ? "bg-red-600"
                      : "bg-blue-600"
                  }
                >
                  Turn: {codenamesState.turnTeam}
                </Badge>
                <Badge variant="outline">
                  Guesses:{" "}
                  {codenamesState.guessesRemaining === null
                    ? "Not Set"
                    : codenamesState.guessesRemaining}
                </Badge>
                {myTeam && <Badge variant="outline">Your Team: {myTeam}</Badge>}
                {isSpymaster && (
                  <Badge className="bg-purple-600">Role: Spymaster</Badge>
                )}
                {codenamesState.winner && (
                  <Badge className="bg-emerald-600">
                    Winner: {codenamesState.winner}
                  </Badge>
                )}
              </div>

              {codenamesState.status === "LOBBY" && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => {
                      codenamesStart.mutate({ roomId: room?.id || "" });
                    }}
                    disabled={!codenamesIsReadyToStart}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500"
                  >
                    Start Game
                  </Button>
                  {!codenamesIsReadyToStart && (
                    <p className="text-sm text-amber-300">
                      Need 4+ players and at least one player per team.
                    </p>
                  )}
                </div>
              )}

              {codenamesState.status === "PLAYING" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {canEndTurn && (
                    <Button
                      onClick={() =>
                        codenamesEndTurn.mutate({
                          roomId: room?.id || "",
                          playerId: actualPlayer || "",
                        })
                      }
                      size="sm"
                      variant="destructive"
                    >
                      End Turn
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                <div className="grid grid-cols-5 gap-2">
                  {codenamesBoard.map((card) => {
                    const hiddenClass =
                      isSpymaster && !card.revealed
                        ? card.assignment === "RED"
                          ? "bg-red-500/20 border-red-300/40"
                          : card.assignment === "BLUE"
                            ? "bg-blue-500/20 border-blue-300/40"
                            : card.assignment === "ASSASSIN"
                              ? "bg-zinc-950/60 border-zinc-100/40"
                              : "bg-zinc-300/20 border-zinc-200/40"
                        : "bg-amber-50/90 border-amber-200 text-zinc-900";
                    const revealedClass = card.revealed
                      ? card.assignment === "RED"
                        ? "bg-red-500/80 border-red-200 text-white"
                        : card.assignment === "BLUE"
                          ? "bg-blue-500/80 border-blue-200 text-white"
                          : card.assignment === "ASSASSIN"
                            ? "bg-black/90 border-zinc-100 text-white"
                            : "bg-zinc-400/70 border-zinc-200 text-black"
                      : hiddenClass;

                    return (
                      <button
                        key={card.id}
                        disabled={
                          card.revealed ||
                          codenamesGuess.isPending ||
                          codenamesSelectedCardId !== null
                        }
                        onClick={() => {
                          const blockReason = guessBlockReason();
                          if (blockReason) {
                            toast.error(blockReason);
                            return;
                          }
                          setCodenamesSelectedCardId(card.id);
                          toast.success("Card selected");
                          codenamesGuess.mutate({
                            roomId: room?.id || "",
                            playerId: actualPlayer || "",
                            questionId: card.id,
                          });
                        }}
                        className={`min-h-24 rounded-md border p-2 text-center text-sm font-semibold transition ${revealedClass} ${
                          !card.revealed &&
                          !codenamesGuess.isPending &&
                          codenamesSelectedCardId === null
                            ? "cursor-pointer hover:scale-[1.02]"
                            : "cursor-default"
                        } whitespace-normal wrap-break-word leading-tight overflow-hidden text-[11px] sm:text-sm sm:leading-snug`}
                      >
                        {card.text}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-red-300/40 bg-red-500/10 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-lg font-semibold">RED Team</div>
                    <Badge className="bg-red-600">{redPlayers.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {redPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between rounded-md bg-black/20 px-3 py-2"
                      >
                        <span>{player.name}</span>
                        {player.id === room?.playerOneId && (
                          <Badge variant="secondary">Spymaster</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-blue-300/40 bg-blue-500/10 p-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-lg font-semibold">BLUE Team</div>
                    <Badge className="bg-blue-600">{bluePlayers.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {bluePlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between rounded-md bg-black/20 px-3 py-2"
                      >
                        <span>{player.name}</span>
                        {player.id === room?.playerTwoId && (
                          <Badge variant="secondary">Spymaster</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="text-center">
            <div className="text-xl text-emerald-400 mb-4">
              👤 {currentPlayer}&apos;s Turn
            </div>
            <div className="text-xl mb-6 text-white">
              Game in progress! Use the action buttons below. (Game Under
              Construction)
            </div>

            {
              //@ts-expect-error leave it
              actualPlayer === roomState?.currentPlayerId && (
                <div className="flex gap-3 justify-center flex-wrap">
                  <button
                    onClick={() => {
                      // addPoint(currentPlayer);
                      // nextPlayer();
                    }}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Success
                  </button>
                  <button
                    onClick={() => {
                      // addDrink(currentPlayer);
                      // nextPlayer();
                    }}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Failed - Drink!
                  </button>
                </div>
              )
            }
          </div>
        );
    }
  };

  return (
    <div className="min-h-64 flex items-center justify-center">
      {renderGameSpecificContent()}
    </div>
  );
});
