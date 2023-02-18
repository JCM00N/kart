<script lang="ts">
  export let dialog: HTMLDialogElement;
  export let title = '';
  function close() {
    dialog.animate([{
      transform: 'translateY(-40px)',
      opacity: 0,
    }], {duration: 500, easing: 'ease-in'}).finished.then(e =>  dialog.close());
  }
</script>

<dialog on:cancel|preventDefault={close} bind:this={dialog} on:click={close}>
  <div on:click|stopPropagation>
    <header>
      <h2>{title}</h2>
      <button on:click={close}>✕</button>
    </header>
    <article>
      <slot />
    </article>
  </div>
</dialog>

<style lang="scss">
  dialog {
    padding: 0;
    border-radius: 4px;
    display: block;
    transition: all .5s ease-out;
    &::backdrop {
      backdrop-filter: blur(2px);
    }
    &:not([open]) {
      opacity: 0;
      transform: translateY(40px);
      pointer-events: none;
    }
    &[open] {
      opacity: 1;
      transform: translateY(0);
    }
  }
  header {
    display: flex;
    justify-content: space-between;
  }
  h2 {
    margin: 12px 0 0 12px;
  }
  div {
    width: 30em;
    padding: 0 0 1.25em;
    border-radius: 5px;
  }
  button {
    width: 1.2em;
    border: none;
    background: transparent;
    font-family: monospace;
    font-size: 2.5em;
    cursor: pointer;
    align-self: start;
    color: #ccc;
    &:hover {
      color: #f27474;
    }
  }
  article {
    padding: 12px;
  }
</style>
