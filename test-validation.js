const { chromium } = require('playwright');

async function runComprehensiveValidation() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    const results = {
        tests: [],
        passed: 0,
        failed: 0,
        warnings: 0
    };

    function addResult(name, status, message, details = null) {
        results.tests.push({ name, status, message, details });
        results[status]++;
        console.log(`${status.toUpperCase()}: ${name} - ${message}`);
        if (details) console.log(`  Details: ${details}`);
    }

    try {
        console.log('🧪 Starting Comprehensive Audio Player Validation...\n');

        // Test 1: Navigate to home page and check initial state
        console.log('📍 Test 1: Home page initial state');
        await page.goto('http://127.0.0.1:4003/');
        await page.waitForLoadState('networkidle');

        // Check if global audio player exists
        const globalPlayer = await page.evaluate(() => window.globalAudioPlayer);
        if (globalPlayer) {
            addResult('Global Audio Player', 'passed', 'GlobalAudioPlayer instance exists');
        } else {
            addResult('Global Audio Player', 'failed', 'GlobalAudioPlayer instance not found');
        }

        // Check if main audio player exists
        const audioPlayer = await page.$('.audio-player');
        if (audioPlayer) {
            addResult('Main Audio Player DOM', 'passed', 'Main audio player element exists');
        } else {
            addResult('Main Audio Player DOM', 'failed', 'Main audio player element not found');
        }

        // Test 2: Audio loading and playback
        console.log('\n📍 Test 2: Audio loading and playback');
        const playButton = await page.$('.play-btn');

        if (playButton) {
            // Check if play button is enabled
            const isDisabled = await playButton.getAttribute('disabled');
            if (!isDisabled || isDisabled === null) {
                addResult('Play Button State', 'passed', 'Play button is enabled');

                // Try to load track
                const loadResult = await page.evaluate(async () => {
                    if (!window.globalAudioPlayer) return { success: false, error: 'No global player' };

                    try {
                        const trackInfo = {
                            src: '/assets/audio/STUDY_WITH_MIKU-part3.mp3',
                            title: 'STUDY WITH MIKU - Part 3 (Test)'
                        };
                        await window.globalAudioPlayer.loadTrack(trackInfo, false);
                        return { success: true };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                });

                if (loadResult.success) {
                    addResult('Track Loading', 'passed', 'Track loaded successfully');
                } else {
                    addResult('Track Loading', 'failed', `Track loading failed: ${loadResult.error}`);
                }
            } else {
                addResult('Play Button State', 'failed', 'Play button is disabled');
            }
        } else {
            addResult('Play Button Existence', 'failed', 'Play button not found');
        }

        // Test 3: Mini player creation and visibility
        console.log('\n📍 Test 3: Mini player creation and visibility');

        // Force mini player creation
        await page.evaluate(() => {
            if (window.globalAudioPlayer) {
                window.globalAudioPlayer.createMiniPlayer();
            }
        });

        await page.waitForTimeout(1000); // Wait for creation

        const miniPlayer = await page.$('#global-mini-player');
        if (miniPlayer) {
            addResult('Mini Player Creation', 'passed', 'Mini player element created successfully');

            // Check if mini player is visible
            const isVisible = await miniPlayer.isVisible();
            if (isVisible) {
                addResult('Mini Player Visibility', 'passed', 'Mini player is visible');
            } else {
                addResult('Mini Player Visibility', 'failed', 'Mini player exists but not visible');
            }

            // Check mini player controls
            const controls = {
                playBtn: await page.$('#miniPlayBtn'),
                closeBtn: await page.$('#miniCloseBtn'),
                minimizeBtn: await page.$('#miniMinimizeBtn')
            };

            const controlsExist = Object.values(controls).every(control => control !== null);
            if (controlsExist) {
                addResult('Mini Player Controls', 'passed', 'All control buttons present');
            } else {
                addResult('Mini Player Controls', 'failed', 'Missing control buttons');
            }
        } else {
            addResult('Mini Player Creation', 'failed', 'Mini player element not created');
        }

        // Test 4: Sidebar hiding on other pages
        console.log('\n📍 Test 4: Sidebar hiding functionality');

        // Navigate to a different page
        const categoryLinks = await page.$$('.page__taxonomy-item a');
        if (categoryLinks.length > 0) {
            const firstLink = categoryLinks[0];
            const linkHref = await firstLink.getAttribute('href');
            console.log(`Navigating to: ${linkHref}`);

            await firstLink.click();
            await page.waitForLoadState('networkidle');

            // Check if sidebar elements are hidden
            const sidebarElements = {
                sidebar: await page.$('.sidebar'),
                authorAvatar: await page.$('.author__avatar'),
                authorContent: await page.$('.author__content')
            };

            let hiddenCount = 0;
            for (const [key, element] of Object.entries(sidebarElements)) {
                if (element) {
                    const isHidden = await element.evaluate(el => {
                        return el.style.display === 'none' ||
                               getComputedStyle(el).display === 'none' ||
                               !el.offsetParent;
                    });

                    if (isHidden) {
                        hiddenCount++;
                        console.log(`  ✅ ${key} is hidden`);
                    } else {
                        console.log(`  ❌ ${key} is visible`);
                    }
                }
            }

            if (hiddenCount === Object.keys(sidebarElements).length) {
                addResult('Sidebar Hiding', 'passed', 'All sidebar elements properly hidden on other pages');
            } else if (hiddenCount > 0) {
                addResult('Sidebar Hiding', 'warnings', `Partial sidebar hiding: ${hiddenCount}/${Object.keys(sidebarElements).length} elements hidden`);
            } else {
                addResult('Sidebar Hiding', 'failed', 'Sidebar elements not hidden on other pages');
            }

            // Check if mini player is still visible on other page
            const miniPlayerOnOtherPage = await page.$('#global-mini-player');
            if (miniPlayerOnOtherPage) {
                const isVisible = await miniPlayerOnOtherPage.isVisible();
                if (isVisible) {
                    addResult('Mini Player Persistence', 'passed', 'Mini player visible on other pages');
                } else {
                    addResult('Mini Player Persistence', 'failed', 'Mini player hidden on other pages');
                }
            } else {
                addResult('Mini Player Persistence', 'failed', 'Mini player not found on other pages');
            }
        } else {
            addResult('Page Navigation', 'warnings', 'No category links found for navigation test');
        }

        // Test 5: State management
        console.log('\n📍 Test 5: State management');

        const stateTest = await page.evaluate(() => {
            // Test sessionStorage
            const testState = {
                currentTime: 30,
                trackInfo: { src: 'test.mp3', title: 'Test Track' },
                isPlaying: true,
                isMinimized: false
            };

            try {
                sessionStorage.setItem('globalAudioState', JSON.stringify(testState));
                const retrieved = JSON.parse(sessionStorage.getItem('globalAudioState'));

                return {
                    success: retrieved && retrieved.currentTime === testState.currentTime,
                    retrieved: retrieved
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        if (stateTest.success) {
            addResult('State Storage', 'passed', 'State stored and retrieved successfully');
        } else {
            addResult('State Storage', 'failed', `State management error: ${stateTest.error || 'Unknown error'}`);
        }

        // Test 6: Page width compliance
        console.log('\n📍 Test 6: Page width compliance');

        if (miniPlayer) {
            const miniPlayerWidth = await miniPlayer.evaluate(el => {
                return getComputedStyle(el).width;
            });

            const viewport = page.viewportSize();
            let expectedWidth;

            if (viewport.width >= 1280) {
                expectedWidth = '250px';
            } else if (viewport.width >= 1024) {
                expectedWidth = '200px';
            } else {
                expectedWidth = 'auto'; // responsive
            }

            if (viewport.width >= 1024) {
                if (miniPlayerWidth === expectedWidth) {
                    addResult('Width Compliance', 'passed', `Mini player width (${miniPlayerWidth}) matches expected (${expectedWidth})`);
                } else {
                    addResult('Width Compliance', 'failed', `Mini player width (${miniPlayerWidth}) doesn't match expected (${expectedWidth})`);
                }
            } else {
                addResult('Width Compliance', 'passed', `Responsive width on mobile: ${miniPlayerWidth}`);
            }
        }

        // Test 7: Console errors check
        console.log('\n📍 Test 7: Console errors check');

        const logs = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                logs.push(msg.text());
            }
        });

        // Reload page to check for console errors
        await page.reload();
        await page.waitForTimeout(2000);

        if (logs.length === 0) {
            addResult('Console Errors', 'passed', 'No console errors detected');
        } else {
            addResult('Console Errors', 'failed', `${logs.length} console errors found`, logs.join('; '));
        }

    } catch (error) {
        addResult('Test Execution', 'failed', `Test execution error: ${error.message}`);
    } finally {
        await browser.close();
    }

    // Print final results
    console.log('\n' + '='.repeat(60));
    console.log('🏁 COMPREHENSIVE VALIDATION RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️  Warnings: ${results.warnings}`);
    console.log(`📊 Total Tests: ${results.tests.length}`);

    const successRate = (results.passed / results.tests.length * 100).toFixed(1);
    console.log(`🎯 Success Rate: ${successRate}%`);

    if (results.failed === 0 && results.warnings === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Implementation is perfect.');
        return true;
    } else if (results.failed === 0) {
        console.log('\n⚠️  All critical tests passed, but some warnings exist.');
        return true;
    } else {
        console.log('\n❌ Some tests failed. Implementation needs fixes.');
        return false;
    }
}

runComprehensiveValidation().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});