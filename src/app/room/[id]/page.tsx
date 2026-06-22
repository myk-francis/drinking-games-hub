"use client";
import {
  Home,
  UserPlus2,
  QrCodeIcon,
  ChevronDown,
  VolumeX,
  Star,
  Trophy,
  ArrowLeft,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import UserConfirmModal from "./modal";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";
import ErrorPage from "@/app/error";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddPlayerModal from "./addPlayerModal";
import GameContentRenderer from "./GameContentRenderer";
import { QRCodeCanvas } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { DRINKING_QUOTES } from "@/lib/quotes";
import {
  parseBadChoicesState,
  parseBadPeopleState,
  parseCoupState,
  parseFlip7State,
  parseSpinBottleState,
  GUESS_THE_MOVIE_TIMER_SECONDS,
  NAME_THE_SONG_TIMER_SECONDS,
  parseBlackjackState,
  parseCodenamesState,
  parseConnectLettersState,
  parseGhostTearsState,
  parseGuessTheMovieState,
  parseGuessTheNumberState,
  parseJokerLoopState,
  parseMemoryChainState,
  parseNameTheSongState,
  parsePokerState,
  parseRideTheBusState,
  parseUnoState,
  parseWhoAmIState,
} from "@/modules/games/lib/room-state";
import {
  getSpinBottleModeByCode,
} from "@/modules/games/lib/spin-the-bottle";
import type {
  BlackjackCard,
  BlackjackPlayerResult,
  PokerCard,
  RideTheBusCard,
  RideTheBusStep,
} from "@/modules/games/lib/room-state";
import {
  getPokerMinimumAggressiveBetTotal,
} from "./poker-helpers";

type WhoAmINote = {
  id: string;
  text: string;
  createdAt: string;
};

interface TeamStats {
  [team: string]: {
    TotalPoints: number;
    TotalDrinks: number;
    Count: number;
  };
}

function getRandomDrinkingQuote(): string {
  const index = Math.floor(Math.random() * DRINKING_QUOTES.length);
  return DRINKING_QUOTES[index];
}

const getRandomTailwindColor = () => {
  const colors = [
    "text-red-500",
    "text-orange-500",
    "text-green-500",
    "text-amber-500",
    "text-indigo-500",
    "text-blue-500",
  ];

  return colors[Math.floor(Math.random() * colors.length)];
};

interface GameComment {
  id: number;
  comment: string;
  rating: number;
  createdAt: Date;
  playerName: string;
}

interface GameCommentsProps {
  comments: GameComment[] | [] | null;
}

type RoomReaction = {
  id: string;
  roomId: string;
  senderPlayerId: string;
  targetPlayerId: string | null;
  emoji: string;
  createdAt: Date;
  senderPlayer: {
    id: string;
    name: string;
  };
  targetPlayer: {
    id: string;
    name: string;
  } | null;
};

const animations = [
  {
    animation: "fade-in",
    duration: "0.5s",
  },
  {
    animation: "slide-up",
    duration: "0.5s",
  },
  {
    animation: "scale-in",
    duration: "0.4s",
  },
  {
    animation: "slide-left",
    duration: "0.5s",
  },
];

function GameComments({ comments }: GameCommentsProps) {
  if (!comments?.length) return null;

  return (
    <div className="mt-8 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-4">Player Comments</h2>

      <div className="space-y-4">
        {comments?.map((c: GameComment, index: number) => (
          <div
            key={c.id}
            style={{
              animation: `${animations[index % animations.length].animation} ${
                animations[index % animations.length].duration
              } ease-out both`,
            }}
            className={`
              bg-zinc-950/80 
              border border-white/10 
              rounded-xl 
              p-4 
              text-white
              shadow-lg
              `}
          >
            {/* ⭐ Rating */}
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= c.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-white/30"
                  }`}
                />
              ))}
            </div>

            {/* 📝 Comment */}
            <p className="text-white/90 whitespace-pre-line">
              <span className={`capitalize ${getRandomTailwindColor()}`}>
                {c.playerName}
              </span>{" "}
              ~ <span className="italic">{c.comment}</span>
            </p>

            {/* 🕒 Date */}
            <p className="text-xs text-white/40 mt-3">
              {c.createdAt.toDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const MAX_CHARS = 250;
const DRINK_ALERT_STEP = 5;
const LOSING_MEME_SOUND_PATH = "/sounds/losing-meme.mp4";
const LOSING_MEME_FALLBACK_SOUND_PATH = "/sounds/losing-meme.wav";
const GAME_OVER_SOUND_PATH = "/sounds/game-over-piano.mp3";
const REACTION_COOLDOWN_MS = 10 * 60 * 1000;
const REACTION_VISIBLE_WINDOW_MS = 10 * 1000;
const DEFAULT_REACTION_EMOJIS = ["🔥", "😂", "👏"];
const EMOJI_GRAPHEME_PATTERN = /\p{Extended_Pictographic}/u;

const extractFirstEmoji = (value: string): string => {
  if (!value) return "";

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const graphemeSegmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    for (const { segment } of graphemeSegmenter.segment(value)) {
      if (EMOJI_GRAPHEME_PATTERN.test(segment)) {
        return segment;
      }
    }
    return "";
  }

  for (const char of Array.from(value)) {
    if (EMOJI_GRAPHEME_PATTERN.test(char)) {
      return char;
    }
  }

  return "";
};

const normalizeUrl = (rawUrl?: string) => {
  let value = (rawUrl ?? "").trim();
  if (!value) return "";
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }
  return value;
};

function EndGameFeedback({
  handleCreateComment,
  roomId,
  setComment,
  comment,
  setRating,
  rating,
  openDialog,
  setOpenDialog,
}: {
  handleCreateComment: (
    comment: string,
    rating: number,
    roomId: string,
  ) => void;
  roomId: string;
  setComment: React.Dispatch<React.SetStateAction<string>>;
  comment: string;
  setRating: React.Dispatch<React.SetStateAction<number>>;
  rating: number;
  openDialog: boolean;
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            setOpenDialog(true);
          }}
          className="border-white/20 text-white"
        >
          Leave a Comment
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-zinc-950 border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Rate this game</DialogTitle>
        </DialogHeader>

        {/* ⭐ Rating */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition hover:scale-110"
            >
              <Star
                className={`h-7 w-7 ${
                  star <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-white/30"
                }`}
              />
            </button>
          ))}
        </div>

        {/* 📝 Comment */}
        <div className="space-y-2">
          <Textarea
            placeholder="What did you think about the game?"
            value={comment}
            onChange={(e) =>
              e.target.value.length <= MAX_CHARS && setComment(e.target.value)
            }
            rows={4}
            className="
              bg-zinc-900 
              border-white/10 
              text-white 
              placeholder:text-white/40
              focus-visible:ring-1 
              focus-visible:ring-yellow-400
            "
          />

          <div className="text-xs text-white/50 text-right">
            {comment.length}/{MAX_CHARS} characters
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            disabled={rating === 0}
            className="
              bg-yellow-400 
              text-black 
              hover:bg-yellow-300
              disabled:opacity-50
            "
            onClick={() => {
              if (!roomId || comment.trim() === "") return;

              handleCreateComment(comment, rating, roomId);
              setComment("");
              setRating(1);
            }}
          >
            Submit Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type TopPlayerEntry = {
  id: string;
  name: string;
  points: number;
  drinks: number;
  ratio: number;
};

function GameEndedWinners({
  winners,
  selectedGame,
}: {
  winners: TopPlayerEntry[];
  selectedGame: string;
}) {
  if (winners.length === 0) {
    return null;
  }

  const pointsLabel =
    selectedGame === "most-likely" || selectedGame === "paranoia"
      ? "Votes"
      : "Points";
  const championRatio = winners[0]?.ratio ?? 0;

  return (
    <motion.section
      className="mb-6 overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-amber-400/20 via-yellow-200/10 to-cyan-300/15 p-5 shadow-[0_18px_60px_rgba(251,191,36,0.18)] backdrop-blur-sm sm:p-6"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200/30 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
            <Trophy className="h-3.5 w-3.5" />
            Winners Circle
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Best points-to-drinks ratio
          </h2>
          <p className="mt-1 text-sm text-white/75">
            {winners.length === 1
              ? "This player had the cleanest run of the night."
              : "These players tied for the sharpest ratio tonight."}
          </p>
        </div>
        <div className="rounded-2xl border border-cyan-200/20 bg-black/20 px-4 py-3 text-left sm:text-right">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/70">
            Winning ratio
          </div>
          <div className="text-3xl font-black text-cyan-100">
            {championRatio.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {winners.map((winner, index) => (
          <motion.div
            key={winner.id}
            className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/25 p-4"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.08 + index * 0.06,
              duration: 0.3,
              ease: "easeOut",
            }}
          >
            <div className="absolute right-3 top-3 rounded-full bg-amber-300/15 px-2.5 py-1 text-xs font-bold text-amber-100">
              #{index + 1}
            </div>
            <div className="mb-4 flex items-center gap-3 pr-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200/35 bg-amber-300/15 text-2xl">
                {index === 0 ? "👑" : "🏆"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-white">{winner.name}</p>
                <p className="text-sm text-white/65">Efficiency champion</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.16em] text-emerald-100/70">
                  {pointsLabel}
                </div>
                <div className="mt-1 text-lg font-bold text-emerald-200">
                  {winner.points}
                </div>
              </div>
              <div className="rounded-xl border border-orange-300/20 bg-orange-400/10 px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.16em] text-orange-100/70">
                  Drinks
                </div>
                <div className="mt-1 text-lg font-bold text-orange-200">
                  {winner.drinks}
                </div>
              </div>
              <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.16em] text-cyan-100/70">
                  Ratio
                </div>
                <div className="mt-1 text-lg font-bold text-cyan-100">
                  {winner.ratio.toFixed(2)}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

function TopPlayersView({
  topPlayers,
  selectedGame,
  onBack,
}: {
  topPlayers: TopPlayerEntry[];
  selectedGame: string;
  onBack: () => void;
}) {
  const pointsLabel =
    selectedGame === "most-likely" || selectedGame === "paranoia"
      ? "Votes"
      : "Points";

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className="rounded-2xl border border-white/20 bg-white/10 p-4 sm:p-6 backdrop-blur-sm"
        style={{ animation: "scale-in 0.35s ease-out both" }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-300" />
              Top 10 Players
            </h2>
            <p className="text-sm text-white/75 mt-1">
              Ranked by points-to-drinks efficiency for this game.
            </p>
          </div>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Game Ended
          </Button>
        </div>

        <motion.div
          className="mt-5 space-y-3 max-h-[60vh] overflow-y-auto pr-1"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.07,
                delayChildren: 0.08,
              },
            },
          }}
        >
          {topPlayers.length === 0 ? (
            <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-white/80 text-sm">
              No player stats are available yet.
            </div>
          ) : (
            topPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                className="rounded-xl border border-white/20 bg-black/20 p-3 sm:p-4"
                variants={{
                  hidden: { opacity: 0, y: 14, scale: 0.98 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      duration: 0.34,
                      ease: "easeOut",
                    },
                  },
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-full bg-yellow-500/20 border border-yellow-300/40 text-yellow-200 flex items-center justify-center text-sm font-bold">
                      #{index + 1}
                    </div>
                    <motion.p
                      className="font-semibold text-base sm:text-lg truncate"
                      initial={{ x: 0 }}
                      animate={{ x: [0, 18, -10, 0] }}
                      transition={{
                        duration: 0.8,
                        ease: "easeInOut",
                        delay: 0.18 + index * 0.05,
                      }}
                    >
                      {player.name}
                    </motion.p>
                  </div>
                  <div className="text-right text-xs sm:text-sm text-cyan-200 font-semibold">
                    Ratio: {player.ratio.toFixed(2)}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div className="rounded-lg bg-emerald-500/15 border border-emerald-300/20 px-3 py-2 text-emerald-200">
                    {pointsLabel}: {player.points}
                  </div>
                  <div className="rounded-lg bg-orange-500/15 border border-orange-300/20 px-3 py-2 text-orange-200">
                    Drinks: {player.drinks}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}

function removeVowels(value: string): string {
  return value.replace(/[aeiou]/gi, "");
}

function parseNameTheSongPrompt(raw: string | undefined) {
  const [rawTitle = "", rawArtist = ""] = (raw ?? "").split("|");
  return {
    title: rawTitle.trim(),
    artist: rawArtist.trim(),
  };
}

function getMovieCategoryLabel(edition: number | null | undefined): string {
  if (edition === 1) return "Action & Adventure";
  if (edition === 2) return "Comedy";
  if (edition === 3) return "Animation & Family";
  if (edition === 4) return "Horror & Thriller";
  return "All Movies";
}

function getRideTheBusStepLabel(step: RideTheBusStep): string {
  if (step === "COLOR") return "Step 1: Red or Black";
  if (step === "HIGHER_LOWER") return "Step 2: Higher or Lower";
  if (step === "INSIDE_OUTSIDE") return "Step 3: Inside or Outside";
  return "Step 4: Suit";
}

function getRideTheBusCardLabel(card: RideTheBusCard): string {
  const rankLabel =
    card.rank === 1
      ? "A"
      : card.rank === 11
        ? "J"
        : card.rank === 12
          ? "Q"
          : card.rank === 13
            ? "K"
            : String(card.rank);
  return `${rankLabel} of ${card.suit}`;
}

function getBlackjackCardLabel(card: BlackjackCard | PokerCard): string {
  const rankLabel =
    card.rank === 1
      ? "A"
      : card.rank === 11
        ? "J"
        : card.rank === 12
          ? "Q"
          : card.rank === 13
            ? "K"
            : String(card.rank);
  const suitLabel =
    card.suit === "HEARTS"
      ? "♥"
      : card.suit === "DIAMONDS"
        ? "♦"
        : card.suit === "CLUBS"
          ? "♣"
          : "♠";
  return `${rankLabel}${suitLabel}`;
}

function getBlackjackHandTotal(cards: BlackjackCard[]): number {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    total += card.rank === 1 ? 11 : card.rank >= 10 ? 10 : card.rank;
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

function getBlackjackResultLabel(result: BlackjackPlayerResult | null): string {
  if (result === "BLACKJACK") return "Blackjack";
  if (result === "WIN") return "Win";
  if (result === "LOSE") return "Lose";
  if (result === "PUSH") return "Push";
  if (result === "BUST") return "Bust";
  return "Waiting";
}

function getBlackjackCardClasses(card: BlackjackCard | PokerCard | null): string {
  if (!card) {
    return "border-white/15 bg-black/25 text-white/80";
  }

  const isRedSuit = card.suit === "HEARTS" || card.suit === "DIAMONDS";
  return isRedSuit
    ? "border-rose-300/35 bg-rose-500/10 text-rose-100"
    : "border-slate-300/35 bg-slate-900/60 text-slate-100";
}

function getBlackjackResultBadgeClasses(result: BlackjackPlayerResult | null): string {
  if (result === "BLACKJACK" || result === "WIN") {
    return "border-emerald-300/30 bg-emerald-500/15 text-emerald-100";
  }
  if (result === "PUSH") {
    return "border-amber-300/30 bg-amber-500/15 text-amber-100";
  }
  if (result === "LOSE" || result === "BUST") {
    return "border-rose-300/30 bg-rose-500/15 text-rose-100";
  }
  return "border-white/15 bg-black/20 text-white/80";
}

function getBlackjackRoundExplanation({
  dealerHand,
  winners,
  losers,
  pushes,
}: {
  dealerHand: BlackjackCard[];
  winners: string[];
  losers: string[];
  pushes: string[];
}): string {
  const dealerTotal = getBlackjackHandTotal(dealerHand);
  const dealerNatural = dealerHand.length === 2 && dealerTotal === 21;

  if (dealerNatural) {
    return winners.length > 0
      ? "Dealer opened with blackjack, but player naturals still paid out."
      : "Dealer opened with blackjack, so non-natural hands lost immediately.";
  }

  if (dealerTotal > 21) {
    return "Dealer busted after drawing to 17+, so every surviving player won the round.";
  }

  if (pushes.length > 0 && winners.length === 0 && losers.length === 0) {
    return "The table tied the dealer exactly, so everyone pushed and no drinks were assigned.";
  }

  if (pushes.length > 0) {
    return "The dealer stood on 17+, so matching totals pushed while higher hands won and lower hands drank.";
  }

  return "The dealer stood on 17+, and results were settled by comparing each hand directly to the dealer.";
}

export default function RoomPage() {
  const [quote, setQuote] = React.useState<string>("");
  const [whoAmINotesOpen, setWhoAmINotesOpen] = React.useState(false);
  const params = useParams();
  const roomId = params.id; // This is your dynamic route: /room/[id]
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const {
    data: room,
    isLoading,
    error,
  } = useQuery(
    trpc.games.getRoomState.queryOptions(
      { roomId: String(roomId) },
      {
        refetchInterval: (query) =>
          query.state.data?.gameEnded || whoAmINotesOpen ? false : 3000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: false,
      },
    ),
  );

  const { data: comments } = useQuery(
    trpc.comments.getCommentsByRoomId.queryOptions({ roomId: String(roomId) }),
  );
  const { data: gameWideTopPlayers = [] } = useQuery(
    trpc.games.getTopPlayersByGame.queryOptions(
      { gameCode: room?.game?.code || "" },
      {
        enabled: Boolean(room?.game?.code),
      },
    ),
  );
  const { data: roomReactions = [] } = useQuery(
    trpc.games.getRoomReactions.queryOptions(
      { roomId: String(roomId) },
      {
        refetchInterval: room?.gameEnded || whoAmINotesOpen ? false : 2000,
        refetchIntervalInBackground: true,
      },
    ),
  );
  const connectLettersTimerDuration = React.useMemo(
    () => parseConnectLettersState(room?.currentAnswer).timerSeconds,
    [room?.currentAnswer],
  );

  const [clicked, setClicked] = React.useState(false);

  const [playerRating, setPlayerRating] = React.useState<number>(1);
  const [comment, setComment] = React.useState<string>("");

  const createComment = useMutation(
    trpc.comments.createComment.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.comments.getCommentsByRoomId.queryFilter({
            roomId: String(roomId),
          }),
        );
        toast.success("Comment added successfully");
        setOpenDialog(false);
      },
      onError: (error) => {
        console.error("Error adding comment:", error);
        // alert("Failed to create room. Please try again.");
      },
    }),
  );

  const updateRoom = useMutation(
    trpc.games.addPlayerStats.mutationOptions({
      onSuccess: () => {
        toast.success("Got it next");
        setClicked(false);
        // trpc.games.getRoomById.invalidate({ roomId: String(roomId) });
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error updating room:", error);
        setClicked(false);
      },
    }),
  );

  const updatePlayerStatsPOD = useMutation(
    trpc.games.updatePlayerStatsPOD.mutationOptions({
      onSuccess: () => {
        toast.success("Got it next");
        setClicked(false);
        // trpc.games.getRoomById.invalidate({ roomId: String(roomId) });
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error updating room:", error);
        setClicked(false);
      },
    }),
  );

  const endRoom = useMutation(
    trpc.games.endGame.mutationOptions({
      onSuccess: () => {
        toast.success("Thanks for playing!");
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error ending room:", error);
        setClicked(false);
      },
    }),
  );
  const nextQuestion = useMutation(
    trpc.games.nextQuestion.mutationOptions({
      onSuccess: () => {
        toast.success("Next question coming up!");
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error changing question:", error);
        setClicked(false);
      },
    }),
  );
  const nextRound = useMutation(
    trpc.games.nextRound.mutationOptions({
      onSuccess: () => {
        toast.success("Next question coming up!");
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error question question:", error);
        setClicked(false);
      },
    }),
  );
  const nextCardPOD = useMutation(
    trpc.games.nextCardPOD.mutationOptions({
      onSuccess: () => {
        toast.success("Next card coming up!");
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error question question:", error);
        setClicked(false);
      },
    }),
  );
  const imposterResolveRound = useMutation(
    trpc.games.imposterResolveRound.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          data.wasFound
            ? "Round resolved: imposter was caught."
            : "Round resolved: imposter stayed hidden.",
        );
        setClicked(false);
      },
      onError: (error) => {
        toast.error(error.message || "Could not resolve imposter round.");
        setClicked(false);
      },
    }),
  );
  const generateCard = useMutation(
    trpc.games.nextCard.mutationOptions({
      onSuccess: () => {
        toast.success("Next card coming up!");
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error changing card:", error);
        setClicked(false);
      },
    }),
  );
  const voteQuestion = useMutation(
    trpc.games.voteQuestion.mutationOptions({
      onSuccess: () => {
        toast.success("Vote submitted!");
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error voting :", error);
        setClicked(false);
      },
    }),
  );
  const voteTruthLie = useMutation(
    trpc.games.voteTruthLie.mutationOptions({
      onSuccess: () => {
        toast.success("Vote submitted!");
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error voting truth/lie:", error);
      },
    }),
  );

  const revealTruthLie = useMutation(
    trpc.games.revealTruthLie.mutationOptions({
      onSuccess: () => {
        toast.success("Answer revealed!");
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error revealing truth/lie:", error);
      },
    }),
  );

  const nextTruthLieCard = useMutation(
    trpc.games.nextTruthLieCard.mutationOptions({
      onSuccess: () => {
        toast.success("Next card coming up!");
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error going to next truth/lie card:", error);
      },
    }),
  );

  const paranoiaVote = useMutation(
    trpc.games.paranoiaVote.mutationOptions({
      onSuccess: () => {
        toast.success("Vote submitted!");
      },
      onError: (error) => {
        toast.error(error.message || "Something went wrong. Please try again.");
        console.error("Error submitting paranoia vote:", error);
      },
    }),
  );

  const paranoiaReveal = useMutation(
    trpc.games.paranoiaReveal.mutationOptions({
      onSuccess: () => {
        toast.success("Result revealed!");
      },
      onError: (error) => {
        toast.error(error.message || "Something went wrong. Please try again.");
        console.error("Error revealing paranoia result:", error);
      },
    }),
  );

  const paranoiaNextCard = useMutation(
    trpc.games.paranoiaNextCard.mutationOptions({
      onSuccess: () => {
        toast.success("Next question coming up!");
      },
      onError: (error) => {
        toast.error(error.message || "Something went wrong. Please try again.");
        console.error("Error moving to next paranoia question:", error);
      },
    }),
  );

  const badPeopleDictatorVote = useMutation(
    trpc.games.badPeopleDictatorVote.mutationOptions({
      onSuccess: () => {
        toast.success("Secret pick locked in.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not save the dictator pick.");
      },
    }),
  );

  const badPeopleGuess = useMutation(
    trpc.games.badPeopleGuess.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          data.usedDoubleDown
            ? "Guess submitted with Double Down."
            : "Guess submitted.",
        );
      },
      onError: (error) => {
        toast.error(error.message || "Could not submit your guess.");
      },
    }),
  );

  const badPeopleReveal = useMutation(
    trpc.games.badPeopleReveal.mutationOptions({
      onSuccess: (data) => {
        if (data.winnerPlayerIds.length > 0) {
          toast.success("Round revealed. We have a winner!");
          return;
        }
        toast.success("Round revealed!");
      },
      onError: (error) => {
        toast.error(error.message || "Could not reveal this round.");
      },
    }),
  );

  const badPeopleNextRound = useMutation(
    trpc.games.badPeopleNextRound.mutationOptions({
      onSuccess: () => {
        toast.success("Next Bad People round ready.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not start the next round.");
      },
    }),
  );

  const badChoicesPlayCard = useMutation(
    trpc.games.badChoicesPlayCard.mutationOptions({
      onSuccess: (data) => {
        if (data.winnerPlayerId) {
          toast.success("We have a winner!");
          return;
        }
        toast.success("Card played.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not play that card.");
      },
    }),
  );

  const badChoicesRedrawCards = useMutation(
    trpc.games.badChoicesRedrawCards.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          `Hand refreshed. Drew ${data.redrawnCount} new card${
            data.redrawnCount === 1 ? "" : "s"
          }.`,
        );
      },
      onError: (error) => {
        toast.error(error.message || "Could not redraw those cards.");
      },
    }),
  );

  const badChoicesAnswer = useMutation(
    trpc.games.badChoicesAnswer.mutationOptions({
      onSuccess: (data) => {
        if (data.winnerPlayerId) {
          toast.success("Round over. Winner locked in.");
          return;
        }
        toast.success("Answer saved.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not save that answer.");
      },
    }),
  );

  const spinBottleSpin = useMutation(
    trpc.games.spinBottleSpin.mutationOptions({
      onSuccess: () => {
        toast.success("Bottle spinning!");
      },
      onError: (error) => {
        toast.error(error.message || "Could not spin the bottle.");
      },
    }),
  );

  const spinBottleChooseAction = useMutation(
    trpc.games.spinBottleChooseAction.mutationOptions({
      onSuccess: (data) => {
        toast.success(`${data.actionLabel} selected.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not lock that bottle result.");
      },
    }),
  );

  const nextWouldRatherQuestion = useMutation(
    trpc.games.nextWouldRatherQuestion.mutationOptions({
      onSuccess: () => {
        toast.success("Next question coming up!");
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error changing question:", error);
        setClicked(false);
      },
    }),
  );

  const nextCardCategory = useMutation(
    trpc.games.nextCardCategory.mutationOptions({
      onSuccess: () => {
        toast.success("Next card category coming up!");
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error changing card category:", error);
        setClicked(false);
      },
    }),
  );

  const addNewPlayer = useMutation(
    trpc.games.addNewPlayer.mutationOptions({
      onSuccess: () => {
        toast.success("Added Player");
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error changing question:", error);
        setClicked(false);
      },
    }),
  );

  const addNewPlayerToTeam = useMutation(
    trpc.games.addNewPlayerToTeam.mutationOptions({
      onSuccess: () => {
        toast.success("Added Player To Team");
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error changing question:", error);
        setClicked(false);
      },
    }),
  );

  const assignPlayerTeam = useMutation(
    trpc.games.assignPlayerTeam.mutationOptions({
      onSuccess: () => {
        toast.success("Team selected");
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error assigning team:", error);
        setClicked(false);
      },
    }),
  );

  const changePlayerName = useMutation(
    trpc.games.changePlayerName.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.games.getRoomState.queryFilter({
            roomId: String(roomId),
          }),
        );
        toast.success("Player name updated");
        setOpenChangeNameModal(false);
        setUpdatedPlayerName("");
      },
      onError: (error) => {
        toast.error(error.message || "Could not change player name.");
      },
    }),
  );

  const codenamesAutoAssignSpymasters = useMutation(
    trpc.games.codenamesAutoAssignSpymasters.mutationOptions({
      onSuccess: () => {
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error auto assigning spymasters:", error);
      },
    }),
  );

  const codenamesStart = useMutation(
    trpc.games.codenamesStart.mutationOptions({
      onSuccess: () => {
        toast.success("Codenames started");
        setClicked(false);
      },
      onError: (error) => {
        toast.error(error.message);
        setClicked(false);
      },
    }),
  );

  const codenamesGuess = useMutation(
    trpc.games.codenamesGuess.mutationOptions({
      onSuccess: () => {
        setClicked(false);
      },
      onError: (error) => {
        toast.error(error.message);
        setClicked(false);
      },
      onSettled: () => {
        setCodenamesSelectedCardId(null);
      },
    }),
  );

  const codenamesEndTurn = useMutation(
    trpc.games.codenamesEndTurn.mutationOptions({
      onSuccess: () => {
        toast.success("Turn ended");
        setClicked(false);
      },
      onError: (error) => {
        toast.error(error.message);
        setClicked(false);
      },
    }),
  );

  const memoryChainGuess = useMutation(
    trpc.games.memoryChainGuess.mutationOptions({
      onSuccess: (data) => {
        if (data.result === "WIN") {
          toast.success("Sequence completed. Game over!");
        } else if (data.result === "MISS") {
          const nextPlayer =
            players.find((player) => player.id === data.nextPlayerId)?.name ||
            "next player";
          toast.error(`Missed 😵.  ${nextPlayer} Next.`);
        } else {
          toast.success("Correct!");
        }
      },
      onError: (error) => {
        toast.error(error.message || "Could not process guess.");
      },
    }),
  );
  const memoryChainNextPlayer = useMutation(
    trpc.games.memoryChainNextPlayer.mutationOptions({
      onSuccess: () => {
        toast.success("Turn passed to next player.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not move to next player.");
      },
    }),
  );
  const guessNumberSetPlayerNumber = useMutation(
    trpc.games.guessNumberSetPlayerNumber.mutationOptions({
      onSuccess: () => {
        toast.success("Your secret number is saved.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not save your number.");
      },
    }),
  );
  const guessNumberSubmitGuess = useMutation(
    trpc.games.guessNumberSubmitGuess.mutationOptions({
      onSuccess: (data) => {
        const hint =
          data.feedback === "UP"
            ? "⬆️ Go higher"
            : data.feedback === "DOWN"
              ? "⬇️ Go lower"
              : "✅ Correct";
        if (data.winnerPlayerId) {
          const winnerName =
            players.find((player) => player.id === data.winnerPlayerId)?.name ||
            "Winner";
          toast.success(`${hint}. ${winnerName} won. End game when ready.`);
          return;
        }
        if (data.roundCompleted) {
          const nextPlayerName =
            players.find((player) => player.id === data.nextTargetPlayerId)
              ?.name || "next player";
          toast.success(`${hint}. Next target: ${nextPlayerName}`);
          return;
        }
        toast.success(hint);
      },
      onError: (error) => {
        toast.error(error.message || "Could not submit guess.");
      },
    }),
  );
  const connectLettersBuzz = useMutation(
    trpc.games.connectLettersBuzz.mutationOptions({
      onSuccess: () => {
        toast.success(
          `You buzzed first. You have ${connectLettersTimerDuration} seconds to answer. Opponent judges your answer.`,
        );
      },
      onError: (error) => {
        toast.error(error.message || "Could not start timer.");
      },
    }),
  );
  const connectLettersStopTimer = useMutation(
    trpc.games.connectLettersStopTimer.mutationOptions({
      onSuccess: () => {
        toast.success("Timer stopped. Judge the answer.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not stop timer.");
      },
    }),
  );
  const connectLettersJudge = useMutation(
    trpc.games.connectLettersJudge.mutationOptions({
      onSuccess: (data) => {
        const pointPlayerName =
          players.find((player) => player.id === data.pointPlayerId)?.name ||
          "Player";
        const drinkPlayerName =
          players.find((player) => player.id === data.drinkPlayerId)?.name ||
          "Player";
        const verdictLabel = data.verdict === "RIGHT" ? "Correct" : "Wrong";
        toast.success(
          `${verdictLabel}: ${pointPlayerName} gets +1 point, ${drinkPlayerName} gets +1 drink. Next round ready.`,
        );
      },
      onError: (error) => {
        toast.error(error.message || "Could not submit verdict.");
      },
    }),
  );
  const connectLettersNextRound = useMutation(
    trpc.games.connectLettersNextRound.mutationOptions({
      onSuccess: () => {
        toast.success("Next round is ready.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not move to next round.");
      },
    }),
  );
  const connectLettersRedrawLetters = useMutation(
    trpc.games.connectLettersRedrawLetters.mutationOptions({
      onSuccess: () => {
        toast.success("Letter range refreshed.");
        setConnectLettersRedrawCooldown(3);
      },
      onError: (error) => {
        toast.error(error.message || "Could not redraw letters.");
      },
    }),
  );
  const ghostTearsPickLetter = useMutation(
    trpc.games.ghostTearsPickLetter.mutationOptions({
      onSuccess: (data) => {
        const nextName =
          players.find((player) => player.id === data.currentPlayerId)?.name ||
          "next player";
        toast.success(`Letter added. ${nextName} picks next.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not pick a letter.");
      },
    }),
  );
  const ghostTearsChallenge = useMutation(
    trpc.games.ghostTearsChallenge.mutationOptions({
      onSuccess: (data) => {
        const challengedName =
          players.find((player) => player.id === data.challengedPlayerId)?.name ||
          "previous player";
        toast.success(`Challenge started. ${challengedName} must defend the word.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not start challenge.");
      },
    }),
  );
  const ghostTearsJudge = useMutation(
    trpc.games.ghostTearsJudge.mutationOptions({
      onSuccess: (data) => {
        const loserName =
          players.find((player) => player.id === data.loserPlayerId)?.name ||
          "player";
        toast.success(`${loserName} drinks +1. Everyone else gets +1 point.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not submit judgment.");
      },
    }),
  );
  const ghostTearsForfeit = useMutation(
    trpc.games.ghostTearsForfeit.mutationOptions({
      onSuccess: (data) => {
        const loserName =
          players.find((player) => player.id === data.loserPlayerId)?.name ||
          "player";
        const nextName =
          players.find((player) => player.id === data.nextCurrentPlayerId)?.name ||
          "next player";
        toast.success(`${loserName} forfeited. ${nextName} plays next.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not forfeit.");
      },
    }),
  );
  const ghostTearsRestart = useMutation(
    trpc.games.ghostTearsRestart.mutationOptions({
      onSuccess: (data) => {
        const currentName =
          players.find((player) => player.id === data.currentPlayerId)?.name ||
          "player";
        toast.success(`Ghost Tears restarted. ${currentName} starts.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not restart game.");
      },
    }),
  );
  const whoAmIWinRound = useMutation(
    trpc.games.whoAmIWinRound.mutationOptions({
      onSuccess: (data) => {
        const winnerName =
          players.find((player) => player.id === data.winnerPlayerId)?.name ||
          "player";
        toast.success(`${winnerName} gets +1 point. Everyone else drinks +1.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not finish the round.");
      },
    }),
  );
  const whoAmINextRound = useMutation(
    trpc.games.whoAmINextRound.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Round ${data.roundNumber} is ready.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not start the next round.");
      },
    }),
  );
  const nameTheSongBuzz = useMutation(
    trpc.games.nameTheSongBuzz.mutationOptions({
      onSuccess: (data) => {
        const playerName =
          players.find((player) => player.id === data.buzzedPlayerId)?.name ||
          "Player";
        toast.success(`${playerName} buzzed first. ${data.timerSeconds} seconds started.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not buzz in.");
      },
    }),
  );
  const nameTheSongJudge = useMutation(
    trpc.games.nameTheSongJudge.mutationOptions({
      onSuccess: (data) => {
        if (data.verdict === "CORRECT") {
          const winnerName =
            players.find((player) => player.id === data.pointPlayerIds[0])?.name ||
            "Player";
          toast.success(`${winnerName} gets +1 point. Everyone else drinks +1.`);
          return;
        }

        const loserName =
          players.find((player) => player.id === data.drinkPlayerIds[0])?.name ||
          "Player";
        toast.success(`${loserName} drinks +1. Everyone else gets +1 point.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not resolve the round.");
      },
    }),
  );
  const nameTheSongNextRound = useMutation(
    trpc.games.nameTheSongNextRound.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Round ${data.roundNumber} is ready.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not move to the next song.");
      },
    }),
  );
  const guessTheMovieBuzz = useMutation(
    trpc.games.guessTheMovieBuzz.mutationOptions({
      onSuccess: (data) => {
        const playerName =
          players.find((player) => player.id === data.buzzedPlayerId)?.name ||
          "Player";
        toast.success(`${playerName} buzzed first. ${data.timerSeconds} seconds started.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not buzz in.");
      },
    }),
  );
  const guessTheMovieJudge = useMutation(
    trpc.games.guessTheMovieJudge.mutationOptions({
      onSuccess: (data) => {
        if (data.verdict === "CORRECT") {
          const winnerName =
            players.find((player) => player.id === data.pointPlayerIds[0])?.name ||
            "Player";
          toast.success(`${winnerName} gets +1 point. Everyone else drinks +1.`);
          return;
        }

        const loserName =
          players.find((player) => player.id === data.drinkPlayerIds[0])?.name ||
          "Player";
        toast.success(`${loserName} drinks +1. Everyone else gets +1 point.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not resolve the round.");
      },
    }),
  );
  const guessTheMovieNextRound = useMutation(
    trpc.games.guessTheMovieNextRound.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Round ${data.roundNumber} is ready.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not move to the next movie.");
      },
    }),
  );
  const blackjackHit = useMutation(
    trpc.games.blackjackHit.mutationOptions({
      onSuccess: (data) => {
        const playerName =
          players.find((player) => player.id === data.playerId)?.name || "Player";
        if (data.phase === "ROUND_RESULT") {
          toast.success(`Round settled. ${playerName} finished the table.`);
          return;
        }
        if (data.total > 21) {
          toast.error(`${playerName} busted with ${data.total}.`);
          return;
        }
        if (data.total === 21) {
          toast.success(`${playerName} made 21 and is locked in.`);
          return;
        }
        toast.success(`${playerName} hits to ${data.total}.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not draw a card.");
      },
    }),
  );
  const blackjackStand = useMutation(
    trpc.games.blackjackStand.mutationOptions({
      onSuccess: (data) => {
        const playerName =
          players.find((player) => player.id === data.playerId)?.name || "Player";
        if (data.phase === "ROUND_RESULT") {
          toast.success(`Dealer played out the round after ${playerName} stood.`);
          return;
        }
        const nextName =
          players.find((player) => player.id === data.currentPlayerId)?.name ||
          "next player";
        toast.success(`${playerName} stands. ${nextName} is up.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not stand.");
      },
    }),
  );
  const blackjackNextRound = useMutation(
    trpc.games.blackjackNextRound.mutationOptions({
      onSuccess: (data) => {
        const currentName =
          players.find((player) => player.id === data.currentPlayerId)?.name ||
          "first player";
        toast.success(`Round ${data.roundNumber} is live. ${currentName} starts.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not start the next round.");
      },
    }),
  );
  const pokerCall = useMutation(
    trpc.games.pokerCall.mutationOptions({
      onSuccess: (data) => {
        if (data.gameEnded) {
          toast.success("The table is down to one funded player. Poker has ended.");
          return;
        }
        if (data.phase === "SHOWDOWN") {
          toast.success("Hand finished. Check the showdown results below.");
          return;
        }
        const nextPlayerName =
          players.find((player) => player.id === data.currentPlayerId)?.name ||
          "next player";
        toast.success(`${data.action === "CHECK" ? "Checked" : "Called"}. ${nextPlayerName} is up.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not complete the action.");
      },
    }),
  );
  const pokerBet = useMutation(
    trpc.games.pokerBet.mutationOptions({
      onSuccess: (data) => {
        if (data.gameEnded) {
          setPokerBetPickerOpen(false);
          toast.success("That move ended the poker game. One player has all the chips left.");
          return;
        }
        if (data.phase === "SHOWDOWN") {
          toast.success("Bet placed and hand resolved.");
          return;
        }
        const nextPlayerName =
          players.find((player) => player.id === data.currentPlayerId)?.name ||
          "next player";
        setPokerBetPickerOpen(false);
        toast.success(`Bet placed. ${nextPlayerName} must respond.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not place the bet.");
      },
    }),
  );
  const pokerFold = useMutation(
    trpc.games.pokerFold.mutationOptions({
      onSuccess: (data) => {
        if (data.gameEnded) {
          toast.success("Poker ended automatically. Only one player still has chips.");
          return;
        }
        if (data.phase === "SHOWDOWN") {
          toast.success("Player folded and the hand ended.");
          return;
        }
        const nextPlayerName =
          players.find((player) => player.id === data.currentPlayerId)?.name ||
          "next player";
        toast.success(`Folded. ${nextPlayerName} is up.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not fold.");
      },
    }),
  );
  const pokerNextRound = useMutation(
    trpc.games.pokerNextRound.mutationOptions({
      onSuccess: (data) => {
        if (data.gameEnded) {
          toast.success("Poker is over. Only one player has chips left.");
          return;
        }
        const nextPlayerName =
          players.find((player) => player.id === data.currentPlayerId)?.name ||
          "first player";
        toast.success(`Hand ${data.roundNumber} started. ${nextPlayerName} acts first.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not deal the next hand.");
      },
    }),
  );
  const unoStart = useMutation(
    trpc.games.unoStart.mutationOptions({
      onSuccess: (data) => {
        const nextPlayerName =
          players.find((player) => player.id === data.currentPlayerId)?.name ||
          "first player";
        toast.success(`Uno round ${data.roundNumber} is live. ${nextPlayerName} starts.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not deal the Uno round.");
      },
    }),
  );
  const unoPlayCard = useMutation(
    trpc.games.unoPlayCard.mutationOptions({
      onSuccess: (data) => {
        if (data.winnerPlayerId) {
          const winnerName =
            players.find((player) => player.id === data.winnerPlayerId)?.name ||
            "Player";
          toast.success(`${winnerName} went out and won the Uno round.`);
          return;
        }

        const nextPlayerName =
          players.find((player) => player.id === data.currentPlayerId)?.name ||
          "next player";
        toast.success(`${nextPlayerName} is up.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not play that Uno card.");
      },
    }),
  );
  const unoDrawCard = useMutation(
    trpc.games.unoDrawCard.mutationOptions({
      onSuccess: (data) => {
        if (data.canPlayDrawnCard) {
          toast.success(`You drew ${data.drawnCard.label}. You can play it or pass.`);
          return;
        }

        const nextPlayerName =
          players.find((player) => player.id === data.currentPlayerId)?.name ||
          "next player";
        toast.success(`No play on the draw. ${nextPlayerName} is up.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not draw an Uno card.");
      },
    }),
  );
  const unoPassTurn = useMutation(
    trpc.games.unoPassTurn.mutationOptions({
      onSuccess: (data) => {
        const nextPlayerName =
          players.find((player) => player.id === data.currentPlayerId)?.name ||
          "next player";
        toast.success(`Turn passed. ${nextPlayerName} is up.`);
      },
      onError: (error) => {
        toast.error(error.message || "Could not pass the Uno turn.");
      },
    }),
  );
  const coupDeclareAction = useMutation(
    trpc.games.coupDeclareAction.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.games.getRoomState.queryFilter({
            roomId: String(roomId),
          }),
        );
        if (data.winnerPlayerId) {
          const winnerName =
            players.find((player) => player.id === data.winnerPlayerId)?.name ||
            "Winner";
          toast.success(`${winnerName} won the Coup.`);
          return;
        }
        toast.success(data.lastAction || "Coup action submitted.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not submit the Coup action.");
      },
    }),
  );
  const coupRespondDecision = useMutation(
    trpc.games.coupRespondDecision.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.games.getRoomState.queryFilter({
            roomId: String(roomId),
          }),
        );
        if (data.winnerPlayerId) {
          const winnerName =
            players.find((player) => player.id === data.winnerPlayerId)?.name ||
            "Winner";
          toast.success(`${winnerName} won the Coup.`);
          return;
        }
        toast.success(data.lastAction || "Coup response submitted.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not resolve the Coup response.");
      },
    }),
  );
  const coupRevealInfluence = useMutation(
    trpc.games.coupRevealInfluence.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.games.getRoomState.queryFilter({
            roomId: String(roomId),
          }),
        );
        if (data.winnerPlayerId) {
          const winnerName =
            players.find((player) => player.id === data.winnerPlayerId)?.name ||
            "Winner";
          toast.success(`${winnerName} won the Coup.`);
          return;
        }
        toast.success(data.lastAction || "Influence revealed.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not reveal influence.");
      },
    }),
  );
  const coupChooseExchange = useMutation(
    trpc.games.coupChooseExchange.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.games.getRoomState.queryFilter({
            roomId: String(roomId),
          }),
        );
        toast.success(data.lastAction || "Exchange resolved.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not complete the exchange.");
      },
    }),
  );
  const flip7Hit = useMutation(
    trpc.games.flip7Hit.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.games.getRoomState.queryFilter({
            roomId: String(roomId),
          }),
        );
        if (data.winnerPlayerId) {
          const winnerName =
            players.find((player) => player.id === data.winnerPlayerId)?.name ||
            "Winner";
          toast.success(`${winnerName} wins Flip 7 and gets +1 point.`);
          return;
        }
        toast.success(data.lastAction || "Card revealed.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not hit in Flip 7.");
      },
    }),
  );
  const flip7Stay = useMutation(
    trpc.games.flip7Stay.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.games.getRoomState.queryFilter({
            roomId: String(roomId),
          }),
        );
        if (data.status === "ROUND_OVER") {
          toast.success("Round locked in. Start the next round when ready.");
          return;
        }
        if (data.winnerPlayerId) {
          const winnerName =
            players.find((player) => player.id === data.winnerPlayerId)?.name ||
            "Winner";
          toast.success(`${winnerName} wins Flip 7 and gets +1 point.`);
          return;
        }
        toast.success(data.lastAction || "Round banked.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not stay in Flip 7.");
      },
    }),
  );
  const flip7ChooseTarget = useMutation(
    trpc.games.flip7ChooseTarget.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.games.getRoomState.queryFilter({
            roomId: String(roomId),
          }),
        );
        if (data.winnerPlayerId) {
          const winnerName =
            players.find((player) => player.id === data.winnerPlayerId)?.name ||
            "Winner";
          toast.success(`${winnerName} wins Flip 7 and gets +1 point.`);
          return;
        }
        toast.success(data.lastAction || "Action target chosen.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not assign the Flip 7 action.");
      },
    }),
  );
  const flip7AdvanceRound = useMutation(
    trpc.games.flip7AdvanceRound.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.games.getRoomState.queryFilter({
            roomId: String(roomId),
          }),
        );
        toast.success(data.lastAction || "Next Flip 7 round started.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not start the next Flip 7 round.");
      },
    }),
  );
  const rideTheBusGuess = useMutation(
    trpc.games.rideTheBusGuess.mutationOptions({
      onSuccess: (data) => {
        const playerName =
          players.find((player) => player.id === data.currentPlayerId)?.name ||
          players.find((player) => player.id === actualPlayer)?.name ||
          "Player";
        if (data.result === "WRONG") {
          toast.error(`${playerName} guessed wrong and restarts from step 1.`);
          return;
        }
        if (data.result === "COMPLETED_MAIN") {
          toast.success(`${playerName} cleared the ladder and is safe for now.`);
          return;
        }
        if (data.result === "BUS_ASSIGNED") {
          const riderName =
            players.find((player) => player.id === data.busRiderPlayerId)?.name ||
            "Player";
          toast.success(`${riderName} is riding the bus.`);
          return;
        }
        if (data.result === "ESCAPED") {
          const escapedName =
            players.find((player) => player.id === data.escapedPlayerId)?.name ||
            "Player";
          toast.success(`${escapedName} escaped the bus.`);
          return;
        }
        toast.success("Correct guess.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not submit guess.");
      },
    }),
  );
  const jokerLoopReorderCard = useMutation(
    trpc.games.jokerLoopReorderCard.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Could not reorder card.");
      },
    }),
  );
  const jokerLoopReady = useMutation(
    trpc.games.jokerLoopReady.mutationOptions({
      onSuccess: () => {
        toast.success("Ready confirmed. Next player can draw.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not mark ready.");
      },
    }),
  );
  const jokerLoopPickCard = useMutation(
    trpc.games.jokerLoopPickCard.mutationOptions({
      onSuccess: () => {
        toast.success("Card taken.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not take card.");
      },
    }),
  );
  const jokerLoopNextRound = useMutation(
    trpc.games.jokerLoopNextRound.mutationOptions({
      onSuccess: (data) => {
        if (data.clearedPlayerIds.length > 0) {
          toast.success("Pairs removed. Cleared players earned +1 point.");
        } else {
          toast.success("Pairs removed. Next round started.");
        }
      },
      onError: (error) => {
        toast.error(error.message || "Could not move to next round.");
      },
    }),
  );
  const jokerLoopRestart = useMutation(
    trpc.games.jokerLoopRestart.mutationOptions({
      onSuccess: () => {
        toast.success("Joker Loop restarted with a new shuffle.");
      },
      onError: (error) => {
        toast.error(error.message || "Could not restart Joker Loop.");
      },
    }),
  );

  const vote = useMutation(
    trpc.games.votePlayer.mutationOptions({
      onSuccess: () => {
        toast.success("Vote submitted!");
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error voting :", error);
        setClicked(false);
      },
    }),
  );

  const sendReaction = useMutation(
    trpc.games.sendReaction.mutationOptions({
      onError: (error) => {
        toast.error(error.message || "Could not send reaction.");
      },
    }),
  );

  const selectedGame = room?.game?.code || "never-have-i-ever";

  const game = room?.game;
  const currentQuestion = room?.currentQuestion;

  const players = React.useMemo(() => room?.players || [], [room?.players]);

  const [actualPlayer, setActualPlayer] = React.useState("");
  const [newPlayer, setNewPlayer] = React.useState("");
  const [newTeamPlayer, setNewTeamPlayer] = React.useState<{
    name: string;
    team: string;
  } | null>(null);
  const [selectedTeamPlayerId, setSelectedTeamPlayerId] = React.useState("");
  const [codenamesSelectedCardId, setCodenamesSelectedCardId] = React.useState<
    number | null
  >(null);
  const [nameTheSongTimerNow, setNameTheSongTimerNow] = React.useState(
    Date.now(),
  );
  const [guessTheMovieTimerNow, setGuessTheMovieTimerNow] = React.useState(
    Date.now(),
  );
  const [connectLettersTimerNow, setConnectLettersTimerNow] = React.useState(
    Date.now(),
  );
  const [connectLettersRedrawCooldown, setConnectLettersRedrawCooldown] =
    React.useState(0);
  const [secretPickerOpenStart, setSecretPickerOpenStart] = React.useState<
    number | null
  >(0);
  const [guessPickerOpenStart, setGuessPickerOpenStart] = React.useState<
    number | null
  >(0);
  const [jokerLoopHighlightedIndex, setJokerLoopHighlightedIndex] =
    React.useState<number | null>(null);
  const [openAddPlayerModal, setOpenAddPlayerModal] = React.useState(false);
  const [openChangeNameModal, setOpenChangeNameModal] = React.useState(false);
  const [updatedPlayerName, setUpdatedPlayerName] = React.useState("");
  const [showAddPlayerModal, setShowAddPlayerModal] = React.useState(false);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [showTopPlayersView, setShowTopPlayersView] = React.useState(false);
  const [whoAmINotes, setWhoAmINotes] = React.useState<WhoAmINote[]>([]);
  const [whoAmINoteDraft, setWhoAmINoteDraft] = React.useState("");
  const [reactionTargetId, setReactionTargetId] = React.useState<string>("ALL");
  const [lastReactionSentAt, setLastReactionSentAt] = React.useState<number>(0);
  const [reactionCooldownNow, setReactionCooldownNow] = React.useState<number>(
    Date.now(),
  );
  const [pokerBetPickerOpen, setPokerBetPickerOpen] = React.useState(false);
  const [pokerBetDraft, setPokerBetDraft] = React.useState(0);
  const [showPokerHandRankings, setShowPokerHandRankings] = React.useState(false);
  const [unoPendingWildCardId, setUnoPendingWildCardId] = React.useState<string | null>(
    null,
  );
  const [winningTeams, setWinningTeams] = React.useState<string[]>([]);
  const [forfited, setForfited] = React.useState<boolean>(false);
  const selectedActualPlayer = React.useMemo(
    () => players.find((player) => player.id === actualPlayer),
    [players, actualPlayer],
  );
  const whoAmINotesStorageKey = React.useMemo(() => {
    if (selectedGame !== "who-am-i" || !room?.id || !actualPlayer) {
      return null;
    }

    return `who-am-i-notes:${room.id}:${actualPlayer}`;
  }, [actualPlayer, room?.id, selectedGame]);
  const canCurrentPlayerChangeName = Boolean(
    selectedActualPlayer && !selectedActualPlayer.hasChangedName,
  );

  const TeamPlayerStats = React.useMemo(() => {
    if (!room || players.length === 0) {
      return {};
    }

    if (selectedGame !== "triviyay") {
      return {};
    }

    const teamStats = players.reduce((acc: TeamStats, player) => {
      if (!acc[player.team]) {
        acc[player.team] = { TotalPoints: 0, TotalDrinks: 0, Count: 0 };
      }
      acc[player.team].TotalPoints += player.points ?? 0;
      acc[player.team].TotalDrinks += player.drinks ?? 0;
      acc[player.team].Count += 1;
      return acc;
    }, {});

    return teamStats;
  }, [room, players, selectedGame]);

  const codenamesState = React.useMemo(() => {
    return parseCodenamesState(room?.currentAnswer);
  }, [room?.currentAnswer]);

  const codenamesBoard = React.useMemo(() => {
    if (!game?.questions || codenamesState.board.length === 0) return [];

    const questionMap = new Map(
      game.questions.map((question) => [question.id, question]),
    );
    return codenamesState.board.map((questionId) => ({
      id: questionId,
      text: questionMap.get(questionId)?.text || "Unknown",
      assignment: codenamesState.assignments[questionId] || "NEUTRAL",
      revealed: room?.previousQuestionsId?.includes(questionId) || false,
    }));
  }, [
    game?.questions,
    codenamesState.assignments,
    codenamesState.board,
    room?.previousQuestionsId,
  ]);

  const memoryChainState = React.useMemo(() => {
    return parseMemoryChainState(room?.currentAnswer);
  }, [room?.currentAnswer]);

  const memoryChainBoard = React.useMemo(() => {
    if (!game?.questions || memoryChainState.board.length === 0) return [];
    const questionMap = new Map(
      game.questions.map((question) => [question.id, question]),
    );
    return memoryChainState.board.map((questionId) => ({
      id: questionId,
      text: questionMap.get(questionId)?.text || "Unknown",
      revealed: memoryChainState.revealed.includes(questionId),
    }));
  }, [game?.questions, memoryChainState.board, memoryChainState.revealed]);

  const memoryChainSequence = React.useMemo(() => {
    if (!game?.questions || memoryChainState.sequence.length === 0) return [];
    const questionMap = new Map(
      game.questions.map((question) => [question.id, question]),
    );
    return memoryChainState.sequence.map((questionId) => ({
      id: questionId,
      text: questionMap.get(questionId)?.text || "Unknown",
    }));
  }, [game?.questions, memoryChainState.sequence]);

  const guessNumberState = React.useMemo(() => {
    return parseGuessTheNumberState(room?.currentAnswer);
  }, [room?.currentAnswer]);
  const badChoicesState = React.useMemo(() => {
    return parseBadChoicesState(room?.currentAnswer);
  }, [room?.currentAnswer]);
  const spinBottleState = React.useMemo(() => {
    return parseSpinBottleState(room?.currentAnswer);
  }, [room?.currentAnswer]);
  const coupState = React.useMemo(() => {
    return parseCoupState(room?.currentAnswer);
  }, [room?.currentAnswer]);
  const flip7State = React.useMemo(() => {
    return parseFlip7State(room?.currentAnswer);
  }, [room?.currentAnswer]);
  const badPeopleState = React.useMemo(() => {
    const parsed = parseBadPeopleState(room?.currentAnswer);
    return {
      ...parsed,
      dictatorPlayerId:
        parsed.dictatorPlayerId ?? room?.currentPlayerId ?? parsed.playerOrder[0] ?? null,
    };
  }, [room?.currentAnswer, room?.currentPlayerId]);
  const connectLettersState = React.useMemo(() => {
    return parseConnectLettersState(room?.currentAnswer);
  }, [room?.currentAnswer]);
  const ghostTearsState = React.useMemo(() => {
    return parseGhostTearsState(room?.currentAnswer);
  }, [room?.currentAnswer]);
  const nameTheSongState = React.useMemo(() => {
    return parseNameTheSongState(room?.currentAnswer);
  }, [room?.currentAnswer]);
  const guessTheMovieState = React.useMemo(() => {
    return parseGuessTheMovieState(room?.currentAnswer);
  }, [room?.currentAnswer]);
  const rideTheBusState = React.useMemo(() => {
    return parseRideTheBusState(room?.currentAnswer);
  }, [room?.currentAnswer]);
  const blackjackState = React.useMemo(() => {
    return parseBlackjackState(room?.currentAnswer);
  }, [room?.currentAnswer]);
  const pokerState = React.useMemo(() => {
    return parsePokerState(room?.currentAnswer);
  }, [room?.currentAnswer]);
  const unoState = React.useMemo(() => {
    return parseUnoState(room?.currentAnswer);
  }, [room?.currentAnswer]);

  React.useEffect(() => {
    if (selectedGame !== "uno") {
      setUnoPendingWildCardId(null);
      return;
    }

    if (!actualPlayer) {
      setUnoPendingWildCardId(null);
      return;
    }

    const myHand = unoState.handsByPlayerId[actualPlayer] ?? [];
    if (
      unoPendingWildCardId &&
      !myHand.some((card) => card.id === unoPendingWildCardId)
    ) {
      setUnoPendingWildCardId(null);
    }
  }, [actualPlayer, selectedGame, unoPendingWildCardId, unoState.handsByPlayerId]);
  const [blackjackDealerRevealPending, setBlackjackDealerRevealPending] =
    React.useState(false);
  const previousBlackjackDealerStateRef = React.useRef<{
    roundNumber: number;
    hiddenDealerCard: boolean;
  } | null>(null);
  const whoAmIState = React.useMemo(() => {
    return parseWhoAmIState(room?.currentAnswer);
  }, [room?.currentAnswer]);
  const jokerLoopState = React.useMemo(() => {
    return parseJokerLoopState(room?.currentAnswer);
  }, [room?.currentAnswer]);

  const nameTheSongQuestion = React.useMemo(() => {
    if (!game?.questions || !nameTheSongState.currentQuestionId) {
      return null;
    }

    return (
      game.questions.find(
        (question) => question.id === nameTheSongState.currentQuestionId,
      ) || null
    );
  }, [game?.questions, nameTheSongState.currentQuestionId]);
  const guessTheMovieQuestion = React.useMemo(() => {
    if (!game?.questions || !guessTheMovieState.currentQuestionId) {
      return null;
    }

    return (
      game.questions.find(
        (question) => question.id === guessTheMovieState.currentQuestionId,
      ) || null
    );
  }, [game?.questions, guessTheMovieState.currentQuestionId]);

  React.useEffect(() => {
    const previous = previousBlackjackDealerStateRef.current;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (!previous || previous.roundNumber !== blackjackState.roundNumber) {
      setBlackjackDealerRevealPending(false);
    } else if (previous.hiddenDealerCard && !blackjackState.hiddenDealerCard) {
      setBlackjackDealerRevealPending(true);
      timeoutId = setTimeout(() => {
        setBlackjackDealerRevealPending(false);
      }, 1000);
    } else if (blackjackState.hiddenDealerCard) {
      setBlackjackDealerRevealPending(false);
    }

    previousBlackjackDealerStateRef.current = {
      roundNumber: blackjackState.roundNumber,
      hiddenDealerCard: blackjackState.hiddenDealerCard,
    };

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [blackjackState.hiddenDealerCard, blackjackState.roundNumber]);

  React.useEffect(() => {
    if (selectedGame !== "poker") {
      setPokerBetPickerOpen(false);
      setPokerBetDraft(0);
      return;
    }

    const myStack = actualPlayer ? pokerState.stackByPlayerId[actualPlayer] ?? 0 : 0;
    const currentStreetBet = actualPlayer
      ? pokerState.playerBets[actualPlayer] ?? 0
      : 0;
    const maxTotalBet = myStack + currentStreetBet;
    const minimumAggressiveBet =
      myStack <= 0 || maxTotalBet <= pokerState.currentBet
        ? 0
        : getPokerMinimumAggressiveBetTotal({
            currentBet: pokerState.currentBet,
            currentStreetBet,
            stack: myStack,
            betStep: pokerState.betStep,
            bigBlindAmount: pokerState.bigBlindAmount,
          });

    if (pokerState.phase === "SHOWDOWN" || myStack <= 0 || minimumAggressiveBet <= 0) {
      setPokerBetPickerOpen(false);
    }

    setPokerBetDraft((currentDraft) => {
      if (myStack <= 0) return 0;
      if (minimumAggressiveBet <= 0) return 0;
      if (currentDraft <= 0 || currentDraft > maxTotalBet) {
        return minimumAggressiveBet;
      }
      return Math.max(
        minimumAggressiveBet,
        Math.min(
          maxTotalBet,
          Math.round(currentDraft / pokerState.betStep) * pokerState.betStep,
        ),
      );
    });
  }, [
    actualPlayer,
    pokerState.betStep,
    pokerState.bigBlindAmount,
    pokerState.currentBet,
    pokerState.phase,
    pokerState.playerBets,
    pokerState.roundNumber,
    pokerState.stackByPlayerId,
    selectedGame,
  ]);

  const whoAmICards = React.useMemo(() => {
    if (!game?.questions) return [];

    const questionMap = new Map(
      game.questions.map((question) => [question.id, question]),
    );

    return players.map((player) => {
      const questionId = whoAmIState.assignmentsByPlayerId[player.id];
      return {
        playerId: player.id,
        playerName: player.name,
        questionId,
        text: questionId ? questionMap.get(questionId)?.text || "Hidden" : "Hidden",
      };
    });
  }, [game?.questions, players, whoAmIState.assignmentsByPlayerId]);

  const codenamesUnassignedPlayers = React.useMemo(() => {
    if (!players.length) return [];

    if (selectedGame === "codenames") {
      return players;
    }

    if (actualPlayer) {
      return players.filter(
        (player) => player.id === actualPlayer && !player.team,
      );
    }

    return players.filter((player) => !player.team);
  }, [actualPlayer, players, selectedGame]);

  const codenamesIsReadyToStart = React.useMemo(() => {
    if (selectedGame !== "codenames") return false;
    const redCount = players.filter((player) => player.team === "RED").length;
    const blueCount = players.filter((player) => player.team === "BLUE").length;
    return players.length >= 4 && redCount > 0 && blueCount > 0;
  }, [players, selectedGame]);

  const SelectedOption = ({ option }: { option: string }) => {
    if (option === "FORFEIT") {
      setForfited((prev) => !prev);
      setWinningTeams([]);
      return;
    }

    if (!forfited) {
      if (!winningTeams.includes(option)) {
        setWinningTeams((prev) => [...prev, option]);
      } else {
        setWinningTeams((prev) => prev.filter((team) => team !== option));
      }
    }
  };

  const [timeLeft, setTimeLeft] = React.useState(
    selectedGame === "verbal-charades"
      ? 30
      : selectedGame === "taboo-lite"
        ? 45
        : 60,
  );
  const [isRunning, setIsRunning] = React.useState(false);
  const [showQRCode, setShowQRCode] = React.useState(false);
  const [isGameOverSoundPlaying, setIsGameOverSoundPlaying] =
    React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const codenamesIdentityInitializedRef = React.useRef(false);
  const losingSoundRef = React.useRef<HTMLAudioElement | null>(null);
  const gameOverSoundRef = React.useRef<HTMLAudioElement | null>(null);
  const gameOverSoundPoolRef = React.useRef<Set<HTMLAudioElement>>(new Set());
  const hasPlayedGameOverSoundRef = React.useRef(false);
  const previousDrinksByPlayerRef = React.useRef<Record<string, number>>({});
  const connectLettersAutoStopRef = React.useRef<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const playerAddedComment = React.useMemo(() => {
    return (comments?.length || 0) >= players.length;
  }, [comments, players]);

  const topPlayers = React.useMemo<TopPlayerEntry[]>(() => {
    return gameWideTopPlayers as TopPlayerEntry[];
  }, [gameWideTopPlayers]);

  const gameEndedWinners = React.useMemo<TopPlayerEntry[]>(() => {
    const rankedPlayers = players
      .map((player) => ({
        id: player.id,
        name: player.name,
        points: Math.max(0, player.points ?? 0),
        drinks: Math.max(0, player.drinks ?? 0),
        ratio: Math.max(0, player.points ?? 0) / Math.max(1, player.drinks ?? 0),
      }))
      .filter((player) => player.points > 0 || player.drinks > 0)
      .sort((a, b) => {
        if (b.ratio !== a.ratio) return b.ratio - a.ratio;
        if (b.points !== a.points) return b.points - a.points;
        if (a.drinks !== b.drinks) return a.drinks - b.drinks;
        return a.name.localeCompare(b.name);
      });

    const bestRatio = rankedPlayers[0]?.ratio;
    if (bestRatio === undefined) {
      return [];
    }

    return rankedPlayers.filter((player) => player.ratio === bestRatio);
  }, [players]);

  const typedRoomReactions = React.useMemo<RoomReaction[]>(() => {
    return roomReactions as RoomReaction[];
  }, [roomReactions]);

  const myMostUsedReactions = React.useMemo(() => {
    if (!actualPlayer) return DEFAULT_REACTION_EMOJIS;
    const emojiCount = new Map<string, number>();

    for (const reaction of typedRoomReactions) {
      if (reaction.senderPlayerId !== actualPlayer) continue;
      emojiCount.set(reaction.emoji, (emojiCount.get(reaction.emoji) ?? 0) + 1);
    }

    const topUsed = Array.from(emojiCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([emoji]) => emoji)
      .slice(0, 3);

    for (const fallbackEmoji of DEFAULT_REACTION_EMOJIS) {
      if (topUsed.length >= 3) break;
      if (!topUsed.includes(fallbackEmoji)) {
        topUsed.push(fallbackEmoji);
      }
    }

    return topUsed;
  }, [actualPlayer, typedRoomReactions]);

  const latestMyReactionAt = React.useMemo(() => {
    if (!actualPlayer) return 0;

    let latest = 0;
    for (const reaction of typedRoomReactions) {
      if (reaction.senderPlayerId !== actualPlayer) continue;
      const timestamp = new Date(reaction.createdAt).getTime();
      if (timestamp > latest) latest = timestamp;
    }

    return latest;
  }, [actualPlayer, typedRoomReactions]);

  React.useEffect(() => {
    if (latestMyReactionAt > lastReactionSentAt) {
      setLastReactionSentAt(latestMyReactionAt);
    }
  }, [lastReactionSentAt, latestMyReactionAt]);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setReactionCooldownNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const reactionCooldownRemainingMs = Math.max(
    0,
    REACTION_COOLDOWN_MS - (reactionCooldownNow - lastReactionSentAt),
  );

  const canSendReaction =
    Boolean(actualPlayer) &&
    Boolean(room?.id) &&
    !room?.gameEnded &&
    reactionCooldownRemainingMs === 0;

  const visibleReactions = React.useMemo(() => {
    const now = Date.now();

    return typedRoomReactions.filter((reaction) => {
      const createdAt = new Date(reaction.createdAt).getTime();
      if (now - createdAt > REACTION_VISIBLE_WINDOW_MS) return false;
      if (reaction.targetPlayerId == null) return true;
      if (!actualPlayer) return false;
      return (
        reaction.targetPlayerId === actualPlayer ||
        reaction.senderPlayerId === actualPlayer
      );
    });
  }, [actualPlayer, typedRoomReactions]);

  const handleSendReaction = React.useCallback(
    (emoji: string) => {
      if (!room?.id || !actualPlayer) {
        toast.error("Select your player first.");
        return;
      }
      if (!canSendReaction) {
        toast.error(
          `You can react again in ${Math.ceil(reactionCooldownRemainingMs / 1000)}s.`,
        );
        return;
      }

      sendReaction.mutate(
        {
          roomId: room.id,
          senderPlayerId: actualPlayer,
          targetPlayerId:
            reactionTargetId === "ALL" ? undefined : reactionTargetId,
          emoji,
        },
        {
          onSuccess: () => {
            setLastReactionSentAt(Date.now());
          },
        },
      );
    },
    [
      actualPlayer,
      canSendReaction,
      reactionCooldownRemainingMs,
      reactionTargetId,
      room?.id,
      sendReaction,
    ],
  );

  React.useEffect(() => {
    if (reactionTargetId === "ALL") return;
    if (!players.some((player) => player.id === reactionTargetId)) {
      setReactionTargetId("ALL");
      return;
    }
    if (reactionTargetId === actualPlayer) {
      setReactionTargetId("ALL");
    }
  }, [actualPlayer, players, reactionTargetId]);

  React.useEffect(() => {
    if (!room?.gameEnded) {
      setShowTopPlayersView(false);
    }
  }, [room?.gameEnded]);

  const nextCharadeCard = useMutation(
    trpc.games.nextCharadeCard.mutationOptions({
      onSuccess: () => {
        toast.success("Next card coming up!");
        setIsRunning(false);
        setTimeLeft(selectedGame === "taboo-lite" ? 45 : 30);
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error changing card:", error);
        setClicked(false);
      },
    }),
  );

  const handleCreateComment = (
    comment: string,
    rating: number,
    roomId: string,
  ) => {
    if (!roomId || comment.trim() === "" || playerAddedComment || !actualPlayer)
      return;

    createComment.mutate({
      playerId: actualPlayer || "",
      playerName: players.find((p) => p.id === actualPlayer)?.name || "",
      playerRating: String(rating),
      roomId: String(roomId),
      comment,
    });
  };

  const nextCatherineCard = useMutation(
    trpc.games.nextCatherineCard.mutationOptions({
      onSuccess: () => {
        toast.success("Next card coming up!");
        setIsRunning(false);
        setTimeLeft(60);
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error changing card:", error);
        setClicked(false);
      },
    }),
  );

  const nextYouLaughYouDrinkCard = useMutation(
    trpc.games.nextYouLaughYouDrinkCard.mutationOptions({
      onSuccess: () => {
        toast.success("Round locked in.");
        setClicked(false);
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error changing card:", error);
        setClicked(false);
      },
    }),
  );

  const handleAddPlayer = React.useCallback(() => {
    if (!newPlayer.trim()) {
      toast.error("Please enter a player name.");
      return;
    }

    const playerExists = players.some((p) => p.name === newPlayer.trim());
    if (playerExists) {
      toast.error("Player already exists.");
      return;
    }

    addNewPlayer.mutate({
      gamecode: game?.code || "",
      roomId: room?.id || "",
      newPlayer: newPlayer.trim(),
    });
    setNewPlayer("");
    setOpenAddPlayerModal(false);
  }, [newPlayer, players, room, addNewPlayer, game]);

  const handleAddPlayerToTeam = React.useCallback(
    ({ team, playerName }: { team: string; playerName: string }) => {
      if (!playerName.trim()) {
        toast.error("Please enter a player name.");
        return;
      }

      addNewPlayerToTeam.mutate({
        gamecode: game?.code || "",
        roomId: room?.id || "",
        newPlayer: playerName.trim(),
        team: team.trim(),
      });
      setNewTeamPlayer(null);
      setOpenAddPlayerModal(false);
    },
    [room, game, addNewPlayerToTeam],
  );

  const handleAssignExistingPlayerToTeam = React.useCallback(
    ({ team, playerId }: { team: string; playerId: string }) => {
      if (!team.trim() || !playerId.trim()) {
        toast.error("Please select a team and your name.");
        return;
      }

      assignPlayerTeam.mutate({
        roomId: room?.id || "",
        playerId: playerId.trim(),
        team: team.trim() as "RED" | "BLUE",
      });
      setActualPlayer(playerId.trim());
      localStorage.setItem("actualPlayerId", playerId.trim());
      setSelectedTeamPlayerId("");
      setOpenAddPlayerModal(false);
    },
    [assignPlayerTeam, room?.id],
  );

  const canAddPlayers =
    (actualPlayer === players[0]?.id ||
      selectedGame === "codenames" ||
      selectedGame === "blackjack" ||
      selectedGame === "poker") &&
    !(selectedGame === "uno" && room?.startedAt);

  const handleChangePlayerName = React.useCallback(() => {
    if (!actualPlayer) {
      toast.error("Select your player first.");
      return;
    }
    if (selectedActualPlayer?.hasChangedName) {
      toast.error("You can only change your name once.");
      return;
    }

    const nextName = updatedPlayerName.trim();
    if (!nextName) {
      toast.error("Please enter a player name.");
      return;
    }
    if (
      selectedActualPlayer &&
      selectedActualPlayer.name.toLowerCase() === nextName.toLowerCase()
    ) {
      toast.error("Please enter a different name.");
      return;
    }

    const playerExists = players.some(
      (player) =>
        player.id !== actualPlayer &&
        player.name.toLowerCase() === nextName.toLowerCase(),
    );

    if (playerExists) {
      toast.error("Player already exists.");
      return;
    }

    changePlayerName.mutate({
      roomId: room?.id || "",
      playerId: actualPlayer,
      newName: nextName,
    });
  }, [
    actualPlayer,
    selectedActualPlayer,
    updatedPlayerName,
    players,
    changePlayerName,
    room?.id,
  ]);

  const handleActualSelectPlayer = (id: string) => {
    setActualPlayer(id);
    localStorage.setItem("actualPlayerId", id);
    setShowAddPlayerModal(false);
  };

  React.useLayoutEffect(() => {
    if (selectedGame === "codenames") {
      if (codenamesIdentityInitializedRef.current) {
        return;
      }

      const navEntry = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      const isReload =
        navEntry?.type === "reload" ||
        // Fallback for older navigation API.
        (performance as Performance & { navigation?: { type?: number } })
          .navigation?.type === 1;

      if (isReload) {
        setActualPlayer("");
        localStorage.removeItem("actualPlayerId");
      } else {
        const storedPlayerId = localStorage.getItem("actualPlayerId");
        if (storedPlayerId) {
          setActualPlayer(storedPlayerId);
        }
      }

      codenamesIdentityInitializedRef.current = true;
      return;
    }

    codenamesIdentityInitializedRef.current = false;

    const storedPlayerId = localStorage.getItem("actualPlayerId");
    if (storedPlayerId) {
      setActualPlayer(storedPlayerId);
    }

    if (room?.gameEnded) {
      localStorage.removeItem("actualPlayerId");
    }

    return () => {
      localStorage.removeItem("actualPlayerId");
    };
  }, [room, selectedGame]);

  React.useEffect(() => {
    if (selectedGame !== "codenames" || room?.gameEnded) {
      return;
    }

    const selectedPlayer = players.find((player) => player.id === actualPlayer);
    const needsTeamSelection =
      !actualPlayer || Boolean(selectedPlayer && !selectedPlayer.team);

    setOpenAddPlayerModal(needsTeamSelection);
  }, [actualPlayer, players, room?.gameEnded, selectedGame]);

  React.useEffect(() => {
    if (!whoAmINotesStorageKey || typeof window === "undefined") {
      setWhoAmINotes([]);
      setWhoAmINoteDraft("");
      setWhoAmINotesOpen(false);
      return;
    }

    const rawNotes = window.localStorage.getItem(whoAmINotesStorageKey);
    if (!rawNotes) {
      setWhoAmINotes([]);
      return;
    }

    try {
      const parsedNotes = JSON.parse(rawNotes) as WhoAmINote[];
      setWhoAmINotes(
        Array.isArray(parsedNotes)
          ? parsedNotes.filter(
              (note) =>
                typeof note?.id === "string" &&
                typeof note?.text === "string" &&
                typeof note?.createdAt === "string",
            )
          : [],
      );
    } catch {
      setWhoAmINotes([]);
    }
  }, [whoAmINotesStorageKey]);

  React.useEffect(() => {
    if (!whoAmINotesStorageKey || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      whoAmINotesStorageKey,
      JSON.stringify(whoAmINotes),
    );
  }, [whoAmINotes, whoAmINotesStorageKey]);

  const handleSaveWhoAmINote = React.useCallback(() => {
    const trimmedNote = whoAmINoteDraft.trim();

    if (!trimmedNote) {
      toast.error("Enter a note first.");
      return;
    }

    if (!whoAmINotesStorageKey) {
      toast.error("Pick your player before adding notes.");
      return;
    }

    setWhoAmINotes((prev) => [
      {
        id: `${Date.now()}-${prev.length}`,
        text: trimmedNote,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setWhoAmINoteDraft("");
    setWhoAmINotesOpen(false);
  }, [whoAmINoteDraft, whoAmINotesStorageKey]);

  React.useEffect(() => {
    // Reset one-time guard for each page load of a room,
    // so a browser refresh can replay the game-over music once.
    if (!room?.id) return;
    hasPlayedGameOverSoundRef.current = false;
    for (const audio of gameOverSoundPoolRef.current) {
      audio.pause();
      audio.currentTime = 0;
    }
    gameOverSoundPoolRef.current.clear();
    gameOverSoundRef.current = null;
  }, [room?.id]);

  React.useEffect(() => {
    if (!room?.id || !room.gameEnded || hasPlayedGameOverSoundRef.current) {
      return;
    }

    const audio = new Audio(GAME_OVER_SOUND_PATH);
    audio.preload = "auto";
    audio.currentTime = 0;
    gameOverSoundRef.current = audio;
    gameOverSoundPoolRef.current.add(audio);
    hasPlayedGameOverSoundRef.current = true;
    void audio
      .play()
      .then(() => {
        setIsGameOverSoundPlaying(true);
      })
      .catch(() => {
        setIsGameOverSoundPlaying(false);
        // Ignore autoplay/permission errors silently.
      });
  }, [room?.gameEnded, room?.id]);

  React.useEffect(() => {
    const audio = gameOverSoundRef.current;
    if (!audio) return;

    const onEnded = () => {
      gameOverSoundPoolRef.current.delete(audio);
      setIsGameOverSoundPlaying(gameOverSoundPoolRef.current.size > 0);
    };
    const onPause = () => {
      gameOverSoundPoolRef.current.delete(audio);
      setIsGameOverSoundPlaying(gameOverSoundPoolRef.current.size > 0);
    };

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
    };
  }, [room?.id, room?.gameEnded]);

  const handleStopGameOverSound = React.useCallback(() => {
    for (const audio of gameOverSoundPoolRef.current) {
      audio.pause();
      audio.currentTime = 0;
    }
    gameOverSoundPoolRef.current.clear();
    gameOverSoundRef.current = null;
    setIsGameOverSoundPlaying(false);
  }, []);

  const playLosingSound = React.useCallback(async () => {
    const candidateSources = [
      LOSING_MEME_SOUND_PATH,
      LOSING_MEME_FALLBACK_SOUND_PATH,
    ];

    for (const source of candidateSources) {
      const audio = new Audio(source);
      audio.preload = "auto";
      audio.currentTime = 0;
      try {
        await audio.play();
        losingSoundRef.current = audio;
        return true;
      } catch {
        // Try next fallback source.
      }
    }

    return false;
  }, []);

  React.useEffect(() => {
    if (!room?.id || !actualPlayer) {
      return;
    }

    const me = players.find((player) => player.id === actualPlayer);
    if (!me) {
      return;
    }

    const currentDrinks = Math.max(0, me.drinks ?? 0);
    const previousDrinks = previousDrinksByPlayerRef.current[actualPlayer];

    if (typeof previousDrinks !== "number") {
      previousDrinksByPlayerRef.current[actualPlayer] = currentDrinks;
      return;
    }

    const previousStep = Math.floor(previousDrinks / DRINK_ALERT_STEP);
    const currentStep = Math.floor(currentDrinks / DRINK_ALERT_STEP);

    const crossedThresholds: number[] = [];
    if (currentStep > previousStep) {
      for (let step = previousStep + 1; step <= currentStep; step += 1) {
        const threshold = step * DRINK_ALERT_STEP;
        if (threshold > 0) {
          crossedThresholds.push(threshold);
        }
      }
    }

    let shouldPlay = false;
    for (const threshold of crossedThresholds) {
      const thresholdStorageKey = `room-drink-sound:${room.id}:${actualPlayer}:${threshold}`;
      if (localStorage.getItem(thresholdStorageKey) !== "1") {
        localStorage.setItem(thresholdStorageKey, "1");
        shouldPlay = true;
      }
    }

    if (shouldPlay) {
      void playLosingSound();
    }

    previousDrinksByPlayerRef.current[actualPlayer] = currentDrinks;
  }, [actualPlayer, playLosingSound, players, room?.id]);

  React.useEffect(() => {
    if (selectedGame !== "codenames" || codenamesState.status !== "LOBBY") {
      return;
    }

    if (
      codenamesIsReadyToStart &&
      (!room?.playerOneId || !room?.playerTwoId) &&
      !codenamesAutoAssignSpymasters.isPending
    ) {
      codenamesAutoAssignSpymasters.mutate({
        roomId: room?.id || "",
      });
    }
  }, [
    codenamesAutoAssignSpymasters,
    codenamesIsReadyToStart,
    codenamesState.status,
    room?.id,
    room?.playerOneId,
    room?.playerTwoId,
    selectedGame,
  ]);

  const nameTheSongSecondsLeft = React.useMemo(() => {
    if (selectedGame !== "name-the-song") {
      return NAME_THE_SONG_TIMER_SECONDS;
    }
    if (
      nameTheSongState.status !== "BUZZED" ||
      !nameTheSongState.attemptStartedAt
    ) {
      return NAME_THE_SONG_TIMER_SECONDS;
    }

    const startedAt = new Date(nameTheSongState.attemptStartedAt).getTime();
    if (!Number.isFinite(startedAt)) {
      return NAME_THE_SONG_TIMER_SECONDS;
    }

    const elapsedSeconds = Math.floor((nameTheSongTimerNow - startedAt) / 1000);
    return Math.max(NAME_THE_SONG_TIMER_SECONDS - elapsedSeconds, 0);
  }, [
    nameTheSongState.attemptStartedAt,
    nameTheSongState.status,
    nameTheSongTimerNow,
    selectedGame,
  ]);

  const guessTheMovieSecondsLeft = React.useMemo(() => {
    if (selectedGame !== "guess-the-movie") {
      return GUESS_THE_MOVIE_TIMER_SECONDS;
    }
    if (
      guessTheMovieState.status !== "BUZZED" ||
      !guessTheMovieState.attemptStartedAt
    ) {
      return GUESS_THE_MOVIE_TIMER_SECONDS;
    }

    const startedAt = new Date(guessTheMovieState.attemptStartedAt).getTime();
    if (!Number.isFinite(startedAt)) {
      return GUESS_THE_MOVIE_TIMER_SECONDS;
    }

    const elapsedSeconds = Math.floor((guessTheMovieTimerNow - startedAt) / 1000);
    return Math.max(GUESS_THE_MOVIE_TIMER_SECONDS - elapsedSeconds, 0);
  }, [
    guessTheMovieState.attemptStartedAt,
    guessTheMovieState.status,
    guessTheMovieTimerNow,
    selectedGame,
  ]);

  React.useEffect(() => {
    if (selectedGame !== "name-the-song") {
      return;
    }
    if (nameTheSongState.status !== "BUZZED") {
      return;
    }

    const interval = setInterval(() => {
      setNameTheSongTimerNow(Date.now());
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, [nameTheSongState.status, selectedGame]);

  React.useEffect(() => {
    if (selectedGame !== "guess-the-movie") {
      return;
    }
    if (guessTheMovieState.status !== "BUZZED") {
      return;
    }

    const interval = setInterval(() => {
      setGuessTheMovieTimerNow(Date.now());
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, [guessTheMovieState.status, selectedGame]);

  const connectLettersSecondsLeft = React.useMemo(() => {
    if (selectedGame !== "connect-the-letters") {
      return connectLettersState.timerSeconds;
    }
    if (
      connectLettersState.phase !== "TIMER_RUNNING" ||
      !connectLettersState.attemptStartedAt
    ) {
      return connectLettersState.timerSeconds;
    }

    const startedAt = new Date(connectLettersState.attemptStartedAt).getTime();
    if (!Number.isFinite(startedAt)) {
      return connectLettersState.timerSeconds;
    }

    const elapsedSeconds = Math.floor((connectLettersTimerNow - startedAt) / 1000);
    return Math.max(connectLettersState.timerSeconds - elapsedSeconds, 0);
  }, [
    connectLettersState.attemptStartedAt,
    connectLettersState.phase,
    connectLettersState.timerSeconds,
    connectLettersTimerNow,
    selectedGame,
  ]);

  React.useEffect(() => {
    if (selectedGame !== "connect-the-letters") {
      return;
    }
    if (connectLettersState.phase !== "TIMER_RUNNING") {
      return;
    }

    const interval = setInterval(() => {
      setConnectLettersTimerNow(Date.now());
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, [connectLettersState.phase, selectedGame]);

  React.useEffect(() => {
    if (selectedGame !== "connect-the-letters") {
      connectLettersAutoStopRef.current = null;
      return;
    }
    const isInCurrentPair =
      Boolean(actualPlayer) &&
      Boolean(connectLettersState.currentPair?.includes(actualPlayer));
    if (
      connectLettersState.phase !== "TIMER_RUNNING" ||
      !room?.id ||
      !actualPlayer ||
      !isInCurrentPair
    ) {
      connectLettersAutoStopRef.current = null;
      return;
    }

    const autoStopKey = `${room.id}:${connectLettersState.attemptStartedAt}`;
    if (connectLettersSecondsLeft > 0) {
      connectLettersAutoStopRef.current = null;
      return;
    }

    if (connectLettersAutoStopRef.current === autoStopKey) {
      return;
    }

    connectLettersAutoStopRef.current = autoStopKey;
    connectLettersStopTimer.mutate({
      roomId: room.id,
      playerId: actualPlayer,
    });
  }, [
    actualPlayer,
    connectLettersSecondsLeft,
    connectLettersState.attemptStartedAt,
    connectLettersState.currentPair,
    connectLettersState.phase,
    connectLettersStopTimer,
    room?.id,
    selectedGame,
  ]);

  React.useEffect(() => {
    if (connectLettersRedrawCooldown <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      setConnectLettersRedrawCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [connectLettersRedrawCooldown]);

  React.useEffect(() => {
    if (selectedGame !== "joker-loop") return;
    setJokerLoopHighlightedIndex(null);
  }, [
    jokerLoopState.activeGiverPlayerId,
    jokerLoopState.activePickerPlayerId,
    jokerLoopState.phase,
    jokerLoopState.roundNumber,
    selectedGame,
  ]);

  // Convert seconds to MM:SS
  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }

  React.useEffect(() => {
    setQuote(getRandomDrinkingQuote());
  }, []);

  React.useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  React.useEffect(() => {
    if (timeLeft === 0 && timerRef.current) {
      clearInterval(timerRef.current);
      setIsRunning(false);
    }
  }, [timeLeft]);

  const handleStart = () => {
    if (timeLeft > 0) setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeLeft(0);
  };

  // const handleReset = () => {
  //   setIsRunning(false);
  //   setTimeLeft(60);
  // };

  const playerNamesA = room?.questionAVotes
    .map((id) => {
      const player = players.find((p) => p.id === id);
      return player ? player.name : null;
    })
    .filter((name) => name !== null)
    .join(", ");
  const playerNamesB = room?.questionBVotes
    .map((id) => {
      const player = players.find((p) => p.id === id);
      return player ? player.name : null;
    })
    .filter((name) => name !== null)
    .join(", ");

  const actionButtonText = React.useMemo(() => {
    if (!room) {
      return "";
    }

    const currentCardQuestion = room?.game.questions.find(
      (q) => q.id === Number(room?.currentQuestionId),
    );

    const edition = currentCardQuestion?.edition;

    if (edition === 1) {
      return "Command Done";
    }

    if (edition === 2) {
      return "Challenge Done";
    }

    if (edition === 4) {
      return "Answered Truthfully";
    }

    return "";
  }, [room]);

  const questionTypePickACard = React.useMemo(() => {
    if (!room) {
      return "";
    }

    const currentCardQuestion = room?.game.questions.find(
      (q) => q.id === Number(room?.currentQuestionId),
    );

    const edition = currentCardQuestion?.edition;

    if (edition === 1) {
      return "🟩 COMMAND CARD";
    }

    if (edition === 2) {
      return "🟧 CHALLENGE CARD";
    }
    if (edition === 3) {
      return "🟥 GAME TWIST CARD";
    }
    if (edition === 4) {
      return "🟦 PERSONAL QUESTION";
    }

    return "🟩 QUESTION";
  }, [room]);

  const kingsCupCardInfo = React.useMemo(() => {
    const edition = currentQuestion?.edition;

    if (edition === 1) return "ACE - Waterfall";
    if (edition === 2) return "TWO - You";
    if (edition === 3) return "THREE - Me";
    if (edition === 4) return "FOUR - Floor";
    if (edition === 5) return "FIVE - Guys";
    if (edition === 6) return "SIX - Chicks";
    if (edition === 7) return "SEVEN - Heaven";
    if (edition === 8) return "EIGHT - Mate";
    if (edition === 9) return "NINE - Rhyme";
    if (edition === 10) return "TEN - Categories";
    if (edition === 11) return "JACK - Make a Rule";
    if (edition === 12) return "QUEEN - Question Master";
    if (edition === 13) return "KING - King's Cup";

    return "Draw a Card";
  }, [currentQuestion?.edition]);

  const tabooForbiddenWords = React.useMemo(() => {
    if (!currentQuestion?.answer) {
      return [];
    }

    return currentQuestion.answer
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean);
  }, [currentQuestion?.answer]);

  const wouldRatherResult = React.useMemo(() => {
    if (!room) {
      return "";
    }
    if (
      room?.questionAVotes?.length + room?.questionBVotes?.length !==
      room?.players.length
    ) {
      return "Pick One🙃";
    }

    if (
      room?.questionAVotes.length > 0 &&
      room?.questionBVotes.length > 0 &&
      room?.questionAVotes.length === room?.questionBVotes.length
    ) {
      return "Result: All players please take a shot 😅";
    }

    if (
      room?.questionAVotes.length > 0 &&
      room?.questionBVotes.length > 0 &&
      room?.questionAVotes.length < room?.questionBVotes.length
    ) {
      return `Result: Players ${playerNamesA} please take a shot 😅`;
    }

    if (
      room?.questionAVotes.length > 0 &&
      room?.questionBVotes.length > 0 &&
      room?.questionAVotes.length > room?.questionBVotes.length
    ) {
      return `Result: Players ${playerNamesB} please take a shot 😅`;
    }

    return `Result: Suprisingly Y'all are safe 😒`;
  }, [room, playerNamesA, playerNamesB]);

  const OptionsColors = React.useCallback(
    (team: string) => {
      if (forfited && team === "FORFEIT") {
        return "bg-red-600 text-white";
      } else if (team === "FORFEIT") {
        return "bg-red-600/30";
      }

      if (winningTeams.length > 0) {
        if (winningTeams.includes(team)) {
          return "bg-green-600 text-white";
        } else {
          return "bg-white/20";
        }
      }

      // ✅ DEFAULT
      return "bg-white/20";
    },
    [winningTeams, forfited],
  );

  if (isLoading) return <Loading />;
  if (error)
    //@ts-expect-error leave it
    return <ErrorPage error={error} reset={() => window.location.reload()} />;
  if (!room) return <div>Room not found.</div>;

  if (!room)
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6 flex items-center justify-center">
        <div>
          <h1 className="text-2xl font-bold mb-4 ">
            Sadly we cannot find your room😑
          </h1>

          <Link href="/" className="mt-6 inline-block self-center ">
            <Button>Go back home</Button>
          </Link>
        </div>
      </div>
    );

  const totalPoints = players.reduce((sum, player) => {
    return sum + (player.drinks || 0); // handles undefined/null
  }, 0);

  const PlayerScore = ({
    points,
    drinks,
    player,
  }: {
    points: number | null;
    drinks: number | null;
    player: string;
  }) => (
    <div className="w-full min-w-0 rounded-xl border border-white/20 bg-white/10 p-3 text-center backdrop-blur-sm sm:rounded-lg sm:p-4">
      <div className="mb-1 truncate text-base font-bold text-white sm:text-lg" title={player}>
        {player}
      </div>
      <div className="mb-1 text-base font-bold leading-tight whitespace-nowrap text-emerald-400 sm:text-2xl">
        {points || 0}{" "}
        {selectedGame === "most-likely" || selectedGame === "paranoia"
          ? "votes"
          : "pts"}
      </div>
      <div className="text-xs text-orange-300 sm:text-sm">{drinks || 0} drinks</div>
    </div>
  );

  if (room.gameEnded) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6 flex items-center justify-center ">
        <Button
          onClick={handleStopGameOverSound}
          disabled={!isGameOverSoundPlaying}
          size="icon"
          variant="secondary"
          className="absolute right-6 top-6"
          aria-label="Stop music"
          title="Stop music"
        >
          <VolumeX className="h-5 w-5" />
        </Button>
        {showAddPlayerModal && (
          <UserConfirmModal
            players={players}
            handleActualSelectPlayer={handleActualSelectPlayer}
          />
        )}
        {showTopPlayersView ? (
          <TopPlayersView
            topPlayers={topPlayers}
            selectedGame={selectedGame}
            onBack={() => setShowTopPlayersView(false)}
          />
        ) : (
          <div>
            <h1 className="text-4xl font-bold mb-4">Game Over</h1>
            <h1 className="text-2xl font-bold mb-4 ">Game: {game?.name ?? ""}</h1>
            <div className="">
              <h1 className="text-xl font-bold mb-4 text-wrap">
                Game Status: {totalPoints} Drinks : {quote}
              </h1>
            </div>
            <GameEndedWinners
              winners={gameEndedWinners}
              selectedGame={selectedGame}
            />
            {selectedGame === "triviyay" && (
              <>
                <div className="flex flex-row items-center justify-around flex-wrap bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20 my-4">
                  {room?.playingTeams.map((team) => (
                    <div key={team}>
                      <div className="font-bold text-lg text-white mb-1">
                        Team: {team} ({TeamPlayerStats[team]?.Count || 0})
                      </div>
                      <div className="text-2xl font-bold text-emerald-400 mb-1">
                        {TeamPlayerStats[team]?.TotalPoints} pts
                      </div>
                      <div className="text-sm text-orange-300">
                        {TeamPlayerStats[team]?.TotalDrinks} drinks
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {players.map((player) => (
                <PlayerScore
                  key={player.id}
                  points={player.points}
                  drinks={player.drinks}
                  player={player.name}
                />
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => setShowTopPlayersView(true)}
              >
                <Trophy className="h-4 w-4 mr-2" />
                View Top 10 Players
              </Button>
              <Link href="/" className="w-full sm:w-auto">
                <Button className="w-full">Go back home</Button>
              </Link>
              {!playerAddedComment && actualPlayer && (
                <EndGameFeedback
                  handleCreateComment={handleCreateComment}
                  roomId={room?.id || ""}
                  setComment={setComment}
                  comment={comment}
                  setRating={setPlayerRating}
                  rating={playerRating}
                  openDialog={openDialog}
                  setOpenDialog={setOpenDialog}
                />
              )}
              {actualPlayer === "" && !playerAddedComment && (
                <Button
                  onClick={() => {
                    setShowAddPlayerModal(true);
                  }}
                >
                  Leave a Comment
                </Button>
              )}
            </div>
            <div className="mt-4">
              <p className="text-white/70 italic">
                Date: {room?.createdAt.toDateString()}
              </p>
            </div>

            <div className="mt-10">
              <GameComments
                comments={
                  comments?.map((c) => {
                    return {
                      id: c.id,
                      comment: c.content,
                      rating: c.raiting,
                      createdAt: c.createdAt,
                      playerName: c.playerName,
                    };
                  }) || []
                }
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {actualPlayer === "" && selectedGame !== "codenames" && (
        <UserConfirmModal
          players={players}
          handleActualSelectPlayer={handleActualSelectPlayer}
          selectedGame={selectedGame}
        />
      )}
      {canAddPlayers && (
        <AddPlayerModal
          newPlayer={newPlayer}
          setNewPlayer={setNewPlayer}
          newTeamPlayer={newTeamPlayer}
          setNewTeamPlayer={setNewTeamPlayer}
          handleAddPlayer={handleAddPlayer}
          handleAddPlayerToTeam={handleAddPlayerToTeam}
          openAddPlayerModal={openAddPlayerModal}
          setOpenAddPlayerModal={setOpenAddPlayerModal}
          selectedGame={selectedGame}
          teams={
            selectedGame === "codenames"
              ? ["RED", "BLUE"]
              : room?.playingTeams || []
          }
          teamPlayers={codenamesUnassignedPlayers}
          selectedTeamPlayerId={selectedTeamPlayerId}
          setSelectedTeamPlayerId={setSelectedTeamPlayerId}
          handleAssignExistingPlayerToTeam={handleAssignExistingPlayerToTeam}
        />
      )}
      <Dialog open={openChangeNameModal} onOpenChange={setOpenChangeNameModal}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Player Name</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              handleChangePlayerName();
            }}
          >
            <Input
              type="text"
              placeholder="Enter new player name"
              value={updatedPlayerName}
              onChange={(event) => setUpdatedPlayerName(event.target.value)}
              maxLength={40}
              autoFocus
              disabled={changePlayerName.isPending || !canCurrentPlayerChangeName}
            />
            {!canCurrentPlayerChangeName && (
              <p className="text-sm text-white/80">
                You already used your one allowed name change.
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={changePlayerName.isPending || !canCurrentPlayerChangeName}
            >
              {changePlayerName.isPending ? "Saving..." : "Save Name"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {selectedGame === "who-am-i" && (
        <Dialog open={whoAmINotesOpen} onOpenChange={setWhoAmINotesOpen}>
          <DialogContent className="w-[calc(100%-2rem)] border border-white/10 bg-zinc-950 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add note</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Textarea
                value={whoAmINoteDraft}
                onChange={(event) =>
                  setWhoAmINoteDraft(event.target.value.slice(0, 100))
                }
                placeholder="Add a clue, suspicion, or reminder..."
                maxLength={100}
                rows={4}
                className="border-white/10 bg-zinc-900 text-white placeholder:text-white/40"
              />
              <p className="text-right text-xs text-white/50">
                {whoAmINoteDraft.length}/100 characters
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setWhoAmINotesOpen(false)}
                className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveWhoAmINote}
                disabled={!whoAmINoteDraft.trim()}
                className="bg-amber-500 text-black hover:bg-amber-400"
              >
                Save note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Main Content */}
      <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-3 py-4 sm:px-4 sm:py-6">
        {/* Header */}
        <RoomHeader
          gameName={game?.name || ""}
          selectedGame={selectedGame}
          rounds={room?.rounds || 0}
          currentRound={room?.currentRound || 0}
        />

        {/* Scoreboard */}
        <RoomScoreboard
          selectedGame={selectedGame}
          playingTeams={room?.playingTeams || []}
          teamStats={TeamPlayerStats}
          players={players}
          PlayerScoreComponent={PlayerScore}
        />

        {/* Game Content */}
        <div className="mb-6 w-full min-w-0 overflow-x-hidden rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm sm:p-5 lg:p-8">
          {showQRCode ? (
            <div className="mt-4 flex w-full items-center justify-center sm:mt-6">
              <QRCodeCanvas
                value={normalizeUrl(
                  typeof window !== "undefined" ? window.location.href : "",
                )}
                size={220}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin
              />
            </div>
          ) : (
            <GameContentRenderer
              {...{
                actualPlayer,
                badChoicesAnswer,
                badChoicesCards: game?.questions || [],
                badChoicesPlayCard,
                badChoicesRedrawCards,
                badChoicesState,
                coupChooseExchange,
                coupDeclareAction,
                coupRevealInfluence,
                coupRespondDecision,
                coupState,
                flip7AdvanceRound,
                flip7ChooseTarget,
                flip7Hit,
                flip7State,
                flip7Stay,
                spinBottleChooseAction,
                spinBottleMode: getSpinBottleModeByCode(spinBottleState.mode),
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
                connectLettersBuzz,
                connectLettersJudge,
                connectLettersNextRound,
                connectLettersRedrawLetters,
                connectLettersRedrawCooldown,
                connectLettersSecondsLeft,
                connectLettersState,
                connectLettersStopTimer,
                connectLettersTimerDuration,
                currentQuestion,
                forfited,
                formatTime,
                generateCard,
                getBlackjackHandTotal,
                getBlackjackResultBadgeClasses,
                getBlackjackResultLabel,
                getBlackjackCardClasses,
                getBlackjackCardLabel,
                getBlackjackRoundExplanation,
                ghostTearsJudge,
                ghostTearsRestart,
                ghostTearsChallenge,
                ghostTearsForfeit,
                ghostTearsPickLetter,
                ghostTearsState,
                guessNumberSetPlayerNumber,
                guessNumberState,
                guessNumberSubmitGuess,
                guessTheMovieBuzz,
                guessTheMovieJudge,
                guessTheMovieNextRound,
                guessTheMovieQuestion,
                guessTheMovieSecondsLeft,
                guessTheMovieState,
                handleStart,
                handleStop,
                imposterResolveRound,
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
                nameTheSongNextRound,
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
                removeVowels,
                rideTheBusGuess,
                rideTheBusState,
                room,
                secretPickerOpenStart,
                selectedGame,
                SelectedOption,
                setClicked,
                setCodenamesSelectedCardId,
                setForfited,
                setGuessPickerOpenStart,
                setJokerLoopHighlightedIndex,
                setPokerBetDraft,
                setPokerBetPickerOpen,
                setSecretPickerOpenStart,
                setShowPokerHandRankings,
                setWinningTeams,
                setWhoAmINotesOpen,
                showPokerHandRankings,
                tabooForbiddenWords,
                unoDrawCard,
                unoPendingWildCardId,
                unoPassTurn,
                unoPlayCard,
                unoSetPendingWildCardId: setUnoPendingWildCardId,
                unoStart,
                unoState,
                timeLeft,
                updatePlayerStatsPOD,
                updateRoom,
                vote,
                voteQuestion,
                voteTruthLie,
                wouldRatherResult,
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
              }}
            />
          )}
        </div>

        {!showQRCode && (
          <ReactionRainOverlay
            visibleReactions={visibleReactions}
            prefersReducedMotion={Boolean(prefersReducedMotion)}
          />
        )}

        {!showQRCode && (
          <ReactionRainPanel
            players={players}
            actualPlayer={actualPlayer}
            quickReactions={myMostUsedReactions}
            selectedTargetId={reactionTargetId}
            setSelectedTargetId={setReactionTargetId}
            onSendReaction={handleSendReaction}
            cooldownRemainingMs={reactionCooldownRemainingMs}
            canSendReaction={canSendReaction}
            isPending={sendReaction.isPending}
          />
        )}

        {/* Controls */}
        <RoomControls
          onEndGame={() => endRoom.mutate({ roomId: String(roomId) })}
          canAddPlayer={canAddPlayers}
          onAddPlayer={() => setOpenAddPlayerModal(true)}
          canChangeName={canCurrentPlayerChangeName}
          onChangeName={() => {
            if (!canCurrentPlayerChangeName) {
              toast.error("You can only change your name once.");
              return;
            }
            const currentPlayerName = selectedActualPlayer?.name || "";
            setUpdatedPlayerName(currentPlayerName);
            setOpenChangeNameModal(true);
          }}
          showQRCode={showQRCode}
          onToggleQRCode={() => setShowQRCode((prev) => !prev)}
          showStopGameOverMusic={Boolean(room?.gameEnded)}
          canStopGameOverMusic={isGameOverSoundPlaying}
          onStopGameOverMusic={handleStopGameOverSound}
          actualPlayerName={
            selectedActualPlayer?.name || ""
          }
        />
      </div>
    </div>
  );
}

const ReactionRainPanel = React.memo(function ReactionRainPanel({
  players,
  actualPlayer,
  quickReactions,
  selectedTargetId,
  setSelectedTargetId,
  onSendReaction,
  cooldownRemainingMs,
  canSendReaction,
  isPending,
}: {
  players: {
    id: string;
    name: string;
  }[];
  actualPlayer: string;
  quickReactions: string[];
  selectedTargetId: string;
  setSelectedTargetId: React.Dispatch<React.SetStateAction<string>>;
  onSendReaction: (emoji: string) => void;
  cooldownRemainingMs: number;
  canSendReaction: boolean;
  isPending: boolean;
}) {
  const [customEmoji, setCustomEmoji] = React.useState("");

  const cooldownSeconds = Math.ceil(cooldownRemainingMs / 1000);
  const myTargetOptions = players.filter((player) => player.id !== actualPlayer);
  const selectedTargetLabel =
    selectedTargetId === "ALL"
      ? "Send to everyone"
      : `Send to ${
          myTargetOptions.find((player) => player.id === selectedTargetId)
            ?.name ?? "player"
        }`;
  const canSendCustomEmoji = customEmoji.length > 0 && canSendReaction && !isPending;

  return (
    <div className="relative mb-6 w-full min-w-0 overflow-x-hidden rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
      <div className="relative z-10">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-white">Quick Reactions</p>
          <p className="text-xs text-white/70">
            {canSendReaction
              ? "Ready to send"
              : `Cooldown: ${cooldownSeconds}s remaining`}
          </p>
        </div>

        <div className="mb-3 min-w-0 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 w-full min-w-0 justify-between border-white/20 bg-black/20 text-white hover:bg-black/30 hover:text-white"
              >
                <span className="truncate">{selectedTargetLabel}</span>
                <ChevronDown className="h-4 w-4 opacity-80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[var(--radix-dropdown-menu-trigger-width)]"
            >
              <DropdownMenuRadioGroup
                value={selectedTargetId}
                onValueChange={setSelectedTargetId}
              >
                <DropdownMenuRadioItem value="ALL">
                  Send to everyone
                </DropdownMenuRadioItem>
                {myTargetOptions.map((player) => (
                  <DropdownMenuRadioItem key={player.id} value={player.id}>
                    Send to {player.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-xs text-white/70">
            {selectedTargetId === "ALL" ? "Public" : "Private target"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {quickReactions.slice(0, 3).map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSendReaction(emoji)}
              disabled={!canSendReaction || isPending}
              className="flex h-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-2xl transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Send ${emoji} reaction`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="mt-3 min-w-0 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            value={customEmoji}
            onChange={(event) =>
              setCustomEmoji(extractFirstEmoji(event.target.value))
            }
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              if (!canSendCustomEmoji) return;
              onSendReaction(customEmoji);
              setCustomEmoji("");
            }}
            placeholder="Type one emoji (example: 😎)"
            className="h-10 border-white/20 bg-black/20 text-white placeholder:text-white/60"
          />
          <Button
            type="button"
            onClick={() => {
              if (!canSendCustomEmoji) return;
              onSendReaction(customEmoji);
              setCustomEmoji("");
            }}
            disabled={!canSendCustomEmoji}
            className="h-10"
          >
            Send Emoji
          </Button>
        </div>
      </div>
    </div>
  );
});

const ReactionRainOverlay = React.memo(function ReactionRainOverlay({
  visibleReactions,
  prefersReducedMotion,
}: {
  visibleReactions: RoomReaction[];
  prefersReducedMotion: boolean;
}) {
  const burstParticles = React.useMemo(() => {
    return visibleReactions.flatMap((reaction) => {
      const count = reaction.targetPlayerId ? 10 : 16;
      const createdAt = new Date(reaction.createdAt).getTime();
      return Array.from({ length: count }, (_, index) => {
        const seed = createdAt + index * 67;
        const left = (seed * 13) % 100;
        const drift = ((seed % 40) - 20) * 1.2;
        const duration = prefersReducedMotion ? 1.2 : 2.3 + (seed % 1000) / 1000;
        const delay = (seed % 250) / 1000;
        const size = reaction.targetPlayerId ? "text-2xl" : "text-3xl";

        return {
          key: `${reaction.id}-${index}`,
          emoji: reaction.emoji,
          left,
          drift,
          duration,
          delay,
          size,
        };
      });
    });
  }, [prefersReducedMotion, visibleReactions]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {burstParticles.map((particle) => (
          <motion.span
            key={particle.key}
            className={`absolute top-[-10vh] ${particle.size}`}
            style={{ left: `${particle.left}%` }}
            initial={{ opacity: 0, y: "-10%", x: 0, rotate: 0, scale: 0.85 }}
            animate={
              prefersReducedMotion
                ? { opacity: [0, 1, 0], y: "110vh" }
                : {
                    opacity: [0, 1, 1, 0],
                    y: "120vh",
                    x: particle.drift,
                    rotate: particle.drift,
                    scale: [0.85, 1, 1.05],
                  }
            }
            exit={{ opacity: 0 }}
            transition={{
              duration: particle.duration,
              ease: "easeOut",
              delay: particle.delay,
            }}
          >
            {particle.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
});

const RoomHeader = React.memo(function RoomHeader({
  gameName,
  selectedGame,
  rounds,
  currentRound,
}: {
  gameName: string;
  selectedGame: string;
  rounds: number;
  currentRound: number;
}) {
  return (
    <div className="mb-5 text-center sm:mb-6">
      <h1 className="mb-2 text-3xl font-bold sm:text-4xl">🎮 {gameName}</h1>
      {rounds === 0 ||
      selectedGame === "truth-or-drink" ||
      selectedGame === "spin-the-bottle" ? (
        <p className="text-sm text-white/70 sm:text-base">Round in progress</p>
      ) : (
        <p className="text-sm text-white/70 sm:text-base">
          Round {currentRound || 1} of {rounds}
        </p>
      )}
    </div>
  );
});

const RoomScoreboard = React.memo(function RoomScoreboard({
  selectedGame,
  playingTeams,
  teamStats,
  players,
  PlayerScoreComponent,
}: {
  selectedGame: string;
  playingTeams: string[];
  teamStats: TeamStats;
  players: {
    id: string;
    name: string;
    points: number | null;
    drinks: number | null;
  }[];
  PlayerScoreComponent: React.ComponentType<{
    points: number | null;
    drinks: number | null;
    player: string;
  }>;
}) {
  return (
    <div className="mb-6 sm:mb-8">
      {selectedGame === "triviyay" && (
        <div className="my-4 flex flex-wrap items-center justify-around gap-3 rounded-xl border border-white/20 bg-white/10 p-3 text-center backdrop-blur-sm sm:p-4">
          {playingTeams.map((team) => (
            <div key={team} className="min-w-[9rem]">
              <div className="mb-1 text-base font-bold text-white sm:text-lg">
                Team: {team} ({teamStats[team]?.Count || 0})
              </div>
              <div className="mb-1 text-xl font-bold text-emerald-400 sm:text-2xl">
                {teamStats[team]?.TotalPoints} pts
              </div>
              <div className="text-xs text-orange-300 sm:text-sm">
                {teamStats[team]?.TotalDrinks} drinks
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {players.map((player) => (
          <PlayerScoreComponent
            key={player.id}
            points={player.points}
            drinks={player.drinks}
            player={player.name}
          />
        ))}
      </div>
    </div>
  );
});

const RoomControls = React.memo(function RoomControls({
  onEndGame,
  canAddPlayer,
  onAddPlayer,
  canChangeName,
  onChangeName,
  showQRCode,
  onToggleQRCode,
  showStopGameOverMusic,
  canStopGameOverMusic,
  onStopGameOverMusic,
  actualPlayerName,
}: {
  onEndGame: () => void;
  canAddPlayer: boolean;
  onAddPlayer: () => void;
  canChangeName: boolean;
  onChangeName: () => void;
  showQRCode: boolean;
  onToggleQRCode: () => void;
  showStopGameOverMusic: boolean;
  canStopGameOverMusic: boolean;
  onStopGameOverMusic: () => void;
  actualPlayerName: string;
}) {
  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/8 p-3 backdrop-blur-sm sm:w-auto sm:max-w-none sm:border-0 sm:bg-transparent sm:p-0">
        <button
          onClick={onEndGame}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-600 sm:w-40"
        >
          <Home className="w-5 h-5" />
          End Game
        </button>

        {canAddPlayer && (
          <button
            onClick={onAddPlayer}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-pink-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-pink-600 sm:mt-4 sm:w-40"
          >
            <UserPlus2 className="w-5 h-5" />
            Add Player
          </button>
        )}

        {canChangeName && (
          <button
            onClick={onChangeName}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-cyan-600 sm:mt-4 sm:w-40"
          >
            Change Name
          </button>
        )}

        <button
          onClick={onToggleQRCode}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-600 sm:mt-4 sm:w-40"
        >
          <QrCodeIcon className="w-5 h-5" />
          {showQRCode ? "Hide" : "Show"} QR
        </button>

        {showStopGameOverMusic && (
          <button
            onClick={onStopGameOverMusic}
            disabled={!canStopGameOverMusic}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-500 sm:mt-4 sm:w-40"
          >
            Stop Music
          </button>
        )}

        <p className="mt-4 text-center text-sm text-white/70 sm:text-left">
          {actualPlayerName
            ? `💋Player: ${actualPlayerName}💋`
            : "No Player Selected"}
        </p>
      </div>
    </div>
  );
});

