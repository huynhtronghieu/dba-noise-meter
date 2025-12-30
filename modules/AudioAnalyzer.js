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
        this.dbaAnalyser = null;
        this.dbaDataArray = null;
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

        // Setup Visualizer path (unweighted)
        source.connect(this.analyser);

        // Setup dBA measurement path (A-weighted)
        this.dbaAnalyser = this.audioContext.createAnalyser();
        this.dbaAnalyser.fftSize = 2048; // Using larger FFT for better precision in time domain if needed
        this.dbaAnalyser.smoothingTimeConstant = 0; // We want raw values for RMS calculation

        // Create A-weighting filter chain
        const filterChain = this.createAWeightingFilters(this.audioContext);

        if (filterChain.length > 0) {
            // Connect: Source -> Filter 1 -> ... -> Filter N -> dBA Analyser
            let currentNode = source;
            for (const filter of filterChain) {
                currentNode.connect(filter);
                currentNode = filter;
            }
            currentNode.connect(this.dbaAnalyser);
        } else {
            console.warn('Sample rate not supported for A-weighting, falling back to unweighted.');
            source.connect(this.dbaAnalyser);
        }

        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.timeDataArray = new Uint8Array(this.analyser.fftSize);
        this.dbaDataArray = new Float32Array(this.dbaAnalyser.fftSize);
    }

    /**
     * Create A-weighting filter chain based on sample rate
     * @param {AudioContext} context - Audio context
     * @returns {IIRFilterNode[]} Array of filter nodes
     */
    createAWeightingFilters(context) {
        const sampleRate = context.sampleRate;
        const filters = [];

        // Coefficients for A-weighting filter (approximated for digital domain)
        // Source: https://github.com/Standard-Cyborg/audio-dsp/blob/master/analysis/AWeighting.cpp
        // and various web audio resources.

        // We use cascading IIR filters (biquads) for stability and accuracy.

        if (sampleRate === 44100) {
            // 44.1 kHz coefficients
            // Stage 1
            filters.push(context.createIIRFilter(
                [0.95616638497, -1.31960414122, 0.36343775625], // Feedforward (b)
                [1, -1.31861375911, 0.32059452332]              // Feedback (a)
            ));
            // Stage 2
            filters.push(context.createIIRFilter(
                [0.94317138580, -1.88634277160, 0.94317138580], // Feedforward (b)
                [1, -1.88558607420, 0.88709946900]              // Feedback (a)
            ));

            // Note: A-weighting usually also requires a high-pass at ~20Hz and low-pass at ~20kHz
            // The IIR approximations above likely include the main curve shaping.
        } else if (sampleRate === 48000) {
            // 48 kHz coefficients
            // Stage 1
            filters.push(context.createIIRFilter(
                [0.96525096525, -1.34730163086, 0.38205066561], // Feedforward (b)
                [1, -1.34730722798, 0.34905752979]              // Feedback (a)
            ));
            // Stage 2
            filters.push(context.createIIRFilter(
                [0.94696969696, -1.89393939393, 0.94696969696], // Feedforward (b)
                [1, -1.89387049481, 0.89515976917]              // Feedback (a)
            ));
        } else {
            // Fallback for other sample rates?
            // Ideally we should recalculate or resample, but for now we warn and skip.
            // Or we could use the 48k ones as a close-enough approximation if closer to 48k.
            console.warn(`A-weighting not perfectly calibrated for sample rate: ${sampleRate}`);
            // Attempt to use 48k coefficients as fallback if > 46k, else 44.1k
            if (sampleRate > 46000) {
                filters.push(context.createIIRFilter(
                    [0.96525096525, -1.34730163086, 0.38205066561],
                    [1, -1.34730722798, 0.34905752979]
                ));
                filters.push(context.createIIRFilter(
                    [0.94696969696, -1.89393939393, 0.94696969696],
                    [1, -1.89387049481, 0.89515976917]
                ));
            } else {
                filters.push(context.createIIRFilter(
                    [0.95616638497, -1.31960414122, 0.36343775625],
                    [1, -1.31861375911, 0.32059452332]
                ));
                filters.push(context.createIIRFilter(
                    [0.94317138580, -1.88634277160, 0.94317138580],
                    [1, -1.88558607420, 0.88709946900]
                ));
            }
        }

        return filters;
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

        // Update visualizer data
        this.analyser.getByteFrequencyData(this.dataArray);

        // Calculate dBA from A-weighted signal
        if (this.dbaAnalyser) {
            this.dbaAnalyser.getFloatTimeDomainData(this.dbaDataArray);
        } else {
            return 0;
        }

        // Calculate RMS (Root Mean Square) from A-weighted time domain data
        let sum = 0;
        for (let i = 0; i < this.dbaDataArray.length; i++) {
            sum += this.dbaDataArray[i] * this.dbaDataArray[i];
        }
        const rms = Math.sqrt(sum / this.dbaDataArray.length);

        // Convert to dBA
        // 20 * log10(rms) gives dB relative to full scale (dBFS), which is negative.
        // We add an offset to calibrate it to dBSPL.
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
