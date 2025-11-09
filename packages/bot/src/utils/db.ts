import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function getActiveUsers(chatId?: string) {
  return prisma.user.findMany({
    where: { isActive: true, chats: { some: { id: chatId?.toString() } } },
    orderBy: { name: "asc" },
  });
}

export async function getInactiveUsers(chatId?: string) {
  return prisma.user.findMany({
    where: { isActive: false, chats: { some: { id: chatId?.toString() } } },
    orderBy: { name: "asc" },
  });
}

export async function getChatUsers(chatId?: string) {
  if (!chatId) return [];

  return prisma.user.findMany({
    where: { chats: { some: { id: chatId } } },
    orderBy: { name: "asc" },
  });
}
