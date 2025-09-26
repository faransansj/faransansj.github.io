/**
 * Global Mini Player - Page Independent Audio Player
 * Ultra-fast, truly global audio player that persists across all pages
 */

class GlobalMiniPlayer {
    constructor() {
        // Prevent multiple instances
        if (window.__globalMiniPlayer) {
            return window.__globalMiniPlayer;
        }

        // Core state
        this.isReady = false;
        this.audio = null;
        this.currentTrack = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 1;

        // UI elements
        this.playerElement = null;
        this.isMinimized = false;

        // Performance optimizations
        this.updateTimer = null;
        this.visualizerTimer = null;
        this.hasUserGesture = false;

        // Cache for fast access
        this.domCache = {};

        // Initialize immediately
        this.initializeImmediate();

        // Store global reference
        window.__globalMiniPlayer = this;
        window.globalMiniPlayer = this;
    }

    // Immediate initialization without async delays
    initializeImmediate() {
        console.log('🚀 Global Mini Player - Immediate Init');

        // Check if already initialized
        if (this.isReady) return;

        // Fast user gesture detection
        this.setupGestureDetection();

        // Create player UI immediately
        this.createPlayerUI();

        // Fast state restoration
        this.fastStateRestore();

        // Set ready flag
        this.isReady = true;

        console.log('✅ Global Mini Player Ready');
    }

    setupGestureDetection() {
        // Ultra-fast gesture detection
        const events = ['click', 'touchstart', 'keydown'];
        const gestureHandler = () => {
            if (!this.hasUserGesture) {
                this.hasUserGesture = true;
                sessionStorage.setItem('globalPlayerGesture', 'true');
                console.log('✅ User gesture captured');

                // Remove listeners for performance
                events.forEach(event => {
                    document.removeEventListener(event, gestureHandler);
                });
            }
        };

        // Check existing gesture
        if (sessionStorage.getItem('globalPlayerGesture')) {
            this.hasUserGesture = true;
        } else {
            events.forEach(event => {
                document.addEventListener(event, gestureHandler, { once: true, passive: true });
            });
        }
    }

    createPlayerUI() {
        // Check if already exists
        if (document.getElementById('global-mini-player')) {
            this.playerElement = document.getElementById('global-mini-player');
            this.cacheElements();
            return;
        }

        // Create with minimal DOM operations
        this.playerElement = document.createElement('div');
        this.playerElement.id = 'global-mini-player';
        this.playerElement.className = 'global-player';

        this.playerElement.innerHTML = `
            <div class="gmp-content">
                <div class="gmp-header">
                    <button class="gmp-minimize" title="최소화">−</button>
                    <button class="gmp-close" title="닫기">×</button>
                </div>
                <div class="gmp-controls">
                    <button class="gmp-play-btn">
                        <div class="gmp-play-icon"></div>
                    </button>
                    <div class="gmp-info">
                        <div class="gmp-title">준비 중...</div>
                        <div class="gmp-time">0:00 / 0:00</div>
                    </div>
                    <div class="gmp-visualizer">
                        <div class="gmp-bar"></div>
                        <div class="gmp-bar"></div>
                        <div class="gmp-bar"></div>
                        <div class="gmp-bar"></div>
                        <div class="gmp-bar"></div>
                        <div class="gmp-bar"></div>
                        <div class="gmp-bar"></div>
                        <div class="gmp-bar"></div>
                    </div>
                </div>
                <div class="gmp-progress-container">
                    <div class="gmp-progress"></div>
                </div>
                <div class="gmp-status">준비됨</div>
            </div>
        `;

        // Inject CSS if not already present
        this.injectCSS();

        // Add to DOM
        document.body.appendChild(this.playerElement);

        // Cache elements for performance
        this.cacheElements();

        // Bind events
        this.bindEvents();

        console.log('✅ Player UI created');
    }

    cacheElements() {
        // Cache all frequently accessed elements
        this.domCache = {
            playBtn: this.playerElement.querySelector('.gmp-play-btn'),
            playIcon: this.playerElement.querySelector('.gmp-play-icon'),
            title: this.playerElement.querySelector('.gmp-title'),
            time: this.playerElement.querySelector('.gmp-time'),
            progress: this.playerElement.querySelector('.gmp-progress'),
            status: this.playerElement.querySelector('.gmp-status'),
            minimizeBtn: this.playerElement.querySelector('.gmp-minimize'),
            closeBtn: this.playerElement.querySelector('.gmp-close'),
            progressContainer: this.playerElement.querySelector('.gmp-progress-container'),
            visualizerBars: this.playerElement.querySelectorAll('.gmp-bar')
        };
    }

