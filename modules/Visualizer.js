/**
 * DBA Noise Meter - Web Visualizer Module
 * Handles real-time audio visualization on the web canvas
 */

import { VISUALIZER_CONFIG } from './constants.js';

export class Visualizer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Resize canvas to match display size (with device pixel ratio)
     */
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    /**
     * Draw the visualizer (waveform + frequency bars)
     * @param {Uint8Array} timeDataArray - Time domain data
     * @param {Uint8Array} dataArray - Frequency data
     * @param {string} color - Waveform color
     */
    draw(timeDataArray, dataArray, color) {
        if (!timeDataArray || !dataArray) return;

        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;

        // Clear canvas
        this.ctx.fillStyle = VISUALIZER_CONFIG.colors.background;
        this.ctx.fillRect(0, 0, width, height);

        // Draw waveform
        this.drawWaveform(timeDataArray, width, height, color);

        // Draw frequency bars
        this.drawFrequencyBars(dataArray, width, height);
    }

    /**
     * Draw waveform line
     * @private
     */
    drawWaveform(timeDataArray, width, height, color) {
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();

        const sliceWidth = width / timeDataArray.length;
        let x = 0;

        for (let i = 0; i < timeDataArray.length; i++) {
            const v = timeDataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.ctx.lineTo(width, height / 2);
        this.ctx.stroke();
    }

    /**
     * Draw frequency bars
     * @private
     */
    drawFrequencyBars(dataArray, width, height) {
        const barCount = VISUALIZER_CONFIG.barCount;
        const barWidth = width / barCount;
        const barSpacing = VISUALIZER_CONFIG.barSpacing;

        for (let i = 0; i < barCount; i++) {
            const barHeight = (dataArray[i * 4] / 255) * height * 0.8;
            const barX = i * (barWidth + barSpacing);

            const gradient = this.ctx.createLinearGradient(0, height, 0, height - barHeight);
            VISUALIZER_CONFIG.colors.barGradient.forEach(({ stop, color }) => {
                gradient.addColorStop(stop, color);
            });

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(barX, height - barHeight, barWidth, barHeight);
        }
    }
}
