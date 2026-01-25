import type { ChatUser, Match, User } from "@prisma/client";

const GAMES_CUTOFF = 30;

export interface PlayerResult extends ChatUser, User {
  rating: number;
  ratingHistory: number[];
  games: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  previousPlace: number | null;
  previousRating: number | null;
  placeLowest: number;
  placeHighest: number;
  ratingChange: number;
  placeChange: number;
  winStreak: number;
  lossStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
}

export function calculateResults(
  players: (ChatUser & { User: User })[],
  matches: Match[],
  options?: { startDate?: Date; endDate?: Date },
) {
  const isSeason = !!options?.startDate;
  const playerResults: PlayerResult[] = players.map((p) => {
    const rating = isSeason ? 1500 : p.initialRating;
    return {
      ...p.User,
      ...p,
      rating: rating,
      games: isSeason ? 0 : p.initialGames,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      avgPointsFor: 0,
      avgPointsAgainst: 0,
      ratingHistory: [rating],
      placeLowest: 0,
      placeHighest: 100,
      previousPlace: null,
      previousRating: rating,
      ratingChange: 0,
      placeChange: 0,
      winStreak: 0,
      lossStreak: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
    };
  });

  const getPlayerResult = (id: number) => {
    const player = playerResults.find((p) => p.id === id);
    if (!player) throw new Error(`Player not found: ${id}`);
    return player;
  };

  for (const [index, match] of Object.entries(matches)) {
    const {
      playerA1Id,
      playerA2Id,
      playerB1Id,
      playerB2Id,
      teamAScore,
      teamBScore,
    } = match;

    const A1 = getPlayerResult(playerA1Id);
    const A2 = getPlayerResult(playerA2Id);
    const B1 = getPlayerResult(playerB1Id);
    const B2 = getPlayerResult(playerB2Id);

    const teamAResult = teamAScore > teamBScore ? 1 : 0;
    const teamBResult = teamBScore > teamAScore ? 1 : 0;

    const L = Math.min(Math.max(teamAScore, teamBScore), 21);

    const ratingDifference = A1.rating + A2.rating - B1.rating - B2.rating;

    updateAfterMatch(A1, -ratingDifference, teamAResult, L);
    updateAfterMatch(A2, -ratingDifference, teamAResult, L);
    updateAfterMatch(B1, ratingDifference, teamBResult, L);
    updateAfterMatch(B2, ratingDifference, teamBResult, L);

    A1.pointsFor += teamAScore;
    A1.pointsAgainst += teamBScore;
    A2.pointsFor += teamAScore;
    A2.pointsAgainst += teamBScore;
    B1.pointsFor += teamBScore;
    B1.pointsAgainst += teamAScore;
    B2.pointsFor += teamBScore;
    B2.pointsAgainst += teamAScore;

    const isLastDay = Number(index) === matches.length - 1;
    const hasDayChanged =
      match.day.toDateString() !==
      matches[Number(index) + 1]?.day.toDateString();

    const sortedPlayers = playerResults
      .filter((p) => p.isActive && !p.isHidden)
      .sort((a, b) => b.rating - a.rating);

    if (isLastDay || hasDayChanged) {
      for (const [index, result] of Object.entries(sortedPlayers)) {
        const place = Number(index) + 1;
        result.placeLowest = Math.max(result.placeLowest, place);
        result.placeHighest = Math.min(result.placeHighest, place);

        result.placeChange = (result.previousPlace ?? place) - place;
        result.ratingChange =
          result.rating - (result.previousRating ?? result.rating);

        result.previousPlace = place;
        result.previousRating = result.rating;
      }
    }
  }

  for (const result of playerResults) {
    result.pointDiff = result.pointsFor - result.pointsAgainst;
    result.avgPointsFor = result.games ? result.pointsFor / result.games : 0;
    result.avgPointsAgainst = result.games
      ? result.pointsAgainst / result.games
      : 0;
  }

  return playerResults.sort((a, b) => b.rating - a.rating);
}

function updateAfterMatch(
  r: PlayerResult,
  ratingDifference: number,
  score: number,
  L: number,
) {
  const expectedScore = 1 / (1 + 10 ** (ratingDifference / 400));

  r.rating = Math.round(
    r.rating + (r.games < GAMES_CUTOFF ? L * 2 : L) * (score - expectedScore),
  );
  r.ratingHistory.push(r.rating);
  r.games += 1;

  if (score === 1) {
    r.wins += 1;
    r.winStreak += 1;
    r.lossStreak = 0;
    r.longestWinStreak = Math.max(r.longestWinStreak, r.winStreak);
  } else {
    r.losses += 1;
    r.lossStreak += 1;
    r.winStreak = 0;
    r.longestLossStreak = Math.max(r.longestLossStreak, r.lossStreak);
  }
}
