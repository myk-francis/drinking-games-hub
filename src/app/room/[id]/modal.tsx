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

export default function UserConfirmModal({
  players,
  handleActualSelectPlayer,
}: any) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose a player</DialogTitle>
            <DialogDescription>
              <div className="flex flex-col space-y-2">
                {players.map((player: { id: string; name: string }) => (
                  <Button
                    key={player.id}
                    variant="outline"
                    onClick={() => handleActualSelectPlayer(player.id)}
                  >
                    {player.name}
                  </Button>
                ))}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
