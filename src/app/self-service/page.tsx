"use client";

import React from "react";
import {
  Users,
  Heart,
  Shuffle,
  Gamepad2,
  Rainbow,
  Layers,
  FlaskConical,
  Eye,
  Mic,
  ArrowUpRight,
  Theater,
  ShieldQuestion,
  Compass,
  Crown,
  Sparkles,
  ScrollText,
  VenetianMask,
  Scale,
  Copy,
  Brain,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { Loading } from "@/components/ui/loading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ComboBox } from "@/components/apps-components/comboBox";
import {
  getSelfServiceValidationError,
  normalizeSelfServicePayload,
  type SelfServicePayload,
} from "@/lib/self-service";

interface TeamsInfo {
  teamName: string;
  players: string[];
}

const GameIcon = (gamecode: string) => {
  if (gamecode === "never-have-i-ever") return <Heart className="w-6 h-6" />;
  if (gamecode === "truth-or-drink") return <FlaskConical className="w-6 h-6" />;
  if (gamecode === "most-likely") return <Users className="w-6 h-6" />;
  if (gamecode === "paranoia") return <Eye className="w-6 h-6" />;
  if (gamecode === "rhyme-time") return <Mic className="w-6 h-6" />;
  if (gamecode === "higher-lower") return <ArrowUpRight className="w-6 h-6" />;
  if (gamecode === "verbal-charades") return <Theater className="w-6 h-6" />;
  if (gamecode === "taboo-lite") return <ShieldQuestion className="w-6 h-6" />;
  if (gamecode === "would-you-rather") return <Compass className="w-6 h-6" />;
  if (gamecode === "pick-a-card") return <Shuffle className="w-6 h-6" />;
  if (gamecode === "kings-cup") return <Crown className="w-6 h-6" />;
  if (gamecode === "catherines-special") return <Sparkles className="w-6 h-6" />;
  if (gamecode === "story-building") return <ScrollText className="w-6 h-6" />;
  if (gamecode === "imposter") return <VenetianMask className="w-6 h-6" />;
  if (gamecode === "triviyay") return <Rainbow className="w-6 h-6" />;
  if (gamecode === "truth-or-lie") return <Scale className="w-6 h-6" />;
  if (gamecode === "codenames") return <Layers className="w-6 h-6" />;
  if (gamecode === "memory-chain") return <Brain className="w-6 h-6" />;
  return <Gamepad2 className="w-6 h-6" />;
};

const GameColor = (gamecode: string) => {
  if (gamecode === "never-have-i-ever") return "from-pink-500 to-rose-600";
  if (gamecode === "truth-or-drink") return "from-cyan-500 to-blue-700";
  if (gamecode === "most-likely") return "from-emerald-500 to-lime-600";
  if (gamecode === "paranoia") return "from-slate-600 to-rose-700";
  if (gamecode === "rhyme-time") return "from-violet-500 to-fuchsia-600";
  if (gamecode === "higher-lower") return "from-indigo-600 to-sky-500";
  if (gamecode === "verbal-charades") return "from-amber-500 to-orange-600";
  if (gamecode === "taboo-lite") return "from-teal-500 to-cyan-700";
  if (gamecode === "would-you-rather") return "from-blue-500 to-indigo-700";
  if (gamecode === "pick-a-card") return "from-red-500 to-pink-600";
  if (gamecode === "kings-cup") return "from-yellow-500 to-red-700";
  if (gamecode === "catherines-special") return "from-green-500 to-emerald-700";
  if (gamecode === "story-building") return "from-orange-500 to-amber-700";
  if (gamecode === "imposter") return "from-zinc-700 to-rose-600";
  if (gamecode === "triviyay") return "from-purple-600 to-pink-600";
  if (gamecode === "truth-or-lie") return "from-fuchsia-600 to-indigo-600";
  if (gamecode === "codenames") return "from-red-600 to-blue-700";
  if (gamecode === "memory-chain") return "from-cyan-600 to-slate-700";
  return "from-teal-500 to-cyan-500";
};

export default function SelfServicePage() {
  const trpc = useTRPC();
  const { data: games, isLoading, error } = useQuery(trpc.games.getMany.queryOptions());
  const { data: rounds } = useQuery(trpc.games.getRounds.queryOptions());
  const { data: editions } = useQuery(trpc.games.getEditions.queryOptions());

  const [selectedGame, setSelectedGame] = React.useState<string | null>(null);
  const [players, setPlayers] = React.useState<string[]>([]);
  const [teams, setTeams] = React.useState<string[]>([]);
  const [teamsInfo, setTeamsInfo] = React.useState<TeamsInfo[]>([]);
  const [inputs, setInputs] = React.useState<{ [key: string]: string }>({});
  const [playerInput, setPlayerInput] = React.useState("");
  const [teamInput, setTeamInput] = React.useState("");
  const [selectedRounds, setSelectedRounds] = React.useState<number>(0);
  const [selectedEdition, setSelectedEdition] = React.useState<number>(0);
  const [jsonCopied, setJsonCopied] = React.useState(false);

  const addPlayer = () => {
    if (playerInput.trim() && !players.includes(playerInput.trim())) {
      const newPlayers = playerInput.trim().split(",").map((item) => item.trim()).filter(Boolean);
      setPlayers([...players, ...newPlayers]);
      setPlayerInput("");
    }
  };

  const addTeams = (team: string) => {
    if (team.trim() && !teams.includes(team.trim())) {
      const newTeams = team.trim().split(",").map((item) => item.trim()).filter(Boolean);
      setTeams([...teams, ...newTeams]);
      setTeamInput("");
    }
  };

  const addPlayerToTeam = (team: string) => {
    if (!inputs[team]) return;
    const newPlayers = inputs[team].trim().split(",").map((item) => item.trim()).filter(Boolean);
    setTeamsInfo((prevTeamsInfo) => {
      const teamIndex = prevTeamsInfo.findIndex((teamInfo) => teamInfo.teamName === team);
      if (teamIndex === -1) {
        return [...prevTeamsInfo, { teamName: team, players: newPlayers }];
      }
      return [
        ...prevTeamsInfo.slice(0, teamIndex),
        {
          ...prevTeamsInfo[teamIndex],
          players: [...prevTeamsInfo[teamIndex].players, ...newPlayers],
        },
        ...prevTeamsInfo.slice(teamIndex + 1),
      ];
    });
    setInputs((prevInputs) => ({ ...prevInputs, [team]: "" }));
  };

  const removePlayer = (playerToRemove: string) => {
    setPlayers(players.filter((p) => p !== playerToRemove));
  };

  const removeTeam = (teamToRemove: string) => {
    setTeams(teams.filter((t) => t !== teamToRemove));
    setTeamsInfo(teamsInfo.filter((teamInfo) => teamInfo.teamName !== teamToRemove));
  };

  const clearTeam = (teamToClear: string) => {
    setTeamsInfo(teamsInfo.filter((t) => t.teamName !== teamToClear));
  };

  const handleInputChange = (team: string, value: string) => {
    setInputs((prevInputs) => ({ ...prevInputs, [team]: value }));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addPlayer();
    }
  };

  const handleCopyJson = async () => {
    if (!selectedGame) {
      toast.warning("Please select a game.");
      return;
    }

    const payload: SelfServicePayload = normalizeSelfServicePayload({
      version: 1,
      selectedGame,
      players,
      selectedRounds: selectedGame === "truth-or-drink" ? selectedEdition : selectedRounds,
      teamsInfo,
    });

    const validationError = getSelfServiceValidationError(payload);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 3000);
      toast.success("JSON copied. Send it on WhatsApp.");
    } catch {
      toast.error("Could not copy JSON.");
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <main>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Drinking Games Self Service
            </h1>
            <p className="text-xl text-white/80">
              Choose your game, add players, then copy and send the JSON on WhatsApp.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Game</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {games?.map((game) => (
                <div
                  key={game.id}
                  onClick={() => setSelectedGame(game.code)}
                  className={`relative overflow-hidden rounded-xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                    selectedGame === game.code ? "ring-4 ring-white shadow-2xl scale-105" : "hover:shadow-lg"
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${GameColor(game.code)} opacity-90`} />
                  <div className="relative z-10 text-white">
                    <div className="flex items-center justify-between mb-3">
                      {GameIcon(game.code)}
                      {selectedGame === game.code && (
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{game.name}</h3>
                    <p className="text-sm opacity-90 leading-relaxed">{game.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <h2 className="text-2xl font-bold mb-6 text-center">Add Players</h2>
            {selectedGame === "triviyay" ? (
              <>
                <div className="flex gap-3 mb-4">
                  <Input
                    value={teamInput}
                    onChange={(e) => setTeamInput(e.target.value)}
                    placeholder="Enter team name"
                    className="bg-white text-black"
                  />
                  <Button onClick={() => addTeams(teamInput)}>Add Teams</Button>
                </div>

                {teams.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {teams.map((team) => (
                      <div key={team} className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                        <span>{team}</span>
                        <button onClick={() => removeTeam(team)} className="text-red-400 hover:text-red-300 ml-2">
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {teams.map((team) => (
                  <div key={team} className="mt-4">
                    <div className="flex gap-3 mb-4">
                      <Input
                        value={inputs[team] || ""}
                        onChange={(e) => handleInputChange(team, e.target.value)}
                        placeholder={`Enter players for ${team}`}
                        className="bg-white text-black"
                      />
                      <Button onClick={() => addPlayerToTeam(team)}>Add Players</Button>
                    </div>

                    {teamsInfo.some((teamInfo) => teamInfo.teamName === team) && (
                      <div className="flex flex-wrap gap-3">
                        {teamsInfo
                          .filter((teamInfo) => teamInfo.teamName === team)
                          .map((teamInfoInternal) => (
                            <div key={teamInfoInternal.teamName} className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                              <span>
                                {teamInfoInternal.teamName}: {teamInfoInternal.players.join(", ")}
                              </span>
                            </div>
                          ))}
                        <button onClick={() => clearTeam(team)} className="cursor-pointer flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="flex gap-3 mb-4">
                  <Input
                    value={playerInput}
                    onChange={(e) => setPlayerInput(e.target.value)}
                    placeholder="Enter player name"
                    className="bg-white text-black"
                    onKeyDown={handleKeyDown}
                  />
                  <Button onClick={addPlayer}>Add Players</Button>
                </div>

                {players.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {players.map((player) => (
                      <div key={player} className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                        <span>{player}</span>
                        <button onClick={() => removePlayer(player)} className="text-red-400 hover:text-red-300 ml-2">
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {selectedGame === "higher-lower" && (
              <div className="mt-4">
                <ComboBox options={rounds || []} handleSelect={setSelectedRounds} value={selectedRounds} />
              </div>
            )}
            {selectedGame === "truth-or-drink" && (
              <div className="mt-4">
                <ComboBox options={editions || []} handleSelect={setSelectedEdition} value={selectedEdition} />
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <Button onClick={handleCopyJson} className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold">
                <Copy className="w-5 h-5" />
                Copy JSON
              </Button>
            </div>

            {jsonCopied && (
              <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-center">
                <p className="text-green-300">JSON copied to clipboard.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
