-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "platerTwoId" TEXT,
ADD COLUMN     "playerOneId" TEXT;
