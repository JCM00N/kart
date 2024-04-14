<script lang="ts">
	import { balance, isPointer } from './util/store';
	import { tooltip } from '@svelte-plugins/tooltips';
  import ColorPicker, { ChromeVariant } from "svelte-awesome-color-picker"
  import Wrapper from "./components/Wrapper.svelte";
  import IconButton from "./components/IconButton.svelte";
  import { isEyeDropping, pickedHexColor, hoveredPixelColor, pickedPixelPosition, accountName } from "./util/store";
  import { DIMENSIONS } from "./util/consts";
  import SendButton from "./SendButton.svelte";
  import MdColorize from "svelte-icons/md/MdColorize.svelte";
  import IoMdLogOut from 'svelte-icons/io/IoMdLogOut.svelte'
  import { logout, txStatus } from "./util/pact";
  import Button from "./components/Button.svelte";

  const eyeDropper = 'EyeDropper' in window && new window.EyeDropper();

  async function pickColor() {
    $isEyeDropping = !$isEyeDropping;
    if ($isEyeDropping && eyeDropper) {
      try {
        $pickedHexColor = (await eyeDropper.open()).sRGBHex;
      } catch (err) {
        if (err.message.includes('user canceled'))
          $isEyeDropping = false;
        else throw err;
      }
      $isEyeDropping = false;
    }
  }
</script>

<div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
  (<input type="number" min="0" max={DIMENSIONS} bind:value={$pickedPixelPosition.x} />,
  <input type="number" min="0" max={DIMENSIONS} bind:value={$pickedPixelPosition.y} />)
  {#if $isPointer}
    <IconButton active={$isEyeDropping} on:click={pickColor} color={
      !eyeDropper && $hoveredPixelColor
    }>
      <MdColorize />
    </IconButton>
  {/if}
</div>
<ColorPicker toRight bind:hex={$pickedHexColor} isInput={false} isAlpha={false} components={{
  ...ChromeVariant, wrapper: Wrapper
}} />
<SendButton on:click />
<div style="flex: 2 auto" />
<div>
  {#if $accountName}
    <p style="margin-bottom: 4px; text-align:center">
      Signed in as
      <b use:tooltip={{animation: 'slide', delay: 0}} title={$accountName}>
        {$accountName.length >= 10
          ? `${$accountName.slice(0, 5)}...${$accountName.slice(-5)}`
          : $accountName
        }
      </b>
    </p>
    <small style="margin-bottom: 2px; text-align:center;">(balance: {$balance} KDA)</small>
    <Button on:click={logout} disabled={$txStatus === 'disconnecting'}>
      Logout <span style="width: 32px; margin-left: 8px"><IoMdLogOut /></span>
    </Button>
  {/if}
</div>

<style lang="scss">
	input {
		flex: 1;
		border: none;
		background-color: #eee;
		padding: 0;
		border-radius: 5px;
		height: 28px;
		text-align: center;
    font-size: large;
    &:focus {
      outline: none;
    }
	}
</style>