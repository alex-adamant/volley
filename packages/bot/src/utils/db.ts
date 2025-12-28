import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function getChat(id: string) {
  return prisma.chat.findUnique({ where: { id } });
}

export async function getChatUser(userId: number, chatId: string) {
  return prisma.chatUser.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
  });
}

export async function getAdminChats(userId: number) {
  const chatUsers = await prisma.chatUser.findMany({
    where: {
      userId,
      isAdmin: true,
    },
    include: { Chat: true },
  });
  return chatUsers.map((cu) => cu.Chat);
}

export async function getActiveUsers(chatId: string) {
  return prisma.user.findMany({
    where: { chatUsers: { some: { chatId, isActive: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getInactiveUsers(chatId: string) {
  return prisma.user.findMany({
    where: { chatUsers: { some: { chatId, isActive: false } } },
    orderBy: { name: "asc" },
  });
}
