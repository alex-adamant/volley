import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function load() {
  const chats = await prisma.chat.findMany();
  return { chats };
}