    bindEvents() {
        const { playBtn, minimizeBtn, closeBtn, progressContainer } = this.domCache;

        playBtn.addEventListener('click', () => this.togglePlay());
        minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        closeBtn.addEventListener('click', () => this.close());

        progressContainer.addEventListener('click', (e) => {
            if (!this.duration) return;
            const rect = progressContainer.getBoundingClientRect();
            const percentage = (e.clientX - rect.left) / rect.width;
            this.seekTo(percentage * this.duration);
        });

        // Page navigation events
        window.addEventListener('beforeunload', () => this.saveState());
        window.addEventListener('pageshow', () => this.fastRestore());

        // Performance: Use passive listeners
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.fastRestore();
            }
        }, { passive: true });
    }

    // Fast state restoration without delays
    fastStateRestore() {
        const savedState = sessionStorage.getItem('globalPlayerState') ||
                          localStorage.getItem('globalPlayerBackup');

        if (!savedState) return;

        try {
            const state = JSON.parse(savedState);
            if (state.trackInfo) {
                this.loadTrackFast(state.trackInfo);
                this.currentTime = state.currentTime || 0;
                this.volume = state.volume || 1;

                // Show resume hint if was playing
                if (state.isPlaying && this.hasUserGesture) {
                    this.showResumeHint();
                }
            }
        } catch (error) {
            console.log('State restore failed:', error);
        }
    }

    fastRestore() {
        // Ultra-fast restoration on page show
        if (this.currentTrack && this.hasUserGesture) {
            this.attemptFastResume();
        }
    }

    loadTrackFast(trackInfo) {
        console.log(`🎵 Loading: ${trackInfo.title}`);

        this.currentTrack = trackInfo;

        // Create audio element with optimized settings
        if (this.audio) {
            this.audio.pause();
            this.audio.removeEventListener('timeupdate', this.handleTimeUpdate);
            this.audio.removeEventListener('loadedmetadata', this.handleMetadata);
            this.audio.removeEventListener('ended', this.handleEnded);
        }

        this.audio = new Audio(trackInfo.src);
        this.audio.preload = 'auto'; // Aggressive preloading
        this.audio.volume = this.volume;

        // Fast event binding
        this.handleTimeUpdate = () => {
            this.currentTime = this.audio.currentTime;
            this.updateTimeDisplay();
            this.updateProgress();
        };

        this.handleMetadata = () => {
            this.duration = this.audio.duration;
            this.updateTimeDisplay();
        };

        this.handleEnded = () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.stopVisualizer();
        };

        this.audio.addEventListener('timeupdate', this.handleTimeUpdate, { passive: true });
        this.audio.addEventListener('loadedmetadata', this.handleMetadata, { passive: true });
        this.audio.addEventListener('ended', this.handleEnded, { passive: true });

        // Update UI immediately
        this.domCache.title.textContent = trackInfo.title;
        this.domCache.status.textContent = '로드됨';
        this.show();
    }

    async togglePlay() {
        if (!this.audio || !this.currentTrack) {
            console.log('No track loaded');
            return;
        }

        if (this.isPlaying) {
            await this.pause();
        } else {
            await this.play();
        }
    }

    async play(startTime = null) {
        if (!this.audio) return;

        try {
            if (startTime !== null) {
                this.audio.currentTime = startTime;
            }

            // Fast play attempt
            const playPromise = this.audio.play();

            if (playPromise) {
                await playPromise;
                this.isPlaying = true;
                this.updatePlayButton();
                this.startVisualizer();
                this.startUpdates();
                this.domCache.status.textContent = '재생 중';
                this.saveState();
                console.log('✅ Playing');
            }
        } catch (error) {
            // Try silent autoplay trick
            if (error.name === 'NotAllowedError') {
                try {
                    this.audio.muted = true;
                    await this.audio.play();
                    this.audio.muted = false;
                    this.isPlaying = true;
                    this.updatePlayButton();
                    this.startVisualizer();
                    this.domCache.status.textContent = '재생 중';
                    console.log('✅ Playing (mute trick)');
                } catch (muteError) {
                    this.showResumeHint();
                    console.log('Auto-play blocked, showing manual resume');
                }
            }
        }
    }

    async pause() {
        if (!this.audio) return;

        this.audio.pause();
        this.isPlaying = false;
        this.updatePlayButton();
        this.stopVisualizer();
        this.stopUpdates();
        this.domCache.status.textContent = '일시정지';
        this.saveState();
    }

    seekTo(time) {
        if (this.audio && time >= 0 && time <= this.duration) {
            this.audio.currentTime = time;
            this.currentTime = time;
            this.updateProgress();
        }
    }

    // Ultra-fast UI updates
    updatePlayButton() {
        const { playIcon } = this.domCache;
        if (this.isPlaying) {
            playIcon.className = 'gmp-pause-icon';
            playIcon.innerHTML = '<span></span><span></span>';
        } else {
            playIcon.className = 'gmp-play-icon';
            playIcon.innerHTML = '';
        }
    }

    updateTimeDisplay() {
        this.domCache.time.textContent =
            `${this.formatTime(this.currentTime)} / ${this.formatTime(this.duration)}`;
    }

    updateProgress() {
        if (this.duration > 0) {
            const percentage = (this.currentTime / this.duration) * 100;
            this.domCache.progress.style.width = `${percentage}%`;
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    startVisualizer() {
        if (this.visualizerTimer) return;

        this.visualizerTimer = setInterval(() => {
            if (!this.isPlaying) return;

            this.domCache.visualizerBars.forEach((bar, index) => {
                const height = 20 + Math.random() * 60;
                bar.style.height = `${height}%`;
            });
        }, 100);
    }

    stopVisualizer() {
        if (this.visualizerTimer) {
            clearInterval(this.visualizerTimer);
            this.visualizerTimer = null;
        }
    }

    startUpdates() {
        if (this.updateTimer) return;

        this.updateTimer = setInterval(() => {
            if (this.isPlaying) {
                this.saveState();
            }
        }, 2000); // Reduced frequency for performance
    }

    stopUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    showResumeHint() {
        const { title } = this.domCache;
        const originalTitle = title.textContent;

        title.innerHTML = `▶️ <span style="color: #2563eb; cursor: pointer;">클릭하여 재생</span>`;
        title.style.cursor = 'pointer';

        const resumeHandler = async () => {
            await this.play(this.currentTime);
            title.textContent = originalTitle;
            title.style.cursor = 'default';
        };

        title.addEventListener('click', resumeHandler, { once: true });
    }

    attemptFastResume() {
        const savedState = sessionStorage.getItem('globalPlayerState');
        if (!savedState) return;

        try {
            const state = JSON.parse(savedState);
            if (state.isPlaying && this.hasUserGesture && this.currentTrack) {
                // Calculate time progression
                const timeDiff = (Date.now() - state.timestamp) / 1000;
                const resumeTime = state.currentTime + timeDiff;

                if (resumeTime < this.duration) {
                    this.play(resumeTime);
                }
            }
        } catch (error) {
            console.log('Fast resume failed:', error);
        }
    }

    saveState() {
        if (!this.currentTrack) return;

        const state = {
            trackInfo: this.currentTrack,
            currentTime: this.currentTime,
            isPlaying: this.isPlaying,
            volume: this.volume,
            isMinimized: this.isMinimized,
            timestamp: Date.now()
        };

        sessionStorage.setItem('globalPlayerState', JSON.stringify(state));
        localStorage.setItem('globalPlayerBackup', JSON.stringify(state));
    }

    // UI Controls
    show() {
        this.playerElement.classList.remove('hidden');
    }

    hide() {
        this.playerElement.classList.add('hidden');
    }

    close() {
        this.pause();
        this.hide();
        sessionStorage.removeItem('globalPlayerState');
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        this.playerElement.classList.toggle('minimized', this.isMinimized);
        this.domCache.minimizeBtn.textContent = this.isMinimized ? '+' : '−';
    }

    // Public API
    loadTrack(trackInfo, autoPlay = false) {
        this.loadTrackFast(trackInfo);
        if (autoPlay && this.hasUserGesture) {
            this.play();
        }
    }

    getCurrentTrack() { return this.currentTrack; }
    getCurrentTime() { return this.currentTime; }
    getDuration() { return this.duration; }
    isCurrentlyPlaying() { return this.isPlaying; }
    getVolume() { return this.volume; }

    injectCSS() {
        if (document.getElementById('global-mini-player-styles')) return;

        const style = document.createElement('style');
        style.id = 'global-mini-player-styles';
        style.textContent = `
            .global-player {
                position: fixed;
                bottom: 20px;
                left: 20px;
                width: 200px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.2);
                z-index: 10000;
                transition: all 0.2s ease;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            }

            .global-player.hidden {
                transform: translateY(100%);
                opacity: 0;
                pointer-events: none;
            }

            .global-player.minimized .gmp-controls,
            .global-player.minimized .gmp-progress-container {
                display: none;
            }

            .gmp-content {
                padding: 12px;
                position: relative;
            }

            .gmp-header {
                display: flex;
                justify-content: flex-end;
                gap: 4px;
                margin-bottom: 8px;
            }

            .gmp-minimize, .gmp-close {
                background: none;
                border: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                color: #9ca3af;
                transition: all 0.2s;
            }

            .gmp-minimize:hover, .gmp-close:hover {
                background: #f3f4f6;
                color: #374151;
            }

            .gmp-controls {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 10px;
            }

            .gmp-play-btn {
                background: #9ca3af;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .gmp-play-btn:hover {
                background: #6b7280;
                transform: scale(1.08);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .gmp-play-icon {
                width: 0;
                height: 0;
                border-style: solid;
                border-width: 8px 0 8px 12px;
                border-color: transparent transparent transparent white;
                margin-left: 3px;
            }

            .gmp-pause-icon {
                display: flex;
                gap: 2px;
            }

            .gmp-pause-icon span {
                width: 3px;
                height: 12px;
                background: white;
                border-radius: 1px;
            }

            .gmp-info {
                flex-grow: 1;
                min-width: 0;
            }

            .gmp-title {
                font-size: 13px;
                font-weight: 500;
                color: #374151;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-bottom: 2px;
            }

            .gmp-time {
                font-size: 11px;
                color: #9ca3af;
            }

            .gmp-visualizer {
                display: flex;
                align-items: flex-end;
                gap: 1px;
                width: 40px;
                height: 24px;
            }

            .gmp-bar {
                flex-grow: 1;
                background: #67e8f9;
                min-height: 2px;
                border-radius: 1px;
                transition: height 0.1s ease;
            }

            .gmp-progress-container {
                background: #e5e7eb;
                height: 3px;
                border-radius: 1.5px;
                cursor: pointer;
                position: relative;
                width: 100%;
                margin-bottom: 8px;
            }

            .gmp-progress {
                background: #67e8f9;
                height: 100%;
                border-radius: 1.5px;
                width: 0%;
                transition: width 0.1s linear;
            }

            .gmp-status {
                font-size: 10px;
                color: #9ca3af;
                text-align: center;
            }

            @media (min-width: 1024px) {
                .global-player {
                    width: 220px;
                }
            }

            @media (min-width: 1280px) {
                .global-player {
                    width: 240px;
                }
            }

            @media (max-width: 768px) {
                .global-player {
                    left: 10px;
                    bottom: 10px;
                    width: calc(100% - 20px);
                    max-width: 200px;
                }
                .gmp-visualizer {
                    width: 36px;
                }
                .gmp-title {
                    font-size: 12px;
                }
                .gmp-time {
                    font-size: 10px;
                }
            }

            @media (prefers-color-scheme: dark) {
                .global-player {
                    background: rgba(31, 41, 55, 0.95);
                    border: 1px solid rgba(75, 85, 99, 0.3);
                }

                .gmp-title {
                    color: #f9fafb;
                }

                .gmp-time, .gmp-status {
                    color: #9ca3af;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize immediately when script loads
(function() {
    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new GlobalMiniPlayer();
        });
    } else {
        new GlobalMiniPlayer();
    }

    // Also initialize on page show (for back/forward)
    window.addEventListener('pageshow', () => {
        if (!window.__globalMiniPlayer) {
            new GlobalMiniPlayer();
        }
    });

    // Initialize default track on homepage
    window.addEventListener('load', () => {
        const player = window.globalMiniPlayer || window.__globalMiniPlayer;
        if (player && !player.currentTrack) {
            const isHomePage = window.location.pathname === '/' ||
                              window.location.pathname === '/index.html' ||
                              window.location.pathname.endsWith('/');

            if (isHomePage) {
                player.loadTrack({
                    src: '/assets/audio/STUDY_WITH_MIKU-part3.mp3',
                    title: 'STUDY WITH MIKU - Part 3'
                });
            }
        }
    });
})();