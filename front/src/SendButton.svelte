<script lang="ts">
  import Button from "./components/Button.svelte";
  import { Moon } from 'svelte-loading-spinners'
  import { txStatus } from "./util/pact";
  import { onDestroy } from "svelte";
  import { accountName, balance, cooldownDate, isPixelTaken, wallet } from "./util/store";
  import { slide } from "svelte/transition";
  import { TX_PRICE, CHAIN_ID } from "./util/consts";

  let count = 0, interval = 0, expanded = false;
  const wallets = {
    wc: {name: 'Wallet Connect', url: '/wc.svg?raw'},
    kadena: {name: 'Ecko Wallet', url: '/ecko.png'},
    koala: {name: 'Koala Wallet', url: '/koala.jpg'},
    cw: {name: 'Chainweaver', url: '/chainweaver.png'},
  };
  
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

  const changeWalletTo = (walletName: string) => {
    wallet.set(walletName);
    expanded = false;
  }
</script>

<Button on:click disabled={$txStatus || count || $isPixelTaken}
  style={`position: relative; margin-top: 16px; ${$accountName ? 'width: 80%' : 'padding: 8px'}`}>
  {#if count}
    {m}:{s}
  {:else if $txStatus}
    <Moon size="36" color="black" />
  {:else if $isPixelTaken}
    Occupied Spot
  {:else if $accountName}
    Draw!
  {:else}
    <div style="display: flex; justify-content: space-between; width:100%">
      <div style="display: flex; align-items: center; gap: 8px">
        <img src={wallets[$wallet].url} alt={wallets[$wallet].name} />
        <span>{$wallet === 'cw' ? 'Send' : 'Connect'}</span>
      </div>
    </div>
    <div class="expander" on:click|stopPropagation={() => expanded = !expanded}>
      <span class="caret" class:flip={expanded}>▼</span>
    </div>
    {#if expanded}
      <div class="wallets">
        <ul transition:slide>
          {#each Object.entries(wallets) as [key, value]}
            <li on:click|stopPropagation={() => changeWalletTo(key)}>
              <i><img src={value.url} alt={value.name} /></i>
              <span>{value.name} {#if key === 'cw'} Direct Send {/if}</span>
            </li>  
          {/each}
        </ul>
    </div>
    {/if}
  {/if}
</Button>
{#if $txStatus}
  <div style="text-align:center">
    {#if $txStatus === 'signing'}
      <small>Waiting for signature...</small>
      <strong>Open wallet to sign transaction</strong>
    {:else}
      <small>Transaction sent. Waiting for response...</small>
    {/if}
  </div>
{/if}
{#if $accountName && $balance < TX_PRICE}
  <small style="color:red; text-align: justify; margin-top: 8px">
    Warning: You do not appear to have enough KDA({'<'}{TX_PRICE}) on chain {CHAIN_ID}.
    Please top up your account.
  </small>
{/if}

<style src="./SendButton.scss"></style>