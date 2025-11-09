import { Markup, Telegraf } from "telegraf";
import { BotContext } from "../types";
import {
  insertActiveUsersToSession,
  insertInactiveUsersToSession,
  requireAdmin,
} from "../utils/middleware";
import { prisma } from "../utils/db";

const btn = Markup.button.callback;

export function playersActivation(bot: Telegraf<BotContext>) {
  bot.command(
    ["ap", "activate-player"],
    requireAdmin,
    insertInactiveUsersToSession,
    async (ctx) => {
      await ctx.reply(
        "Выберите игрока для активации",
        Markup.inlineKeyboard(
          ctx.session.users.map((u) => btn(u.name, `activate_${u.id}`)),
          { columns: 3 },
        ),
      );
    },
  );

  bot.action(/^activate_(\d+)$/, async (ctx) => {
    const userId = Number(ctx.match[1]);
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
    await ctx.editMessageText(`User is active now: ${user.name}`);
  });

  bot.command(
    ["dp", "deactivate-player"],
    requireAdmin,
    insertActiveUsersToSession,
    async (ctx) => {
      await ctx.reply(
        "Выберите игрока для деактивации",
        Markup.inlineKeyboard(
          ctx.session.users.map((u) => btn(u.name, `deactivate_${u.id}`)),
          { columns: 3 },
        ),
      );
    },
  );

  bot.action(/^deactivate_(\d+)$/, async (ctx) => {
    const userId = Number(ctx.match[1]);
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    await ctx.editMessageText(`User is inactive now: ${user.name}`);
  });
}
