import { User } from "@prisma/client";
import { prisma } from "./db";

interface PlayerResult extends User {
  rating: number;
  games: number;
  previousPlace: number | null;
  previousRating: number | null;
  placeLowest: number;
  placeHighest: number;
  ratingHighest: number;
  ratingLowest: number;
  ratingChange: number;
  placeChange: number;
}

const GAMES_CUTOFF = 30;

const firstChatId = "-1001849842756";

export async function calculateResults(chatId: string) {
  const players = await prisma.user.findMany({
    where: { chats: { some: { id: chatId } } },
  });

  const playerResults: PlayerResult[] = players.map((p) => ({
    ...p,
    isActive: p.isActive,
    rating: firstChatId === chatId.toString() ? p.initialRating : 1500,
    games: firstChatId === chatId.toString() ? p.initialGames : 0,
    placeLowest: 0,
    placeHighest: 100,
    ratingHighest: 0,
    ratingLowest: 2000,
    previousPlace: null,
    previousRating: null,
    ratingChange: 0,
    placeChange: 0,
  }));

  const getPlayerResult = (id: number) => {
    const player = playerResults.find((p) => p.id === id);
    if (!player) throw new Error("Player not found");
    return player;
  };

  const matches = await prisma.match.findMany({
    orderBy: { id: "asc" },
    where: { chatId },
  });

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
      match.day.getDate() !== matches[Number(index) + 1]?.day.getDate();

    const sortedPlayers = playerResults
      .filter((p) => p.isActive && !p.isHidden)
      .sort((a, b) => b.rating - a.rating);

    if (isLastDay || hasDayChanged) {
      for (const [index, result] of Object.entries(sortedPlayers)) {
        const place = Number(index) + 1;
        result.placeLowest = Math.max(result.placeLowest, place);
        result.placeHighest = Math.min(result.placeHighest, place);

        result.ratingHighest = Math.max(result.ratingHighest, result.rating);
        result.ratingLowest = Math.min(result.ratingLowest, result.rating);

        result.placeChange = (result.previousPlace ?? place) - place;
        result.ratingChange =
          result.rating - (result.previousRating ?? result.rating);

        result.previousPlace = place;
        result.previousRating = result.rating;
      }

      console.log(
        `Active players, ${match.day.toLocaleDateString("rus", {
          month: "long",
          day: "numeric",
        })}`,
      );
      console.table(sortedPlayers, [
        "name",
        "rating",
        "games",
        "placeChange",
        "ratingChange",
      ]);
    }
  }

  const sortedPlayersTotal = playerResults
    .filter((p) => !p.isHidden)
    .sort((a, b) => b.rating - a.rating);

  console.log(
    `Active players, ${matches.at(-1)?.day.toLocaleDateString("rus", {
      month: "long",
      day: "numeric",
    })}`,
  );
  console.table(sortedPlayersTotal, [
    "name",
    "rating",
    "games",
    "placeChange",
    "ratingChange",
  ]);

  return playerResults;
}

function updateAfterMatch(
  playerResult: PlayerResult,
  ratingDifference: number,
  score: number,
  L: number,
) {
  const expectedScore = 1 / (1 + 10 ** (ratingDifference / 400));

  playerResult.rating = Math.round(
    playerResult.rating +
      (playerResult.games < GAMES_CUTOFF ? L * 2 : L) * (score - expectedScore),
  );
  playerResult.games += 1;
}
