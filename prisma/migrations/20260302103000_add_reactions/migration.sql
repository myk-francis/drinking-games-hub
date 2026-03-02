CREATE TABLE "Reaction" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "senderPlayerId" TEXT NOT NULL,
  "targetPlayerId" TEXT,
  "emoji" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Reaction_roomId_createdAt_idx" ON "Reaction"("roomId", "createdAt");
CREATE INDEX "Reaction_senderPlayerId_createdAt_idx" ON "Reaction"("senderPlayerId", "createdAt");

ALTER TABLE "Reaction"
  ADD CONSTRAINT "Reaction_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "Room"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reaction"
  ADD CONSTRAINT "Reaction_senderPlayerId_fkey"
  FOREIGN KEY ("senderPlayerId") REFERENCES "Player"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reaction"
  ADD CONSTRAINT "Reaction_targetPlayerId_fkey"
  FOREIGN KEY ("targetPlayerId") REFERENCES "Player"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
