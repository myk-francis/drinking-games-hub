"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Player = {
  id: string;
  name: string;
  team: string;
};

export default function UserConfirmModal({
  players,
  handleActualSelectPlayer,
  selectedGame,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) {
  const [open, setOpen] = useState(true);

  const groupedPlayers = players.reduce(
    (acc: Record<string, Player[]>, player: Player) => {
      const team = player.team || "Unassigned";

      if (!acc[team]) {
        acc[team] = [];
      }

      acc[team].push(player);
      return acc;
    },
    {},
  );

  if (selectedGame === "triviyay") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose a player</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {Object.entries(groupedPlayers)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([team, teamPlayers]) => (
                  <div key={team}>
                    <h3 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
                      {team}
                    </h3>

                    <div className="flex flex-col space-y-2">
                      {(teamPlayers as Player[]).map((player: Player) => (
                        <Button
                          key={player.id}
                          variant="outline"
                          onClick={() => handleActualSelectPlayer(player.id)}
                        >
                          {player.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose a player</DialogTitle>
              <DialogDescription>
                <span className="flex flex-col space-y-2">
                  {players.map((player: { id: string; name: string }) => (
                    <Button
                      key={player.id}
                      variant="outline"
                      onClick={() => handleActualSelectPlayer(player.id)}
                    >
                      {player.name}
                    </Button>
                  ))}
                </span>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
}
