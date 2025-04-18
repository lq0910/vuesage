import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Logger {
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.logFile = options.logFile || path.join(__dirname, '../logs/vuesage.log');
    
    // 确保日志目录存在
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    const logString = JSON.stringify(logEntry);

    // 写入文件
    fs.appendFileSync(this.logFile, logString + '\n');

    // 调试模式下同时输出到控制台
    if (this.debug) {
      console.log(`[${timestamp}] ${level}: ${message}`, data ? data : '');
    }
  }

  info(message, data = null) {
    this.log('INFO', message, data);
  }

  error(message, data = null) {
    this.log('ERROR', message, data);
  }

  debug(message, data = null) {
    if (this.debug) {
      this.log('DEBUG', message, data);
    }
  }
}

export default Logger; 