import { Markup, Telegraf } from "telegraf";
import { BotContext, Match } from "../types";
import { insertActiveUsersToSession, requireChat } from "../utils/middleware";
import { getCallbackMessageSession, getInitialGame } from "../utils/session";
import { deleteMessage, voidMessage, withSlots, wrapOn } from "./shared";
import { bold, fmt, FmtString, pre, spoiler } from "telegraf/format";
import { pointsOptions } from "../utils/schedule";
import { shuffle } from "../utils/random";
import { f, renderTeams } from "../utils/format";
import { prisma } from "../utils/db";

const btn = Markup.button.callback;

export function leagueGeneration(bot: Telegraf<BotContext>) {
  bot.command(
    "l",
    requireChat,
    insertActiveUsersToSession,
    renderInitialLeagueSelection,
  );

  bot.action(/^league_player_(\d+)$/, async (ctx) => {
    const messageSession = getCallbackMessageSession(ctx);
    messageSession.players.push(Number(ctx.match[1]));

    await renderLeagueSelection(ctx);
  });

  bot.action(/^undo_league_player_(\d+)$/, async (ctx) => {
    const messageSession = getCallbackMessageSession(ctx);
    const undoId = Number(ctx.match[1]);
    messageSession.players = messageSession.players.filter((p) => p !== undoId);

    await renderLeagueSelection(ctx);
  });

  bot.action("undo_league_selection", renderLeagueSelection);

  bot.action(/^league_points_(\d+)$/, async (ctx) => {
    const messageSession = getCallbackMessageSession(ctx);
    if (messageSession.points === Number(ctx.match[1])) {
      return;
    }
    messageSession.points = Number(ctx.match[1]);
    await renderLeaguePointsSelection(ctx);
  });

  bot.action("confirm_league_selection", async (ctx) => {
    const messageSession = getCallbackMessageSession(ctx);
    messageSession.points = messageSession.players.length === 4 ? 18 : 21;
    await renderLeaguePointsSelection(ctx);
  });

  bot.action("generate_league", insertActiveUsersToSession, async (ctx) => {
    const messageSession = getCallbackMessageSession(ctx);

    shuffle(messageSession.players);

    const [p1, p2, p3, p4, p5, p6, p7] = messageSession.players;

    switch (messageSession.players.length) {
      case 4: {
        messageSession.matches = [
          getInitialGame([p1, p2, p3, p4]),
          getInitialGame([p1, p3, p2, p4]),
          getInitialGame([p1, p4, p2, p3]),
          getInitialGame([p3, p4, p1, p2]),
          getInitialGame([p2, p4, p1, p3]),
          getInitialGame([p2, p3, p1, p4]),
        ];
        break;
      }

      case 5: {
        messageSession.matches = [
          getInitialGame([p1, p2, p3, p4]),
          getInitialGame([p1, p3, p2, p5]),
          getInitialGame([p2, p4, p1, p5]),
          getInitialGame([p3, p5, p1, p4]),
          getInitialGame([p4, p5, p2, p3]),
        ];
        break;
      }

      case 6: {
        messageSession.matches = [
          getInitialGame([p1, p4, p5, p6], true),
          getInitialGame([p2, p3, p4, p5], true),
          getInitialGame([p1, p6, p2, p5], true),
          getInitialGame([p1, p3, p2, p6], true),
          getInitialGame([p3, p5, p4, p6], true),
          getInitialGame([p1, p2, p3, p4], true),
          // playoffs
          getInitialGame([p1, p5, p2, p4], true),
          getInitialGame([p3, p6, p1, p5], true),
          getInitialGame([p2, p4, p3, p6], true),
        ];
        break;
      }

      case 7: {
        messageSession.matches = [
          getInitialGame([p1, p2, p3, p4]),
          getInitialGame([p5, p6, p1, p7]),
          getInitialGame([p2, p3, p4, p5]),
          getInitialGame([p4, p6, p5, p7]),
          getInitialGame([p1, p3, p2, p6]),
          getInitialGame([p4, p7, p3, p5]),
          getInitialGame([p1, p6, p2, p7]),
        ];
        break;
      }

      default:
        await ctx.editMessageText("Unexpected amount of players");
    }

    await renderLeagueDashboard(ctx);
  });

  bot.action(/^league_match_result_(\d+)$/, async (ctx) => {
    const matchIndex = Number(ctx.match[1]);
    const messageSession = getCallbackMessageSession(ctx);
    const match = messageSession.matches[matchIndex];
    const [a1, a2, b1, b2] = match.teams.map(
      (p) => ctx.session.usersById[p].name,
    );

    const teamA = `${a1} ${a2}`;
    const teamB = `${b1} ${b2}`;

    const buttons = [
      btn(teamA, `league_match_winner_${matchIndex}_0`),
      btn(teamB, `league_match_winner_${matchIndex}_1`),
      btn("⬅️ Назад", "league_dashboard"),
    ];

    if (match.id) {
      buttons.push(btn("❌ Удалить", `league_delete_match_${matchIndex}`));
    }

    await ctx.editMessageText(
      fmt(
        match.result
          ? fmt`Победа: ${bold(match.winner === 0 ? teamA : teamB)}. Поменять?`
          : bold("Кто победил?"),
      ),
      Markup.inlineKeyboard(buttons, { wrap: wrapOn(10, "⬅️ Назад") }),
    );
  });

  bot.action(/^league_delete_match_(\d+)$/, async (ctx) => {
    const matchIndex = Number(ctx.match[1]);
    const messageSession = getCallbackMessageSession(ctx);
    const match = messageSession.matches[matchIndex];

    if (match.id) {
      await prisma.match.delete({ where: { id: match.id } });
    }

    match.winner = null;
    match.result = null;
    match.id = null;

    await renderLeagueDashboard(ctx);
  });

  bot.action("league_dashboard", renderLeagueDashboard);

  bot.action(/^league_match_winner_(\d+)_(\d)$/, async (ctx) => {
    try {
      const matchIndex = Number(ctx.match[1]);
      const winner = Number(ctx.match[2]);
      const messageSession = getCallbackMessageSession(ctx);
      const match = messageSession.matches[matchIndex];
      match.winner = winner;

      const isExtra = messageSession.players.length === 6 && matchIndex > 5;

      const [a1, a2, b1, b2] = match.teams.map(
        (p) => ctx.session.usersById[p].name,
      );

      await ctx.editMessageText(
        fmt`Сколько очков набрали ${bold(
          winner === 0 ? `${b1} и ${b2}` : `${a1} и ${a2}`,
        )}?`,
        Markup.inlineKeyboard(
          [
            ...Array.from(
              { length: isExtra ? 15 : messageSession.points },
              (_, i) => i,
            ).map((i) => btn(`${i}`, `league_match_points_${matchIndex}_${i}`)),
            btn("⬅️ Назад", "league_dashboard"),
          ],
          {
            wrap: wrapOn(3),
          },
        ),
      );
    } catch (error) {
      console.log("[ERROR]: ", error);
    }
  });

  bot.action(/^league_match_points_(\d+)_(\d+)$/, async (ctx) => {
    const matchIndex = Number(ctx.match[1]);
    const points = Number(ctx.match[2]);
    const messageSession = getCallbackMessageSession(ctx);
    const match = messageSession.matches[matchIndex];
    match.result = points;

    const isExtra = messageSession.players.length === 6 && matchIndex > 5;

    const maxPoints = isExtra ? 15 : messageSession.points;

    const winnerPoints = maxPoints - points > 1 ? maxPoints : maxPoints + 1;

    const teamAScore = match.winner === 0 ? winnerPoints : points;
    const teamBScore = match.winner === 1 ? winnerPoints : points;

    if (match.id) {
      await prisma.match.update({
        where: { id: match.id },
        data: { teamAScore, teamBScore },
      });
    } else {
      const result = await prisma.match.create({
        data: {
          playerA1Id: match.teams[0],
          playerA2Id: match.teams[1],
          playerB1Id: match.teams[2],
          playerB2Id: match.teams[3],
          chatId: ctx.session.contextChatId ?? ctx.chat?.id.toString(),
          teamAScore,
          teamBScore,
          day: new Date(),
          league: 1,
        },
      });

      match.id = result.id;
    }

    await renderLeagueDashboard(ctx);
  });

  bot.action("finish_league", async (ctx) => {
    const messageSession = getCallbackMessageSession(ctx);
    messageSession.isOver = true;
    await renderLeagueDashboard(ctx);
  });

  bot.action("delete_league", async (ctx) => {
    await ctx.editMessageText(
      "Удалить лигу? Вы уверены?",
      Markup.inlineKeyboard([
        btn("Нет, отмена", "league_dashboard"),
        btn("Да!", deleteMessage),
      ]),
    );
  });
}

