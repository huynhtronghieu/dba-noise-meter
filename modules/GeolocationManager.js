/**
 * DBA Noise Meter - Geolocation Manager Module
 * Handles location services with retry logic
 */

import { GEOLOCATION_CONFIG, MESSAGES } from './constants.js';

export class GeolocationManager {
    constructor() {
        this.latitude = null;
        this.longitude = null;
        this.watchId = null;
        this.onUpdate = null;  // Callback for location updates
    }

    /**
     * Set callback for location updates
     * @param {Function} callback - Called with location string
     */
    setUpdateCallback(callback) {
        this.onUpdate = callback;
    }

    /**
     * Get current coordinates
     * @returns {{latitude: string|null, longitude: string|null}}
     */
    getCoordinates() {
        return {
            latitude: this.latitude,
            longitude: this.longitude
        };
    }

    /**
     * Check if location is available
     * @returns {boolean}
     */
    hasLocation() {
        return this.latitude !== null && this.longitude !== null;
    }

    /**
     * Start getting geolocation
     */
    start() {
        if (!('geolocation' in navigator)) {
            this.notify(MESSAGES.geolocation.notSupported);
            return;
        }

        this.notify(MESSAGES.geolocation.loading);
        this.tryGetPosition(true, 0);
    }

    /**
     * Try to get position with retry logic
     * @private
     */
    tryGetPosition(highAccuracy, retryCount) {
        navigator.geolocation.getCurrentPosition(
            (position) => this.handleSuccess(position),
            (error) => this.handleError(error, highAccuracy, retryCount),
            {
                enableHighAccuracy: highAccuracy,
                timeout: highAccuracy ? GEOLOCATION_CONFIG.highAccuracyTimeout : GEOLOCATION_CONFIG.lowAccuracyTimeout,
                maximumAge: GEOLOCATION_CONFIG.maximumAge
            }
        );
    }

    /**
     * Handle successful position retrieval
     * @private
     */
    handleSuccess(position) {
        this.latitude = position.coords.latitude.toFixed(6);
        this.longitude = position.coords.longitude.toFixed(6);
        this.notify(`${this.latitude}, ${this.longitude}`);

        // Start watching for updates
        this.startWatching();
    }

    /**
     * Handle geolocation error with retry logic
     * @private
     */
    handleError(error, highAccuracy, retryCount) {
        console.error('Geolocation error:', error.code, error.message);

        // Error codes: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
        if (error.code === 2 && highAccuracy && retryCount < GEOLOCATION_CONFIG.maxRetries) {
            // Try with low accuracy (network-based)
            console.log('Retrying with low accuracy...');
            this.notify(MESSAGES.geolocation.loadingNetwork);
            this.tryGetPosition(false, retryCount + 1);
        } else if (error.code === 3 && retryCount < GEOLOCATION_CONFIG.maxRetries) {
            // Timeout, retry with longer timeout
            console.log('Retrying with longer timeout...');
            this.notify(MESSAGES.geolocation.retrying);
            this.tryGetPosition(highAccuracy, retryCount + 1);
        } else {
            this.handleFinalError(error);
        }
    }

    /**
     * Handle final error (no more retries)
     * @private
     */
    handleFinalError(error) {
        let message = MESSAGES.geolocation.error;

        switch (error.code) {
            case 1: // PERMISSION_DENIED
                message = MESSAGES.geolocation.permissionDenied;
                break;
            case 2: // POSITION_UNAVAILABLE
                message = MESSAGES.geolocation.unavailable;
                break;
            case 3: // TIMEOUT
                message = MESSAGES.geolocation.timeout;
                break;
        }

        this.notify(message);

        // Retry after delay if we don't have a position
        setTimeout(() => {
            if (!this.latitude) {
                console.log('Retrying geolocation after delay...');
                this.start();
            }
        }, GEOLOCATION_CONFIG.retryDelay);
    }

    /**
     * Start watching position for continuous updates
     * @private
     */
    startWatching() {
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.latitude = position.coords.latitude.toFixed(6);
                this.longitude = position.coords.longitude.toFixed(6);
                this.notify(`${this.latitude}, ${this.longitude}`);
            },
            (error) => {
                // Silent fail for watch updates - we already have a position
                console.warn('Watch position error:', error.message);
            },
            {
                enableHighAccuracy: false,
                timeout: GEOLOCATION_CONFIG.lowAccuracyTimeout,
                maximumAge: GEOLOCATION_CONFIG.watchMaximumAge
            }
        );
    }

    /**
     * Notify via callback
     * @private
     */
    notify(message) {
        if (this.onUpdate) {
            this.onUpdate(message);
        }
    }

    /**
     * Stop watching position
     */
    stop() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }
}
