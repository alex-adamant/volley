/*
  Warnings:

  - You are about to drop the column `initialGames` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `initialRating` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isAdmin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isHidden` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "initialGames",
DROP COLUMN "initialRating",
DROP COLUMN "isActive",
DROP COLUMN "isAdmin",
DROP COLUMN "isHidden";
