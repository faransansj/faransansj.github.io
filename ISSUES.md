# 블로그 개선 이슈 목록

> 자동 생성일: 2025-12-10
> 분석 도구: Claude Code

## 🔴 긴급 (즉시 수정)

### Issue #1: 중복 코드 제거 - global-mini-player.js
**파일**: `assets/js/global-mini-player.js`
**라벨**: `bug`, `priority:high`, `code-quality`

#### 문제 설명
global-mini-player.js 파일에 중복 코드가 존재합니다.

#### 중복 위치
1. **Line 77**: `this.hasUserGesture = true;` - 중복으로 2번 작성됨
2. **Line 311**: `this.startUpdates();` - 중복으로 2번 호출됨

#### 영향
- 불필요한 코드 실행
- 코드 가독성 저하
- 잠재적 버그 가능성

#### 해결 방법
```javascript
// Line 77: 중복된 라인 1개 제거
this.hasUserGesture = true;
// this.hasUserGesture = true; // ← 이 줄 삭제

// Line 311: 중복된 호출 1개 제거
this.startUpdates();
// this.startUpdates(); // ← 이 줄 삭제
```

---

### Issue #2: _config.yml locale 설정 오류
**파일**: `_config.yml:18`
**라벨**: `bug`, `priority:high`, `config`

#### 문제 설명
locale 설정이 잘못된 언어 코드를 사용하고 있습니다.

#### 현재 설정
```yaml
locale: "kr-KR"  # ❌ 잘못된 코드
```

#### 올바른 설정
```yaml
locale: "ko-KR"  # ✅ 올바른 코드 (ISO 639-1)
```

#### 영향
- 다국어 처리 오류 가능성
- SEO 메타데이터 오류
- 브라우저 언어 인식 문제

