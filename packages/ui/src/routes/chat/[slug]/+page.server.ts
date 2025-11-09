import { prisma } from "$lib/server/prisma";
import { calculateResults } from "$lib/rating";

export async function load({ params, url }) {
  const slug = params.slug;

  const showHidden = url.searchParams.get("showHidden") === "true";

  const users = await prisma.chatUser.findMany({
    where: { Chat: { is: { slug } } },
    include: { User: true },
    orderBy: { userId: "asc" },
  });

  const matches = await prisma.match.findMany({
    where: { Chat: { is: { slug } } },
    orderBy: { id: "asc" },
  });

  const results = calculateResults(users, matches).filter(
    (p) => showHidden || !p.isHidden,
  );

  return { results };
}
