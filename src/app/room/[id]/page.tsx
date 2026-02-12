"use client";
import { Home, UserPlus2, QrCodeIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import React from "react";
import UserConfirmModal from "./modal";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";
import ErrorPage from "@/app/error";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddPlayerModal from "./addPlayerModal";
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

import { Star } from "lucide-react";
import { DRINKING_QUOTES } from "@/lib/quotes";

type CodenamesTeam = "RED" | "BLUE";
type CodenamesAssignment = "RED" | "BLUE" | "NEUTRAL" | "ASSASSIN";
type CodenamesRoomState = {
  status: "LOBBY" | "PLAYING" | "ENDED";
  board: number[];
  assignments: Record<number, CodenamesAssignment>;
  startingTeam: CodenamesTeam;
  turnTeam: CodenamesTeam;
  guessesRemaining: number | null;
  winner: CodenamesTeam | null;
};
type MemoryChainRoomState = {
  status: "PLAYING" | "ENDED";
  board: number[];
  sequence: number[];
  revealed: number[];
  progress: number;
  winnerPlayerId: string | null;
  pendingMissQuestionId: number | null;
  pendingMissNextPlayerId: string | null;
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

function parseCodenamesState(
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

function parseMemoryChainState(
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
        typeof parsed.winnerPlayerId === "string"
          ? parsed.winnerPlayerId
          : null,
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
    return fallback;
  }
}

export default function RoomPage() {
  const [quote, setQuote] = React.useState<string>("");
  const params = useParams();
  const roomId = params.id; // This is your dynamic route: /room/[id]
  const trpc = useTRPC();
  const {
    data: room,
    isLoading,
    error,
  } = useQuery(
    trpc.games.getRoomState.queryOptions(
      { roomId: String(roomId) },
      {
        refetchInterval: (query) =>
          query.state.data?.gameEnded ? false : 3000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: false,
      },
    ),
  );

  const { data: comments } = useQuery(
    trpc.comments.getCommentsByRoomId.queryOptions({ roomId: String(roomId) }),
  );

  const [clicked, setClicked] = React.useState(false);

  const [playerRating, setPlayerRating] = React.useState<number>(1);
  const [comment, setComment] = React.useState<string>("");

  const createComment = useMutation(
    trpc.comments.createComment.mutationOptions({
      onSuccess: () => {
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
  const [openAddPlayerModal, setOpenAddPlayerModal] = React.useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = React.useState(false);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [winningTeams, setWinningTeams] = React.useState<string[]>([]);
  const [forfited, setForfited] = React.useState<boolean>(false);

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
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const codenamesIdentityInitializedRef = React.useRef(false);

  const playerAddedComment = React.useMemo(() => {
    return (comments?.length || 0) >= players.length;
  }, [comments, players]);

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
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
      <div className="font-bold text-lg text-white mb-1">{player}</div>
      <div className="text-2xl font-bold text-emerald-400 mb-1">
        {points || 0}{" "}
        {selectedGame === "most-likely" || selectedGame === "paranoia"
          ? "votes"
          : "pts"}
      </div>
      <div className="text-sm text-orange-300">{drinks || 0} drinks</div>
    </div>
  );

  if (room.gameEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6 flex items-center justify-center ">
        {showAddPlayerModal && (
          <UserConfirmModal
            players={players}
            handleActualSelectPlayer={handleActualSelectPlayer}
          />
        )}
        <div>
          <h1 className="text-4xl font-bold mb-4">Game Over</h1>
          <h1 className="text-2xl font-bold mb-4 ">Game: {game?.name ?? ""}</h1>
          <div className="">
            <h1 className="text-xl font-bold mb-4 text-wrap">
              Game Status: {totalPoints} Drinks : {quote}
            </h1>
          </div>
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
          <div className="flex gap-4 flex-wrap">
            {players.map((player) => (
              <PlayerScore
                key={player.id}
                points={player.points}
                drinks={player.drinks}
                player={player.name}
              />
            ))}
          </div>
          <div className="">
            <Link href="/" className="mt-6 inline-block self-center mr-2">
              <Button>Go back home</Button>
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
      </div>
    );
  }

  const GameContent = () => {
    const currentPlayer = room?.currentPlayerId
      ? players.find((p) => p.id === room.currentPlayerId)?.name ||
        "Unknown Player"
      : "No player selected";

    const teams = room?.playingTeams || [];

    const currentTeamLeaderId = React.useCallback(() => {
      if (selectedGame !== "triviyay") {
        return "";
      }

      const teamPlayers = players.filter(
        (p) => p.team === room?.currentPlayerId,
      );
      return teamPlayers[0]?.id || "";
    }, []);

    const renderGameSpecificContent = () => {
      switch (selectedGame) {
        case "never-have-i-ever":
          return (
            <div className="text-center">
              <div className="text-2xl mb-6 text-white leading-relaxed">
                {currentQuestion?.text ||
                  "No question available. Please wait for the next round."}
              </div>
              <p className="text-lg text-white/80 mb-6">
                Players who have done this, take a drink! 🍻
              </p>
              <div className="flex gap-4 justify-center">
                {!clicked && (
                  <button
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
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Took a Drink
                  </button>
                )}
                {selectedGame === "never-have-i-ever" && !clicked && (
                  <button
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
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Next Question
                  </button>
                )}
              </div>
            </div>
          );

        case "imposter":
          return (
            <div className="text-center">
              <div className="text-2xl mb-6 text-white leading-relaxed">
                {actualPlayer === room?.currentPlayerId
                  ? "IMPOSTER 🤡"
                  : currentQuestion?.text ||
                    "No question available. Please wait for the next round."}
              </div>
              <p className="text-lg text-white/80 mb-6">
                {actualPlayer === room?.currentPlayerId
                  ? "Try to blend in and avoid detection! 🤫"
                  : "Who is the imposter 👀‼️"}
              </p>
              <div className="flex gap-4 justify-center">
                {!clicked && (
                  <button
                    onClick={() => {
                      updateRoom.mutate({
                        gamecode: "imposter",
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
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Took a Drink
                  </button>
                )}
                {selectedGame === "imposter" &&
                  actualPlayer === room?.currentPlayerId &&
                  !clicked && (
                    <button
                      onClick={() => {
                        nextCardPOD.mutate({
                          gamecode: "imposter",
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
              </div>
            </div>
          );

        case "truth-or-drink":
          return (
            <div className="text-center">
              <div className="text-xl text-emerald-400 mb-4">
                👤 {currentPlayer}&apos;s Turn
              </div>
              <div className="text-xl mb-6 text-white leading-relaxed">
                {currentQuestion?.text ||
                  "No question available. Please wait for the next round."}
              </div>
              {actualPlayer === room?.currentPlayerId && !clicked && (
                <div className="flex gap-4 justify-center">
                  <button
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
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Answered Truthfully
                  </button>
                  <button
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
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Took a Drink
                  </button>
                </div>
              )}
            </div>
          );

        case "pick-a-card":
          return (
            <div className="text-center">
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
            </div>
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
            <div className="text-center">
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
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        generateCard.mutate({
                          roomId: room.id,
                          playersAns: "UP",
                          currentPlayerId: room.currentPlayerId ?? "",
                        });
                        setClicked(true);
                      }}
                      className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
                    >
                      Higher ⬆️
                    </button>
                    <button
                      onClick={() => {
                        generateCard.mutate({
                          roomId: room.id,
                          playersAns: "DOWN",
                          currentPlayerId: room.currentPlayerId ?? "",
                        });
                        setClicked(true);
                      }}
                      className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-colors"
                    >
                      Lower ⬇️
                    </button>
                  </div>
                )}
            </div>
          );

        case "most-likely":
          return (
            <div className="text-center">
              <div className="text-xl text-emerald-400 mb-4">
                👤 {currentPlayer}&apos;s Turn
              </div>
              <div className="text-2xl mb-6 text-white leading-relaxed">
                {currentQuestion?.text ||
                  "No question available. Please wait for the next round."}
              </div>
              {actualPlayer === room?.currentPlayerId && (
                <>
                  <p className="text-lg text-white/80 mb-6">
                    Pick who you think is most likely! 👉
                  </p>
                  <div className="flex gap-3 justify-center flex-wrap mb-4">
                    {players.map((player) => {
                      if (actualPlayer !== player.id && !clicked) {
                        return (
                          <button
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
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors"
                          >
                            Vote: {player.name}
                          </button>
                        );
                      }
                    })}
                  </div>
                </>
              )}
              {!clicked && (
                <button
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
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Next Question
                </button>
              )}
            </div>
          );

        case "paranoia": {
          const isCurrentPlayer = actualPlayer === room?.currentPlayerId;
          const revealedPlayerId = room?.currentAnswer || "";
          const hasVoted =
            room?.questionAVotes?.includes(actualPlayer) || false;
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
                    Vote anonymously for who fits this prompt best.
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
                              hasVoted ||
                              !actualPlayer ||
                              paranoiaVote.isPending
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
                        players.find((player) => player.id === playerId)
                          ?.name || "Unknown";
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
            <div className="text-center">
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
            </div>
          );

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
            <div className="text-center">
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
            </div>
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
            <div className="text-center">
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
            </div>
          );
        }

        case "would-you-rather":
          return (
            <div className="text-center">
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
            </div>
          );

        case "triviyay":
          return (
            <div className="text-center">
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
            </div>
          );

        case "memory-chain": {
          const isMyTurn = actualPlayer === room?.currentPlayerId;
          const nextWord = memoryChainSequence[memoryChainState.progress];
          const pendingMissActive = Boolean(
            memoryChainState.pendingMissQuestionId,
          );
          const nextPlayerAfterMissName =
            memoryChainState.pendingMissNextPlayerId
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
                    {memoryChainSequence.length || 20}
                  </Badge>
                  <Badge variant="outline">Turn: {currentPlayer}</Badge>
                  {memoryChainState.status === "ENDED" && (
                    <Badge className="bg-emerald-600">
                      Winner: {winnerName}
                    </Badge>
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
                    Wrong card is revealed. Click Next Player to continue turn
                    to {nextPlayerAfterMissName}.
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
                          className={`min-h-[72px] sm:min-h-24 rounded-md border p-1.5 sm:p-2 text-center text-[11px] sm:text-sm font-semibold transition whitespace-normal break-words leading-tight overflow-hidden ${
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

        case "codenames": {
          const me = players.find((player) => player.id === actualPlayer);
          const myTeam = me?.team || "";
          const redPlayers = players.filter((player) => player.team === "RED");
          const bluePlayers = players.filter(
            (player) => player.team === "BLUE",
          );
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
                  {myTeam && (
                    <Badge variant="outline">Your Team: {myTeam}</Badge>
                  )}
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
                          } whitespace-normal break-words leading-tight overflow-hidden text-[11px] sm:text-sm sm:leading-snug`}
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
                      <Badge className="bg-blue-600">
                        {bluePlayers.length}
                      </Badge>
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {actualPlayer === "" && selectedGame !== "codenames" && (
        <UserConfirmModal
          players={players}
          handleActualSelectPlayer={handleActualSelectPlayer}
          selectedGame={selectedGame}
        />
      )}
      {(actualPlayer === players[0].id || selectedGame === "codenames") && (
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
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
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-6 border border-white/20">
          {showQRCode ? (
            <div className="wfull mt-6  flex flex-row justify-center items-center">
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
            <GameContent />
          )}
        </div>

        {/* Controls */}
        <RoomControls
          onEndGame={() => endRoom.mutate({ roomId: String(roomId) })}
          canAddPlayer={actualPlayer === players[0]?.id}
          onAddPlayer={() => setOpenAddPlayerModal(true)}
          showQRCode={showQRCode}
          onToggleQRCode={() => setShowQRCode((prev) => !prev)}
          actualPlayerName={
            players.find((player) => player.id === actualPlayer)?.name || ""
          }
        />
      </div>
    </div>
  );
}

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
    <div className="text-center mb-6">
      <h1 className="text-4xl font-bold mb-2">🎮 {gameName}</h1>
      {rounds === 0 || selectedGame === "truth-or-drink" ? (
        <p className="text-white/70">Round in progress</p>
      ) : (
        <p className="text-white/70">
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
    <div className="mb-8">
      {selectedGame === "triviyay" && (
        <div className="flex flex-row items-center justify-around flex-wrap bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20 my-4">
          {playingTeams.map((team) => (
            <div key={team}>
              <div className="font-bold text-lg text-white mb-1">
                Team: {team} ({teamStats[team]?.Count || 0})
              </div>
              <div className="text-2xl font-bold text-emerald-400 mb-1">
                {teamStats[team]?.TotalPoints} pts
              </div>
              <div className="text-sm text-orange-300">
                {teamStats[team]?.TotalDrinks} drinks
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
  showQRCode,
  onToggleQRCode,
  actualPlayerName,
}: {
  onEndGame: () => void;
  canAddPlayer: boolean;
  onAddPlayer: () => void;
  showQRCode: boolean;
  onToggleQRCode: () => void;
  actualPlayerName: string;
}) {
  return (
    <div className="flex w-full  gap-4 justify-center items-center">
      <div>
        <button
          onClick={onEndGame}
          className="flex items-center w-40 gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-colors"
        >
          <Home className="w-5 h-5" />
          End Game
        </button>

        {canAddPlayer && (
          <button
            onClick={onAddPlayer}
            className="flex items-center w-40 mt-4 gap-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-lg text-white font-semibold transition-colors"
          >
            <UserPlus2 className="w-5 h-5" />
            Add Player
          </button>
        )}

        <button
          onClick={onToggleQRCode}
          className="flex items-center w-40 mt-4 gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
        >
          <QrCodeIcon className="w-5 h-5" />
          {showQRCode ? "Hide" : "Show"} QR
        </button>

        <p className="text-white/70 mt-4">
          {actualPlayerName
            ? `💋Player: ${actualPlayerName}💋`
            : "No Player Selected"}
        </p>
      </div>
    </div>
  );
});
