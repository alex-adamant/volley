import { BotContext } from "../types";
import { getActiveUsers, getChatUsers, getInactiveUsers, prisma } from "./db";
import { Middleware } from "telegraf";
import { User } from "@prisma/client";

export const requireAdmin: Middleware<BotContext> = async (ctx, next) => {
  const userId = ctx.from?.id;
  const name = ctx.from?.username;

  if (!userId) return;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ telegramId: userId?.toString() }, { telegramUsername: name }],
    },
  });
  if (!user) return;

  if (!user.telegramId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { telegramId: userId.toString() },
    });
  }

  if (user?.isAdmin) return next();

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

export const insertAllUsersToSession: Middleware<BotContext> = async (
  ctx,
  next,
) => {
  const chatId = ctx.session.contextChatId ?? ctx.chat?.id.toString();
  ctx.session.users = await getChatUsers(chatId);
  ctx.session.usersById = getUsersById(ctx.session.users);

  return await next();
};

export const insertActiveUsersToSession: Middleware<BotContext> = async (
  ctx,
  next,
) => {
  try {
    const chatId = ctx.session.contextChatId ?? ctx.chat?.id.toString();
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
  const chatId = ctx.session.contextChatId ?? ctx.chat?.id.toString();
  ctx.session.users = await getInactiveUsers(chatId);
  ctx.session.usersById = getUsersById(ctx.session.users);

  return await next();
};
