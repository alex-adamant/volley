import { BotContext } from "../types";
import { getActiveUsers, getInactiveUsers, prisma, getChatUser } from "./db";
import { Middleware } from "telegraf";
import { User } from "@prisma/client";
import { identifyUser, getChatId } from "./context";

export const requireAdmin: Middleware<BotContext> = async (ctx, next) => {
  const chatId = getChatId(ctx);

  const user = await identifyUser(ctx);
  if (!user) return;

  const chatUser = await getChatUser(user.id, chatId);

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
    const chatId = ctx.chat?.id?.toString();
    if (!chatId) return;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
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
