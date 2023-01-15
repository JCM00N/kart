 <script lang="ts">
  import Canvas from './Canvas.svelte';
  import { createImage } from './utility';
  import Sidebar from './Sidebar.svelte';
  import ParamPicker from './ParamPicker.svelte';
  import { toast } from '@zerodevx/svelte-toast';
  import { accountName, cooldownDate, pickedHexColor, pickedPixelPosition } from './store';
  import { createCmd, localFetch, signAndSend } from './pact';
  import { SUCCESS_THEME } from './theme';
  import type { UserPixel } from './types';
  import { SyncLoader } from 'svelte-loading-spinners'
  
  let showPixel = false;
  let userAssignedPixels = [] as UserPixel[];
  const canvasPromise = localFetch('get-canvas').then(({ result: { data } }) => createImage(data));

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

{#await canvasPromise}
  <div class="loader"><SyncLoader size={80} /></div>
{:then data}
  <Sidebar open={showPixel}>
    <ParamPicker on:click={assignPixel} />
  </Sidebar>
  <Canvas {data} {userAssignedPixels} bind:showPixel />
  {#await import('@zerodevx/svelte-toast') then {SvelteToast}}
    <SvelteToast options={{ pausable: true }} />
    <div class="bottom">
      <SvelteToast target="bottom" options={{
        pausable: true, reversed: true, duration: 6e3, intro: { y: 80 }
      }}  />
    </div>
  {/await}
{/await}

<style lang="scss">
  .loader {
    margin: auto;
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