<script lang="ts">
  import Button from "./components/Button.svelte";
  import { Moon } from 'svelte-loading-spinners'
  import { txStatus } from "./pact";
  import { onDestroy } from "svelte";
  import { cooldownDate, isPixelTaken } from "./store";

  let count = 0, interval = 0;
  
  const pad = (num: number) => num.toString().padStart(2, '0');

  function updateCountdown(endDate: number) {
    const now = Date.now();
    const end = +new Date(endDate);
    if (now >= end) return;
    
    clearInterval(interval);
    count = (end - now) / 1e3 | 0;
    interval = window.setInterval(() => !--count && clearInterval(interval), 1e3);
  }

  onDestroy(() => clearInterval(interval));

  $: updateCountdown(+$cooldownDate);
  $: m = pad(count / 60 | 0);
  $: s = pad(count % 60);
  
</script>

<Button on:click disabled={$txStatus || count || $isPixelTaken}
  style={`margin-top: 16px; ${$txStatus && 'padding: 8px'}`}>
  {#if count}
    {m}:{s}
  {:else if $txStatus}
    <Moon size="36" color="black" />
  {:else if $isPixelTaken}
    Occupied Spot
  {:else}
    Send
  {/if}
</Button>
{#if $txStatus}
  <div style="text-align:center">
    {#if $txStatus === 'signing'}
      <small style="display: block; margin-bottom: 8px">Waiting for signature...</small>
      <strong>Open wallet to sign transaction</strong>
    {:else}
      <small>Transaction sent. Waiting for response...</small>
    {/if}
  </div>
{/if}