/**
 * Shared
 */

async function renderInitialLeagueSelection(ctx: BotContext) {
  try {
    await ctx.reply(
      "Выберите от 4 до 7 игроков",
      Markup.inlineKeyboard(
        [
          ...withSlots(
            ctx.session.users,
            (u) => btn(u.name, `league_player_${u.id}`),
            btn("🏐", voidMessage),
          ),
          btn("🏐🏐🏐🏐🏐🏐🏐🏐🏐🏐", voidMessage),
          btn("⏳", voidMessage),
          btn("Отмена", deleteMessage),
        ],
        {
          wrap: wrapOn(3, ["🏐🏐🏐🏐🏐🏐🏐🏐🏐🏐", "⏳"]),
        },
      ),
    );
  } catch (error) {
    console.log("[ERROR]: ", error);
    return null;
  }
}

async function renderLeagueSelection(ctx: BotContext) {
  const { players } = getCallbackMessageSession(ctx);

  const isEnoughPlayers = players.length >= 4 && players.length <= 7;

  await ctx.editMessageText(
    "Выберите от 4 до 8 игроков",
    Markup.inlineKeyboard(
      [
        ...withSlots(
          ctx.session.users,
          (u) => {
            const isChosen = players.includes(u.id);
            return btn(
              `${u.name}${isChosen ? " ✅" : ""}`,
              isChosen ? `undo_league_player_${u.id}` : `league_player_${u.id}`,
            );
          },
          btn("🏐", voidMessage),
        ),
        btn("🏐🏐🏐🏐🏐🏐🏐🏐🏐🏐", voidMessage),
        isEnoughPlayers
          ? btn(`🎲 на ${players.length}`, "confirm_league_selection")
          : btn("⏳", voidMessage),
        btn("Отмена", deleteMessage),
      ],
      {
        wrap: wrapOn(3, [
          "🏐🏐🏐🏐🏐🏐🏐🏐🏐🏐",
          `🎲 на ${players.length}`,
          "⏳",
        ]),
      },
    ),
  );
}

