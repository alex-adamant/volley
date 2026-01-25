<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import type { Pathname } from "$app/types";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import PrimaryNav from "$lib/components/primary-nav.svelte";
  import * as Select from "$lib/components/ui/select";

  let { data } = $props();

  type StatusValue = "active" | "all";

  const normalizeStatus = (value: string): StatusValue =>
    value === "all" ? "all" : "active";

  let rangeValue = $state("all");
  let statusValue = $state<StatusValue>("active");

  const slug = $derived(page.params.slug ?? "");
  const rangeStorageKey = $derived(`volley-range:${slug}`);
  const statusStorageKey = $derived(`volley-status:${slug}`);

  const rangeOptions = $derived(
    data.rangeOptions.map((range) => ({
      value: range.key,
      label: range.label,
    })),
  );
  const rangeLabel = $derived(
    rangeOptions.find((option) => option.value === rangeValue)?.label ??
      "Range",
  );
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "all", label: "All" },
  ];
  const statusLabel = $derived(
    statusOptions.find((option) => option.value === statusValue)?.label ??
      "Status",
  );

  let lastRangeKey = $state("all");
  let lastStatusValue = $state<StatusValue>("active");

  $effect(() => {
    const next = data.activeRange?.key ?? "all";
    if (next !== lastRangeKey) {
      lastRangeKey = next;
      rangeValue = next;
    }
  });

  $effect(() => {
    const next = normalizeStatus(data.status ?? "active");
    if (next !== lastStatusValue) {
      lastStatusValue = next;
      statusValue = next;
    }
  });

  const toPathname = (value: string) => value as Pathname;

  const buildQuery = (rangeKey: string, statusKey: string) => {
    const params = new SvelteURLSearchParams();
    if (rangeKey) params.set("range", rangeKey);
    if (statusKey) params.set("status", statusKey);
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  const applyRange = (nextRange: string) => {
    rangeValue = nextRange;
    if (browser) {
      localStorage.setItem(rangeStorageKey, nextRange);
    }
    goto(
      resolve(
        toPathname(`${page.url.pathname}${buildQuery(nextRange, statusValue)}`),
      ),
      {
        keepFocus: true,
        noScroll: true,
      },
    );
  };

  const applyStatus = (nextStatus: string) => {
    const normalized = normalizeStatus(nextStatus);
    statusValue = normalized;
    if (browser) {
      localStorage.setItem(statusStorageKey, normalized);
    }
    goto(
      resolve(
        toPathname(`${page.url.pathname}${buildQuery(rangeValue, normalized)}`),
      ),
      {
        keepFocus: true,
        noScroll: true,
      },
    );
  };

  const handleRangeChange = (nextRange: string) => {
    applyRange(nextRange);
  };

  const handleStatusChange = (nextStatus: string) => {
    applyStatus(nextStatus);
  };

  const formatDiff = (value: number | null) => {
    if (value === null) return "—";
    const rounded = Math.round(value * 10) / 10;
    const safe = Object.is(rounded, -0) ? 0 : rounded;
    const prefix = safe > 0 ? "+" : "";
    return `${prefix}${safe.toFixed(1)}`;
  };

  const navItems = $derived.by(() => {
    const query = buildQuery(rangeValue, statusValue);
    const playersPath = `/chat/${slug}`;
    return [
      {
        label: "Players",
        href: toPathname(`${playersPath}${query}`),
        active: page.url.pathname === playersPath,
      },
      {
        label: "Teams",
        href: toPathname(`/chat/${slug}/team-stats${query}`),
        active: page.url.pathname === `/chat/${slug}/team-stats`,
      },
      {
        label: "League Stats",
        href: toPathname(`/chat/${slug}/league-stats${query}`),
        active: page.url.pathname === `/chat/${slug}/league-stats`,
      },
      {
        label: "Results",
        href: toPathname(`/chat/${slug}/day-results${query}`),
        active: page.url.pathname === `/chat/${slug}/day-results`,
      },
      {
        label: "Admin",
        href: toPathname(`/chat/${slug}/admin${query}`),
        active: page.url.pathname === `/chat/${slug}/admin`,
      },
    ];
  });

  onMount(() => {
    if (!browser) return;
    const params = new SvelteURLSearchParams();
    const currentRange = page.url.searchParams.get("range");
    const currentStatus = page.url.searchParams.get("status");
    const storedRange = localStorage.getItem(rangeStorageKey);
    const storedStatus = localStorage.getItem(statusStorageKey);
    let changed = false;

    if (currentRange) {
      params.set("range", currentRange);
    } else if (storedRange) {
      params.set("range", storedRange);
      rangeValue = storedRange;
      changed = true;
    }

    if (currentStatus) {
      params.set("status", currentStatus);
    } else if (storedStatus) {
      const normalized = normalizeStatus(storedStatus);
      params.set("status", normalized);
      statusValue = normalized;
      changed = true;
    }

    if (changed) {
      goto(resolve(toPathname(`${page.url.pathname}?${params.toString()}`)), {
        replaceState: true,
        keepFocus: true,
        noScroll: true,
      });
    }
  });
</script>

<section
  class="border-stroke shadow-card sticky top-3 z-[200] rounded-2xl border bg-white/90 p-3 backdrop-blur"
>
  <div class="flex flex-wrap items-center gap-3">
    <PrimaryNav items={navItems} />

    <div class="ml-auto flex flex-wrap items-center gap-2">
      <Select.Root
        value={rangeValue}
        onValueChange={handleRangeChange}
        type="single"
      >
        <Select.Trigger
          size="sm"
          class="border-stroke text-ink h-8 w-44 rounded-full bg-white/80 px-3 text-xs font-semibold"
        >
          <span class="truncate">{rangeLabel}</span>
        </Select.Trigger>
        <Select.Content class="border-stroke bg-white">
          {#each rangeOptions as option (option.value)}
            <Select.Item value={option.value} label={option.label} />
          {/each}
        </Select.Content>
      </Select.Root>

      <Select.Root
        value={statusValue}
        onValueChange={handleStatusChange}
        type="single"
      >
        <Select.Trigger
          size="sm"
          class="border-stroke text-ink h-8 w-28 rounded-full bg-white/80 px-3 text-xs font-semibold"
        >
          <span class="truncate">{statusLabel}</span>
        </Select.Trigger>
        <Select.Content class="border-stroke bg-white">
          {#each statusOptions as option (option.value)}
            <Select.Item value={option.value} label={option.label} />
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  </div>
</section>

<section
  class="border-stroke shadow-card mt-3 rounded-2xl border bg-white/90 p-3"
>
  <div class="flex flex-wrap items-end justify-between gap-2">
    <div class="text-ink text-sm font-semibold">League Stats</div>
    {#if data.activeRange?.note && rangeValue.startsWith("season")}
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
      >
        {data.activeRange.note}
      </div>
    {/if}
  </div>

  <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Players
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {data.stats.playersShown}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">
        Shown / {data.stats.playersTotal} total
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Matches
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {data.stats.matchesTotal}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">
        Last {data.stats.lastMatchDay
          ? new Date(data.stats.lastMatchDay).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "n/a"}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Avg rating
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {data.stats.averageRating ?? "-"}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">
        Range {data.stats.ratingLow ?? "-"} → {data.stats.ratingHigh ?? "-"}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Total points
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {data.stats.totalPoints}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">
        Avg {data.stats.averagePoints?.toFixed(1) ?? "-"} / match
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Games
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {data.stats.totalGames}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">
        Avg {data.stats.averageGames?.toFixed(1) ?? "-"} / player
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Margin
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {data.stats.averageMargin?.toFixed(1) ?? "-"}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">Avg point diff</div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Closest match
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {data.stats.closestMatch?.value ?? "-"}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">
        {data.stats.closestMatch?.day ?? "n/a"}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Biggest win
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {data.stats.biggestMargin?.value ?? "-"}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">
        {data.stats.biggestMargin?.day ?? "n/a"}
      </div>
    </div>
  </div>

  <div class="border-stroke mt-3 rounded-xl border bg-white/70 p-2">
    <div
      class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
    >
      Serve side
    </div>
    <div class="mt-2 overflow-x-auto">
      <table class="w-full min-w-[320px] text-xs">
        <thead class="text-left">
          <tr
            class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
          >
            <th class="px-2 py-2">Side</th>
            <th class="px-2 py-2 text-right">Games</th>
            <th class="px-2 py-2 text-right">Wins</th>
            <th class="px-2 py-2 text-right">Diff/G</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-stroke/50 border-b">
            <td class="px-2 py-2 font-semibold">Team A</td>
            <td class="px-2 py-2 text-right tabular-nums">
              {data.stats.serveSummary.teamA.games}
            </td>
            <td class="px-2 py-2 text-right tabular-nums">
              {data.stats.serveSummary.teamA.wins}
            </td>
            <td class="px-2 py-2 text-right font-semibold tabular-nums">
              {formatDiff(data.stats.serveSummary.teamA.diffAvg)}
            </td>
          </tr>
          <tr>
            <td class="px-2 py-2 font-semibold">Team B</td>
            <td class="px-2 py-2 text-right tabular-nums">
              {data.stats.serveSummary.teamB.games}
            </td>
            <td class="px-2 py-2 text-right tabular-nums">
              {data.stats.serveSummary.teamB.wins}
            </td>
            <td class="px-2 py-2 text-right font-semibold tabular-nums">
              {formatDiff(data.stats.serveSummary.teamB.diffAvg)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section
  class="border-stroke shadow-card mt-3 rounded-2xl border bg-white/90 p-3"
>
  <div class="text-ink text-sm font-semibold">Leaders</div>
  <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Top rating
      </div>
      <div class="mt-2 text-lg font-semibold">
        {data.leaders.topRating?.name ?? "-"}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">
        {data.leaders.topRating?.rating ?? "-"}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Best win%
      </div>
      <div class="mt-2 text-lg font-semibold">
        {data.leaders.bestWinrate?.name ?? "-"}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">
        {data.leaders.bestWinrate?.winrate ?? "-"}%
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Most games
      </div>
      <div class="mt-2 text-lg font-semibold">
        {data.leaders.mostActivePlayer?.name ?? "-"}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">
        {data.leaders.mostActivePlayer?.games ?? "-"}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Best diff
      </div>
      <div class="mt-2 text-lg font-semibold">
        {data.leaders.bestDiff?.name ?? "-"}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">
        {data.leaders.bestDiff?.diff ?? "-"}
      </div>
    </div>
  </div>
</section>
