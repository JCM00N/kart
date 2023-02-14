<script lang="ts">
  export let active = false;
  export let color: Uint8ClampedArray = undefined;
  export let size = 32;
</script>

<button
  class:has-color={color}
  class:active
  on:click
  style:outline-color={`rgba(${color})`}
  {...$$props}
><span style="display:flex; padding:4px; width: {size}px"><slot /></span></button>

<style lang="scss">
  button {
    border-radius: 2rem;
    outline-style: dashed;
    background-color: #f5f5f5;
    transition: background-color .2s ease-in-out;
    cursor: pointer;
    outline-style: none;
    border-style: none;
    outline-width: medium;
    &:hover {
      background-color: #dcdcdc;
    }
    &.active {
      background-color: #b5b5b5b5;
      &.has-color {
        outline-style: dashed;
      }
    }
  }
</style>