/**
 * DBA Noise Meter - Audio Analyzer Module
 * Handles audio context, dBA calculation, and frequency analysis
 */

import { AUDIO_CONFIG, DBA_LEVELS } from './constants.js';
import { clamp } from '../utils/helpers.js';

export class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.timeDataArray = null;
        this.currentDBA = 0;
        this.displayDBA = 0;
        this.lastDisplayUpdate = 0;
    }

    /**
     * Initialize audio analysis from a media stream
     * @param {MediaStream} stream - Media stream with audio track
     */
    setup(stream) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = this.audioContext.createMediaStreamSource(stream);

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = AUDIO_CONFIG.fftSize;
        this.analyser.smoothingTimeConstant = AUDIO_CONFIG.smoothingTimeConstant;

        source.connect(this.analyser);

        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.timeDataArray = new Uint8Array(this.analyser.fftSize);
    }

    /**
     * Check if analyzer is ready
     * @returns {boolean}
     */
    isReady() {
        return this.analyser !== null;
    }

    /**
     * Calculate current dBA level
     * @returns {number} Rounded dBA value
     */
    calculateDBA() {
        if (!this.analyser) return 0;

        this.analyser.getByteFrequencyData(this.dataArray);

        // Calculate RMS (Root Mean Square) from frequency data
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i] * this.dataArray[i];
        }
        const rms = Math.sqrt(sum / this.dataArray.length);

        // Convert to approximate dBA
        // This is a simplified calculation - real dBA requires proper A-weighting
        // and calibration with a reference microphone
        const dba = 20 * Math.log10(rms / 1) + AUDIO_CONFIG.dbaOffset;

        // Clamp values
        const clampedDBA = clamp(dba, AUDIO_CONFIG.minDBA, AUDIO_CONFIG.maxDBA);

        // Smooth the value (weighted average)
        this.currentDBA = this.currentDBA * AUDIO_CONFIG.dbaSmoothing +
            clampedDBA * (1 - AUDIO_CONFIG.dbaSmoothing);

        return Math.round(this.currentDBA);
    }

    /**
     * Get dBA for display (throttled updates for readability)
     * @returns {number} Display dBA value
     */
    getDisplayDBA() {
        const now = Date.now();
        if (!this.lastDisplayUpdate || now - this.lastDisplayUpdate >= AUDIO_CONFIG.displayUpdateInterval) {
            this.displayDBA = Math.round(this.currentDBA);
            this.lastDisplayUpdate = now;
        }
        return this.displayDBA || Math.round(this.currentDBA);
    }

    /**
     * Get current raw dBA value
     * @returns {number}
     */
    getCurrentDBA() {
        return this.currentDBA;
    }

    /**
     * Get DBA level info (text and CSS class)
     * @param {number} dba - DBA value
     * @returns {{text: string, class: string, color: string}}
     */
    getDBALevel(dba) {
        for (const level of DBA_LEVELS) {
            if (dba < level.max) {
                return { text: level.text, class: level.class, color: level.color };
            }
        }
        // Fallback to last level
        const last = DBA_LEVELS[DBA_LEVELS.length - 1];
        return { text: last.text, class: last.class, color: last.color };
    }

    /**
     * Get visualizer color based on current dBA
     * @returns {string} Hex color
     */
    getVisualizerColor() {
        const level = this.getDBALevel(this.currentDBA);
        return level.color;
    }

    /**
     * Get frequency data array
     * @returns {Uint8Array}
     */
    getFrequencyData() {
        if (this.analyser) {
            this.analyser.getByteFrequencyData(this.dataArray);
        }
        return this.dataArray;
    }

    /**
     * Get time domain (waveform) data array
     * @returns {Uint8Array}
     */
    getTimeDomainData() {
        if (this.analyser) {
            this.analyser.getByteTimeDomainData(this.timeDataArray);
        }
        return this.timeDataArray;
    }

    /**
     * Clean up audio context
     */
    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.analyser = null;
        this.dataArray = null;
        this.timeDataArray = null;
    }
}
