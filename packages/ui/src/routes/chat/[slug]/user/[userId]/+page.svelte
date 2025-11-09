<script lang="ts">
  import { Chart, registerables } from "chart.js";
  import {  onMount } from "svelte";
  import { calculateWinrate } from "$lib";

  let ctx;
  let chartCanvas: HTMLCanvasElement;
  let chart: Chart;

  export let data;

  const { result, user } = data;

  $: if (chart) {
    chart.data.labels = result.ratingHistory.map((_, i) => i + 1);
    chart.data.datasets[0] = {
      label: user.name,
      data: result.ratingHistory,
      borderWidth: 1,
    };
    chart.update();
  }

  onMount(async () => {
    ctx = chartCanvas.getContext("2d");

    Chart.register(...registerables);
    chart = new Chart(ctx!, {
      type: "line",
      data: {
        labels: result.ratingHistory.map((_, i) => i + 1),
        datasets: [
          { label: user.name, data: result.ratingHistory, borderWidth: 1 },
        ],
      },
    });
  });
</script>

<div class="flex w-48 flex-col gap-2">
  <div class="flex flex-row justify-between gap-2">
    <b>Games</b>
    <span>{result.games}</span>
  </div>

  <div class="flex flex-row justify-between gap-2">
    <b>Rating</b>
    <span>{result.rating}</span>
  </div>

  <div class="flex flex-row justify-between gap-2">
    <b>Rating Highest</b>
    <span>{Math.max(...result.ratingHistory)}</span>
  </div>

  <div class="flex flex-row justify-between gap-2">
    <b>Rating Lowest</b>
    <span>{Math.min(...result.ratingHistory)}</span>
  </div>

  <div class="flex flex-row justify-between gap-2">
    <b>Wins</b>
    <span>{result.wins}</span>
  </div>

  <div class="flex flex-row justify-between gap-2">
    <b>Losses</b>
    <span>{result.losses}</span>
  </div>

  <div class="flex flex-row justify-between gap-2">
    <b>Winrate</b>
    <span>{calculateWinrate(result)}</span>
  </div>

  <div class="flex flex-row justify-between gap-2">
    <b>Longest Win Streak</b>
    <span>{result.longestWinStreak}</span>
  </div>

  <div class="flex flex-row justify-between gap-2">
    <b>Longest Loss Streak</b>
    <span>{result.longestLossStreak}</span>
  </div>
</div>

<div>
  <canvas bind:this={chartCanvas} id="myChart"></canvas>
</div>
