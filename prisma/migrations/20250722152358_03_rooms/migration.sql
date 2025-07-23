-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "currentPlayerId" TEXT,
ADD COLUMN     "currentQuestionId" INTEGER,
ADD COLUMN     "previousPlayersIds" TEXT[],
ADD COLUMN     "previousQuestionsId" INTEGER[];
