import { Markup, Telegraf } from "telegraf";
import { BotContext } from "../types";
import { requireAdmin } from "../utils/middleware";
import { prisma } from "../utils/db";

const btn = Markup.button.callback;

export function chatSettings(bot: Telegraf<BotContext>) {
  bot.command("chat", requireAdmin, async (ctx) => {
    const chats = await prisma.chat.findMany();

    await ctx.reply(
      "Выберите чат",
      Markup.inlineKeyboard(
        chats.map((p) => btn(p.name, `chat_${p.id}`)),
        { columns: 2 },
      ),
    );
  });

  bot.action(/^chat_(-\d+)$/, async (ctx) => {
    ctx.session.contextChatId = ctx.match[1];

    const chat = await prisma.chat.findFirst({
      where: { id: ctx.session.contextChatId },
    });
    if (!chat) return ctx.reply("Chat not found");

    await ctx.editMessageText(`Chat selected: ${chat.name}`);
  });
}
