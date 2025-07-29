/*
  Warnings:

  - You are about to drop the column `code` on the `Parms` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `Parms` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Parms" DROP COLUMN "code",
DROP COLUMN "expiresAt";
