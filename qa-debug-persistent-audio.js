/**
 * Debug Test: Service Worker Audio Issues
 * Investigates why audio playback is not starting
 */

const { chromium } = require('playwright');

async function debugPersistentAudio() {
    console.log('🔍 Debugging Service Worker Audio Issues\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--autoplay-policy=no-user-gesture-required']
    });

    const page = await browser.newPage();

    // Capture all console messages
    page.on('console', msg => {
        const type = msg.type();
        console.log(`[${type.toUpperCase()}] ${msg.text()}`);
    });

    // Capture page errors
    page.on('pageerror', err => {
        console.log(`[PAGE ERROR] ${err.message}`);
    });

    try {
        console.log('1️⃣ Loading page and monitoring console...');
        await page.goto('http://127.0.0.1:4003');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        console.log('\n2️⃣ Testing Service Worker communication...');

        const workerTest = await page.evaluate(async () => {
            if (!window.persistentAudioPlayer) {
                return { error: 'Persistent audio player not found' };
            }

            try {
                // Test basic Service Worker communication
                const testResult = await window.persistentAudioPlayer.sendWorkerMessage('GET_STATE');
                return {
                    communicationSuccess: true,
                    workerResponse: testResult,
                    playerState: {
                        isInitialized: window.persistentAudioPlayer.isInitialized,
                        serviceWorker: !!window.persistentAudioPlayer.serviceWorker,
                        currentTrack: window.persistentAudioPlayer.currentTrack
                    }
                };
            } catch (error) {
                return {
                    communicationSuccess: false,
                    error: error.message,
                    playerState: {
                        isInitialized: window.persistentAudioPlayer.isInitialized,
                        serviceWorker: !!window.persistentAudioPlayer.serviceWorker,
                        currentTrack: window.persistentAudioPlayer.currentTrack
                    }
                };
            }
        });

        console.log('   Worker Communication Test:');
        console.log(JSON.stringify(workerTest, null, 2));

        console.log('\n3️⃣ Testing manual track loading...');

        await page.evaluate(() => {
            if (window.persistentAudioPlayer) {
                const trackInfo = {
                    src: '/assets/audio/STUDY_WITH_MIKU-part3.mp3',
                    title: 'Debug Test Track'
                };
                window.persistentAudioPlayer.loadTrack(trackInfo, false);
            }
        });

        await page.waitForTimeout(3000);

        console.log('\n4️⃣ Attempting manual playback...');

        const playTest = await page.evaluate(async () => {
            if (!window.persistentAudioPlayer) {
                return { error: 'Player not available' };
            }

            try {
                const result = await window.persistentAudioPlayer.play();
                return {
                    playSuccess: true,
                    result: result,
                    isPlaying: window.persistentAudioPlayer.isCurrentlyPlaying(),
                    currentTime: window.persistentAudioPlayer.getCurrentTime(),
                    duration: window.persistentAudioPlayer.getDuration()
                };
            } catch (error) {
                return {
                    playSuccess: false,
                    error: error.message
                };
            }
        });

        console.log('   Manual Play Test:');
        console.log(JSON.stringify(playTest, null, 2));

        console.log('\n5️⃣ Final status check...');
        await page.waitForTimeout(2000);

        const finalStatus = await page.evaluate(() => {
            if (!window.persistentAudioPlayer) return null;

            return {
                isPlaying: window.persistentAudioPlayer.isCurrentlyPlaying(),
                currentTime: window.persistentAudioPlayer.getCurrentTime(),
                duration: window.persistentAudioPlayer.getDuration(),
                currentTrack: window.persistentAudioPlayer.getCurrentTrack(),
                serviceWorkerAvailable: !!window.persistentAudioPlayer.serviceWorker
            };
        });

        console.log('Final Status:', JSON.stringify(finalStatus, null, 2));

    } catch (error) {
        console.error('Debug test error:', error);
    } finally {
        await page.waitForTimeout(5000);
        await browser.close();
    }
}

debugPersistentAudio();