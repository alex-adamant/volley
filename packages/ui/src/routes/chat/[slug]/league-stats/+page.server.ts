import { error } from "@sveltejs/kit";
import { calculateWinrate } from "$lib";
import { calculateResults } from "$lib/rating";
import { adminEnabled, isAdmin } from "$lib/server/admin";
import { prisma } from "$lib/server/prisma";
import { getRangeOptions } from "$lib/server/ranges";

export async function load({ params, url, cookies }) {
  const slug = params.slug;
  const rangeKey = url.searchParams.get("range") ?? "all";
  const statusParam = url.searchParams.get("status") ?? "active";
  const status = statusParam === "all" ? "all" : "active";

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

  const results = calculateResults(
    users,
    matches,
    activeRange.start
      ? { startDate: activeRange.start, endDate: activeRange.end }
      : undefined,
  )
    .filter((player) => !player.isHidden)
    .filter((player) => (status === "active" ? player.isActive : true))
    .map((player) => ({
      ...player,
      winrate: calculateWinrate(player),
    }));

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

  const serveStats = matches.reduce(
    (acc, match) => {
      const diff = match.teamAScore - match.teamBScore;
      acc.teamA.diffTotal += diff;
      acc.teamB.diffTotal -= diff;
      if (diff > 0) {
        acc.teamA.wins += 1;
      } else if (diff < 0) {
        acc.teamB.wins += 1;
      }
      return acc;
    },
    {
      teamA: { games: matches.length, wins: 0, diffTotal: 0 },
      teamB: { games: matches.length, wins: 0, diffTotal: 0 },
    },
  );

  const serveSummary = {
    teamA: {
      ...serveStats.teamA,
      diffAvg: serveStats.teamA.games
        ? serveStats.teamA.diffTotal / serveStats.teamA.games
        : null,
    },
    teamB: {
      ...serveStats.teamB,
      diffAvg: serveStats.teamB.games
        ? serveStats.teamB.diffTotal / serveStats.teamB.games
        : null,
    },
  };

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

  const bestDiff = results.reduce(
    (best, player) => {
      if (!best || player.pointDiff > best.diff) {
        return { name: player.name, diff: player.pointDiff };
      }
      return best;
    },
    null as { name: string; diff: number } | null,
  );

  const topRating = results[0]
    ? { name: results[0].name, rating: results[0].rating }
    : null;

  return {
    chat,
    status,
    stats: {
      playersTotal: users.length,
      playersActive: activePlayers,
      playersShown: results.length,
      matchesTotal: matches.length,
      lastMatchDay: matches.at(-1)?.day ?? null,
      ratingHigh,
      ratingLow,
      averageRating,
      totalGames,
      averageGames,
      totalPoints,
      averagePoints,
      averageMargin,
      serveSummary,
      mostActivePlayer,
      bestWinrate,
      biggestMargin,
      closestMatch,
    },
    leaders: {
      topRating,
      bestWinrate,
      mostActivePlayer,
      bestDiff,
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
    isAdmin: await isAdmin(cookies),
    adminEnabled: await adminEnabled(),
  };
}
