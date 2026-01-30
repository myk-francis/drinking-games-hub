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
    trpc.games.getRoomById.queryOptions(
      { roomId: String(roomId) },
      {
        refetchInterval: 3000, // in milliseconds
        refetchOnWindowFocus: false, // optional: disables refetching when tab/window gains focus
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
  const questions = room?.game?.questions;

  const questionsTruthOrDrink = room?.game?.questions.filter(
    (q) => q.edition === room?.rounds,
  );

  const players = React.useMemo(() => room?.players || [], [room?.players]);

  const [actualPlayer, setActualPlayer] = React.useState("");
  const [newPlayer, setNewPlayer] = React.useState("");
  const [newTeamPlayer, setNewTeamPlayer] = React.useState<{
    name: string;
    team: string;
  } | null>(null);
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
    selectedGame === "verbal-charades" ? 30 : 60,
  ); // 30 seconds
  const [isRunning, setIsRunning] = React.useState(false);
  const [showQRCode, setShowQRCode] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const playerAddedComment = React.useMemo(() => {
    return (comments?.length || 0) >= players.length;
  }, [comments, players]);

  const nextCharadeCard = useMutation(
    trpc.games.nextCharadeCard.mutationOptions({
      onSuccess: () => {
        toast.success("Next card coming up!");
        setIsRunning(false);
        setTimeLeft(30);
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

  const handleActualSelectPlayer = (id: string) => {
    setActualPlayer(id);
    localStorage.setItem("actualPlayerId", id);
    setShowAddPlayerModal(false);
  };

  React.useLayoutEffect(() => {
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
  }, [room]);

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
        {points || 0} {selectedGame === "most-likely" ? "votes" : "pts"}
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
                {questions?.filter((q) => q.id === room?.currentQuestionId)[0]
                  ?.text ||
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
                        currentQuestionId: String(room.currentQuestionId) ?? "",
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
                        currentQuestionId: String(room.currentQuestionId) ?? "",
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
                  : questions?.filter(
                      (q) => q.id === room?.currentQuestionId,
                    )[0]?.text ||
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
                        currentQuestionId: String(room.currentQuestionId) ?? "",
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
                            String(room.currentQuestionId) ?? "",
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
                {questionsTruthOrDrink?.filter(
                  (q) => q.id === room?.currentQuestionId,
                )[0]?.text ||
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
                        currentQuestionId: String(room.currentQuestionId) ?? "",
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
                        currentQuestionId: String(room.currentQuestionId) ?? "",
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
                {questions?.filter((q) => q.id === room?.currentQuestionId)[0]
                  ?.text ||
                  "No question available. Please wait for the next round."}
              </div>
              {actualPlayer === room?.currentPlayerId &&
                !clicked &&
                questions?.filter((q) => q.id === room?.currentQuestionId)[0]
                  ?.edition !== 3 && (
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
                            String(room.currentQuestionId) ?? "",
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
                            String(room.currentQuestionId) ?? "",
                        });
                        setClicked(true);
                      }}
                      className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-semibold transition-colors"
                    >
                      Took a Drink
                    </button>
                  </div>
                )}
              {!clicked &&
                questions?.filter((q) => q.id === room?.currentQuestionId)[0]
                  ?.edition === 3 && (
                  <button
                    onClick={() => {
                      nextCardPOD.mutate({
                        gamecode: "pick-a-card",
                        roomId: room.id,
                        currentQuestionId: String(room.currentQuestionId) ?? "",
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
                {questions?.filter((q) => q.id === room?.currentQuestionId)[0]
                  ?.text ||
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
                      currentQuestionId: String(room.currentQuestionId) ?? "",
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
                    {questions?.filter(
                      (q) => q.id === room?.currentQuestionId,
                    )[0]?.text ||
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
                            String(room.currentQuestionId) ?? "",
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
                            String(room.currentQuestionId) ?? "",
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
                {questions?.filter((q) => q.id === room?.currentQuestionId)[0]
                  ?.text ||
                  "No question available. Please wait for the next round."}
              </p>
              {((actualPlayer === room?.currentPlayerId && timeLeft === 0) ||
                actualPlayer !== room?.currentPlayerId) && (
                <p className="text-lg text-white/80 mb-6">
                  Answer:{" "}
                  {questions?.filter((q) => q.id === room?.currentQuestionId)[0]
                    ?.answer ||
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
                            String(room.currentQuestionId) ?? "",
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
                            String(room.currentQuestionId) ?? "",
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
                {questions?.filter((q) => q.id === room?.currentQuestionId)[0]
                  ?.text ||
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
                      currentQuestionId: String(room.currentQuestionId) ?? "",
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
                {questions?.filter((q) => q.id === room?.currentQuestionId)[0]
                  ?.text ||
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
                            String(room.currentQuestionId) ?? "",
                        });
                        setClicked(true);
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
      {actualPlayer === "" && (
        <UserConfirmModal
          players={players}
          handleActualSelectPlayer={handleActualSelectPlayer}
          selectedGame={selectedGame}
        />
      )}
      {actualPlayer === players[0].id && (
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
          teams={room?.playingTeams || []}
        />
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2">🍻 {game?.name}</h1>
          {room?.rounds === 0 || selectedGame === "truth-or-drink" ? (
            <p className="text-white/70">Round in progress</p>
          ) : (
            <p className="text-white/70">
              Round {room?.currentRound || 1} of {room?.rounds}
            </p>
          )}
        </div>

        {/* Scoreboard */}
        <div className="mb-8">
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
        </div>

        {/* Game Content */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-6 border border-white/20">
          {showQRCode ? (
            <div className="wfull mt-6  flex flex-row justify-center items-center">
              <QRCodeCanvas
                value={window.location.href}
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
        <div className="flex gap-4 justify-center">
          <div>
            <button
              onClick={() => {
                endRoom.mutate({ roomId: String(roomId) });
              }}
              className="flex items-center w-40 gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-colors"
            >
              <Home className="w-5 h-5" />
              End Game
            </button>

            {actualPlayer === players[0].id && (
              <button
                onClick={() => {
                  setOpenAddPlayerModal(true);
                }}
                className="flex items-center w-40 mt-4 gap-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-lg text-white font-semibold transition-colors"
              >
                <UserPlus2 className="w-5 h-5" />
                Add Player
              </button>
            )}

            <button
              onClick={() => {
                if (showQRCode) {
                  setShowQRCode(false);
                } else {
                  setShowQRCode(true);
                }
              }}
              className="flex items-center w-40 mt-4 gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
            >
              <QrCodeIcon className="w-5 h-5" />
              {showQRCode ? "Hide" : "Show"} QR
            </button>

            <p className="text-white/70 mt-4">
              {`💋Player: ${
                players.filter((player) => player.id === actualPlayer)[0]?.name
              }💋` || "No Player Selected"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
