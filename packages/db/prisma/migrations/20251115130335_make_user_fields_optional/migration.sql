-- AlterTable
ALTER TABLE "User" ALTER COLUMN "isActive" DROP NOT NULL,
ALTER COLUMN "isHidden" DROP NOT NULL,
ALTER COLUMN "initialRating" DROP NOT NULL,
ALTER COLUMN "initialGames" DROP NOT NULL,
ALTER COLUMN "isAdmin" DROP NOT NULL;

-- AlterTable
ALTER TABLE "_ChatToUser" ADD CONSTRAINT "_ChatToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ChatToUser_AB_unique";
