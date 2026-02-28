import type { ChatUser, Match, User } from "@prisma/client";

const GAMES_CUTOFF = 30;
const FAVORITE_MIN_WIN_PROBABILITY = 0.55;

export type FavoriteSide = "A" | "B";
type TeamRole = "favorite" | "underdog" | "even";

export type EloMatchView = {
  teamAWinProbability: number;
  teamBWinProbability: number;
  teamAAvgRatingBefore: number;
  teamBAvgRatingBefore: number;
  playerA1RatingBefore: number;
  playerA2RatingBefore: number;
  playerB1RatingBefore: number;
  playerB2RatingBefore: number;
  favoriteSide: FavoriteSide | null;
  underdogWon: boolean;
  teamARole: TeamRole;
  teamBRole: TeamRole;
};

export type RoleStats = {
  favoriteMatches: number;
  favoriteWins: number;
  favoriteLosses: number;
  underdogMatches: number;
  underdogWins: number;
  underdogLosses: number;
};

type PlayerEloState = {
  rating: number;
  games: number;
};

const getWinProbability = (ratingDifference: number) =>
  1 / (1 + 10 ** (-ratingDifference / 400));

const createRoleStats = (): RoleStats => ({
  favoriteMatches: 0,
  favoriteWins: 0,
  favoriteLosses: 0,
  underdogMatches: 0,
  underdogWins: 0,
  underdogLosses: 0,
});

const applyRoleResult = (stats: RoleStats, role: TeamRole, didWin: boolean) => {
  if (role === "favorite") {
    stats.favoriteMatches += 1;
    if (didWin) {
      stats.favoriteWins += 1;
    } else {
      stats.favoriteLosses += 1;
    }
    return;
  }

  if (role === "underdog") {
    stats.underdogMatches += 1;
    if (didWin) {
      stats.underdogWins += 1;
    } else {
      stats.underdogLosses += 1;
    }
  }
};

const updateRatingAfterMatch = ({
  player,
  ratingDifference,
  score,
  capPoints,
  isSeason,
  disableSeasonBoost,
}: {
  player: PlayerEloState;
  ratingDifference: number;
  score: number;
  capPoints: number;
  isSeason: boolean;
  disableSeasonBoost: boolean;
}) => {
  const expectedScore = 1 / (1 + 10 ** (ratingDifference / 400));

  let kModifier = 1.0;
  if (isSeason) {
    if (!disableSeasonBoost && player.games < GAMES_CUTOFF) {
      kModifier = 1.0 + (GAMES_CUTOFF - player.games) / GAMES_CUTOFF;
    }
  } else if (player.games < GAMES_CUTOFF) {
    kModifier = 2.0;
  }

  player.rating = Math.round(
    player.rating + capPoints * kModifier * (score - expectedScore),
  );
  player.games += 1;
};

const toTeamKey = (player1Id: number, player2Id: number) =>
  [player1Id, player2Id].sort((a, b) => a - b).join(",");

