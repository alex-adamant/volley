import { kv } from "@vercel/kv";
import { BotContext, BotSession, SessionMessage } from "../types";

export function getInitialSession(): BotSession {
  return {
    users: [],
    usersById: {},
    messages: {},
  };
}

function getInitialMessageContext(): SessionMessage {
  return {
    points: 21,
    result: 0,
    winner: 0,
    players: [],
    matches: [],
    isOver: false,
  };
}

export const kvStore = {
  async get(key: string) {
    return ((await kv.get(key)) as BotSession) || getInitialSession();
  },
  async set(key: string, session: BotSession) {
    await kv.set(key, session);
  },
  async delete(key: string) {
    await kv.del(key);
  },
};

export function resetMessageSession(ctx: BotContext) {
  const messageId = ctx.callbackQuery?.message?.message_id;
  if (!messageId) throw new Error("No message id");

  delete ctx.session.messages[messageId];
}

export function getCallbackMessageSession(ctx: BotContext) {
  const messageId = ctx.callbackQuery?.message?.message_id;
  if (!messageId) throw new Error("No message id");

  if (!ctx.session.messages[messageId])
    ctx.session.messages[messageId] = getInitialMessageContext();

  return ctx.session.messages[messageId];
}

export function getInitialGame(
  teams: [number, number, number, number],
  shouldFlip = false,
) {
  let [a1, a2, b1, b2] = teams;
  if (shouldFlip) {
    [a1, a2] = Math.random() > 0.5 ? [a2, a1] : [a1, a2];
    [b1, b2] = Math.random() > 0.5 ? [b2, b1] : [b1, b2];
  }
  return {
    teams: [a1, a2, b1, b2] as [number, number, number, number],
    result: null,
    winner: null,
    id: null,
  };
}
