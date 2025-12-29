/**
 * DBA Noise Meter - Configuration Constants
 * Centralized configuration for the entire application
 */

// ===== DBA Level Configuration =====
export const DBA_LEVELS = [
    { max: 40, text: 'Rất yên tĩnh', class: 'level-quiet', color: '#00ff88' },
    { max: 60, text: 'Yên tĩnh', class: 'level-quiet', color: '#00ff88' },
    { max: 70, text: 'Vừa phải', class: 'level-moderate', color: '#ffff00' },
    { max: 85, text: 'Ồn', class: 'level-loud', color: '#ff9900' },
    { max: Infinity, text: 'Rất ồn - Có hại!', class: 'level-very-loud', color: '#ff4444' }
];

// ===== Audio Analysis Configuration =====
export const AUDIO_CONFIG = {
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    dbaSmoothing: 0.92,          // Weight for previous value
    dbaOffset: 20,               // Offset for dBA calculation
    minDBA: 20,
    maxDBA: 120,
    displayUpdateInterval: 500   // ms between display updates
};

// ===== Visualizer Configuration =====
export const VISUALIZER_CONFIG = {
    barCount: 64,
    barCountMobile: 32,
    barSpacing: 2,
    waveformSamples: 256,
    colors: {
        background: 'rgba(0, 0, 0, 0.3)',
        barGradient: [
            { stop: 0, color: 'rgba(0, 255, 136, 0.8)' },
            { stop: 0.5, color: 'rgba(255, 255, 0, 0.8)' },
            { stop: 1, color: 'rgba(255, 68, 68, 0.8)' }
        ]
    }
};

// ===== Canvas Overlay Configuration =====
export const OVERLAY_CONFIG = {
    // Scale factors
    baseWidthPortrait: 720,
    baseWidthLandscape: 1920,
    minScale: 0.5,

    // DBA Box
    dbaBox: {
        widthPortrait: 120,
        widthLandscape: 160,
        heightPortrait: 120,
        heightLandscape: 140,
        borderRadius: 15,
        background: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.25)',
        borderWidth: 2
    },

    // Info Box
    infoBox: {
        widthPortrait: 200,
        widthLandscape: 280,
        heightPortrait: 50,
        heightLandscape: 70,
        borderRadius: 12
    },

    // Recording Indicator
    recIndicator: {
        widthPortrait: 60,
        widthLandscape: 90,
        heightPortrait: 24,
        heightLandscape: 32,
        background: 'rgba(255, 0, 0, 0.9)'
    },

    // Mini Visualizer (for recordings)
    miniVisualizer: {
        heightPortrait: 60,
        heightLandscape: 100,
        bottomOffsetPortrait: 80,
        bottomOffsetLandscape: 100,
        paddingRatio: 0.028,
        minPadding: 20,
        maxWidthRatio: 0.5,
        maxWidth: 180,
        borderRadius: 10,
        background: 'rgba(0, 0, 0, 0.7)',
        innerPadding: 6
    },

    // Watermark
    watermark: {
        text: 'DBA Noise Meter',
        color: 'rgba(255, 255, 255, 0.4)',
        bottomOffset: 8
    }
};

// ===== Video Recording Configuration =====
export const RECORDING_CONFIG = {
    frameRate: 30,
    timeslice: 1000,  // ms between data chunks

    // iOS mime types (prioritize mp4)
    iosMimeTypes: [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        ''
    ],

    // Other browsers (prioritize webm)
    defaultMimeTypes: [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
        ''
    ],

    defaultWidth: 1280,
    defaultHeight: 720
};

// ===== Camera Configuration =====
export const CAMERA_CONFIG = {
    defaultFacingMode: 'environment',
    idealWidth: 1920,
    idealHeight: 1080
};

// ===== Geolocation Configuration =====
export const GEOLOCATION_CONFIG = {
    highAccuracyTimeout: 15000,
    lowAccuracyTimeout: 30000,
    maximumAge: 60000,
    watchMaximumAge: 10000,
    retryDelay: 30000,
    maxRetries: 2
};

// ===== UI Configuration =====
export const UI_CONFIG = {
    toastDuration: 3000,
    dateTimeUpdateInterval: 1000,
    locale: 'vi-VN'
};

// ===== Messages (Vietnamese) =====
export const MESSAGES = {
    geolocation: {
        loading: 'Đang lấy vị trí...',
        loadingNetwork: 'Đang lấy vị trí (mạng)...',
        retrying: 'Đang thử lại...',
        permissionDenied: 'Quyền vị trí bị từ chối',
        unavailable: 'Vị trí không khả dụng',
        timeout: 'Hết thời gian chờ',
        notSupported: 'GPS không khả dụng',
        error: 'Không lấy được vị trí',
        na: 'N/A'
    },
    recording: {
        started: 'Đang quay video...',
        saved: 'Đã lưu video',
        noData: 'Không có dữ liệu video',
        empty: 'Video rỗng (0 bytes)',
        error: 'Không thể bắt đầu quay video'
    },
    capture: {
        saved: 'Đã lưu ảnh'
    },
    camera: {
        switched: 'Đã đổi camera',
        error: 'Không thể đổi camera'
    },
    permission: {
        error: 'Không thể truy cập camera/microphone'
    }
};

