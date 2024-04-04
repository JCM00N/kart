import { writable, Writable } from 'svelte/store';
import { spring } from 'svelte/motion';

function localStorageWritable(key: string) {
  const item = writable(localStorage.getItem(key));

  let firedFirst = false;
  item.subscribe(val => {
    if (firedFirst)
      localStorage.setItem(key, val);
    else 
      firedFirst = true;
  });

  return item;
}

const bigWatcher = window.matchMedia('(min-width: 480px)');
const pointerWatcher = window.matchMedia('(pointer: fine)');
export const isBig = writable(bigWatcher.matches);
export const isPointer = writable(pointerWatcher.matches);
export const balance = writable(0);
export const pickedHexColor = writable() as Writable<string>;
export const isEyeDropping = writable(false);
export const isPixelTaken = writable(false);
export const hoveredPixelColor = writable() as Writable<Uint8ClampedArray>;
export const pickedPixelPosition = writable({x: 0, y: 0});
export const springedPixelPosition = spring({x: 0, y: 0}, {stiffness: .1, damping: .43});
export const wallet = writable(window.kadena ? 'kadena' : (window.koala ? 'koala' : 'wc'));
pickedPixelPosition.subscribe(springedPixelPosition.set);

export const accountName = localStorageWritable('accountName');
export const cooldownDate = localStorageWritable('cooldownDate');

bigWatcher.addEventListener('change', e => isBig.set(e.matches));
pointerWatcher.addEventListener('change', e => isPointer.set(e.matches));