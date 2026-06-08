-- CreateEnum
CREATE TYPE "consultation_language" AS ENUM ('EN', 'HA', 'YO', 'IG', 'PCM');

-- AlterTable
ALTER TABLE "consultations" ADD COLUMN "language" "consultation_language" NOT NULL DEFAULT 'EN';

-- AlterTable
ALTER TABLE "chats" ADD COLUMN "language" "consultation_language";
