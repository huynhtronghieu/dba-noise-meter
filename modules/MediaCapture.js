/**
 * DBA Noise Meter - Media Capture Module
 * Handles image capture and video recording
 */

import { RECORDING_CONFIG, MESSAGES } from './constants.js';
import { generateFilename, downloadBlob, isIOSDevice } from '../utils/helpers.js';
import { CanvasOverlay } from './CanvasOverlay.js';

export class MediaCapture {
    constructor() {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordingMimeType = '';
        this.recordCanvas = null;
        this.recordCtx = null;
        this.overlay = new CanvasOverlay();

        // Callbacks
        this.onRecordingStart = null;
        this.onRecordingStop = null;
        this.onToast = null;
    }

    /**
     * Set the recording canvas
     * @param {HTMLCanvasElement} canvas 
     */
    setRecordCanvas(canvas) {
        this.recordCanvas = canvas;
        this.recordCtx = canvas.getContext('2d');
    }

    /**
     * Set callback handlers
     */
    setCallbacks({ onRecordingStart, onRecordingStop, onToast }) {
        this.onRecordingStart = onRecordingStart;
        this.onRecordingStop = onRecordingStop;
        this.onToast = onToast;
    }

    /**
     * Capture a still image with overlay
     * @param {HTMLVideoElement} camera - Video element
     * @param {Object} overlayData - Data for overlay
     */
    captureImage(camera, overlayData) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size to video size
        canvas.width = camera.videoWidth;
        canvas.height = camera.videoHeight;

        // Draw video frame
        ctx.drawImage(camera, 0, 0);

        // Draw overlay
        this.overlay.draw(ctx, canvas.width, canvas.height, overlayData);

        // Create filename and download
        const filename = generateFilename('IMG', 'png', overlayData.latitude, overlayData.longitude);

        canvas.toBlob((blob) => {
            downloadBlob(blob, filename);
            this.toast(`${MESSAGES.capture.saved}: ${filename}`, 'success');
        }, 'image/png');
    }

    /**
     * Toggle recording state
     * @param {HTMLVideoElement} camera - Video element
     * @param {MediaStream} stream - Media stream
     * @param {Function} getOverlayData - Function to get current overlay data
     */
    async toggleRecording(camera, stream, getOverlayData) {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording(camera, stream, getOverlayData);
        }
    }

    /**
     * Start video recording
     * @private
     */
    async startRecording(camera, stream, getOverlayData) {
        try {
            this.recordedChunks = [];

            // Wait for video to be ready
            if (camera.readyState < 2) {
                await new Promise((resolve) => {
                    camera.addEventListener('loadeddata', resolve, { once: true });
                });
            }

            // Setup record canvas with fallback dimensions
            const videoWidth = camera.videoWidth || RECORDING_CONFIG.defaultWidth;
            const videoHeight = camera.videoHeight || RECORDING_CONFIG.defaultHeight;

            console.log('Recording dimensions:', videoWidth, 'x', videoHeight);

            if (videoWidth === 0 || videoHeight === 0) {
                throw new Error('Video dimensions not available');
            }

            this.recordCanvas.width = videoWidth;
            this.recordCanvas.height = videoHeight;

            // Create a stream from the canvas
            const canvasStream = this.recordCanvas.captureStream(RECORDING_CONFIG.frameRate);

            // Add audio track from the original stream
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                canvasStream.addTrack(audioTrack);
            }

            // Select mime type
            const mimeType = this.selectMimeType();
            console.log('Using mimeType:', mimeType || 'default');
            this.recordingMimeType = mimeType;

            const options = mimeType ? { mimeType } : {};
            this.mediaRecorder = new MediaRecorder(canvasStream, options);

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                    console.log('Recorded chunk:', event.data.size, 'bytes');
                }
            };

            this.mediaRecorder.onstop = () => {
                this.saveRecording(getOverlayData());
            };

            // Set recording state
            this.isRecording = true;

            // Start drawing to record canvas
            this.startRecordingCanvas(camera, getOverlayData);

            // Start recording
            this.mediaRecorder.start(RECORDING_CONFIG.timeslice);

            // Notify
            if (this.onRecordingStart) this.onRecordingStart();
            this.toast(MESSAGES.recording.started, 'success');

        } catch (error) {
            console.error('Error starting recording:', error);
            this.toast(MESSAGES.recording.error, 'error');
        }
    }

    /**
     * Select appropriate mime type for recording
     * @private
     */
    selectMimeType() {
        const mimeTypes = isIOSDevice()
            ? RECORDING_CONFIG.iosMimeTypes
            : RECORDING_CONFIG.defaultMimeTypes;

        for (const type of mimeTypes) {
            if (type === '' || MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return '';
    }

    /**
     * Start canvas drawing loop for recording
     * @private
     */
    startRecordingCanvas(camera, getOverlayData) {
        const drawFrame = () => {
            if (!this.isRecording) return;

            // Draw video frame
            this.recordCtx.drawImage(camera, 0, 0);

            // Draw overlay
            const overlayData = getOverlayData();
            this.overlay.draw(this.recordCtx, this.recordCanvas.width, this.recordCanvas.height, overlayData);

            requestAnimationFrame(drawFrame);
        };

        drawFrame();
    }

    /**
     * Stop recording
     */
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        this.isRecording = false;

        if (this.onRecordingStop) this.onRecordingStop();
    }

    /**
     * Save recorded video
     * @private
     */
    saveRecording(overlayData) {
        console.log('Saving recording, chunks:', this.recordedChunks.length);

        if (this.recordedChunks.length === 0) {
            this.toast(MESSAGES.recording.noData, 'error');
            return;
        }

        // Determine file type
        const isMP4 = this.recordingMimeType && this.recordingMimeType.includes('mp4');
        const blobType = isMP4 ? 'video/mp4' : 'video/webm';
        const extension = isMP4 ? 'mp4' : 'webm';

        const blob = new Blob(this.recordedChunks, { type: blobType });
        console.log('Blob size:', blob.size, 'bytes, type:', blobType);

        if (blob.size === 0) {
            this.toast(MESSAGES.recording.empty, 'error');
            return;
        }

        const filename = generateFilename('VID', extension, overlayData.latitude, overlayData.longitude);
        downloadBlob(blob, filename);

        this.toast(`${MESSAGES.recording.saved}: ${filename} (${Math.round(blob.size / 1024)} KB)`, 'success');
    }

    /**
     * Show toast notification
     * @private
     */
    toast(message, type) {
        if (this.onToast) {
            this.onToast(message, type);
        }
    }

    /**
     * Get recording state
     * @returns {boolean}
     */
    getIsRecording() {
        return this.isRecording;
    }
}
