---
title: "Enhanced Code Blocks Test"
permalink: /test/code-blocks/
layout: single
---

# Enhanced Code Blocks Test Page

This page demonstrates the enhanced code block functionality with language icons, labels, and copy functionality.

## Python Example
```python
import torch
import torch.nn as nn

class SimpleNetwork(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super(SimpleNetwork, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_size, output_size)
    
    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return x
```

## JavaScript Example
```javascript
class CodeBlockEnhancer {
    constructor() {
        this.languages = new Map();
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.enhanceBlocks();
        });
    }
    
    enhanceBlocks() {
        const blocks = document.querySelectorAll('pre[class*="language-"]');
        blocks.forEach(block => this.enhanceBlock(block));
    }
}
```

## PowerShell Example
```powershell
# Install required packages
Install-Module -Name PowerShellGet -Force -AllowClobber
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Update PowerShell modules
Update-Module -Force
Get-Module -ListAvailable | Where-Object { $_.Name -like "*Azure*" }
```

## HTML Example
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Code Blocks</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main class="container">
        <h1>Welcome to Enhanced Code Blocks</h1>
        <div class="code-example">
            <pre><code>console.log("Hello, World!");</code></pre>
        </div>
    </main>
</body>
</html>
```

## CSS Example
```css
.code-block-enhanced {
    position: relative;
    margin: 1.5em 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    background: var(--code-bg);
}

.code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--code-header-bg);
    border-bottom: 1px solid var(--code-border);
}
```

## JSON Example
```json
{
  "name": "enhanced-code-blocks",
  "version": "1.0.0",
  "description": "Enhanced code blocks with language icons and copy functionality",
  "main": "code-blocks.js",
  "dependencies": {
    "highlight.js": "^11.0.0"
  },
  "keywords": ["code", "syntax", "highlighting", "copy"],
  "author": "Blog Author",
  "license": "MIT"
}
```

## Shell/Bash Example
```bash
#!/bin/bash

# System setup script
echo "Setting up development environment..."

# Install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget nodejs npm

# Configure git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Install Node.js packages
npm install -g yarn typescript @vue/cli

echo "Setup complete!"
```

## YAML Example
```yaml
name: Deploy Blog
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Ruby
      uses: ruby/setup-ruby@v1
      with:
        ruby-version: '3.1'
        bundler-cache: true
        
    - name: Build site
      run: bundle exec jekyll build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./_site
```

## Features Demonstrated

1. **Language Detection**: Automatically detects language from code fence
2. **Language Icons**: Shows appropriate icons for each language
3. **Language Labels**: Displays formatted language names
4. **Copy Functionality**: One-click copy with visual feedback
5. **Responsive Design**: Works on mobile and desktop
6. **Dark/Light Theme**: Adapts to system preferences
7. **Accessibility**: Keyboard navigation and screen reader support