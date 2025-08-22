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
import { Input } from "@/components/ui/input";

export default function AddPlayerModal({
  newPlayer,
  setNewPlayer,
  handleAddPlayer,
  openAddPlayerModal,
  setOpenAddPlayerModal,
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any) {
  if (!openAddPlayerModal) {
    return null;
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Dialog open={openAddPlayerModal} onOpenChange={setOpenAddPlayerModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose a player</DialogTitle>
            <DialogDescription>
              <div className="flex flex-col space-y-2">
                <Input
                  type="text"
                  placeholder="Enter player name"
                  value={newPlayer}
                  onChange={(e) => setNewPlayer(e.target.value)}
                />
                <Button variant="default" onClick={() => handleAddPlayer()}>
                  Add
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
