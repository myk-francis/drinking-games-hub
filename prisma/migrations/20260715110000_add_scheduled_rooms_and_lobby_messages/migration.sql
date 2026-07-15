ALTER TABLE "Room"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'LIVE',
  ADD COLUMN "scheduledStartAt" TIMESTAMP(3),
  ADD COLUMN "lobbyOpenedAt" TIMESTAMP(3);

CREATE TABLE "LobbyMessage" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "playerName" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LobbyMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LobbyMessage_roomId_createdAt_idx" ON "LobbyMessage"("roomId", "createdAt");

ALTER TABLE "LobbyMessage"
  ADD CONSTRAINT "LobbyMessage_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "Room"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
