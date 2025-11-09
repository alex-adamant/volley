import { Context } from "telegraf";
import { User } from "@prisma/client";

export interface Match {
  teams: [number, number, number, number];
  result: number | null;
  winner: number | null;
  id: number | null;
}

export interface SessionMessage {
  points: number;
  result: number;
  winner: number;
  players: number[];
  matches: Match[];
  isOver: boolean;
}

export interface BotSession {
  users: User[];
  usersById: Record<number, User>;
  contextChatId?: string;
  messages: Record<string, SessionMessage>;
}

export interface BotContext extends Context {
  session: BotSession;
}

export type MaybeArray<T> = T | T[];
