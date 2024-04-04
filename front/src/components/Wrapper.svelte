<div class="wrapper"><slot /></div>

<style lang="scss">
  .wrapper {
    margin: 16px 0 auto;
    display: flex;
    flex-direction: column;
    /* Remove alpha input */
    :global(input[type="number"]:last-child) {
      display: none;
    }
  }
</style>