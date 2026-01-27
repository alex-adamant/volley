<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import type { Pathname } from "$app/types";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import { twMerge } from "tailwind-merge";
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

  const formatDiff = (value: number | null) => {
    if (value === null) return "—";
    const rounded = Math.round(value * 10) / 10;
    const safe = Object.is(rounded, -0) ? 0 : rounded;
    const prefix = safe > 0 ? "+" : "";
    return `${prefix}${safe.toFixed(1)}`;
  };

  const teamSummary = $derived.by(() => {
    const teams = data.teamStats;
    if (!teams.length) {
      return {
        totalTeams: 0,
        totalGames: 0,
        avgWinrate: null,
        bestWinrate: null,
        mostGames: null,
        bestDiff: null,
      };
    }

    const totalGames = teams.reduce((sum, team) => sum + team.games, 0);
    const avgWinrate =
      teams.reduce((sum, team) => sum + team.winrate, 0) / teams.length;
    const bestWinrate = teams.reduce((best, team) =>
      team.winrate > best.winrate ? team : best,
    );
    const mostGames = teams.reduce((best, team) =>
      team.games > best.games ? team : best,
    );
    const bestDiff = teams.reduce((best, team) =>
      team.pointDiffAvg > best.pointDiffAvg ? team : best,
    );

    return {
      totalTeams: teams.length,
      totalGames,
      avgWinrate,
      bestWinrate: {
        name: `${bestWinrate.p1} + ${bestWinrate.p2}`,
        winrate: bestWinrate.winrate,
      },
      mostGames: {
        name: `${mostGames.p1} + ${mostGames.p2}`,
        games: mostGames.games,
      },
      bestDiff: {
        name: `${bestDiff.p1} + ${bestDiff.p2}`,
        diff: bestDiff.pointDiffAvg,
      },
    };
  });

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

  const handleRangeChange = (nextRange: string) => {
    applyRange(nextRange);
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

  const handleStatusChange = (nextStatus: string) => {
    applyStatus(nextStatus);
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
    <div class="text-ink text-sm font-semibold">Teams</div>
    {#if data.activeRange?.note && rangeValue.startsWith("season")}
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
      >
        {data.activeRange.note}
      </div>
    {/if}
  </div>

  <div class="mt-3 overflow-x-auto">
    <table class="w-full min-w-[640px] text-xs">
      <thead class="bg-white/70 text-left">
        <tr
          class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
        >
          <th class="px-2 py-2">#</th>
          <th class="px-2 py-2">Team</th>
          <th class="px-2 py-2 text-right">Record</th>
          <th class="px-2 py-2 text-right">Win%</th>
          <th class="px-2 py-2 text-right">Points</th>
          <th class="px-2 py-2 text-right">Diff</th>
          <th class="px-2 py-2 text-right">Form</th>
        </tr>
      </thead>
      <tbody>
        {#if data.teamStats.length === 0}
          <tr>
            <td class="text-muted-foreground px-2 py-4" colspan="7">
              No teams found.
            </td>
          </tr>
        {:else}
          {#each data.teamStats as team, index (team.key)}
            <tr
              class="border-stroke/50 border-b transition last:border-b-0 hover:bg-white/70"
            >
              <td class="px-2 py-2 font-semibold tabular-nums">
                {index + 1}
              </td>
              <td class="px-2 py-2">
                <div class="font-semibold">{team.p1} + {team.p2}</div>
                <div class="text-muted-foreground text-[0.65rem]">
                  {team.games} games · Last
                  {team.lastPlayed
                    ? new Date(team.lastPlayed).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "n/a"}
                </div>
              </td>
              <td class="px-2 py-2 text-right tabular-nums">
                {team.wins}-{team.losses}
              </td>
              <td class="px-2 py-2 text-right tabular-nums">
                {team.winrate}%
              </td>
              <td class="px-2 py-2 text-right tabular-nums">
                <div>{team.pointsFor} / {team.pointsAgainst}</div>
                <div class="text-muted-foreground text-[0.65rem]">
                  Avg {team.avgPointsFor.toFixed(1)} / {team.avgPointsAgainst.toFixed(
                    1,
                  )}
                </div>
              </td>
              <td class="px-2 py-2 text-right font-semibold tabular-nums">
                {formatDiff(team.pointDiffAvg)}
              </td>
              <td class="px-2 py-2 text-right">
                <div class="flex justify-end gap-1">
                  {#each team.recentForm as mark, markIndex (markIndex)}
                    <span
                      class={twMerge(
                        "h-2 w-2 rounded-full",
                        mark === "W" ? "bg-green-500" : "bg-red-500",
                      )}
                    ></span>
                  {/each}
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</section>

<section class="mt-3">
  <details class="border-stroke rounded-2xl border bg-white/70 p-3">
    <summary
      class="text-muted-foreground cursor-pointer text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
    >
      Team Stats
    </summary>
    <div class="text-muted-foreground mt-3 grid gap-2 text-xs md:grid-cols-4">
      <div>Teams: {teamSummary.totalTeams}</div>
      <div>Total games: {teamSummary.totalGames}</div>
      <div>
        Avg win%:
        {teamSummary.avgWinrate !== null
          ? teamSummary.avgWinrate.toFixed(1)
          : "-"}
      </div>
      {#if teamSummary.bestWinrate}
        <div>
          Best win%: {teamSummary.bestWinrate.name} ({teamSummary.bestWinrate
            .winrate}%)
        </div>
      {/if}
      {#if teamSummary.mostGames}
        <div>
          Most games: {teamSummary.mostGames.name} ({teamSummary.mostGames
            .games})
        </div>
      {/if}
      {#if teamSummary.bestDiff}
        <div>
          Best diff: {teamSummary.bestDiff.name} ({formatDiff(
            teamSummary.bestDiff.diff,
          )})
        </div>
      {/if}
    </div>
  </details>
</section>
