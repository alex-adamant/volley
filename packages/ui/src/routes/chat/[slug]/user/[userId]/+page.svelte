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
  import * as Select from "$lib/components/ui/select";

  let { data } = $props();

  const result = $derived(data.result);
  const user = $derived(data.user);
  const matchSummaries = $derived(data.matchSummaries);
  const bestPartners = $derived(data.bestPartners);
  const toughOpponents = $derived(data.toughOpponents);

  let chartCanvas: HTMLCanvasElement | null = null;
  let chart: Chart | null = null;
  let rangeValue = $state("all");

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
      "Range",
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

  const buildQuery = (rangeKey: string) => {
    const params = new SvelteURLSearchParams(page.url.searchParams);
    if (rangeKey) {
      params.set("range", rangeKey);
    } else {
      params.delete("range");
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
    goto(resolve(toPathname(`${page.url.pathname}${buildQuery(nextRange)}`)), {
      keepFocus: true,
      noScroll: true,
    });
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
      const params = new SvelteURLSearchParams(page.url.searchParams);
      const storedRange = localStorage.getItem(rangeStorageKey);
      if (!params.get("range") && storedRange) {
        params.set("range", storedRange);
        rangeValue = storedRange;
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
      <div class="text-muted-foreground text-[0.65rem]">
        Rating {result.rating} ({formatDelta(result.ratingChange)}) ·
        {result.winrate}% winrate
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
        class="border-stroke text-ink rounded-full border bg-white/70 px-3 py-1 text-[0.6rem] font-semibold tracking-[0.2em] uppercase shadow-sm transition hover:bg-white"
        href={resolve(toPathname(`/chat/${slug}${buildQuery(rangeValue)}`))}
      >
        Back
      </a>
    </div>
  </div>
  {#if data.activeRange?.note && rangeValue.startsWith("season")}
    <div
      class="text-muted-foreground mt-2 text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
    >
      {data.activeRange.note}
    </div>
  {/if}
</section>

<section
  class="border-stroke shadow-card mt-3 rounded-2xl border bg-white/90 p-3"
>
  <div class="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Rating
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {result.rating}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">
        Delta {formatDelta(result.ratingChange)}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Games
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {result.games}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">
        {result.wins}-{result.losses}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Winrate
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {result.winrate}%
      </div>
      <div class="text-muted-foreground text-[0.65rem]">Season win %</div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Points
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {result.pointsFor} / {result.pointsAgainst}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">For / against</div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Diff
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {result.pointDiff}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">Point margin</div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        High / Low
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {result.ratingHigh} / {result.ratingLow}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">Rating range</div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Placement
      </div>
      <div class="mt-2 text-lg font-semibold tabular-nums">
        {result.placeHighest || "-"} / {result.placeLowest || "-"}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">Best / worst</div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Streak
      </div>
      <div class="mt-2 text-lg font-semibold">
        {result.currentStreak?.type ?? "-"}{result.currentStreak?.count ?? 0}
      </div>
      <div class="text-muted-foreground text-[0.65rem]">
        Longest W {result.longestWinStreak}, L {result.longestLossStreak}
      </div>
    </div>
    <div class="border-stroke rounded-xl border bg-white/70 p-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.25em] uppercase"
      >
        Form
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
      <div class="text-muted-foreground mt-2 text-[0.65rem]">
        Last {result.recentForm.length} games
      </div>
    </div>
  </div>
</section>

<section
  class="border-stroke shadow-card mt-3 rounded-2xl border bg-white/90 p-3"
>
  <div class="text-ink text-sm font-semibold">Rating trend</div>
  <div class="mt-3 h-56">
    <canvas bind:this={chartCanvas} class="h-full w-full"></canvas>
  </div>
</section>

<section class="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr]">
  <div class="border-stroke shadow-card rounded-2xl border bg-white/90 p-3">
    <div class="text-ink text-sm font-semibold">Recent matches</div>
    <div class="mt-2 flex flex-col gap-2">
      {#if matchSummaries.length === 0}
        <div class="text-muted-foreground text-xs">
          No matches in this range yet.
        </div>
      {:else}
        {#each matchSummaries as match (match.id)}
          <div
            class="border-stroke flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white/70 p-2"
          >
            <div>
              <div class="text-ink text-xs font-semibold">
                {match.result === "W" ? "Win" : "Loss"}
                {match.score}
              </div>
              <div class="text-muted-foreground text-[0.65rem]">
                With {match.teammate} vs {match.opponents.join(" / ")}
              </div>
            </div>
            <div class="flex items-center gap-3 text-[0.65rem]">
              <span
                class="border-stroke rounded-full border bg-white/70 px-2 py-0.5 font-semibold tracking-[0.2em] uppercase"
              >
                {new Date(match.day).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span
                class={twMerge(
                  "text-[0.65rem] font-semibold tabular-nums",
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
      <div class="text-ink text-sm font-semibold">Best partners</div>
      <div class="mt-2 flex flex-col gap-2">
        {#if bestPartners.length === 0}
          <div class="text-muted-foreground text-xs">
            Not enough matches yet.
          </div>
        {:else}
          {#each bestPartners as partner (partner.id)}
            <div class="border-stroke rounded-xl border bg-white/70 p-2">
              <div class="text-ink text-xs font-semibold">{partner.name}</div>
              <div class="text-muted-foreground text-[0.65rem]">
                {partner.wins}-{partner.losses} · {partner.winrate}% over {partner.games}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <div class="border-stroke shadow-card rounded-2xl border bg-white/90 p-3">
      <div class="text-ink text-sm font-semibold">Tough opponents</div>
      <div class="mt-2 flex flex-col gap-2">
        {#if toughOpponents.length === 0}
          <div class="text-muted-foreground text-xs">
            Not enough matches yet.
          </div>
        {:else}
          {#each toughOpponents as opponent (opponent.id)}
            <div class="border-stroke rounded-xl border bg-white/70 p-2">
              <div class="text-ink text-xs font-semibold">{opponent.name}</div>
              <div class="text-muted-foreground text-[0.65rem]">
                {opponent.wins}-{opponent.losses} · {opponent.winrate}% over {opponent.games}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</section>
