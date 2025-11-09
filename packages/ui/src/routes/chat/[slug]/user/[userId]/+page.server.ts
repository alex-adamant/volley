import { calculateResults } from "$lib/rating";
import { prisma } from "$lib/server/prisma";

export async function load({ params }) {
  const { userId, slug } = params;

  const users = await prisma.chatUser.findMany({
    where: { Chat: { is: { slug } } },
    include: { User: true },
  });

  const user = users.find((u) => u.User.id === Number(userId));

  if (!user) {
    throw new Error("User not found");
  }

  const matches = await prisma.match.findMany({
    where: { Chat: { is: { slug } } },
    orderBy: { id: "asc" },
  });

  const results = calculateResults(users, matches).filter((p) => !p.isHidden);

  const result = results.find((r) => r.userId === Number(userId));

  if (!result) {
    throw new Error("Result not found");
  }

  return { user: user.User, result };
}
