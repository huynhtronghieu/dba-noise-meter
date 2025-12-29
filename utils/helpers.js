/**
 * DBA Noise Meter - Utility Functions
 */

/**
 * Convert hex color to rgba
 * @param {string} hex - Hex color string (e.g., '#ff0000')
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} RGBA color string
 */
export function hexToRgba(hex, alpha = 1) {
    if (!hex.startsWith('#')) return hex;

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Format date for display
 * @param {Date} date - Date object
 * @param {string} locale - Locale string
 * @returns {string} Formatted date string
 */
export function formatDateTime(date, locale = 'vi-VN') {
    return date.toLocaleString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

/**
 * Format date for overlay (different order)
 * @param {Date} date - Date object
 * @param {string} locale - Locale string
 * @returns {string} Formatted date string
 */
export function formatDateTimeForOverlay(date, locale = 'vi-VN') {
    return date.toLocaleString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: false
    });
}

/**
 * Generate filename with date and optional location
 * @param {string} prefix - Filename prefix (e.g., 'IMG', 'VID')
 * @param {string} extension - File extension
 * @param {string|null} latitude - Latitude
 * @param {string|null} longitude - Longitude
 * @returns {string} Generated filename
 */
export function generateFilename(prefix, extension, latitude = null, longitude = null) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace(/[-:T]/g, '');
    const locationStr = latitude && longitude
        ? `_${latitude}_${longitude}`.replace(/\./g, '-')
        : '';

    return `${prefix}_${dateStr}${locationStr}.${extension}`;
}

/**
 * Check if device is iOS
 * @returns {boolean} True if iOS device
 */
export function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Download blob as file
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Filename
 */
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Polyfill for CanvasRenderingContext2D.roundRect
 */
export function installRoundRectPolyfill() {
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            this.closePath();
            return this;
        };
    }
}
