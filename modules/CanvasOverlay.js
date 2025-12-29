/**
 * DBA Noise Meter - Canvas Overlay Module
 * Handles drawing overlay elements on captured images/videos
 */

import { OVERLAY_CONFIG, VISUALIZER_CONFIG } from './constants.js';
import { hexToRgba, formatDateTimeForOverlay } from '../utils/helpers.js';

export class CanvasOverlay {
    /**
     * Draw complete overlay on a canvas context
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {Object} data - Overlay data
     * @param {number} data.currentDBA - Current dBA value
     * @param {string} data.dbaColor - Color based on dBA level
     * @param {Object} data.level - Level info (text, class)
     * @param {string|null} data.latitude - Latitude
     * @param {string|null} data.longitude - Longitude
     * @param {boolean} data.isRecording - Recording state
     * @param {Uint8Array} data.frequencyData - Frequency data for visualizer
     * @param {Uint8Array} data.timeData - Time domain data for visualizer
     */
    draw(ctx, width, height, data) {
        const isPortrait = height > width;
        const { scale, fontSize, padding } = this.calculateScale(width, height, isPortrait);

        // Draw components
        this.drawDBABox(ctx, width, height, scale, fontSize, padding, isPortrait, data);
        this.drawInfoBox(ctx, width, height, scale, fontSize, padding, isPortrait, data);

        if (data.isRecording) {
            this.drawRecordingIndicator(ctx, width, height, scale, fontSize, padding, isPortrait, data);
        }

        this.drawMiniVisualizer(ctx, width, height, scale, padding, isPortrait, data);
        this.drawWatermark(ctx, width, height, scale, fontSize);
    }

    /**
     * Calculate scale factors based on dimensions
     * @private
     */
    calculateScale(width, height, isPortrait) {
        const baseWidth = isPortrait ? OVERLAY_CONFIG.baseWidthPortrait : OVERLAY_CONFIG.baseWidthLandscape;
        const baseScale = width / baseWidth;
        const scale = Math.max(OVERLAY_CONFIG.minScale, baseScale);
        const fontSize = Math.max(14, 22 * scale);
        const padding = Math.max(20, 30 * scale);

        return { scale, fontSize, padding };
    }

