import { Markup, Telegraf } from "telegraf";
import { BotContext } from "../types";
import { getAdminChats, getChat, getChatUser } from "../utils/db";
import { identifyUser } from "../utils/context";

const btn = Markup.button.callback;

export function chatSettings(bot: Telegraf<BotContext>) {
  bot.command("chat", async (ctx) => {
    const user = await identifyUser(ctx);

    if (!user) return;

    const chats = await getAdminChats(user.id);

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
    const user = await identifyUser(ctx);

    if (!user) return;

    const chatUser = await getChatUser(user.id, chatId);

    if (!chatUser?.isAdmin) {
      return ctx.answerCbQuery("You are not an admin of this chat", {
        show_alert: true,
      });
    }

    ctx.session.contextChatId = chatId;

    const chat = await getChat(chatId);
    if (!chat) return ctx.reply("Chat not found");

    await ctx.editMessageText(`Chat selected: ${chat.name}`);
  });
}
