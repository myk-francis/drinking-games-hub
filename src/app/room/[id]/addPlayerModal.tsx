"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";

const roomPickerDialogClassName =
  "left-4 right-4 top-4 bottom-4 w-auto max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-[1.75rem] border-white/10 bg-zinc-950/96 p-5 text-white shadow-2xl sm:left-[50%] sm:right-auto sm:top-[50%] sm:bottom-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:p-6";

export default function AddPlayerModal({
  newPlayer,
  setNewPlayer,
  handleAddPlayer,
  openAddPlayerModal,
  setOpenAddPlayerModal,
  teams,
  selectedGame,
  handleAddPlayerToTeam,
  newTeamPlayer,
  setNewTeamPlayer,
  teamPlayers,
  selectedTeamPlayerId,
  setSelectedTeamPlayerId,
  handleAssignExistingPlayerToTeam,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) {
  const [selectedTeam, setSelectedTeam] = React.useState<string | null>(null);

  if (!openAddPlayerModal) {
    return null;
  }

  if (selectedGame === "codenames" && teams.length > 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Dialog open={openAddPlayerModal} onOpenChange={setOpenAddPlayerModal}>
          <DialogContent className={roomPickerDialogClassName}>
            <DialogHeader>
              <DialogTitle>Pick Team</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Choose a team
                </p>

                <div className="flex flex-wrap gap-2">
                  {teams.map((team: string) => {
                    const isSelected = selectedTeam === team;

                    return (
                      <button
                        key={team}
                        onClick={() => setSelectedTeam(team)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all
                      ${
                        isSelected
                          ? "scale-105 bg-green-600 text-white"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }
                    `}
                      >
                        {team}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Choose your name
                </p>
                <div className="flex flex-wrap gap-2">
                  {teamPlayers?.map((player: { id: string; name: string }) => {
                    const isSelected = selectedTeamPlayerId === player.id;
                    return (
                      <button
                        key={player.id}
                        onClick={() => setSelectedTeamPlayerId(player.id)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all
                        ${
                          isSelected
                            ? "scale-105 bg-green-600 text-white"
                            : "bg-white/20 text-white hover:bg-white/30"
                        }`}
                      >
                        {player.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                disabled={!selectedTeam || !selectedTeamPlayerId}
                onClick={() => {
                  handleAssignExistingPlayerToTeam({
                    team: selectedTeam,
                    playerId: selectedTeamPlayerId,
                  });
                }}
              >
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (selectedGame === "triviyay" && teams.length > 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Dialog open={openAddPlayerModal} onOpenChange={setOpenAddPlayerModal}>
          <DialogContent className={roomPickerDialogClassName}>
            <DialogHeader>
              <DialogTitle>Add Player</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* TEAM PICKER */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Choose a team
                </p>

                <div className="flex flex-wrap gap-2">
                  {teams.map((team: string) => {
                    const isSelected = selectedTeam === team;

                    return (
                      <button
                        key={team}
                        onClick={() => setSelectedTeam(team)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all
                      ${
                        isSelected
                          ? "scale-105 bg-green-600 text-white"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }
                    `}
                      >
                        {team}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* NAME INPUT */}
              <Input
                type="text"
                placeholder="Enter player name"
                value={newTeamPlayer}
                onChange={(e) => setNewTeamPlayer(e.target.value)}
              />

              {/* ADD BUTTON */}
              <Button
                disabled={!selectedTeam || !newPlayer.trim()}
                onClick={() => {
                  handleAddPlayerToTeam({
                    team: selectedTeam,
                    playerName: newPlayer,
                  });
                }}
              >
                Add
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Dialog open={openAddPlayerModal} onOpenChange={setOpenAddPlayerModal}>
          <DialogContent className={roomPickerDialogClassName}>
            <DialogHeader>
              <DialogTitle>Choose a player</DialogTitle>
              <DialogDescription>
                <span className="flex flex-col space-y-2">
                  <Input
                    type="text"
                    placeholder="Enter player name"
                    value={newPlayer}
                    onChange={(e) => setNewPlayer(e.target.value)}
                  />
                  <Button variant="default" onClick={() => handleAddPlayer()}>
                    Add
                  </Button>
                </span>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
}
