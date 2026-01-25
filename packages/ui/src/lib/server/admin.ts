import { error, type Cookies } from "@sveltejs/kit";
import crypto from "node:crypto";
import { prisma } from "$lib/server/prisma";

const SESSION_COOKIE = "volley_admin_session";
const SESSION_TTL_DAYS = 30;
const HASH_ITERATIONS = 120000;
const HASH_KEYLEN = 64;
const HASH_DIGEST = "sha512";

const toHex = (buffer: Buffer) => buffer.toString("hex");

const hashPassword = (password: string, salt: string) =>
  crypto
    .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST)
    .toString("hex");

const verifyPassword = (password: string, salt: string, hash: string) => {
  const nextHash = hashPassword(password, salt);
  if (nextHash.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(nextHash), Buffer.from(hash));
};

export async function adminEnabled() {
  const count = await prisma.adminUser.count();
  return count > 0;
}

export async function createAdminUser(username: string, password: string) {
  const salt = toHex(crypto.randomBytes(16));
  const passwordHash = hashPassword(password, salt);

  return prisma.adminUser.create({
    data: {
      username,
      passwordHash,
      salt,
    },
  });
}

export async function isAdmin(cookies: Cookies) {
  const sessionId = cookies.get(SESSION_COOKIE);
  if (!sessionId) return false;

  const session = await prisma.adminSession.findUnique({
    where: { id: sessionId },
    include: { AdminUser: true },
  });

  if (!session) {
    cookies.delete(SESSION_COOKIE, { path: "/" });
    return false;
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.adminSession.delete({ where: { id: sessionId } });
    cookies.delete(SESSION_COOKIE, { path: "/" });
    return false;
  }

  return true;
}

export async function assertAdmin(cookies: Cookies) {
  if (!(await isAdmin(cookies))) {
    throw error(403, "Admin access required");
  }
}

export async function loginAdmin(
  cookies: Cookies,
  username: string,
  password: string,
) {
  const user = await prisma.adminUser.findUnique({
    where: { username },
  });
  if (!user) return false;
  if (!verifyPassword(password, user.salt, user.passwordHash)) return false;

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

  await prisma.adminSession.create({
    data: {
      id: sessionId,
      adminUserId: user.id,
      expiresAt,
    },
  });

  cookies.set(SESSION_COOKIE, sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });

  return true;
}

export async function clearAdminSession(cookies: Cookies) {
  const sessionId = cookies.get(SESSION_COOKIE);
  if (sessionId) {
    await prisma.adminSession.deleteMany({ where: { id: sessionId } });
  }
  cookies.delete(SESSION_COOKIE, { path: "/" });
}
