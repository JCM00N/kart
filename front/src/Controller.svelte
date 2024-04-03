<script lang="ts">
  import { onDestroy } from "svelte";
  import { isBig, isPointer, pickedPixelPosition } from "./util/store";
  import FaRegCheckCircle from 'svelte-icons/fa/FaRegCheckCircle.svelte'
  import IconButton from "./components/IconButton.svelte";
  let interval: NodeJS.Timeout;
  export let dialog: HTMLDialogElement;
  const directions = ['top', 'left', 'right', 'bottom'];

  const getFunc = (dir: string) => {
    const axis = dir === 'top' || dir === 'bottom' ? 'y' : 'x';
    const diff = dir === 'right' || dir === 'bottom' ? 1 : -1;
    return () => {
      $pickedPixelPosition[axis] += diff;
      clearInterval(interval);
      interval = setInterval(() => $pickedPixelPosition[axis] += diff, 20);
    }
  }
  const clear = () => clearInterval(interval);
  onDestroy(clear);
</script>
<div>
  {#if !$isPointer}
    {#each directions as dir}
      <button class={`dir ${dir}`} on:touchstart={getFunc(dir)} on:touchend={clear} />
    {/each}
  {/if}
  {#if !$isBig}
    <IconButton class="draw" disabled={dialog?.open} on:click={() => dialog?.showModal()}>
      <FaRegCheckCircle />
    </IconButton>
  {/if}
</div>
<style lang="scss">
  div {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 8rem;
    height: 8rem;
    display: grid;
    grid-gap: .25rem;
    grid-template-columns: 3fr 4fr 3fr;
    grid-template-rows: 3fr 4fr 3fr;
    grid-template-areas: ". top ." "left draw right" ". bottom .";
  }

  :global(.draw) {
    grid-area: draw;
    z-index: 0;
    margin: auto;
    border: none;
  }

  .dir {
    color: lightgray;
    background: currentcolor;
    border: none;
    position: relative;
    &::before {
      display: block;
      content: "";
      position: absolute;
      width: 2.125rem;
      height: 2.125rem;
      transform: rotate(45deg);
      background: currentcolor;
    }
    &:active::after {
      color: blue;
    }
    &::after {
      display: block;
      content: "";
      position: absolute;
      border: 1rem solid transparent;
      color: darkcyan;
    }
  }

  $directions:
    top ".5rem .5rem 0 0" "bottom",
    left ".5rem 0 0 .5rem" "right",
    right "0 .5rem .5rem 0" "left",
    bottom "0 0 .5rem .5rem" "top";

  @each $dir, $radius, $opposite in $directions {
    .#{$dir} {
      grid-area: $dir;
      border-radius: #{$radius};
      &::after {
        border-#{$opposite}-color: currentcolor;
        #{$dir}: -.5rem;
        #{if($dir == top or $dir == bottom, left, top)}: calc(50% - 1rem);
      }
      &::before {
        #{$opposite}: -1.0625rem;
        #{if($dir == top or $dir == bottom, left, top)}: calc(50% - 1.0625rem);
      }
    }
  }
</style>