import { ImageFormat } from './types.ts';
export declare class ImageRenderer {
    private readonly matrix;
    private readonly modsize;
    private readonly margin;
    constructor(matrix: (number | null)[][], modsize: number, margin: number);
    render(format: ImageFormat): HTMLElement | HTMLCanvasElement;
    private renderPNG;
    private renderSVG;
    /**
     * Renders the QR code as an HTML div using CSS Grid.
     * This avoids the issues with table scaling and inline styles.
     */
    private renderHTML;
}
