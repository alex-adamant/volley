import { error, fail } from "@sveltejs/kit";
import {
  adminEnabled,
  assertAdmin,
  clearAdminSession,
  createAdminUser,
  isAdmin,
  loginAdmin,
} from "$lib/server/admin";
import { prisma } from "$lib/server/prisma";
import { getRangeOptions } from "$lib/server/ranges";

export async function load({ params, url, cookies }) {
  const slug = params.slug;
  const chat = await prisma.chat.findUnique({ where: { slug } });
  if (!chat) {
    throw error(404, "Chat not found");
  }

  const rangeKey = url.searchParams.get("range") ?? "all";
  const limitParam = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) ? Math.min(limitParam, 200) : 30;

  const seasons = await prisma.season.findMany({
    where: { chatId: chat.id },
    orderBy: { startDate: "desc" },
  });

  const rangeOptions = getRangeOptions(seasons);
  const resolvedKey =
    rangeKey === "season"
      ? rangeOptions.find((range) => range.key.startsWith("season"))?.key
      : rangeKey;
  const activeRange =
    rangeOptions.find((range) => range.key === resolvedKey) ?? rangeOptions[0];

  const chatUsers = await prisma.chatUser.findMany({
    where: { Chat: { is: { slug } } },
    include: { User: true },
    orderBy: { userId: "asc" },
  });

  const matchFilter = {
    Chat: { is: { slug } },
    ...(activeRange.start && activeRange.end
      ? { day: { gte: activeRange.start, lte: activeRange.end } }
      : {}),
  };

  const matches = await prisma.match.findMany({
    where: matchFilter,
    orderBy: { day: "desc" },
    take: limit,
  });

  const matchesTotal = await prisma.match.count({ where: matchFilter });
  const activePlayers = chatUsers.filter(
    (p) => p.isActive && !p.isHidden,
  ).length;

  const playerMap = new Map(chatUsers.map((item) => [item.userId, item.User]));
  const matchViews = matches.map((match) => ({
    ...match,
    playerA1Name: playerMap.get(match.playerA1Id)?.name ?? "Unknown",
    playerA2Name: playerMap.get(match.playerA2Id)?.name ?? "Unknown",
    playerB1Name: playerMap.get(match.playerB1Id)?.name ?? "Unknown",
    playerB2Name: playerMap.get(match.playerB2Id)?.name ?? "Unknown",
  }));

  const adminUsers = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true, createdAt: true },
  });

  const adminUser = await isAdmin(cookies);

  return {
    chat,
    chatUsers,
    matches: matchViews,
    seasons,
    matchLimit: limit,
    matchesTotal,
    adminUsers,
    stats: {
      playersTotal: chatUsers.length,
      playersActive: activePlayers,
      matchesTotal,
      lastMatchDay: matches[0]?.day ?? null,
    },
    rangeOptions: rangeOptions.map(({ key, label, note }) => ({
      key,
      label,
      note,
    })),
    activeRange: {
      key: activeRange.key,
      label: activeRange.label,
      note: activeRange.note,
    },
    isAdmin: adminUser,
    adminEnabled: await adminEnabled(),
  };
}

