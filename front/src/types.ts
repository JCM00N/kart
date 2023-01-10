export interface Pixel {
  key: string,
  rgb: {int: number}
};

export interface Point {
  x: number,
  y: number
};

export type UserPixel = Point & {color: string};

declare global {
  interface Window {
    EyeDropper: {
      new(): EyeDropper
    }; 
  }
}

interface EyeDropper {
  open(): Promise<{sRGBHex: string}>
}