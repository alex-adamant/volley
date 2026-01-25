export interface RangeOption {
  key: string;
  label: string;
  start?: Date;
  end?: Date;
  note?: string;
}

export interface SeasonLike {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function parseEnvDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatRange(start: Date, end: Date) {
  return `${dateFormat.format(start)} - ${dateFormat.format(end)}`;
}

export function getRangeOptions(
  seasons: SeasonLike[] = [],
  now = new Date(),
): RangeOption[] {
  const options: RangeOption[] = [{ key: "all", label: "All time" }];

  if (seasons.length > 0) {
    const sortedSeasons = [...seasons].sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return b.startDate.getTime() - a.startDate.getTime();
    });

    for (const season of sortedSeasons) {
      const endDate = season.endDate ?? now;
      options.push({
        key: `season:${season.id}`,
        label: season.name,
        start: season.startDate,
        end: endDate,
        note: formatRange(season.startDate, endDate),
      });
    }

    return options;
  }

  const envStart = parseEnvDate(process.env.SEASON_START);
  const envEnd = parseEnvDate(process.env.SEASON_END);

  const seasonEnd = envEnd ?? now;
  const seasonStart = envStart ?? new Date(seasonEnd);
  if (!envStart) {
    seasonStart.setMonth(seasonStart.getMonth() - 6);
  }

  options.push({
    key: "season:env",
    label: "Season",
    start: seasonStart,
    end: seasonEnd,
    note: formatRange(seasonStart, seasonEnd),
  });

  return options;
}
