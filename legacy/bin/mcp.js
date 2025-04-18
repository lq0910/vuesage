#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 获取mcp-service.js的路径
const servicePath = path.resolve(__dirname, '../mcp-service.js');

// 使用 stderr 输出日志
const log = (...args) => console.error('[VueSage MCP]', ...args);

// 检查文件是否存在
if (!fs.existsSync(servicePath)) {
  log('Error: MCP service file not found:', servicePath);
  process.exit(1);
}

// 直接导入和运行服务
try {
  import(servicePath)
    .catch(error => {
      log('Error importing MCP service:', error);
      process.exit(1);
    });
} catch (error) {
  log('Error starting MCP service:', error);
  process.exit(1);
}

// 设置进程信号处理
process.on('SIGTERM', () => {
  log('Received SIGTERM signal, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('Received SIGINT signal, shutting down...');
  process.exit(0);
}); 