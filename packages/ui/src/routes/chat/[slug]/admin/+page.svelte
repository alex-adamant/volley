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

  let { data, form } = $props();

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
  const playerOptions = $derived(
    data.chatUsers.map((item) => ({
      value: String(item.User.id),
      label: item.User.name,
    })),
  );
  const playerLabelMap = $derived.by(
    () => new Map(playerOptions.map((option) => [option.value, option.label])),
  );
  const playerLabel = (value: string) =>
    playerLabelMap.get(value) ?? "Select player";

  let lastRangeKey = $state("all");

  $effect(() => {
    const next = data.activeRange?.key ?? "all";
    if (next !== lastRangeKey) {
      lastRangeKey = next;
      rangeValue = next;
    }
  });

  const toPathname = (value: string) => value as Pathname;

  const formatDateInput = (value: Date) =>
    new Date(value).toLocaleDateString("en-CA");

  const buildQuery = (rangeKey: string) => {
    const params = new SvelteURLSearchParams();
    if (rangeKey) params.set("range", rangeKey);
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  const buildLimitQuery = (nextLimit: number) => {
    const params = new SvelteURLSearchParams();
    params.set("limit", String(nextLimit));
    if (rangeValue) params.set("range", rangeValue);
    return `?${params.toString()}`;
  };

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

  const navItems = $derived.by(() => {
    const query = buildQuery(rangeValue);
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
    const storedRange = localStorage.getItem(rangeStorageKey);
    if (currentRange) {
      params.set("range", currentRange);
    } else if (storedRange) {
      params.set("range", storedRange);
      rangeValue = storedRange;
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
    <div class="text-ink text-sm font-semibold">Admin access</div>
    {#if data.activeRange?.note && rangeValue.startsWith("season")}
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
      >
        {data.activeRange.note}
      </div>
    {/if}
  </div>
  <p class="text-muted-foreground mt-1 text-xs">
    Admin accounts are stored in the database and use cookie sessions. Create
    the first admin once, then sign in here.
  </p>

  {#if !data.adminEnabled}
    <div
      class="border-stroke/60 text-muted-foreground mt-3 rounded-xl border bg-white/70 px-3 py-2 text-[0.65rem]"
    >
      No admins yet. Create the initial admin account below.
    </div>
    <form
      method="POST"
      action="?/createAdmin"
      class="mt-3 flex flex-col gap-3 md:flex-row md:items-center"
    >
      <input
        type="text"
        name="username"
        placeholder="Admin username"
        class="border-stroke flex-1 rounded-full border bg-white/70 px-3 py-2 text-xs"
        autocomplete="username"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        class="border-stroke flex-1 rounded-full border bg-white/70 px-3 py-2 text-xs"
        autocomplete="new-password"
      />
      <button
        class="border-stroke rounded-full border bg-white/80 px-4 py-2 text-xs font-semibold"
      >
        Create admin
      </button>
    </form>
    {#if form?.intent === "createAdmin" && form?.message}
      <div class="mt-3 text-xs text-red-600">{form.message}</div>
    {/if}
  {:else if !data.isAdmin}
    <div
      class="border-stroke/60 text-muted-foreground mt-3 rounded-xl border bg-white/70 px-3 py-2 text-[0.65rem]"
    >
      Sign in with an existing admin account. If you need a new admin, ask an
      existing admin to add one.
    </div>
    <form
      method="POST"
      action="?/login"
      class="mt-3 flex flex-col gap-3 md:flex-row md:items-center"
    >
      <input
        type="text"
        name="username"
        placeholder="Username"
        class="border-stroke flex-1 rounded-full border bg-white/70 px-3 py-2 text-xs"
        autocomplete="username"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        class="border-stroke flex-1 rounded-full border bg-white/70 px-3 py-2 text-xs"
        autocomplete="current-password"
      />
      <button
        class="border-stroke rounded-full border bg-white/80 px-4 py-2 text-xs font-semibold"
      >
        Sign in
      </button>
    </form>
    {#if form?.intent === "login" && form?.message}
      <div class="mt-3 text-xs text-red-600">{form.message}</div>
    {/if}
  {:else}
    <div class="text-muted-foreground mt-3 text-[0.65rem]">
      You are signed in. Admin tools are unlocked below.
    </div>
    <form method="POST" action="?/logout" class="mt-3">
      <button
        class="border-stroke rounded-full border bg-white/80 px-4 py-2 text-xs font-semibold"
      >
        Sign out
      </button>
    </form>
  {/if}
</section>

{#if data.adminEnabled && data.isAdmin}
  <section
    class="border-stroke shadow-card mt-3 rounded-2xl border bg-white/90 p-3"
  >
    <div class="text-ink text-sm font-semibold">Admin users</div>
    <p class="text-muted-foreground mt-1 text-xs">
      These logins control admin UI access. Use the Players table below to set
      bot admin flags.
    </p>
    <form
      method="POST"
      action="?/createAdmin"
      class="mt-3 flex flex-col gap-3 md:flex-row md:items-center"
    >
      <input
        type="text"
        name="username"
        placeholder="New admin username"
        class="border-stroke flex-1 rounded-full border bg-white/70 px-3 py-2 text-xs"
        autocomplete="off"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        class="border-stroke flex-1 rounded-full border bg-white/70 px-3 py-2 text-xs"
        autocomplete="new-password"
      />
      <button
        class="border-stroke rounded-full border bg-white/80 px-4 py-2 text-xs font-semibold"
      >
        Add admin
      </button>
    </form>
    {#if form?.intent === "createAdmin" && form?.message}
      <div class="mt-3 text-xs text-red-600">{form.message}</div>
    {/if}
    <div class="text-muted-foreground mt-3 grid gap-2 text-xs">
      {#each data.adminUsers as admin (admin.id)}
        <div
          class="border-stroke flex items-center justify-between rounded-xl border bg-white/70 px-3 py-2"
        >
          <span class="text-ink font-semibold">{admin.username}</span>
          <span>
            {new Date(admin.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      {/each}
    </div>
  </section>

  <section
    class="border-stroke shadow-card mt-3 rounded-2xl border bg-white/90 p-3"
  >
    <div class="text-ink text-sm font-semibold">Players</div>
    <p class="text-muted-foreground mt-1 text-xs">
      Toggle activation, visibility, and bot admin flags for each player.
    </p>

    <div class="mt-3 overflow-x-auto">
      <table class="w-full min-w-155 text-xs">
        <thead class="bg-white/70 text-left">
          <tr
            class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
          >
            <th class="px-2 py-2">Player</th>
            <th class="px-2 py-2 text-center">Active</th>
            <th class="px-2 py-2 text-center">Hidden</th>
            <th class="px-2 py-2 text-center">Admin</th>
            <th class="px-2 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {#each data.chatUsers as item (item.userId)}
            <tr class="border-stroke/50 border-b">
              <td class="px-2 py-2">
                <div class="text-xs font-semibold">{item.User.name}</div>
                <div class="text-muted-foreground text-[0.65rem]">
                  ID {item.userId}
                </div>
              </td>
              <td class="px-2 py-2 text-center">
                <input
                  type="checkbox"
                  name="isActive"
                  form={`player-${item.userId}`}
                  checked={item.isActive}
                  class="accent-ink"
                />
              </td>
              <td class="px-2 py-2 text-center">
                <input
                  type="checkbox"
                  name="isHidden"
                  form={`player-${item.userId}`}
                  checked={item.isHidden}
                  class="accent-ink"
                />
              </td>
              <td class="px-2 py-2 text-center">
                <input
                  type="checkbox"
                  name="isAdmin"
                  form={`player-${item.userId}`}
                  checked={item.isAdmin}
                  class="accent-ink"
                />
              </td>
              <td class="px-2 py-2 text-right">
                <form
                  id={`player-${item.userId}`}
                  method="POST"
                  action="?/updatePlayer"
                >
                  <input type="hidden" name="userId" value={item.userId} />
                  <button
                    class="border-stroke rounded-full border bg-white/70 px-3 py-1 text-[0.65rem] font-semibold"
                  >
                    Update
                  </button>
                </form>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section
    class="border-stroke shadow-card mt-3 rounded-2xl border bg-white/90 p-3"
  >
    <div class="text-ink text-sm font-semibold">Seasons</div>
    <p class="text-muted-foreground mt-1 text-xs">
      Create and manage seasons. Active season is used for season ratings.
    </p>

    <form
      method="POST"
      action="?/createSeason"
      class="mt-3 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]"
    >
      <input
        type="text"
        name="name"
        placeholder="Season name"
        class="border-stroke rounded-full border bg-white/70 px-3 py-2 text-xs"
        required
      />
      <input
        type="date"
        name="startDate"
        class="border-stroke rounded-full border bg-white/70 px-3 py-2 text-xs"
        required
      />
      <input
        type="date"
        name="endDate"
        class="border-stroke rounded-full border bg-white/70 px-3 py-2 text-xs"
      />
      <label
        class="text-muted-foreground flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.2em] uppercase"
      >
        <input type="checkbox" name="isActive" class="accent-ink" />
        Active
      </label>
      <button
        class="border-stroke rounded-full border bg-white/80 px-3 py-2 text-[0.65rem] font-semibold md:col-span-4"
      >
        Add season
      </button>
    </form>

    <div class="mt-3 flex flex-col gap-3">
      {#if data.seasons.length === 0}
        <div class="text-muted-foreground text-xs">No seasons yet.</div>
      {:else}
        {#each data.seasons as season (season.id)}
          <div class="border-stroke rounded-xl border bg-white/70 p-3">
            <form
              method="POST"
              action="?/updateSeason"
              class="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]"
            >
              <input type="hidden" name="seasonId" value={season.id} />
              <input
                type="text"
                name="name"
                class="border-stroke rounded-full border bg-white/70 px-3 py-2 text-xs"
                value={season.name}
                required
              />
              <input
                type="date"
                name="startDate"
                class="border-stroke rounded-full border bg-white/70 px-3 py-2 text-xs"
                value={formatDateInput(season.startDate)}
                required
              />
              <input
                type="date"
                name="endDate"
                class="border-stroke rounded-full border bg-white/70 px-3 py-2 text-xs"
                value={season.endDate ? formatDateInput(season.endDate) : ""}
              />
              <label
                class="text-muted-foreground flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.2em] uppercase"
              >
                <input
                  type="checkbox"
                  name="isActive"
                  checked={season.isActive}
                  class="accent-ink"
                />
                Active
              </label>
              <button
                class="border-stroke rounded-full border bg-white/80 px-3 py-2 text-[0.65rem] font-semibold md:col-span-4"
              >
                Update season
              </button>
            </form>
            <form method="POST" action="?/deleteSeason" class="mt-2">
              <input type="hidden" name="seasonId" value={season.id} />
              <button
                class="border-stroke rounded-full border bg-white/80 px-3 py-2 text-[0.65rem] font-semibold text-red-600"
                onclick={(event) => {
                  if (!confirm("Delete this season?")) {
                    event.preventDefault();
                  }
                }}
              >
                Delete
              </button>
            </form>
          </div>
        {/each}
      {/if}
    </div>
  </section>

  <section
    class="border-stroke shadow-card mt-3 rounded-2xl border bg-white/90 p-3"
  >
    <div class="text-ink text-sm font-semibold">Matches</div>
    <p class="text-muted-foreground mt-1 text-xs">
      Showing {data.matches.length} of {data.matchesTotal} matches.
    </p>
    {#if data.matchesTotal > data.matchLimit}
      <a
        class="border-stroke mt-3 inline-flex rounded-full border bg-white/80 px-3 py-1.5 text-[0.65rem] font-semibold"
        href={resolve(
          toPathname(
            `${page.url.pathname}${buildLimitQuery(
              Math.min(data.matchLimit + 50, data.matchesTotal),
            )}`,
          ),
        )}
      >
        Show more
      </a>
    {/if}

    <div class="mt-3 flex flex-col gap-3">
      {#if data.matches.length === 0}
        <div class="text-muted-foreground text-xs">
          No matches found for this range.
        </div>
      {:else}
        {#each data.matches as match (match.id)}
          <details class="border-stroke rounded-xl border bg-white/70 p-3">
            <summary class="text-ink cursor-pointer text-xs font-semibold">
              {match.playerA1Name} + {match.playerA2Name} vs
              {match.playerB1Name} + {match.playerB2Name} ({match.teamAScore}-{match.teamBScore})
            </summary>

            <form method="POST" action="?/updateMatch" class="mt-3 grid gap-3">
              <input type="hidden" name="matchId" value={match.id} />

              <div class="grid gap-3 md:grid-cols-2">
                <label class="text-xs">
                  <span
                    class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
                  >
                    Date
                  </span>
                  <input
                    type="date"
                    name="day"
                    class="border-stroke mt-2 w-full rounded-full border bg-white/70 px-3 py-2 text-xs"
                    value={formatDateInput(match.day)}
                  />
                </label>
                <label class="text-xs">
                  <span
                    class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
                  >
                    League
                  </span>
                  <input
                    type="number"
                    name="league"
                    class="border-stroke mt-2 w-full rounded-full border bg-white/70 px-3 py-2 text-xs"
                    value={match.league}
                  />
                </label>
              </div>

              <div class="grid gap-3 md:grid-cols-2">
                <div class="border-stroke rounded-xl border bg-white/70 p-3">
                  <div
                    class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
                  >
                    Team A
                  </div>
                  <div class="mt-3 grid gap-2">
                    <Select.Root
                      name="playerA1Id"
                      value={String(match.playerA1Id)}
                      type="single"
                    >
                      <Select.Trigger
                        class="border-stroke text-ink w-full rounded-full bg-white/80 px-3 py-2 text-xs font-semibold"
                      >
                        <span class="truncate">
                          {playerLabel(String(match.playerA1Id))}
                        </span>
                      </Select.Trigger>
                      <Select.Content class="border-stroke bg-white/95">
                        {#each playerOptions as option (option.value)}
                          <Select.Item
                            value={option.value}
                            label={option.label}
                          />
                        {/each}
                      </Select.Content>
                    </Select.Root>
                    <Select.Root
                      name="playerA2Id"
                      value={String(match.playerA2Id)}
                      type="single"
                    >
                      <Select.Trigger
                        class="border-stroke text-ink w-full rounded-full bg-white/80 px-3 py-2 text-xs font-semibold"
                      >
                        <span class="truncate">
                          {playerLabel(String(match.playerA2Id))}
                        </span>
                      </Select.Trigger>
                      <Select.Content class="border-stroke bg-white/95">
                        {#each playerOptions as option (option.value)}
                          <Select.Item
                            value={option.value}
                            label={option.label}
                          />
                        {/each}
                      </Select.Content>
                    </Select.Root>
                    <label class="text-xs">
                      <span
                        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
                      >
                        Score
                      </span>
                      <input
                        type="number"
                        name="teamAScore"
                        class="border-stroke mt-2 w-full rounded-full border bg-white/70 px-3 py-2 text-xs"
                        value={match.teamAScore}
                      />
                    </label>
                  </div>
                </div>

                <div class="border-stroke rounded-xl border bg-white/70 p-3">
                  <div
                    class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
                  >
                    Team B
                  </div>
                  <div class="mt-3 grid gap-2">
                    <Select.Root
                      name="playerB1Id"
                      value={String(match.playerB1Id)}
                      type="single"
                    >
                      <Select.Trigger
                        class="border-stroke text-ink w-full rounded-full bg-white/80 px-3 py-2 text-xs font-semibold"
                      >
                        <span class="truncate">
                          {playerLabel(String(match.playerB1Id))}
                        </span>
                      </Select.Trigger>
                      <Select.Content class="border-stroke bg-white/95">
                        {#each playerOptions as option (option.value)}
                          <Select.Item
                            value={option.value}
                            label={option.label}
                          />
                        {/each}
                      </Select.Content>
                    </Select.Root>
                    <Select.Root
                      name="playerB2Id"
                      value={String(match.playerB2Id)}
                      type="single"
                    >
                      <Select.Trigger
                        class="border-stroke text-ink w-full rounded-full bg-white/80 px-3 py-2 text-xs font-semibold"
                      >
                        <span class="truncate">
                          {playerLabel(String(match.playerB2Id))}
                        </span>
                      </Select.Trigger>
                      <Select.Content class="border-stroke bg-white/95">
                        {#each playerOptions as option (option.value)}
                          <Select.Item
                            value={option.value}
                            label={option.label}
                          />
                        {/each}
                      </Select.Content>
                    </Select.Root>
                    <label class="text-xs">
                      <span
                        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.2em] uppercase"
                      >
                        Score
                      </span>
                      <input
                        type="number"
                        name="teamBScore"
                        class="border-stroke mt-2 w-full rounded-full border bg-white/70 px-3 py-2 text-xs"
                        value={match.teamBScore}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <button
                  class="border-stroke rounded-full border bg-white/80 px-4 py-2 text-xs font-semibold"
                >
                  Save changes
                </button>
              </div>
            </form>

            <form method="POST" action="?/deleteMatch" class="mt-3">
              <input type="hidden" name="matchId" value={match.id} />
              <button
                class="border-stroke rounded-full border bg-white/80 px-4 py-2 text-xs font-semibold text-red-600"
                onclick={(event) => {
                  if (!confirm("Delete this match?")) {
                    event.preventDefault();
                  }
                }}
              >
                Delete match
              </button>
            </form>
          </details>
        {/each}
      {/if}
    </div>
  </section>
{/if}
