// Enhanced Code Block Functionality
class CodeBlockEnhancer {
  constructor() {
    this.languageMap = {
      // Web Technologies
      'html': { name: 'HTML', icon: this.createHTMLIcon() },
      'css': { name: 'CSS', icon: this.createCSSIcon() },
      'scss': { name: 'SCSS', icon: this.createSCSSIcon() },
      'sass': { name: 'Sass', icon: this.createSCSSIcon() },
      'javascript': { name: 'JavaScript', icon: this.createJSIcon() },
      'js': { name: 'JavaScript', icon: this.createJSIcon() },
      'typescript': { name: 'TypeScript', icon: this.createTSIcon() },
      'ts': { name: 'TypeScript', icon: this.createTSIcon() },
      'json': { name: 'JSON', icon: this.createJSONIcon() },
      
      // Backend Languages
      'python': { name: 'Python', icon: this.createPythonIcon() },
      'py': { name: 'Python', icon: this.createPythonIcon() },
      'java': { name: 'Java', icon: this.createJavaIcon() },
      'cpp': { name: 'C++', icon: this.createCPPIcon() },
      'c++': { name: 'C++', icon: this.createCPPIcon() },
      'c': { name: 'C', icon: this.createCIcon() },
      'go': { name: 'Go', icon: this.createGoIcon() },
      'rust': { name: 'Rust', icon: this.createRustIcon() },
      'php': { name: 'PHP', icon: this.createPHPIcon() },
      'ruby': { name: 'Ruby', icon: this.createRubyIcon() },
      'swift': { name: 'Swift', icon: this.createSwiftIcon() },
      'kotlin': { name: 'Kotlin', icon: this.createKotlinIcon() },
      
      // Shell & Command Line
      'shell': { name: 'Shell', icon: this.createShellIcon() },
      'sh': { name: 'Shell', icon: this.createShellIcon() },
      'bash': { name: 'Bash', icon: this.createBashIcon() },
      'zsh': { name: 'Zsh', icon: this.createBashIcon() },
      'powershell': { name: 'PowerShell', icon: this.createPowerShellIcon() },
      'cmd': { name: 'CMD', icon: this.createCMDIcon() },
      
      // Data & Config
      'yaml': { name: 'YAML', icon: this.createYAMLIcon() },
      'yml': { name: 'YAML', icon: this.createYAMLIcon() },
      'xml': { name: 'XML', icon: this.createXMLIcon() },
      'sql': { name: 'SQL', icon: this.createSQLIcon() },
      'markdown': { name: 'Markdown', icon: this.createMarkdownIcon() },
      'md': { name: 'Markdown', icon: this.createMarkdownIcon() },
      
      // Default
      'text': { name: 'Text', icon: this.createDefaultIcon() },
      'plaintext': { name: 'Text', icon: this.createDefaultIcon() }
    };
    
    this.init();
  }
  
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.enhanceCodeBlocks());
    } else {
      this.enhanceCodeBlocks();
    }
  }
  
  enhanceCodeBlocks() {
    const codeBlocks = document.querySelectorAll('div.highlighter-rouge, figure.highlight');
    
    codeBlocks.forEach((block, index) => {
      this.enhanceBlock(block, index);
    });
  }
  
  enhanceBlock(block, index) {
    // Skip if already enhanced
    if (block.classList.contains('code-block-enhanced')) {
      return;
    }
    
    // Detect language
    const language = this.detectLanguage(block);
    const languageInfo = this.languageMap[language] || this.languageMap['text'];
    
    // Get original content
    const preElement = block.querySelector('pre.highlight, pre');
    if (!preElement) return;
    
    // Create enhanced structure
    const wrapper = document.createElement('div');
    wrapper.className = `code-block-enhanced language-${language}`;
    wrapper.setAttribute('data-language', language);
    
    // Create header
    const header = this.createHeader(languageInfo, index);
    
    // Clone the pre element
    const enhancedPre = preElement.cloneNode(true);
    
    // Assemble the enhanced block
    wrapper.appendChild(header);
    wrapper.appendChild(enhancedPre);
    
    // Replace original block content
    block.innerHTML = '';
    block.appendChild(wrapper);
    block.classList.add('enhanced-container');
  }
  
  detectLanguage(block) {
    // Try multiple detection methods
    const classNames = block.className;
    
    // Method 1: Direct language-* class (primary for Jekyll/Rouge)
    const languageMatch = classNames.match(/language-([^\s]+)/);
    if (languageMatch) {
      return languageMatch[1].toLowerCase();
    }
    
    // Method 2: Check for highlight-* classes
    const highlightMatch = classNames.match(/highlight-([^\s]+)/);
    if (highlightMatch) {
      return highlightMatch[1].toLowerCase();
    }
    
    // Method 3: Check pre element classes
    const preElement = block.querySelector('pre');
    if (preElement) {
      const preClassMatch = preElement.className.match(/language-([^\s]+)/);
      if (preClassMatch) {
        return preClassMatch[1].toLowerCase();
      }
    }
    
    // Method 4: Check for code element classes
    const codeElement = block.querySelector('code');
    if (codeElement) {
      const codeClassMatch = codeElement.className.match(/language-([^\s]+)/);
      if (codeClassMatch) {
        return codeClassMatch[1].toLowerCase();
      }
    }
    
    return 'text'; // fallback
  }
  
  createHeader(languageInfo, blockIndex) {
    const header = document.createElement('div');
    header.className = 'code-header';
    
    // Language info section
    const langSection = document.createElement('div');
    langSection.className = 'language-info';
    
    const iconElement = document.createElement('span');
    iconElement.className = 'language-icon';
    iconElement.innerHTML = languageInfo.icon;
    
    const labelElement = document.createElement('span');
    labelElement.className = 'language-label';
    labelElement.textContent = languageInfo.name;
    
    langSection.appendChild(iconElement);
    langSection.appendChild(labelElement);
    
    // Copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.innerHTML = this.createCopyIcon();
    copyButton.title = '코드 복사';
    copyButton.setAttribute('aria-label', '코드 복사');
    copyButton.onclick = (e) => this.copyCode(e, blockIndex);
    
    header.appendChild(langSection);
    header.appendChild(copyButton);
    
    return header;
  }
  
  async copyCode(event, blockIndex) {
    const button = event.target.closest('.copy-button');
    const codeBlock = button.closest('.code-block-enhanced');
    const preElement = codeBlock.querySelector('pre');
    
    if (!preElement) return;
    
    // Get text content, removing line numbers if present
    let textToCopy = preElement.textContent || preElement.innerText;
    
    // Clean up text (remove line numbers, extra whitespace)
    textToCopy = textToCopy
      .split('\\n')
      .map(line => line.replace(/^\\s*\\d+\\s*/, '')) // Remove line numbers
      .join('\\n')
      .trim();
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      this.showCopySuccess(button);
      this.showToast('코드가 복사되었습니다!');
    } catch (err) {
      console.error('Failed to copy code:', err);
      // Fallback for older browsers
      this.fallbackCopyText(textToCopy);
      this.showCopySuccess(button);
      this.showToast('코드가 복사되었습니다!');
    }
  }
  
  fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    
    document.body.removeChild(textArea);
  }
  
  showCopySuccess(button) {
    const originalHTML = button.innerHTML;
    button.innerHTML = this.createCheckIcon();
    button.classList.add('copied');
    
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('copied');
    }, 2000);
  }
  
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  }
  
  // Icon creation methods
  createCopyIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>`;
  }
  
  createCheckIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>`;
  }
  
  createPythonIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/>
    </svg>`;
  }
  
  createJSIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/>
    </svg>`;
  }
  
  createHTMLIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/>
    </svg>`;
  }
  
  createCSSIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.414z"/>
    </svg>`;
  }
  
  createDefaultIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14,2 14,8 20,8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10,9 9,9 8,9"></polyline>
    </svg>`;
  }
  
  // Additional language icons with distinct designs
  createTSIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/>
    </svg>`;
  }
  
  createSCSSIcon() { return this.createCSSIcon(); }
  
  createJavaIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.851 18.56s-.917.534.653.714c1.902.218 2.874.187 4.969-.211 0 0 .552.346 1.321.646-4.699 2.013-10.633-.118-6.943-1.149M8.276 15.933s-1.028.761.542.924c2.032.209 3.636.227 6.413-.308 0 0 .384.389.987.602-5.679 1.661-12.007.13-7.942-1.218M13.116 11.475c1.158 1.333-.304 2.533-.304 2.533s2.939-1.518 1.589-3.418c-1.261-1.772-2.228-2.652 3.007-5.688 0-.001-8.216 2.051-4.292 6.573M19.33 20.504s.679.559-.747.991c-2.712.822-11.288 1.069-13.669.033-.856-.373.75-.89 1.254-.998.527-.114.828-.093.828-.093-.953-.671-6.156 1.317-2.643 1.887 9.58 1.553 17.462-.7 14.977-1.82M9.292 13.21s-4.362 1.036-1.544 1.412c1.189.159 3.561.123 5.77-.062 1.806-.152 3.618-.477 3.618-.477s-.637.272-1.098.587c-4.429 1.165-12.986.623-10.522-.568 2.082-1.006 3.776-.892 3.776-.892M17.116 17.584c4.503-2.34 2.421-4.589.968-4.285-.355.074-.515.138-.515.138s.132-.207.385-.297c2.875-1.011 5.086 2.981-.928 4.562 0-.001.07-.062.09-.118M14.401 0s2.494 2.494-2.365 6.33c-3.896 3.077-.888 4.832-.001 6.836-2.274-2.053-3.943-3.858-2.824-5.539 1.644-2.469 6.197-3.665 5.19-7.627M9.734 23.924c4.322.277 10.959-.153 11.116-2.198 0 0-.302.775-3.572 1.391-3.688.694-8.239.613-10.937.168 0-.001.553.457 3.393.639"/>
    </svg>`;
  }
  
  createCPPIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.394 6c-.167-.29-.398-.543-.652-.69L12.926.22c-.509-.294-1.34-.294-1.848 0L2.26 5.31c-.508.293-.923 1.013-.923 1.6v10.18c0 .294.104.62.271.91.398.267.645.398.648.398l8.816 5.09c.508.293 1.339.293 1.847 0l8.816-5.09s.25-.131.648-.398c.167-.29.27-.616.27-.91V6.91c.003-.294-.1-.62-.26-.91zM12 19.109c-3.92 0-7.109-3.189-7.109-7.109S8.08 4.891 12 4.891a7.133 7.133 0 0 1 6.156 3.552l-3.076 1.781A3.567 3.567 0 0 0 12 8.445c-1.96 0-3.554 1.595-3.554 3.555S10.04 15.555 12 15.555a3.57 3.57 0 0 0 3.08-1.778l3.077 1.78A7.135 7.135 0 0 1 12 19.109zm7.109-6.714h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79v.79zm2.962 0h-.79v.79h-.79v-.79h-.79v-.79h.79v-.79h.79v.79h.79v.79z"/>
    </svg>`;
  }
  
  createCIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5978 8.8955H7.40216c-.6444 0-1.16654.5221-1.16654 1.1666v4c0 .6444.5221 1.1666 1.16654 1.1666h9.19564c.6444 0 1.1666-.5222 1.1666-1.1666v-4c0-.6445-.5222-1.1666-1.1666-1.1666zM12 0C5.3726 0 0 5.3726 0 12c0 6.6274 5.3726 12 12 12 6.6274 0 12-5.3726 12-12C24 5.3726 18.6274 0 12 0zm-.0693 17.5c-2.442 0-4.4231-1.9811-4.4231-4.4231v-2.1538c0-2.442 1.9811-4.4231 4.4231-4.4231s4.4231 1.9811 4.4231 4.4231v2.1538c0 2.442-1.9811 4.4231-4.4231 4.4231z"/>
    </svg>`;
  }
  
  createGoIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.811 10.231c-.047 0-.058-.023-.035-.059l.246-.315c.023-.035.081-.058.128-.058h4.172c.046 0 .058.035.035.07l-.199.303c-.023.036-.082.07-.117.07zM.047 11.306c-.047 0-.059-.023-.035-.058l.245-.316c.023-.035.082-.058.129-.058h5.328c.047 0 .07.035.058.07l-.093.28c-.012.047-.058.07-.105.070zM2.828 12.38c-.047 0-.07-.023-.047-.07l.163-.292c.023-.047.070-.07.117-.07h2.337c.047 0 .07.035.07.082l-.023.28c0 .047-.047.082-.082.082zm8.967-9.52c-1.27 1.27-1.27 3.305 0 4.575 1.27 1.27 3.317 1.27 4.575 0 1.27-1.27 1.27-3.305 0-4.575-1.27-1.27-3.317-1.27-4.575 0zm3.355 3.355c-.738.738-1.95.738-2.688 0-.738-.738-.738-1.95 0-2.688.738-.738 1.95-.738 2.688 0 .738.738.738 1.95 0 2.688zM7.16 15.217c-.047 0-.07.023-.047.070l.105.246c.023.047.070.070.117.070h6.273c.047 0 .082-.035.070-.082l-.07-.234c-.012-.047-.058-.070-.105-.070zm8.684-2.826c-.082.337-.176.618-.257.898-.058.187-.128.327-.186.327 0 0-.023 0-.023-.023 0-.047.035-.117.058-.176.058-.187.105-.374.140-.573.023-.117.035-.234.047-.351.011-.117 0-.234-.023-.327-.012-.047-.035-.082-.070-.105-.023-.012-.047-.012-.070-.012-.128 0-.245.117-.326.245-.198.315-.292.666-.303 1.028 0 .023-.012.047-.012.070-.023.070-.058.14-.105.199-.12.175-.257.327-.408.468-.187.175-.397.327-.584.491-.582.514-1.27 1.086-1.852 1.611-.082.07-.152.152-.234.234-.082.082-.175.175-.257.269-.093.105-.175.222-.257.339-.082.117-.152.245-.222.374-.07.128-.128.268-.175.408-.047.14-.082.292-.082.444 0 .152.035.304.117.433.082.128.222.222.374.222.152 0 .304-.07.408-.175.105-.105.175-.257.175-.408 0-.152-.035-.304-.117-.433-.082-.128-.175-.222-.257-.292-.082-.07-.152-.117-.175-.152 0-.035.023-.07.058-.105.035-.035.082-.07.117-.105.07-.07.152-.14.234-.21.082-.07.175-.14.257-.21.175-.14.362-.28.549-.42.187-.14.374-.28.549-.42.175-.14.327-.28.468-.42.14-.14.257-.28.362-.42.105-.14.187-.292.222-.468.035-.176.023-.374-.047-.549-.07-.175-.199-.327-.327-.433-.128-.105-.28-.152-.433-.152-.152 0-.304.047-.433.152-.128.105-.222.257-.257.433-.035.176-.012.374.047.549.058.175.152.327.257.456.105.128.234.222.374.257.14.035.292.012.433-.047.14-.058.257-.152.327-.269.07-.117.105-.257.082-.397-.023-.14-.082-.268-.175-.374-.093-.105-.222-.175-.362-.199-.14-.023-.292.012-.433.082-.14.07-.257.175-.327.304-.07.128-.093.28-.047.433.047.152.152.28.292.351.14.07.304.082.456.035.152-.047.28-.152.351-.292.07-.14.082-.304.035-.456-.047-.152-.152-.28-.292-.351-.14-.07-.304-.082-.456-.035-.152.047-.28.152-.351.292-.07.14-.082.304-.035.456.047.152.152.28.292.351.14.07.304.082.456.035.152-.047.28-.152.351-.292.07-.14.082-.304.035-.456-.047-.152-.152-.28-.292-.351z"/>
    </svg>`;
  }
  
  createRustIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.8346 11.7033l-1.0073-.6236a13.7268 13.7268 0 0 0-.0283-.2936l.8656-.8069a.3483.3483 0 0 0-.1154-.5702l-1.0736-.2366a13.3796 13.3796 0 0 0-.0836-.2897l.7005-.9692a.3462.3462 0 0 0-.2257-.5411l-1.1161-.0927a12.7103 12.7103 0 0 0-.1356-.2835l.5215-1.1032a.3484.3484 0 0 0-.3258-.5002l-1.1371.0531a13.7944 13.7944 0 0 0-.1838-.2691l.3309-1.2034a.3462.3462 0 0 0-.4158-.4523l-1.1411.2403a12.6187 12.6187 0 0 0-.2284-.2513l.1272-1.2784a.3462.3462 0 0 0-.4943-.3583l-1.1272.4203a13.3796 13.3796 0 0 0-.2691-.2284l-.0741-1.3313a.3484.3484 0 0 0-.5583-.2257l-1.0073.6236a13.7268 13.7268 0 0 0-.2936.0283l-.8069-.8656a.3462.3462 0 0 0-.5702.1154l-.2366 1.0736a13.5012 13.5012 0 0 0-.2897.0836l-.9692-.7005a.3484.3484 0 0 0-.5411.2257l-.0927 1.1161a12.7103 12.7103 0 0 0-.2835.1356l-1.1032-.5215a.3462.3462 0 0 0-.5002.3258l.0531 1.1371a13.7944 13.7944 0 0 0-.2691.1838l-1.2034-.3309a.3484.3484 0 0 0-.4523.4158l.2403 1.1411a12.6187 12.6187 0 0 0-.2513.2284l-1.2784-.1272a.3484.3484 0 0 0-.3583.4943l.4203 1.1272a13.3796 13.3796 0 0 0-.2284.2691l-1.3313.0741a.3462.3462 0 0 0-.2257.5583l.6236 1.0073c.0094.0979.019.1958.0283.2936l-.8656.8069a.3484.3484 0 0 0 .1154.5702l1.0736.2366c.0094.0979.019.1958.0283.2936-.0094.0979-.019.1958-.0283.2936l-1.0736.2366a.3484.3484 0 0 0-.1154.5702l.8656.8069c-.0094.0979-.019.1958-.0283.2936l-.6236 1.0073a.3462.3462 0 0 0 .2257.5583l1.3313.0741c.0751.0896.1533.1762.2284.2691l-.4203 1.1272a.3484.3484 0 0 0 .3583.4943l1.2784-.1272c.0836.0896.1672.1762.2513.2284l-.2403 1.1411a.3484.3484 0 0 0 .4523.4158l1.2034-.3309c.0896.0896.1762.1533.2691.1838l-.0531 1.1371a.3462.3462 0 0 0 .5002.3258l1.1032-.5215c.0896.0751.1762.1533.2835.1356l.0927 1.1161a.3484.3484 0 0 0 .5411.2257l.9692-.7005c.0979.0283.1958.0566.2897.0836l.2366 1.0736a.3462.3462 0 0 0 .5702.1154l.8069-.8656c.0979.0094.1958.019.2936.0283l1.0073.6236a.3462.3462 0 0 0 .5583-.2257l.0741-1.3313c.0896-.0751.1762-.1533.2691-.2284l1.1272.4203a.3462.3462 0 0 0 .4943-.3583l-.1272-1.2784c.0896-.0836.1762-.1672.2284-.2513l1.1411.2403a.3484.3484 0 0 0 .4158-.4523l-.3309-1.2034c.0896-.0896.1533-.1762.1838-.2691l1.1371.0531a.3462.3462 0 0 0 .5002-.3258l-.5215-1.1032c.0751-.0896.1533-.1762.1356-.2835l1.1161-.0927a.3484.3484 0 0 0 .2257-.5411l-.7005-.9692c.0283-.0979.0566-.1958.0836-.2897l1.0736-.2366a.3462.3462 0 0 0 .1154-.5702l-.8656-.8069c.0094-.0979.019-.1958.0283-.2936l1.0073-.6236a.3483.3483 0 0 0-.1838-.5901zM12 15.8479a3.8479 3.8479 0 1 1 0-7.6958 3.8479 3.8479 0 0 1 0 7.6958z"/>
    </svg>`;
  }
  
  createPHPIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.01 10.207h-.944l-.515 2.648h.838c.556 0 .982-.122 1.292-.388.316-.27.514-.73.514-1.170 0-.64-.437-.95-1.185-.95v-.14zm-2.604 5.284H2.814l1.355-6.961h2.027c.728 0 1.292.152 1.701.483.41.332.615.796.615 1.393 0 .87-.296 1.573-.889 2.109-.593.536-1.407.804-2.442.804h-.015zM14.512 9.421c-.554-.658-1.453-.962-2.697-.962h-1.985v6.961h1.172v-2.904h.811c1.027 0 1.836-.213 2.426-.64.59-.427.885-1.039.885-1.836 0-.813-.205-1.461-.612-1.944zm-2.378 2.32h-.811V10.42h.811c.458 0 .797.118 1.017.355.22.237.33.578.33.994 0 .803-.449 1.205-1.347 1.205zm7.049-1.012c.728 0 1.292.152 1.701.483.41.332.615.796.615 1.393 0 .87-.296 1.573-.889 2.109-.593.536-1.407.804-2.442.804h-.015l-.515 2.648h-1.172l1.355-6.961h1.362zm-.944 1.227c-.556 0-.982.122-1.292.388-.316.27-.514.73-.514 1.17 0 .64.437.95 1.185.95h.838l.515-2.648h-.732z"/>
    </svg>`;
  }
  
  createRubyIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.156.083c3.033.525 3.893 2.598 3.829 4.77L24 4.822 22.635 22.71 4.89 24 2.313.28l17.843-.197zM2.328 18.787l18.542-1.735L19.72 3.35 2.313 1.985l.015 16.802zm15.931-9.604l-3.99 7.44-6.625-3.113-3.067-5.734 4.056-.22 4.238 3.015 5.388-1.388z"/>
    </svg>`;
  }
  
  createSwiftIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.508 0c-.287 0-.573.06-.84.16-.733.28-1.24.92-1.24 1.68v20.32c0 .76.507 1.4 1.24 1.68.267.1.553.16.84.16.286 0 .573-.06.84-.16.732-.28 1.24-.92 1.24-1.68V1.84c0-.76-.508-1.4-1.24-1.68C8.08.06 7.794 0 7.508 0zm8.984 0c-.287 0-.573.06-.84.16-.733.28-1.24.92-1.24 1.68v20.32c0 .76.507 1.4 1.24 1.68.267.1.553.16.84.16.286 0 .573-.06.84-.16.732-.28 1.24-.92 1.24-1.68V1.84c0-.76-.508-1.4-1.24-1.68C17.065.06 16.78 0 16.492 0z"/>
    </svg>`;
  }
  
  createKotlinIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 24H0V0h24L12 12 24 24z"/>
    </svg>`;
  }
  createShellIcon() { return this.createBashIcon(); }
  createBashIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.038 4.9l-7.577 7.181 7.577 7.181-1.038.954-8.615-8.135L0 20.216V3.784l11.385 8.135L21.038 3.865z"/>
    </svg>`;
  }
  createPowerShellIcon() { return this.createBashIcon(); }
  createCMDIcon() { return this.createBashIcon(); }
  createYAMLIcon() { return this.createDefaultIcon(); }
  createXMLIcon() { return this.createHTMLIcon(); }
  createSQLIcon() { return this.createDefaultIcon(); }
  createMarkdownIcon() {
    return `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.269 19.385H1.731a1.73 1.73 0 0 1-1.731-1.73V6.345a1.73 1.73 0 0 1 1.731-1.73h20.538A1.73 1.73 0 0 1 24 6.345v11.308a1.73 1.73 0 0 1-1.731 1.731zM5.769 15.923v-4.5l2.308 2.885 2.307-2.885v4.5h2.308V8.078H10.38l-2.307 2.885L5.77 8.078H3.46v7.847zM21.232 12h-2.309V8.077h-2.307V12h-2.308l3.461 3.846z"/>
    </svg>`;
  }
  createJSONIcon() { return this.createDefaultIcon(); }
}

// Initialize when DOM is ready
new CodeBlockEnhancer();