-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "currentAnswer" TEXT,
ADD COLUMN     "currentCard" INTEGER,
ADD COLUMN     "lastCard" INTEGER,
ADD COLUMN     "previousCards" INTEGER[];
