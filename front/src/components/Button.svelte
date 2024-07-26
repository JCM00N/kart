<button {...$$props} on:click><slot /></button>

<style lang="scss">
  button {
    background-color: transparent;
    border: 2px solid #1A1A1A;
    border-radius: 15px;
    color: #3B3B3B;
    font-size: 16px;
    font-weight: 600;
    padding: 16px 24px;
    text-align: center;
    transition: all 300ms cubic-bezier(.23, 1, 0.32, 1);
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    &:disabled {
      background-color: lightgray;
      cursor: default;
    }
    &:hover:not([disabled]) {
      color: #fff;
      background-color: #1A1A1A;
      box-shadow: rgba(0, 0, 0, 0.25) 0 8px 15px;
      transform: translateY(-2px);
    }
    &:active {
      box-shadow: none;
      transform: translateY(0);
    }
  }
</style>