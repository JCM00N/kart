<script lang="ts">
  import { fade } from 'svelte/transition';
  export let x = 0, y = 0;
</script>

<div transition:fade={{ duration: 100 }} style="top: {y}px; left: {x}px;">
	<slot />
</div>

<style>
	div {
		position: absolute;
		border: 1px solid #0003;
		box-shadow: 2px 2px 5px 0px #0002;
		background: white;
	}
</style>