export function buildEloStats({
  players,
  matches,
  isSeason,
  disableSeasonBoost,
}: {
  players: (ChatUser & { User: User })[];
  matches: Match[];
  isSeason: boolean;
  disableSeasonBoost: boolean;
}) {
  const playerStates = new Map<number, PlayerEloState>(
    players.map((player) => [
      player.userId,
      {
        rating: isSeason ? 1500 : player.initialRating,
        games: isSeason ? 0 : player.initialGames,
      },
    ]),
  );

  const playerRoleStats = new Map<number, RoleStats>(
    players.map((player) => [player.userId, createRoleStats()]),
  );
  const teamRoleStats = new Map<string, RoleStats>();
  const matchViews = new Map<number, EloMatchView>();

  const ensurePlayerState = (id: number) => {
    const existing = playerStates.get(id);
    if (existing) return existing;

    const fallback: PlayerEloState = { rating: 1500, games: 0 };
    playerStates.set(id, fallback);
    if (!playerRoleStats.has(id)) {
      playerRoleStats.set(id, createRoleStats());
    }
    return fallback;
  };

  const ensurePlayerRole = (id: number) => {
    const existing = playerRoleStats.get(id);
    if (existing) return existing;
    const fallback = createRoleStats();
    playerRoleStats.set(id, fallback);
    return fallback;
  };

  const ensureTeamRole = (teamKey: string) => {
    const existing = teamRoleStats.get(teamKey);
    if (existing) return existing;
    const fallback = createRoleStats();
    teamRoleStats.set(teamKey, fallback);
    return fallback;
  };

  const matchesByTimeline = [...matches].sort(
    (a, b) => a.day.getTime() - b.day.getTime() || a.id - b.id,
  );

  for (const match of matchesByTimeline) {
    const A1 = ensurePlayerState(match.playerA1Id);
    const A2 = ensurePlayerState(match.playerA2Id);
    const B1 = ensurePlayerState(match.playerB1Id);
    const B2 = ensurePlayerState(match.playerB2Id);

    const teamARating = A1.rating + A2.rating;
    const teamBRating = B1.rating + B2.rating;
    const teamAAvgRatingBefore = teamARating / 2;
    const teamBAvgRatingBefore = teamBRating / 2;
    const ratingDifference = teamARating - teamBRating;
    const teamAWinProbability = getWinProbability(ratingDifference);
    const teamBWinProbability = 1 - teamAWinProbability;

    const favoriteSide: FavoriteSide | null =
      teamAWinProbability >= FAVORITE_MIN_WIN_PROBABILITY
        ? "A"
        : teamBWinProbability >= FAVORITE_MIN_WIN_PROBABILITY
          ? "B"
          : null;
    const teamARole: TeamRole =
      favoriteSide === "A"
        ? "favorite"
        : favoriteSide === "B"
          ? "underdog"
          : "even";
    const teamBRole: TeamRole =
      favoriteSide === "B"
        ? "favorite"
        : favoriteSide === "A"
          ? "underdog"
          : "even";

    const teamAWon = match.teamAScore > match.teamBScore;
    const teamBWon = match.teamBScore > match.teamAScore;
    const underdogWon =
      favoriteSide === "A" ? teamBWon : favoriteSide === "B" ? teamAWon : false;

    const teamAKey = toTeamKey(match.playerA1Id, match.playerA2Id);
    const teamBKey = toTeamKey(match.playerB1Id, match.playerB2Id);

    applyRoleResult(ensureTeamRole(teamAKey), teamARole, teamAWon);
    applyRoleResult(ensureTeamRole(teamBKey), teamBRole, teamBWon);
    applyRoleResult(ensurePlayerRole(match.playerA1Id), teamARole, teamAWon);
    applyRoleResult(ensurePlayerRole(match.playerA2Id), teamARole, teamAWon);
    applyRoleResult(ensurePlayerRole(match.playerB1Id), teamBRole, teamBWon);
    applyRoleResult(ensurePlayerRole(match.playerB2Id), teamBRole, teamBWon);

    matchViews.set(match.id, {
      teamAWinProbability,
      teamBWinProbability,
      teamAAvgRatingBefore,
      teamBAvgRatingBefore,
      playerA1RatingBefore: A1.rating,
      playerA2RatingBefore: A2.rating,
      playerB1RatingBefore: B1.rating,
      playerB2RatingBefore: B2.rating,
      favoriteSide,
      underdogWon,
      teamARole,
      teamBRole,
    });

    const capPoints = Math.min(
      Math.max(match.teamAScore, match.teamBScore),
      21,
    );
    const teamAResult = teamAWon ? 1 : 0;
    const teamBResult = teamBWon ? 1 : 0;

    updateRatingAfterMatch({
      player: A1,
      ratingDifference: -ratingDifference,
      score: teamAResult,
      capPoints,
      isSeason,
      disableSeasonBoost,
    });
    updateRatingAfterMatch({
      player: A2,
      ratingDifference: -ratingDifference,
      score: teamAResult,
      capPoints,
      isSeason,
      disableSeasonBoost,
    });
    updateRatingAfterMatch({
      player: B1,
      ratingDifference,
      score: teamBResult,
      capPoints,
      isSeason,
      disableSeasonBoost,
    });
    updateRatingAfterMatch({
      player: B2,
      ratingDifference,
      score: teamBResult,
      capPoints,
      isSeason,
      disableSeasonBoost,
    });
  }

  return {
    matchViews,
    playerRoleStats,
    teamRoleStats,
  };
}
