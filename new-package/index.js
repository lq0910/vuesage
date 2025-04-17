#!/usr/bin/env node

// 引入 MCP 服务
import './service.js';

// 确保 Ctrl+C 正常退出
process.on('SIGINT', () => {
  console.error('收到 SIGINT 信号，正在退出...');
  process.exit(0);
});

// 确保 Ctrl+Break 正常退出 (Windows)
process.on('SIGTERM', () => {
  console.error('收到 SIGTERM 信号，正在退出...');
  process.exit(0);
}); 