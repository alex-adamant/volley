import { error } from "@sveltejs/kit";
import { adminEnabled, isAdmin } from "$lib/server/admin";
import { prisma } from "$lib/server/prisma";
import { getRangeOptions } from "$lib/server/ranges";

const toDayKey = (value: Date) => value.toLocaleDateString("en-CA");

const formatDay = (value: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value);

export async function load({ params, url, cookies }) {
  const slug = params.slug;
  const rangeKey = url.searchParams.get("range") ?? "all";
  const statusParam = url.searchParams.get("status") ?? "active";
  const status = statusParam === "all" ? "all" : "active";
  const dayParam = url.searchParams.get("day");

  const chat = await prisma.chat.findUnique({ where: { slug } });
  if (!chat) {
    throw error(404, "Chat not found");
  }

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
  const hiddenUserIds = new Set(
    chatUsers.filter((user) => user.isHidden).map((user) => user.userId),
  );
  const playerMap = new Map(
    chatUsers.map((item) => [item.userId, item.User.name]),
  );

  const matches = await prisma.match.findMany({
    where: {
      Chat: { is: { slug } },
      ...(activeRange.start && activeRange.end
        ? { day: { gte: activeRange.start, lte: activeRange.end } }
        : {}),
    },
    orderBy: { day: "desc" },
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

  const days = Array.from(
    filteredMatches.reduce((map, match) => {
      const key = toDayKey(match.day);
      if (!map.has(key)) {
        map.set(key, match.day);
      }
      return map;
    }, new Map<string, Date>()),
  )
    .map(([key, date]) => ({ key, date }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const fallbackDay = days[0]?.key ?? null;
  const selectedKey = dayParam ?? fallbackDay;
  const selectedDate = selectedKey ? new Date(`${selectedKey}T00:00:00`) : null;
  const normalizedKey = selectedDate ? toDayKey(selectedDate) : null;

  const dayMatches = normalizedKey
    ? filteredMatches.filter((match) => toDayKey(match.day) === normalizedKey)
    : [];

  const dayIndex = normalizedKey
    ? days.findIndex((day) => day.key === normalizedKey)
    : -1;
  const prevDay = dayIndex >= 0 ? days[dayIndex + 1] : null;
  const nextDay = dayIndex > 0 ? days[dayIndex - 1] : null;

  const standingsMap = new Map<
    number,
    {
      id: number;
      name: string;
      wins: number;
      losses: number;
      pointsFor: number;
      pointsAgainst: number;
    }
  >();

  const ensurePlayer = (id: number) => {
    if (hiddenUserIds.has(id)) return null;
    if (!standingsMap.has(id)) {
      standingsMap.set(id, {
        id,
        name: playerMap.get(id) ?? `Player ${id}`,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      });
    }
    return standingsMap.get(id)!;
  };

  for (const match of dayMatches) {
    const teamAWon = match.teamAScore > match.teamBScore;
    const teamBWon = match.teamBScore > match.teamAScore;

    const teamA = [match.playerA1Id, match.playerA2Id];
    const teamB = [match.playerB1Id, match.playerB2Id];

    for (const playerId of teamA) {
      const player = ensurePlayer(playerId);
      if (!player) continue;
      player.pointsFor += match.teamAScore;
      player.pointsAgainst += match.teamBScore;
      player.wins += teamAWon ? 1 : 0;
      player.losses += teamBWon ? 1 : 0;
    }

    for (const playerId of teamB) {
      const player = ensurePlayer(playerId);
      if (!player) continue;
      player.pointsFor += match.teamBScore;
      player.pointsAgainst += match.teamAScore;
      player.wins += teamBWon ? 1 : 0;
      player.losses += teamAWon ? 1 : 0;
    }
  }

  const standings = [...standingsMap.values()]
    .map((player) => ({
      ...player,
      games: player.wins + player.losses,
      pointDiff: player.pointsFor - player.pointsAgainst,
    }))
    .sort(
      (a, b) =>
        b.wins - a.wins || b.pointDiff - a.pointDiff || b.games - a.games,
    );

  const matchViews = dayMatches.map((match) => ({
    ...match,
    playerA1Name: playerMap.get(match.playerA1Id) ?? "Unknown",
    playerA2Name: playerMap.get(match.playerA2Id) ?? "Unknown",
    playerB1Name: playerMap.get(match.playerB1Id) ?? "Unknown",
    playerB2Name: playerMap.get(match.playerB2Id) ?? "Unknown",
  }));

  const todayKey = toDayKey(new Date());
  const isToday = normalizedKey === todayKey;

  return {
    chat,
    status,
    days: days.map((day) => ({
      key: day.key,
      label: formatDay(day.date),
    })),
    selectedDay: normalizedKey
      ? {
          key: normalizedKey,
          label: formatDay(selectedDate ?? new Date()),
        }
      : null,
    prevDay: prevDay
      ? { key: prevDay.key, label: formatDay(prevDay.date) }
      : null,
    nextDay: nextDay
      ? { key: nextDay.key, label: formatDay(nextDay.date) }
      : null,
    isToday,
    standings,
    matches: matchViews,
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
    isAdmin: await isAdmin(cookies),
    adminEnabled: await adminEnabled(),
  };
}