async function renderLeaguePointsSelection(ctx: BotContext) {
  const { players, points } = getCallbackMessageSession(ctx);

  ctx.editMessageText(
    fmt`Сгенерировать лигу на ${players.length} игроков до ${points}?`,
    Markup.inlineKeyboard(
      [
        ...pointsOptions.map((p) =>
          btn(`игра до ${p}${points === p ? "*" : ""}`, `league_points_${p}`),
        ),
        btn("⬅️ Назад", "undo_league_selection"),
        btn("🎲 Погнали!", "generate_league"),
      ],
      {
        wrap: wrapOn(3),
      },
    ),
  );
}

async function renderLeagueDashboard(ctx: BotContext) {
  const { players, matches, isOver } = getCallbackMessageSession(ctx);
  let messageText: FmtString;

  switch (players.length) {
    case 4: {
      messageText = fmt`
${bold("Первый круг")}
${renderTeams(0, ctx)}
${renderTeams(1, ctx)}
${renderTeams(2, ctx)}
   
${bold("Второй круг")}
${renderTeams(3, ctx)}
${renderTeams(4, ctx)}
${renderTeams(5, ctx)}

${renderPayer(ctx)}

${renderResults(ctx)}`;
      break;
    }

    case 5: {
      messageText = fmt`
${renderTeams(0, ctx)}
${renderTeams(1, ctx)}
${renderTeams(2, ctx)}
${renderTeams(3, ctx)}
${renderTeams(4, ctx)}

${renderPayer(ctx)}

${renderResults(ctx)}`;
      break;
    }

    case 6: {
      messageText = fmt`
${renderTeams(0, ctx)}
${renderTeams(1, ctx)}
${renderTeams(2, ctx)}
${renderTeams(3, ctx)}
${renderTeams(4, ctx)}
${renderTeams(5, ctx)}

${bold("Доигровки:")}
${renderTeams(6, ctx)}
${renderTeams(7, ctx)}
${renderTeams(8, ctx)}

${renderPayer(ctx)}

${renderResults(ctx)}`;
      break;
    }

    case 7: {
      messageText = fmt`
${renderTeams(0, ctx)}
${renderTeams(1, ctx)}
${renderTeams(2, ctx)}
${renderTeams(3, ctx)}
${renderTeams(4, ctx)}
${renderTeams(5, ctx)}
${renderTeams(6, ctx)}

${renderPayer(ctx)}

${renderResults(ctx)}`;
      break;
    }

    default:
      messageText = fmt`"Unexpected amount of players`;
  }

  await ctx.editMessageText(
    messageText,
    isOver ? undefined : matchesInlineKeyboard(ctx),
  );
}

interface PlayerResult {
  name: string;
  wins: number;
  losses: number;
  pointsDiff: number;
  extraWins: number;
  extraLosses: number;
  extraDiff: number;
}

function getInitialResult(id: number, ctx: BotContext) {
  const { usersById } = ctx.session;

  return {
    name: usersById[id].name,
    wins: 0,
    losses: 0,
    pointsDiff: 0,
    extraWins: 0,
    extraLosses: 0,
    extraDiff: 0,
  };
}

