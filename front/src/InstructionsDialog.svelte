<script>
  import MdMouse from 'svelte-icons/md/MdMouse.svelte';
  import { TX_PRICE, CHAIN_ID } from './util/consts';
  import Dialog from './components/Dialog.svelte';
  export let dialog;
</script>

<Dialog bind:dialog title="Hi there!">
  <p>
    Use the cursor with by holding <kbd>Left-click</kbd> to drag the canvas around,
    and <kbd>Scroll</kbd> to zoom.
  </p>
  <p>
    Display the Drawing Board by either pressing the <kbd>D</kbd> key, <kbd>Double-click</kbd>ing
    or <kbd>Right-click</kbd>ing <span><MdMouse /></span> anywhere on the canvas!
  </p>
  <p>
    You can move the targeted pixel of your choice by right-clicking again or using the arrow keys
    <kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd><kbd>←</kbd>, (or the Controller on mobile devices)
  </p>
  <p>
    Once you've selected your position and color,
    simply click "Draw!" to Sign your transaction and draw your pixel
  </p>
  <p>
    Just make sure you have some KDA on chain #{CHAIN_ID} to pay for the gas
    ({TX_PRICE} should be more than enough <span class="emoji">☺️</span>)
  </p>
</Dialog>

<style>
  span {
    display: inline-block;
    width: 24px;
    vertical-align: middle;
  }
</style>