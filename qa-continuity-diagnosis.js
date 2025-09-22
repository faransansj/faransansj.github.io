/**
 * Deep Diagnosis of Audio Continuity Issues
 * Identifies root causes of interrupted audio during navigation
 */

const { chromium } = require('playwright');

async function diagnoseAudioContinuity() {
    console.log('🔬 Deep Audio Continuity Diagnosis\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--autoplay-policy=no-user-gesture-required']
    });

    const page = await browser.newPage();

    let issues = [];

    function logIssue(category, severity, description, details = null) {
        const issue = { category, severity, description, details, timestamp: new Date() };
        issues.push(issue);
        console.log(`${severity === 'CRITICAL' ? '🚨' : severity === 'MAJOR' ? '⚠️' : 'ℹ️'} [${category}] ${description}`);
        if (details) console.log(`   Details: ${details}`);
    }

    try {
        console.log('1️⃣ Loading homepage and analyzing initial state...');
        await page.goto('http://127.0.0.1:4003');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // 초기 상태 분석
        const initialAnalysis = await page.evaluate(() => {
            const analysis = {
                globalPlayerExists: !!window.globalAudioPlayer,
                miniPlayerElement: !!document.querySelector('#global-mini-player'),
                audioElementExists: false,
                audioContextState: null,
                documentReadyState: document.readyState,
                scriptLoadStatus: {},
                mediaCapabilities: {
                    canPlayMP3: false,
                    audioContextSupport: !!window.AudioContext,
                    webAudioSupport: !!(window.AudioContext || window.webkitAudioContext)
                }
            };

            if (window.globalAudioPlayer) {
                analysis.audioElementExists = !!window.globalAudioPlayer.audio;
                if (window.globalAudioPlayer.audioContext) {
                    analysis.audioContextState = window.globalAudioPlayer.audioContext.state;
                }
            }

            // Check script loading
            const scripts = Array.from(document.scripts);
            analysis.scriptLoadStatus.globalAudioPlayer = scripts.some(s =>
                s.src.includes('global-audio-player.js'));

            // Test audio capabilities
            const testAudio = document.createElement('audio');
            analysis.mediaCapabilities.canPlayMP3 = testAudio.canPlayType('audio/mpeg') !== '';

            return analysis;
        });

        console.log('   📊 Initial Analysis:');
        Object.entries(initialAnalysis).forEach(([key, value]) => {
            console.log(`      ${key}: ${JSON.stringify(value)}`);
        });

        if (!initialAnalysis.globalPlayerExists) {
            logIssue('ARCHITECTURE', 'CRITICAL', 'Global audio player not initialized');
        }

        if (!initialAnalysis.mediaCapabilities.canPlayMP3) {
            logIssue('BROWSER', 'MAJOR', 'Browser cannot play MP3 format');
        }

        // 미니 플레이어 생성 및 로드 테스트
        console.log('\\n2️⃣ Testing audio loading and playback...');

        await page.evaluate(() => {
            if (window.globalAudioPlayer) {
                window.globalAudioPlayer.createMiniPlayer();
                window.globalAudioPlayer.showMiniPlayer();

                const trackInfo = {
                    src: '/assets/audio/STUDY_WITH_MIKU-part3.mp3',
                    title: 'Diagnosis Test Track'
                };
                window.globalAudioPlayer.loadTrack(trackInfo, false);
            }
        });

        await page.waitForTimeout(3000);

        // 수동 재생 시작
        const playButton = await page.$('#miniPlayBtn');
        if (playButton) {
            await playButton.click();
            await page.waitForTimeout(3000);

            const playbackState = await page.evaluate(() => {
                if (!window.globalAudioPlayer) return null;

                return {
                    isPlaying: window.globalAudioPlayer.isCurrentlyPlaying(),
                    currentTime: window.globalAudioPlayer.getCurrentTime(),
                    duration: window.globalAudioPlayer.getDuration(),
                    audioSrc: window.globalAudioPlayer.audio ? window.globalAudioPlayer.audio.src : null,
                    audioReadyState: window.globalAudioPlayer.audio ? window.globalAudioPlayer.audio.readyState : 0,
                    audioNetworkState: window.globalAudioPlayer.audio ? window.globalAudioPlayer.audio.networkState : 0,
                    audioPaused: window.globalAudioPlayer.audio ? window.globalAudioPlayer.audio.paused : true,
                    audioEnded: window.globalAudioPlayer.audio ? window.globalAudioPlayer.audio.ended : true,
                    audioError: window.globalAudioPlayer.audio && window.globalAudioPlayer.audio.error ?
                        window.globalAudioPlayer.audio.error.message : null,
                    sessionStorageState: sessionStorage.getItem('globalAudioState'),
                    localStorageBackup: localStorage.getItem('globalAudioBackup')
                };
            });

            console.log('   🎵 Playback State Analysis:');
            Object.entries(playbackState || {}).forEach(([key, value]) => {
                console.log(`      ${key}: ${value}`);
            });

            if (!playbackState.isPlaying) {
                logIssue('PLAYBACK', 'CRITICAL', 'Audio failed to start playing after user interaction');
            }

            if (playbackState.audioReadyState < 3) {
                logIssue('LOADING', 'MAJOR', `Audio not fully loaded (readyState: ${playbackState.audioReadyState})`);
            }
        } else {
            logIssue('UI', 'CRITICAL', 'Play button not found in DOM');
        }

        // 네비게이션 전 상태 기록
        console.log('\\n3️⃣ Recording pre-navigation state...');
        const preNavState = await page.evaluate(() => {
            const state = {
                timestamp: Date.now(),
                currentTime: window.globalAudioPlayer ? window.globalAudioPlayer.getCurrentTime() : 0,
                isPlaying: window.globalAudioPlayer ? window.globalAudioPlayer.isCurrentlyPlaying() : false,
                audioElementId: window.globalAudioPlayer && window.globalAudioPlayer.audio ?
                    window.globalAudioPlayer.audio.id || 'no-id' : 'no-audio',
                miniPlayerHTML: document.querySelector('#global-mini-player') ?
                    document.querySelector('#global-mini-player').outerHTML.length : 0,
                globalPlayerMethods: window.globalAudioPlayer ? Object.getOwnPropertyNames(window.globalAudioPlayer) : [],
                eventListeners: window.globalAudioPlayer && window.globalAudioPlayer.audio ?
                    'attached' : 'missing'
            };

            // 강제 상태 저장
            if (window.globalAudioPlayer) {
                window.globalAudioPlayer.saveState();
            }

            return state;
        });

        console.log('   📸 Pre-navigation snapshot:');
        Object.entries(preNavState).forEach(([key, value]) => {
            if (key !== 'globalPlayerMethods') {
                console.log(`      ${key}: ${value}`);
            }
        });

        // 네비게이션 실행
        console.log('\\n4️⃣ Executing navigation...');
        const targetUrl = 'http://127.0.0.1:4003/categories/raspberrypi_car';

        // 네비게이션 프로세스 모니터링
        let navigationEvents = [];

        page.on('framenavigated', () => {
            navigationEvents.push({ event: 'framenavigated', time: Date.now() });
        });

        page.on('domcontentloaded', () => {
            navigationEvents.push({ event: 'domcontentloaded', time: Date.now() });
        });

        page.on('load', () => {
            navigationEvents.push({ event: 'load', time: Date.now() });
        });

        await page.goto(targetUrl);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000); // 복원 시간 충분히 대기

        console.log('   🔄 Navigation events:', navigationEvents);

        // 네비게이션 후 상태 분석
        console.log('\\n5️⃣ Analyzing post-navigation state...');
        const postNavState = await page.evaluate(() => {
            const state = {
                timestamp: Date.now(),
                globalPlayerExists: !!window.globalAudioPlayer,
                globalPlayerSame: window.globalAudioPlayer === window.globalAudioPlayer, // 참조 확인
                currentTime: window.globalAudioPlayer ? window.globalAudioPlayer.getCurrentTime() : 0,
                isPlaying: window.globalAudioPlayer ? window.globalAudioPlayer.isCurrentlyPlaying() : false,
                audioElementExists: window.globalAudioPlayer ? !!window.globalAudioPlayer.audio : false,
                audioElementId: window.globalAudioPlayer && window.globalAudioPlayer.audio ?
                    window.globalAudioPlayer.audio.id || 'no-id' : 'no-audio',
                miniPlayerExists: !!document.querySelector('#global-mini-player'),
                miniPlayerVisible: !!document.querySelector('#global-mini-player:not(.hidden)'),
                miniPlayerHTML: document.querySelector('#global-mini-player') ?
                    document.querySelector('#global-mini-player').outerHTML.length : 0,
                sessionStorageState: sessionStorage.getItem('globalAudioState'),
                localStorageBackup: localStorage.getItem('globalAudioBackup'),
                stateRestored: false,
                trackLoaded: window.globalAudioPlayer ? !!window.globalAudioPlayer.getCurrentTrack() : false,
                audioSrc: window.globalAudioPlayer && window.globalAudioPlayer.audio ?
                    window.globalAudioPlayer.audio.src : null,
                errors: []
            };

            // 복원 상태 확인
            if (state.sessionStorageState || state.localStorageBackup) {
                state.stateRestored = true;
            }

            return state;
        });

        console.log('   📸 Post-navigation snapshot:');
        Object.entries(postNavState).forEach(([key, value]) => {
            console.log(`      ${key}: ${value}`);
        });

        // 연속성 분석
        console.log('\\n6️⃣ Continuity Analysis...');

        if (!postNavState.globalPlayerExists) {
            logIssue('PERSISTENCE', 'CRITICAL', 'Global audio player instance lost during navigation');
        }

        if (!postNavState.audioElementExists) {
            logIssue('PERSISTENCE', 'CRITICAL', 'Audio element destroyed during navigation');
        }

        if (!postNavState.miniPlayerExists) {
            logIssue('UI', 'CRITICAL', 'Mini player element lost during navigation');
        }

        if (!postNavState.stateRestored) {
            logIssue('STATE', 'MAJOR', 'Audio state not restored from storage');
        }

        const timeContinuity = postNavState.currentTime >= preNavState.currentTime;
        if (!timeContinuity) {
            logIssue('CONTINUITY', 'MAJOR',
                `Audio time went backwards: ${preNavState.currentTime}s → ${postNavState.currentTime}s`);
        }

        if (preNavState.isPlaying && !postNavState.isPlaying) {
            logIssue('PLAYBACK', 'MAJOR', 'Audio playback stopped during navigation');
        }

        // 수동 재개 테스트
        console.log('\\n7️⃣ Testing manual resume capability...');
        if (postNavState.miniPlayerExists) {
            const resumeButton = await page.$('#miniPlayBtn');
            if (resumeButton) {
                await resumeButton.click();
                await page.waitForTimeout(2000);

                const resumeState = await page.evaluate(() => ({
                    isPlaying: window.globalAudioPlayer ? window.globalAudioPlayer.isCurrentlyPlaying() : false,
                    currentTime: window.globalAudioPlayer ? window.globalAudioPlayer.getCurrentTime() : 0
                }));

                console.log(`   Resume test: Playing=${resumeState.isPlaying}, Time=${resumeState.currentTime.toFixed(2)}s`);

                if (!resumeState.isPlaying) {
                    logIssue('RECOVERY', 'MAJOR', 'Manual resume failed after navigation');
                }
            } else {
                logIssue('UI', 'MAJOR', 'Resume button not accessible after navigation');
            }
        }

        // 최종 진단 리포트
        console.log('\\n' + '='.repeat(80));
        console.log('🔬 AUDIO CONTINUITY DIAGNOSIS REPORT');
        console.log('='.repeat(80));

        const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
        const majorIssues = issues.filter(i => i.severity === 'MAJOR');
        const minorIssues = issues.filter(i => i.severity === 'MINOR');

        console.log(`🚨 Critical Issues: ${criticalIssues.length}`);
        console.log(`⚠️  Major Issues: ${majorIssues.length}`);
        console.log(`ℹ️  Minor Issues: ${minorIssues.length}`);

        if (criticalIssues.length > 0) {
            console.log('\\n🚨 CRITICAL ISSUES (Must Fix):');
            criticalIssues.forEach(issue => {
                console.log(`   • [${issue.category}] ${issue.description}`);
            });
        }

        if (majorIssues.length > 0) {
            console.log('\\n⚠️  MAJOR ISSUES (Should Fix):');
            majorIssues.forEach(issue => {
                console.log(`   • [${issue.category}] ${issue.description}`);
            });
        }

        // 근본적 원인 분석
        console.log('\\n🎯 ROOT CAUSE ANALYSIS:');

        if (criticalIssues.some(i => i.category === 'PERSISTENCE')) {
            console.log('   ❌ FUNDAMENTAL ISSUE: Object persistence broken');
            console.log('      → Solution: Implement Service Worker + SharedArrayBuffer approach');
        }

        if (criticalIssues.some(i => i.category === 'PLAYBACK')) {
            console.log('   ❌ PLAYBACK ISSUE: Audio context/element recreation needed');
            console.log('      → Solution: Use Web Audio API with persistent buffer');
        }

        if (majorIssues.some(i => i.category === 'STATE')) {
            console.log('   ⚠️  STATE ISSUE: Storage mechanism insufficient');
            console.log('      → Solution: Implement real-time synchronized state');
        }

        console.log('\\n💡 RECOMMENDED SOLUTION ARCHITECTURE:');
        console.log('   1. Service Worker for background audio management');
        console.log('   2. Web Audio API with persistent audio buffer');
        console.log('   3. Real-time state synchronization via BroadcastChannel');
        console.log('   4. Audio context sharing across page instances');

        await page.waitForTimeout(3000);

    } catch (error) {
        logIssue('SYSTEM', 'CRITICAL', `Diagnosis error: ${error.message}`);
    } finally {
        await browser.close();
    }

    return issues;
}

diagnoseAudioContinuity();