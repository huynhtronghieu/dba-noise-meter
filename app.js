/**
 * DBA Noise Meter Application
 * Main entry point - coordinates all modules
 * 
 * @version 2.0.0 (Refactored)
 */

import { CAMERA_CONFIG, MESSAGES } from './modules/constants.js';
import { AudioAnalyzer } from './modules/AudioAnalyzer.js';
import { Visualizer } from './modules/Visualizer.js';
import { GeolocationManager } from './modules/GeolocationManager.js';
import { MediaCapture } from './modules/MediaCapture.js';
import { UIController } from './modules/UIController.js';
import { installRoundRectPolyfill } from './utils/helpers.js';

class DBNoiseMeter {
    constructor() {
        // Install polyfills
        installRoundRectPolyfill();

        // Initialize modules
        this.ui = new UIController();
        this.audioAnalyzer = new AudioAnalyzer();
        this.visualizer = null;  // Will be initialized after UI
        this.geolocation = new GeolocationManager();
        this.mediaCapture = new MediaCapture();

        // State
        this.stream = null;
        this.facingMode = CAMERA_CONFIG.defaultFacingMode;
        this.animationFrame = null;

        // Initialize
        this.init();
    }

    async init() {
        // Initialize UI
        this.ui.init();

        // Setup visualizer with canvas element
        this.visualizer = new Visualizer(this.ui.getElement('visualizer'));

        // Setup media capture
        this.mediaCapture.setRecordCanvas(this.ui.getElement('recordCanvas'));
        this.mediaCapture.setCallbacks({
            onRecordingStart: () => this.ui.setRecordingState(true),
            onRecordingStop: () => this.ui.setRecordingState(false),
            onToast: (msg, type) => this.ui.showToast(msg, type)
        });

        // Setup geolocation
        this.geolocation.setUpdateCallback((text) => this.ui.updateLocation(text));
        this.geolocation.start();

        // Setup event listeners
        this.ui.setupEventListeners({
            onGrant: () => this.requestPermissions(),
            onCapture: () => this.captureImage(),
            onRecord: () => this.toggleRecording(),
            onSwitch: () => this.switchCamera(),
            onBuy: () => window.open('https://s.shopee.vn/an_redir?origin_link=https%3A%2F%2Fshopee.vn%2Fproduct%2F126607696%2F26808440653%3Fgads_t_sig%3DVTJGc2RHVmtYMTlxTFVSVVRrdENkUm9yWVZMbGw0Q214S0d1TzNEZmUwN2ZxdFJrNE1JZEhVRnJ3YTJ6YmhvNHdjQXNQdGxXdnQ5eEdCMFhNck1DQ0ViSEU3dlIweFBwMnp3RUlIdUtrdk1zbitNQnNZZkM3eW8yU1BPM3d5ZUFYYlRJNmJ6Vmg5R0haaE05b0g2bkx3PT0&sm=fb_partner&affiliate_id=17370240207', '_blank'),
            onResize: () => this.visualizer.resize()
        });

        // Check if permissions already granted
        await this.checkPermissions();
    }

    async checkPermissions() {
        try {
            const cameraPermission = await navigator.permissions.query({ name: 'camera' });
            const micPermission = await navigator.permissions.query({ name: 'microphone' });

            if (cameraPermission.state === 'granted' && micPermission.state === 'granted') {
                this.ui.setPermissionModalVisible(false);
                await this.startMedia();
            }
        } catch (e) {
            // Permissions API not supported, show modal
            console.log('Permissions API not supported');
        }
    }

    async requestPermissions() {
        try {
            await this.startMedia();
            this.ui.setPermissionModalVisible(false);
        } catch (error) {
            console.error('Permission denied:', error);
            this.ui.showToast(MESSAGES.permission.error, 'error');
        }
    }

    async startMedia() {
        try {
            // Stop existing stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }

            // Get camera and microphone
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: this.facingMode,
                    width: { ideal: CAMERA_CONFIG.idealWidth },
                    height: { ideal: CAMERA_CONFIG.idealHeight }
                },
                audio: true
            });

            this.ui.setCameraStream(this.stream);

            // Setup audio analysis
            this.audioAnalyzer.setup(this.stream);

            // Start visualization
            this.visualizer.resize();
            this.animate();

        } catch (error) {
            console.error('Error accessing media:', error);
            throw error;
        }
    }

    animate() {
        // Calculate DBA
        this.audioAnalyzer.calculateDBA();

        // Get display DBA (throttled)
        const displayDBA = this.audioAnalyzer.getDisplayDBA();
        const level = this.audioAnalyzer.getDBALevel(displayDBA);

        // Update UI
        this.ui.updateDBADisplay(displayDBA, level);

        // Draw visualizer
        this.visualizer.draw(
            this.audioAnalyzer.getTimeDomainData(),
            this.audioAnalyzer.getFrequencyData(),
            this.audioAnalyzer.getVisualizerColor()
        );

        // Continue animation
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    captureImage() {
        this.mediaCapture.captureImage(
            this.ui.getElement('camera'),
            this.getOverlayData()
        );
    }

    async toggleRecording() {
        await this.mediaCapture.toggleRecording(
            this.ui.getElement('camera'),
            this.stream,
            () => this.getOverlayData()
        );
    }

    /**
     * Get current overlay data for capture/recording
     * @returns {Object}
     */
    getOverlayData() {
        const coords = this.geolocation.getCoordinates();
        return {
            currentDBA: this.audioAnalyzer.getCurrentDBA(),
            dbaColor: this.audioAnalyzer.getVisualizerColor(),
            level: this.audioAnalyzer.getDBALevel(this.audioAnalyzer.getCurrentDBA()),
            latitude: coords.latitude,
            longitude: coords.longitude,
            isRecording: this.mediaCapture.getIsRecording(),
            frequencyData: this.audioAnalyzer.getFrequencyData(),
            timeData: this.audioAnalyzer.getTimeDomainData()
        };
    }

    async switchCamera() {
        this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';

        try {
            await this.startMedia();
            this.ui.showToast(MESSAGES.camera.switched, 'success');
        } catch (error) {
            console.error('Error switching camera:', error);
            // Revert facing mode
            this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
            this.ui.showToast(MESSAGES.camera.error, 'error');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DBNoiseMeter();
});
