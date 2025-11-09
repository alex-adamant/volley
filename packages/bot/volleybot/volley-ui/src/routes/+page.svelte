<script lang="ts">
  import "../app.css";
  import { calculateResults } from "$lib/rating";
  import { Chart, registerables } from "chart.js";
  import { onMount } from "svelte";
  import { getTeamStats } from "$lib/teams";
  import { calculateWinrate } from "$lib";

  let ctx;
  let chartCanvas: HTMLCanvasElement;

  export let data;

  export const results = calculateResults(data.users, data.matches).filter(
    (p) => !p.isHidden,
  );

  export const teamStats = getTeamStats(data.users, data.matches);

  const playerResult = results.find((r) => r.name === "Саша")!.ratingHistory;

  onMount(async () => {
    ctx = chartCanvas.getContext("2d");

    Chart.register(...registerables);
    new Chart(ctx!, {
      type: "line",
      data: {
        labels: playerResult.map((_, i) => i + 1),
        datasets: [
          {
            label: "Олег",
            data: playerResult,
            borderWidth: 1,
          },
        ],
      },
    });
  });
</script>

<table>
  <thead>
    <tr class="text-left [&>th]:pr-4">
      <th>№</th>
      <th>Name</th>
      <th>Rating</th>
      <th>Games</th>
      <!--      <th>Change</th>-->
      <th>Rating Highest</th>
      <th>Rating Lowest</th>
      <th>Wins</th>
      <th>Losses</th>
      <th>Winrate</th>
      <th>Longest Win Streak</th>
      <th>Longest Loss Streak</th>
    </tr>
  </thead>
  <tbody>
    {#each results as item, index}
      <tr>
        <td>{index + 1}</td>
        <td>{item.name}</td>
        <td>{item.rating}</td>
        <td>{item.games - item.initialGames}</td>
        <!--        <td>{item.ratingChange}</td>-->
        <td>{Math.max(...item.ratingHistory)}</td>
        <td>{Math.min(...item.ratingHistory)}</td>
        <td>{item.wins}</td>
        <td>{item.losses}</td>
        <td>{calculateWinrate(item)}%</td>
        <td>{item.longestWinStreak}</td>
        <td>{item.longestLossStreak}</td>
      </tr>
    {/each}
  </tbody>
</table>

<div>
  <canvas bind:this={chartCanvas} id="myChart"></canvas>
</div>

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
    {#each teamStats as item, index}
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
