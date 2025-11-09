import { PrismaClient } from "@prisma/client";
import { calculateResults } from "$lib/rating";

const prisma = new PrismaClient();

export async function load({ params }) {
  const { userId, slug } = params;

  const users = await prisma.chatUser.findMany({
    where: { chat: { slug } },
    include: { user: true },
  });

  const user = users.find((u) => u.user.id === Number(userId));

  if (!user) {
    throw new Error("User not found");
  }

  const matches = await prisma.match.findMany({
    where: { chat: { slug } },
    orderBy: { id: "asc" },
  });

  const results = calculateResults(users, matches).filter((p) => !p.isHidden);

  const result = results.find((r) => r.userId === Number(userId));

  if (!result) {
    throw new Error("Result not found");
  }

  return { user: user.user, result };
}
