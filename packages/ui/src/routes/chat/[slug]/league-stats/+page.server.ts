import { loadChatRatingData } from "$lib/server/rating-data";
import { buildEloStats, type RoleStats } from "$lib/server/elo-stats";

type UpsetRow = RoleStats & {
  id: number;
  name: string;
  underdogWinRate: number | null;
  underdogLossRate: number | null;
  favoriteWinRate: number | null;
  favoriteLossRate: number | null;
};

const ROLE_MATCHES_CUTOFF_PERCENTILE = 0.33;

const getRate = (wins: number, total: number) =>
  total > 0 ? wins / total : null;
const getPercentileThreshold = (values: number[], percentile: number) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((sorted.length - 1) * percentile);
  return sorted[index];
};

export async function load({ params, url, cookies }) {
  const slug = params.slug;
  const rangeKey = url.searchParams.get("range") ?? "all";
  const {
    chat,
    users,
    matches,
    results,
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

  const activePlayers = users.filter((p) => p.isActive && !p.isHidden).length;
  const filteredMatches = matches;
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
  const totalPoints = filteredMatches.reduce(
    (sum, match) => sum + match.teamAScore + match.teamBScore,
    0,
  );
  const averagePoints = filteredMatches.length
    ? totalPoints / filteredMatches.length
    : null;
  const averageMargin = filteredMatches.length
    ? filteredMatches.reduce(
        (sum, match) => sum + Math.abs(match.teamAScore - match.teamBScore),
        0,
      ) / filteredMatches.length
    : null;

  const serveStats = filteredMatches.reduce(
    (acc, match) => {
      const diff = match.teamAScore - match.teamBScore;
      acc.teamA.diffTotal += diff;
      acc.teamB.diffTotal -= diff;
      acc.teamA.pointsFor += match.teamAScore;
      acc.teamA.pointsAgainst += match.teamBScore;
      acc.teamB.pointsFor += match.teamBScore;
      acc.teamB.pointsAgainst += match.teamAScore;
      if (diff > 0) {
        acc.teamA.wins += 1;
      } else if (diff < 0) {
        acc.teamB.wins += 1;
      }
      return acc;
    },
    {
      teamA: {
        games: filteredMatches.length,
        wins: 0,
        diffTotal: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      },
      teamB: {
        games: filteredMatches.length,
        wins: 0,
        diffTotal: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      },
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

  for (const match of filteredMatches) {
    const margin = Math.abs(match.teamAScore - match.teamBScore);
    if (!biggestMargin || margin > biggestMargin.value) {
      biggestMargin = { value: margin, day: formatDay(match.day) };
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

  const isSeason = activeRange.key.startsWith("season");
  const disableSeasonBoost = seasonBoostMode === "base" && isSeason;
  const eloStats = buildEloStats({
    players: users,
    matches: filteredMatches,
    isSeason,
    disableSeasonBoost,
  });

  const upsetRows: UpsetRow[] = users
    .filter((user) => !user.isHidden && (status === "all" || user.isActive))
    .map((user) => {
      const role = eloStats.playerRoleStats.get(user.userId) ?? {
        favoriteMatches: 0,
        favoriteWins: 0,
        favoriteLosses: 0,
        underdogMatches: 0,
        underdogWins: 0,
        underdogLosses: 0,
      };
      return {
        id: user.userId,
        name: user.User.name,
        ...role,
        underdogWinRate: getRate(role.underdogWins, role.underdogMatches),
        underdogLossRate: getRate(role.underdogLosses, role.underdogMatches),
        favoriteWinRate: getRate(role.favoriteWins, role.favoriteMatches),
        favoriteLossRate: getRate(role.favoriteLosses, role.favoriteMatches),
      };
    });

  const underdogMatchesByPlayer = upsetRows
    .map((row) => row.underdogMatches)
    .filter((count) => count > 0);
  const favoriteMatchesByPlayer = upsetRows
    .map((row) => row.favoriteMatches)
    .filter((count) => count > 0);
  const underdogMinMatches = getPercentileThreshold(
    underdogMatchesByPlayer,
    ROLE_MATCHES_CUTOFF_PERCENTILE,
  );
  const favoriteMinMatches = getPercentileThreshold(
    favoriteMatchesByPlayer,
    ROLE_MATCHES_CUTOFF_PERCENTILE,
  );

  const matchRoleRows = [...eloStats.matchViews.values()];
  const matchesWithFavorite = matchRoleRows.filter(
    (match) => match.favoriteSide !== null,
  ).length;
  const underdogWins = matchRoleRows.filter(
    (match) => match.underdogWon,
  ).length;
  const noFavoriteMatches = filteredMatches.length - matchesWithFavorite;

  const topUnderdogWins = upsetRows
    .filter(
      (row) =>
        row.underdogMatches > 0 && row.underdogMatches >= underdogMinMatches,
    )
    .sort(
      (a, b) =>
        (b.underdogWinRate ?? 0) - (a.underdogWinRate ?? 0) ||
        b.underdogMatches - a.underdogMatches ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 5);

  const topFavoriteLosses = upsetRows
    .filter(
      (row) =>
        row.favoriteMatches > 0 && row.favoriteMatches >= favoriteMinMatches,
    )
    .sort(
      (a, b) =>
        (a.favoriteWinRate ?? 0) - (b.favoriteWinRate ?? 0) ||
        b.favoriteMatches - a.favoriteMatches ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 5);

  const topFavoriteWins = upsetRows
    .filter(
      (row) =>
        row.favoriteMatches > 0 && row.favoriteMatches >= favoriteMinMatches,
    )
    .sort(
      (a, b) =>
        (b.favoriteWinRate ?? 0) - (a.favoriteWinRate ?? 0) ||
        b.favoriteMatches - a.favoriteMatches ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 5);

  const topUnderdogLosses = upsetRows
    .filter(
      (row) =>
        row.underdogMatches > 0 && row.underdogMatches >= underdogMinMatches,
    )
    .sort(
      (a, b) =>
        (a.underdogWinRate ?? 0) - (b.underdogWinRate ?? 0) ||
        b.underdogMatches - a.underdogMatches ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 5);

  return {
    chat,
    status,
    stats: {
      playersTotal: users.length,
      playersActive: activePlayers,
      playersShown: results.length,
      matchesTotal: filteredMatches.length,
      lastMatchDay: filteredMatches.at(-1)?.day ?? null,
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
      upsets: {
        matchesWithFavorite,
        underdogWins,
        noFavoriteMatches,
        upsetRate: getRate(underdogWins, matchesWithFavorite),
        topUnderdogWins,
        topFavoriteLosses,
        topFavoriteWins,
        topUnderdogLosses,
        roleMatchesCutoffPercent: Math.round(
          ROLE_MATCHES_CUTOFF_PERCENTILE * 100,
        ),
      },
    },
    leaders: {
      topRating,
      bestWinrate,
      mostActivePlayer,
      bestDiff,
    },
    rangeOptions,
    activeRange,
    seasonBoostMode,
    isAdmin,
    adminEnabled,
  };
}
