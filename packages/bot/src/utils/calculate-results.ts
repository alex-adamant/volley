import { ChatUser, User } from "@prisma/client";
import { prisma } from "./db";

interface PlayerResult extends User, ChatUser {
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

const initialPlayerResult = {
  placeLowest: 0,
  placeHighest: 100,
  ratingHighest: 0,
  ratingLowest: 2000,
  previousPlace: null,
  previousRating: null,
  ratingChange: 0,
  placeChange: 0,
};

export async function calculateResults(
  chatId: string,
  options?: { startDate?: Date; endDate?: Date },
) {
  const isSeason = !!options?.startDate;
  const chatUsers = await prisma.chatUser.findMany({
    where: { chatId },
    include: { User: true },
  });

  const playerResults: PlayerResult[] = chatUsers.map(
    ({ User, ...chatUser }) => {
      return {
        ...User,
        ...chatUser,
        rating: isSeason ? 1500 : chatUser.initialRating,
        games: isSeason ? 0 : chatUser.initialGames,
        ...initialPlayerResult,
      };
    },
  );

  const getPlayerResult = (id: number) => {
    const player = playerResults.find((p) => p.id === id);
    if (!player) throw new Error("Player not found");
    return player;
  };

  const matches = await prisma.match.findMany({
    orderBy: { id: "asc" },
    where: {
      chatId,
      day: {
        gte: options?.startDate,
        lte: options?.endDate,
      },
    },
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

    updateAfterMatch(A1, -ratingDifference, teamAResult, L, isSeason);
    updateAfterMatch(A2, -ratingDifference, teamAResult, L, isSeason);
    updateAfterMatch(B1, ratingDifference, teamBResult, L, isSeason);
    updateAfterMatch(B2, ratingDifference, teamBResult, L, isSeason);

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
        `Active players, ${match.day.toLocaleDateString("ru-RU", {
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
    `Active players, ${matches.at(-1)?.day.toLocaleDateString("ru-RU", {
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
  isSeason: boolean,
) {
  const expectedScore = 1 / (1 + 10 ** (ratingDifference / 400));

  let kModifier = 1.0;
  if (isSeason) {
    if (playerResult.games < GAMES_CUTOFF) {
      kModifier = 1.0 + (GAMES_CUTOFF - playerResult.games) / GAMES_CUTOFF;
    }
  } else {
    if (playerResult.games < GAMES_CUTOFF) {
      kModifier = 2.0;
    }
  }

  playerResult.rating = Math.round(
    playerResult.rating + L * kModifier * (score - expectedScore),
  );
  playerResult.games += 1;
}
