<script lang="ts">
  import Button from "./components/Button.svelte";
  import { Moon } from 'svelte-loading-spinners'
  import { txStatus, connect } from "./util/pact";
  import { onDestroy } from "svelte";
  import { accountName, balance, cooldownDate, isBig, isPixelTaken, isPointer, wallet } from "./util/store";
  import { slide } from "svelte/transition";
  import { TX_PRICE, CHAIN_ID } from "./util/consts";
  import { aborter } from "./util/utility";

  let count = 0, interval = 0, expanded = false;
  $: isOnlyWcAvailable = !$isBig && !$isPointer;
  const wallets = {
    wc: {name: 'Wallet Connect', url: '/wc.svg?raw'},
    ...!isOnlyWcAvailable && {
      kadena: {name: 'Ecko Wallet', url: '/ecko.png'},
      koala: {name: 'Koala Wallet', url: '/koala.jpg'},
      cw: {name: 'Chainweaver', url: '/chainweaver.png'},
    }
  };
  $: isOnlyWcAvailable && wallet.set('wc');
  
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
  $: isSigning = $txStatus === 'signing';
  $: isConnecting = $txStatus.startsWith('connecting');
  $: isConnectingWc = $wallet === 'wc' && isConnecting;
</script>

<Button on:click disabled={$txStatus || count || $isPixelTaken}
  style={`position: relative; margin: 16px auto; ${$accountName ? 'width: 80%' : 'padding: 8px'}`}>
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
        <span>{$wallet === 'cw' ? 'Draw!' : 'Connect'}</span>
      </div>
    </div>
    {#if !isOnlyWcAvailable}
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
  {/if}
</Button>
{#if $txStatus}
  <div style="text-align: center">
    {#if isSigning || isConnecting}
      <small>Waiting for {isSigning ? 'signature' : 'approval'}...</small>
      <strong>
        Open wallet to {isSigning ? 'sign transaction' : 'approve connection'}
        {isConnectingWc ? ', ' : ' or'}
        <a href="#cancel" on:click|preventDefault={() => {aborter.abort(); txStatus.set('')}}>
          cancel
        </a>
        {#if isConnectingWc}
          or <a href="#connect" class:disabled={$txStatus.includes('wc')} on:click|preventDefault={
            () => connect(true)
          }>connect with a new qr code</a>
        {/if}
      </strong>
    {:else}
      <small>
        {$txStatus === 'disconnecting'
          ? 'Disconnecting...'
          : 'Transaction sent. Waiting for response...'
        }
      </small>
    {/if}
  </div>
{/if}
{#if $accountName && $balance < TX_PRICE}
  <small style="color: red; text-align: justify; margin-top: 8px">
    Warning: You do not appear to have enough KDA({'<'}{TX_PRICE}) on chain {CHAIN_ID}.
    Please top up your account.
  </small>
{/if}

<style src="./SendButton.scss"></style>