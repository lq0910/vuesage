#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 获取mcp-adapter.js的路径
const adapterPath = path.resolve(__dirname, '../mcp-adapter.js');

// 使用 stderr 输出日志
const log = (...args) => console.error('[VueSage MCP]', ...args);

// 检查文件是否存在
if (!fs.existsSync(adapterPath)) {
  log('Error: MCP adapter file not found:', adapterPath);
  process.exit(1);
}

// 使用node运行mcp-adapter.js
const child = spawn(process.execPath, [
  '--experimental-json-modules',
  '--experimental-modules',
  adapterPath
], {
  stdio: ['pipe', 'pipe', 'pipe'], // 使用 pipe 模式
  env: {
    ...process.env,
    NODE_NO_WARNINGS: '1',
    DEBUG: 'vuesage:*',
    VUESAGE_MCP: 'true' // 添加环境变量标识 MCP 模式
  }
});

// 错误处理
child.on('error', (error) => {
  log('Error starting MCP service:', error);
  process.exit(1);
});

// 建立管道连接
process.stdin.pipe(child.stdin);

// 处理子进程输出
child.stdout.on('data', (data) => {
  try {
    // 尝试解析 JSON
    JSON.parse(data.toString());
    // 如果成功解析，直接写入
    process.stdout.write(data);
  } catch (e) {
    // 如果不是有效的 JSON，输出到 stderr
    log('Non-JSON output:', data.toString());
  }
});

// 错误输出直接转发到 stderr
child.stderr.pipe(process.stderr);

// 进程信号处理
process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});

// 子进程退出处理
child.on('exit', (code, signal) => {
  if (code !== 0) {
    log(`Process exited with code ${code} and signal ${signal}`);
    process.exit(code);
  }
}); 