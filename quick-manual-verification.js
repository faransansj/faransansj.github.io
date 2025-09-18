const { chromium } = require('playwright');

async function quickManualVerification() {
    console.log('🔍 Quick Manual Verification - Cross Page Mini Player Functionality\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    const testResults = {
        homepage: null,
        miniPlayer: null,
        crossPage: null,
        controls: null
    };

    try {
        console.log('1️⃣ Testing Homepage...');
        await page.goto('http://127.0.0.1:4003/');
        await page.waitForTimeout(2000);

        // Check basic elements
        const audioElement = await page.$('#audio');
        const playButton = await page.$('.play-btn, #playBtn');
        const globalPlayer = await page.evaluate(() => window.globalAudioPlayer);

        testResults.homepage = {
            audioElement: audioElement !== null,
            playButton: playButton !== null,
            globalPlayer: globalPlayer !== null
        };

        console.log(`   📻 Audio Element: ${audioElement ? '✅ Found' : '❌ Missing'}`);
        console.log(`   🎯 Play Button: ${playButton ? '✅ Found' : '❌ Missing'}`);
        console.log(`   🌐 Global Player: ${globalPlayer ? '✅ Initialized' : '❌ Missing'}`);

        console.log('\n2️⃣ Testing Mini Player Creation...');

        // Force mini player creation
        await page.evaluate(() => {
            if (window.globalAudioPlayer) {
                window.globalAudioPlayer.createMiniPlayer();
            }
        });

        await page.waitForTimeout(1000);
        const miniPlayer = await page.$('#global-mini-player');
        const isVisible = miniPlayer ? await miniPlayer.isVisible() : false;

        testResults.miniPlayer = {
            created: miniPlayer !== null,
            visible: isVisible
        };

        console.log(`   🎵 Mini Player Created: ${miniPlayer ? '✅ Yes' : '❌ No'}`);
        console.log(`   👁️ Mini Player Visible: ${isVisible ? '✅ Yes' : '❌ No'}`);

        console.log('\n3️⃣ Testing Cross-Page Navigation...');

        // Find a navigation link
        const navLinks = await page.$$('a[href*="/"]');
        let testLink = null;

        for (const link of navLinks) {
            const href = await link.getAttribute('href');
            if (href && href !== '/' && href.startsWith('/')) {
                testLink = link;
                break;
            }
        }

        if (testLink) {
            const linkHref = await testLink.getAttribute('href');
            console.log(`   🔗 Testing navigation to: ${linkHref}`);

            await testLink.click();
            await page.waitForTimeout(2000);

            // Check mini player persistence
            const miniPlayerAfterNav = await page.$('#global-mini-player');
            const isVisibleAfterNav = miniPlayerAfterNav ? await miniPlayerAfterNav.isVisible() : false;

            // Check sidebar hiding
            const sidebarHidden = await page.evaluate(() => {
                const sidebar = document.querySelector('.sidebar');
                const avatar = document.querySelector('.author__avatar');
                return {
                    sidebar: sidebar ? (sidebar.style.display === 'none' || !sidebar.offsetParent) : null,
                    avatar: avatar ? (avatar.style.display === 'none' || !avatar.offsetParent) : null
                };
            });

            testResults.crossPage = {
                miniPlayerPersists: miniPlayerAfterNav !== null,
                miniPlayerVisible: isVisibleAfterNav,
                sidebarHidden: sidebarHidden
            };

            console.log(`   🎵 Mini Player Persists: ${miniPlayerAfterNav ? '✅ Yes' : '❌ No'}`);
            console.log(`   👁️ Mini Player Visible: ${isVisibleAfterNav ? '✅ Yes' : '❌ No'}`);
            console.log(`   🙈 Sidebar Hidden: ${sidebarHidden.sidebar ? '✅ Yes' : '❌ No'}`);
        } else {
            console.log('   ⚠️ No navigation links found for testing');
            testResults.crossPage = { error: 'No navigation links found' };
        }

        console.log('\n4️⃣ Testing Mini Player Controls...');

        if (miniPlayer) {
            const playBtn = await page.$('#miniPlayBtn');
            const closeBtn = await page.$('#miniCloseBtn');
            const minimizeBtn = await page.$('#miniMinimizeBtn');

            testResults.controls = {
                playButton: playBtn !== null,
                closeButton: closeBtn !== null,
                minimizeButton: minimizeBtn !== null
            };

            console.log(`   ▶️ Play Button: ${playBtn ? '✅ Found' : '❌ Missing'}`);
            console.log(`   ❌ Close Button: ${closeBtn ? '✅ Found' : '❌ Missing'}`);
            console.log(`   ➖ Minimize Button: ${minimizeBtn ? '✅ Found' : '❌ Missing'}`);

            // Test minimize functionality
            if (minimizeBtn) {
                await minimizeBtn.click();
                await page.waitForTimeout(500);
                const isMinimized = await page.evaluate(() => {
                    const mp = document.getElementById('global-mini-player');
                    return mp && mp.classList.contains('minimized');
                });
                console.log(`   🔽 Minimize Works: ${isMinimized ? '✅ Yes' : '❌ No'}`);
            }
        } else {
            testResults.controls = { error: 'Mini player not available for testing' };
            console.log('   ⚠️ Mini player not available for control testing');
        }

    } catch (error) {
        console.error(`❌ Test error: ${error.message}`);
    }

    await browser.close();

    // Generate summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 QUICK VERIFICATION SUMMARY');
    console.log('='.repeat(60));

    const allTests = [
        testResults.homepage?.audioElement,
        testResults.homepage?.playButton,
        testResults.homepage?.globalPlayer,
        testResults.miniPlayer?.created,
        testResults.miniPlayer?.visible,
        testResults.crossPage?.miniPlayerPersists,
        testResults.crossPage?.miniPlayerVisible,
        testResults.controls?.playButton,
        testResults.controls?.closeButton,
        testResults.controls?.minimizeButton
    ];

    const passedTests = allTests.filter(test => test === true).length;
    const totalTests = allTests.filter(test => test !== null && test !== undefined).length;
    const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;

    console.log(`✅ Passed: ${passedTests}/${totalTests} (${successRate}%)`);

    if (successRate >= 80) {
        console.log('\n🎉 EXCELLENT: Cross-page functionality working well!');
        return 'EXCELLENT';
    } else if (successRate >= 60) {
        console.log('\n⚠️ GOOD: Most functionality working, minor issues detected.');
        return 'GOOD';
    } else {
        console.log('\n❌ NEEDS ATTENTION: Significant functionality issues detected.');
        return 'NEEDS_ATTENTION';
    }
}

quickManualVerification().catch(console.error);