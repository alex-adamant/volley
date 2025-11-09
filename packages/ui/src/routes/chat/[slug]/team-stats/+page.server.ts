import { getTeamStats } from "$lib/teams";
import { prisma } from "$lib/server/prisma";

export async function load({ params }) {
  const slug = params.slug;

  const users = await prisma.user.findMany({
    where: { chatUsers: { some: { Chat: { slug } } } },
    orderBy: { id: "asc" },
  });

  const matches = await prisma.match.findMany({
    where: { Chat: { slug } },
    orderBy: { id: "asc" },
  });

  const teamStats = getTeamStats(users, matches);

  return { teamStats };
}
