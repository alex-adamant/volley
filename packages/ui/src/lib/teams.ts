import type { Match, User } from "@prisma/client";
import { calculateWinrate } from ".";
import { buildTeamForm, getCurrentStreak } from "./stats";

export interface TeamStats {
  key: string;
  games: number;
  wins: number;
  losses: number;
  winrate: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  pointDiffAvg: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  lastPlayed: Date | null;
  recentForm: ("W" | "L")[];
  currentStreak: { type: "W" | "L" | null; count: number };
  p1: string;
  p2: string;
}

export function getTeamStats(players: User[], matches: Match[]) {
  const playerMap = new Map(players.map((p) => [p.id, p.name]));
  const teamStats = new Map<string, TeamStats>();
  const teamForms = buildTeamForm(matches);

  const ensureTeam = (teamKey: string, ids: number[]) => {
    if (teamStats.has(teamKey)) return teamStats.get(teamKey)!;
    const [p1Id, p2Id] = ids.sort((a, b) => a - b);
    const stats: TeamStats = {
      key: teamKey,
      games: 0,
      wins: 0,
      losses: 0,
      winrate: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      pointDiffAvg: 0,
      avgPointsFor: 0,
      avgPointsAgainst: 0,
      lastPlayed: null,
      recentForm: [],
      currentStreak: { type: null, count: 0 },
      p1: playerMap.get(p1Id) ?? `Player ${p1Id}`,
      p2: playerMap.get(p2Id) ?? `Player ${p2Id}`,
    };
    teamStats.set(teamKey, stats);
    return stats;
  };

  for (const match of matches) {
    const teamAIds = [match.playerA1Id, match.playerA2Id];
    const teamBIds = [match.playerB1Id, match.playerB2Id];
    const teamAKey = [...teamAIds].sort((a, b) => a - b).join(",");
    const teamBKey = [...teamBIds].sort((a, b) => a - b).join(",");

    const teamAStats = ensureTeam(teamAKey, teamAIds);
    const teamBStats = ensureTeam(teamBKey, teamBIds);

    teamAStats.games += 1;
    teamBStats.games += 1;

    teamAStats.pointsFor += match.teamAScore;
    teamAStats.pointsAgainst += match.teamBScore;
    teamBStats.pointsFor += match.teamBScore;
    teamBStats.pointsAgainst += match.teamAScore;

    teamAStats.lastPlayed = match.day;
    teamBStats.lastPlayed = match.day;

    if (match.teamAScore > match.teamBScore) {
      teamAStats.wins += 1;
      teamBStats.losses += 1;
    } else {
      teamAStats.losses += 1;
      teamBStats.wins += 1;
    }
  }

  for (const stats of teamStats.values()) {
    stats.winrate = calculateWinrate(stats);
    stats.pointDiff = stats.pointsFor - stats.pointsAgainst;
    stats.pointDiffAvg = stats.games ? stats.pointDiff / stats.games : 0;
    stats.avgPointsFor = stats.games ? stats.pointsFor / stats.games : 0;
    stats.avgPointsAgainst = stats.games
      ? stats.pointsAgainst / stats.games
      : 0;
    const history = teamForms.get(stats.key) ?? [];
    stats.recentForm = history.slice(-6);
    stats.currentStreak = getCurrentStreak(history);
  }

  return [...teamStats.values()]
    .filter((t) => t.games > 0)
    .sort(
      (a, b) =>
        b.winrate - a.winrate ||
        b.pointDiffAvg - a.pointDiffAvg ||
        b.games - a.games,
    );
}