#### 참고
- 올바른 언어 코드: [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
- 한국어: `ko` (Korean)

---

## 🟡 중요 (단기 내 수정)

### Issue #3: 테스트/디버그 파일 정리
**위치**: `_test/` 디렉토리, 루트 디렉토리
**라벨**: `cleanup`, `priority:medium`, `maintenance`

#### 문제 설명
프로덕션에 불필요한 테스트 및 디버그 파일들이 130KB 이상 포함되어 있습니다.

#### 대상 파일들
**_test/ 디렉토리** (130KB):
- `audio-continuity-test-report.md` (3.9KB)
- `code-test.md` (4.2KB)
- `debug-mini-player-title.html` (10KB)
- `qa-continuity-diagnosis.js` (15KB)
- `qa-debug-persistent-audio.js` (4.8KB)
- `qa-final-continuity-test.js` (7.9KB)
- `qa-persistent-audio-test.js` (9.8KB)
- `run-audio-tests.js` (10.5KB)
- `test-audio-continuity.html` (33KB)
- `test-mini-player-spacing.html` (6KB)
- `test-summary-report.md` (7.6KB)

**루트 디렉토리 삭제 대기 파일들**:
- `audio-continuity-test-report.md`
- `debug-mini-player-title.html`
- `qa-*.js` (4개)
- `run-audio-tests.js`
- `test-*.html` (2개)
- `test-summary-report.md`

#### 해결 방법
**옵션 1**: 완전 삭제
```bash
rm -rf _test/
git rm audio-continuity-test-report.md debug-mini-player-title.html
git rm qa-*.js run-audio-tests.js test-*.html test-summary-report.md
```

**옵션 2**: .gitignore에 추가하여 버전 관리에서 제외
```bash
# .gitignore에 추가
_test/
*-test.html
*-test.js
*-test.md
qa-*.js
debug-*.html
run-*.js
```

---

### Issue #4: 플레이어 초기화 로직 중복
**파일**: `assets/js/global-mini-player.js`, `assets/js/player-bridge.js`
**라벨**: `enhancement`, `priority:medium`, `code-quality`

#### 문제 설명
두 파일 모두 `DOMContentLoaded` 이벤트에서 플레이어를 초기화하려고 시도합니다.

#### 중복 위치
1. `global-mini-player.js:518` - DOMContentLoaded 리스너
2. `player-bridge.js:31` - DOMContentLoaded 리스너

#### 영향
- 플레이어가 여러 번 초기화될 가능성
- 불필요한 리소스 낭비
- 예측 불가능한 동작

#### 해결 방법
player-bridge.js의 초기화 로직을 제거하거나, 싱글톤 패턴을 더 강화하여 중복 초기화를 방지합니다.

```javascript
// player-bridge.js - 제거 또는 수정 권장
document.addEventListener('DOMContentLoaded', function() {
    // 이미 global-mini-player.js에서 초기화되므로 불필요
    // if (!window.globalMiniPlayer && !window.__globalMiniPlayer) {
    //     new GlobalMiniPlayer();
    // }
});
```

---

### Issue #5: .gitignore 업데이트 필요
**파일**: `.gitignore`
**라벨**: `config`, `priority:medium`, `maintenance`

#### 문제 설명
테스트 파일들에 대한 패턴이 .gitignore에 없어서 실수로 커밋될 가능성이 있습니다.

#### 추가 권장 패턴
```gitignore
# Test and Debug files
_test/
*-test.html
*-test.js
*-test.md
qa-*.js
debug-*.html
test-*.html
run-*.js
*-report.md
```

---

## 🟢 권장 (중장기 개선)

### Issue #6: _config.yml repository URL 형식
**파일**: `_config.yml:27`
**라벨**: `config`, `priority:low`, `enhancement`

#### 현재 설정
```yaml
repository: https://github.com/faransansj/faransansj.github.io
```

#### 권장 설정
```yaml
repository: faransansj/faransansj.github.io
```

#### 이유
Jekyll/GitHub Pages는 `username/repo` 형식을 권장합니다. URL 전체를 넣으면 일부 플러그인에서 문제가 발생할 수 있습니다.

---

### Issue #7: package.json repository 정보 업데이트
**파일**: `package.json:6-9`
**라벨**: `config`, `priority:low`, `maintenance`

#### 문제 설명
package.json의 repository 정보가 Minimal Mistakes 테마의 원본 저장소를 가리키고 있습니다.

#### 현재 설정
```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/mmistakes/minimal-mistakes.git"
  }
}
```

#### 권장 설정
```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/faransansj/faransansj.github.io.git"
  }
}
```

---

### Issue #8: 외부 스크립트 번들링 고려
**파일**: `_includes/scripts.html`
**라벨**: `performance`, `priority:low`, `enhancement`

#### 문제 설명
Swup, MathJax 등 여러 외부 CDN 스크립트를 사용 중입니다.

#### 현재 구조
- Swup (unpkg.com)
- SwupHeadPlugin (unpkg.com)
- SwupScriptsPlugin (unpkg.com)
- MathJax (cdnjs.cloudflare.com)

#### 영향
- 네트워크 지연 시 페이지 로딩 속도 저하
- CDN 장애 시 기능 장애
- 여러 HTTP 요청으로 인한 오버헤드

#### 해결 방법 (선택사항)
1. npm으로 패키지 설치
2. 로컬에서 번들링
3. 필수 스크립트만 남기고 제거

---

## 📊 요약

| 우선순위 | 이슈 수 | 상태 |
|---------|--------|------|
| 🔴 긴급 | 2 | 즉시 수정 필요 |
| 🟡 중요 | 4 | 단기 내 수정 |
| 🟢 권장 | 3 | 중장기 개선 |
| **합계** | **9** | - |

---

## 🎯 권장 작업 순서

1. ✅ Issue #2: locale 설정 수정 (1분)
2. ✅ Issue #1: 중복 코드 제거 (2분)
3. ✅ Issue #5: .gitignore 업데이트 (2분)
4. ✅ Issue #3: 테스트 파일 정리 (5분)
5. ⚠️ Issue #4: 초기화 로직 통합 (10분)
6. 📝 Issue #6, #7: 설정 파일 업데이트 (5분)
7. 🚀 Issue #8: 성능 최적화 검토 (선택사항)

---

## 📝 참고사항

- 이 파일은 자동 생성되었으며, 수동으로 업데이트할 수 있습니다.
- 이슈 해결 시 해당 섹션에 ✅ 체크 표시를 추가하세요.
- 우선순위는 프로젝트 상황에 따라 조정 가능합니다.

---

**마지막 업데이트**: 2025-12-10
**다음 검토일**: 2025-12-17
