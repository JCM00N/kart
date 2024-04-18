 <script lang="ts">
	import { ModalCtrl } from '@walletconnect/modal-core';
  import Canvas from './Canvas.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import { createImage, img, pixelMap } from './util/utility';
  import ParamPicker from './ParamPicker.svelte';
  import { toast } from '@zerodevx/svelte-toast';
  import { accountName, cooldownDate, isBig, pickedHexColor, pickedPixelPosition, wallet } from './util/store';
  import { connect, createCmd, localFetch, signAndSend } from './util/pact';
  import { SUCCESS_THEME } from './util/theme';
  import type { UserPixel } from './types';
  import { SyncLoader } from 'svelte-loading-spinners';
  import FaGithub from 'svelte-icons/fa/FaGithub.svelte';
  import Dialog from './components/Dialog.svelte';
  import MdHelp from 'svelte-icons/md/MdHelp.svelte'
  import { GAS_FOR_ASSIGNMENT, DIMENSIONS, SECTION_SIZE } from './util/consts';
  import Controller from './Controller.svelte';
  import InstructionsDialog from './InstructionsDialog.svelte';
  
  let showPixel = false;
  let dialog: HTMLDialogElement;
  let paramPickerDialog: HTMLDialogElement;
  let userAssignedPixels = [] as UserPixel[];
  let dataPromise: any;
  ModalCtrl.subscribe(modal => modal.open && paramPickerDialog?.close?.());
  
  $: image = createImageBitmap(new ImageData($img, DIMENSIONS, DIMENSIONS));
  for(let x = 0, i = 0; x < DIMENSIONS; x += SECTION_SIZE)
    for(let y = 0; y < DIMENSIONS; y += SECTION_SIZE)
      dataPromise = localFetch(
        `get-section ${x} ${y} ${x + SECTION_SIZE - 1} ${y + SECTION_SIZE - 1}`, undefined, i++
      ).then(({ result: { data } }) => createImage(data, x, y, SECTION_SIZE));

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
{#await image}
  <div style="margin: auto"><SyncLoader size={80} /></div>
{:then data}
  {#if $isBig}
    <Sidebar open={showPixel} on:click={() => showPixel = false}>
      <ParamPicker on:click={$accountName || $wallet === 'cw' ? assignPixel : connect} />
    </Sidebar>
  {:else}
    <Dialog bind:dialog={paramPickerDialog}>
      <ParamPicker on:click={$accountName ? assignPixel : connect} />
    </Dialog>
  {/if}
  <Canvas pixelMap={$pixelMap} {data} {userAssignedPixels} bind:showPixel />
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