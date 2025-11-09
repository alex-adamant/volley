import { session, Telegraf } from "telegraf";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "./utils/db";
import { BotContext } from "./types";
import { kvStore } from "./utils/session";
import { chatSettings } from "./commands/set-up-chat";
import { gamesGeneration } from "./commands/games";
import { matchGeneration } from "./commands/match";
import { leagueGeneration } from "./commands/league";
import { playersActivation } from "./commands/activate";
import { dice } from "./commands/dice";
import { flipPlayers } from "./commands/flip";
import { ratingCalculation } from "./commands/rating";
import { deleteMessage, voidMessage } from "./commands/shared";

const bot = new Telegraf<BotContext>(process.env.TELEGRAM_TOKEN!);

bot.use(
  session({
    store: kvStore,
    getSessionKey: (ctx) => ctx.chat?.id.toString(),
  }),
);

playersActivation(bot);
dice(bot);
flipPlayers(bot);
gamesGeneration(bot);
leagueGeneration(bot);
matchGeneration(bot);
ratingCalculation(bot);
chatSettings(bot);
bot.action(deleteMessage, (ctx) => ctx.deleteMessage());
bot.action(voidMessage, (ctx) => ctx.answerCbQuery("Кнопка не активна"));

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method === "POST") {
    await bot.handleUpdate(req.body, res);
    await prisma.$disconnect();
  } else {
    res.status(200).send(`Hello, this is your Telegram bot!`);
    await prisma.$disconnect();
  }
};
