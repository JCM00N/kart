import { writable, Writable } from 'svelte/store';

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

export const pickedHexColor = writable() as Writable<string>;
export const isEyeDropping = writable(false);
export const hoveredPixelColor = writable() as Writable<Uint8ClampedArray>;
export const pickedPixelPosition = writable({x: 0, y: 0});

export const accountName = localStorageWritable('accountName');
export const cooldownDate = localStorageWritable('cooldownDate');