<script lang="ts">
  export let open = false;
</script>

<aside class:open><slot /></aside>

<style>
  aside {
    position: absolute;
  	right: -100%;
    height: 100%;
    background-color: white;
    border-radius: 2px;
  	transition: right 0.3s ease-in-out;
    padding: 2rem;
  }
  
  .open {
  	right: 0
  }
</style>