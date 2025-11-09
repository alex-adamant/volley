import { calculateResults } from "../utils/calculate-results";
import { f } from "../utils/format";
import { Markup, Telegraf } from "telegraf";
import { BotContext } from "../types";
import { deleteMessage } from "./shared";
import { fmt, pre } from "telegraf/format";

const btn = Markup.button.callback;

const options = Markup.inlineKeyboard([
  btn("Обновить", "rating_refresh"),
  btn("Спрятать", deleteMessage),
]);

export function ratingCalculation(bot: Telegraf<BotContext>) {
  bot.command(["players-rating", "r"], async (ctx) => {
    const message = await getRatingMessage(ctx);
    await ctx.reply(message, options);
  });
  bot.action("rating_refresh", async (ctx) => {
    const message = await getRatingMessage(ctx);
    await ctx.editMessageText(message, options);
  });
}

async function getRatingMessage(ctx: BotContext) {
  const chatId = ctx.session.contextChatId ?? ctx.chat?.id.toString();
  if (!chatId) throw new Error("Chat not found");
  const playerResults = await calculateResults(chatId);

  const sortedPlayers = playerResults
    .filter((p) => p.isActive && !p.isHidden)
    .sort((a, b) => b.rating - a.rating);

  return fmt`
${pre("")`Рейтинг на ${new Date().toLocaleDateString("RU", {
  timeZone: "Asia/Bangkok",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
})}
      
${f("№", 4) + f`Имя` + f`Рейтинг` + f("Игры", 7) + f`𝝙`}
${sortedPlayers
  .map((p, i) => {
    let ratingChange =
      p.ratingChange > 0 ? `+${p.ratingChange}` : p.ratingChange;
    if (p.ratingChange >= 45) {
      ratingChange += `🔥🔥🔥`;
    } else if (p.ratingChange >= 30) {
      ratingChange += `🔥🔥`;
    } else if (p.ratingChange >= 15) {
      ratingChange += `🔥`;
    }

    return `${f((i + 1).toString(), 4)}${f(p.name)}${f(p.rating.toString())}${f(
      p.games.toString(),
      7,
    )}${f(ratingChange.toString())}`;
  })
  .join("\n")}`}`;
}
