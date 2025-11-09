-- CreateTable
CREATE TABLE "Chat" (
    "id" SERIAL NOT NULL,
    "chatId" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);
