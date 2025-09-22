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

        // Handle page navigation
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });

        window.addEventListener('pagehide', () => {
            this.saveState();
        });

        // Enable resume on focus (for cross-page continuity)
        window.addEventListener('focus', () => {
            setTimeout(() => {
                this.attemptAutoResume();
            }, 500);
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(() => {
                    this.attemptAutoResume();
                }, 500);
            }
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
        if (titleElement && this.currentTrack) {
            titleElement.textContent = this.currentTrack.title || 'Unknown Track';
        }
    }

    updateUI() {
        this.updatePlayButton();
        this.updateProgress();
        this.updateTime();
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
        // Try to get state from Service Worker first
        if (this.serviceWorker) {
            try {
                const workerState = await this.sendWorkerMessage('GET_STATE');
                if (workerState.state && workerState.state.trackInfo) {
                    console.log('🔄 Restoring from Service Worker:', workerState.state.trackInfo.title);
                    await this.loadTrack(workerState.state.trackInfo, false);

                    if (this.audio) {
                        this.audio.currentTime = workerState.state.currentTime || 0;
                    }
                    this.currentTime = workerState.state.currentTime || 0;
                    this.volume = workerState.state.volume || 1;

                    if (workerState.state.isPlaying) {
                        this.setStatus('Click to resume');
                        const titleElement = this.miniPlayerElement?.querySelector('#persistentTitle');
                        if (titleElement) {
                            const originalTitle = titleElement.textContent;
                            titleElement.textContent = '▶️ Click to resume';
                            titleElement.style.cursor = 'pointer';
                            titleElement.addEventListener('click', () => {
                                this.play(this.currentTime);
                                titleElement.textContent = originalTitle;
                                titleElement.style.cursor = 'default';
                            }, { once: true });
                        }
                    }
                    return;
                }
            } catch (error) {
                console.log('Service Worker state not available, trying local storage');
            }
        }

        // Fallback to local storage
        let savedState = sessionStorage.getItem('persistentAudioState');
        if (!savedState) {
            savedState = localStorage.getItem('persistentAudioBackup');
        }

        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                console.log('🔄 Restoring audio state:', state.trackInfo?.title);

                if (state.trackInfo) {
                    await this.loadTrack(state.trackInfo, false);
                    if (this.audio) {
                        this.audio.currentTime = state.currentTime || 0;
                    }
                    this.currentTime = state.currentTime || 0;
                    this.volume = state.volume || 1;
                    this.isMinimized = state.isMinimized || false;

                    if (state.isPlaying) {
                        this.setStatus('Click to resume');
                        const titleElement = this.miniPlayerElement?.querySelector('#persistentTitle');
                        if (titleElement) {
                            const originalTitle = titleElement.textContent;
                            titleElement.textContent = '▶️ Click to resume';
                            titleElement.style.cursor = 'pointer';
                            titleElement.addEventListener('click', () => {
                                this.play(this.currentTime);
                                titleElement.textContent = originalTitle;
                                titleElement.style.cursor = 'default';
                            }, { once: true });
                        }
                    }

                    if (this.isMinimized) {
                        this.toggleMinimize();
                    }
                }
            } catch (error) {
                console.error('Failed to restore state:', error);
            }
        } else {
            // Load default track on homepage
            this.initializeDefaultTrack();
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

    async attemptAutoResume() {
        // Check if we should auto-resume from Service Worker state
        if (this.serviceWorker && this.currentTrack && !this.isPlaying) {
            try {
                const workerState = await this.sendWorkerMessage('GET_STATE');
                if (workerState.state && workerState.state.isPlaying) {
                    console.log('🔄 Auto-resuming from Service Worker state');

                    // Update time from worker state
                    const timeDiff = (Date.now() - workerState.state.timestamp) / 1000;
                    const resumeTime = workerState.state.currentTime + timeDiff;

                    if (this.audio && resumeTime < this.duration) {
                        await this.play(resumeTime);
                    }
                }
            } catch (error) {
                console.log('Auto-resume failed:', error);
            }
        }
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