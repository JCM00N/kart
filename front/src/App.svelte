 <script lang="ts">
  import Canvas from './Canvas.svelte';
  import { createImage } from './util/utility';
  import Sidebar from './components/Sidebar.svelte';
  import ParamPicker from './ParamPicker.svelte';
  import { toast } from '@zerodevx/svelte-toast';
  import { accountName, cooldownDate, isBig, pickedHexColor, pickedPixelPosition, wallet } from './util/store';
  import { connect, createCmd, localFetch, signAndSend, txStatus } from './util/pact';
  import { SUCCESS_THEME } from './util/theme';
  import type { UserPixel } from './types';
  import { SyncLoader } from 'svelte-loading-spinners';
  import FaGithub from 'svelte-icons/fa/FaGithub.svelte';
  import Dialog from './components/Dialog.svelte';
  import MdHelp from 'svelte-icons/md/MdHelp.svelte'
  import { GAS_FOR_ASSIGNMENT } from './util/consts';
  import Controller from './Controller.svelte';
  import InstructionsDialog from './InstructionsDialog.svelte';
  
  let showPixel = false;
  let dialog: HTMLDialogElement;
  let paramPickerDialog: HTMLDialogElement;
  let userAssignedPixels = [] as UserPixel[];
  const dataPromise = localFetch('get-canvas').then(({ result }) => createImage([]));
  txStatus.subscribe(status => status.includes('new') && paramPickerDialog.close());

  const updateCooldown = () => localFetch(`get-artist-cooldown "${$accountName}"`).then(
    ({ result: { data } }) => cooldownDate.set((Date.now() + data * 1e3) + '')
  );

  updateCooldown();
  
  function assignPixel() {
    const {x, y} = $pickedPixelPosition;
    const color = $pickedHexColor.substring(1);

    signAndSend({
      ...createCmd(`assign-pixel "${color}" ${x} ${y}`, GAS_FOR_ASSIGNMENT, $accountName),
      caps: []
    }).then(res => {
      if (!res) return;
      
      if (res.result.status === 'success') {
        showPixel = false;
        userAssignedPixels.push({ x, y, color: `#${color}` });
        toast.push('SUCCESS', { theme: SUCCESS_THEME });
        updateCooldown();
      } else
        toast.push('An error has occurred, please try again later')
    })
  }
</script>
{#await dataPromise}
  <div style="margin: auto"><SyncLoader size={80} /></div>
{:then [pixelMap, data]}
  {#if $isBig}
    <Sidebar open={showPixel} on:click={() => showPixel = false}>
      <ParamPicker on:click={$accountName || $wallet === 'cw' ? assignPixel : connect} />
    </Sidebar>
    {:else}
    <Dialog bind:dialog={paramPickerDialog}>
      <ParamPicker on:click={$accountName ? assignPixel : connect} />
    </Dialog>
  {/if}
  <Canvas {pixelMap} {data} {userAssignedPixels} bind:showPixel />
  {#await import('@zerodevx/svelte-toast') then {SvelteToast}}
    <SvelteToast options={{ pausable: true }} />
    <div class="bottom">
      <SvelteToast target="bottom" options={{
        pausable: true, reversed: true, duration: 6e3, intro: { y: 80 }
      }}  />
    </div>
  {/await}
{/await}
<a class="icon github" href="https://github.com/JCM00N/kart">
  <FaGithub />
</a>
<Controller dialog={paramPickerDialog} />
<button class="icon" on:click={() => dialog.showModal()}>
  <MdHelp />
</button>
<InstructionsDialog bind:dialog />
<style lang="scss">
  .icon {
    color: white;
    position: absolute;
    width: 32px;
    bottom: 20px;
    left: 40px;
    background-color: transparent;
    padding: 0;
    border: none;
    cursor: pointer;
    &.github{
      left: unset;
      right: 40px;
      backdrop-filter: none;
    }
  }  
  .bottom {
    --toastContainerBottom: 60px;
    --toastContainerTop: auto;
    --toastContainerRight: 0;
    --toastContainerLeft: 0;
    --toastMargin: .5rem auto;
    --toastWidth: 40rem;
  }
</style>