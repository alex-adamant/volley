import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function load() {
  const users = await prisma.user.findMany({
    where: { chats: { some: { id: "-1001849842756" } } },
    orderBy: { id: "asc" },
  });

  const matches = await prisma.match.findMany({ orderBy: { id: "asc" } });

  return { users, matches };
}
