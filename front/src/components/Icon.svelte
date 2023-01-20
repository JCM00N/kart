<script lang="ts">
  export let name: string;
  $: path = `icons/${name}.svg`;
</script> 

<img src={path} alt={name} {...$$props} />