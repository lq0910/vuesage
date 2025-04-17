// 发布脚本
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建必要的目录
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// dist 目录
const distDir = path.join(__dirname, 'dist');
ensureDir(distDir);

// 复制文件到目标目录
const copyFile = (src, dest) => {
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} to ${dest}`);
};

// 复制必要的文件
copyFile(
  path.join(__dirname, 'mcp-service.js'),
  path.join(distDir, 'mcp-service.js')
);

copyFile(
  path.join(__dirname, 'bin', 'vuesage-mcp.js'),
  path.join(distDir, 'bin', 'vuesage-mcp.js')
);

// 运行 npm publish
console.log('Running npm publish...');
exec('npm publish --ignore-scripts', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  console.log(`stdout: ${stdout}`);
  console.log('Published successfully!');
}); 