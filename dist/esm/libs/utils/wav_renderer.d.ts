export declare const WavRenderer: {
    /**
     * Renders a point-in-time snapshot of an audio sample, usually frequency values
     * @param canvas
     * @param ctx
     * @param data
     * @param color
     * @param pointCount number of bars to render
     * @param barWidth width of bars in px
     * @param barSpacing spacing between bars in px
     * @param center vertically center the bars
     */
    drawBars: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, data: Float32Array, color: string, pointCount?: number, barWidth?: number, barSpacing?: number, center?: boolean) => void;
};
//# sourceMappingURL=wav_renderer.d.ts.map