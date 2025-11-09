import { PrismaClient } from "@prisma/client";
import { calculateResults } from "$lib/rating";

const prisma = new PrismaClient();

export async function load({ params, url }) {
  const slug = params.slug;

  const showHidden = url.searchParams.get("showHidden") === "true";

  const users = await prisma.chatUser.findMany({
    where: { chat: { slug } },
    include: { user: true },
    orderBy: { userId: "asc" },
  });

  const matches = await prisma.match.findMany({
    where: { chat: { slug } },
    orderBy: { id: "asc" },
  });

  const results = calculateResults(users, matches).filter(
    (p) => showHidden || !p.isHidden,
  );

  return { results };
}
