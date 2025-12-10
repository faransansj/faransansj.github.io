/**
 * Comprehensive Test: Service Worker-Based Audio Continuity
 * Tests the new persistent audio player architecture
 */

const { chromium } = require('playwright');

async function testPersistentAudioContinuity() {
    console.log('🎵 Testing Service Worker-Based Audio Continuity\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 1500,
        args: ['--autoplay-policy=no-user-gesture-required']
    });

    const page = await browser.newPage();

    try {
        console.log('1️⃣ Loading homepage with new persistent player...');
        await page.goto('http://127.0.0.1:4003');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // Check if new persistent player loads
        const persistentPlayerExists = await page.evaluate(() => {
            return {
                persistentPlayerLoaded: !!window.persistentAudioPlayer,
                serviceWorkerSupport: 'serviceWorker' in navigator,
                serviceWorkerRegistered: false,
                persistentPlayerElement: !!document.querySelector('#persistent-mini-player'),
                audioWorkerScript: Array.from(document.scripts).some(s =>
                    s.src.includes('persistent-audio-player.js'))
            };
        });

        console.log('   📊 Initial State Check:');
        Object.entries(persistentPlayerExists).forEach(([key, value]) => {
            console.log(`      ${key}: ${value}`);
        });

        if (!persistentPlayerExists.persistentPlayerLoaded) {
            console.log('❌ Persistent audio player not loaded. Checking for errors...');

            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            await page.waitForTimeout(2000);
            if (consoleErrors.length > 0) {
                console.log('Console errors found:');
                consoleErrors.forEach(error => console.log('   -', error));
            }
            return;
        }

        console.log('\n2️⃣ Testing Service Worker registration...');

        // Wait for Service Worker to register
        await page.waitForTimeout(3000);

        const serviceWorkerStatus = await page.evaluate(async () => {
            let registration = null;
            let worker = null;

            if ('serviceWorker' in navigator) {
                try {
                    registration = await navigator.serviceWorker.getRegistration();
                    if (registration) {
                        worker = registration.active || registration.waiting || registration.installing;
                    }
                } catch (error) {
                    console.error('Service Worker check error:', error);
                }
            }

            return {
                serviceWorkerRegistered: !!registration,
                serviceWorkerActive: !!worker,
                serviceWorkerScope: registration ? registration.scope : null,
                persistentPlayerInitialized: window.persistentAudioPlayer ?
                    window.persistentAudioPlayer.isInitialized : false
            };
        });

        console.log('   🔧 Service Worker Status:');
        Object.entries(serviceWorkerStatus).forEach(([key, value]) => {
            console.log(`      ${key}: ${value}`);
        });

        if (!serviceWorkerStatus.serviceWorkerRegistered) {
            console.log('⚠️ Service Worker not registered. Testing without SW...');
        }

        console.log('\n3️⃣ Testing audio loading and playback...');

        // Check if mini player exists and try to start playback
        const miniPlayer = await page.$('#persistent-mini-player');
        if (!miniPlayer) {
            console.log('❌ Persistent mini player element not found');
            return;
        }

        // Try to click play button
        const playButton = await page.$('#persistentPlayBtn');
        if (playButton) {
            console.log('   ▶️ Clicking play button...');
            await playButton.click();
            await page.waitForTimeout(3000);

            const playbackState = await page.evaluate(() => {
                if (!window.persistentAudioPlayer) return null;

                return {
                    isPlaying: window.persistentAudioPlayer.isCurrentlyPlaying(),
                    currentTime: window.persistentAudioPlayer.getCurrentTime(),
                    duration: window.persistentAudioPlayer.getDuration(),
                    currentTrack: window.persistentAudioPlayer.getCurrentTrack(),
                    miniPlayerVisible: !document.querySelector('#persistent-mini-player').classList.contains('hidden')
                };
            });

            console.log('   🎵 Playback State:');
            Object.entries(playbackState || {}).forEach(([key, value]) => {
                console.log(`      ${key}: ${value}`);
            });

            if (playbackState && playbackState.isPlaying) {
                console.log('✅ Audio playback started successfully');

                // Wait for audio to play for a few seconds
                await page.waitForTimeout(5000);

                console.log('\n4️⃣ Testing cross-page navigation...');
                const preNavTime = await page.evaluate(() => {
                    return window.persistentAudioPlayer ?
                        window.persistentAudioPlayer.getCurrentTime() : 0;
                });

                console.log(`   📍 Pre-navigation time: ${preNavTime.toFixed(2)}s`);

                // Navigate to another page
                console.log('   🔄 Navigating to category page...');
                await page.goto('http://127.0.0.1:4003/categories/raspberrypi_car');
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(5000); // Wait for restoration

                console.log('\n5️⃣ Checking post-navigation state...');
                const postNavState = await page.evaluate(() => {
                    return {
                        persistentPlayerExists: !!window.persistentAudioPlayer,
                        isPlaying: window.persistentAudioPlayer ?
                            window.persistentAudioPlayer.isCurrentlyPlaying() : false,
                        currentTime: window.persistentAudioPlayer ?
                            window.persistentAudioPlayer.getCurrentTime() : 0,
                        miniPlayerExists: !!document.querySelector('#persistent-mini-player'),
                        miniPlayerVisible: document.querySelector('#persistent-mini-player') ?
                            !document.querySelector('#persistent-mini-player').classList.contains('hidden') : false,
                        currentTrack: window.persistentAudioPlayer ?
                            window.persistentAudioPlayer.getCurrentTrack() : null
                    };
                });

                console.log('   📊 Post-Navigation State:');
                Object.entries(postNavState).forEach(([key, value]) => {
                    console.log(`      ${key}: ${value}`);
                });

                const timeDiff = postNavState.currentTime - preNavTime;
                console.log(`   ⏱️ Time progression: ${timeDiff.toFixed(2)}s`);

                // Test Results Analysis
                console.log('\n' + '='.repeat(60));
                console.log('🏆 PERSISTENT AUDIO CONTINUITY TEST RESULTS');
                console.log('='.repeat(60));

                let testsPassed = 0;
                let totalTests = 0;

                const checkTest = (condition, testName) => {
                    totalTests++;
                    if (condition) {
                        console.log(`✅ ${testName}`);
                        testsPassed++;
                    } else {
                        console.log(`❌ ${testName}`);
                    }
                };

                checkTest(persistentPlayerExists.persistentPlayerLoaded, 'Persistent player loads');
                checkTest(serviceWorkerStatus.serviceWorkerRegistered, 'Service Worker registers');
                checkTest(playbackState && playbackState.isPlaying, 'Audio playback starts');
                checkTest(postNavState.persistentPlayerExists, 'Player survives navigation');
                checkTest(postNavState.miniPlayerExists, 'Mini player UI survives navigation');
                checkTest(postNavState.currentTrack !== null, 'Track info preserved');
                checkTest(timeDiff >= 4, 'Audio time progressed (continuity)');
                checkTest(postNavState.isPlaying, 'Playback continues after navigation');

                const successRate = (testsPassed / totalTests * 100).toFixed(1);
                console.log(`\n📊 Overall Success Rate: ${testsPassed}/${totalTests} (${successRate}%)`);

                if (testsPassed === totalTests) {
                    console.log('🎉 ALL TESTS PASSED! Audio continuity is working!');
                } else if (testsPassed >= totalTests * 0.75) {
                    console.log('⚠️ Mostly working with some issues to address');
                } else {
                    console.log('❌ Significant issues detected, needs investigation');
                }

            } else {
                console.log('❌ Audio playback failed to start');
            }
        } else {
            console.log('❌ Play button not found');
        }

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
}

testPersistentAudioContinuity();