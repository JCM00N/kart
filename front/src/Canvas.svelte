<script lang="ts">
  import { onMount } from "svelte";
  import { DIMENSIONS, MAX_ZOOM, MIN_ZOOM, SCROLL_SENSITIVITY } from "./consts";
  import { add, clamp, forXY, notInBounds, sub, toXY } from "./utility";
  import { 
    isEyeDropping, isPixelTaken,
    pickedHexColor, hoveredPixelColor,
    pickedPixelPosition, springedPixelPosition
  } from "./store";
  import type { UserPixel } from "./types";
  import { txStatus } from "./pact";
  import { drawTarget } from "./util/draw";

  export let data: ImageBitmap;
  export let showPixel: boolean;
  export let pixelMap: object;
  export let userAssignedPixels: UserPixel[] = [];
  
  let width = window.innerWidth;
	let height = window.innerHeight;
  const keyPresses = {} as {[key: string]: boolean | undefined};
  
  let canvas: HTMLCanvasElement;
  let zoom = 1;
  let isDragging = false;
  let [offset, dragStart, mousePos] = Array.from({ length: 3 }, () => ({ x: 0, y: 0 }));
  
  $: origin = {
    x: Math.round((width - DIMENSIONS) / 2),
    y: Math.round((height - DIMENSIONS) / 2)
  };
  $: adjustedMousePos = {
    x: Math.round((mousePos.x - offset.x) / zoom),
    y: Math.round((mousePos.y - offset.y) / zoom),
  };
  $: pixelScreenPos = add($springedPixelPosition, origin);
  $: canvasPixelPos = sub(adjustedMousePos, origin);
  const unsub = pickedPixelPosition.subscribe(pos =>
    $isPixelTaken = pixelMap[`${pos.x}_${pos.y}`] !== undefined
  );
  
  function handlePointerDown(e: MouseEvent) {
    if (e.button === 2) return; // Right click

    if ($isEyeDropping) {
      $pickedHexColor = '#' + Array.from($hoveredPixelColor.slice(0, 3))
        .map(n => n.toString(16).padStart(2, '0')).join('');
      $isEyeDropping = false;
    }
    else {
      isDragging = true;
      const pos = toXY(e);
      forXY(xy => dragStart[xy] = pos[xy] / zoom - offset[xy]);
    }
  }

  function handlePointerMove(e: MouseEvent) {
    const pos = toXY(e);
    forXY(xy => mousePos[xy] = pos[xy]);
    if (isDragging)
      forXY(xy => offset[xy] = pos[xy] / zoom - dragStart[xy]);
  }

  function handleOpenMenu() {
    if (notInBounds(canvasPixelPos)) return;

    $pickedPixelPosition = {...canvasPixelPos};
    showPixel = true;
  }
  
  function handleWheel(e: WheelEvent) {
    if (isDragging) return;
    
    const zoomChange = e.deltaY * SCROLL_SENSITIVITY;
    const prevZoom = zoom;
    zoom = clamp(MIN_ZOOM, zoom - zoomChange, MAX_ZOOM);
    
    if (zoom === prevZoom) return;
    forXY(xy => offset[xy] += zoomChange * adjustedMousePos[xy])
  }

  function handleKeyDown(e: KeyboardEvent) {
    const {key} = e;
    key === 'd' && handleOpenMenu();
    keyPresses[key] = true;
    if (showPixel) {
      keyPresses.ArrowRight && $pickedPixelPosition.x + 1 < DIMENSIONS && ++$pickedPixelPosition.x;
      keyPresses.ArrowLeft &&  $pickedPixelPosition.x > 0 && --$pickedPixelPosition.x;
      keyPresses.ArrowUp && $pickedPixelPosition.y > 0 && --$pickedPixelPosition.y;
      keyPresses.ArrowDown &&  $pickedPixelPosition.y + 1 < DIMENSIONS && ++$pickedPixelPosition.y;
    }
  }

  onMount(() => {
    const context = canvas.getContext('2d');
    
    let anime = requestAnimationFrame(async function update() {
      context.save();
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, width, height);
      context.translate(offset.x, offset.y);
      context.scale(zoom, zoom);
      context.drawImage(data, origin.x, origin.y);

      userAssignedPixels.forEach(({x, y, color}) => {
        context.fillStyle = color;
        context.fillRect(origin.x + x, origin.y + y, 1, 1);
      });
      
      if (showPixel) {
        context.fillStyle = context.strokeStyle = $pickedHexColor;
        drawTarget(context, pixelScreenPos, $txStatus === 'signing');
      }
      if ($isEyeDropping)
        $hoveredPixelColor = context.getImageData(mousePos.x, mousePos.y, 1, 1).data;
      
      context.restore();
      anime = requestAnimationFrame(update);
    });
  
    return () => {
      cancelAnimationFrame(anime);
      unsub();
    }
  });
</script>

<svelte:window bind:innerWidth={width} bind:innerHeight={height}
  on:keydown={handleKeyDown} on:keyup={e => delete keyPresses[e.key]}
/>
<canvas bind:this={canvas} {width} {height} style="touch-action: none"
  style:cursor={$isEyeDropping ? 'cell' : `grab${isDragging ? 'bing' : ''}`}
  on:pointerdown={handlePointerDown} on:pointerup={() => isDragging = false}
  on:pointermove={handlePointerMove} on:wheel|preventDefault={handleWheel}
  on:contextmenu|preventDefault={handleOpenMenu}
/>