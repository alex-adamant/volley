-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "telegramId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "initiallyActive" BOOLEAN NOT NULL DEFAULT false,
    "initialRating" INTEGER NOT NULL DEFAULT 1500,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "playerA1Id" INTEGER NOT NULL,
    "playerA2Id" INTEGER NOT NULL,
    "playerB1Id" INTEGER NOT NULL,
    "playerB2Id" INTEGER NOT NULL,
    "teamAScore" INTEGER NOT NULL,
    "teamBScore" INTEGER NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_playerA1Id_fkey" FOREIGN KEY ("playerA1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_playerA2Id_fkey" FOREIGN KEY ("playerA2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_playerB1Id_fkey" FOREIGN KEY ("playerB1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_playerB2Id_fkey" FOREIGN KEY ("playerB2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
