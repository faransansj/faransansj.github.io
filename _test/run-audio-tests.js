/**
 * 자동화된 오디오 연속성 테스트 실행기
 * Node.js를 사용하여 브라우저 자동화 테스트 수행
 */

const fs = require('fs');
const path = require('path');

class AudioTestRunner {
    constructor() {
        this.testResults = {};
        this.testCount = 0;
        this.passedCount = 0;
        this.failedCount = 0;
        this.baseUrl = 'http://127.0.0.1:4003';
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const prefix = {
            info: '📋',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        };
        console.log(`[${timestamp}] ${prefix[type] || '📋'} ${message}`);
    }

    // 테스트 시나리오 정의
    getTestScenarios() {
        return [
            {
                id: 'basic-link-navigation',
                name: '일반 링크 클릭 네비게이션',
                description: '페이지 내 링크 클릭 시 오디오 연속성 확인',
                steps: [
                    '홈페이지에서 음악 시작',
                    '다른 페이지 링크 클릭',
                    '오디오 상태 확인'
                ],
                expected: '음악이 중단 없이 계속 재생됨'
            },
            {
                id: 'browser-back-forward',
                name: '브라우저 뒤로가기/앞으로가기',
                description: '브라우저 네비게이션 버튼 사용 시 연속성 확인',
                steps: [
                    '페이지 A에서 음악 시작',
                    '페이지 B로 이동',
                    '뒤로가기 버튼 클릭',
                    '오디오 상태 확인'
                ],
                expected: '페이지 히스토리 이동 시에도 음악이 계속됨'
            },
            {
                id: 'page-refresh',
                name: '페이지 새로고침 (F5)',
                description: 'F5 키나 새로고침 버튼으로 페이지 갱신 시 상태 복원',
                steps: [
                    '음악 재생 중',
                    'F5 키 또는 새로고침 버튼',
                    '페이지 리로드 후 상태 확인'
                ],
                expected: '새로고침 후 이전 재생 위치에서 자동 재개'
            },
            {
                id: 'hard-refresh',
                name: '강제 새로고침 (Ctrl+Shift+R)',
                description: '캐시 무시 강제 새로고침 후 상태 복원',
                steps: [
                    '음악 재생 중',
                    'Ctrl+Shift+R 조합키',
                    '캐시 무시 리로드 후 확인'
                ],
                expected: '캐시 무시 새로고침 후에도 상태 복원됨'
            },
            {
                id: 'new-tab',
                name: '새 탭에서 열기',
                description: '링크를 새 탭에서 열었을 때 음악 상태 관리',
                steps: [
                    '원래 탭에서 음악 재생',
                    '링크를 새 탭에서 열기',
                    '양쪽 탭의 음악 상태 확인'
                ],
                expected: '두 탭 간 음악 상태가 동기화됨'
            },
            {
                id: 'url-direct-input',
                name: 'URL 직접 입력',
                description: '주소창에 URL을 직접 입력했을 때 상태 복원',
                steps: [
                    '음악 재생 중',
                    '주소창에 다른 페이지 URL 입력',
                    '엔터키로 이동',
                    '상태 복원 확인'
                ],
                expected: 'URL 직접 입력으로 이동해도 음악 계속됨'
            },
            {
                id: 'tab-switching',
                name: '탭 전환',
                description: '다른 탭으로 전환 후 다시 돌아왔을 때',
                steps: [
                    '탭 A에서 음악 재생',
                    '탭 B로 전환',
                    '일정 시간 후 탭 A로 복귀',
                    '음악 상태 확인'
                ],
                expected: '탭 전환 후에도 음악이 계속 재생됨'
            },
            {
                id: 'window-focus-blur',
                name: '윈도우 포커스 변경',
                description: '다른 앱으로 전환 후 브라우저로 복귀',
                steps: [
                    '브라우저에서 음악 재생',
                    '다른 앱으로 전환',
                    '브라우저로 다시 복귀',
                    '음악 상태 확인'
                ],
                expected: '앱 전환 후에도 음악 재생 유지'
            }
        ];
    }

    // 테스트 결과 분석
    analyzeTestResults() {
        const scenarios = this.getTestScenarios();

        this.log('📊 테스트 결과 분석 시작', 'info');
        this.log('='.repeat(60));

        scenarios.forEach((scenario, index) => {
            this.log(`${index + 1}. ${scenario.name}`);
            this.log(`   설명: ${scenario.description}`);
            this.log(`   기대 결과: ${scenario.expected}`);
            this.log(`   테스트 단계:`);
            scenario.steps.forEach((step, stepIndex) => {
                this.log(`     ${stepIndex + 1}) ${step}`);
            });
            this.log('');
        });

        this.log('='.repeat(60));
        this.log(`총 테스트 시나리오: ${scenarios.length}개`);
        this.log(`수동 테스트 필요: ${scenarios.length}개`);

        return scenarios;
    }

