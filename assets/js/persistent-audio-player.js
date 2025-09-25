/**
 * Persistent Audio Player with Service Worker Integration
 * True cross-page audio continuity using Web Audio API
 */

class PersistentAudioPlayer {
    constructor() {
        this.serviceWorker = null;
        this.isInitialized = false;
        this.currentTrack = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 1;
        this.miniPlayerElement = null;
        this.isMinimized = false;
        this.updateInterval = null;
        this.messageChannel = null;

        // Audio processing in main thread
        this.audio = null;
        this.audioContext = null;
        this.gainNode = null;

        // Autoplay enhancement flags
        this.hasUserGesture = false;
        this.attemptedAutoplay = false;
        this.continuityActive = false;

        // Visualization data
        this.visualizerData = {
            bars: [],
            animationId: null,
            barCount: 12
        };

        this.init();
    }

    async init() {
        if (this.isInitialized) return;

        try {
            console.log('🚀 Initializing Persistent Audio Player...');

            // Register Service Worker
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/audio-worker.js', {
                    scope: '/'
                });

                console.log('Service Worker registered:', registration);

                // Wait for Service Worker to be ready
                await navigator.serviceWorker.ready;
                this.serviceWorker = registration.active || registration.waiting || registration.installing;

                // Set up message handling
                navigator.serviceWorker.addEventListener('message', this.handleWorkerMessage.bind(this));

