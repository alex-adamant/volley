import { BotContext, BotSession, SessionMessage } from "../types";
import { redis } from "./redis";

const PREFIX = "tg:sess:";
const TTL_SEC = 60 * 60 * 24 * 7;
const getKey = (key: string) => `${PREFIX}${key}`;

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

export const sessionStore = {
  async get(key: string) {
    const raw = await redis.get(getKey(key));
    return raw ? (JSON.parse(raw) as BotSession) : getInitialSession();
  },
  async set(key: string, session: BotSession) {
    await redis.set(getKey(key), JSON.stringify(session), "EX", TTL_SEC);
  },
  async delete(key: string) {
    await redis.del(getKey(key));
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
