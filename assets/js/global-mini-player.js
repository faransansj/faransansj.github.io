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
        this.DEBUG = false; // Set to true for debugging

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
        this.log('🚀 Global Mini Player - Immediate Init');

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

        this.log('✅ Global Mini Player Ready');
    }

    log(...args) {
        if (this.DEBUG) {
            console.log(...args);
        }
    }

    setupGestureDetection() {
        // Ultra-fast gesture detection
        const events = ['click', 'touchstart', 'keydown'];
        const gestureHandler = () => {
            if (!this.hasUserGesture) {
                this.hasUserGesture = true;
                this.hasUserGesture = true;
                sessionStorage.setItem('globalPlayerGesture', 'true');
                this.log('✅ User gesture captured');

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



        // Add to DOM
        document.body.appendChild(this.playerElement);

        // Cache elements for performance
        this.cacheElements();

        // Bind events
        this.bindEvents();

        this.log('✅ Player UI created');
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

        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlay();
        });
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMinimize();
        });
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close();
        });

        progressContainer.addEventListener('click', (e) => {
            if (!this.duration) return;
            const rect = progressContainer.getBoundingClientRect();
            const percentage = (e.clientX - rect.left) / rect.width;
            this.seekTo(percentage * this.duration);
        });

        // Click on minimized player to expand
        this.playerElement.addEventListener('click', (e) => {
            // Only expand if minimized and not clicking on play button
            if (this.isMinimized && !e.target.closest('.gmp-play-btn')) {
                this.toggleMinimize();
            }
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
            this.log('State restore failed:', error);
        }
    }

    fastRestore() {
        // Safe restoration: Don't interrupt if already playing
        if (this.isPlaying && this.audio && !this.audio.paused) {
            this.log('Already playing, skipping restore');
            return;
        }

        // Ultra-fast restoration on page show
        if (this.currentTrack && this.hasUserGesture) {
            this.attemptFastResume();
        }
    }

    loadTrackFast(trackInfo) {
        this.log(`🎵 Loading: ${trackInfo.title}`);

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

        // Reset note timer on new track load just in case
        this.stopNoteAnimation();
    }

    async togglePlay() {
        if (!this.audio || !this.currentTrack) {
            this.log('No track loaded');
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
                this.checkNoteAnimation();
                this.saveState();
                this.log('✅ Playing');
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
                    this.checkNoteAnimation();
                    this.log('✅ Playing (mute trick)');
                } catch (muteError) {
                    this.showResumeHint();
                    this.log('Auto-play blocked, showing manual resume');
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
        this.checkNoteAnimation(); // Update animation state
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
            this.log('Fast resume failed:', error);
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

        // Manage note animation visibility
        this.checkNoteAnimation();
    }

    checkNoteAnimation() {
        if (this.isPlaying && this.isMinimized) {
            this.startNoteAnimation();
        } else {
            this.stopNoteAnimation();
        }
    }

    startNoteAnimation() {
        if (this.noteTimer) return;

        // Create note container if it doesn't exist
        if (!this.noteContainer) {
            this.noteContainer = document.createElement('div');
            this.noteContainer.className = 'gmp-note-container';
            this.playerElement.appendChild(this.noteContainer);
        }

        const notes = ['♪', '♫', '♬', '♩'];

        this.noteTimer = setInterval(() => {
            if (!this.isPlaying || !this.isMinimized) {
                this.stopNoteAnimation();
                return;
            }

            const note = document.createElement('div');
            note.className = 'gmp-note';
            note.textContent = notes[Math.floor(Math.random() * notes.length)];

            // Random position variation
            const randomX = (Math.random() - 0.5) * 20; // -10px to 10px
            note.style.left = `calc(50% + ${randomX}px)`;

            this.noteContainer.appendChild(note);

            // Cleanup after animation
            setTimeout(() => {
                note.remove();
            }, 1500);

        }, 800); // New note every 0.8s
    }

    stopNoteAnimation() {
        if (this.noteTimer) {
            clearInterval(this.noteTimer);
            this.noteTimer = null;
        }
        // Optional: clear existing notes immediately or let them fade out
        if (this.noteContainer) {
            this.noteContainer.innerHTML = '';
        }
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


}

// Initialize immediately when script loads
(function () {
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