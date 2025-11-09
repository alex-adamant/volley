import { PrismaClient } from "@prisma/client";
import { getTeamStats } from "$lib/teams";

const prisma = new PrismaClient();

export async function load({ params }) {
  const slug = params.slug;

  const users = await prisma.user.findMany({
    where: { chatUser: { some: { chat: { slug } } } },
    orderBy: { id: "asc" },
  });

  const matches = await prisma.match.findMany({
    where: { chat: { slug } },
    orderBy: { id: "asc" },
  });

  const teamStats = getTeamStats(users, matches);

  return { teamStats };
}