function renderResults(ctx: BotContext) {
  const { players, matches, points } = getCallbackMessageSession(ctx);

  const results = players.reduce(
    (acc, curr) => ({ ...acc, [curr]: getInitialResult(curr, ctx) }),
    {} as Record<number, PlayerResult>,
  );

  for (const [index, match] of matches.entries()) {
    if (match.result === null || match.winner === null) continue;

    const [a1, a2, b1, b2] = match.teams;

    if (players.length === 6 && index > 5) {
      const pointsDiff = Math.max(15 - match.result, 2);

      results[a1].extraWins += 1 - match.winner;
      results[a1].extraLosses += match.winner;
      results[a1].extraDiff += match.winner === 0 ? pointsDiff : -pointsDiff;

      results[a2].extraWins += 1 - match.winner;
      results[a2].extraLosses += match.winner;
      results[a2].extraDiff += match.winner === 0 ? pointsDiff : -pointsDiff;

      results[b1].extraWins += match.winner;
      results[b1].extraLosses += 1 - match.winner;
      results[b1].extraDiff += match.winner === 1 ? pointsDiff : -pointsDiff;

      results[b2].extraWins += match.winner;
      results[b2].extraLosses += 1 - match.winner;
      results[b2].extraDiff += match.winner === 1 ? pointsDiff : -pointsDiff;

      continue;
    }

    const pointsDiff = Math.max(points - match.result, 2);

    results[a1].wins += 1 - match.winner;
    results[a1].losses += match.winner;
    results[a1].pointsDiff += match.winner === 0 ? pointsDiff : -pointsDiff;

    results[a2].wins += 1 - match.winner;
    results[a2].losses += match.winner;
    results[a2].pointsDiff += match.winner === 0 ? pointsDiff : -pointsDiff;

    results[b1].wins += match.winner;
    results[b1].losses += 1 - match.winner;
    results[b1].pointsDiff += match.winner === 1 ? pointsDiff : -pointsDiff;

    results[b2].wins += match.winner;
    results[b2].losses += 1 - match.winner;
    results[b2].pointsDiff += match.winner === 1 ? pointsDiff : -pointsDiff;
  }

  const resultArray = Object.values(results);
  resultArray.sort((a, b) => b.wins - a.wins || b.pointsDiff - a.pointsDiff);

  const extraArray = [...resultArray];
  extraArray.sort(
    (a, b) => b.extraWins - a.extraWins || b.extraDiff - a.extraDiff,
  );

  const isExtra = players.length === 6 && matches[6].result !== null;

  return fmt`${
    matches.some((m) => m.result !== null)
      ? pre("Standings")(
          `${resultArray
            .map(
              ({ name, wins, losses, pointsDiff }, i) =>
                `${i + 1}. ${f(name)} ${wins}-${losses} (${
                  pointsDiff > 0 ? "+" : ""
                }${pointsDiff})`,
            )
            .join("\n")}`,
        )
      : ""
  }
    
    ${
      isExtra
        ? pre("Доигровки")(
            `${extraArray
              .map(
                ({ name, extraWins, extraLosses, extraDiff }, i) =>
                  `${i + 1}. ${f(name)} ${extraWins}-${extraLosses} (${
                    extraDiff > 0 ? "+" : ""
                  }${extraDiff})`,
              )
              .join("\n")}`,
          )
        : ""
    }`;
}

function renderPayer(ctx: BotContext) {
  const { players } = getCallbackMessageSession(ctx);
  const { usersById } = ctx.session;
  return fmt`${bold("Дежурный:")}
👮🏻‍ ${usersById[players.at(-1)!].name}`;
}

function matchesInlineKeyboard(ctx: BotContext) {
  const { matches, players } = getCallbackMessageSession(ctx);

  const hasNotStarted = matches.every((m) => m.result === null);
  const hasAllMatchesFinished = matches.every((m) => m.result !== null);

  const is6max = players.length === 6;
  const hasFirst6MatchesFinished = matches
    .slice(0, 6)
    .every((m) => m.result !== null);

  const buttons = matches
    .filter((m, i) => {
      if (!is6max) return true;
      return hasFirst6MatchesFinished ? true : i < 6;
    })
    .map((m, index) => {
      const data = `league_match_result_${index}`;
      if (m.result !== null) return btn("✅", data);
      if (is6max && index > 5) return btn(`Extra-${index - 5}`, data);
      return btn(`M${index + 1}`, data);
    });

  if (hasAllMatchesFinished || hasFirst6MatchesFinished) {
    buttons.push(btn("🏁 Завершить", "finish_league"));
  } else if (hasNotStarted) {
    buttons.push(btn("❌ Удалить лигу", "delete_league"));
  }

  return Markup.inlineKeyboard(buttons, {
    wrap: wrapOn(is6max ? 6 : matches.length, ["🏁 Завершить", "❌ Удалить"]),
  });
}
