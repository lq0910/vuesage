const { VueSageService } = require('./service.js');

const service = new VueSageService();

// 设置标准输入编码
process.stdin.setEncoding('utf-8');
let inputBuffer = '';

// 格式化输出
function formatOutput(data) {
  return JSON.stringify(data, null, 2);
}

// 错误处理
function handleError(error) {
  process.stderr.write(formatOutput({
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  }) + '\n');
}

// 监听标准输入数据
process.stdin.on('data', (chunk) => {
  inputBuffer += chunk;
  
  // 尝试解析完整的 JSON 请求
  try {
    const request = JSON.parse(inputBuffer);
    inputBuffer = ''; // 清空缓冲区
    
    handleRequest(request).catch(handleError);
  } catch (e) {
    // 如果解析失败，说明数据还不完整，继续等待
    if (e instanceof SyntaxError) {
      return;
    }
    // 其他错误则报告
    handleError(e);
    inputBuffer = '';
  }
});

// 处理请求
async function handleRequest(request) {
  const { command, params } = request;
  let response;

  // 请求日志
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${new Date().toISOString()}] 收到请求:`, command, params);
  }

  switch (command) {
    case 'analyze':
      response = await service.analyze(params);
      break;
    case 'fix':
      response = await service.fix(params.component, params.issues);
      break;
    default:
      throw new Error(`未知命令: ${command}`);
  }

  // 响应日志
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${new Date().toISOString()}] 响应:`, response);
  }

  process.stdout.write(formatOutput(response) + '\n');
}

// 错误处理
process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);

// 发送就绪信号
process.stdout.write(formatOutput({ status: 'ready' }) + '\n'); 