-- AlterTable
ALTER TABLE "User" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