export const actions = {
  login: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = String(data.get("username") ?? "");
    const password = String(data.get("password") ?? "");

    const success = await loginAdmin(cookies, username, password);
    if (!success) {
      return fail(401, { message: "Invalid credentials.", intent: "login" });
    }

    return { success: true };
  },
  createAdmin: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = String(data.get("username") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!username || password.length < 6) {
      return fail(400, {
        message: "Use a username and a password (min 6 chars).",
        intent: "createAdmin",
      });
    }

    const count = await prisma.adminUser.count();
    const adminUser = await isAdmin(cookies);

    if (count > 0 && !adminUser) {
      throw error(403, "Admin access required");
    }

    const existing = await prisma.adminUser.findUnique({
      where: { username },
    });
    if (existing) {
      return fail(400, {
        message: "Username already exists.",
        intent: "createAdmin",
      });
    }

    await createAdminUser(username, password);

    if (!adminUser) {
      await loginAdmin(cookies, username, password);
    }

    return { success: true };
  },
  logout: async ({ cookies }) => {
    await clearAdminSession(cookies);
    return { success: true };
  },
  updatePlayer: async ({ params, request, cookies }) => {
    await assertAdmin(cookies);

    const data = await request.formData();
    const userId = Number(data.get("userId"));
    const isActive = data.has("isActive");
    const isHidden = data.has("isHidden");
    const isAdminFlag = data.has("isAdmin");

    if (!userId) {
      return fail(400, { message: "Invalid user." });
    }

    const chat = await prisma.chat.findUnique({ where: { slug: params.slug } });
    if (!chat) {
      throw error(404, "Chat not found");
    }

    await prisma.chatUser.update({
      where: {
        chatId_userId: {
          chatId: chat.id,
          userId,
        },
      },
      data: { isActive, isHidden, isAdmin: isAdminFlag },
    });

    return { success: true };
  },
  updateMatch: async ({ request, cookies, params }) => {
    await assertAdmin(cookies);

    const data = await request.formData();
    const matchId = Number(data.get("matchId"));
    const playerA1Id = Number(data.get("playerA1Id"));
    const playerA2Id = Number(data.get("playerA2Id"));
    const playerB1Id = Number(data.get("playerB1Id"));
    const playerB2Id = Number(data.get("playerB2Id"));
    const teamAScore = Number(data.get("teamAScore"));
    const teamBScore = Number(data.get("teamBScore"));
    const league = Number(data.get("league"));
    const dayValue = String(data.get("day") ?? "");
    const day = new Date(dayValue);

    if (
      !matchId ||
      [playerA1Id, playerA2Id, playerB1Id, playerB2Id].some(
        (value) => !value,
      ) ||
      Number.isNaN(teamAScore) ||
      Number.isNaN(teamBScore) ||
      Number.isNaN(league) ||
      Number.isNaN(day.getTime())
    ) {
      return fail(400, { message: "Invalid match data." });
    }

    const chat = await prisma.chat.findUnique({ where: { slug: params.slug } });
    if (!chat) {
      throw error(404, "Chat not found");
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.chatId !== chat.id) {
      throw error(404, "Match not found");
    }

    await prisma.match.update({
      where: { id: matchId },
      data: {
        day,
        playerA1Id,
        playerA2Id,
        playerB1Id,
        playerB2Id,
        teamAScore,
        teamBScore,
        league,
      },
    });

    return { success: true };
  },
  deleteMatch: async ({ request, cookies, params }) => {
    await assertAdmin(cookies);

    const data = await request.formData();
    const matchId = Number(data.get("matchId"));

    if (!matchId) {
      return fail(400, { message: "Invalid match." });
    }

    const chat = await prisma.chat.findUnique({ where: { slug: params.slug } });
    if (!chat) {
      throw error(404, "Chat not found");
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.chatId !== chat.id) {
      throw error(404, "Match not found");
    }

    await prisma.match.delete({ where: { id: matchId } });

    return { success: true };
  },
  createSeason: async ({ request, cookies, params }) => {
    await assertAdmin(cookies);

    const data = await request.formData();
    const name = String(data.get("name") ?? "").trim();
    const startDateValue = String(data.get("startDate") ?? "");
    const endDateValue = String(data.get("endDate") ?? "");
    const isActive = data.has("isActive");

    const startDate = new Date(startDateValue);
    const endDate = endDateValue ? new Date(endDateValue) : null;

    if (
      !name ||
      Number.isNaN(startDate.getTime()) ||
      (endDateValue && Number.isNaN(endDate?.getTime() ?? NaN))
    ) {
      return fail(400, { message: "Invalid season data." });
    }

    const chat = await prisma.chat.findUnique({ where: { slug: params.slug } });
    if (!chat) {
      throw error(404, "Chat not found");
    }

    if (isActive) {
      await prisma.season.updateMany({
        where: { chatId: chat.id },
        data: { isActive: false },
      });
    }

    await prisma.season.create({
      data: {
        chatId: chat.id,
        name,
        startDate,
        endDate,
        isActive,
      },
    });

    return { success: true };
  },
  updateSeason: async ({ request, cookies, params }) => {
    await assertAdmin(cookies);

    const data = await request.formData();
    const seasonId = Number(data.get("seasonId"));
    const name = String(data.get("name") ?? "").trim();
    const startDateValue = String(data.get("startDate") ?? "");
    const endDateValue = String(data.get("endDate") ?? "");
    const isActive = data.has("isActive");

    const startDate = new Date(startDateValue);
    const endDate = endDateValue ? new Date(endDateValue) : null;

    if (
      !seasonId ||
      !name ||
      Number.isNaN(startDate.getTime()) ||
      (endDateValue && Number.isNaN(endDate?.getTime() ?? NaN))
    ) {
      return fail(400, { message: "Invalid season data." });
    }

    const chat = await prisma.chat.findUnique({ where: { slug: params.slug } });
    if (!chat) {
      throw error(404, "Chat not found");
    }
    const season = await prisma.season.findUnique({ where: { id: seasonId } });
    if (!season || season.chatId !== chat.id) {
      throw error(404, "Season not found");
    }

    if (isActive) {
      await prisma.season.updateMany({
        where: { chatId: chat.id },
        data: { isActive: false },
      });
    }

    await prisma.season.update({
      where: { id: seasonId },
      data: {
        name,
        startDate,
        endDate,
        isActive,
      },
    });

    return { success: true };
  },
  deleteSeason: async ({ request, cookies, params }) => {
    await assertAdmin(cookies);

    const data = await request.formData();
    const seasonId = Number(data.get("seasonId"));

    if (!seasonId) {
      return fail(400, { message: "Invalid season." });
    }

    const chat = await prisma.chat.findUnique({ where: { slug: params.slug } });
    if (!chat) {
      throw error(404, "Chat not found");
    }
    const season = await prisma.season.findUnique({ where: { id: seasonId } });
    if (!season || season.chatId !== chat.id) {
      throw error(404, "Season not found");
    }

    await prisma.season.delete({ where: { id: seasonId } });

    return { success: true };
  },
};
