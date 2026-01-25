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
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import * as Select from "$lib/components/ui/select";

  let { data } = $props();

  type StatusValue = "active" | "all";

  const normalizeStatus = (value: string): StatusValue =>
    value === "all" ? "all" : "active";

  let rangeValue = $state("all");
  let statusValue = $state<StatusValue>("active");
  let dayValue = $state("");

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

  const dayOptions = $derived(
    data.days.map((day) => ({ value: day.key, label: day.label })),
  );
  const dayLabel = $derived(
    dayOptions.find((option) => option.value === dayValue)?.label ?? "Select",
  );

  let lastRangeKey = $state("all");
  let lastStatusValue = $state<StatusValue>("active");
  let lastDayKey = $state("");

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

  $effect(() => {
    const next = data.selectedDay?.key ?? "";
    if (next !== lastDayKey) {
      lastDayKey = next;
      dayValue = next;
    }
  });

  const toPathname = (value: string) => value as Pathname;

  const buildQuery = (rangeKey: string, statusKey: string, dayKey?: string) => {
    const params = new SvelteURLSearchParams();
    if (rangeKey) params.set("range", rangeKey);
    if (statusKey) params.set("status", statusKey);
    if (dayKey) params.set("day", dayKey);
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  const applyRange = (nextRange: string) => {
    rangeValue = nextRange;
    dayValue = "";
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
        toPathname(
          `${page.url.pathname}${buildQuery(rangeValue, normalized, dayValue)}`,
        ),
      ),
      {
        keepFocus: true,
        noScroll: true,
      },
    );
  };

  const applyDay = (nextDay: string) => {
    dayValue = nextDay;
    goto(
      resolve(
        toPathname(
          `${page.url.pathname}${buildQuery(rangeValue, statusValue, nextDay)}`,
        ),
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

  const handleDayChange = (nextDay: string) => {
    applyDay(nextDay);
  };

  const handlePrevDay = () => {
    if (data.prevDay?.key) {
      applyDay(data.prevDay.key);
    }
  };

  const handleNextDay = () => {
    if (data.nextDay?.key) {
      applyDay(data.nextDay.key);
    }
  };

  const navItems = $derived.by(() => {
    const baseQuery = buildQuery(rangeValue, statusValue);
    const resultsQuery = buildQuery(
      rangeValue,
      statusValue,
      dayValue || data.selectedDay?.key || "",
    );
    const playersPath = `/chat/${slug}`;
    return [
      {
        label: "Players",
        href: toPathname(`${playersPath}${baseQuery}`),
        active: page.url.pathname === playersPath,
      },
      {
        label: "Teams",
        href: toPathname(`/chat/${slug}/team-stats${baseQuery}`),
        active: page.url.pathname === `/chat/${slug}/team-stats`,
      },
      {
        label: "League Stats",
        href: toPathname(`/chat/${slug}/league-stats${baseQuery}`),
        active: page.url.pathname === `/chat/${slug}/league-stats`,
      },
      {
        label: "Results",
        href: toPathname(`/chat/${slug}/day-results${resultsQuery}`),
        active: page.url.pathname === `/chat/${slug}/day-results`,
      },
      {
        label: "Admin",
        href: toPathname(`/chat/${slug}/admin${baseQuery}`),
        active: page.url.pathname === `/chat/${slug}/admin`,
      },
    ];
  });

  onMount(() => {
    if (!browser) return;
    const params = new SvelteURLSearchParams();
    const currentRange = page.url.searchParams.get("range");
    const currentStatus = page.url.searchParams.get("status");
    const currentDay = page.url.searchParams.get("day");
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

    if (currentDay) {
      params.set("day", currentDay);
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
    <div class="text-ink text-sm font-semibold">Results</div>
    {#if data.activeRange?.note && rangeValue.startsWith("season")}
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
      >
        {data.activeRange.note}
      </div>
    {/if}
  </div>

  <div class="mt-3 flex flex-wrap items-center gap-2">
    <button
      class={twMerge(
        "border-stroke text-ink flex h-8 w-8 items-center justify-center rounded-full border bg-white/80",
        !data.prevDay && "opacity-50",
      )}
      disabled={!data.prevDay}
      onclick={handlePrevDay}
      aria-label="Previous day"
    >
      <ChevronLeft class="h-4 w-4" />
    </button>

    <Select.Root value={dayValue} onValueChange={handleDayChange} type="single">
      <Select.Trigger
        size="sm"
        class="border-stroke text-ink h-8 w-32 rounded-full bg-white/80 px-3 text-xs font-semibold"
      >
        <span class="truncate">{dayLabel}</span>
      </Select.Trigger>
      <Select.Content class="border-stroke bg-white">
        {#each dayOptions as option (option.value)}
          <Select.Item value={option.value} label={option.label} />
        {/each}
      </Select.Content>
    </Select.Root>

    <button
      class={twMerge(
        "border-stroke text-ink flex h-8 w-8 items-center justify-center rounded-full border bg-white/80",
        !data.nextDay && "opacity-50",
      )}
      disabled={!data.nextDay}
      onclick={handleNextDay}
      aria-label="Next day"
    >
      <ChevronRight class="h-4 w-4" />
    </button>

    {#if data.isToday}
      <span
        class="border-stroke text-ink rounded-full border bg-white/70 px-2 py-0.5 text-[0.55rem] font-semibold tracking-[0.2em] uppercase"
      >
        Today
      </span>
    {/if}
  </div>
</section>

<section class="mt-3 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
  <div class="border-stroke shadow-card rounded-2xl border bg-white/90 p-3">
    <div class="text-ink text-sm font-semibold">Matches</div>
    <div class="mt-3 flex flex-col gap-2">
      {#if data.matches.length === 0}
        <div class="text-muted-foreground text-xs">No matches yet.</div>
      {:else}
        {#each data.matches as match (match.id)}
          {@const teamAWon = match.teamAScore > match.teamBScore}
          {@const teamBWon = match.teamBScore > match.teamAScore}
          <div
            class="border-stroke/60 rounded-xl border bg-white/80 p-2 sm:p-3"
          >
            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div
                class={twMerge(
                  "rounded-lg px-2 py-1 text-[0.65rem] leading-tight sm:px-3 sm:py-2 sm:text-xs",
                  teamAWon
                    ? "bg-ink/5 text-ink font-semibold"
                    : "text-ink/60 font-medium",
                )}
              >
                <div class="truncate">{match.playerA1Name}</div>
                <div class="truncate">{match.playerA2Name}</div>
              </div>
              <div class="text-center">
                <div class="text-ink text-sm font-semibold tabular-nums">
                  {match.teamAScore} — {match.teamBScore}
                </div>
              </div>
              <div
                class={twMerge(
                  "rounded-lg px-2 py-1 text-right text-[0.65rem] leading-tight sm:px-3 sm:py-2 sm:text-xs",
                  teamBWon
                    ? "bg-ink/5 text-ink font-semibold"
                    : "text-ink/60 font-medium",
                )}
              >
                <div class="truncate">{match.playerB1Name}</div>
                <div class="truncate">{match.playerB2Name}</div>
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <div class="border-stroke shadow-card rounded-2xl border bg-white/90 p-3">
    <div class="text-ink text-sm font-semibold">Standings</div>
    <div class="mt-3 overflow-x-auto">
      <table class="w-full min-w-[360px] text-xs">
        <thead class="bg-white/70 text-left">
          <tr
            class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
          >
            <th class="px-2 py-2">#</th>
            <th class="px-2 py-2">Player</th>
            <th class="px-2 py-2 text-right">W-L</th>
            <th class="px-2 py-2 text-right">Pts</th>
            <th class="px-2 py-2 text-right">Diff</th>
          </tr>
        </thead>
        <tbody>
          {#if data.standings.length === 0}
            <tr>
              <td class="text-muted-foreground px-2 py-4" colspan="5">
                No standings yet.
              </td>
            </tr>
          {:else}
            {#each data.standings as row, index (row.id)}
              <tr class="border-stroke/50 border-b last:border-b-0">
                <td class="px-2 py-2 font-semibold tabular-nums">
                  {index + 1}
                </td>
                <td class="px-2 py-2">
                  <div class="font-semibold">{row.name}</div>
                  <div class="text-muted-foreground text-[0.65rem]">
                    {row.games} games
                  </div>
                </td>
                <td class="px-2 py-2 text-right tabular-nums">
                  {row.wins}-{row.losses}
                </td>
                <td class="px-2 py-2 text-right tabular-nums">
                  {row.pointsFor} / {row.pointsAgainst}
                </td>
                <td class="px-2 py-2 text-right font-semibold tabular-nums">
                  {row.pointDiff > 0 ? "+" : ""}{row.pointDiff}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</section>
