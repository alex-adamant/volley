import { Markup, Telegraf } from "telegraf";
import { BotContext } from "../types";
import { prisma } from "../utils/db";

const btn = Markup.button.callback;

export function chatSettings(bot: Telegraf<BotContext>) {
  bot.command("chat", async (ctx) => {
    const userId = ctx.from?.id;
    const name = ctx.from?.username;

    if (!userId) return;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ telegramId: userId.toString() }, { telegramUsername: name }],
      },
      include: {
        chatUsers: {
          where: { isAdmin: true },
          include: { Chat: true },
        },
      },
    });

    if (!user) return;

    if (!user.telegramId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { telegramId: userId.toString() },
      });
    }

    const chats = user.chatUsers.map((cu) => cu.Chat);

    if (chats.length === 0) {
      return ctx.reply("You don't have admin rights in any chat.");
    }

    await ctx.reply(
      "Выберите чат",
      Markup.inlineKeyboard(
        chats.map((p) => btn(p.name, `chat_${p.id}`)),
        { columns: 2 },
      ),
    );
  });

  bot.action(/^chat_(-\d+)$/, async (ctx) => {
    const chatId = ctx.match[1];
    const userId = ctx.from?.id;
    const name = ctx.from?.username;

    if (!userId) return;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ telegramId: userId.toString() }, { telegramUsername: name }],
      },
      include: { chatUsers: { where: { chatId } } },
    });

    const chatUser = user?.chatUsers[0];

    if (!chatUser?.isAdmin) {
      return ctx.answerCbQuery("You are not an admin of this chat", {
        show_alert: true,
      });
    }

    ctx.session.contextChatId = chatId;

    const chat = await prisma.chat.findFirst({
      where: { id: ctx.session.contextChatId },
    });
    if (!chat) return ctx.reply("Chat not found");

    await ctx.editMessageText(`Chat selected: ${chat.name}`);
  });
}
