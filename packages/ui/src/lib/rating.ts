import type { ChatUser, Match, User } from "@prisma/client";

const GAMES_CUTOFF = 30;

const firstChatId = "-1001849842756";

export interface PlayerResult
  extends ChatUser,
    Omit<
      User,
      "initialGames" | "initialRating" | "isActive" | "isHidden" | "isAdmin"
    > {
  rating: number;
  ratingHistory: number[];
  games: number;
  wins: number;
  losses: number;
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
) {
  const chatId = matches[0].chatId?.toString();
  const playerResults: PlayerResult[] = players.map((p) => ({
    ...p.User,
    ...p,
    rating: firstChatId === chatId ? p.initialRating : 1500,
    games: firstChatId === chatId ? p.initialGames : 0,
    wins: 0,
    losses: 0,
    ratingHistory: [firstChatId === chatId ? p.initialRating : 1500],
    placeLowest: 0,
    placeHighest: 100,
    previousPlace: null,
    previousRating: null,
    ratingChange: 0,
    placeChange: 0,
    winStreak: 0,
    lossStreak: 0,
    longestWinStreak: 0,
    longestLossStreak: 0,
  }));

  // console.log(playerResults);

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

    const isLastDay = Number(index) === matches.length - 1;
    const hasDayChanged =
      match.day.getUTCDate() !== matches[Number(index) + 1]?.day.getUTCDate();

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
