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
  path.join(__dirname, 'service.js'),
  path.join(distDir, 'service.js')
);

// 确保 bin 目录存在
ensureDir(path.join(distDir, 'bin'));

copyFile(
  path.join(__dirname, 'bin', 'vuesage-mcp.js'),
  path.join(distDir, 'bin', 'vuesage-mcp.js')
);

// 确保 templates 目录存在并复制模板文件
const templatesDir = path.join(distDir, 'templates');
ensureDir(templatesDir);

// 复制模板文件
['html', 'md'].forEach(format => {
  copyFile(
    path.join(__dirname, 'templates', `report.${format}`),
    path.join(templatesDir, `report.${format}`)
  );
});

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