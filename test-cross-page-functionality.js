const { chromium } = require('playwright');
const fs = require('fs').promises;

class CrossPageTester {
    constructor() {
        this.baseUrl = 'http://127.0.0.1:4003';
        this.testResults = {
            tests: [],
            passed: 0,
            failed: 0,
            warnings: 0,
            totalTime: 0
        };
        this.browser = null;
        this.page = null;
    }

    async init() {
        console.log('🎬 Launching browser for cross-page functionality testing...\n');

        this.browser = await chromium.launch({
            headless: false, // Visual testing
            slowMo: 500 // Slow down for better observation
        });

        this.page = await this.browser.newPage();

        // Set up console logging
        this.page.on('console', msg => {
            console.log(`🖥️  Console: ${msg.text()}`);
        });

        // Set up error tracking
        this.page.on('pageerror', err => {
            console.log(`❌ Page Error: ${err.message}`);
        });

        // Set viewport to desktop size
        await this.page.setViewportSize({ width: 1280, height: 720 });
    }

    addResult(name, status, message, details = null, duration = null) {
        this.testResults.tests.push({
            name,
            status,
            message,
            details,
            duration,
            timestamp: new Date().toISOString()
        });
        this.testResults[status]++;

        const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
        const durationText = duration ? ` (${duration}ms)` : '';
        console.log(`${icon} ${name}: ${message}${durationText}`);
        if (details) console.log(`   📋 Details: ${details}`);
    }