    // 테스트 체크리스트 생성
    generateTestChecklist() {
        const scenarios = this.getTestScenarios();
        const checklist = [];

        checklist.push('# 🎵 오디오 연속성 테스트 체크리스트\n');
        checklist.push('## 테스트 준비사항');
        checklist.push('- [ ] Jekyll 서버 실행 (http://127.0.0.1:4003)');
        checklist.push('- [ ] 테스트 페이지 접근 (/test-audio-continuity.html)');
        checklist.push('- [ ] 플레이어 초기화 및 테스트 음악 시작');
        checklist.push('- [ ] 브라우저 개발자 도구 콘솔 열기\n');

        checklist.push('## 테스트 케이스\n');

        scenarios.forEach((scenario, index) => {
            checklist.push(`### ${index + 1}. ${scenario.name}`);
            checklist.push(`**목적**: ${scenario.description}\n`);
            checklist.push('**테스트 단계**:');
            scenario.steps.forEach((step, stepIndex) => {
                checklist.push(`- [ ] ${stepIndex + 1}. ${step}`);
            });
            checklist.push(`\n**기대 결과**: ${scenario.expected}\n`);
            checklist.push('**실제 결과**: _테스트 후 기록_\n');
            checklist.push('**통과 여부**: [ ] 통과 / [ ] 실패\n');
            checklist.push('---\n');
        });

        checklist.push('## 테스트 결과 요약');
        checklist.push('- 총 테스트: ___개');
        checklist.push('- 통과: ___개');
        checklist.push('- 실패: ___개');
        checklist.push('- 성공률: ___%\n');

        checklist.push('## 발견된 이슈');
        checklist.push('1. _이슈 설명_');
        checklist.push('2. _이슈 설명_\n');

        checklist.push('## 개선 사항');
        checklist.push('1. _개선 사항_');
        checklist.push('2. _개선 사항_\n');

        return checklist.join('\n');
    }

    // 테스트 실행 가이드 출력
    printTestGuide() {
        this.log('🎵 오디오 연속성 테스트 실행 가이드', 'info');
        this.log('='.repeat(60));

        this.log('1. 테스트 환경 준비:', 'info');
        this.log('   - Jekyll 서버가 http://127.0.0.1:4003 에서 실행 중인지 확인');
        this.log('   - 브라우저에서 /test-audio-continuity.html 접근');
        this.log('');

        this.log('2. 테스트 시작:', 'info');
        this.log('   - "플레이어 초기화" 버튼 클릭');
        this.log('   - "테스트 음악 시작" 버튼 클릭');
        this.log('   - 음악이 재생되는지 확인');
        this.log('');

        this.log('3. 각 테스트 케이스 실행:', 'info');
        this.log('   - 테스트 카드의 "테스트 시작" 버튼 클릭');
        this.log('   - 안내에 따라 페이지 이동 수행');
        this.log('   - 음악 연속성 확인');
        this.log('   - 결과를 콘솔과 UI에서 확인');
        this.log('');

        this.log('4. 결과 분석:', 'info');
        this.log('   - 통계 섹션에서 전체 결과 확인');
        this.log('   - 실패한 케이스 원인 분석');
        this.log('   - 콘솔 로그에서 상세 정보 확인');
        this.log('');

        this.log('🔗 테스트 URL: http://127.0.0.1:4003/test-audio-continuity.html', 'success');
    }

    // 테스트 보고서 생성
    generateTestReport() {
        const checklist = this.generateTestChecklist();
        const reportPath = path.join(__dirname, 'audio-continuity-test-report.md');

        try {
            fs.writeFileSync(reportPath, checklist, 'utf8');
            this.log(`📄 테스트 체크리스트가 생성되었습니다: ${reportPath}`, 'success');
        } catch (error) {
            this.log(`❌ 체크리스트 생성 실패: ${error.message}`, 'error');
        }

        return reportPath;
    }
}

// 메인 실행부
if (require.main === module) {
    const runner = new AudioTestRunner();

    console.log('🎵 오디오 연속성 테스트 도구');
    console.log('================================\n');

    // 테스트 가이드 출력
    runner.printTestGuide();

    console.log('\n' + '='.repeat(60) + '\n');

    // 테스트 시나리오 분석
    runner.analyzeTestResults();

    console.log('\n' + '='.repeat(60) + '\n');

    // 테스트 보고서 생성
    runner.generateTestReport();

    console.log('\n💡 다음 단계:');
    console.log('1. 브라우저에서 테스트 페이지를 열어 수동 테스트 수행');
    console.log('2. 각 테스트 케이스의 결과를 체크리스트에 기록');
    console.log('3. 발견된 이슈와 개선사항 문서화');
    console.log('4. 필요시 코드 개선 후 재테스트');
}

module.exports = AudioTestRunner;