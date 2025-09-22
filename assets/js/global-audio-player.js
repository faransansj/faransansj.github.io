/**
 * Global Audio Player Manager
 * Provides persistent audio playback across page navigation
 */

class GlobalAudioPlayer {
    constructor() {
        this.audio = null;
        this.currentTrack = null;
        this.isPlaying = false;
        this.isInitialized = false;
        this.miniPlayerElement = null;
        this.isMinimized = false;
        this.originalSidebarDisplay = null;
        this.stateUpdateInterval = null;
        this.isRestoringState = false;
        this.lastRestoredTimestamp = null;
        this.isToggling = false; // 중복 토글 방지
        this.crossPageContinuity = {
            enabled: true,
            lastSaveTime: 0,
            saveInterval: 1000, // 1초마다 저장
            maxRestoreAttempts: 3,
            restoreAttemptCount: 0
        };
        this.visualizerData = {
            analyser: null,
            dataArray: null,
            source: null,
            animationId: null,
            previousBarHeights: [],
            lastVisualizationTime: 0
        };

        // Constants
        this.BARS_COUNT = 12; // Reduced for mini player
        this.VISUALIZATION_FPS = 30; // Reduced for performance
        this.FRAME_INTERVAL = 1000 / this.VISUALIZATION_FPS;
        this.SMOOTHING_FACTOR = 0.7;

        this.init();
    }

    init() {
        if (this.isInitialized) return;

        // Check if there's already a global audio instance
        if (window.globalAudioPlayer && window.globalAudioPlayer !== this) {
            return window.globalAudioPlayer;
        }

        this.createMiniPlayer();
        this.bindEvents();
        this.isInitialized = true;

        // Make this instance globally available
        window.globalAudioPlayer = this;

        return this;
    }

    createMiniPlayer() {
        if (this.miniPlayerElement) {
            return;
        }

        try {
            // Create mini player container
            this.miniPlayerElement = document.createElement('div');
            this.miniPlayerElement.id = 'global-mini-player';
            this.miniPlayerElement.className = 'mini-player hidden';
            this.miniPlayerElement.innerHTML = `
                <div class="mini-player-content">
                    <div class="mini-header">
                        <button class="mini-minimize-btn" id="miniMinimizeBtn" title="Minimize">−</button>
                        <button class="mini-close-btn" id="miniCloseBtn" title="Close">×</button>
                    </div>
                    <div class="mini-controls">
                        <button class="mini-play-btn" id="miniPlayBtn">
                            <div class="mini-play-icon"></div>
                        </button>
                        <div class="mini-info">
                            <div class="mini-title" id="miniTitle">No track loaded</div>
                            <div class="mini-time" id="miniTime">0:00/0:00</div>
                        </div>
                        <div class="mini-visualizer" id="miniVisualizer"></div>
                    </div>
                    <div class="mini-progress-bar" id="miniProgressBar">
                        <div class="mini-progress" id="miniProgress"></div>
                    </div>
                </div>
            `;

            // Add to body
            document.body.appendChild(this.miniPlayerElement);

            // Auto-show mini player when created (key fix for visibility)
            setTimeout(() => {
                this.showMiniPlayer();
            }, 100);

            // Create visualizer bars for mini player
            const visualizer = this.miniPlayerElement.querySelector('#miniVisualizer');
            if (visualizer) {
                for (let i = 0; i < this.BARS_COUNT; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'mini-bar';
                    visualizer.appendChild(bar);
                }
            }

            this.bindMiniPlayerEvents();
        } catch (error) {
            // Silently handle creation errors
        }
    }

    bindMiniPlayerEvents() {
        const miniPlayBtn = this.miniPlayerElement.querySelector('#miniPlayBtn');
        const miniProgressBar = this.miniPlayerElement.querySelector('#miniProgressBar');
        const miniCloseBtn = this.miniPlayerElement.querySelector('#miniCloseBtn');
        const miniMinimizeBtn = this.miniPlayerElement.querySelector('#miniMinimizeBtn');

        miniPlayBtn.addEventListener('click', () => this.togglePlay());
        miniCloseBtn.addEventListener('click', () => this.stop());
        miniMinimizeBtn.addEventListener('click', () => this.toggleMinimize());

        miniProgressBar.addEventListener('click', (e) => {
            if (!this.audio || !this.audio.duration) return;

            const rect = miniProgressBar.getBoundingClientRect();
            const percentage = (e.clientX - rect.left) / rect.width;
            const newTime = percentage * this.audio.duration;

            if (!isNaN(newTime)) {
                this.audio.currentTime = newTime;
            }
        });
    }

