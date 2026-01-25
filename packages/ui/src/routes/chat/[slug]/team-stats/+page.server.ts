import { error } from "@sveltejs/kit";
import { adminEnabled, isAdmin } from "$lib/server/admin";
import { prisma } from "$lib/server/prisma";
import { getRangeOptions } from "$lib/server/ranges";
import { getTeamStats } from "$lib/teams";

export async function load({ params, url, cookies }) {
  const slug = params.slug;
  const statusParam = url.searchParams.get("status") ?? "active";
  const status = statusParam === "all" ? "all" : "active";

  const chat = await prisma.chat.findUnique({ where: { slug } });
  if (!chat) {
    throw error(404, "Chat not found");
  }

  const rangeKey = url.searchParams.get("range") ?? "all";
  const seasons = await prisma.season.findMany({
    where: { chatId: chat.id },
    orderBy: { startDate: "desc" },
  });
  const rangeOptions = getRangeOptions(seasons);
  const resolvedKey =
    rangeKey === "season"
      ? rangeOptions.find((range) => range.key.startsWith("season"))?.key
      : rangeKey;
  const activeRange =
    rangeOptions.find((range) => range.key === resolvedKey) ?? rangeOptions[0];

  const chatUsers = await prisma.chatUser.findMany({
    where: { Chat: { is: { slug } } },
    include: { User: true },
    orderBy: { userId: "asc" },
  });
  const activeUserIds = new Set(
    chatUsers
      .filter((user) => user.isActive && !user.isHidden)
      .map((user) => user.userId),
  );
  const users =
    status === "active"
      ? chatUsers
          .filter((user) => user.isActive && !user.isHidden)
          .map((user) => user.User)
      : chatUsers.map((user) => user.User);

  const matches = await prisma.match.findMany({
    where: {
      Chat: { slug },
      ...(activeRange.start && activeRange.end
        ? { day: { gte: activeRange.start, lte: activeRange.end } }
        : {}),
    },
    orderBy: { id: "asc" },
  });

  const filteredMatches =
    status === "active"
      ? matches.filter(
          (match) =>
            activeUserIds.has(match.playerA1Id) &&
            activeUserIds.has(match.playerA2Id) &&
            activeUserIds.has(match.playerB1Id) &&
            activeUserIds.has(match.playerB2Id),
        )
      : matches;

  const teamStats = getTeamStats(users, filteredMatches);

  const activePlayers = chatUsers.filter(
    (p) => p.isActive && !p.isHidden,
  ).length;

  return {
    chat,
    teamStats,
    stats: {
      playersTotal: chatUsers.length,
      playersActive: activePlayers,
      matchesTotal: matches.length,
      lastMatchDay: matches.at(-1)?.day ?? null,
    },
    rangeOptions: rangeOptions.map(({ key, label, note }) => ({
      key,
      label,
      note,
    })),
    activeRange: {
      key: activeRange.key,
      label: activeRange.label,
      note: activeRange.note,
    },
    status,
    isAdmin: await isAdmin(cookies),
    adminEnabled: await adminEnabled(),
  };
}
