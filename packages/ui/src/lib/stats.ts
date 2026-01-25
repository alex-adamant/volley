import type { Match } from "@prisma/client";

export type FormMark = "W" | "L";

export function buildPlayerForm(matches: Match[], limit?: number) {
  const form = new Map<number, FormMark[]>();

  for (const match of matches) {
    const teamA = [match.playerA1Id, match.playerA2Id];
    const teamB = [match.playerB1Id, match.playerB2Id];
    const teamAWin = match.teamAScore > match.teamBScore;
    const markA: FormMark = teamAWin ? "W" : "L";
    const markB: FormMark = teamAWin ? "L" : "W";

    for (const id of teamA) {
      const history = form.get(id) ?? [];
      history.push(markA);
      form.set(id, history);
    }

    for (const id of teamB) {
      const history = form.get(id) ?? [];
      history.push(markB);
      form.set(id, history);
    }
  }

  if (typeof limit === "number") {
    for (const [id, history] of form.entries()) {
      if (history.length > limit) {
        form.set(id, history.slice(-limit));
      }
    }
  }

  return form;
}

export function buildPlayerResultDetails(matches: Match[], limit?: number) {
  const details = new Map<number, string[]>();

  for (const match of matches) {
    const teamA = [match.playerA1Id, match.playerA2Id];
    const teamB = [match.playerB1Id, match.playerB2Id];
    const teamAWin = match.teamAScore > match.teamBScore;
    const resultA: FormMark = teamAWin ? "W" : "L";
    const resultB: FormMark = teamAWin ? "L" : "W";
    const scoreA = `${match.teamAScore}-${match.teamBScore}`;
    const scoreB = `${match.teamBScore}-${match.teamAScore}`;

    for (const id of teamA) {
      const history = details.get(id) ?? [];
      history.push(`${resultA} ${scoreA}`);
      details.set(id, history);
    }

    for (const id of teamB) {
      const history = details.get(id) ?? [];
      history.push(`${resultB} ${scoreB}`);
      details.set(id, history);
    }
  }

  if (typeof limit === "number") {
    for (const [id, history] of details.entries()) {
      if (history.length > limit) {
        details.set(id, history.slice(-limit));
      }
    }
  }

  return details;
}

export type PlayerMatchDetail = {
  result: FormMark;
  score: string;
  teammateIds: number[];
  opponentIds: number[];
};

export function buildPlayerMatchDetails(matches: Match[], limit?: number) {
  const details = new Map<number, PlayerMatchDetail[]>();

  for (const match of matches) {
    const teamA = [match.playerA1Id, match.playerA2Id];
    const teamB = [match.playerB1Id, match.playerB2Id];
    const teamAWin = match.teamAScore > match.teamBScore;
    const resultA: FormMark = teamAWin ? "W" : "L";
    const resultB: FormMark = teamAWin ? "L" : "W";
    const scoreA = `${match.teamAScore}-${match.teamBScore}`;
    const scoreB = `${match.teamBScore}-${match.teamAScore}`;

    for (const id of teamA) {
      const history = details.get(id) ?? [];
      history.push({
        result: resultA,
        score: scoreA,
        teammateIds: teamA.filter((playerId) => playerId !== id),
        opponentIds: teamB,
      });
      details.set(id, history);
    }

    for (const id of teamB) {
      const history = details.get(id) ?? [];
      history.push({
        result: resultB,
        score: scoreB,
        teammateIds: teamB.filter((playerId) => playerId !== id),
        opponentIds: teamA,
      });
      details.set(id, history);
    }
  }

  if (typeof limit === "number") {
    for (const [id, history] of details.entries()) {
      if (history.length > limit) {
        details.set(id, history.slice(-limit));
      }
    }
  }

  return details;
}

export function buildTeamForm(matches: Match[], limit?: number) {
  const form = new Map<string, FormMark[]>();

  for (const match of matches) {
    const teamAKey = [match.playerA1Id, match.playerA2Id]
      .sort((a, b) => a - b)
      .join(",");
    const teamBKey = [match.playerB1Id, match.playerB2Id]
      .sort((a, b) => a - b)
      .join(",");
    const teamAWin = match.teamAScore > match.teamBScore;
    const markA: FormMark = teamAWin ? "W" : "L";
    const markB: FormMark = teamAWin ? "L" : "W";

    const historyA = form.get(teamAKey) ?? [];
    historyA.push(markA);
    form.set(teamAKey, historyA);

    const historyB = form.get(teamBKey) ?? [];
    historyB.push(markB);
    form.set(teamBKey, historyB);
  }

  if (typeof limit === "number") {
    for (const [key, history] of form.entries()) {
      if (history.length > limit) {
        form.set(key, history.slice(-limit));
      }
    }
  }

  return form;
}

export function getCurrentStreak(form: FormMark[]) {
  if (!form.length) {
    return { type: null, count: 0 } as const;
  }

  const last = form[form.length - 1];
  let count = 0;
  for (let i = form.length - 1; i >= 0; i -= 1) {
    if (form[i] !== last) break;
    count += 1;
  }

  return { type: last, count } as const;
}
