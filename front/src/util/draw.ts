import { CIRCLE, DIMENSIONS } from "./consts";
import type { Point } from "src/types";
import { pickedHexColor } from "./store";
import { get } from "svelte/store";

const CIRCLES = Object.entries({
  4: 0,
  10: 3.9,
  16: 2,
}).map(([k, v]) => ([+k, v]));

export function drawTarget(context: CanvasRenderingContext2D, position: Point, isSigning: boolean) {
  const now = new Date();
  context.fillStyle = context.strokeStyle = get(pickedHexColor);

  CIRCLES.forEach(([r, dashSize]) => {
    context.beginPath();
    
    context.lineDashOffset = now.getMilliseconds() / 125;
    context.lineWidth = 1.5;
    context.setLineDash([dashSize]);

    context.arc(position.x + .5, position.y + .5, r, 0, CIRCLE, r === 10);
    context.stroke();
  });

  !isSigning && context.setLineDash([]);
  for (let i = 0; i < 4; ++i) {
    const funcs = [Math.sin, Math.cos];
    const delta = -(now.getTime() % 3100) / 1960;
    const [sins, coss] = i > 1 ? funcs.reverse() : funcs;
    const yDiff = sins(delta) * (i % 2 ? -1 : 1);
    const xDiff = coss(delta) * ([1, 2].includes(i) ? 1 : -1);

    context.beginPath();
    context.moveTo(position.x + 20 * xDiff, position.y - 20 * yDiff);
    context.lineTo(position.x + 25 * xDiff, position.y - 25 * yDiff);
    context.stroke();
  }
  
  now.getSeconds() % 2 && context.fillRect(position.x, position.y, 1, 1);
}

export function preapreCanvas(
  context: CanvasRenderingContext2D, width: number, height: number, offset: Point, zoom: number
) {
  context.save();
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, width, height);
  context.translate(offset.x, offset.y);
  context.scale(zoom, zoom);
}

export function drawBorder(context: CanvasRenderingContext2D, origin: Point) {
  context.lineWidth = 1;
  context.strokeStyle = 'white';
  context.strokeRect(origin.x, origin.y, DIMENSIONS, DIMENSIONS);
}