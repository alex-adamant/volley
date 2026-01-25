<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { browser } from "$app/environment";

  let { data } = $props();

  onMount(() => {
    if (!browser) return;
    const stored = localStorage.getItem("volley-league");
    if (stored) {
      goto(resolve("/chat/[slug]", { slug: stored }));
    }
  });

  const pickLeague = (slug: string) => {
    if (!browser) return;
    localStorage.setItem("volley-league", slug);
    goto(resolve("/chat/[slug]", { slug }));
  };
</script>

<section class="border-stroke shadow-card rounded-2xl border bg-white/90 p-4">
  <div
    class="text-muted-foreground text-[0.6rem] font-semibold tracking-[0.3em] uppercase"
  >
    Select league
  </div>
  <h2 class="font-display text-ink mt-2 text-xl font-semibold">
    Choose where to start
  </h2>
  <p class="text-muted-foreground mt-1 text-xs">
    We will remember the last league you opened.
  </p>
  <div class="mt-3 flex flex-wrap gap-2">
    {#each data.chats as chat (chat.slug)}
      <button
        class="border-stroke text-ink rounded-full border bg-white/70 px-3 py-1 text-xs font-semibold shadow-sm transition hover:bg-white"
        onclick={() => pickLeague(chat.slug)}
      >
        {chat.name}
      </button>
    {/each}
  </div>
</section>
