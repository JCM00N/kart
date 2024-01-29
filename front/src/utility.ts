import { DIMENSIONS } from "./consts";
import { pixelMap } from "./store";
import type { Pixel, Point } from './types';

export const clamp = (min: number, n: number, max: number) => Math.max(min, Math.min(n, max));

export const notInBounds = (p: Point) => p.x > DIMENSIONS || p.y > DIMENSIONS || p.x < 0 || p.y < 0;

export const forXY = (action: (action: string) => void) => ['x', 'y'].forEach(action);

export const toXY = (e: MouseEvent) => ({x: e.clientX, y: e.clientY});

export const add = (a: Point, b: Point = {x: 0, y: 0}) => ({x: a.x + b.x, y: a.y + b.y});
export const sub = (a: Point, b: Point = {x: 0, y: 0}) => ({x: a.x - b.x, y: a.y - b.y});

export async function createImage(data: Pixel[]) {
  const pixelMap = {};
  for (const {key, rgb: {int}} of data)
    pixelMap[key] = int;
  
  const img = new Uint8ClampedArray(DIMENSIONS * DIMENSIONS * 4);
  for (let x = 0; x < DIMENSIONS; ++x) 
    for (let y = 0; y < DIMENSIONS; ++y) {
      const index = (y * DIMENSIONS + x) << 2;
      for (let i = 2, pixel = pixelMap[`${x}_${y}`] ?? 0; i >= 0; --i, pixel >>= 8)
        img[index + i] = pixel % 256;
      img[index + 3] = 255;
    }

  return [pixelMap, await createImageBitmap(new ImageData(img, DIMENSIONS, DIMENSIONS))];
}

export const pixelMap = {};
const img = new Uint8ClampedArray(DIMENSIONS * DIMENSIONS * 4);
export const image = new ImageData(img, DIMENSIONS, DIMENSIONS);
image.data.set()
export async function createImage2(data: any[], fromX: number, fromY: number, size: number) {
  const toX = fromX + size, toY = fromY + size;
  for (let x = fromX, i = 0; x < toX; ++x)
    for (let y = fromY; y < toY; ++y, ++i) {
      let pixel = data[i].int;
      const index = (y * DIMENSIONS + x) << 2;

      for (let i = 2; i >= 0; --i, pixel >>= 8)
        img[index + i] = pixel % 256;
      img[index + 3] = 255;

      if (pixel)
        pixelMap[`${x}_${y}`] = pixel;
    }
  return [pixelMap, await createImageBitmap(new ImageData(img, DIMENSIONS, DIMENSIONS))];
}