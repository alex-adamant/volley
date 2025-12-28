import { BotContext } from "../types";
import { prisma } from "./db";

export async function identifyUser(ctx: BotContext) {
  const telegramId = ctx.from?.id;
  const username = ctx.from?.username;

  if (!telegramId) return null;

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { telegramId: telegramId.toString() },
        ...(username ? [{ telegramUsername: username }] : []),
      ],
    },
  });

  if (user && !user.telegramId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { telegramId: telegramId.toString() },
    });
  }

  return user;
}

export function getChatId(ctx: BotContext) {
  const chatId = ctx.session.contextChatId ?? ctx.chat?.id.toString();
  if (!chatId) throw new Error("Chat ID is not defined");
  return chatId;
}
