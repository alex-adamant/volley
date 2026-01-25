<script lang="ts">
  import { resolve } from "$app/paths";
  import type { Pathname } from "$app/types";
  import { cn } from "$lib/utils.js";
  import type { Snippet } from "svelte";

  export type PrimaryNavItem = {
    label: string;
    href: Pathname;
    active?: boolean;
  };

  let {
    items,
    class: className,
  }: {
    items: PrimaryNavItem[];
    class?: string;
    children?: Snippet;
  } = $props();
</script>

<nav class={cn("flex flex-wrap items-center gap-3", className)}>
  {#each items as item (item.href)}
    <a
      class="text-ink data-[active=true]:border-ink border-b-2 border-transparent px-1.5 pb-1 text-xs font-semibold opacity-70 transition hover:opacity-100 data-[active=true]:opacity-100"
      data-active={item.active}
      href={resolve(item.href)}
    >
      {item.label}
    </a>
  {/each}
</nav>
