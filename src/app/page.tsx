"use client";
import {
  Users,
  Play,
  Zap,
  Heart,
  Brain,
  Dice1,
  Music,
  Clock,
  Shuffle,
  Star,
  Building,
  Share2,
  Wand2Icon,
  Gamepad2,
  Rainbow,
} from "lucide-react";
import React from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";
import { ComboBox } from "@/components/apps-components/comboBox";
import { QRCodeCanvas } from "qrcode.react";
import { UserAvatarPopover } from "@/components/apps-components/profile-avatar";

interface TeamsInfo {
  teamName: string;
  players: string[];
}

export default function HomePage() {
  const router = useRouter();
  const trpc = useTRPC();
  const {
    data: games,
    isLoading,
    error,
  } = useQuery(trpc.games.getMany.queryOptions());
  const { data: transactionProfile } = useQuery(
    trpc.transaction.getUserTransaction.queryOptions(),
  );
  const { data: rounds } = useQuery(trpc.games.getRounds.queryOptions());
  const { data: editions } = useQuery(trpc.games.getEditions.queryOptions());
  const [selectedGame, setSelectedGame] = React.useState(null);
  const [players, setPlayers] = React.useState<string[]>([]);
  const [teams, setTeams] = React.useState<string[]>([]);
  const [teamsInfo, setTeamsInfo] = React.useState<TeamsInfo[]>([]);
  const [inputs, setInputs] = React.useState<{ [key: string]: string }>({});
  const [playerInput, setPlayerInput] = React.useState("");
  const [teamInput, setTeamInput] = React.useState("");
  const [gameUrl, setGameUrl] = React.useState("");
  const [roomId, setRoomId] = React.useState("");
  const [showShareLink, setShowShareLink] = React.useState(false);
  const [permissionToCreateRoooms, setPermissionToCreateRoooms] =
    React.useState(true);
  const [selectedRounds, setSelectedRounds] = React.useState<number>(0);
  const [selectedEdition, setSelectedEdition] = React.useState<number>(0);

  const logoutUser = useMutation(
    trpc.auth.logout.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleLogout = () => {
    logoutUser.mutate();
    router.push("/login");
  };

  const createRoom = useMutation(
    trpc.games.createRoom.mutationOptions({
      onSuccess: (data) => {
        toast.success("Room created successfully");
        // Optionally, redirect to the room or show a success message
        setRoomId(data?.id || "");
        const url = String(process.env.NEXT_PUBLIC_APP_URL) + `/room/${roomId}`;
        setGameUrl(url);
      },
      onError: (error) => {
        console.error("Error creating room:", error);
        // alert("Failed to create room. Please try again.");
      },
    }),
  );

  const { data: currentUser, isLoading: userLoading } = useQuery(
    trpc.auth.getCurrentUser.queryOptions(),
  );

  React.useEffect(() => {
    if (!userLoading) {
      if (currentUser === null || currentUser === undefined) {
        router.push("/login");
      }
    }
  }, [currentUser, userLoading, router]);

  React.useEffect(() => {
    if (transactionProfile) {
      if (
        (transactionProfile.profileType === "GUEST" ||
          transactionProfile.profileType === "PREMIUM") &&
        transactionProfile.usedRooms > transactionProfile.assignedRooms
      ) {
        setPermissionToCreateRoooms(false);
      }

      if (
        (transactionProfile.profileType === "GUEST" ||
          transactionProfile.profileType === "PREMIUM") &&
        new Date() > transactionProfile?.expiryDate
      ) {
        setPermissionToCreateRoooms(false);
      }

      if (!transactionProfile) {
        setPermissionToCreateRoooms(false);
      }
    }
  }, [transactionProfile]);

  if (isLoading) return <Loading />;
  if (error) return <div>Error: {error.message}</div>;

  const GameIcon = (gamecode: string) => {
    if (gamecode === "never-have-i-ever") {
      return <Heart className="w-6 h-6" />;
    } else if (gamecode === "truth-or-drink") {
      return <Brain className="w-6 h-6" />;
    } else if (gamecode === "most-likely") {
      return <Users className="w-6 h-6" />;
    } else if (gamecode === "rhyme-time") {
      return <Music className="w-6 h-6" />;
    } else if (gamecode === "higher-lower") {
      return <Dice1 className="w-6 h-6" />;
    } else if (gamecode === "verbal-charades") {
      return <Zap className="w-6 h-6" />;
    } else if (gamecode === "would-you-rather") {
      return <Clock className="w-6 h-6" />;
    } else if (gamecode === "pick-a-card") {
      return <Shuffle className="w-6 h-6" />;
    } else if (gamecode === "catherines-special") {
      return <Wand2Icon className="w-6 h-6" />;
    } else if (gamecode === "story-building") {
      return <Star className="w-6 h-6" />;
    } else if (gamecode === "imposter") {
      return <Gamepad2 className="w-6 h-6" />;
    } else if (gamecode === "triviyay") {
      return <Rainbow className="w-6 h-6" />;
    } else {
      return <Heart className="w-6 h-6" />;
    }
  };

  const GameColor = (gamecode: string) => {
    if (gamecode === "never-have-i-ever") {
      return "from-pink-500 to-rose-500";
    } else if (gamecode === "truth-or-drink") {
      return "from-blue-500 to-purple-500";
    } else if (gamecode === "most-likely") {
      return "from-green-500 to-teal-500";
    } else if (gamecode === "rhyme-time") {
      return "from-orange-500 to-red-500";
    } else if (gamecode === "higher-lower") {
      return "from-indigo-500 to-blue-500";
    } else if (gamecode === "verbal-charades") {
      return "from-yellow-500 to-orange-500";
    } else if (gamecode === "would-you-rather") {
      return "from-cyan-500 to-blue-500";
    } else if (gamecode === "pick-a-card") {
      return "from-red-500 to-pink-500";
    } else if (gamecode === "catherines-special") {
      return "from-emerald-500 to-green-500";
    } else if (gamecode === "story-building") {
      return "from-teal-500 to-cyan-500";
    } else if (gamecode === "imposter") {
      return "from-yellow-500 to-rose-500";
    } else if (gamecode === "triviyay") {
      return "from-purple-500 to-pink-500";
    } else {
      return "from-teal-500 to-cyan-500";
    }
  };

  const handleCreateRoom = () => {
    if (!selectedGame) {
      alert("Please select a game and add at least two players.");
      return;
    }
    createRoom.mutate({
      selectedGame,
      players,
      userId: currentUser?.id || "",
      selectedRounds:
        selectedGame === "truth-or-drink" ? selectedEdition : selectedRounds,
      teamsInfo,
    });
  };

  const addPlayer = () => {
    if (playerInput.trim() && !players.includes(playerInput.trim())) {
      const newPlayers = playerInput.trim().split(",");
      setPlayers([...players, ...newPlayers]);

      setPlayerInput("");
    }
  };

  const addPlayerToTeam = (team: string) => {
    if (inputs[team]) {
      const newPlayers = inputs[team].trim().split(",");
      setTeamsInfo((prevTeamsInfo) => {
        const teamIndex = prevTeamsInfo.findIndex(
          (teamInfo) => teamInfo.teamName === team,
        );
        if (teamIndex === -1) {
          return [...prevTeamsInfo, { teamName: team, players: newPlayers }];
        } else {
          return [
            ...prevTeamsInfo.slice(0, teamIndex),
            {
              ...prevTeamsInfo[teamIndex],
              players: [...prevTeamsInfo[teamIndex].players, ...newPlayers],
            },
            ...prevTeamsInfo.slice(teamIndex + 1),
          ];
        }
      });
      setInputs((prevInputs) => ((prevInputs[team] = ""), prevInputs));
      setPlayerInput("");
    }
  };

  const removePlayer = (playerToRemove: string) => {
    setPlayers(players.filter((p) => p !== playerToRemove));
  };

  const removeTeam = (teamToRemove: string) => {
    setTeams(teams.filter((t) => t !== teamToRemove));
  };

  const clearTeam = (teamToClear: string) => {
    setTeamsInfo(teamsInfo.filter((t) => t.teamName !== teamToClear));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addPlayer();
    }
  };

  const handleInputChange = (team: string, value: string) => {
    setInputs((prevInputs) => ({
      ...prevInputs,
      [team]: value,
    }));
  };

  const addTeams = (team: string) => {
    if (team.trim() && !teams.includes(team.trim())) {
      const newTeams = team.trim().split(",");
      setTeams([...teams, ...newTeams]);
      setTeamInput("");
    }
  };

  const generateShareLink = () => {
    if (roomId === "") {
      return;
    }
    const url = String(process.env.NEXT_PUBLIC_APP_URL) + `/room/${roomId}`;

    navigator.clipboard.writeText(url.toString()).then(() => {
      setShowShareLink(true);
      setTimeout(() => setShowShareLink(false), 3000);
    });
  };

  const startGame = () => {
    router.push(`/room/${roomId}`);
  };

  //@ts-expect-error any type
  const GameCard = ({ name, description, code, onClick, selected }) => (
    <div
      onClick={() => onClick(code)}
      className={`relative overflow-hidden rounded-xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
        selected ? "ring-4 ring-white shadow-2xl scale-105" : "hover:shadow-lg"
      }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${GameColor(
          code,
        )} opacity-90`}
      ></div>
      <div className="relative z-10 text-white">
        <div className="flex items-center justify-between mb-3">
          {GameIcon(code)}
          {selected && (
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          )}
        </div>
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <p className="text-sm opacity-90 leading-relaxed">{description}</p>
      </div>
    </div>
  );

  return (
    <main className="">
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="w-full my-1 flex flex-row items-center justify-between">
            {transactionProfile?.profileType === "GUEST" ||
            transactionProfile?.profileType === "PREMIUM" ? (
              <div className="p-2 bg-white/20 rounded">
                <p className="text-sm">
                  Rooms: ({transactionProfile?.usedRooms} /
                  {transactionProfile?.assignedRooms})
                </p>
              </div>
            ) : (
              <div className="p-2 bg-white/20 rounded">
                <p className="text-sm">👑</p>
              </div>
            )}

            <div>
              <UserAvatarPopover
                isAdmin={currentUser?.isAdmin || false}
                name={currentUser?.username || ""}
                imageUrl="/avatar.png"
                handleLogout={handleLogout}
              />
            </div>
          </div>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              🍻 Drinking Games Hub
            </h1>
            <p className="text-xl text-white/80">
              Choose your game, invite friends, and let the fun begin!
            </p>
          </div>

          {/* Game Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Choose Your Game
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {games?.map((game) => (
                <GameCard
                  key={game.id}
                  name={game.name}
                  code={game.code}
                  description={game.description}
                  selected={selectedGame === game.code}
                  onClick={setSelectedGame}
                />
              ))}
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Add Players
              </h2>

              <div className="mb-6">
                {selectedGame === "triviyay" ? (
                  <>
                    <div className="flex gap-3 mb-4">
                      <Input
                        value={teamInput}
                        onChange={(e) => {
                          setTeamInput(e.target.value);
                        }}
                        placeholder="Enter team name"
                        className="bg-white text-black"
                        onClick={() => addTeams(teamInput)}
                      />
                      <Button className="" onClick={() => addTeams(teamInput)}>
                        Add Teams
                      </Button>
                    </div>

                    {teams?.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {teams?.map((team) => (
                          <div
                            key={team}
                            className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2"
                          >
                            <span>{team}</span>
                            <button
                              onClick={() => removeTeam(team)}
                              className="text-red-400 hover:text-red-300 ml-2"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {teams?.map((team) => (
                      <div key={team} className="mt-4">
                        <div className="flex gap-3 mb-4">
                          <Input
                            value={inputs[team] || ""}
                            onChange={(e) => {
                              handleInputChange(team, e.target.value);
                            }}
                            placeholder={`Enter players for ${team}`}
                            className="bg-white text-black"
                            onKeyDown={handleKeyDown}
                          />
                          <Button
                            className=""
                            onClick={() => addPlayerToTeam(team)}
                          >
                            Add Players
                          </Button>
                        </div>

                        {teamsInfo?.length > 0 &&
                          teamsInfo?.some(
                            (teamInfo) => teamInfo.teamName === team,
                          ) && (
                            <div className="flex flex-wrap gap-3">
                              {teamsInfo
                                .filter(
                                  (teamInfo) => teamInfo.teamName === team,
                                )
                                .map((teamInfoInternal) => (
                                  <div
                                    key={teamInfoInternal.teamName}
                                    className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2"
                                  >
                                    <span>
                                      {teamInfoInternal.teamName} :{" "}
                                      {teamInfoInternal.players.map(
                                        (player, index) => (
                                          <span key={index}>
                                            {index > 0 ? ", " : ""}
                                            {player}
                                          </span>
                                        ),
                                      )}
                                    </span>
                                  </div>
                                ))}
                              <div
                                onClick={() => clearTeam(team)}
                                className="cursor-pointer flex items-center gap-2 bg-white/20 rounded-full px-4 py-2"
                              >
                                <span>Clear</span>
                                <button className="text-red-400 hover:text-red-300 ml-2">
                                  ×
                                </button>
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex gap-3 mb-4">
                    <Input
                      value={playerInput}
                      onChange={(e) => {
                        setPlayerInput(e.target.value);
                      }}
                      placeholder="Enter player name"
                      className="bg-white text-black"
                      onKeyDown={handleKeyDown}
                    />
                    <Button className="" onClick={addPlayer}>
                      Add Players
                    </Button>
                  </div>
                )}

                {players.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {players?.map((player) => (
                      <div
                        key={player}
                        className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2"
                      >
                        <span>{player}</span>
                        <button
                          onClick={() => removePlayer(player)}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedGame === "higher-lower" && (
                  <div className="mt-4">
                    <ComboBox
                      options={rounds || []}
                      handleSelect={setSelectedRounds}
                      value={selectedRounds}
                    />
                  </div>
                )}
                {selectedGame === "truth-or-drink" && (
                  <div className="mt-4">
                    <ComboBox
                      options={editions || []}
                      handleSelect={setSelectedEdition}
                      value={selectedEdition}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center flex-wrap">
                {!roomId && permissionToCreateRoooms && (
                  <button
                    onClick={handleCreateRoom}
                    disabled={
                      !selectedGame ||
                      (selectedGame === "most-likely" && players.length < 3) ||
                      (selectedGame === "verbal-charades" &&
                        players.length < 4) ||
                      (selectedGame === "higher-lower" && players.length < 2) ||
                      (selectedGame === "never-have-i-ever" &&
                        players.length < 2) ||
                      (selectedGame === "truth-or-drink" &&
                        players.length < 2) ||
                      (selectedGame === "catherines-special" &&
                        players.length < 2) ||
                      (selectedGame === "would-you-rather" &&
                        players.length < 3) ||
                      (selectedGame === "pick-a-card" && players.length < 3) ||
                      (selectedGame === "imposter" && players.length < 4) ||
                      (selectedGame === "triviyay" && teams.length > 2)
                    }
                    className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
                  >
                    <Building className="w-5 h-5" />
                    Create Room
                  </button>
                )}

                {roomId && permissionToCreateRoooms && !showShareLink && (
                  <button
                    onClick={generateShareLink}
                    className="flex items-center gap-2 px-8 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    Share Link
                  </button>
                )}

                {showShareLink && (
                  <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-center">
                    <p className="text-green-300">
                      Link copied to clipboard! 🎉
                    </p>
                  </div>
                )}
              </div>

              {roomId && permissionToCreateRoooms && (
                <div className="wfull mt-6 text-center flex flex-row justify-center items-center gap-2">
                  <button
                    onClick={startGame}
                    disabled={!selectedGame}
                    className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    Start Game
                  </button>
                </div>
              )}

              {!permissionToCreateRoooms && (
                <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-center">
                  <p className="text-red-300">
                    You don&apos;t have permission to create rooms please
                    contact Admin
                  </p>
                </div>
              )}

              {gameUrl !== "" && (
                <div className="wfull mt-6  flex flex-row justify-center items-center">
                  <QRCodeCanvas
                    value={gameUrl}
                    size={220}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                    includeMargin
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
