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

export default function AddPlayerModal({
  newPlayer,
  setNewPlayer,
  handleAddPlayer,
  openAddPlayerModal,
  setOpenAddPlayerModal,
  teams,
  selectedGame,
  handleAddPlayerToTeam,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) {
  const [selectedTeam, setSelectedTeam] = React.useState<string | null>(null);

  console.log({ selectedGame, teams });

  if (!openAddPlayerModal) {
    return null;
  }

  if (selectedGame === "triviyay" && teams.length > 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Dialog open={openAddPlayerModal} onOpenChange={setOpenAddPlayerModal}>
          <DialogContent className="sm:max-w-md">
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
                          ? "bg-green-600 text-white scale-105"
                          : "bg-white/20 hover:bg-white/30"
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
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
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
          <DialogContent className="sm:max-w-md">
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
