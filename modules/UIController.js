/**
 * DBA Noise Meter - UI Controller Module
 * Handles DOM interactions and UI state management
 */

import { UI_CONFIG, MESSAGES } from './constants.js';
import { formatDateTime } from '../utils/helpers.js';

export class UIController {
    constructor() {
        // DOM Elements - will be initialized in init()
        this.elements = {};
        this.dateTimeInterval = null;
    }

    /**
     * Initialize UI controller with DOM elements
     */
    init() {
        this.elements = {
            // Video/Canvas
            camera: document.getElementById('camera'),
            recordCanvas: document.getElementById('recordCanvas'),
            visualizer: document.getElementById('visualizer'),

            // DBA Display
            dbaValue: document.getElementById('dba-value'),
            dbaLevel: document.getElementById('dba-level'),
            dbaContainer: document.getElementById('dba-container'),

            // Info Display
            datetimeText: document.getElementById('datetime-text'),
            locationText: document.getElementById('location-text'),

            // Indicators
            recordingIndicator: document.getElementById('recording-indicator'),
            toast: document.getElementById('toast'),

            // Modal
            permissionModal: document.getElementById('permission-modal'),

            // Buttons
            btnCapture: document.getElementById('btn-capture'),
            btnRecord: document.getElementById('btn-record'),
            btnSwitch: document.getElementById('btn-switch'),
            btnBuy: document.getElementById('btn-buy'),
            btnGrant: document.getElementById('btn-grant')
        };

        // Start datetime updates
        this.startDateTimeUpdates();
    }

    /**
     * Get a DOM element
     * @param {string} name - Element key
     * @returns {HTMLElement}
     */
    getElement(name) {
        return this.elements[name];
    }

    /**
     * Setup event listeners
     * @param {Object} handlers - Event handler functions
     */
    setupEventListeners(handlers) {
        const { onGrant, onCapture, onRecord, onSwitch, onBuy, onResize } = handlers;

        if (onGrant) {
            this.elements.btnGrant.addEventListener('click', onGrant);
        }
        if (onCapture) {
            this.elements.btnCapture.addEventListener('click', onCapture);
        }
        if (onRecord) {
            this.elements.btnRecord.addEventListener('click', onRecord);
        }
        if (onSwitch) {
            this.elements.btnSwitch.addEventListener('click', onSwitch);
        }
        if (onBuy) {
            this.elements.btnBuy.addEventListener('click', onBuy);
        }
        if (onResize) {
            window.addEventListener('resize', onResize);
        }
    }

    /**
     * Start continuous datetime updates
     */
    startDateTimeUpdates() {
        this.updateDateTime();
        this.dateTimeInterval = setInterval(() => this.updateDateTime(), UI_CONFIG.dateTimeUpdateInterval);
    }

    /**
     * Update datetime display
     */
    updateDateTime() {
        const now = new Date();
        this.elements.datetimeText.textContent = formatDateTime(now, UI_CONFIG.locale);
    }

    /**
     * Update DBA display
     * @param {number} dba - DBA value
     * @param {Object} level - Level info (text, class)
     */
    updateDBADisplay(dba, level) {
        this.elements.dbaValue.textContent = dba;
        this.elements.dbaLevel.textContent = level.text;
        this.elements.dbaContainer.className = level.class;
    }

    /**
     * Update location display
     * @param {string} text - Location text
     */
    updateLocation(text) {
        this.elements.locationText.textContent = text;
    }

    /**
     * Show/hide permission modal
     * @param {boolean} show - Whether to show
     */
    setPermissionModalVisible(show) {
        if (show) {
            this.elements.permissionModal.classList.remove('hidden');
        } else {
            this.elements.permissionModal.classList.add('hidden');
        }
    }

    /**
     * Set recording UI state
     * @param {boolean} isRecording - Recording state
     */
    setRecordingState(isRecording) {
        if (isRecording) {
            this.elements.btnRecord.classList.add('recording');
            this.elements.recordingIndicator.classList.remove('hidden');
        } else {
            this.elements.btnRecord.classList.remove('recording');
            this.elements.recordingIndicator.classList.add('hidden');
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, or empty)
     */
    showToast(message, type = '') {
        // Add FA icon based on type
        let icon = '';
        if (type === 'success') {
            icon = '<i class="fa-solid fa-circle-check"></i> ';
        } else if (type === 'error') {
            icon = '<i class="fa-solid fa-circle-xmark"></i> ';
        }

        this.elements.toast.innerHTML = icon + message;
        this.elements.toast.className = type;

        setTimeout(() => {
            this.elements.toast.classList.add('hidden');
        }, UI_CONFIG.toastDuration);
    }

    /**
     * Set camera stream source
     * @param {MediaStream} stream - Media stream
     */
    setCameraStream(stream) {
        this.elements.camera.srcObject = stream;
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.dateTimeInterval) {
            clearInterval(this.dateTimeInterval);
            this.dateTimeInterval = null;
        }
    }
}
