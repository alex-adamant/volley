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
      $t("Range"),
  );
  const statusOptions = $derived([
    { value: "active", label: $t("Active") },
    { value: "all", label: $t("All") },
  ]);
  const statusLabel = $derived(
    statusOptions.find((option) => option.value === statusValue)?.label ??
      $t("Status"),
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

  const formatDiffPerGame = (pointDiff: number, games: number) => {
    if (!games) return "—";
    const rounded = Math.round((pointDiff / games) * 10) / 10;
    const safe = Object.is(rounded, -0) ? 0 : rounded;
    const prefix = safe > 0 ? "+" : "";
    return `${prefix}${safe.toFixed(1)}`;
  };

  type MatchTooltip = {
    x: number;
    y: number;
    detail: {
      result: string;
      score: string;
      teammates: string[];
      opponents: string[];
    };
  };

  let matchTooltip = $state<MatchTooltip | null>(null);

  const showMatchTooltip = (
    event: MouseEvent | FocusEvent,
    detail: MatchTooltip["detail"],
  ) => {
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const offset = 12;
    const tooltipWidth = 192;
    const tooltipHeight = 72;
    const preferredX = rect.left - tooltipWidth - offset;
    const fallbackX = rect.right + offset;
    let x = preferredX;
    let y = rect.top + rect.height / 2 - tooltipHeight / 2;

    if (browser) {
      const maxX = window.innerWidth - tooltipWidth - offset;
      const maxY = window.innerHeight - tooltipHeight - offset;
      x = preferredX < offset ? Math.min(fallbackX, maxX) : preferredX;
      x = Math.min(Math.max(offset, x), maxX);
      y = Math.min(Math.max(offset, y), maxY);
    }

    matchTooltip = {
      x,
      y,
      detail,
    };
  };

  const hideMatchTooltip = () => {
    matchTooltip = null;
  };

  const navItems = $derived.by(() => {
    const query = buildQuery(rangeValue, statusValue);
    const playersPath = `/chat/${slug}`;
    return [
      {
        label: $t("Players"),
        href: toPathname(`${playersPath}${query}`),
        active: page.url.pathname === playersPath,
      },
      {
        label: $t("Teams"),
        href: toPathname(`/chat/${slug}/team-stats${query}`),
        active: page.url.pathname === `/chat/${slug}/team-stats`,
      },
      {
        label: $t("League Stats"),
        href: toPathname(`/chat/${slug}/league-stats${query}`),
        active: page.url.pathname === `/chat/${slug}/league-stats`,
      },
      {
        label: $t("Results"),
        href: toPathname(`/chat/${slug}/day-results${query}`),
        active: page.url.pathname === `/chat/${slug}/day-results`,
      },
      {
        label: $t("Admin"),
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
    <div class="text-ink text-sm font-semibold">{$t("Players")}</div>
    {#if data.activeRange?.note && rangeValue.startsWith("season")}
      <div
        class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
      >
        {data.activeRange.note}
      </div>
    {/if}
  </div>

  <div class="mt-3 overflow-x-auto overflow-y-visible">
    <table class="w-full min-w-[720px] text-xs">
      <thead class="bg-white/70 text-left">
        <tr
          class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
        >
          <th class="p-2">#</th>
          <th class="p-2">{$t("Player")}</th>
          <th class="p-2 text-right">{$t("Rating")}</th>
          <th class="p-2 text-right">{$t("Win%")}</th>
          <th class="p-2 text-right">{$t("Games")}</th>
          <th class="p-2 text-right">{$t("Points")}</th>
          <th class="p-2 text-right">{$t("Diff/G")}</th>
          <th class="p-2 text-right">{$t("Form")}</th>
        </tr>
      </thead>
      <tbody>
        {#if data.results.length === 0}
          <tr>
            <td class="text-muted-foreground px-2 py-4" colspan="8">
              {$t("No players found.")}
            </td>
          </tr>
        {:else}
          {#each data.results as player, index (player.id)}
            <tr
              class={twMerge(
                "border-stroke/50 border-b transition last:border-b-0 hover:bg-white/70",
                !player.isActive && "opacity-60",
              )}
            >
              <td class="p-2 font-semibold tabular-nums">
                {index + 1}
              </td>
              <td class="p-2">
                <a
                  class="font-semibold"
                  href={resolve(
                    toPathname(
                      `/chat/${slug}/user/${player.id}${buildQuery(
                        rangeValue,
                        statusValue,
                      )}`,
                    ),
                  )}
                >
                  {player.name}
                </a>
              </td>
              <td class="p-2 pr-8 text-right">
                <span
                  class="relative inline-flex items-start font-semibold tabular-nums"
                >
                  {player.rating}
                  {#if player.playedLastDay}
                    <span
                      class={twMerge(
                        "absolute top-0.5 left-full ml-1 text-xs leading-none font-semibold tabular-nums",
                        player.ratingChange > 0 && "text-green-600",
                        player.ratingChange < 0 && "text-red-500",
                      )}
                    >
                      {player.ratingChange > 0 ? "+" : ""}{player.ratingChange}
                    </span>
                  {/if}
                </span>
              </td>
              <td class="p-2 text-right tabular-nums">
                {player.winrate}%
              </td>
              <td class="p-2 text-right tabular-nums">
                {player.games}
              </td>
              <td class="p-2 text-right tabular-nums">
                {player.pointsFor} / {player.pointsAgainst}
              </td>
              <td class="p-2 text-right font-semibold tabular-nums">
                {formatDiffPerGame(player.pointDiff, player.games)}
              </td>
              <td class="overflow-visible p-2 text-right">
                <div class="flex justify-end gap-1">
                  {#each player.recentForm as mark, markIndex (markIndex)}
                    {@const matchDetail = player.recentMatches?.[markIndex]}
                    <button
                      type="button"
                      class={twMerge(
                        "block h-2 w-2 rounded-full p-0",
                        mark === "W" ? "bg-green-500" : "bg-red-500",
                      )}
                      aria-label={$t("Match details")}
                      onmouseenter={(event) =>
                        matchDetail && showMatchTooltip(event, matchDetail)}
                      onmouseleave={hideMatchTooltip}
                      onfocus={(event) =>
                        matchDetail && showMatchTooltip(event, matchDetail)}
                      onblur={hideMatchTooltip}
                    ></button>
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

{#if matchTooltip}
  <div
    class="border-stroke text-ink pointer-events-none fixed z-[2147483647] w-48 rounded-xl border bg-white p-1.5 text-xs leading-tight shadow-xl"
    style={`left: ${matchTooltip.x}px; top: ${matchTooltip.y}px;`}
    role="tooltip"
  >
    <div class="text-xs font-semibold tracking-[0.2em] uppercase">
      {matchTooltip.detail.result === "W" ? $t("Win") : $t("Loss")} ·
      {matchTooltip.detail.score}
    </div>
    <div class="mt-0.5 font-semibold">
      {$t("With")}
      {matchTooltip.detail.teammates.join(" + ")}
    </div>
    <div class="text-ink/70">
      {$t("vs")}
      {matchTooltip.detail.opponents.join(" + ")}
    </div>
  </div>
{/if}
