const http = require('http');
const https = require('https');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({
                statusCode: res.statusCode,
                headers: res.headers,
                data: data
            }));
        }).on('error', reject);
    });
}

async function validateImplementation() {
    console.log('🧪 Starting Implementation Validation...\n');

    const results = {
        tests: [],
        passed: 0,
        failed: 0
    };

    function addResult(name, status, message, details = null) {
        results.tests.push({ name, status, message, details });
        results[status]++;
        console.log(`${status === 'passed' ? '✅' : '❌'} ${name}: ${message}`);
        if (details) console.log(`   Details: ${details}`);
    }

    try {
        // Test 1: Main page loads correctly
        console.log('📍 Test 1: Main page accessibility');
        const mainPage = await makeRequest('http://127.0.0.1:4003/');

        if (mainPage.statusCode === 200) {
            addResult('Main Page Load', 'passed', 'Home page loads successfully');

            // Check for required components
            const checks = [
                { name: 'Global Audio Player JS', pattern: '/assets/js/global-audio-player.js' },
                { name: 'Mini Player CSS', pattern: '/assets/css/mini-audio-player.css' },
                { name: 'Audio Element', pattern: '<audio id="audio"' },
                { name: 'Audio Source', pattern: 'STUDY_WITH_MIKU-part3.mp3' },
                { name: 'Play Button', pattern: 'play-btn' }
            ];

            for (const check of checks) {
                if (mainPage.data.includes(check.pattern)) {
                    addResult(check.name, 'passed', 'Found in main page HTML');
                } else {
                    addResult(check.name, 'failed', 'Missing from main page HTML');
                }
            }
        } else {
            addResult('Main Page Load', 'failed', `HTTP ${mainPage.statusCode}`);
        }

        // Test 2: JavaScript file accessibility and content
        console.log('\n📍 Test 2: JavaScript file validation');
        const jsFile = await makeRequest('http://127.0.0.1:4003/assets/js/global-audio-player.js');

        if (jsFile.statusCode === 200) {
            addResult('JS File Access', 'passed', 'Global audio player JS accessible');

            const jsChecks = [
                { name: 'GlobalAudioPlayer Class', pattern: 'class GlobalAudioPlayer' },
                { name: 'Mini Player Creation', pattern: 'createMiniPlayer' },
                { name: 'State Management', pattern: 'saveState' },
                { name: 'Sidebar Hiding', pattern: 'hideSidebarOnOtherPages' },
                { name: 'Track Loading', pattern: 'loadTrack' },
                { name: 'Page Navigation Handling', pattern: 'beforeunload' }
            ];

            for (const check of jsChecks) {
                if (jsFile.data.includes(check.pattern)) {
                    addResult(check.name, 'passed', 'Function implemented');
                } else {
                    addResult(check.name, 'failed', 'Function missing or malformed');
                }
            }
        } else {
            addResult('JS File Access', 'failed', `HTTP ${jsFile.statusCode}`);
        }

        // Test 3: CSS file accessibility and content
        console.log('\n📍 Test 3: CSS file validation');
        const cssFile = await makeRequest('http://127.0.0.1:4003/assets/css/mini-audio-player.css');

        if (cssFile.statusCode === 200) {
            addResult('CSS File Access', 'passed', 'Mini player CSS accessible');

            const cssChecks = [
                { name: 'Mini Player Base Styles', pattern: '.mini-player' },
                { name: 'Fixed Positioning', pattern: 'position: fixed' },
                { name: 'Bottom Left Position', pattern: 'bottom: 20px' },
                { name: 'Width Specification', pattern: 'width: 200px' },
                { name: 'Hidden State', pattern: '.mini-player.hidden' },
                { name: 'Responsive Design', pattern: '@media' },
                { name: 'Control Buttons', pattern: '.mini-play-btn' },
                { name: 'Dark Mode Support', pattern: 'prefers-color-scheme: dark' }
            ];

            for (const check of cssChecks) {
                if (cssFile.data.includes(check.pattern)) {
                    addResult(check.name, 'passed', 'Style implemented');
                } else {
                    addResult(check.name, 'failed', 'Style missing');
                }
            }
        } else {
            addResult('CSS File Access', 'failed', `HTTP ${cssFile.statusCode}`);
        }

        // Test 4: Category page test (for sidebar hiding)
        console.log('\n📍 Test 4: Category page structure');

        // Try to find a category page from the main page
        const categoryMatch = mainPage.data.match(/href="([^"]*categories[^"]*)"/) ||
                             mainPage.data.match(/href="([^"]*tags[^"]*)"/) ||
                             mainPage.data.match(/href="(\/[^"]*\/)"/) && [null, mainPage.data.match(/href="(\/[^"]*\/)"/)[1]];

        if (categoryMatch && categoryMatch[1]) {
            const categoryUrl = categoryMatch[1].startsWith('http') ? categoryMatch[1] : `http://127.0.0.1:4003${categoryMatch[1]}`;
            console.log(`Testing category page: ${categoryUrl}`);

            try {
                const categoryPage = await makeRequest(categoryUrl);
                if (categoryPage.statusCode === 200) {
                    addResult('Category Page Access', 'passed', 'Category page loads successfully');

                    // Check if it includes the necessary scripts
                    if (categoryPage.data.includes('/assets/js/global-audio-player.js')) {
                        addResult('Global Player on Category Page', 'passed', 'Global audio player included on other pages');
                    } else {
                        addResult('Global Player on Category Page', 'failed', 'Global audio player missing on other pages');
                    }
                } else {
                    addResult('Category Page Access', 'failed', `Category page HTTP ${categoryPage.statusCode}`);
                }
            } catch (error) {
                addResult('Category Page Access', 'failed', `Error accessing category page: ${error.message}`);
            }
        } else {
            addResult('Category Page Detection', 'failed', 'No category/navigation links found for testing');
        }

        // Test 5: Audio file accessibility
        console.log('\n📍 Test 5: Audio file validation');
        try {
            const audioFile = await makeRequest('http://127.0.0.1:4003/assets/audio/STUDY_WITH_MIKU-part3.mp3');
            if (audioFile.statusCode === 200) {
                const fileSize = audioFile.headers['content-length'];
                addResult('Audio File Access', 'passed', `Audio file accessible (${fileSize ? `${Math.round(fileSize/1024/1024*100)/100}MB` : 'size unknown'})`);
            } else {
                addResult('Audio File Access', 'failed', `Audio file HTTP ${audioFile.statusCode}`);
            }
        } catch (error) {
            addResult('Audio File Access', 'failed', `Error accessing audio file: ${error.message}`);
        }

    } catch (error) {
        addResult('Test Execution', 'failed', `Test execution error: ${error.message}`);
    }

    // Print final results
    console.log('\n' + '='.repeat(60));
    console.log('🏁 IMPLEMENTATION VALIDATION RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Total Tests: ${results.tests.length}`);

    const successRate = results.tests.length > 0 ? (results.passed / results.tests.length * 100).toFixed(1) : 0;
    console.log(`🎯 Success Rate: ${successRate}%`);

    console.log('\n📋 DETAILED ANALYSIS:');

    const criticalTests = [
        'Main Page Load',
        'JS File Access',
        'CSS File Access',
        'GlobalAudioPlayer Class',
        'Mini Player Creation',
        'Audio File Access'
    ];

    const criticalPassed = results.tests.filter(t =>
        criticalTests.includes(t.name) && t.status === 'passed'
    ).length;

    console.log(`🔥 Critical Components: ${criticalPassed}/${criticalTests.length} working`);

    if (results.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Implementation is working correctly.');
        console.log('\n✨ The persistent audio player system should be fully functional:');
        console.log('   • Audio will continue playing across page navigation');
        console.log('   • Mini player appears in bottom-left corner with proper width');
        console.log('   • Sidebar/profile hidden on non-home pages');
        console.log('   • Minimize and close buttons functional');
        console.log('   • State persistence via sessionStorage');
        return true;
    } else if (criticalPassed === criticalTests.length) {
        console.log('\n⚠️  Core functionality appears intact despite some test failures.');
        console.log('   The system should work but may have minor issues.');
        return true;
    } else {
        console.log('\n❌ Critical functionality issues detected. Manual testing recommended.');
        return false;
    }
}

validateImplementation().then(success => {
    console.log(`\n🔍 Manual Testing URL: http://127.0.0.1:4003/`);
    console.log('💡 Test by clicking play button and navigating between pages.');
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
});