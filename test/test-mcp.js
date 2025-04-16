import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class MCPClient {
  constructor() {
    this.process = spawn('node', ['mcp-adapter.js']);
    this.ready = false;
    this.setupListeners();
  }

  setupListeners() {
    this.process.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      lines.forEach(line => {
        try {
          const response = JSON.parse(line);
          if (response.method === 'ready') {
            this.ready = true;
            console.log('Service is ready');
          } else {
            console.log('Received response:', JSON.stringify(response, null, 2));
          }
        } catch (e) {
          console.error('Failed to parse response:', line);
        }
      });
    });

    this.process.stderr.on('data', (data) => {
      console.error('Error:', data.toString());
    });
  }

  async waitForReady() {
    return new Promise((resolve) => {
      const check = () => {
        if (this.ready) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  async analyze(component) {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'analyze',
      params: { component }
    };
    this.process.stdin.write(JSON.stringify(request) + '\n');
  }

  async fix(component, issues) {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'fix',
      params: { component, issues }
    };
    this.process.stdin.write(JSON.stringify(request) + '\n');
  }

  close() {
    this.process.kill();
  }
}

async function runTest() {
  const client = new MCPClient();
  await client.waitForReady();

  // 读取测试组件
  const component = fs.readFileSync(path.join(process.cwd(), 'test/TestButton.vue'), 'utf-8');
  
  console.log('Analyzing component...');
  await client.analyze(component);

  // 等待一段时间以接收响应
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  client.close();
}

runTest().catch(console.error); 