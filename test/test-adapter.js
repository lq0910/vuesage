import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';

const testAdapter = async () => {
  const input = readFileSync('./test/test-input.json', 'utf-8');
  
  const child = spawn('node', ['mcp-adapter.js']);
  
  child.stdout.on('data', (data) => {
    console.log('Received:', data.toString());
  });
  
  child.stderr.on('data', (data) => {
    console.error('Error:', data.toString());
  });
  
  child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
  });
  
  // 等待服务就绪信号
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 发送测试输入
  child.stdin.write(input + '\n');
};

testAdapter().catch(console.error); 