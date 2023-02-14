<script lang="ts">
  import ColorPicker, {CircleVariant} from "svelte-awesome-color-picker"
  import Wrapper from "./Wrapper.svelte";
  import MdColorize from 'svelte-icons/md/MdColorize.svelte'
  import IconButton from "./components/IconButton.svelte";
  import { isEyeDropping, pickedHexColor, hoveredPixelColor, pickedPixelPosition, accountName } from "./store";
  import { DIMENSIONS } from "./consts";
  import SendButton from "./SendButton.svelte";
  

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
  <IconButton size={32} active={$isEyeDropping} on:click={pickColor} color={
    !eyeDropper && $hoveredPixelColor
  }><MdColorize /></IconButton>
</div>
<ColorPicker bind:hex={$pickedHexColor} isInput={false} isAlpha={false} components={{
  ...CircleVariant, wrapper: Wrapper
}} />
{$accountName}
<SendButton on:click />

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