<script lang="ts">
  import { Chart, registerables } from "chart.js";
  import { onDestroy, onMount } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import type { Pathname } from "$app/types";
  import { browser } from "$app/environment";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import { twMerge } from "tailwind-merge";
  import { localeTag, t } from "$lib/i18n";
  import * as Select from "$lib/components/ui/select";

  let { data, form } = $props();

  const result = $derived(data.result);
  const user = $derived(data.user);
  const matchSummaries = $derived(data.matchSummaries);
  const bestPartners = $derived(data.bestPartners);
  const worstPartners = $derived(data.worstPartners);
  const toughOpponents = $derived(data.toughOpponents);
  const easyOpponents = $derived(data.easyOpponents);

  let chartCanvas: HTMLCanvasElement | null = null;
  let chart: Chart | null = null;
  let rangeValue = $state("all");
  type SeasonBoostValue = "boosted" | "base";
  const seasonBoostValue = $derived(
    data.seasonBoostMode === "base"
      ? ("base" as SeasonBoostValue)
      : ("boosted" as SeasonBoostValue),
  );

  const slug = $derived(page.params.slug ?? "");
  const rangeStorageKey = $derived(`volley-range:${slug}`);

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

  let lastRangeKey = $state("all");

  $effect(() => {
    const next = data.activeRange?.key ?? "all";
    if (next !== lastRangeKey) {
      lastRangeKey = next;
      rangeValue = next;
    }
  });

  const formatDelta = (value: number) => (value > 0 ? `+${value}` : `${value}`);

  const buildGradient = (ctx: CanvasRenderingContext2D) => {
    const height = chartCanvas?.height ?? 0;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(232, 108, 58, 0.35)");
    gradient.addColorStop(1, "rgba(232, 108, 58, 0)");
    return gradient;
  };

  const buildQuery = (
    rangeKey: string,
    seasonBoostKey: SeasonBoostValue = seasonBoostValue,
  ) => {
    const params = new SvelteURLSearchParams();
    if (rangeKey) params.set("range", rangeKey);
    if (data.isAdmin && seasonBoostKey === "base") {
      params.set("seasonBoost", "base");
    }
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  const toPathname = (value: string) => value as Pathname;

  const applyRange = (nextRange: string) => {
    rangeValue = nextRange;
    if (browser) {
      localStorage.setItem(rangeStorageKey, nextRange);
    }
    goto(
      resolve(
        toPathname(
          `${page.url.pathname}${buildQuery(nextRange, seasonBoostValue)}`,
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

  const buildChart = () => {
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext("2d");
    if (!ctx) return;

    const gradient = buildGradient(ctx);

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: result.ratingHistory.map((_, i) => i + 1),
        datasets: [
          {
            label: user.name,
            data: result.ratingHistory,
            borderColor: "#e86c3a",
            backgroundColor: gradient,
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 4,
            fill: true,
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(27, 37, 40, 0.9)",
            titleColor: "#fff",
            bodyColor: "#fff",
            padding: 10,
            displayColors: false,
          },
        },
        scales: {
          x: {
            display: false,
          },
          y: {
            grid: { color: "rgba(27, 37, 40, 0.08)" },
            ticks: {
              color: "#5f6b68",
              font: { size: 10 },
            },
          },
        },
      },
    });
  };

  onMount(() => {
    if (browser) {
      const params = new SvelteURLSearchParams();
      const currentRange = page.url.searchParams.get("range");
      const currentSeasonBoost = page.url.searchParams.get("seasonBoost");
      const storedRange = localStorage.getItem(rangeStorageKey);
      if (currentRange) {
        params.set("range", currentRange);
      } else if (storedRange) {
        params.set("range", storedRange);
        rangeValue = storedRange;
        if (data.isAdmin && currentSeasonBoost === "base") {
          params.set("seasonBoost", "base");
        }
        goto(resolve(toPathname(`${page.url.pathname}?${params.toString()}`)), {
          replaceState: true,
          keepFocus: true,
          noScroll: true,
        });
      }
    }

    Chart.register(...registerables);
    buildChart();
  });

  $effect(() => {
    if (!chart || !chartCanvas) return;
    const ctx = chartCanvas.getContext("2d");
    if (!ctx) return;
    chart.data.labels = result.ratingHistory.map((_, i) => i + 1);
    chart.data.datasets[0] = {
      ...chart.data.datasets[0],
      data: result.ratingHistory,
      backgroundColor: buildGradient(ctx),
    };
    chart.update();
  });

  onDestroy(() => {
    chart?.destroy();
    chart = null;
  });
</script>

<section class="border-stroke shadow-card rounded-2xl border bg-white/90 p-3">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <div>
      <div class="text-ink text-sm font-semibold">{user.name}</div>
      <div class="text-muted-foreground text-xs">
        {$t("Rating")}
        {result.rating} ({formatDelta(result.ratingChange)}) ·
        {result.winrate}% {$t("Win%")}
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2">
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
      <a
        class="border-stroke text-ink rounded-full border bg-white/70 px-3 py-1 text-xs font-semibold tracking-[0.2em] uppercase shadow-sm transition hover:bg-white"
        href={resolve(toPathname(`/chat/${slug}${buildQuery(rangeValue)}`))}
      >
        {$t("Back")}
      </a>
    </div>
  </div>
  {#if data.activeRange?.note && rangeValue.startsWith("season")}
    <div
      class="text-muted-foreground mt-2 text-xs font-semibold tracking-[0.2em] uppercase"
    >
      {data.activeRange.note}
    </div>
  {/if}
</section>

{#if data.isAdmin}
  <section
    class="border-stroke shadow-card mt-3 rounded-2xl border bg-white/90 p-3"
  >
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div class="text-ink text-sm font-semibold">{$t("Admin edit")}</div>
      <div
        class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
      >
        {$t("Name + flags")}
      </div>
    </div>
    <p class="text-muted-foreground mt-1 text-xs">
      {$t("Editing this player: name, `active`, `hidden`, `admin`.")}
    </p>

    <form method="POST" action="?/updatePlayer" class="mt-3 grid gap-3">
      <input type="hidden" name="userId" value={data.adminProfile.userId} />

      <label class="grid gap-2">
        <span class="text-muted-foreground text-xs font-semibold">
          {$t("Name")}
        </span>
        <input
          type="text"
          name="name"
          class="border-stroke h-8 rounded-full border bg-white/70 px-3 text-xs"
          value={data.adminProfile.name}
          required
        />
      </label>

      <div class="flex flex-wrap items-center gap-3 text-xs">
        <label class="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            name="isActive"
            class="accent-ink"
            checked={data.adminProfile.isActive}
          />
          {$t("Active")}
        </label>
        <label class="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            name="isHidden"
            class="accent-ink"
            checked={data.adminProfile.isHidden}
          />
          {$t("Hidden")}
        </label>
        <label class="inline-flex items-center gap-1.5">
          <input
            type="checkbox"
            name="isAdmin"
            class="accent-ink"
            checked={data.adminProfile.isAdmin}
          />
          {$t("Admin")}
        </label>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="border-stroke h-8 rounded-full border bg-white/80 px-4 text-xs font-semibold"
        >
          {$t("Save player")}
        </button>
        {#if form?.message}
          <span class="text-xs text-red-600">{$t(form.message)}</span>
        {/if}
      </div>
    </form>
  </section>
{/if}

<section
  class="border-stroke shadow-card mt-3 rounded-2xl border bg-white/90 p-3"
>
  <div class="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase"
      >
        {$t("Rating")}
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {result.rating}
      </div>
      <div class="text-muted-foreground text-xs">
        {$t("Delta")}
        {formatDelta(result.ratingChange)}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase"
      >
        {$t("Games")}
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {result.games}
      </div>
      <div class="text-muted-foreground text-xs">
        {result.wins}-{result.losses}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase"
      >
        {$t("Winrate")}
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {result.winrate}%
      </div>
      <div class="text-muted-foreground text-xs">
        {$t("Season win %")}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase"
      >
        {$t("Points")}
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {result.pointsFor} / {result.pointsAgainst}
      </div>
      <div class="text-muted-foreground text-xs">
        {$t("For / against")}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase"
      >
        {$t("Diff")}
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {result.pointDiff}
      </div>
      <div class="text-muted-foreground text-xs">
        {$t("Point margin")}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase"
      >
        {$t("High / Low")}
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {result.ratingHigh} / {result.ratingLow}
      </div>
      <div class="text-muted-foreground text-xs">
        {$t("Rating range")}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase"
      >
        {$t("Placement")}
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {result.placeHighest || "-"} / {result.placeLowest || "-"}
      </div>
      <div class="text-muted-foreground text-xs">
        {$t("Best / worst")}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase"
      >
        {$t("Streak")}
      </div>
      <div class="mt-2 text-lg font-semibold">
        {result.currentStreak?.type ?? "-"}{result.currentStreak?.count ?? 0}
      </div>
      <div class="text-muted-foreground text-xs">
        {$t("Longest W {wins}, L {losses}", {
          wins: result.longestWinStreak,
          losses: result.longestLossStreak,
        })}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase"
      >
        {$t("Form")}
      </div>
      <div class="mt-3 flex gap-1">
        {#each result.recentForm as mark, markIndex (markIndex)}
          <span
            class={twMerge(
              "h-2 w-2 rounded-full",
              mark === "W" ? "bg-green-500" : "bg-red-500",
            )}
          ></span>
        {/each}
      </div>
      <div class="text-muted-foreground mt-2 text-xs">
        {$t("Last {count} games", { count: result.recentForm.length })}
      </div>
    </div>
  </div>
</section>

<section
  class="border-stroke shadow-card mt-3 rounded-2xl border bg-white/90 p-3"
>
  <div class="text-ink text-sm font-semibold">{$t("Rating trend")}</div>
  <div class="mt-3 h-56">
    <canvas bind:this={chartCanvas} class="h-full w-full"></canvas>
  </div>
</section>

<section class="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr]">
  <div class="border-stroke shadow-card rounded-2xl border bg-white/90 p-3">
    <div class="text-ink text-sm font-semibold">{$t("Recent matches")}</div>
    <div class="mt-2 flex flex-col gap-2">
      {#if matchSummaries.length === 0}
        <div class="text-muted-foreground text-xs">
          {$t("No matches in this range yet.")}
        </div>
      {:else}
        {#each matchSummaries as match (match.id)}
          <div
            class="border-stroke flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white/70 p-2"
          >
            <div>
              <div class="text-ink text-xs font-semibold">
                {match.result === "W" ? $t("Win") : $t("Loss")}
                {match.score}
              </div>
              <div class="text-muted-foreground text-xs">
                {$t("With")}
                {match.teammate}
                {$t("vs")}
                {match.opponents.join(" / ")}
              </div>
            </div>
            <div class="flex items-center gap-3 text-xs">
              <span
                class="border-stroke rounded-full border bg-white/70 px-2 py-0.5 font-semibold tracking-[0.2em] uppercase"
              >
                {new Date(match.day).toLocaleDateString($localeTag, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span
                class={twMerge(
                  "text-xs font-semibold tabular-nums",
                  match.ratingDelta > 0 && "text-green-600",
                  match.ratingDelta < 0 && "text-red-500",
                )}
              >
                {formatDelta(match.ratingDelta)}
              </span>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <div class="flex flex-col gap-3">
    <div class="border-stroke shadow-card rounded-2xl border bg-white/90 p-3">
      <div class="text-ink text-sm font-semibold">{$t("Best partners")}</div>
      <div class="mt-2 flex flex-col gap-2">
        {#if bestPartners.length === 0}
          <div class="text-muted-foreground text-xs">
            {$t("Not enough matches yet.")}
          </div>
        {:else}
          {#each bestPartners as partner (partner.id)}
            <div class="border-stroke rounded-xl border bg-white/70 p-2">
              <div class="text-ink text-xs font-semibold">{partner.name}</div>
              <div class="text-muted-foreground text-xs">
                {partner.wins}-{partner.losses} · {partner.winrate}% {$t(
                  "over {games}",
                  {
                    games: partner.games,
                  },
                )}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <div class="border-stroke shadow-card rounded-2xl border bg-white/90 p-3">
      <div class="text-ink text-sm font-semibold">{$t("Worst partners")}</div>
      <div class="mt-2 flex flex-col gap-2">
        {#if worstPartners.length === 0}
          <div class="text-muted-foreground text-xs">
            {$t("Not enough matches yet.")}
          </div>
        {:else}
          {#each worstPartners as partner (partner.id)}
            <div class="border-stroke rounded-xl border bg-white/70 p-2">
              <div class="text-ink text-xs font-semibold">{partner.name}</div>
              <div class="text-muted-foreground text-xs">
                {partner.wins}-{partner.losses} · {partner.winrate}% {$t(
                  "over {games}",
                  {
                    games: partner.games,
                  },
                )}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <div class="border-stroke shadow-card rounded-2xl border bg-white/90 p-3">
      <div class="text-ink text-sm font-semibold">{$t("Tough opponents")}</div>
      <div class="mt-2 flex flex-col gap-2">
        {#if toughOpponents.length === 0}
          <div class="text-muted-foreground text-xs">
            {$t("Not enough matches yet.")}
          </div>
        {:else}
          {#each toughOpponents as opponent (opponent.id)}
            <div class="border-stroke rounded-xl border bg-white/70 p-2">
              <div class="text-ink text-xs font-semibold">{opponent.name}</div>
              <div class="text-muted-foreground text-xs">
                {opponent.wins}-{opponent.losses} · {opponent.winrate}% {$t(
                  "over {games}",
                  {
                    games: opponent.games,
                  },
                )}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <div class="border-stroke shadow-card rounded-2xl border bg-white/90 p-3">
      <div class="text-ink text-sm font-semibold">{$t("Easy opponents")}</div>
      <div class="mt-2 flex flex-col gap-2">
        {#if easyOpponents.length === 0}
          <div class="text-muted-foreground text-xs">
            {$t("Not enough matches yet.")}
          </div>
        {:else}
          {#each easyOpponents as opponent (opponent.id)}
            <div class="border-stroke rounded-xl border bg-white/70 p-2">
              <div class="text-ink text-xs font-semibold">{opponent.name}</div>
              <div class="text-muted-foreground text-xs">
                {opponent.wins}-{opponent.losses} · {opponent.winrate}% {$t(
                  "over {games}",
                  {
                    games: opponent.games,
                  },
                )}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</section>