                console.log('✅ Service Worker ready');
            } else {
                console.warn('Service Worker not supported, falling back to basic mode');
            }

            // Create UI
            this.createMiniPlayer();
            this.bindEvents();

            // Try to restore previous state
            await this.restoreState();

            this.isInitialized = true;
            window.persistentAudioPlayer = this;

            console.log('✅ Persistent Audio Player initialized');

        } catch (error) {
            console.error('Failed to initialize Persistent Audio Player:', error);
        }
    }

    async sendWorkerMessage(type, data = {}) {
        return new Promise((resolve, reject) => {
            if (!this.serviceWorker) {
                reject(new Error('Service Worker not available'));
                return;
            }

            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
                if (event.data.success) {
                    resolve(event.data);
                } else {
                    reject(new Error(event.data.error || 'Worker message failed'));
                }
            };

            this.serviceWorker.postMessage(
                { type, data },
                [messageChannel.port2]
            );
        });
    }

    handleWorkerMessage(event) {
        const { type, state } = event.data;

        if (type === 'AUDIO_STATE_SYNC') {
            // Sync with shared state from Service Worker
            if (state.trackInfo && (!this.currentTrack || this.currentTrack.src !== state.trackInfo.src)) {
                this.currentTrack = state.trackInfo;
                this.loadTrack(state.trackInfo, false);
            }

            // Only sync if not actively playing (avoid conflicts)
            if (!this.isPlaying && state.isPlaying) {
                this.currentTime = state.currentTime;
                this.isPlaying = state.isPlaying;
                this.duration = state.duration;
                this.volume = state.volume;
                this.updateUI();
            }
        }
    }

    createMiniPlayer() {
        if (this.miniPlayerElement) return;

        this.miniPlayerElement = document.createElement('div');
        this.miniPlayerElement.id = 'persistent-mini-player';
        this.miniPlayerElement.className = 'persistent-player hidden';
        this.miniPlayerElement.innerHTML = `
            <div class="persistent-player-content">
                <div class="persistent-header">
                    <button class="persistent-minimize-btn" id="persistentMinimizeBtn" title="Minimize">−</button>
                    <button class="persistent-close-btn" id="persistentCloseBtn" title="Close">×</button>
                </div>
                <div class="persistent-controls">
                    <button class="persistent-play-btn" id="persistentPlayBtn">
                        <div class="persistent-play-icon"></div>
                    </button>
                    <div class="persistent-info">
                        <div class="persistent-title" id="persistentTitle">No track loaded</div>
                        <div class="persistent-time" id="persistentTime">0:00/0:00</div>
                    </div>
                    <div class="persistent-visualizer" id="persistentVisualizer"></div>
                </div>
                <div class="persistent-progress-bar" id="persistentProgressBar">
                    <div class="persistent-progress" id="persistentProgress"></div>
                </div>
                <div class="persistent-status" id="persistentStatus">Ready</div>
            </div>
        `;

        // Create visualizer bars
        const visualizer = this.miniPlayerElement.querySelector('#persistentVisualizer');
        if (visualizer) {
            for (let i = 0; i < this.visualizerData.barCount; i++) {
                const bar = document.createElement('div');
                bar.className = 'persistent-bar';
                visualizer.appendChild(bar);
                this.visualizerData.bars.push(bar);
            }
        }

        document.body.appendChild(this.miniPlayerElement);

        // Auto-show after creation
        setTimeout(() => {
            this.showMiniPlayer();
        }, 100);
    }

    bindEvents() {
        if (!this.miniPlayerElement) return;

        const playBtn = this.miniPlayerElement.querySelector('#persistentPlayBtn');
        const closeBtn = this.miniPlayerElement.querySelector('#persistentCloseBtn');
        const minimizeBtn = this.miniPlayerElement.querySelector('#persistentMinimizeBtn');
        const progressBar = this.miniPlayerElement.querySelector('#persistentProgressBar');

        playBtn?.addEventListener('click', () => this.togglePlay());
        closeBtn?.addEventListener('click', () => this.stop());
        minimizeBtn?.addEventListener('click', () => this.toggleMinimize());

        progressBar?.addEventListener('click', (e) => {
            if (!this.duration) return;

            const rect = progressBar.getBoundingClientRect();
            const percentage = (e.clientX - rect.left) / rect.width;
            const newTime = percentage * this.duration;

            this.seekTo(newTime);
        });

        // User gesture detection for autoplay
        this.setupUserGestureDetection();

        // Handle page navigation
        window.addEventListener('beforeunload', () => {
            this.saveState();
            this.continuityActive = this.isPlaying;
        });

        window.addEventListener('pagehide', () => {
            this.saveState();
            this.continuityActive = this.isPlaying;
        });

        // Enable resume on focus (for cross-page continuity)
        window.addEventListener('focus', () => {
            setTimeout(() => {
                this.attemptAutoResume();
            }, 100);
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(() => {
                    this.attemptAutoResume();
                }, 100);
            }
        });

        // Enhanced cross-page navigation handlers
        window.addEventListener('pageshow', (event) => {
            console.log('📄 Page show event - persisted:', event.persisted);
            setTimeout(() => {
                this.handlePageNavigation(event.persisted);
            }, 50);
        });

        // Handle back/forward navigation with browser cache
        window.addEventListener('popstate', () => {
            setTimeout(() => {
                this.handlePageNavigation(false);
            }, 50);
        });

        // Additional load event for full restore
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.attemptSilentAutoplay();
            }, 200);
        });
    }

    async loadTrack(trackInfo, autoPlay = false) {
        try {
            console.log('📀 Loading track:', trackInfo.title);
            this.setStatus('Loading...');

            this.currentTrack = trackInfo;

            // Create HTML5 audio element
            if (this.audio) {
                this.audio.pause();
                this.audio.removeEventListener('loadedmetadata', this.handleLoadedMetadata);
                this.audio.removeEventListener('timeupdate', this.handleTimeUpdate);
                this.audio.removeEventListener('ended', this.handleEnded);
            }

            this.audio = new Audio(trackInfo.src);
            this.audio.preload = 'metadata';
            this.audio.volume = this.volume;

            // Enable more aggressive autoplay capabilities
            this.audio.setAttribute('autoplay', '');
            this.audio.muted = false;

            // Cross-origin support for better compatibility
            this.audio.crossOrigin = 'anonymous';

            // Add event listeners
            this.handleLoadedMetadata = () => {
                this.duration = this.audio.duration;
                this.updateUI();
            };
            this.handleTimeUpdate = () => {
                if (!this.audio.paused) {
                    this.currentTime = this.audio.currentTime;
                    this.updateUI();
                    this.syncStateToWorker();
                }
            };
            this.handleEnded = () => {
                this.isPlaying = false;
                this.updateUI();
                this.syncStateToWorker();
            };

            this.audio.addEventListener('loadedmetadata', this.handleLoadedMetadata);
            this.audio.addEventListener('timeupdate', this.handleTimeUpdate);
            this.audio.addEventListener('ended', this.handleEnded);

            // Cache audio file with Service Worker
            if (this.serviceWorker) {
                await this.sendWorkerMessage('CACHE_AUDIO', { url: trackInfo.src });
            }

            // Setup Media Session for background playback
            this.setupMediaSession();

            this.updateMiniPlayerInfo();
            this.showMiniPlayer();

            if (autoPlay) {
                await this.play();
            }

            this.setStatus('Ready');
            this.saveState();

        } catch (error) {
            console.error('Failed to load track:', error);
            this.setStatus('Load failed');
        }
    }

    async play(startTime = null) {
        try {
            if (!this.audio || !this.currentTrack) return;

            console.log('▶️ Starting playback...');
            this.setStatus('Playing...');

            if (startTime !== null) {
                this.audio.currentTime = startTime;
            }

            await this.audio.play();
            this.isPlaying = true;
            this.updatePlayButton();
            this.startVisualization();
            this.updateMediaSession();
            this.setStatus('Playing');
            this.syncStateToWorker();

        } catch (error) {
            console.error('Playback failed:', error);
            this.setStatus('Play failed');
        }
    }

    async pause() {
        try {
            if (!this.audio) return;

            console.log('⏸️ Pausing playback...');
            this.audio.pause();
            this.isPlaying = false;
            this.updatePlayButton();
            this.stopVisualization();
            this.updateMediaSession();
            this.setStatus('Paused');
            this.syncStateToWorker();

        } catch (error) {
            console.error('Pause failed:', error);
        }
    }

    async togglePlay() {
        if (this.isPlaying) {
            await this.pause();
        } else {
            await this.play();
        }
    }

    async seekTo(time) {
        try {
            if (this.audio) {
                this.audio.currentTime = time;
                this.currentTime = time;
                this.updateProgress();
                this.syncStateToWorker();
            }
        } catch (error) {
            console.error('Seek failed:', error);
        }
    }

    async setVolume(volume) {
        try {
            this.volume = Math.max(0, Math.min(1, volume));
            if (this.audio) {
                this.audio.volume = this.volume;
            }
            this.syncStateToWorker();
        } catch (error) {
            console.error('Volume change failed:', error);
        }
    }

    async syncStateToWorker() {
        try {
            if (this.serviceWorker) {
                await this.sendWorkerMessage('UPDATE_STATE', {
                    currentTime: this.currentTime,
                    isPlaying: this.isPlaying,
                    duration: this.duration,
                    volume: this.volume,
                    trackInfo: this.currentTrack
                });
            }
        } catch (error) {
            console.log('State sync failed:', error);
        }
    }

    stop() {
        this.pause();
        this.currentTime = 0;
        this.currentTrack = null;
        this.hideMiniPlayer();
        this.clearState();
    }

    updatePlayButton() {
        const playIcon = this.miniPlayerElement?.querySelector('.persistent-play-icon');
        if (!playIcon) return;

        if (this.isPlaying) {
            playIcon.className = 'persistent-pause-icon';
            playIcon.innerHTML = '<span></span><span></span>';
        } else {
            playIcon.className = 'persistent-play-icon';
            playIcon.innerHTML = '';
        }
    }

    updateProgress() {
        const progressElement = this.miniPlayerElement?.querySelector('#persistentProgress');
        if (progressElement && this.duration > 0) {
            const percentage = (this.currentTime / this.duration) * 100;
            progressElement.style.width = `${percentage}%`;
        }
    }

    updateTime() {
        const timeElement = this.miniPlayerElement?.querySelector('#persistentTime');
        if (timeElement) {
            timeElement.textContent = `${this.formatTime(this.currentTime)}/${this.formatTime(this.duration)}`;
        }
    }

    updateMiniPlayerInfo() {
        const titleElement = this.miniPlayerElement?.querySelector('#persistentTitle');
        if (titleElement) {
            if (this.currentTrack && this.currentTrack.title) {
                titleElement.textContent = this.currentTrack.title;
            } else {
                titleElement.textContent = 'No track loaded';
            }
        } else {
            console.warn('Title element #persistentTitle not found');
        }
    }

    updateUI() {
        this.updatePlayButton();
        this.updateProgress();
        this.updateTime();
        this.updateMiniPlayerInfo();
        this.updateMediaSession();
    }

    startVisualization() {
        if (this.visualizerData.animationId) return;

        const animate = () => {
            if (!this.isPlaying) return;

            // Simple pseudo-visualization based on time
            const time = this.currentTime;
            this.visualizerData.bars.forEach((bar, index) => {
                const height = Math.max(
                    10,
                    40 + 30 * Math.sin(time * 2 + index * 0.5) * Math.random()
                );
                bar.style.height = `${height}%`;
            });

            this.visualizerData.animationId = requestAnimationFrame(animate);
        };

        this.visualizerData.animationId = requestAnimationFrame(animate);
    }

    stopVisualization() {
        if (this.visualizerData.animationId) {
            cancelAnimationFrame(this.visualizerData.animationId);
            this.visualizerData.animationId = null;
        }
    }

    startUpdates() {
        if (this.updateInterval) return;

        this.updateInterval = setInterval(() => {
            if (this.isPlaying) {
                this.updateUI();
                this.saveState();
            }
        }, 1000);
    }

    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    showMiniPlayer() {
        if (this.miniPlayerElement) {
            this.miniPlayerElement.classList.remove('hidden');
            this.miniPlayerElement.style.display = 'block';
        }
    }

    hideMiniPlayer() {
        if (this.miniPlayerElement) {
            this.miniPlayerElement.classList.add('hidden');
        }
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        const minimizeBtn = this.miniPlayerElement?.querySelector('#persistentMinimizeBtn');

        if (this.isMinimized) {
            this.miniPlayerElement?.classList.add('minimized');
            if (minimizeBtn) {
                minimizeBtn.textContent = '+';
                minimizeBtn.title = 'Expand';
            }
        } else {
            this.miniPlayerElement?.classList.remove('minimized');
            if (minimizeBtn) {
                minimizeBtn.textContent = '−';
                minimizeBtn.title = 'Minimize';
            }
        }
    }

    setStatus(message) {
        const statusElement = this.miniPlayerElement?.querySelector('#persistentStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    setupMediaSession() {
        if ('mediaSession' in navigator && this.currentTrack) {
            try {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: this.currentTrack.title,
                    artist: 'Study Music',
                    album: 'Background Music',
                    artwork: [
                        { src: '/favicon.ico', sizes: '96x96', type: 'image/png' }
                    ]
                });

                // Set action handlers for media keys
                navigator.mediaSession.setActionHandler('play', () => {
                    console.log('🎮 Media Session: Play');
                    this.play();
                });

                navigator.mediaSession.setActionHandler('pause', () => {
                    console.log('🎮 Media Session: Pause');
                    this.pause();
                });

                navigator.mediaSession.setActionHandler('previoustrack', () => {
                    console.log('🎮 Media Session: Previous');
                    // Restart current track
                    this.seekTo(0);
                });

                navigator.mediaSession.setActionHandler('nexttrack', () => {
                    console.log('🎮 Media Session: Next');
                    // Could implement playlist functionality here
                    this.seekTo(0);
                });

                navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                    const skipTime = details.seekOffset || 10;
                    this.seekTo(Math.max(0, this.currentTime - skipTime));
                });

                navigator.mediaSession.setActionHandler('seekforward', (details) => {
                    const skipTime = details.seekOffset || 10;
                    this.seekTo(Math.min(this.duration, this.currentTime + skipTime));
                });

                navigator.mediaSession.setActionHandler('seekto', (details) => {
                    if (details.seekTime) {
                        this.seekTo(details.seekTime);
                    }
                });

                console.log('🎮 Media Session API configured');

                // Update playback state
                navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';

            } catch (error) {
                console.log('Media Session setup failed:', error);
            }
        }
    }

    updateMediaSession() {
        if ('mediaSession' in navigator) {
            try {
                navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';

                // Update position state
                if (this.duration > 0) {
                    navigator.mediaSession.setPositionState({
                        duration: this.duration,
                        playbackRate: 1,
                        position: this.currentTime
                    });
                }
            } catch (error) {
                console.log('Media Session update failed:', error);
            }
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    saveState() {
        if (this.currentTrack) {
            const state = {
                currentTime: this.currentTime,
                trackInfo: this.currentTrack,
                isPlaying: this.isPlaying,
                isMinimized: this.isMinimized,
                volume: this.volume,
                timestamp: Date.now()
            };

            sessionStorage.setItem('persistentAudioState', JSON.stringify(state));
            localStorage.setItem('persistentAudioBackup', JSON.stringify(state));
        }
    }

    async restoreState() {
        console.log('🔄 Starting state restoration...');

        // Enhanced state restoration with better user experience
        await this.performSmartRestore();

        // If no state found, initialize default track
        if (!this.currentTrack) {
            this.initializeDefaultTrack();
        }
    }

    async performSmartRestore() {
        let restoreState = null;

        // Try Service Worker first
        if (this.serviceWorker) {
            try {
                const workerState = await this.sendWorkerMessage('GET_STATE');
                if (workerState.state && workerState.state.trackInfo) {
                    restoreState = workerState.state;
                    console.log('🔄 Found Service Worker state:', restoreState.trackInfo.title);
                }
            } catch (error) {
                console.log('Service Worker state not available, trying local storage');
            }
        }

        // Fallback to local storage
        if (!restoreState) {
            const savedState = sessionStorage.getItem('persistentAudioState') ||
                              localStorage.getItem('persistentAudioBackup');
            if (savedState) {
                try {
                    restoreState = JSON.parse(savedState);
                    console.log('🔄 Found local storage state:', restoreState.trackInfo?.title);
                } catch (error) {
                    console.error('Failed to parse saved state:', error);
                }
            }
        }

        if (restoreState && restoreState.trackInfo) {
            await this.loadTrack(restoreState.trackInfo, false);

            // Calculate time progression if was playing
            const timeSinceUpdate = (Date.now() - restoreState.timestamp) / 1000;
            let resumeTime = restoreState.currentTime || 0;

            if (restoreState.isPlaying && timeSinceUpdate < 10) { // Only if recent
                resumeTime += timeSinceUpdate;
            }

            if (this.audio && resumeTime < this.duration && resumeTime > 0) {
                this.audio.currentTime = resumeTime;
                this.currentTime = resumeTime;
            }

            this.volume = restoreState.volume || 1;
            this.isMinimized = restoreState.isMinimized || false;

            // Show resume option if was playing recently
            if (restoreState.isPlaying && timeSinceUpdate < 10) {
                this.showResumePrompt();
            }

            if (this.isMinimized) {
                this.toggleMinimize();
            }

            this.updateUI();
        }
    }

    showResumePrompt() {
        this.setStatus('계속 재생하려면 클릭');
        const titleElement = this.miniPlayerElement?.querySelector('#persistentTitle');

        if (titleElement) {
            const originalTitle = titleElement.textContent;
            titleElement.innerHTML = `
                <span style="color: #2563eb; font-weight: 500;">
                    ▶️ ${originalTitle}
                </span>
            `;
            titleElement.style.cursor = 'pointer';
            titleElement.title = '클릭하여 계속 재생';

            const resumeHandler = async () => {
                await this.play(this.currentTime);
                titleElement.innerHTML = originalTitle;
                titleElement.style.cursor = 'default';
                titleElement.title = '';
                this.setStatus('재생 중');
            };

            titleElement.removeEventListener('click', resumeHandler);
            titleElement.addEventListener('click', resumeHandler, { once: true });

            // Also make play button more prominent
            const playBtn = this.miniPlayerElement?.querySelector('#persistentPlayBtn');
            if (playBtn) {
                playBtn.style.background = '#2563eb';
                playBtn.style.transform = 'scale(1.1)';

                const resetPlayBtn = () => {
                    playBtn.style.background = '#9ca3af';
                    playBtn.style.transform = 'scale(1)';
                };

                playBtn.addEventListener('click', resetPlayBtn, { once: true });
                titleElement.addEventListener('click', resetPlayBtn, { once: true });
            }
        }
    }

    initializeDefaultTrack() {
        const currentPath = window.location.pathname;
        const isHomePage = currentPath === '/' ||
                          currentPath === '/index.html' ||
                          currentPath === '' ||
                          (currentPath.endsWith('/') && currentPath.length <= 1);

        if (isHomePage) {
            const defaultTrack = {
                src: '/assets/audio/STUDY_WITH_MIKU-part3.mp3',
                title: 'STUDY WITH MIKU - Part 3'
            };
            this.loadTrack(defaultTrack, false);
        }
    }

    clearState() {
        sessionStorage.removeItem('persistentAudioState');
        localStorage.removeItem('persistentAudioBackup');
    }

    setupUserGestureDetection() {
        // Detect any user gesture to enable autoplay
        const gestureEvents = ['click', 'touchstart', 'keydown', 'mousedown'];

        const gestureHandler = () => {
            if (!this.hasUserGesture) {
                this.hasUserGesture = true;
                console.log('✅ User gesture detected - autoplay enabled');

                // Store gesture permission globally
                sessionStorage.setItem('userGestureGranted', 'true');

                // Try to activate audio context if available
                this.activateAudioContext();
            }
        };

        gestureEvents.forEach(event => {
            document.addEventListener(event, gestureHandler, { once: true, passive: true });
        });

        // Check if gesture was already granted
        if (sessionStorage.getItem('userGestureGranted') === 'true') {
            this.hasUserGesture = true;
        }
    }

    async activateAudioContext() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('🎵 Audio context activated');
            }
        } catch (error) {
            console.log('Audio context activation failed:', error);
        }
    }

    async handlePageNavigation(fromCache = false) {
        console.log('🔄 Handling page navigation...', { fromCache, hasUserGesture: this.hasUserGesture });

        // Attempt automatic resume first
        const wasPlaying = await this.checkIfWasPlaying();

        if (wasPlaying) {
            // Try silent autoplay if we have user gesture
            const autoplaySuccess = await this.attemptSilentAutoplay();

            if (!autoplaySuccess) {
                // Fallback to visual prompt
                this.showResumePrompt();
            }
        } else {
            // Just restore without prompting
            await this.smartResume();
        }
    }

    async attemptSilentAutoplay() {
        try {
            console.log('🤫 Attempting silent autoplay...', {
                hasUserGesture: this.hasUserGesture,
                continuityActive: this.continuityActive
            });

            // Get state from storage
            let resumeState = null;

            if (this.serviceWorker) {
                try {
                    const workerState = await this.sendWorkerMessage('GET_STATE');
                    if (workerState.state && workerState.state.trackInfo) {
                        resumeState = workerState.state;
                    }
                } catch (error) {
                    console.log('Service Worker not available for autoplay');
                }
            }

            if (!resumeState) {
                const savedState = sessionStorage.getItem('persistentAudioState') ||
                                 localStorage.getItem('persistentAudioBackup');
                if (savedState) {
                    resumeState = JSON.parse(savedState);
                }
            }

            if (!resumeState || !resumeState.isPlaying) {
                return false;
            }

            // Load track if needed
            if (!this.currentTrack || this.currentTrack.src !== resumeState.trackInfo.src) {
                await this.loadTrack(resumeState.trackInfo, false);
            }

            // Calculate resume time
            const timeDiff = (Date.now() - resumeState.timestamp) / 1000;
            let resumeTime = resumeState.currentTime;

            if (resumeState.isPlaying) {
                resumeTime += timeDiff;
            }

            // Set audio time
            if (this.audio && resumeTime < this.duration && resumeTime > 0) {
                this.audio.currentTime = resumeTime;
                this.currentTime = resumeTime;
            }

            // Try to play automatically
            if (this.audio) {
                try {
                    // Multiple strategies for autoplay
                    const playPromise = this.audio.play();

                    if (playPromise !== undefined) {
                        await playPromise;

                        // Success!
                        this.isPlaying = true;
                        this.updatePlayButton();
                        this.startVisualization();
                        this.updateMediaSession();
                        this.setStatus('재생 중');
                        this.syncStateToWorker();

                        console.log('✅ Silent autoplay successful!');
                        return true;
                    }
                } catch (playError) {
                    console.log('Silent autoplay failed:', playError.message);

                    // Try with brief mute/unmute trick
                    if (playError.name === 'NotAllowedError') {
                        try {
                            this.audio.muted = true;
                            await this.audio.play();
                            this.audio.muted = false;

                            this.isPlaying = true;
                            this.updatePlayButton();
                            this.startVisualization();
                            this.updateMediaSession();
                            this.setStatus('재생 중');

                            console.log('✅ Autoplay with mute trick successful!');
                            return true;
                        } catch (muteError) {
                            console.log('Mute trick also failed:', muteError.message);
                        }
                    }
                }
            }

            return false;
        } catch (error) {
            console.log('Silent autoplay error:', error);
            return false;
        }
    }

    async checkIfWasPlaying() {
        try {
            if (this.serviceWorker) {
                const workerState = await this.sendWorkerMessage('GET_STATE');
                if (workerState.state) {
                    const timeSinceUpdate = (Date.now() - workerState.state.timestamp) / 1000;
                    return workerState.state.isPlaying && timeSinceUpdate < 5; // Recent playing state
                }
            }
        } catch (error) {
            console.log('Could not check playing state:', error);
        }

        // Fallback to local storage
        const savedState = sessionStorage.getItem('persistentAudioState') ||
                          localStorage.getItem('persistentAudioBackup');
        if (savedState) {
            const state = JSON.parse(savedState);
            const timeSinceUpdate = (Date.now() - state.timestamp) / 1000;
            return state.isPlaying && timeSinceUpdate < 5;
        }

        return false;
    }

    async smartResume() {
        try {
            // Get the most accurate state
            let resumeState = null;

            if (this.serviceWorker) {
                const workerState = await this.sendWorkerMessage('GET_STATE');
                if (workerState.state && workerState.state.trackInfo) {
                    resumeState = workerState.state;
                }
            }

            if (!resumeState) {
                const savedState = sessionStorage.getItem('persistentAudioState') ||
                                 localStorage.getItem('persistentAudioBackup');
                if (savedState) {
                    resumeState = JSON.parse(savedState);
                }
            }

            if (resumeState && resumeState.trackInfo) {
                // Calculate estimated current time
                const timeDiff = (Date.now() - resumeState.timestamp) / 1000;
                let estimatedTime = resumeState.currentTime;

                if (resumeState.isPlaying) {
                    estimatedTime += timeDiff;
                }

                console.log(`🎵 Smart resuming: ${resumeState.trackInfo.title} at ${estimatedTime.toFixed(1)}s`);

                // Load track if different
                if (!this.currentTrack || this.currentTrack.src !== resumeState.trackInfo.src) {
                    await this.loadTrack(resumeState.trackInfo, false);
                }

                // Set time
                if (this.audio && estimatedTime < this.duration && estimatedTime > 0) {
                    this.audio.currentTime = estimatedTime;
                    this.currentTime = estimatedTime;
                    this.updateUI();
                }
            }
        } catch (error) {
            console.log('Smart resume failed:', error);
        }
    }

    async attemptAutoResume() {
        // Try smarter resume logic
        await this.smartResume();
    }

    // Public API
    getCurrentTrack() {
        return this.currentTrack;
    }

    getCurrentTime() {
        return this.currentTime;
    }

    getDuration() {
        return this.duration;
    }

    isCurrentlyPlaying() {
        return this.isPlaying;
    }

    getVolume() {
        return this.volume;
    }
}

// Initialize player when DOM is ready
function initializePersistentAudioPlayer() {
    if (!window.persistentAudioPlayer) {
        console.log('🎵 Initializing Persistent Audio Player...');
        window.persistentAudioPlayer = new PersistentAudioPlayer();

        // Also keep backward compatibility
        window.globalAudioPlayer = window.persistentAudioPlayer;
    }
}

// Multiple initialization strategies
document.addEventListener('DOMContentLoaded', initializePersistentAudioPlayer);
window.addEventListener('load', initializePersistentAudioPlayer);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePersistentAudioPlayer);
} else {
    initializePersistentAudioPlayer();
}

// Immediate attempt
initializePersistentAudioPlayer();

// Fallback after delay
setTimeout(() => {
    if (!window.persistentAudioPlayer || !window.persistentAudioPlayer.isInitialized) {
        initializePersistentAudioPlayer();
    }
}, 500);