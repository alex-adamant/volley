import type { Cookies } from "@sveltejs/kit";
import { error } from "@sveltejs/kit";
import { calculateWinrate } from "$lib";
import { calculateResults } from "$lib/rating";
import { adminEnabled, isAdmin } from "$lib/server/admin";
import { prisma } from "$lib/server/prisma";
import { getRangeOptions } from "$lib/server/ranges";

type Status = "active" | "all";
type SeasonBoostMode = "boosted" | "base";

const normalizeStatus = (value: string | null): Status =>
  value === "all" ? "all" : "active";

export async function loadChatRatingData({
  slug,
  rangeKey,
  statusParam,
  seasonBoostParam,
  cookies,
}: {
  slug: string;
  rangeKey: string;
  statusParam: string | null;
  seasonBoostParam: string | null;
  cookies: Cookies;
}) {
  const adminUser = await isAdmin(cookies);
  const status = normalizeStatus(statusParam);
  const seasonBoostMode: SeasonBoostMode =
    adminUser && seasonBoostParam === "base" ? "base" : "boosted";

  const chat = await prisma.chat.findUnique({ where: { slug } });
  if (!chat) {
    throw error(404, "Chat not found");
  }

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
  const disableSeasonBoost =
    seasonBoostMode === "base" && activeRange.key.startsWith("season");

  const users = await prisma.chatUser.findMany({
    where: { Chat: { is: { slug } } },
    include: { User: true },
    orderBy: { userId: "asc" },
  });
  const matches = await prisma.match.findMany({
    where: {
      Chat: { is: { slug } },
      ...(activeRange.start && activeRange.end
        ? { day: { gte: activeRange.start, lte: activeRange.end } }
        : {}),
    },
    orderBy: { id: "asc" },
  });

  const results = calculateResults(
    users,
    matches,
    activeRange.start
      ? {
          startDate: activeRange.start,
          endDate: activeRange.end,
          disableSeasonBoost,
        }
      : undefined,
  )
    .filter((player) => !player.isHidden)
    .filter((player) => (status === "active" ? player.isActive : true))
    .map((player) => ({
      ...player,
      winrate: calculateWinrate(player),
    }));

  return {
    chat,
    users,
    matches,
    results,
    status,
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
    seasonBoostMode,
    isAdmin: adminUser,
    adminEnabled: await adminEnabled(),
  };
}
