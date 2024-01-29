 <script lang="ts">
  import Canvas from './Canvas.svelte';
  import { createImage, createImage2, img, pixelMap } from './utility';
  import Sidebar from './Sidebar.svelte';
  import ParamPicker from './ParamPicker.svelte';
  import { toast } from '@zerodevx/svelte-toast';
  import { accountName, cooldownDate, pickedHexColor, pickedPixelPosition } from './store';
  import { CHAIN_ID, createCmd, localFetch, signAndSend } from './pact';
  import { SUCCESS_THEME } from './theme';
  import type { UserPixel } from './types';
  import { SyncLoader } from 'svelte-loading-spinners';
  import FaGithub from 'svelte-icons/fa/FaGithub.svelte';
  import Dialog from './components/Dialog.svelte';
  import MdHelp from 'svelte-icons/md/MdHelp.svelte'
  import MdMouse from 'svelte-icons/md/MdMouse.svelte'
  import { DIMENSIONS, SECTION_SIZE } from './consts';
  
  let showPixel = false;
  let dialog: HTMLDialogElement;
  let userAssignedPixels = [] as UserPixel[];
  let dataPromise: any;
  $: image = createImageBitmap(new ImageData($img, DIMENSIONS, DIMENSIONS));
    
  for(let x = 0; x < DIMENSIONS; x += SECTION_SIZE)
    for(let y = 0; y < DIMENSIONS; y += SECTION_SIZE)
      dataPromise = localFetch(`get-section ${x} ${y} ${x + SECTION_SIZE - 1} ${y + SECTION_SIZE - 1}`)
        .then(({ result: { data } }) => createImage2(data, x, y, SECTION_SIZE));

  const updateCooldown = () => localFetch(`get-artist-cooldown '${$accountName}`).then(
    ({ result: { data } }) => cooldownDate.set((Date.now() + data * 1e3) + '')
  );

  updateCooldown();
  
  function assignPixel() {
    const {x, y} = $pickedPixelPosition;
    const color = $pickedHexColor.substring(1);

    signAndSend({
      ...createCmd(`assign-pixel "${color}" ${x} ${y}`),
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
  <div class="loader"><SyncLoader size={80} /></div>
{:then data}
  <Sidebar open={showPixel}>
    <ParamPicker on:click={assignPixel} on:close={() => showPixel = false} />
  </Sidebar>
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
<button class="icon" on:click={() => dialog.showModal()}>
  <MdHelp />
</button>
<Dialog bind:dialog title="Hi there!">
  <p>Use the cursor with by holding <kbd>Left-click</kbd> to drag the canvas around, and <kbd>Scroll</kbd> to zoom.</p>
  <p>
    Display the Drawing Drawer by either pressing the <kbd>D</kbd> key
    or <kbd>Right-click</kbd>ing <span><MdMouse /></span> anywhere on the canvas!
  </p>
  <p>
    You can move the targeted pixel of your choice by right-clicking again or using the arrow keys
    <kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd><kbd>←</kbd>
  </p>
  <p>Once you've selected your position and color, simply click "Send" to Sign your transaction and draw your pixel</p>
  <p>
    Just make sure you have some KDA on chain #{CHAIN_ID} to pay for the gas
    (0.01 should be more than enough <span class="emoji">☺️</span>)
  </p>
</Dialog>

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
    }
  }
  .loader {
    margin: auto;
  }
  span {
    display: inline-block;
    width: 24px;
    vertical-align: middle;
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