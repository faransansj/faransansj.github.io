// assets/js/custom.js 수정
// 페이지 로드 후 코드 블록 업그레이드
document.addEventListener('DOMContentLoaded', function() {
    // 모든 코드 블록 찾기
    const codeBlocks = document.querySelectorAll('div.highlighter-rouge');
    
    codeBlocks.forEach(function(block) {
      // 언어 클래스에서 언어 이름 추출
      let languageClass = block.className;
      let language = 'text';
      
      if (languageClass.includes('language-')) {
        language = languageClass.match(/language-(\w+)/)[1];
      }
      
      // 원래 코드 블록 요소 저장
      const originalPre = block.querySelector('pre.highlight');
      const originalCode = originalPre.innerHTML;
      
      // 새 구조 생성
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      
      const header = document.createElement('div');
      header.className = 'code-block-header';
      
      const langLabel = document.createElement('span');
      langLabel.className = 'language-label';
      langLabel.textContent = language;
      
      // 복사 버튼에 아이콘 사용
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-button';
      copyButton.innerHTML = '<i class="far fa-copy"></i>'; // FontAwesome 아이콘
      copyButton.title = '코드 복사'; // 툴팁 추가
      copyButton.onclick = function() {
        copyCodeToClipboard(this);
      };
      
      // 요소 조립
      header.appendChild(langLabel);
      header.appendChild(copyButton);
      
      // 원래 pre 요소를 복제하여 사용
      const newPre = originalPre.cloneNode(true);
      
      wrapper.appendChild(header);
      wrapper.appendChild(newPre);
      
      // 원래 구조 교체
      block.innerHTML = '';
      block.appendChild(wrapper);
    });
  });
  
  // 코드 복사 함수 수정
  function copyCodeToClipboard(button) {
    const codeBlock = button.closest('.code-block-wrapper').querySelector('pre.highlight code');
    const textToCopy = codeBlock ? codeBlock.textContent : button.closest('.code-block-wrapper').querySelector('pre.highlight').textContent;
    
    navigator.clipboard.writeText(textToCopy).then(function() {
      // 복사 성공 표시 (아이콘 변경)
      button.innerHTML = '<i class="fas fa-check"></i>'; // 체크 아이콘으로 변경
      button.classList.add('copied');
      
      // 2초 후 원래 상태로 돌아가기
      setTimeout(function() {
        button.innerHTML = '<i class="far fa-copy"></i>'; // 원래 아이콘으로 복원
        button.classList.remove('copied');
      }, 2000);
    }).catch(function(err) {
      console.error('클립보드 복사 실패:', err);
    });
  }
  
// --------------------------------------------------