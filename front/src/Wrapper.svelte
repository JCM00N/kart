<div class="wrapper"><slot /></div>

<style lang="scss">
  .wrapper {
    margin-top: 16px;
    
    /* Remove alpha input */
    :global(input[type="number"]:last-child) {
      display: none;
    }
  }
</style>