import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

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
