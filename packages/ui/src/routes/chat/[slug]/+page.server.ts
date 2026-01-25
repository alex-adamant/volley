import { error } from "@sveltejs/kit";
import { calculateWinrate } from "$lib";
import { calculateResults } from "$lib/rating";
import {
  buildPlayerForm,
  buildPlayerMatchDetails,
  buildPlayerResultDetails,
  getCurrentStreak,
} from "$lib/stats";
import { adminEnabled, isAdmin } from "$lib/server/admin";
import { prisma } from "$lib/server/prisma";
import { getRangeOptions } from "$lib/server/ranges";

export async function load({ params, url, cookies }) {
  const slug = params.slug;
  const rangeKey = url.searchParams.get("range") ?? "all";

  const adminUser = await isAdmin(cookies);
  const status = url.searchParams.get("status") ?? "active";

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

  const users = await prisma.chatUser.findMany({
    where: { Chat: { is: { slug } } },
    include: { User: true },
    orderBy: { userId: "asc" },
  });

  const matches = await prisma.match.findMany({
    where: {
      Chat: { is: { slug } },
      ...(activeRange.start && activeRange.end
        ? { day: { gte: activeRange.start, lte: activeRange.end } }
        : {}),
    },
    orderBy: { id: "asc" },
  });

  const fullForms = buildPlayerForm(matches);
  const resultDetails = buildPlayerResultDetails(matches, 6);
  const matchDetails = buildPlayerMatchDetails(matches, 6);
  const lastMatchDay = matches.at(-1)?.day ?? null;
  const lastMatchKey = lastMatchDay ? lastMatchDay.toDateString() : null;
  const lastDayPlayers = new Set<number>();
  if (lastMatchKey) {
    for (const match of matches) {
      if (match.day.toDateString() === lastMatchKey) {
        lastDayPlayers.add(match.playerA1Id);
        lastDayPlayers.add(match.playerA2Id);
        lastDayPlayers.add(match.playerB1Id);
        lastDayPlayers.add(match.playerB2Id);
      }
    }
  }
  const userNameMap = new Map(
    users.map((item) => [item.userId, item.User.name]),
  );

  const results = calculateResults(
    users,
    matches,
    activeRange.start
      ? { startDate: activeRange.start, endDate: activeRange.end }
      : undefined,
  )
    .filter((p) => !p.isHidden)
    .filter((p) => (status === "active" ? p.isActive : true))
    .map((player) => {
      const history = fullForms.get(player.id) ?? [];
      const recentResults = resultDetails.get(player.id) ?? [];
      const matchHistory = matchDetails.get(player.id) ?? [];
      const recentMatches = matchHistory.map((detail) => ({
        result: detail.result,
        score: detail.score,
        teammates: detail.teammateIds.map(
          (id) => userNameMap.get(id) ?? `Player ${id}`,
        ),
        opponents: detail.opponentIds.map(
          (id) => userNameMap.get(id) ?? `Player ${id}`,
        ),
      }));
      const recentForm = recentMatches.map((detail) => detail.result);
      return {
        ...player,
        winrate: calculateWinrate(player),
        recentForm,
        currentStreak: getCurrentStreak(history),
        recentResults,
        recentMatches,
        playedLastDay: lastDayPlayers.has(player.id),
      };
    });

  const activePlayers = users.filter((p) => p.isActive && !p.isHidden).length;
  const ratings = results.map((player) => player.rating);
  const ratingHigh = ratings.length ? Math.max(...ratings) : null;
  const ratingLow = ratings.length ? Math.min(...ratings) : null;
  const averageRating = ratings.length
    ? Math.round(
        ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
      )
    : null;
  const totalGames = results.reduce((sum, player) => sum + player.games, 0);
  const averageGames = results.length ? totalGames / results.length : null;
  const totalPoints = matches.reduce(
    (sum, match) => sum + match.teamAScore + match.teamBScore,
    0,
  );
  const averagePoints = matches.length ? totalPoints / matches.length : null;
  const averageMargin = matches.length
    ? matches.reduce(
        (sum, match) => sum + Math.abs(match.teamAScore - match.teamBScore),
        0,
      ) / matches.length
    : null;
  const formatDay = (value: Date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(value);

  let biggestMargin: { value: number; day: string } | null = null;
  let closestMatch: { value: number; day: string } | null = null;

  for (const match of matches) {
    const margin = Math.abs(match.teamAScore - match.teamBScore);
    if (!biggestMargin || margin > biggestMargin.value) {
      biggestMargin = { value: margin, day: formatDay(match.day) };
    }
    if (!closestMatch || margin < closestMatch.value) {
      closestMatch = { value: margin, day: formatDay(match.day) };
    }
  }

  const mostActivePlayer = results.reduce(
    (best, player) => {
      if (!best || player.games > best.games) {
        return { name: player.name, games: player.games };
      }
      return best;
    },
    null as { name: string; games: number } | null,
  );

  const winratePool = results.filter((player) => player.games >= 5);
  const bestWinrate = (winratePool.length ? winratePool : results).reduce(
    (best, player) => {
      if (!best || player.winrate > best.winrate) {
        return { name: player.name, winrate: player.winrate };
      }
      return best;
    },
    null as { name: string; winrate: number } | null,
  );

  return {
    chat,
    results,
    status,
    stats: {
      playersTotal: users.length,
      playersActive: activePlayers,
      matchesTotal: matches.length,
      lastMatchDay,
      ratingHigh,
      ratingLow,
      averageRating,
      totalGames,
      averageGames,
      totalPoints,
      averagePoints,
      averageMargin,
      mostActivePlayer,
      bestWinrate,
      biggestMargin,
      closestMatch,
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
    isAdmin: adminUser,
    adminEnabled: await adminEnabled(),
  };
}