    /**
     * Draw DBA display box (top right)
     * @private
     */
    drawDBABox(ctx, width, height, scale, fontSize, padding, isPortrait, data) {
        const config = OVERLAY_CONFIG.dbaBox;
        const boxWidth = isPortrait ? config.widthPortrait * scale : config.widthLandscape * scale;
        const boxHeight = isPortrait ? config.heightPortrait * scale : config.heightLandscape * scale;
        const x = width - boxWidth - padding;
        const y = padding;

        // Background
        ctx.fillStyle = config.background;
        ctx.beginPath();
        ctx.roundRect(x, y, boxWidth, boxHeight, config.borderRadius * scale);
        ctx.fill();

        // Border
        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = config.borderWidth * scale;
        ctx.stroke();

        // DBA Value
        const dbaFontSize = isPortrait ? fontSize * 2.0 : fontSize * 2.8;
        ctx.fillStyle = data.dbaColor;
        ctx.font = `bold ${dbaFontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = data.dbaColor;
        ctx.shadowBlur = 15 * scale;
        ctx.fillText(Math.round(data.currentDBA), x + boxWidth / 2, y + boxHeight * 0.28);
        ctx.shadowBlur = 0;

        // dBA label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = `${fontSize * 0.85}px Arial`;
        ctx.fillText('dBA', x + boxWidth / 2, y + boxHeight * 0.52);

        // Level pill
        this.drawLevelPill(ctx, x, y, boxWidth, boxHeight, scale, fontSize, data);
    }

    /**
     * Draw level indicator pill
     * @private
     */
    drawLevelPill(ctx, boxX, boxY, boxWidth, boxHeight, scale, fontSize, data) {
        const levelText = data.level.text;
        ctx.font = `bold ${fontSize * 0.6}px Arial`;
        const levelWidth = Math.min(ctx.measureText(levelText).width + 20 * scale, boxWidth - 16 * scale);
        const levelHeight = 22 * scale;
        const levelX = boxX + (boxWidth - levelWidth) / 2;
        const levelY = boxY + boxHeight * 0.72;

        // Pill background
        ctx.fillStyle = hexToRgba(data.dbaColor, 0.3);
        ctx.beginPath();
        ctx.roundRect(levelX, levelY, levelWidth, levelHeight, 10 * scale);
        ctx.fill();

        // Pill text
        ctx.fillStyle = data.dbaColor;
        ctx.textAlign = 'center';
        ctx.fillText(levelText, boxX + boxWidth / 2, levelY + levelHeight / 2);
    }

    /**
     * Draw info box (top left) with date/time and location
     * @private
     */
    drawInfoBox(ctx, width, height, scale, fontSize, padding, isPortrait, data) {
        const config = OVERLAY_CONFIG.infoBox;
        const dbaConfig = OVERLAY_CONFIG.dbaBox;

        const dbaBoxWidth = isPortrait ? dbaConfig.widthPortrait * scale : dbaConfig.widthLandscape * scale;
        const boxWidth = isPortrait
            ? Math.min(config.widthPortrait * scale, width - dbaBoxWidth - padding * 3)
            : config.widthLandscape * scale;
        const boxHeight = isPortrait ? config.heightPortrait * scale : config.heightLandscape * scale;
        const x = padding;
        const y = padding;

        // Store for recording indicator positioning
        this._lastInfoBox = { x, y, width: boxWidth, height: boxHeight };
        this._lastDbaX = width - dbaBoxWidth - padding;

        // Background
        ctx.fillStyle = OVERLAY_CONFIG.dbaBox.background;
        ctx.beginPath();
        ctx.roundRect(x, y, boxWidth, boxHeight, config.borderRadius * scale);
        ctx.fill();

        // Border
        ctx.strokeStyle = OVERLAY_CONFIG.dbaBox.borderColor;
        ctx.lineWidth = OVERLAY_CONFIG.dbaBox.borderWidth * scale;
        ctx.stroke();

        // Date/time - using Unicode calendar symbol instead of emoji
        const now = new Date();
        const dateStr = formatDateTimeForOverlay(now);
        const infoFontSize = isPortrait ? fontSize * 0.7 : fontSize * 0.85;

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${infoFontSize}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('⏱ ' + dateStr, x + 8 * scale, y + boxHeight * 0.35);

        // Location - using Unicode pin symbol instead of emoji
        const locationStr = data.latitude && data.longitude
            ? `⌖ ${data.latitude}, ${data.longitude}`
            : '⌖ N/A';
        ctx.fillStyle = '#aaaaaa';
        ctx.font = `${infoFontSize * 0.9}px Arial`;
        ctx.fillText(locationStr, x + 8 * scale, y + boxHeight * 0.7);
    }

    /**
     * Draw recording indicator
     * @private
     */
    drawRecordingIndicator(ctx, width, height, scale, fontSize, padding, isPortrait, data) {
        const config = OVERLAY_CONFIG.recIndicator;
        const recWidth = isPortrait ? config.widthPortrait * scale : config.widthLandscape * scale;
        const recHeight = isPortrait ? config.heightPortrait * scale : config.heightLandscape * scale;

        const infoBox = this._lastInfoBox || { x: padding, width: 200 * scale, height: 50 * scale };
        const dbaX = this._lastDbaX || (width - 160 * scale - padding);

        const recX = infoBox.x + infoBox.width + 10 * scale;
        const recY = infoBox.y + (infoBox.height - recHeight) / 2;

        // Only draw if it fits
        if (recX + recWidth >= dbaX - 5 * scale) return;

        // Background
        ctx.fillStyle = config.background;
        ctx.beginPath();
        ctx.roundRect(recX, recY, recWidth, recHeight, recHeight / 2);
        ctx.fill();

        // Dot
        const dotRadius = 4 * scale;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(recX + recWidth * 0.3, recY + recHeight / 2, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        // REC text
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('REC', recX + recWidth * 0.65, recY + recHeight / 2);
    }

    /**
     * Draw mini visualizer for recordings
     * @private
     */
    drawMiniVisualizer(ctx, width, height, scale, padding, isPortrait, data) {
        if (!data.frequencyData || !data.timeData) return;

        const config = OVERLAY_CONFIG.miniVisualizer;
        const vizHeight = isPortrait ? config.heightPortrait * scale : config.heightLandscape * scale;
        const vizY = height - vizHeight - (isPortrait ? config.bottomOffsetPortrait * scale : config.bottomOffsetLandscape * scale);
        const vizPadding = Math.max(config.minPadding, width * config.paddingRatio);
        const vizX = vizPadding;
        const vizWidth = Math.min(width * config.maxWidthRatio, config.maxWidth * scale);

        // Save context state
        ctx.save();

        // Background with clip region
        ctx.beginPath();
        ctx.roundRect(vizX, vizY, vizWidth, vizHeight, config.borderRadius * scale);
        ctx.fillStyle = config.background;
        ctx.fill();
        ctx.clip();

        // Draw frequency bars
        const barCount = isPortrait ? VISUALIZER_CONFIG.barCountMobile : VISUALIZER_CONFIG.barCount;
        const innerPadding = config.innerPadding * scale;
        const totalBarSpace = vizWidth - innerPadding * 2;
        const barWidth = (totalBarSpace / barCount) - 1;

        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * (data.frequencyData.length / barCount));
            const maxBarHeight = vizHeight - innerPadding * 2;
            const barHeight = Math.max(2, (data.frequencyData[dataIndex] / 255) * maxBarHeight);
            const barX = vizX + innerPadding + i * (barWidth + 1);
            const barY = vizY + vizHeight - innerPadding - barHeight;

            // Gradient for bars
            const gradient = ctx.createLinearGradient(0, barY + barHeight, 0, barY);
            gradient.addColorStop(0, 'rgba(0, 255, 136, 0.9)');
            gradient.addColorStop(0.4, 'rgba(255, 255, 0, 0.9)');
            gradient.addColorStop(0.7, 'rgba(255, 153, 0, 0.9)');
            gradient.addColorStop(1, 'rgba(255, 68, 68, 0.9)');

            ctx.fillStyle = gradient;
            ctx.fillRect(barX, barY, barWidth - 1, barHeight);
        }

        // Draw waveform overlay
        ctx.lineWidth = 2 * scale;
        ctx.strokeStyle = data.dbaColor;
        ctx.beginPath();

        const waveformSamples = Math.min(data.timeData.length, VISUALIZER_CONFIG.waveformSamples);
        const sliceWidth = vizWidth / waveformSamples;
        let x = vizX;

        for (let i = 0; i < waveformSamples; i++) {
            const sampleIndex = Math.floor(i * data.timeData.length / waveformSamples);
            const v = data.timeData[sampleIndex] / 128.0;
            const y = vizY + vizHeight / 2 + ((v - 1) * vizHeight * 0.4);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.stroke();

        // Restore context
        ctx.restore();
    }

    /**
     * Draw watermark at bottom center
     * @private
     */
    drawWatermark(ctx, width, height, scale, fontSize) {
        const config = OVERLAY_CONFIG.watermark;

        ctx.fillStyle = config.color;
        ctx.font = `${fontSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(config.text, width / 2, height - config.bottomOffset * scale);
    }
}
