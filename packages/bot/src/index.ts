import { session, Telegraf } from "telegraf";
import express from "express";
import { BotContext } from "./types";
import { chatSettings } from "./commands/set-up-chat";
import { gamesGeneration } from "./commands/games";
import { matchGeneration } from "./commands/match";
import { leagueGeneration } from "./commands/league";
import { playersActivation } from "./commands/activate";
import { dice } from "./commands/dice";
import { flipPlayers } from "./commands/flip";
import { ratingCalculation } from "./commands/rating";
import { deleteMessage, voidMessage } from "./commands/shared";
import { sessionStore } from "./utils/session";

const PORT = Number(process.env.PORT || 4000);
const TOKEN = process.env.TELEGRAM_TOKEN!;

if (!TOKEN) throw new Error("TELEGRAM_TOKEN is required");

const bot = new Telegraf<BotContext>(process.env.TELEGRAM_TOKEN!);

const sessionMiddleware = session({
  store: sessionStore,
  getSessionKey: (ctx) => ctx.chat?.id.toString(),
});

bot.use(sessionMiddleware);

const app = express();
app.use(express.json({ limit: "1mb" }));

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

app.post("/", async (req, res) => {
  await bot.handleUpdate(req.body, res);
});
app.get("/", (req, res) => {
  res.status(200).send(`Hello, this is your Telegram bot!`);
});

app.listen(PORT, () => {
  console.log(`Bot listening on http://localhost:${PORT}`);
});
