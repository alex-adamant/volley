<script lang="ts">
  import "../app.css";
  import { twMerge } from "tailwind-merge";
  import { page } from "$app/stores";

  export let data;
  $: slug = $page.params.slug;
</script>

<main class="flex flex-col p-5">
  <div class="mx-auto mb-8 flex flex-row gap-4">
    {#each data.chats as chat}
      <a
        href={`/chat/${chat.slug}`}
        class={twMerge(
          "rounded-xl px-4 py-0.5 font-bold hover:bg-gray-200",
          slug === chat.slug && "bg-gray-200",
        )}>{chat.name}</a
      >
    {/each}
  </div>
  <slot />
</main>
