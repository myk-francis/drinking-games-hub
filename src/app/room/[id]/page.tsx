"use client";
import { Home } from "lucide-react";
import { useParams } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import React from "react";

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id; // This is your dynamic route: /room/[id]
  const trpc = useTRPC();
  const {
    data: room,
    isLoading,
    error,
  } = useQuery(trpc.games.getRoomById.queryOptions({ roomId: String(roomId) }));

  const [currentPlayerIndex, setCurrentPlayerIndex] = React.useState(0);
  const selectedGame = room?.game?.code || "never-have-i-ever";

  const game = room?.game;
  const questions = room?.game?.questions || [];
  const players = room?.players || [];

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error)
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  if (!room) return <div className="p-4">Room not found</div>;

  if (!roomId) return <div className="p-4">Room ID is required</div>;

  const GameContent = () => {
    const currentPlayer = players[0].name;

    const getRandomContent = (contentArray, used) => {
      const unused = contentArray.filter((item) => !used.includes(item));
      if (unused.length === 0)
        return contentArray[Math.floor(Math.random() * contentArray.length)];
      return unused[Math.floor(Math.random() * unused.length)];
    };

    const renderGameSpecificContent = () => {
      switch (selectedGame) {
        case "truth-or-drink":
          const question = getRandomContent(
            questions.map((q) => q.text),
            []
          );
          return (
            <div className="text-center">
              <div className="text-xl text-emerald-400 mb-4">
                👤 {currentPlayer}&apos;s Turn
              </div>
              <div className="text-xl mb-6 text-white leading-relaxed">
                {question}
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    // addPoint(currentPlayer);
                    // nextPlayer();
                  }}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Answered Truthfully
                </button>
                <button
                  onClick={() => {
                    // addDrink(currentPlayer);
                    // nextPlayer();
                  }}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Took a Drink
                </button>
              </div>
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
              // <PlayerScore key={player} player={player} />
              <div key={player.id}></div>
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
            // onClick={endGame}
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
