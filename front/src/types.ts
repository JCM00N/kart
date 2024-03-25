export interface Pixel {
  key: string,
  rgb: {int: number}
};

export interface Point {
  x: number,
  y: number
};

export type UserPixel = Point & {color: string};

type Request = (msg: {method: string, networkId: string, data?: any}) => Promise<any>;

export type Unpromise<T extends Promise<any>> = T extends Promise<infer U> ? U : never;

declare global {
  interface Window {
    EyeDropper: {
      new(): EyeDropper
    };
    kadena?: {
      request: Request
    };
    koala?: {
      request: Request
    }
  }
}

interface EyeDropper {
  open(): Promise<{sRGBHex: string}>
}