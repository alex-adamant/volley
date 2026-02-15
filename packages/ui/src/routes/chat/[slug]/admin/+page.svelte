<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import type { Pathname } from "$app/types";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import { localeTag, t } from "$lib/i18n";
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

  const toPathname = (value: string) => value as Pathname;

  const formatDateInput = (value: Date) =>
    new Date(value).toLocaleDateString("en-CA");

  const buildQuery = (rangeKey: string) => {
    const params = new SvelteURLSearchParams();
    if (rangeKey) params.set("range", rangeKey);
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
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
    <div class="text-ink text-sm font-semibold">{$t("Admin access")}</div>
    {#if data.activeRange?.note && rangeValue.startsWith("season")}
      <div
        class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase"
      >
        {data.activeRange.note}
      </div>
    {/if}
  </div>
  <p class="text-muted-foreground mt-1 text-xs">
    {$t(
      "Admin accounts are stored in the database and use cookie sessions. Create the first admin once, then sign in here.",
    )}
  </p>

  {#if !data.adminEnabled}
    <div
      class="border-stroke/60 text-muted-foreground mt-3 rounded-xl border bg-white/70 px-3 py-2 text-xs"
    >
      {$t("No admins yet. Create the initial admin account below.")}
    </div>
    <form
      method="POST"
      action="?/createAdmin"
      class="mt-3 flex flex-col gap-3 md:flex-row md:items-center"
    >
      <input
        type="text"
        name="username"
        placeholder={$t("Admin username")}
        class="border-stroke flex-1 rounded-full border bg-white/70 px-3 py-2 text-xs"
        autocomplete="username"
      />
      <input
        type="password"
        name="password"
        placeholder={$t("Password")}
        class="border-stroke flex-1 rounded-full border bg-white/70 px-3 py-2 text-xs"
        autocomplete="new-password"
      />
      <button
        class="border-stroke rounded-full border bg-white/80 px-4 py-2 text-xs font-semibold"
      >
        {$t("Create admin")}
      </button>
    </form>
    {#if form?.intent === "createAdmin" && form?.message}
      <div class="mt-3 text-xs text-red-600">{$t(form.message)}</div>
    {/if}
  {:else if !data.isAdmin}
    <div
      class="border-stroke/60 text-muted-foreground mt-3 rounded-xl border bg-white/70 px-3 py-2 text-xs"
    >
      {$t(
        "Sign in with an existing admin account. If you need a new admin, ask an existing admin to add one.",
      )}
    </div>
    <form
      method="POST"
      action="?/login"
      class="mt-3 flex flex-col gap-3 md:flex-row md:items-center"
    >
      <input
        type="text"
        name="username"
        placeholder={$t("Username")}
        class="border-stroke flex-1 rounded-full border bg-white/70 px-3 py-2 text-xs"
        autocomplete="username"
      />
      <input
        type="password"
        name="password"
        placeholder={$t("Password")}
        class="border-stroke flex-1 rounded-full border bg-white/70 px-3 py-2 text-xs"
        autocomplete="current-password"
      />
      <button
        class="border-stroke rounded-full border bg-white/80 px-4 py-2 text-xs font-semibold"
      >
        {$t("Sign in")}
      </button>
    </form>
    {#if form?.intent === "login" && form?.message}
      <div class="mt-3 text-xs text-red-600">{$t(form.message)}</div>
    {/if}
  {:else}
    <div class="text-muted-foreground mt-3 text-xs">
      {$t("You are signed in. Admin tools are unlocked below.")}
    </div>
    <form method="POST" action="?/logout" class="mt-3">
      <button
        class="border-stroke rounded-full border bg-white/80 px-4 py-2 text-xs font-semibold"
      >
        {$t("Sign out")}
      </button>
    </form>
  {/if}
</section>

{#if data.adminEnabled && data.isAdmin}
  <section
    class="border-stroke shadow-card mt-3 rounded-2xl border bg-white/90 p-3"
  >
    <div class="text-ink text-sm font-semibold">{$t("Admin users")}</div>
    <p class="text-muted-foreground mt-1 text-xs">
      {$t("These logins control admin UI access.")}
    </p>
    <form
      method="POST"
      action="?/createAdmin"
      class="mt-3 flex flex-col gap-3 md:flex-row md:items-center"
    >
      <input
        type="text"
        name="username"
        placeholder={$t("New admin username")}
        class="border-stroke flex-1 rounded-full border bg-white/70 px-3 py-2 text-xs"
        autocomplete="off"
      />
      <input
        type="password"
        name="password"
        placeholder={$t("Password")}
        class="border-stroke flex-1 rounded-full border bg-white/70 px-3 py-2 text-xs"
        autocomplete="new-password"
      />
      <button
        class="border-stroke rounded-full border bg-white/80 px-4 py-2 text-xs font-semibold"
      >
        {$t("Add admin")}
      </button>
    </form>
    {#if form?.intent === "createAdmin" && form?.message}
      <div class="mt-3 text-xs text-red-600">{$t(form.message)}</div>
    {/if}
    <div class="text-muted-foreground mt-3 grid gap-2 text-xs">
      {#each data.adminUsers as admin (admin.id)}
        <div
          class="border-stroke flex items-center justify-between rounded-xl border bg-white/70 px-3 py-2"
        >
          <span class="text-ink font-semibold">{admin.username}</span>
          <span>
            {new Date(admin.createdAt).toLocaleDateString($localeTag, {
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
    <div class="text-ink text-sm font-semibold">{$t("Seasons")}</div>
    <p class="text-muted-foreground mt-1 text-xs">
      {$t(
        "Create and manage seasons. Active season is used for season ratings.",
      )}
    </p>

    <form
      method="POST"
      action="?/createSeason"
      class="mt-3 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]"
    >
      <input
        type="text"
        name="name"
        placeholder={$t("Season name")}
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
        class="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase"
      >
        <input type="checkbox" name="isActive" class="accent-ink" />
        {$t("Active")}
      </label>
      <button
        class="border-stroke rounded-full border bg-white/80 px-3 py-2 text-xs font-semibold md:col-span-4"
      >
        {$t("Add season")}
      </button>
    </form>

    <div class="mt-3 flex flex-col gap-3">
      {#if data.seasons.length === 0}
        <div class="text-muted-foreground text-xs">{$t("No seasons yet.")}</div>
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
                class="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase"
              >
                <input
                  type="checkbox"
                  name="isActive"
                  checked={season.isActive}
                  class="accent-ink"
                />
                {$t("Active")}
              </label>
              <button
                class="border-stroke rounded-full border bg-white/80 px-3 py-2 text-xs font-semibold md:col-span-4"
              >
                {$t("Update season")}
              </button>
            </form>
            <form method="POST" action="?/deleteSeason" class="mt-2">
              <input type="hidden" name="seasonId" value={season.id} />
              <button
                class="border-stroke rounded-full border bg-white/80 px-3 py-2 text-xs font-semibold text-red-600"
                onclick={(event) => {
                  if (!confirm($t("Delete this season?"))) {
                    event.preventDefault();
                  }
                }}
              >
                {$t("Delete")}
              </button>
            </form>
          </div>
        {/each}
      {/if}
    </div>
  </section>
{/if}
