import { Telegraf } from "telegraf";
import { BotContext } from "../types";

export function flipPlayers(bot: Telegraf<BotContext>) {
  bot.command(["flip", "f"], async (ctx) => {
    if (!ctx.message || !("text" in ctx.message) || !ctx.message.text) {
      return ctx.reply("Please send a message with the list of players");
    }
    console.log("chatId: ", ctx.chat?.id);
    const playerList = ctx.message.text.split(/[,\s]/).slice(1).filter(Boolean);

    if (playerList.length < 2) {
      return ctx.reply(
        "Для флипа нужны минимум двое. Имена можно писать через пробел или запятую.",
      );
    }

    if (new Set(playerList).size !== playerList.length) {
      return ctx.reply("Имена должны быть уникальными");
    }

    const result = playerList
      .map((player) => ({
        player,
        score: (Math.random() * 100).toFixed(1),
      }))
      .sort((a, b) => Number(b.score) - Number(a.score))
      .map(
        ({ player, score }, index) =>
          `${player}: ${score} ${
            index === 0 ? "👍" : index === playerList.length - 1 ? "🤷🏻‍" : ""
          }`,
      )
      .join("\n");

    await ctx.reply(result);
  });
}
