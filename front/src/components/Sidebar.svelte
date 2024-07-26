<script lang="ts">
  import IconButton from "./IconButton.svelte";
  import TiArrowBack from "svelte-icons/ti/TiArrowBack.svelte";
  export let open = false;
</script>

<aside class:open>
  <IconButton style="position: absolute; top: 4px; right: 4px; transform: scale(-1, 1)" on:click>
    <TiArrowBack />
  </IconButton>  
  <slot />
</aside>

<style>
  aside {
    width: 350px;
    position: absolute;
  	right: -100%;
    height: 100%;
    background-color: white;
    border-radius: 2px;
  	transition: right 0.3s ease-in-out;
    padding: 4rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .open {
  	right: 0
  }
</style>