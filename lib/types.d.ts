import { IMAGE_FORMATS } from './constants';
export type Mode = 1 | 2 | 4 | -1;
export type Eccl = 0 | 1 | 2 | 3 | -1;
export type Mask = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | -1;
export type ImageFormat = (typeof IMAGE_FORMATS)[number];
export interface QROptions {
    text?: string;
    mode?: Mode;
    eccl?: Eccl;
    version?: number;
    mask?: Mask;
    image?: ImageFormat;
    modsize?: number;
    margin?: number;
}
export interface QRCodeData {
    text: string;
    mode: Mode;
    eccl: Eccl;
    version: number;
    mask: Mask;
    matrix: (number | null)[][];
    modsize: number;
    margin: number;
}
export interface QRCode {
    text: string;
    mode: Mode;
    eccl: Eccl;
    version: number;
    mask: Mask;
    matrix: (number | null)[][];
    modsize: number;
    margin: number;
    result: HTMLElement | HTMLCanvasElement | SVGElement | null;
    error: string;
    errorSubcode: string;
    download: (filename?: string, image?: ImageFormat) => void;
}
