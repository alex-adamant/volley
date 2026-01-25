import { error } from "@sveltejs/kit";
import { calculateWinrate } from "$lib";
import { calculateResults } from "$lib/rating";
import { buildPlayerForm, getCurrentStreak } from "$lib/stats";
import { adminEnabled, isAdmin } from "$lib/server/admin";
import { prisma } from "$lib/server/prisma";
import { getRangeOptions } from "$lib/server/ranges";

export async function load({ params, url, cookies }) {
  const { userId, slug } = params;
  const userIdNumber = Number(userId);
  const chat = await prisma.chat.findUnique({ where: { slug } });
  if (!chat) {
    throw error(404, "Chat not found");
  }

  const rangeKey = url.searchParams.get("range") ?? "all";
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

  const chatUsers = await prisma.chatUser.findMany({
    where: { Chat: { is: { slug } } },
    include: { User: true },
    orderBy: { userId: "asc" },
  });

  const user = chatUsers.find((u) => u.User.id === userIdNumber);
  if (!user) {
    throw error(404, "User not found");
  }

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
    chatUsers,
    matches,
    activeRange.start
      ? { startDate: activeRange.start, endDate: activeRange.end }
      : undefined,
  ).filter((player) => !player.isHidden);

  const result = results.find((r) => r.userId === userIdNumber);
  if (!result) {
    throw error(404, "Result not found");
  }

  const fullForms = buildPlayerForm(matches);
  const history = fullForms.get(userIdNumber) ?? [];
  const recentForm = history.slice(-8);
  const currentStreak = getCurrentStreak(history);

  const ratingHigh = Math.max(...result.ratingHistory);
  const ratingLow = Math.min(...result.ratingHistory);

  const playerMap = new Map(chatUsers.map((item) => [item.User.id, item.User]));

  const playerMatches = matches.filter((match) =>
    [
      match.playerA1Id,
      match.playerA2Id,
      match.playerB1Id,
      match.playerB2Id,
    ].includes(userIdNumber),
  );

  let historyIndex = 0;
  const matchSummaries = playerMatches.map((match) => {
    const isTeamA = [match.playerA1Id, match.playerA2Id].includes(userIdNumber);
    const teamScore = isTeamA ? match.teamAScore : match.teamBScore;
    const oppScore = isTeamA ? match.teamBScore : match.teamAScore;
    const teammateId = isTeamA ? match.playerA2Id : match.playerB2Id;
    const teammateIdAlt = isTeamA ? match.playerA1Id : match.playerB1Id;
    const teammate = teammateId === userIdNumber ? teammateIdAlt : teammateId;
    const opponentIds = isTeamA
      ? [match.playerB1Id, match.playerB2Id]
      : [match.playerA1Id, match.playerA2Id];
    const didWin = teamScore > oppScore;
    const ratingBefore = result.ratingHistory[historyIndex] ?? result.rating;
    const ratingAfter = result.ratingHistory[historyIndex + 1] ?? ratingBefore;
    historyIndex += 1;

    return {
      id: match.id,
      day: match.day,
      teammate: playerMap.get(teammate)?.name ?? "Unknown",
      opponents: opponentIds.map((id) => playerMap.get(id)?.name ?? "Unknown"),
      score: `${teamScore}-${oppScore}`,
      result: didWin ? "W" : "L",
      ratingDelta: ratingAfter - ratingBefore,
    };
  });

  const teammateStats = new Map();
  const opponentStats = new Map();

  for (const match of playerMatches) {
    const isTeamA = [match.playerA1Id, match.playerA2Id].includes(userIdNumber);
    const teamScore = isTeamA ? match.teamAScore : match.teamBScore;
    const oppScore = isTeamA ? match.teamBScore : match.teamAScore;
    const teammateId = isTeamA ? match.playerA2Id : match.playerB2Id;
    const teammateIdAlt = isTeamA ? match.playerA1Id : match.playerB1Id;
    const teammate = teammateId === userIdNumber ? teammateIdAlt : teammateId;
    const opponentIds = isTeamA
      ? [match.playerB1Id, match.playerB2Id]
      : [match.playerA1Id, match.playerA2Id];
    const didWin = teamScore > oppScore;

    const teammateEntry = teammateStats.get(teammate) ?? {
      id: teammate,
      name: playerMap.get(teammate)?.name ?? "Unknown",
      games: 0,
      wins: 0,
      losses: 0,
    };
    teammateEntry.games += 1;
    teammateEntry.wins += didWin ? 1 : 0;
    teammateEntry.losses += didWin ? 0 : 1;
    teammateStats.set(teammate, teammateEntry);

    for (const opponentId of opponentIds) {
      const opponentEntry = opponentStats.get(opponentId) ?? {
        id: opponentId,
        name: playerMap.get(opponentId)?.name ?? "Unknown",
        games: 0,
        wins: 0,
        losses: 0,
      };
      opponentEntry.games += 1;
      opponentEntry.wins += didWin ? 1 : 0;
      opponentEntry.losses += didWin ? 0 : 1;
      opponentStats.set(opponentId, opponentEntry);
    }
  }

  const partners = [...teammateStats.values()].map((entry) => ({
    ...entry,
    winrate: calculateWinrate(entry),
  }));

  const opponents = [...opponentStats.values()].map((entry) => ({
    ...entry,
    winrate: calculateWinrate(entry),
  }));

  const bestPartners = partners
    .filter((entry) => entry.games >= 3)
    .sort((a, b) => b.winrate - a.winrate || b.games - a.games)
    .slice(0, 3);

  const toughOpponents = opponents
    .filter((entry) => entry.games >= 3)
    .sort((a, b) => a.winrate - b.winrate || b.games - a.games)
    .slice(0, 3);

  const activePlayers = chatUsers.filter(
    (p) => p.isActive && !p.isHidden,
  ).length;

  return {
    chat,
    user: user.User,
    result: {
      ...result,
      winrate: calculateWinrate(result),
      ratingHigh,
      ratingLow,
      recentForm,
      currentStreak,
    },
    matchSummaries: matchSummaries.slice(-8).reverse(),
    bestPartners,
    toughOpponents,
    stats: {
      playersTotal: chatUsers.length,
      playersActive: activePlayers,
      matchesTotal: matches.length,
      lastMatchDay: matches.at(-1)?.day ?? null,
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
