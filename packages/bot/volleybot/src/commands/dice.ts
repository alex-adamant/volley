import { Telegraf } from "telegraf";
import { BotContext } from "../types";

export function dice(bot: Telegraf<BotContext>) {
  bot.command(["dice", "d"], async (ctx) => {
    await ctx.sendDice();
  });
}
