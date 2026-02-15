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

  const adminUsers = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true, createdAt: true },
  });

  const adminUser = await isAdmin(cookies);

  return {
    chat,
    seasons,
    adminUsers,
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
