import { writable } from "svelte/store";
import { DIMENSIONS } from "./consts";
import type { Point } from '../types';

export const clamp = (min: number, n: number, max: number) => Math.max(min, Math.min(n, max));

export const notInBounds = (p: Point) => p.x > DIMENSIONS || p.y > DIMENSIONS || p.x < 0 || p.y < 0;

export const forXY = (action: (action: string) => void) => ['x', 'y'].forEach(action);

export const toXY = (e: MouseEvent) => ({x: e.clientX, y: e.clientY});

export const add = (a: Point, b: Point = {x: 0, y: 0}) => ({x: a.x + b.x, y: a.y + b.y});
export const sub = (a: Point, b: Point = {x: 0, y: 0}) => ({x: a.x - b.x, y: a.y - b.y});

const pxlMap = {};
const imageData = new Uint8ClampedArray(DIMENSIONS * DIMENSIONS * 4);
export const img = writable(imageData);
export const pixelMap = writable(pxlMap);

export function createImage(data: {int: number}[], fromX: number, fromY: number, size: number) {
  const toX = fromX + size, toY = fromY + size;
  for (let x = fromX, i = 0; x < toX; ++x)
    for (let y = fromY; y < toY; ++y, ++i) {
      const PIXEL = data[i].int;
      let pixel = PIXEL;
      const index = (y * DIMENSIONS + x) << 2;

      for (let n = 2; n >= 0; --n, pixel >>= 8)
        imageData[index + n] = pixel % 256;
      imageData[index + 3] = 255;

      pxlMap[`${x}_${y}`] = PIXEL < 0 ? null : PIXEL;
    }

    pixelMap.set(pxlMap);
    img.set(imageData);
}

export let aborter: AbortController;
export const abortable = <T>(p: Promise<T>) => new Promise((resolve, reject) => {
  aborter = new AbortController();
  aborter.signal.addEventListener('abort', () => reject({message: 'Aborted'}), {once: true});
  p.then(resolve).catch(reject);
}) as Promise<T>;