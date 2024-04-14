<script lang="ts">
  import { onMount } from "svelte";
  import { pinch } from "svelte-gestures";
  import dbltap from "./util/dbltap";
  import { DIMENSIONS, MAX_ZOOM, MIN_ZOOM, SCROLL_SENSITIVITY } from "./util/consts";
  import { add, clamp, forXY, notInBounds, sub, toXY } from "./util/utility";
  import { 
    isEyeDropping, isPixelTaken,
    pickedHexColor, hoveredPixelColor,
    pickedPixelPosition, springedPixelPosition
  } from "./util/store";
  import type { UserPixel } from "./types";
  import { txStatus } from "./util/pact";
  import { drawBorder, drawTarget, preapreCanvas } from "./util/draw";

  export let data: ImageBitmap;
  export let showPixel: boolean;
  export let pixelMap: object;
  export let userAssignedPixels: UserPixel[] = [];
  
  let width = window.innerWidth;
	let height = window.innerHeight;
  let pointerCount = 0;
  const keyPresses = {} as {[key: string]: boolean | undefined};
  
  let canvas: HTMLCanvasElement;
  let zoom = 1, prevBy = 1;
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
  
  function handlePointerDown(e: PointerEvent) {
    if (e.button === 2) return; // Right click

    if ($isEyeDropping) {
      $pickedHexColor = '#' + Array.from($hoveredPixelColor.slice(0, 3))
        .map(n => n.toString(16).padStart(2, '0')).join('');
      $isEyeDropping = false;
    } else if (++pointerCount === 1) {
      isDragging = true;
      const pos = toXY(e);
      forXY(xy => dragStart[xy] = pos[xy] / zoom - offset[xy]);
    } else isDragging = false;
  }

  function handlePointerUp() {
    if (!isDragging) return;

    isDragging = false;
    --pointerCount;
  }

  function handlePointerMove(e: MouseEvent) {
    const pos = toXY(e);
    forXY(xy => mousePos[xy] = pos[xy]);
    if (isDragging)
      forXY(xy => offset[xy] = pos[xy] / zoom - dragStart[xy]);
  }

  function handleOpenMenu(point = canvasPixelPos) {
    if (point.x !== canvasPixelPos.x && point.y !== canvasPixelPos.y)
      point = sub({
        x: Math.round((point.x - offset.x) / zoom),
        y: Math.round((point.y - offset.y) / zoom)
      }, origin);
    
    if (notInBounds(point)) return;

    $pickedPixelPosition = {...point};
    showPixel = true;
  }

  function zoomInOut(by: number, from = adjustedMousePos, isStacked = false) {
    if (isDragging) return;

    const actualChange = isStacked ? prevBy - by : by;
    const prevZoom = zoom;
    prevBy = by;
    if (isStacked && Math.abs(actualChange) > 0.1) return; // Fix issue with use:pinch lib
    zoom = clamp(MIN_ZOOM, zoom - actualChange, MAX_ZOOM);

    if (zoom === prevZoom) return;
    forXY(xy => offset[xy] += actualChange * from[xy]);
  }

  const handleWheel = (e: WheelEvent) => zoomInOut(e.deltaY * SCROLL_SENSITIVITY);

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
    canvas.onpointerleave = canvas.onpointerup = handlePointerUp;

    let anime = requestAnimationFrame(function update() {
      preapreCanvas(context, width, height, offset, zoom);
      context.drawImage(data, origin.x, origin.y);
      drawBorder(context, origin);

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
  on:pointerdown={handlePointerDown} on:pointermove={handlePointerMove}
  on:wheel|preventDefault={handleWheel} on:contextmenu|preventDefault={handleOpenMenu}
  on:dblclick={handleOpenMenu} use:dbltap on:dbltap={p => handleOpenMenu(p.detail)}
  use:pinch on:pinch={e => zoomInOut(e.detail.scale, e.detail.center, true)}
/>