<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { twMerge } from "tailwind-merge";

  export let data;

  $: slug = $page.params.slug;
</script>

<div class="flex flex-row">
  <div class="w-2/3">1</div>
  <table class="w-1/3">
    <thead>
      <tr class="text-left [&>th]:pr-4">
        <th>№</th>
        <th>Name</th>
        <th>Games</th>
        <th>Rating</th>
        <th>Change</th>
      </tr>
    </thead>
    <tbody>
      {#each data.results as item, index}
        <tr
          class="cursor-pointer hover:bg-gray-100"
          on:click={() => {
            goto(`/chat/${slug}/user/${item.id}`);
          }}
        >
          <td>{index + 1}</td>
          <td>{item.name}</td>
          <td>{item.games}</td>
          <td>{item.rating}</td>
          <td
            class={twMerge(
              "pr-7 text-right",
              item.ratingChange > 0 && "text-green-500",
              item.ratingChange < 0 && "text-red-500",
            )}
            >{item.ratingChange > 0
              ? `+${item.ratingChange}`
              : item.ratingChange}</td
          >
        </tr>
      {/each}
    </tbody>
  </table>
</div>
