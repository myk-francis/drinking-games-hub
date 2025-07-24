"use client";
import { Home } from "lucide-react";
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

export default function RoomPage() {
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
      }
    )
  );

  const updateRoom = useMutation(
    trpc.games.addPlayerStats.mutationOptions({
      onSuccess: (data) => {
        toast.success("Got it next");
        // trpc.games.getRoomById.invalidate({ roomId: String(roomId) });
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error updating room:", error);
      },
    })
  );

  const endRoom = useMutation(
    trpc.games.endGame.mutationOptions({
      onSuccess: (data) => {
        toast.success("Thanks for playing!");
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error ending room:", error);
      },
    })
  );
  const nextQuestion = useMutation(
    trpc.games.nextQuestion.mutationOptions({
      onSuccess: (data) => {
        toast.success("Next question coming up!");
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error changing question:", error);
      },
    })
  );
  const nextRound = useMutation(
    trpc.games.nextQuestion.mutationOptions({
      onSuccess: (data) => {
        toast.success("Next question coming up!");
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error question question:", error);
      },
    })
  );
  const generateCard = useMutation(
    trpc.games.nextCard.mutationOptions({
      onSuccess: (data) => {
        toast.success("Next card coming up!");
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error changing card:", error);
      },
    })
  );
  const vote = useMutation(
    trpc.games.votePlayer.mutationOptions({
      onSuccess: (data) => {
        toast.success("Vote submitted!");
      },
      onError: (error) => {
        toast.error("Something went wrong. Please try again.");
        console.error("Error voting :", error);
      },
    })
  );

  const selectedGame = room?.game?.code || "never-have-i-ever";

  const game = room?.game;
  const questions = room?.game?.questions || [];
  const players = room?.players || [];

  const [actualPlayer, setActualPlayer] = React.useState("");

  const handleActualSelectPlayer = (id: string) => {
    setActualPlayer(id);
    localStorage.setItem("actualPlayerId", id);
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

  if (isLoading) return <Loading />;
  if (error)
    //@ts-expect-error leave it
    return <ErrorPage error={error} reset={() => window.location.reload()} />;
  if (!room) return <div className="p-4">Room not found</div>;

  if (!roomId) return <div className="p-4">Room ID is required</div>;

  const totalPoints = players.reduce((sum, player) => {
    return sum + (player.points || 0); // handles undefined/null
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6 flex items-center justify-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">Game Over</h1>
          <h1 className="text-2xl font-bold mb-4 ">Game: {game?.name ?? ""}</h1>
          <h1 className="text-xl font-bold mb-4 ">
            Game Status: {totalPoints} Drinks : Lame👽
          </h1>
          <div className="flex gap-4">
            {players.map((player) => (
              <PlayerScore
                key={player.id}
                points={player.points}
                drinks={player.drinks}
                player={player.name}
              />
            ))}
          </div>
          <Link href="/" className="mt-6 inline-block self-center ">
            <Button>Go back home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const GameContent = () => {
    const currentPlayer = room?.currentPlayerId
      ? players.find((p) => p.id === room.currentPlayerId)?.name ||
        "Unknown Player"
      : "No player selected";

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
                <button
                  onClick={() => {
                    updateRoom.mutate({
                      gamecode: "never-have-i-ever",
                      roomId: room.id,
                      points: String(
                        room?.players?.find((p) => p.id === actualPlayer)
                          ?.points || 0
                      ),
                      drinks: String(
                        //@ts-expect-error leave it
                        room?.players?.find((p) => p.id === actualPlayer)
                          ?.drinks + 1 || 0
                      ),
                      currentPlayerId: actualPlayer ?? "",
                      currentQuestionId: String(room.currentQuestionId) ?? "",
                    });
                  }}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Took a Drink
                </button>
                {selectedGame === "never-have-i-ever" && (
                  <button
                    onClick={() => {
                      nextQuestion.mutate({
                        gamecode: "never-have-i-ever",
                        roomId: room.id,
                        currentQuestionId: String(room.currentQuestionId) ?? "",
                      });
                    }}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Next Question
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
                {questions?.filter((q) => q.id === room?.currentQuestionId)[0]
                  ?.text ||
                  "No question available. Please wait for the next round."}
              </div>
              {actualPlayer === room?.currentPlayerId && (
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      updateRoom.mutate({
                        gamecode: "truth-or-drink",
                        roomId: room.id,
                        points: String(
                          //@ts-expect-error leave it
                          room?.players?.find(
                            (p) => p.id === room.currentPlayerId
                          )?.points + 1 || 0
                        ),
                        drinks: String(
                          room?.players?.find(
                            (p) => p.id === room.currentPlayerId
                          )?.drinks || 0
                        ),
                        currentPlayerId: room.currentPlayerId ?? "",
                        currentQuestionId: String(room.currentQuestionId) ?? "",
                      });
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
                            (p) => p.id === room.currentPlayerId
                          )?.points || 0
                        ),
                        drinks: String(
                          //@ts-expect-error leave it
                          room?.players?.find(
                            (p) => p.id === room.currentPlayerId
                          )?.drinks + 1 || 0
                        ),
                        currentPlayerId: room.currentPlayerId ?? "",
                        currentQuestionId: String(room.currentQuestionId) ?? "",
                      });
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
              <div className="text-xl text-emerald-400 mb-4">
                👤 {currentPlayer}&apos;s Turn
              </div>
              <div className="text-6xl mb-6 text-white font-bold">
                {room?.lastCard}
              </div>
              <p className="text-lg text-white/80 mb-6">
                Will the next card be higher or lower (1-1000)?
              </p>
              {actualPlayer === room?.currentPlayerId && (
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      generateCard.mutate({
                        roomId: room.id,
                        playersAns: "UP",
                        currentPlayerId: room.currentPlayerId ?? "",
                      });
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
                      if (actualPlayer !== player.id) {
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
              <button
                onClick={() => {
                  nextRound.mutate({
                    gamecode: "most-likely",
                    roomId: room.id,
                    currentQuestionId: String(room.currentQuestionId) ?? "",
                  });
                }}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white font-semibold transition-colors"
              >
                Next Question
              </button>
            </div>
          );

        default:
          return (
            <div className="text-center">
              <div className="text-xl text-emerald-400 mb-4">
                👤 {currentPlayer}&apos;s Turn
              </div>
              <div className="text-xl mb-6 text-white">
                Game in progress! Use the action buttons below.
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
        />
      )}
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2">🍻 {game?.name}</h1>
          <p className="text-white/70">Round in progress</p>
        </div>

        {/* Scoreboard */}
        <div className="mb-8">
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
          <GameContent />
        </div>

        {/* Controls */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              endRoom.mutate({ roomId: String(roomId) });
            }}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-colors"
          >
            <Home className="w-5 h-5" />
            End Game
          </button>
        </div>
      </div>
    </div>
  );
}