    bindEvents() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.visualizerData.animationId) {
                this.stopVisualizer();
            } else if (!document.hidden && this.isPlaying && !this.visualizerData.animationId) {
                this.startVisualizer();
            }
        });

        // Enhanced page unload handling for audio continuity
        const saveCurrentState = () => {
            if (this.audio && this.currentTrack) {
                const state = {
                    currentTime: this.audio.currentTime || 0,
                    trackInfo: this.currentTrack,
                    isPlaying: this.isPlaying,
                    isMinimized: this.isMinimized,
                    timestamp: Date.now(),
                    volume: this.audio.volume || 1,
                    crossPageFlag: true // 크로스 페이지 연속성 플래그
                };
                sessionStorage.setItem('globalAudioState', JSON.stringify(state));
                // 추가 백업 저장
                localStorage.setItem('globalAudioBackup', JSON.stringify(state));
            }
        };

        // Handle beforeunload to maintain state
        window.addEventListener('beforeunload', saveCurrentState);

        // Handle page unload with pagehide event (more reliable)
        window.addEventListener('pagehide', saveCurrentState);

        // Also save state when visibility changes (e.g., tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                saveCurrentState();
            }
        });

        // Periodic state saving during playback - 크로스 페이지 연속성 강화
        setInterval(() => {
            if (this.isPlaying && this.audio && this.currentTrack) {
                saveCurrentState();
            }
            // 비활성 상태에서도 주기적으로 저장 (네비게이션 대비)
            if (this.currentTrack && Date.now() - this.crossPageContinuity.lastSaveTime > this.crossPageContinuity.saveInterval) {
                saveCurrentState();
                this.crossPageContinuity.lastSaveTime = Date.now();
            }
        }, 1000); // 더 자주 저장 (1초마다)

        // Multiple event listeners for state restoration
        window.addEventListener('DOMContentLoaded', () => {
            this.restoreState();
        });

        window.addEventListener('load', () => {
            this.restoreState();
        });

        // Also restore immediately if DOM is already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.restoreState();
            });
        } else {
            // DOM is already loaded, restore immediately
            this.restoreState();
        }

        // Additional immediate restoration attempts
        setTimeout(() => this.restoreState(), 50);
        setTimeout(() => this.restoreState(), 200);
        setTimeout(() => this.restoreState(), 500);
    }

    restoreState() {
        // Prevent multiple restorations of the same state
        if (this.isRestoringState) {
            return;
        }

        // 크로스 페이지 연속성 강화된 복원
        let savedState = sessionStorage.getItem('globalAudioState');

        // 세션 스토리지에 없으면 로컬 스토리지 백업에서 복원
        if (!savedState) {
            savedState = localStorage.getItem('globalAudioBackup');
        }

        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                if (state.trackInfo && (!this.lastRestoredTimestamp || state.timestamp !== this.lastRestoredTimestamp)) {
                    this.isRestoringState = true;
                    this.lastRestoredTimestamp = state.timestamp;
                    this.loadTrack(state.trackInfo, false);

                    if (this.audio) {
                        // Set up audio event listeners for seamless restoration
                        const handleCanPlay = () => {
                            // 더 정확한 시간 복원
                            if (state.currentTime && state.currentTime > 0) {
                                this.audio.currentTime = state.currentTime;
                            }

                            // 볼륨 복원
                            if (state.volume !== undefined) {
                                this.audio.volume = state.volume;
                            }

                            // Restore minimized state
                            if (state.isMinimized) {
                                this.isMinimized = state.isMinimized;
                                setTimeout(() => {
                                    if (this.miniPlayerElement) {
                                        this.miniPlayerElement.classList.add('minimized');
                                        const minimizeBtn = this.miniPlayerElement.querySelector('#miniMinimizeBtn');
                                        if (minimizeBtn) {
                                            minimizeBtn.textContent = '+';
                                            minimizeBtn.title = 'Expand';
                                        }
                                    }
                                }, 100);
                            }

                            if (state.isPlaying) {
                                // Show mini player immediately
                                this.showMiniPlayer();

                                // 크로스 페이지 연속성을 위한 자동 재생 시도
                                const attemptAutoPlay = () => {
                                    this.play().catch(() => {
                                        // Auto-play prevented, UI 업데이트
                                        this.isPlaying = false;
                                        this.updatePlayButton();

                                        const titleElement = this.miniPlayerElement?.querySelector('#miniTitle');
                                        if (titleElement) {
                                            titleElement.textContent = '▶️ Click to resume';
                                            titleElement.style.cursor = 'pointer';

                                            // 클릭으로 재생 재개
                                            titleElement.addEventListener('click', () => {
                                                this.play();
                                                titleElement.textContent = this.currentTrack.title;
                                                titleElement.style.cursor = 'default';
                                            }, { once: true });
                                        }
                                    });
                                };

                                // 약간의 지연 후 자동 재생 시도
                                setTimeout(attemptAutoPlay, 500);
                            } else {
                                // Show mini player even if not playing (track was loaded)
                                this.showMiniPlayer();
                            }

                            // Remove the event listener after restoration
                            this.audio.removeEventListener('canplay', handleCanPlay);
                            this.isRestoringState = false;
                        };

                        // Listen for when audio is ready to play
                        this.audio.addEventListener('canplay', handleCanPlay);

                        // Fallback: try restoration after a short delay if canplay doesn't fire
                        setTimeout(() => {
                            if (this.audio.readyState >= 3) { // HAVE_FUTURE_DATA
                                handleCanPlay();
                            } else {
                                this.isRestoringState = false; // Reset flag if restoration fails
                            }
                        }, 500);
                    }
                }
            } catch (e) {
                this.isRestoringState = false; // Reset flag on error

                // 복원 실패시 재시도
                if (this.crossPageContinuity.restoreAttemptCount < this.crossPageContinuity.maxRestoreAttempts) {
                    this.crossPageContinuity.restoreAttemptCount++;
                    setTimeout(() => this.restoreState(), 1000);
                }
            }
        } else {
            // 저장된 상태가 없으면 기본 트랙 로드 시도
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

    loadTrack(trackInfo, autoPlay = false) {
        this.currentTrack = trackInfo;

        // Create audio element if it doesn't exist
        if (!this.audio) {
            this.audio = document.createElement('audio');
            this.audio.preload = 'metadata';
            // 크로스 페이지 연속성을 위한 속성 설정
            this.audio.crossOrigin = 'anonymous';
            this.audio.preservesPitch = false;
            this.bindAudioEvents();
        }

        // Set source
        this.audio.src = trackInfo.src;

        // Update mini player
        this.updateMiniPlayerInfo();

        if (autoPlay) {
            this.play();
        }

        this.showMiniPlayer();

        // 트랙 로드시 상태 저장
        this.saveState();
    }

    saveState() {
        if (this.audio && this.currentTrack) {
            const state = {
                currentTime: this.audio.currentTime,
                trackInfo: this.currentTrack,
                isPlaying: this.isPlaying,
                isMinimized: this.isMinimized
            };
            sessionStorage.setItem('globalAudioState', JSON.stringify(state));
        }
    }

    startStateUpdates() {
        if (this.stateUpdateInterval) {
            clearInterval(this.stateUpdateInterval);
        }
        // Save state every 2 seconds while playing
        this.stateUpdateInterval = setInterval(() => {
            this.saveState();
        }, 2000);
    }

    stopStateUpdates() {
        if (this.stateUpdateInterval) {
            clearInterval(this.stateUpdateInterval);
            this.stateUpdateInterval = null;
        }
    }

    bindAudioEvents() {
        if (!this.audio) return;

        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.isToggling = false; // 재설정
            this.updatePlayButton();
            this.stopVisualizer();
        });

        this.audio.addEventListener('canplay', () => {
            this.updateMiniPlayerInfo();
        });

        this.audio.addEventListener('playing', () => {
            this.isPlaying = true;
            this.isToggling = false; // 재설정
            this.updatePlayButton();
            this.initAudioContext();
            this.startVisualizer();
            this.startStateUpdates();
            this.saveState(); // Save immediately when playing starts
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.isToggling = false; // 재설정
            this.updatePlayButton();
            this.stopVisualizer();
            this.stopStateUpdates();
            this.saveState(); // Save immediately when paused
        });

        // 오디오 에러 핸들링 추가
        this.audio.addEventListener('error', () => {
            this.isPlaying = false;
            this.isToggling = false;
            this.updatePlayButton();
        });
    }

    async initAudioContext() {
        if (this.visualizerData.analyser) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.visualizerData.analyser = this.audioContext.createAnalyser();
            this.visualizerData.analyser.fftSize = 2048;
            this.visualizerData.analyser.smoothingTimeConstant = 0.8;

            this.visualizerData.source = this.audioContext.createMediaElementSource(this.audio);
            this.visualizerData.source.connect(this.visualizerData.analyser);
            this.visualizerData.analyser.connect(this.audioContext.destination);

            this.visualizerData.dataArray = new Uint8Array(this.visualizerData.analyser.frequencyBinCount);
            this.visualizerData.previousBarHeights = new Array(this.BARS_COUNT).fill(4);

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
        } catch (error) {
            // Silently handle audio context initialization errors
        }
    }

    startVisualizer() {
        if (!this.visualizerData.analyser || this.visualizerData.animationId) return;

        const updateVisualizer = (timestamp) => {
            if (!this.isPlaying) return;

            if (timestamp - this.visualizerData.lastVisualizationTime < this.FRAME_INTERVAL) {
                this.visualizerData.animationId = requestAnimationFrame(updateVisualizer);
                return;
            }
            this.visualizerData.lastVisualizationTime = timestamp;

            this.visualizerData.analyser.getByteFrequencyData(this.visualizerData.dataArray);
            const bars = this.miniPlayerElement.querySelectorAll('.mini-bar');
            const dataLength = this.visualizerData.dataArray.length;

            for (let i = 0; i < this.BARS_COUNT; i++) {
                const dataIndex = Math.floor((i / this.BARS_COUNT) * dataLength / 4);
                const value = this.visualizerData.dataArray[dataIndex] || 0;
                const heightPercentage = Math.max(4, (value / 255) * 100);

                const smoothedHeight = this.visualizerData.previousBarHeights[i] +
                    (heightPercentage - this.visualizerData.previousBarHeights[i]) * this.SMOOTHING_FACTOR;

                this.visualizerData.previousBarHeights[i] = smoothedHeight;
                bars[i].style.height = `${smoothedHeight}%`;
            }

            this.visualizerData.animationId = requestAnimationFrame(updateVisualizer);
        };

        this.visualizerData.animationId = requestAnimationFrame(updateVisualizer);
    }

    stopVisualizer() {
        if (this.visualizerData.animationId) {
            cancelAnimationFrame(this.visualizerData.animationId);
            this.visualizerData.animationId = null;
        }
    }

    async play() {
        if (!this.audio) return;

        try {
            // 크로스 페이지 연속성을 위한 오디오 컨텍스트 복원
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            await this.audio.play();
            // 상태는 'playing' 이벤트에서 업데이트됨
            this.showMiniPlayer();

            // 재생 시작시 즉시 상태 저장
            this.saveState();
        } catch (error) {
            // 재생 실패시 상태 복구
            this.isPlaying = false;
            this.updatePlayButton();
        }
    }

    pause() {
        if (!this.audio) return;

        this.audio.pause();
        // 상태는 'pause' 이벤트에서 업데이트됨
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }

        this.isPlaying = false;
        this.currentTrack = null;
        this.updatePlayButton();
        this.stopVisualizer();
        this.stopStateUpdates();
        this.hideMiniPlayer();

        // Clear saved state
        sessionStorage.removeItem('globalAudioState');
    }

    async togglePlay() {
        if (!this.audio || !this.currentTrack) return;

        // 중복 호출 방지
        if (this.isToggling) {
            return;
        }
        this.isToggling = true;

        try {
            // 현재 상태를 오디오 요소에서 직접 확인
            const actuallyPlaying = !this.audio.paused && !this.audio.ended;

            if (actuallyPlaying) {
                this.pause();
            } else {
                await this.play();
            }
        } catch (error) {
            // 오류 발생시 상태 복구
            this.isPlaying = false;
            this.updatePlayButton();
        } finally {
            this.isToggling = false;
        }
    }

    updatePlayButton() {
        if (!this.miniPlayerElement) {
            return;
        }

        // 재생/일시정지 아이콘을 더 안전하게 찾기
        let playIcon = this.miniPlayerElement.querySelector('.mini-play-icon');
        if (!playIcon) {
            playIcon = this.miniPlayerElement.querySelector('.mini-pause-icon');
        }

        if (!playIcon) {
            // 아이콘 요소가 없으면 버튼 내에서 찾기
            const playButton = this.miniPlayerElement.querySelector('#miniPlayBtn');
            if (playButton) {
                playIcon = playButton.querySelector('div');
            }
        }

        if (!playIcon) {
            return; // 안전하게 종료
        }

        if (this.isPlaying) {
            playIcon.className = 'mini-pause-icon';
            playIcon.innerHTML = '<span></span><span></span>';
        } else {
            playIcon.className = 'mini-play-icon';
            playIcon.innerHTML = '';
        }
    }

    updateProgress() {
        if (!this.audio || !this.audio.duration) return;

        const percentage = (this.audio.currentTime / this.audio.duration) * 100;
        const progressElement = this.miniPlayerElement.querySelector('#miniProgress');
        const timeElement = this.miniPlayerElement.querySelector('#miniTime');

        if (progressElement) {
            progressElement.style.width = `${percentage}%`;
        }

        if (timeElement) {
            timeElement.textContent = `${this.formatTime(this.audio.currentTime)}/${this.formatTime(this.audio.duration)}`;
        }
    }

    updateMiniPlayerInfo() {
        const titleElement = this.miniPlayerElement.querySelector('#miniTitle');
        if (titleElement && this.currentTrack) {
            titleElement.textContent = this.currentTrack.title || 'Unknown Track';
        }
    }

    showMiniPlayer() {
        if (!this.miniPlayerElement) {
            this.createMiniPlayer();
        }

        if (this.miniPlayerElement) {
            this.miniPlayerElement.classList.remove('hidden');
            // Force display to ensure visibility
            this.miniPlayerElement.style.display = 'block';
            this.hideSidebarOnOtherPages();
        }
    }

    hideMiniPlayer() {
        if (this.miniPlayerElement) {
            this.miniPlayerElement.classList.add('hidden');
            this.restoreSidebar();
        }
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        const miniPlayerContent = this.miniPlayerElement.querySelector('.mini-player-content');
        const minimizeBtn = this.miniPlayerElement.querySelector('#miniMinimizeBtn');

        if (this.isMinimized) {
            this.miniPlayerElement.classList.add('minimized');
            minimizeBtn.textContent = '+';
            minimizeBtn.title = 'Expand';
        } else {
            this.miniPlayerElement.classList.remove('minimized');
            minimizeBtn.textContent = '−';
            minimizeBtn.title = 'Minimize';
        }
    }

    hideSidebarOnOtherPages() {
        // Only hide sidebar if we're not on the home page
        const currentPath = window.location.pathname;
        const isHomePage = currentPath === '/' ||
                          currentPath === '/index.html' ||
                          currentPath === '' ||
                          (currentPath.endsWith('/') && currentPath.length <= 1);

        if (!isHomePage) {
            // Comprehensive sidebar element selectors
            const sidebarSelectors = [
                '.sidebar',
                '.sidebar.sticky',
                '.author__avatar',
                '.author__content',
                '.author__urls-wrapper',
                '.sidebar-item'
            ];

            let hiddenCount = 0;
            sidebarSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (element && element.style.display !== 'none') {
                        element.style.display = 'none';
                        hiddenCount++;
                    }
                });
            });

        }
    }

    restoreSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const authorProfile = document.querySelector('.author__avatar');
        const authorContent = document.querySelector('.author__content');

        if (sidebar) {
            if (this.originalSidebarDisplay !== null) {
                sidebar.style.display = this.originalSidebarDisplay;
                this.originalSidebarDisplay = null;
            } else {
                sidebar.style.display = '';
            }
        }

        if (authorProfile) {
            authorProfile.style.display = '';
        }

        if (authorContent) {
            authorContent.style.display = '';
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // Public API for external components
    getCurrentTrack() {
        return this.currentTrack;
    }

    getCurrentTime() {
        return this.audio ? this.audio.currentTime : 0;
    }

    getDuration() {
        return this.audio ? this.audio.duration : 0;
    }

    isCurrentlyPlaying() {
        return this.isPlaying;
    }
}

// Initialize global audio player with multiple fallback methods
function initializeGlobalPlayer() {
    if (!window.globalAudioPlayer) {
        window.globalAudioPlayer = new GlobalAudioPlayer();

        // Auto-load the default track only on homepage
        setTimeout(() => {
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
                window.globalAudioPlayer.loadTrack(defaultTrack, false);
            }
        }, 1000);
    }
}

// Multiple initialization strategies
document.addEventListener('DOMContentLoaded', initializeGlobalPlayer);
window.addEventListener('load', initializeGlobalPlayer);

// Check DOM ready state and initialize if needed
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGlobalPlayer);
} else {
    // DOM is already loaded
    initializeGlobalPlayer();
}

// Ensure it's available immediately
initializeGlobalPlayer();

// Additional check after a short delay (for dynamic content)
setTimeout(() => {
    if (!window.globalAudioPlayer || !window.globalAudioPlayer.isInitialized) {
        initializeGlobalPlayer();
    }
}, 500);