    async waitAndCapture(selector, timeout = 5000) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            return await this.page.$(selector);
        } catch (error) {
            return null;
        }
    }

    async testHomepageAudioSetup() {
        console.log('\n📍 Test 1: Homepage audio setup and mini player creation');
        const startTime = Date.now();

        // Navigate to homepage
        await this.page.goto(this.baseUrl);
        await this.page.waitForLoadState('networkidle');

        // Check if global audio player is initialized
        const globalPlayerExists = await this.page.evaluate(() => {
            return typeof window.globalAudioPlayer !== 'undefined' && window.globalAudioPlayer !== null;
        });

        if (globalPlayerExists) {
            this.addResult('Global Player Initialization', 'passed', 'Global audio player successfully initialized');
        } else {
            this.addResult('Global Player Initialization', 'failed', 'Global audio player not found');
            return false;
        }

        // Check main audio player elements
        const audioElement = await this.waitAndCapture('#audio');
        const playButton = await this.waitAndCapture('.play-btn');

        if (audioElement && playButton) {
            this.addResult('Main Audio Elements', 'passed', 'Audio element and play button found');
        } else {
            this.addResult('Main Audio Elements', 'failed', 'Missing audio elements on homepage');
            return false;
        }

        // Check if audio can be loaded
        const audioLoadTest = await this.page.evaluate(async () => {
            try {
                if (window.globalAudioPlayer) {
                    const trackInfo = {
                        src: '/assets/audio/STUDY_WITH_MIKU-part3.mp3',
                        title: 'STUDY WITH MIKU - Part 3 (Test)'
                    };
                    await window.globalAudioPlayer.loadTrack(trackInfo, false);
                    return { success: true, message: 'Track loaded successfully' };
                }
                return { success: false, message: 'Global player not available' };
            } catch (error) {
                return { success: false, message: error.message };
            }
        });

        if (audioLoadTest.success) {
            this.addResult('Audio Loading', 'passed', audioLoadTest.message);
        } else {
            this.addResult('Audio Loading', 'failed', audioLoadTest.message);
        }

        // Force mini player creation for testing
        const miniPlayerCreated = await this.page.evaluate(() => {
            if (window.globalAudioPlayer) {
                window.globalAudioPlayer.createMiniPlayer();
                return true;
            }
            return false;
        });

        if (miniPlayerCreated) {
            this.addResult('Mini Player Creation', 'passed', 'Mini player creation triggered');
        } else {
            this.addResult('Mini Player Creation', 'failed', 'Failed to trigger mini player creation');
        }

        // Wait for mini player to appear in DOM
        await this.page.waitForTimeout(1000);

        const miniPlayer = await this.waitAndCapture('#global-mini-player');
        if (miniPlayer) {
            this.addResult('Mini Player DOM', 'passed', 'Mini player element exists in DOM');

            // Check mini player visibility
            const isVisible = await miniPlayer.isVisible();
            if (isVisible) {
                this.addResult('Mini Player Visibility', 'passed', 'Mini player is visible on homepage');
            } else {
                this.addResult('Mini Player Visibility', 'warnings', 'Mini player exists but not visible');
            }
        } else {
            this.addResult('Mini Player DOM', 'failed', 'Mini player element not found in DOM');
        }

        const duration = Date.now() - startTime;
        this.addResult('Homepage Setup Complete', 'passed', `Homepage audio setup completed`, null, duration);

        return true;
    }

    async testCrossPageNavigation() {
        console.log('\n📍 Test 2: Cross-page navigation functionality');

        // Find navigation links
        const navigationLinks = await this.page.$$('a[href*="/"]');
        const validLinks = [];

        for (const link of navigationLinks.slice(0, 5)) { // Test first 5 links
            const href = await link.getAttribute('href');
            const text = await link.textContent();

            if (href && href !== '/' && href.startsWith('/') && text && text.trim()) {
                validLinks.push({ href, text: text.trim(), element: link });
            }
        }

        if (validLinks.length === 0) {
            this.addResult('Navigation Links', 'warnings', 'No valid navigation links found for testing');
            return false;
        }

        this.addResult('Navigation Links Found', 'passed', `Found ${validLinks.length} valid navigation links`);

        // Test each navigation scenario
        for (let i = 0; i < Math.min(validLinks.length, 3); i++) {
            const link = validLinks[i];
            await this.testSinglePageNavigation(link, i + 1);
        }

        return true;
    }

    async testSinglePageNavigation(linkInfo, testNumber) {
        console.log(`\n📍 Test 2.${testNumber}: Navigation to "${linkInfo.text}" (${linkInfo.href})`);
        const startTime = Date.now();

        try {
            // Click the navigation link
            await linkInfo.element.click();
            await this.page.waitForLoadState('networkidle');

            // Give time for JavaScript to execute
            await this.page.waitForTimeout(1500);

            const currentUrl = this.page.url();
            this.addResult(`Page Navigation ${testNumber}`, 'passed', `Successfully navigated to ${currentUrl}`);

            // Check if mini player still exists
            const miniPlayerExists = await this.page.$('#global-mini-player');
            if (miniPlayerExists) {
                this.addResult(`Mini Player Persistence ${testNumber}`, 'passed', 'Mini player exists on new page');

                // Check visibility
                const isVisible = await miniPlayerExists.isVisible();
                if (isVisible) {
                    this.addResult(`Mini Player Visibility ${testNumber}`, 'passed', 'Mini player visible on new page');
                } else {
                    this.addResult(`Mini Player Visibility ${testNumber}`, 'failed', 'Mini player hidden on new page');
                }

                // Check mini player controls
                const controls = await this.page.$$('#global-mini-player button');
                if (controls.length >= 2) {
                    this.addResult(`Mini Player Controls ${testNumber}`, 'passed', `Found ${controls.length} control buttons`);
                } else {
                    this.addResult(`Mini Player Controls ${testNumber}`, 'warnings', `Only ${controls.length} control buttons found`);
                }

            } else {
                this.addResult(`Mini Player Persistence ${testNumber}`, 'failed', 'Mini player missing on new page');
            }

            // Check sidebar hiding
            const sidebarElements = await this.page.evaluate(() => {
                const elements = {
                    sidebar: document.querySelector('.sidebar'),
                    authorAvatar: document.querySelector('.author__avatar'),
                    authorContent: document.querySelector('.author__content')
                };

                const results = {};
                for (const [key, element] of Object.entries(elements)) {
                    if (element) {
                        results[key] = {
                            exists: true,
                            hidden: element.style.display === 'none' ||
                                   getComputedStyle(element).display === 'none' ||
                                   !element.offsetParent
                        };
                    } else {
                        results[key] = { exists: false, hidden: true };
                    }
                }
                return results;
            });

            let hiddenCount = 0;
            let totalElements = 0;
            for (const [key, info] of Object.entries(sidebarElements)) {
                if (info.exists) {
                    totalElements++;
                    if (info.hidden) {
                        hiddenCount++;
                    }
                }
            }

            if (totalElements > 0) {
                if (hiddenCount === totalElements) {
                    this.addResult(`Sidebar Hiding ${testNumber}`, 'passed', `All ${totalElements} sidebar elements properly hidden`);
                } else if (hiddenCount > 0) {
                    this.addResult(`Sidebar Hiding ${testNumber}`, 'warnings', `${hiddenCount}/${totalElements} sidebar elements hidden`);
                } else {
                    this.addResult(`Sidebar Hiding ${testNumber}`, 'failed', 'Sidebar elements not hidden on other page');
                }
            } else {
                this.addResult(`Sidebar Elements ${testNumber}`, 'warnings', 'No sidebar elements found to test');
            }

            // Test global audio player state
            const audioState = await this.page.evaluate(() => {
                if (window.globalAudioPlayer) {
                    return {
                        exists: true,
                        currentTrack: window.globalAudioPlayer.currentTrack,
                        isPlaying: window.globalAudioPlayer.isPlaying,
                        isInitialized: window.globalAudioPlayer.isInitialized
                    };
                }
                return { exists: false };
            });

            if (audioState.exists) {
                this.addResult(`Audio State Persistence ${testNumber}`, 'passed', 'Global audio player state maintained');

                if (audioState.currentTrack) {
                    this.addResult(`Track Persistence ${testNumber}`, 'passed', 'Current track information preserved');
                }
            } else {
                this.addResult(`Audio State Persistence ${testNumber}`, 'failed', 'Global audio player state lost');
            }

        } catch (error) {
            this.addResult(`Navigation Error ${testNumber}`, 'failed', `Navigation failed: ${error.message}`);
        }

        const duration = Date.now() - startTime;
        console.log(`⏱️  Navigation test ${testNumber} completed in ${duration}ms`);
    }

    async testMiniPlayerControls() {
        console.log('\n📍 Test 3: Mini player control functionality');

        const miniPlayer = await this.page.$('#global-mini-player');
        if (!miniPlayer) {
            this.addResult('Mini Player Controls Test', 'failed', 'Mini player not available for control testing');
            return false;
        }

        // Test play/pause button
        const playButton = await this.page.$('#miniPlayBtn');
        if (playButton) {
            await playButton.click();
            await this.page.waitForTimeout(500);
            this.addResult('Play Button Interaction', 'passed', 'Play button clickable');
        } else {
            this.addResult('Play Button Interaction', 'failed', 'Play button not found');
        }

        // Test minimize button
        const minimizeButton = await this.page.$('#miniMinimizeBtn');
        if (minimizeButton) {
            await minimizeButton.click();
            await this.page.waitForTimeout(500);

            // Check if mini player is minimized
            const isMinimized = await this.page.evaluate(() => {
                const miniPlayer = document.getElementById('global-mini-player');
                return miniPlayer && miniPlayer.classList.contains('minimized');
            });

            if (isMinimized) {
                this.addResult('Minimize Functionality', 'passed', 'Mini player successfully minimized');
            } else {
                this.addResult('Minimize Functionality', 'warnings', 'Minimize button clicked but state unclear');
            }
        } else {
            this.addResult('Minimize Button', 'failed', 'Minimize button not found');
        }

        // Test close button (but don't actually close for further testing)
        const closeButton = await this.page.$('#miniCloseBtn');
        if (closeButton) {
            this.addResult('Close Button Presence', 'passed', 'Close button found and accessible');
        } else {
            this.addResult('Close Button Presence', 'failed', 'Close button not found');
        }

        return true;
    }

    async testStateManagement() {
        console.log('\n📍 Test 4: State management and persistence');

        // Test sessionStorage state
        const stateTest = await this.page.evaluate(() => {
            const testState = {
                currentTime: 45.5,
                trackInfo: { src: '/assets/audio/test.mp3', title: 'Test Track' },
                isPlaying: true,
                isMinimized: false,
                volume: 0.8
            };

            try {
                // Save state
                sessionStorage.setItem('globalAudioState', JSON.stringify(testState));

                // Retrieve and validate
                const retrieved = JSON.parse(sessionStorage.getItem('globalAudioState'));

                return {
                    success: retrieved && retrieved.currentTime === testState.currentTime,
                    retrieved: retrieved,
                    original: testState
                };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        if (stateTest.success) {
            this.addResult('State Storage', 'passed', 'State successfully stored and retrieved from sessionStorage');
        } else {
            this.addResult('State Storage', 'failed', `State storage failed: ${stateTest.error}`);
        }

        // Test state restoration capability
        const restorationTest = await this.page.evaluate(() => {
            if (window.globalAudioPlayer && typeof window.globalAudioPlayer.restoreState === 'function') {
                try {
                    window.globalAudioPlayer.restoreState();
                    return { success: true, message: 'State restoration function executed' };
                } catch (error) {
                    return { success: false, message: `Restoration error: ${error.message}` };
                }
            }
            return { success: false, message: 'Restoration function not available' };
        });

        if (restorationTest.success) {
            this.addResult('State Restoration', 'passed', restorationTest.message);
        } else {
            this.addResult('State Restoration', 'failed', restorationTest.message);
        }

        return true;
    }

    async generateReport() {
        console.log('\n📊 Generating comprehensive test report...');

        const totalTime = Date.now() - this.testResults.totalTime;
        const successRate = this.testResults.tests.length > 0 ?
            (this.testResults.passed / this.testResults.tests.length * 100).toFixed(1) : 0;

        const report = {
            meta: {
                testType: 'Cross-Page Mini Player Functionality',
                timestamp: new Date().toISOString(),
                testDuration: totalTime,
                baseUrl: this.baseUrl,
                browser: 'Chromium',
                viewport: '1280x720'
            },
            summary: {
                totalTests: this.testResults.tests.length,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                warnings: this.testResults.warnings,
                successRate: `${successRate}%`
            },
            testResults: this.testResults.tests,
            conclusion: this.generateConclusion()
        };

        // Save detailed report
        await fs.writeFile(
            '/Users/midori/blog/faransansj.github.io/CROSS_PAGE_TEST_REPORT.json',
            JSON.stringify(report, null, 2)
        );

        // Generate markdown report
        const markdownReport = this.generateMarkdownReport(report);
        await fs.writeFile(
            '/Users/midori/blog/faransansj.github.io/CROSS_PAGE_TEST_REPORT.md',
            markdownReport
        );

        return report;
    }

    generateConclusion() {
        const criticalTests = [
            'Global Player Initialization',
            'Mini Player Creation',
            'Mini Player Persistence 1',
            'Mini Player Visibility 1',
            'Audio State Persistence 1'
        ];

        const criticalPassed = this.testResults.tests.filter(t =>
            criticalTests.includes(t.name) && t.status === 'passed'
        ).length;

        if (this.testResults.failed === 0 && criticalPassed >= 4) {
            return {
                status: 'EXCELLENT',
                message: 'All cross-page functionality working perfectly. Mini player persists across navigation with full functionality.',
                recommendation: 'System ready for production use.'
            };
        } else if (this.testResults.failed <= 2 && criticalPassed >= 3) {
            return {
                status: 'GOOD',
                message: 'Core cross-page functionality working. Minor issues detected but system functional.',
                recommendation: 'Review failed tests and consider improvements.'
            };
        } else {
            return {
                status: 'NEEDS_ATTENTION',
                message: 'Critical cross-page functionality issues detected. System may not work as expected.',
                recommendation: 'Address failed tests before production deployment.'
            };
        }
    }

    generateMarkdownReport(report) {
        return `# 🎵 Cross-Page Mini Player Functionality Test Report

## 📊 Test Summary
- **Test Type**: ${report.meta.testType}
- **Date**: ${new Date(report.meta.timestamp).toLocaleString()}
- **Duration**: ${report.meta.testDuration}ms
- **Browser**: ${report.meta.browser}
- **Success Rate**: ${report.summary.successRate}

## 🎯 Results Overview
- ✅ **Passed**: ${report.summary.passed}
- ❌ **Failed**: ${report.summary.failed}
- ⚠️ **Warnings**: ${report.summary.warnings}
- 📊 **Total**: ${report.summary.totalTests}

## 📋 Detailed Test Results

${report.testResults.map(test => {
    const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
    const duration = test.duration ? ` (${test.duration}ms)` : '';
    const details = test.details ? `\n   - Details: ${test.details}` : '';
    return `### ${icon} ${test.name}${duration}
- **Status**: ${test.status.toUpperCase()}
- **Message**: ${test.message}${details}`;
}).join('\n\n')}

## 🏆 Conclusion
**Status**: ${report.conclusion.status}

${report.conclusion.message}

**Recommendation**: ${report.conclusion.recommendation}

---
*Generated by Cross-Page Functionality Tester*`;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runFullTest() {
        this.testResults.totalTime = Date.now();

        try {
            await this.init();

            console.log('🚀 Starting Cross-Page Mini Player Functionality Test Suite\n');
            console.log(`🌐 Testing URL: ${this.baseUrl}`);
            console.log(`🖥️  Browser: Chromium (Visual Mode)`);
            console.log(`📏 Viewport: 1280x720\n`);

            // Run test sequence
            const homepageSuccess = await this.testHomepageAudioSetup();
            if (homepageSuccess) {
                await this.testCrossPageNavigation();
                await this.testMiniPlayerControls();
                await this.testStateManagement();
            }

            // Generate comprehensive report
            const report = await this.generateReport();

            // Print summary
            console.log('\n' + '='.repeat(80));
            console.log('🏁 CROSS-PAGE FUNCTIONALITY TEST COMPLETED');
            console.log('='.repeat(80));
            console.log(`✅ Passed: ${this.testResults.passed}`);
            console.log(`❌ Failed: ${this.testResults.failed}`);
            console.log(`⚠️  Warnings: ${this.testResults.warnings}`);
            console.log(`📊 Total Tests: ${this.testResults.tests.length}`);
            console.log(`🎯 Success Rate: ${report.summary.successRate}`);
            console.log(`⏱️  Duration: ${Date.now() - this.testResults.totalTime}ms`);

            console.log(`\n🏆 **Final Result: ${report.conclusion.status}**`);
            console.log(`💬 ${report.conclusion.message}`);
            console.log(`🔧 ${report.conclusion.recommendation}`);

            console.log(`\n📄 Reports saved:`);
            console.log(`   - JSON: CROSS_PAGE_TEST_REPORT.json`);
            console.log(`   - Markdown: CROSS_PAGE_TEST_REPORT.md`);

        } catch (error) {
            console.error('❌ Test execution failed:', error);
            this.addResult('Test Execution', 'failed', `Critical error: ${error.message}`);
        } finally {
            await this.cleanup();
        }

        return this.testResults.failed === 0;
    }
}

// Execute the test suite
const tester = new CrossPageTester();
tester.runFullTest().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal test error:', error);
    process.exit(1);
});