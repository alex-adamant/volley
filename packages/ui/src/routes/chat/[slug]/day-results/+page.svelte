<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import type { Pathname } from "$app/types";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import { twMerge } from "tailwind-merge";
  import { t } from "$lib/i18n";
  import PrimaryNav from "$lib/components/primary-nav.svelte";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import * as Select from "$lib/components/ui/select";

  let { data, form } = $props();

  const normalizeStatus = (value: string): "active" | "all" =>
    value === "all" ? "all" : "active";

  let rangeValue = $state("all");
  let dayValue = $state("");

  const slug = $derived(page.params.slug ?? "");
  const rangeStorageKey = $derived(`volley-range:${slug}`);
  const statusStorageKey = $derived(`volley-status:${slug}`);
  const navStatusValue = $derived(data.status === "all" ? "all" : "active");

  const rangeOptions = $derived(
    data.rangeOptions.map((range) => ({
      value: range.key,
      label: range.label,
    })),
  );
  const rangeLabel = $derived(
    rangeOptions.find((option) => option.value === rangeValue)?.label ??
      $t("Range"),
  );

  const dayOptions = $derived(
    data.days.map((day) => ({ value: day.key, label: day.label })),
  );
  const dayLabel = $derived(
    dayOptions.find((option) => option.value === dayValue)?.label ??
      $t("Select"),
  );
  const playerOptions = $derived(data.playerOptions ?? []);
  const canManageMatches = $derived(data.isAdmin && playerOptions.length >= 4);
  let createPlayerA1 = $state("");
  let createPlayerA2 = $state("");
  let createPlayerB1 = $state("");
  let createPlayerB2 = $state("");

  let lastRangeKey = $state("all");
  let lastDayKey = $state("");

  $effect(() => {
    const next = data.activeRange?.key ?? "all";
    if (next !== lastRangeKey) {
      lastRangeKey = next;
      rangeValue = next;
    }
  });

  $effect(() => {
    const next = data.selectedDay?.key ?? "";
    if (next !== lastDayKey) {
      lastDayKey = next;
      dayValue = next;
    }
  });

  $effect(() => {
    if (playerOptions.length < 4) return;
    if (createPlayerA1 && createPlayerA2 && createPlayerB1 && createPlayerB2) {
      return;
    }

    createPlayerA1 = String(playerOptions[0].id);
    createPlayerA2 = String(playerOptions[1].id);
    createPlayerB1 = String(playerOptions[2].id);
    createPlayerB2 = String(playerOptions[3].id);
  });

  const toPathname = (value: string) => value as Pathname;
  const formatDateInput = (value: Date) =>
    new Date(value).toLocaleDateString("en-CA");
  const formatProbability = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatAvgRating = (value: number) => value.toFixed(1);

  const buildResultsQuery = (
    rangeKey: string,
    dayKey?: string,
    statusKey: "active" | "all" = navStatusValue,
  ) => {
    const params = new SvelteURLSearchParams();
    if (rangeKey) params.set("range", rangeKey);
    if (statusKey) params.set("status", statusKey);
    if (dayKey) params.set("day", dayKey);
    if (data.isAdmin && page.url.searchParams.get("seasonBoost") === "base") {
      params.set("seasonBoost", "base");
    }
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  const buildNavQuery = (rangeKey: string, statusKey: "active" | "all") => {
    const params = new SvelteURLSearchParams();
    if (rangeKey) params.set("range", rangeKey);
    if (statusKey) params.set("status", statusKey);
    if (data.isAdmin && page.url.searchParams.get("seasonBoost") === "base") {
      params.set("seasonBoost", "base");
    }
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
        toPathname(`${page.url.pathname}${buildResultsQuery(nextRange)}`),
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
          `${page.url.pathname}${buildResultsQuery(rangeValue, nextDay)}`,
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
    const baseQuery = buildNavQuery(rangeValue, navStatusValue);
    const resultsQuery = buildResultsQuery(
      rangeValue,
      dayValue || data.selectedDay?.key || "",
    );
    const playersPath = `/chat/${slug}`;
    return [
      {
        label: $t("Players"),
        href: toPathname(`${playersPath}${baseQuery}`),
        active: page.url.pathname === playersPath,
      },
      {
        label: $t("Teams"),
        href: toPathname(`/chat/${slug}/team-stats${baseQuery}`),
        active: page.url.pathname === `/chat/${slug}/team-stats`,
      },
      {
        label: $t("League Stats"),
        href: toPathname(`/chat/${slug}/league-stats${baseQuery}`),
        active: page.url.pathname === `/chat/${slug}/league-stats`,
      },
      {
        label: $t("Results"),
        href: toPathname(`/chat/${slug}/day-results${resultsQuery}`),
        active: page.url.pathname === `/chat/${slug}/day-results`,
      },
      {
        label: $t("Admin"),
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
    const currentSeasonBoost = page.url.searchParams.get("seasonBoost");
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
      params.set("status", normalizeStatus(currentStatus));
    } else if (storedStatus) {
      params.set("status", normalizeStatus(storedStatus));
      changed = true;
    }

    if (currentDay) {
      params.set("day", currentDay);
    }

    if (data.isAdmin && currentSeasonBoost === "base") {
      params.set("seasonBoost", "base");
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
  class="border-stroke shadow-card sticky top-3 z-200 rounded-2xl border bg-white/90 p-3 backdrop-blur"
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
    </div>
  </div>
</section>

<section
  class="border-stroke shadow-card mt-3 rounded-2xl border bg-white/90 p-3"
>
  <div class="flex flex-wrap items-end justify-between gap-2">
    <div class="text-ink text-sm font-semibold">{$t("Results")}</div>
    {#if data.activeRange?.note && rangeValue.startsWith("season")}
      <div
        class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
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
      aria-label={$t("Previous day")}
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
      aria-label={$t("Next day")}
    >
      <ChevronRight class="h-4 w-4" />
    </button>

    {#if data.isToday}
      <span
        class="border-stroke text-ink rounded-full border bg-white/70 px-2 py-0.5 text-xs font-semibold tracking-[0.2em] uppercase"
      >
        {$t("Today")}
      </span>
    {/if}
  </div>
</section>

{#if data.isAdmin}
  <section
    class="border-stroke shadow-card mt-3 rounded-2xl border bg-white/90 p-3"
  >
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div class="text-ink text-sm font-semibold">{$t("Add match")}</div>
      <div
        class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
      >
        {$t("Manual entry")}
      </div>
    </div>
    <p class="text-muted-foreground mt-1 text-xs">
      {$t(
        "You can add a match for any day. If the day does not exist yet, it will be created.",
      )}
    </p>

    {#if !canManageMatches}
      <div class="text-muted-foreground mt-3 text-xs">
        {$t("Need at least 4 players to create a match.")}
      </div>
    {:else}
      <form method="POST" action="?/createMatch" class="mt-3 grid gap-3">
        <div class="grid gap-3 md:grid-cols-[1fr_1fr]">
          <label class="text-xs">
            <span
              class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
            >
              {$t("Date")}
            </span>
            <input
              type="date"
              name="day"
              class="border-stroke mt-2 h-8 w-full rounded-full border bg-white/70 px-3 text-xs"
              value={dayValue ||
                data.selectedDay?.key ||
                new Date().toISOString().slice(0, 10)}
              required
            />
          </label>
          <label class="text-xs">
            <span
              class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
            >
              {$t("League")}
            </span>
            <input
              type="number"
              name="league"
              class="border-stroke mt-2 h-8 w-full rounded-full border bg-white/70 px-3 text-xs"
              value="1"
              required
            />
          </label>
        </div>

        <div class="grid gap-3 md:grid-cols-2">
          <div class="border-stroke rounded-xl border bg-white/70 p-3">
            <div
              class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
            >
              {$t("Team A")}
            </div>
            <div class="mt-3 grid gap-2">
              <Select.Root
                name="playerA1Id"
                value={createPlayerA1}
                onValueChange={(next) => (createPlayerA1 = next)}
                type="single"
              >
                <Select.Trigger
                  class="border-stroke text-ink h-8 w-full rounded-full bg-white/80 px-3 text-xs font-semibold"
                >
                  <span class="truncate">
                    {playerOptions.find(
                      (player) => String(player.id) === createPlayerA1,
                    )?.name ?? $t("Select")}
                  </span>
                </Select.Trigger>
                <Select.Content class="border-stroke bg-white">
                  {#each playerOptions as player (player.id)}
                    <Select.Item
                      value={String(player.id)}
                      label={player.name}
                    />
                  {/each}
                </Select.Content>
              </Select.Root>
              <Select.Root
                name="playerA2Id"
                value={createPlayerA2}
                onValueChange={(next) => (createPlayerA2 = next)}
                type="single"
              >
                <Select.Trigger
                  class="border-stroke text-ink h-8 w-full rounded-full bg-white/80 px-3 text-xs font-semibold"
                >
                  <span class="truncate">
                    {playerOptions.find(
                      (player) => String(player.id) === createPlayerA2,
                    )?.name ?? $t("Select")}
                  </span>
                </Select.Trigger>
                <Select.Content class="border-stroke bg-white">
                  {#each playerOptions as player (player.id)}
                    <Select.Item
                      value={String(player.id)}
                      label={player.name}
                    />
                  {/each}
                </Select.Content>
              </Select.Root>
              <label class="text-xs">
                <span
                  class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
                >
                  {$t("Score")}
                </span>
                <input
                  type="number"
                  name="teamAScore"
                  class="border-stroke mt-2 h-8 w-full rounded-full border bg-white/70 px-3 text-xs"
                  value="21"
                  min="0"
                  required
                />
              </label>
            </div>
          </div>

          <div class="border-stroke rounded-xl border bg-white/70 p-3">
            <div
              class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
            >
              {$t("Team B")}
            </div>
            <div class="mt-3 grid gap-2">
              <Select.Root
                name="playerB1Id"
                value={createPlayerB1}
                onValueChange={(next) => (createPlayerB1 = next)}
                type="single"
              >
                <Select.Trigger
                  class="border-stroke text-ink h-8 w-full rounded-full bg-white/80 px-3 text-xs font-semibold"
                >
                  <span class="truncate">
                    {playerOptions.find(
                      (player) => String(player.id) === createPlayerB1,
                    )?.name ?? $t("Select")}
                  </span>
                </Select.Trigger>
                <Select.Content class="border-stroke bg-white">
                  {#each playerOptions as player (player.id)}
                    <Select.Item
                      value={String(player.id)}
                      label={player.name}
                    />
                  {/each}
                </Select.Content>
              </Select.Root>
              <Select.Root
                name="playerB2Id"
                value={createPlayerB2}
                onValueChange={(next) => (createPlayerB2 = next)}
                type="single"
              >
                <Select.Trigger
                  class="border-stroke text-ink h-8 w-full rounded-full bg-white/80 px-3 text-xs font-semibold"
                >
                  <span class="truncate">
                    {playerOptions.find(
                      (player) => String(player.id) === createPlayerB2,
                    )?.name ?? $t("Select")}
                  </span>
                </Select.Trigger>
                <Select.Content class="border-stroke bg-white">
                  {#each playerOptions as player (player.id)}
                    <Select.Item
                      value={String(player.id)}
                      label={player.name}
                    />
                  {/each}
                </Select.Content>
              </Select.Root>
              <label class="text-xs">
                <span
                  class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
                >
                  {$t("Score")}
                </span>
                <input
                  type="number"
                  name="teamBScore"
                  class="border-stroke mt-2 h-8 w-full rounded-full border bg-white/70 px-3 text-xs"
                  value="19"
                  min="0"
                  required
                />
              </label>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="border-stroke h-8 rounded-full border bg-white/80 px-4 text-xs font-semibold"
          >
            {$t("Add match")}
          </button>
          {#if form?.message}
            <span class="text-xs text-red-600">{$t(form.message)}</span>
          {/if}
        </div>
      </form>
    {/if}
  </section>
{/if}

<section class="mt-3 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
  <div class="border-stroke shadow-card rounded-2xl border bg-white/90 p-3">
    <div class="text-ink text-sm font-semibold">{$t("Results")}</div>
    <div class="mt-3 flex flex-col gap-2">
      {#if data.matches.length === 0}
        <div class="text-muted-foreground text-xs">{$t("No matches yet.")}</div>
      {:else}
        {#each data.matches as match (match.id)}
          {@const teamAWon = match.teamAScore > match.teamBScore}
          {@const teamBWon = match.teamBScore > match.teamAScore}
          {@const upsetWinnerSide = match.underdogWon
            ? teamAWon
              ? "A"
              : "B"
            : null}
          {#if data.isAdmin}
            <details
              class="border-stroke/60 rounded-xl border bg-white/80 p-2 sm:p-3"
            >
              <summary class="cursor-pointer list-none">
                <span class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <span
                    class={twMerge(
                      "relative rounded-lg px-2 py-1 text-xs leading-tight sm:px-3 sm:py-2 sm:text-xs",
                      teamAWon
                        ? "text-ink bg-emerald-50/80 font-semibold ring-1 ring-emerald-200/80"
                        : "text-ink/60 font-medium",
                    )}
                  >
                    {#if upsetWinnerSide === "A"}
                      <span
                        class="absolute -top-2 left-2 z-10 rounded-full border border-amber-400/60 bg-amber-100 px-1.5 py-0.5 text-[9px] leading-none font-semibold tracking-[0.08em] text-amber-800 uppercase"
                      >
                        {$t("Upset")}
                      </span>
                    {/if}
                    <span class="flex items-center gap-1">
                      <span class="block min-w-0 flex-1 truncate">
                        {match.playerA1Name}
                      </span>
                      <span class="text-ink/45 text-[10px] tabular-nums">
                        {match.playerA1RatingBefore}
                      </span>
                    </span>
                    <span class="flex items-center gap-1">
                      <span class="block min-w-0 flex-1 truncate">
                        {match.playerA2Name}
                      </span>
                      <span class="text-ink/45 text-[10px] tabular-nums">
                        {match.playerA2RatingBefore}
                      </span>
                    </span>
                  </span>
                  <span class="text-center">
                    <span
                      class="text-ink block text-sm font-semibold tabular-nums"
                    >
                      {match.teamAScore} — {match.teamBScore}
                    </span>
                    <span class="text-muted-foreground block text-xs">
                      {$t("Tap to edit")}
                    </span>
                  </span>
                  <span
                    class={twMerge(
                      "relative rounded-lg px-2 py-1 text-right text-xs leading-tight sm:px-3 sm:py-2 sm:text-xs",
                      teamBWon
                        ? "text-ink bg-emerald-50/80 font-semibold ring-1 ring-emerald-200/80"
                        : "text-ink/60 font-medium",
                    )}
                  >
                    {#if upsetWinnerSide === "B"}
                      <span
                        class="absolute -top-2 right-2 z-10 rounded-full border border-amber-400/60 bg-amber-100 px-1.5 py-0.5 text-[9px] leading-none font-semibold tracking-[0.08em] text-amber-800 uppercase"
                      >
                        {$t("Upset")}
                      </span>
                    {/if}
                    <span class="flex items-center justify-end gap-1">
                      <span class="text-ink/45 text-[10px] tabular-nums">
                        {match.playerB1RatingBefore}
                      </span>
                      <span class="block min-w-0 flex-1 truncate text-right">
                        {match.playerB1Name}
                      </span>
                    </span>
                    <span class="flex items-center justify-end gap-1">
                      <span class="text-ink/45 text-[10px] tabular-nums">
                        {match.playerB2RatingBefore}
                      </span>
                      <span class="block min-w-0 flex-1 truncate text-right">
                        {match.playerB2Name}
                      </span>
                    </span>
                  </span>
                </span>
                <div
                  class="mt-2 rounded-lg border border-black/5 bg-white/60 p-2"
                >
                  <div
                    class="text-muted-foreground grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[11px]"
                  >
                    <span class="text-right font-semibold tabular-nums">
                      {formatProbability(match.teamAWinProbability)}
                      ({formatAvgRating(match.teamAAvgRatingBefore)})
                    </span>
                    <span class="tracking-[0.12em] uppercase">
                      {$t("ELO pre-match")}
                    </span>
                    <span class="font-semibold tabular-nums">
                      {formatProbability(match.teamBWinProbability)}
                      ({formatAvgRating(match.teamBAvgRatingBefore)})
                    </span>
                  </div>
                </div>
              </summary>

              <form
                method="POST"
                action="?/updateMatch"
                class="mt-3 grid gap-3"
              >
                <input type="hidden" name="matchId" value={match.id} />

                <div class="grid gap-3 md:grid-cols-[1fr_1fr]">
                  <label class="text-xs">
                    <span
                      class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
                    >
                      {$t("Date")}
                    </span>
                    <input
                      type="date"
                      name="day"
                      class="border-stroke mt-2 h-8 w-full rounded-full border bg-white/70 px-3 text-xs"
                      value={formatDateInput(match.day)}
                      required
                    />
                  </label>
                  <label class="text-xs">
                    <span
                      class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
                    >
                      {$t("League")}
                    </span>
                    <input
                      type="number"
                      name="league"
                      class="border-stroke mt-2 h-8 w-full rounded-full border bg-white/70 px-3 text-xs"
                      value={match.league}
                      required
                    />
                  </label>
                </div>

                <div class="grid gap-3 md:grid-cols-2">
                  <div class="border-stroke rounded-xl border bg-white/70 p-3">
                    <div
                      class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
                    >
                      {$t("Team A")}
                    </div>
                    <div class="mt-3 grid gap-2">
                      <div class="relative">
                        <select
                          name="playerA1Id"
                          class="border-stroke h-8 w-full appearance-none rounded-full border bg-white/80 pr-10 pl-3 text-xs font-semibold"
                        >
                          {#each playerOptions as player (player.id)}
                            <option
                              value={player.id}
                              selected={player.id === match.playerA1Id}
                            >
                              {player.name}
                            </option>
                          {/each}
                        </select>
                        <ChevronDown
                          class="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-70"
                        />
                      </div>
                      <div class="relative">
                        <select
                          name="playerA2Id"
                          class="border-stroke h-8 w-full appearance-none rounded-full border bg-white/80 pr-10 pl-3 text-xs font-semibold"
                        >
                          {#each playerOptions as player (player.id)}
                            <option
                              value={player.id}
                              selected={player.id === match.playerA2Id}
                            >
                              {player.name}
                            </option>
                          {/each}
                        </select>
                        <ChevronDown
                          class="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-70"
                        />
                      </div>
                      <label class="text-xs">
                        <span
                          class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
                        >
                          {$t("Score")}
                        </span>
                        <input
                          type="number"
                          name="teamAScore"
                          class="border-stroke mt-2 h-8 w-full rounded-full border bg-white/70 px-3 text-xs"
                          value={match.teamAScore}
                          min="0"
                          required
                        />
                      </label>
                    </div>
                  </div>

                  <div class="border-stroke rounded-xl border bg-white/70 p-3">
                    <div
                      class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
                    >
                      {$t("Team B")}
                    </div>
                    <div class="mt-3 grid gap-2">
                      <div class="relative">
                        <select
                          name="playerB1Id"
                          class="border-stroke h-8 w-full appearance-none rounded-full border bg-white/80 pr-10 pl-3 text-xs font-semibold"
                        >
                          {#each playerOptions as player (player.id)}
                            <option
                              value={player.id}
                              selected={player.id === match.playerB1Id}
                            >
                              {player.name}
                            </option>
                          {/each}
                        </select>
                        <ChevronDown
                          class="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-70"
                        />
                      </div>
                      <div class="relative">
                        <select
                          name="playerB2Id"
                          class="border-stroke h-8 w-full appearance-none rounded-full border bg-white/80 pr-10 pl-3 text-xs font-semibold"
                        >
                          {#each playerOptions as player (player.id)}
                            <option
                              value={player.id}
                              selected={player.id === match.playerB2Id}
                            >
                              {player.name}
                            </option>
                          {/each}
                        </select>
                        <ChevronDown
                          class="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-70"
                        />
                      </div>
                      <label class="text-xs">
                        <span
                          class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
                        >
                          {$t("Score")}
                        </span>
                        <input
                          type="number"
                          name="teamBScore"
                          class="border-stroke mt-2 h-8 w-full rounded-full border bg-white/70 px-3 text-xs"
                          value={match.teamBScore}
                          min="0"
                          required
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <button
                    class="border-stroke h-8 rounded-full border bg-white/80 px-4 text-xs font-semibold"
                  >
                    {$t("Save match")}
                  </button>
                </div>
              </form>

              <form method="POST" action="?/deleteMatch" class="mt-2">
                <input type="hidden" name="matchId" value={match.id} />
                <button
                  class="border-stroke h-8 rounded-full border bg-white/80 px-4 text-xs font-semibold text-red-600"
                  onclick={(event) => {
                    if (!confirm($t("Delete this match?"))) {
                      event.preventDefault();
                    }
                  }}
                >
                  {$t("Delete match")}
                </button>
              </form>
            </details>
          {:else}
            <div
              class="border-stroke/60 rounded-xl border bg-white/80 p-2 sm:p-3"
            >
              <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div
                  class={twMerge(
                    "relative rounded-lg px-2 py-1 text-xs leading-tight sm:px-3 sm:py-2 sm:text-xs",
                    teamAWon
                      ? "text-ink bg-emerald-50/80 font-semibold ring-1 ring-emerald-200/80"
                      : "text-ink/60 font-medium",
                  )}
                >
                  {#if upsetWinnerSide === "A"}
                    <span
                      class="absolute -top-2 left-2 z-10 rounded-full border border-amber-400/60 bg-amber-100 px-1.5 py-0.5 text-[9px] leading-none font-semibold tracking-[0.08em] text-amber-800 uppercase"
                    >
                      {$t("Upset")}
                    </span>
                  {/if}
                  <div class="flex items-center gap-1">
                    <span class="min-w-0 flex-1 truncate"
                      >{match.playerA1Name}</span
                    >
                    <span class="text-ink/45 text-[10px] tabular-nums">
                      {match.playerA1RatingBefore}
                    </span>
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="min-w-0 flex-1 truncate"
                      >{match.playerA2Name}</span
                    >
                    <span class="text-ink/45 text-[10px] tabular-nums">
                      {match.playerA2RatingBefore}
                    </span>
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-ink text-sm font-semibold tabular-nums">
                    {match.teamAScore} — {match.teamBScore}
                  </div>
                </div>
                <div
                  class={twMerge(
                    "relative rounded-lg px-2 py-1 text-right text-xs leading-tight sm:px-3 sm:py-2 sm:text-xs",
                    teamBWon
                      ? "text-ink bg-emerald-50/80 font-semibold ring-1 ring-emerald-200/80"
                      : "text-ink/60 font-medium",
                  )}
                >
                  {#if upsetWinnerSide === "B"}
                    <span
                      class="absolute -top-2 right-2 z-10 rounded-full border border-amber-400/60 bg-amber-100 px-1.5 py-0.5 text-[9px] leading-none font-semibold tracking-[0.08em] text-amber-800 uppercase"
                    >
                      {$t("Upset")}
                    </span>
                  {/if}
                  <div class="flex items-center justify-end gap-1">
                    <span class="text-ink/45 text-[10px] tabular-nums">
                      {match.playerB1RatingBefore}
                    </span>
                    <span class="min-w-0 flex-1 truncate text-right">
                      {match.playerB1Name}
                    </span>
                  </div>
                  <div class="flex items-center justify-end gap-1">
                    <span class="text-ink/45 text-[10px] tabular-nums">
                      {match.playerB2RatingBefore}
                    </span>
                    <span class="min-w-0 flex-1 truncate text-right">
                      {match.playerB2Name}
                    </span>
                  </div>
                </div>
              </div>
              <div
                class="mt-2 rounded-lg border border-black/5 bg-white/60 p-2"
              >
                <div
                  class="text-muted-foreground grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[11px]"
                >
                  <span class="text-right font-semibold tabular-nums">
                    {formatProbability(match.teamAWinProbability)}
                    ({formatAvgRating(match.teamAAvgRatingBefore)})
                  </span>
                  <span class="tracking-[0.12em] uppercase">
                    {$t("ELO pre-match")}
                  </span>
                  <span class="font-semibold tabular-nums">
                    {formatProbability(match.teamBWinProbability)}
                    ({formatAvgRating(match.teamBAvgRatingBefore)})
                  </span>
                </div>
              </div>
            </div>
          {/if}
        {/each}
      {/if}
    </div>
  </div>

  <div class="flex flex-col gap-3">
    <div class="border-stroke shadow-card rounded-2xl border bg-white/90 p-3">
      <div class="text-ink text-sm font-semibold">{$t("Standings")}</div>
      <div class="mt-3 overflow-x-auto">
        <table class="w-full min-w-90 text-xs">
          <thead class="bg-white/70 text-left">
            <tr
              class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
            >
              <th class="p-2">#</th>
              <th class="p-2">{$t("Player")}</th>
              <th class="p-2 text-right">{$t("W-L")}</th>
              <th class="p-2 text-right">{$t("Points")}</th>
              <th class="p-2 text-right">{$t("Diff")}</th>
            </tr>
          </thead>
          <tbody>
            {#if data.standings.length === 0}
              <tr>
                <td class="text-muted-foreground px-2 py-4" colspan="5">
                  {$t("No standings yet.")}
                </td>
              </tr>
            {:else}
              {#each data.standings as row, index (row.id)}
                <tr class="border-stroke/50 border-b last:border-b-0">
                  <td class="p-2 font-semibold tabular-nums">
                    {index + 1}
                  </td>
                  <td class="p-2">
                    <div class="font-semibold">{row.name}</div>
                    <div class="text-muted-foreground text-xs">
                      {row.games}
                      {$t("games")}
                    </div>
                  </td>
                  <td class="p-2 text-right tabular-nums">
                    {row.wins}-{row.losses}
                  </td>
                  <td class="p-2 text-right tabular-nums">
                    {row.pointsFor} / {row.pointsAgainst}
                  </td>
                  <td class="p-2 text-right font-semibold tabular-nums">
                    {row.pointDiff > 0 ? "+" : ""}{row.pointDiff}
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>
