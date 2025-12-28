import { BotContext } from "../types";
import { getActiveUsers, getInactiveUsers, prisma } from "./db";
import { Middleware } from "telegraf";
import { User } from "@prisma/client";

export const requireAdmin: Middleware<BotContext> = async (ctx, next) => {
  const userId = ctx.from?.id;
  const name = ctx.from?.username;
  const chatId = getChatId(ctx);

  if (!userId) return;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ telegramId: userId?.toString() }, { telegramUsername: name }],
    },
    include: { chatUsers: { where: { chatId } } },
  });
  if (!user) return;

  const chatUser = user.chatUsers[0];

  if (!user.telegramId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { telegramId: userId.toString() },
    });
  }

  if (!chatUser) {
    throw new Error("Chat user not found");
  }

  if (chatUser.isAdmin) return next();

  await ctx.reply("This command is only available for admins");
};

export const requireChat: Middleware<BotContext> = async (ctx, next) => {
  try {
    if (ctx.session.contextChatId) {
      return await next();
    }
    const chat = await prisma.chat.findFirst({
      where: { id: ctx.chat?.id?.toString() },
    });

    if (chat) {
      ctx.session.contextChatId = chat.id;
      return await next();
    }

    await ctx.reply("This chat is not registered yet");
  } catch (error) {
    console.log("[ERROR]: ", error);
    return null;
  }
};

function getUsersById(users: User[]) {
  return users.reduce(
    (acc, curr) => ({ ...acc, [curr.id]: curr }),
    {} as Record<number, User>,
  );
}

export const insertActiveUsersToSession: Middleware<BotContext> = async (
  ctx,
  next,
) => {
  try {
    const chatId = getChatId(ctx);
    ctx.session.users = await getActiveUsers(chatId);
    ctx.session.usersById = getUsersById(ctx.session.users);

    return await next();
  } catch (error) {
    console.log("[ERROR]: ", error);
    return null;
  }
};

export const insertInactiveUsersToSession: Middleware<BotContext> = async (
  ctx,
  next,
) => {
  const chatId = getChatId(ctx);
  ctx.session.users = await getInactiveUsers(chatId);
  ctx.session.usersById = getUsersById(ctx.session.users);

  return await next();
};

export function getChatId(ctx: BotContext) {
  const chatId = ctx.session.contextChatId ?? ctx.chat?.id.toString();
  if (!chatId) throw new Error("Chat ID is not defined");
  return chatId;
}
