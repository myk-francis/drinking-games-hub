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

const roomPickerDialogClassName =
  "left-4 right-4 top-4 bottom-4 w-auto max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-[1.75rem] border-white/10 bg-zinc-950/96 p-5 text-white shadow-2xl sm:left-[50%] sm:right-auto sm:top-[50%] sm:bottom-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:p-6";

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
          <DialogContent className={roomPickerDialogClassName}>
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
                          className="min-h-11 justify-start border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
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
          <DialogContent className={roomPickerDialogClassName}>
            <DialogHeader>
              <DialogTitle>Choose a player</DialogTitle>
              <DialogDescription>
                <span className="flex flex-col space-y-2">
                  {players.map((player: { id: string; name: string }) => (
                    <Button
                      key={player.id}
                      variant="outline"
                      className="min-h-11 justify-start border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
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
