<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { browser } from "$app/environment";
  import * as Select from "$lib/components/ui/select";

  let { data, children } = $props();

  let menuOpen = $state(false);
  let leagueValue = $state("");

  const slug = $derived(page.params.slug ?? "");
  const leagueOptions = $derived(
    (data?.chats ?? []).map((chat) => ({
      value: chat.slug,
      label: chat.name,
    })),
  );
  const leagueLabel = $derived(
    leagueOptions.find((option) => option.value === leagueValue)?.label ??
      "Select",
  );

  const closeMenu = () => {
    menuOpen = false;
  };

  let menuRef: HTMLDivElement | null = null;

  onMount(() => {
    if (!browser) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuOpen) return;
      const target = event.target as Node | null;
      if (menuRef && target && !menuRef.contains(target)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClick);
    const stored = localStorage.getItem("volley-league");
    if (page.url.pathname === "/" && stored) {
      goto(resolve("/chat/[slug]", { slug: stored }));
    }
    if (!slug && stored) {
      leagueValue = stored;
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  });

  $effect(() => {
    if (!browser || !slug) return;
    leagueValue = slug;
    localStorage.setItem("volley-league", slug);
  });

  const handleLeagueChange = (next: string) => {
    if (!next || next === slug) return;
    leagueValue = next;
    localStorage.setItem("volley-league", next);
    goto(resolve("/chat/[slug]", { slug: next }));
    closeMenu();
  };
</script>

<main class="min-h-screen px-3 pt-3 pb-10 md:px-6">
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-3">
    <header class="relative z-400 flex items-center justify-between gap-2">
      <div
        class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.3em] uppercase"
      >
        Volley
      </div>
      <div class="relative" bind:this={menuRef}>
        <button
          type="button"
          class="border-stroke text-ink rounded-full border bg-white/70 px-3 py-1 text-[0.6rem] font-semibold tracking-[0.2em] uppercase shadow-sm transition hover:bg-white"
          onclick={() => (menuOpen = !menuOpen)}
          aria-expanded={menuOpen}
        >
          Menu
        </button>
        {#if menuOpen}
          <div
            class="border-stroke shadow-card absolute right-0 z-500 mt-2 w-64 rounded-2xl border bg-white/95 p-3 backdrop-blur"
          >
            <div
              class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.3em] uppercase"
            >
              League
            </div>
            <div class="mt-2">
              <Select.Root
                value={leagueValue}
                onValueChange={handleLeagueChange}
                type="single"
              >
                <Select.Trigger
                  size="sm"
                  class="border-stroke text-ink h-8 w-full rounded-full bg-white/80 px-3 text-xs font-semibold"
                >
                  <span class="truncate">{leagueLabel}</span>
                </Select.Trigger>
                <Select.Content
                  class="border-stroke bg-white"
                  portalProps={{ to: "body" }}
                >
                  {#each leagueOptions as option (option.value)}
                    <Select.Item value={option.value} label={option.label} />
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>
          </div>
        {/if}
      </div>
    </header>

    {@render children?.()}
  </div>
</main>
