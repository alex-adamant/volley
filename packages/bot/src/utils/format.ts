import { BotContext, Match } from "../types";
import { User } from "@prisma/client";
import { bold, fmt, spoiler } from "telegraf/format";
import { getCallbackMessageSession } from "./session";

export function getTeamTitlesFormatted(
  ctx: BotContext,
  usersById: Record<number, User>,
) {
  const { players, winner } = getCallbackMessageSession(ctx);

  const users = players.map((id) => usersById[id]);
  const teamA = `${users[0]?.name} ${users[1]?.name}`;
  const teamB = `${users[2]?.name} ${users[3]?.name}`;
  const isWinnerA = winner === 0;

  return [isWinnerA ? bold(teamA) : teamA, isWinnerA ? teamB : bold(teamB)];
}

export function getTeamTitles(
  ctx: BotContext,
  usersById: Record<number, User>,
) {
  const { players, winner } = getCallbackMessageSession(ctx);

  const users = players.map((id) => usersById[id]);
  const teamA = `${users[0]?.name ?? ""} ${users[1]?.name ?? ""}`;
  const teamB = `${users[2]?.name ?? ""} ${users[3]?.name ?? ""}`;

  return [teamA, teamB];
}

export function f(strings: TemplateStringsArray | string, maxLength = 10) {
  if (typeof strings === "string") return strings.padEnd(maxLength, " ");
  else return strings[0].padEnd(maxLength, " ");
}

export function renderTeams(matchIndex: number, ctx: BotContext) {
  const messageSession = getCallbackMessageSession(ctx);
  const { usersById } = ctx.session;

  const { winner, result, teams } = messageSession.matches[matchIndex];

  let score = "";

  if (winner !== null && result !== null) {
    const isExtra = messageSession.players.length === 6 && matchIndex > 5;

    const maxPoints = isExtra ? 15 : messageSession.points;

    const winnerPoints = maxPoints - result > 1 ? maxPoints : maxPoints + 1;

    score =
      winner === 0 ? `${winnerPoints}:${result}` : `${result}:${winnerPoints}`;
  }

  const [a1, a2, b1, b2] = teams.map((id) => usersById[id].name);
  const teamA = winner === 0 ? bold`${a1} ${a2}` : `${a1} ${a2}`;
  const teamB = winner === 1 ? bold`${b1} ${b2}` : `${b1} ${b2}`;

  return fmt`🏐 ${teamA} -- ${teamB} ${score}`;
}
