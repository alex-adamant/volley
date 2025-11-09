import { Telegraf } from "telegraf";
import { BotContext } from "../types";
import { shuffle } from "../utils/random";
import { scheduleFunctionsMap } from "../utils/schedule";

export function gamesGeneration(bot: Telegraf<BotContext>) {
  bot.command(["games", "g"], async (ctx) => {
    if (!ctx.message || !("text" in ctx.message) || !ctx.message.text) {
      return ctx.reply("Please send a message with the list of players");
    }
    const playerList = ctx.message.text.split(/[,\s]/).slice(1).filter(Boolean);

    if (playerList.length < 4 || playerList.length > 8) {
      return ctx.reply("Нужно от 4 до 8 игроков");
    }

    // Randomize the player list
    shuffle(playerList);

    const scheduleFunction = scheduleFunctionsMap[playerList.length];

    const schedule = scheduleFunction(playerList);

    // Send the generated schedule back to the chat
    await ctx.reply(schedule, { parse_mode: "HTML" });
  });
}
