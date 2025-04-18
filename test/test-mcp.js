import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

class MCPClient {
  constructor() {
    this.process = spawn('node', ['service.js']);
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
          } else if (response.method === 'analyzeResult') {
            this.handleAnalyzeResult(response.result);
          } else if (response.method === 'fixResult') {
            this.handleFixResult(response.result);
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

  handleAnalyzeResult(result) {
    console.log('Analysis completed!');
    if (result.issues && result.issues.length > 0) {
      console.log('Found issues:', result.issues);
      this.askForAutoFix(result.issues);
    } else {
      this.askForReport();
    }
  }

  handleFixResult(result) {
    console.log('Fix completed!');
    if (result.success) {
      this.askForReport();
    }
  }

  askForAutoFix(issues) {
    // 在实际应用中，这里应该通过某种方式获取用户输入
    // 在测试中，我们模拟用户选择自动修复
    console.log('Would you like to auto-fix these issues? (Y/n)');
    this.fix(this.lastComponent, issues);
  }

  askForReport() {
    // 在实际应用中，这里应该通过某种方式获取用户输入
    // 在测试中，我们模拟用户选择生成报告
    console.log('Would you like to generate a report? (Y/n)');
    this.generateReport();
  }

  async generateReport() {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'generateReport',
      params: {
        formats: ['html', 'md'],
        outputDir: 'vuesage-reports'
      }
    };
    this.process.stdin.write(JSON.stringify(request) + '\n');
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
    this.lastComponent = component;
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'vuesage.analyze',
      params: {
        code: component,
        filename: 'TestButton.vue'
      }
    };
    this.process.stdin.write(JSON.stringify(request) + '\n');
  }

  async fix(component, issues) {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'vuesage.autoFix',
      params: {
        code: component,
        fixes: issues
      }
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
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  client.close();
}

runTest().catch(console.error); 