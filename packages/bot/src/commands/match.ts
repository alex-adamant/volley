import { Markup, Telegraf } from "telegraf";
import { BotContext } from "../types";
import { insertActiveUsersToSession, requireChat } from "../utils/middleware";
import {
  getCallbackMessageSession,
  resetMessageSession,
} from "../utils/session";
import { prisma } from "../utils/db";
import { getTeamTitles, getTeamTitlesFormatted } from "../utils/format";
import { fmt, italic } from "telegraf/format";
import { deleteMessage, wrapOn } from "./shared";
import { pointsOptions } from "../utils/schedule";

const btn = Markup.button.callback;

export function matchGeneration(bot: Telegraf<BotContext>) {
  bot.command("m", requireChat, insertActiveUsersToSession, async (ctx) => {
    await ctx.reply(
      "Выберите игроков",
      Markup.inlineKeyboard(
        ctx.session.users.map((user) =>
          btn(user.name, `match_player_${user.id}`),
        ),
        { columns: 3 },
      ),
    );
  });

  bot.action(/^match_player_(\d+)$/, async (ctx) => {
    const messageSession = getCallbackMessageSession(ctx);

    messageSession.players.push(Number(ctx.match[1]));

    if (messageSession.players.length < 4) {
      await renderPlayerSelection(ctx);
    } else {
      await renderWinnerSelection(ctx);
    }
  });

  bot.action(/^undo_match_player_(\d+)$/, async (ctx) => {
    const messageSession = getCallbackMessageSession(ctx);
    const undoId = Number(ctx.match[1]);
    messageSession.players = messageSession.players.filter((p) => p !== undoId);
    await renderPlayerSelection(ctx);
  });

  async function renderPlayerSelection(ctx: BotContext) {
    const { users, usersById } = ctx.session;
    const { players } = getCallbackMessageSession(ctx);

    const [teamA, teamB] = getTeamTitles(ctx, usersById);

    await ctx.editMessageText(
      `Выберите игроков:\n${teamA}  ${teamB}`,
      Markup.inlineKeyboard(
        users.map((p) => {
          const isInFirst = players.slice(0, 2).includes(p.id);
          const isInSecond = players.slice(2).includes(p.id);
          const isChosen = isInFirst || isInSecond;

          return btn(
            `${p.name}${isInFirst ? " 1️⃣" : isInSecond ? " 2️⃣" : ""}`,
            isChosen ? `undo_match_player_${p.id}` : `match_player_${p.id}`,
          );
        }),
        { columns: 3 },
      ),
    );
  }

  bot.action("undo_winner", renderWinnerSelection);

  bot.action(/^winner_(\d+)$/, async (ctx) => {
    const messageSession = getCallbackMessageSession(ctx);
    messageSession.winner = Number(ctx.match[1]);
    await renderPointsSelection(ctx);
  });

  bot.action(/^points_(\d+)$/, async (ctx) => {
    const messageSession = getCallbackMessageSession(ctx);
    messageSession.points = Number(ctx.match[1]);
    renderPointsSelection(ctx);
  });

  bot.action(/^result_(\d+)$/, async (ctx) => {
    const messageSession = getCallbackMessageSession(ctx);

    const loserPoints = Number(ctx.match[1]);
    const winnerPoints =
      messageSession.points - loserPoints > 1
        ? messageSession.points
        : loserPoints + 2;

    const teamAScore = messageSession.winner === 0 ? winnerPoints : loserPoints;
    const teamBScore = messageSession.winner === 1 ? winnerPoints : loserPoints;

    const chatId = ctx.session.contextChatId ?? ctx.chat?.id.toString();
    if (!chatId) {
      throw new Error("Chat ID is not defined");
    }

    await prisma.match.create({
      data: {
        playerA1Id: messageSession.players[0],
        playerA2Id: messageSession.players[1],
        playerB1Id: messageSession.players[2],
        playerB2Id: messageSession.players[3],
        chatId,
        teamAScore,
        teamBScore,
        day: new Date(),
        league: 1,
      },
    });

    const { usersById } = ctx.session;
    const [teamA, teamB] = getTeamTitlesFormatted(ctx, usersById);

    await ctx.editMessageText(
      fmt`${teamA} vs ${teamB}\n
      Результат ${teamAScore} : ${teamBScore}`,
    );

    resetMessageSession(ctx);
  });
}

export async function renderWinnerSelection(ctx: BotContext) {
  const { usersById } = ctx.session;
  const { players } = getCallbackMessageSession(ctx);

  const [teamA, teamB] = getTeamTitles(ctx, usersById);

  ctx.editMessageText(
    `${teamA}, ${teamB}\nКто победил?`,
    Markup.inlineKeyboard(
      [
        btn(teamA, `winner_0`),
        btn(teamB, `winner_1`),
        btn("⬅️ Назад", `undo_match_player_${players.at(-1)}`),
      ],
      {
        wrap: (_, i) => i === 2,
      },
    ),
  );
}

export async function renderPointsSelection(ctx: BotContext) {
  const { usersById } = ctx.session;
  const { points } = getCallbackMessageSession(ctx);

  const [teamA, teamB] = getTeamTitlesFormatted(ctx, usersById);

  ctx.editMessageText(
    fmt`${teamA} vs ${teamB}\nСколько очков набрала ${italic`проигравшая`} команда?`,
    Markup.inlineKeyboard(
      [
        ...pointsOptions.map((p) =>
          btn(`игра до ${p}${points === p ? "*" : ""}`, `points_${p}`),
        ),
        ...Array.from({ length: points }, (_, i) => i).map((i) =>
          btn(i.toString(), `result_${i}`),
        ),
        btn("⬅️ Назад", "undo_winner"),
        btn("❌ Отмена", deleteMessage),
      ],
      {
        wrap: wrapOn(3),
      },
    ),
  );
}
