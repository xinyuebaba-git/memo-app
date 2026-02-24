#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 读取 Markdown 文件
const mdContent = fs.readFileSync(
  path.join(__dirname, '..', 'USER-GUIDE.md'),
  'utf-8'
);

// 简单的 Markdown 转 HTML
function mdToHtml(md) {
  let html = md;
  
  // 标题
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  
  // 代码块
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 粗体和斜体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 列表
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // 表格 (简单处理)
  html = html.replace(/^\|(.+)\|/gim, '<table><tr>$1</tr></table>');
  
  // 段落
  html = html.replace(/\n\n/g, '</p><p>');
  
  return html;
}

const htmlContent = mdToHtml(mdContent);

const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>备忘录系统 - 使用文档</title>
  <style>
    /* 使用与设计文档相同的样式 */
    :root {
      --primary-color: #667eea;
      --primary-dark: #764ba2;
      --text-color: #2d3748;
      --text-light: #4a5568;
      --bg-color: #f7fafc;
      --code-bg: #edf2f7;
      --border-color: #e2e8f0;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
      line-height: 1.8;
      color: var(--text-color);
      background: var(--bg-color);
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    header {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 40px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }
    
    header h1 { font-size: 32px; margin-bottom: 10px; }
    header .meta { font-size: 14px; opacity: 0.9; }
    header .meta span { margin-right: 20px; }
    
    section {
      background: white;
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      page-break-inside: avoid;
    }
    
    h1 { font-size: 28px; border-bottom: 3px solid var(--primary-color); padding-bottom: 10px; }
    h2 { font-size: 22px; border-left: 4px solid var(--primary-color); padding-left: 15px; margin-top: 30px; }
    h3 { font-size: 18px; color: var(--primary-color); }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    th, td {
      border: 1px solid var(--border-color);
      padding: 12px;
      text-align: left;
    }
    
    th {
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      color: white;
    }
    
    tr:nth-child(even) { background: var(--bg-color); }
    
    code {
      background: var(--code-bg);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 13px;
      color: #e53e3e;
    }
    
    pre {
      background: #1a202c;
      color: #e2e8f0;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 20px 0;
    }
    
    pre code { background: none; padding: 0; color: inherit; }
    
    .tip {
      background: #ebf8ff;
      border-left: 4px solid #4299e1;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    
    .warning {
      background: #fffaf0;
      border-left: 4px solid #ed8936;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    
    footer {
      text-align: center;
      padding: 30px;
      color: var(--text-light);
      border-top: 2px solid var(--border-color);
      margin-top: 40px;
    }
    
    @media print {
      body { background: white; padding: 20px; }
      header { background: white; color: black; box-shadow: none; border: 2px solid var(--primary-color); }
      section { box-shadow: none; break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header>
    <h1>📝 备忘录系统 - 使用文档</h1>
    <div class="meta">
      <span>📅 版本：1.0.0</span>
      <span>📆 最后更新：2026-02-24</span>
    </div>
  </header>
  
  <div class="content">
    ${htmlContent}
  </div>
  
  <footer>
    <p><strong>文档版本：</strong>1.0.0 | <strong>最后更新：</strong>2026-02-24</p>
    <p><strong>开发团队：</strong>OpenClaw 软件开发 Agent 团队</p>
  </footer>
</body>
</html>`;

fs.writeFileSync(
  path.join(__dirname, 'USER-GUIDE.html'),
  fullHtml
);

console.log('✅ USER-GUIDE.html 生成成功！');
