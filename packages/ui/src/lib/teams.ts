import type { Match, User } from "@prisma/client";

interface TeamStats {
  games: number;
  wins: number;
  losses: number;
  p1: string;
  p2: string;
}

export function getTeamStats(players: User[], matches: Match[]) {
  const teamStats = new Map<string, TeamStats>();
  for (const match of matches) {
    const teamA = [match.playerA1Id, match.playerA2Id].sort().join(",");
    const teamB = [match.playerB1Id, match.playerB2Id].sort().join(",");
    if (!teamStats.has(teamA)) {
      teamStats.set(teamA, {
        games: 0,
        wins: 0,
        losses: 0,
        p1: players.find((p) => p.id === match.playerA1Id)!.name,
        p2: players.find((p) => p.id === match.playerA2Id)!.name,
      });
    }
    if (!teamStats.has(teamB)) {
      teamStats.set(teamB, {
        games: 0,
        wins: 0,
        losses: 0,
        p1: players.find((p) => p.id === match.playerB1Id)!.name,
        p2: players.find((p) => p.id === match.playerB2Id)!.name,
      });
    }
    const teamAStats = teamStats.get(teamA)!;
    const teamBStats = teamStats.get(teamB)!;
    teamAStats.games++;
    teamBStats.games++;

    if (match.teamAScore > match.teamBScore) {
      teamAStats.wins++;
      teamBStats.losses++;
    } else {
      teamAStats.losses++;
      teamBStats.wins++;
    }
  }

  return [...teamStats.values()]
    .sort(
      (a, b) => b.wins - b.losses - (a.wins - a.losses) || b.games - a.games,
    )
    .filter((t) => t.games > 0);
}
