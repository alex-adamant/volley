import { error, fail, redirect } from "@sveltejs/kit";
import { adminEnabled, assertAdmin, isAdmin } from "$lib/server/admin";
import { buildEloStats } from "$lib/server/elo-stats";
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
  const adminUser = await isAdmin(cookies);
  const isSeason = activeRange.key.startsWith("season");
  const disableSeasonBoost =
    adminUser && url.searchParams.get("seasonBoost") === "base" && isSeason;

  const chatUsers = await prisma.chatUser.findMany({
    where: { Chat: { is: { slug } } },
    include: { User: true },
    orderBy: { userId: "asc" },
  });

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

  const filteredMatches = matches;

  const eloStats = buildEloStats({
    players: chatUsers,
    matches: filteredMatches,
    isSeason,
    disableSeasonBoost,
  });

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
    ...(eloStats.matchViews.get(match.id) ?? {
      teamAWinProbability: 0.5,
      teamBWinProbability: 0.5,
      teamAAvgRatingBefore: 1500,
      teamBAvgRatingBefore: 1500,
      playerA1RatingBefore: 1500,
      playerA2RatingBefore: 1500,
      playerB1RatingBefore: 1500,
      playerB2RatingBefore: 1500,
      favoriteSide: null,
      underdogWon: false,
    }),
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
    playerOptions: chatUsers.map((item) => ({
      id: item.userId,
      name: item.User.name,
      isActive: item.isActive,
      isHidden: item.isHidden,
      isAdmin: item.isAdmin,
    })),
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
    isAdmin: adminUser,
    adminEnabled: await adminEnabled(),
  };
}

const parseDateInput = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
};

const hasDuplicatePlayers = (playerIds: number[]) =>
  new Set(playerIds).size !== playerIds.length;

export const actions = {
  createMatch: async ({ params, request, cookies, url }) => {
    await assertAdmin(cookies);

    const data = await request.formData();
    const playerA1Id = Number(data.get("playerA1Id"));
    const playerA2Id = Number(data.get("playerA2Id"));
    const playerB1Id = Number(data.get("playerB1Id"));
    const playerB2Id = Number(data.get("playerB2Id"));
    const teamAScore = Number(data.get("teamAScore"));
    const teamBScore = Number(data.get("teamBScore"));
    const league = Number(data.get("league"));
    const dayValue = String(data.get("day") ?? "");
    const day = parseDateInput(dayValue);

    const players = [playerA1Id, playerA2Id, playerB1Id, playerB2Id];
    const hasInvalidPlayer = players.some(
      (value) => !Number.isInteger(value) || value <= 0,
    );

    if (
      hasInvalidPlayer ||
      hasDuplicatePlayers(players) ||
      Number.isNaN(teamAScore) ||
      Number.isNaN(teamBScore) ||
      Number.isNaN(league) ||
      !day
    ) {
      return fail(400, { message: "Invalid match data." });
    }

    const chat = await prisma.chat.findUnique({ where: { slug: params.slug } });
    if (!chat) {
      throw error(404, "Chat not found");
    }

    await prisma.match.create({
      data: {
        day,
        playerA1Id,
        playerA2Id,
        playerB1Id,
        playerB2Id,
        teamAScore,
        teamBScore,
        league,
        chatId: chat.id,
      },
    });

    const nextParams = new URLSearchParams(url.searchParams);
    nextParams.set("day", toDayKey(day));

    throw redirect(303, `${url.pathname}?${nextParams.toString()}`);
  },
  updateMatch: async ({ request, cookies, params, url }) => {
    await assertAdmin(cookies);

    const data = await request.formData();
    const matchId = Number(data.get("matchId"));
    const playerA1Id = Number(data.get("playerA1Id"));
    const playerA2Id = Number(data.get("playerA2Id"));
    const playerB1Id = Number(data.get("playerB1Id"));
    const playerB2Id = Number(data.get("playerB2Id"));
    const teamAScore = Number(data.get("teamAScore"));
    const teamBScore = Number(data.get("teamBScore"));
    const league = Number(data.get("league"));
    const dayValue = String(data.get("day") ?? "");
    const day = parseDateInput(dayValue);

    const players = [playerA1Id, playerA2Id, playerB1Id, playerB2Id];
    const hasInvalidPlayer = players.some(
      (value) => !Number.isInteger(value) || value <= 0,
    );

    if (
      !matchId ||
      hasInvalidPlayer ||
      hasDuplicatePlayers(players) ||
      Number.isNaN(teamAScore) ||
      Number.isNaN(teamBScore) ||
      Number.isNaN(league) ||
      !day
    ) {
      return fail(400, { message: "Invalid match data." });
    }

    const chat = await prisma.chat.findUnique({ where: { slug: params.slug } });
    if (!chat) {
      throw error(404, "Chat not found");
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.chatId !== chat.id) {
      throw error(404, "Match not found");
    }

    await prisma.match.update({
      where: { id: matchId },
      data: {
        day,
        playerA1Id,
        playerA2Id,
        playerB1Id,
        playerB2Id,
        teamAScore,
        teamBScore,
        league,
      },
    });

    const nextParams = new URLSearchParams(url.searchParams);
    nextParams.set("day", toDayKey(day));

    throw redirect(303, `${url.pathname}?${nextParams.toString()}`);
  },
  deleteMatch: async ({ request, cookies, params }) => {
    await assertAdmin(cookies);

    const data = await request.formData();
    const matchId = Number(data.get("matchId"));

    if (!matchId) {
      return fail(400, { message: "Invalid match." });
    }

    const chat = await prisma.chat.findUnique({ where: { slug: params.slug } });
    if (!chat) {
      throw error(404, "Chat not found");
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.chatId !== chat.id) {
      throw error(404, "Match not found");
    }

    await prisma.match.delete({ where: { id: matchId } });

    return { success: true };
  },
};
