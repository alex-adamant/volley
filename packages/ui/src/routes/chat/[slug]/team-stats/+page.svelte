<script lang="ts">
  import { calculateWinrate } from "$lib";

  export let data;
</script>

<table>
  <thead>
    <tr class="text-left [&>th]:pr-4">
      <th>№</th>
      <th>Names</th>
      <th>Games</th>
      <th>Wins</th>
      <th>Losses</th>
      <th>Winrate</th>
    </tr>
  </thead>
  <tbody>
    {#each data.teamStats as item, index}
      <tr>
        <td>{index + 1}</td>
        <td>{item.p1} / {item.p2}</td>
        <td>{item.games}</td>
        <td>{item.wins}</td>
        <td>{item.losses}</td>
        <td>{calculateWinrate(item)}%</td>
      </tr>
    {/each}
  </tbody>
</table>
