import {
  buildPlayerForm,
  buildPlayerMatchDetails,
  buildPlayerResultDetails,
  getCurrentStreak,
} from "$lib/stats";
import { loadChatRatingData } from "$lib/server/rating-data";

export async function load({ params, url, cookies }) {
  const slug = params.slug;
  const rangeKey = url.searchParams.get("range") ?? "all";
  const {
    chat,
    users,
    matches,
    results: baseResults,
    status,
    rangeOptions,
    activeRange,
    seasonBoostMode,
    isAdmin,
    adminEnabled,
  } = await loadChatRatingData({
    slug,
    rangeKey,
    statusParam: url.searchParams.get("status"),
    seasonBoostParam: url.searchParams.get("seasonBoost"),
    cookies,
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

  const results = baseResults.map((player) => {
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
    rangeOptions,
    activeRange,
    seasonBoostMode,
    isAdmin,
    adminEnabled,
  };
}
