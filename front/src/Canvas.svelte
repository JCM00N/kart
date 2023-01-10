<script lang="ts">
  import { onMount } from "svelte";
  import { CIRCLE, DIMENSIONS, MAX_ZOOM, MIN_ZOOM, SCROLL_SENSITIVITY } from "./consts";
  import { add, clamp, forXY, notInBounds, sub, toXY } from "./utility";
  import { isEyeDropping, pickedHexColor, hoveredPixelColor, pickedPixelPosition } from "./store";
  import type { UserPixel } from "./types";

  export let data: ImageBitmap;
  export let showPixel: boolean;
  export let userAssignedPixels: UserPixel[] = [];
  
  let width = window.innerWidth;
	let height = window.innerHeight;
  
  let canvas: HTMLCanvasElement;
  let zoom = 1;
  let isDragging = false;
  let [offset, dragStart, mousePos] = 
    Array.from({ length: 3 }, () => ({ x: 0, y: 0 }));
  
  $: origin = {
    x: Math.round((width - DIMENSIONS) / 2),
    y: Math.round((height - DIMENSIONS) / 2)
  };
  $: adjustedMousePos = {
    x: Math.round((mousePos.x - offset.x) / zoom),
    y: Math.round((mousePos.y - offset.y) / zoom),
  };
  $: pixelScreenPos = add($pickedPixelPosition, origin);
  $: canvasPixelPos = sub(adjustedMousePos, origin);
  
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

  const handlePointerUp = () => isDragging = false;

  function handleContextMenu() {
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
  
  onMount(() => {
    const context = canvas.getContext('2d');
    
    let anime = requestAnimationFrame(async function update() {
      const now = new Date();
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

        [4, 10, 16].forEach(r => {
          context.beginPath();
          context.arc(pixelScreenPos.x + .5, pixelScreenPos.y + .5, r, 0, CIRCLE);
          context.stroke();
        });
        now.getSeconds() % 2 && context.fillRect(pixelScreenPos.x, pixelScreenPos.y, 1, 1);
      }

      context.restore();
      if ($isEyeDropping)
        $hoveredPixelColor = context.getImageData(mousePos.x, mousePos.y, 1, 1).data;
      
      anime = requestAnimationFrame(update);
    });
  
    return () => cancelAnimationFrame(anime);  
  });
</script>

<svelte:window bind:innerWidth={width} bind:innerHeight={height} />
<canvas bind:this={canvas} {width} {height}
  style:cursor={$isEyeDropping ? 'cell' : `grab${isDragging ? 'bing' : ''}`}
  on:mousedown={handlePointerDown} on:mouseup={handlePointerUp} on:pointermove={handlePointerMove}
  on:wheel|preventDefault={handleWheel} on:contextmenu|preventDefault={handleContextMenu} />
<style>
  canvas {
    background: #111;
  }
</style>