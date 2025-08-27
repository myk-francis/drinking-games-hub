-- AlterTable
ALTER TABLE "public"."Question" ALTER COLUMN "answer" DROP NOT NULL,
ALTER COLUMN "answer" DROP DEFAULT;
