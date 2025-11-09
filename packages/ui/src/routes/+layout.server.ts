import { prisma } from "$lib/server/prisma";

export async function load() {
  const chats = await prisma.chat.findMany();
  return { chats };
}
