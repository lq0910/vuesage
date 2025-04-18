#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { VueSageService } from '../src/service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const service = new VueSageService();

program
  .version('1.1.6')
  .description('VueSage - Vue 代码质量分析和修复工具')
  .option('-c, --config <path>', '配置文件路径', '.vuesagerc.json')
  .option('-f, --fix', '自动修复问题', false)
  .option('-w, --watch', '监听文件变化', false)
  .option('-v, --verbose', '显示详细信息', false)
  .option('--init', '创建配置文件');

// 分析命令
program
  .command('analyze <file>')
  .description('分析 Vue 组件文件')
  .option('--report', '生成分析报告')
  .option('--report-format <format>', '报告格式 (json/html)', 'json')
  .option('--report-dir <dir>', '报告输出目录', './reports')
  .option('--include-source', '在报告中包含源代码')
  .action(async (file, options) => {
    try {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');
      const result = await service.analyze({ component: content });
      
      if (options.report) {
        const reportDir = path.resolve(process.cwd(), options.reportDir);
        if (!fs.existsSync(reportDir)) {
          fs.mkdirSync(reportDir, { recursive: true });
        }

        const reportOptions = {
          format: options.reportFormat,
          includeSource: options.includeSource,
          timestamp: new Date().toISOString()
        };

        const report = service.generateReport(result, reportOptions);
        const fileName = `${path.basename(file, '.vue')}-report.${options.reportFormat}`;
        const reportPath = path.join(reportDir, fileName);

        if (options.reportFormat === 'html') {
          // 生成 HTML 报告
          const htmlReport = generateHtmlReport(report);
          fs.writeFileSync(reportPath, htmlReport);
        } else {
          // 生成 JSON 报告
          fs.writeFileSync(reportPath, report);
        }

        console.log(`\n报告已生成: ${reportPath}`);
      }

      if (program.opts().verbose) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`\n文件: ${file}`);
        console.log(`发现 ${result.summary.totalIssues} 个问题，${result.summary.fixableIssuesCount} 个可自动修复`);
        
        result.issues.forEach(category => {
          console.log(`\n${category.category}:`);
          category.issues.forEach(issue => {
            const fixable = issue.autofix ? ' (可修复)' : '';
            console.log(`  - ${issue.message}${fixable}`);
          });
        });
      }
    } catch (error) {
      console.error('错误:', error.message);
      process.exit(1);
    }
  });

// 修复命令
program
  .command('fix <file>')
  .description('修复 Vue 组件文件中的问题')
  .option('--dry-run', '仅显示将要进行的修复，不实际修改文件')
  .action(async (file, options) => {
    try {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');
      
      // 先分析文件
      const analysis = await service.analyze({ component: content });
      const fixableIssues = [];
      
      analysis.issues.forEach(category => {
        category.issues.forEach(issue => {
          if (issue.autofix && issue.autofix.safe) {
            fixableIssues.push(issue.autofix.type);
          }
        });
      });
      
      if (fixableIssues.length === 0) {
        console.log('没有发现可以安全修复的问题');
        return;
      }
      
      console.log(`\n将修复以下问题:`);
      fixableIssues.forEach(type => {
        console.log(`  - ${service.getFixDescription(type)}`);
      });
      
      if (!options.dryRun) {
        const result = await service.fix(content, fixableIssues);
        if (result.success) {
          fs.writeFileSync(path.resolve(process.cwd(), file), result.code);
          console.log('\n✅ 修复完成');
          
          if (result.verification.newIssuesIntroduced.length > 0) {
            console.log('\n⚠️ 警告：修复过程引入了新的问题：');
            result.verification.newIssuesIntroduced.forEach(issue => {
              console.log(`  - ${issue.message}`);
            });
          }
          
          console.log(`\n代码质量评分: ${result.verification.qualityScore}/100`);
        } else {
          console.error('\n❌ 修复失败:', result.error);
        }
      }
    } catch (error) {
      console.error('错误:', error.message);
      process.exit(1);
    }
  });

// 监听命令
program
  .command('watch [directory]')
  .description('监听目录中的 Vue 文件变化')
  .action(async (directory = '.') => {
    try {
      const chokidar = await import('chokidar');
      const watcher = chokidar.watch('**/*.vue', {
        cwd: path.resolve(process.cwd(), directory),
        ignored: /node_modules/
      });
      
      console.log(`\n监听 ${directory} 目录中的 Vue 文件变化...`);
      
      watcher.on('change', async (file) => {
        console.log(`\n文件变化: ${file}`);
        const content = fs.readFileSync(path.resolve(process.cwd(), directory, file), 'utf-8');
        const result = await service.analyze({ component: content });
        
        console.log(`发现 ${result.summary.totalIssues} 个问题，${result.summary.fixableIssuesCount} 个可自动修复`);
        
        if (program.opts().fix) {
          // 自动修复
          const fixableIssues = [];
          result.issues.forEach(category => {
            category.issues.forEach(issue => {
              if (issue.autofix && issue.autofix.safe) {
                fixableIssues.push(issue.autofix.type);
              }
            });
          });
          
          if (fixableIssues.length > 0) {
            const fixResult = await service.fix(content, fixableIssues);
            if (fixResult.success) {
              fs.writeFileSync(path.resolve(process.cwd(), directory, file), fixResult.code);
              console.log('✅ 自动修复完成');
            }
          }
        }
      });
    } catch (error) {
      console.error('错误:', error.message);
      process.exit(1);
    }
  });

// 初始化配置文件
if (program.opts().init) {
  const configPath = path.resolve(process.cwd(), '.vuesagerc.json');
  if (fs.existsSync(configPath)) {
    console.error('配置文件已存在');
    process.exit(1);
  }
  
  const defaultConfig = {
    rules: {
      template: {
        maxLength: 80,
        requireKey: true,
        maxNestingDepth: 3,
        requireAlt: true,
        requireAriaLabel: true
      },
      script: {
        requireName: true,
        requirePropsType: true,
        requirePropsDefault: true,
        maxMethodLines: 20,
        maxMethods: 10,
        enforceEmits: true,
        preferOptionsApi: false
      },
      style: {
        enforceScoped: true,
        maxNestingDepth: 3,
        enforceClassNaming: true,
        preferRem: true
      }
    },
    fix: {
      safe: true,
      backup: true,
      ignoreFiles: [
        "dist/**/*",
        "node_modules/**/*"
      ]
    }
  };
  
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  console.log('已创建配置文件: .vuesagerc.json');
  process.exit(0);
}

program.parse(process.argv);

/**
 * 生成 HTML 报告
 * @param {Object} report 报告数据
 * @returns {string} HTML 内容
 */
function generateHtmlReport(report) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VueSage 代码质量报告</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-item {
      padding: 15px;
      border-radius: 6px;
      background: #f8f9fa;
    }
    .issues {
      margin-bottom: 30px;
    }
    .issue-category {
      margin-bottom: 20px;
    }
    .issue {
      padding: 10px;
      margin: 5px 0;
      border-left: 4px solid;
      background: #f8f9fa;
    }
    .issue.error { border-color: #dc3545; }
    .issue.warning { border-color: #ffc107; }
    .issue.info { border-color: #0dcaf0; }
    .recommendations {
      background: #e9ecef;
      padding: 20px;
      border-radius: 6px;
    }
    .timestamp {
      color: #6c757d;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>VueSage 代码质量报告</h1>
      <p class="timestamp">生成时间: ${report.timestamp}</p>
    </div>

    <div class="summary">
      <div class="summary-item">
        <h3>总问题数</h3>
        <p>${report.summary.totalIssues}</p>
      </div>
      <div class="summary-item">
        <h3>问题类别数</h3>
        <p>${report.summary.categories}</p>
      </div>
      <div class="summary-item">
        <h3>可修复问题数</h3>
        <p>${report.summary.fixableIssues}</p>
      </div>
      <div class="summary-item">
        <h3>代码质量评分</h3>
        <p>${report.summary.qualityScore}/100</p>
      </div>
    </div>

    <div class="issues">
      <h2>问题详情</h2>
      ${report.issues.map(category => `
        <div class="issue-category">
          <h3>${category.category}</h3>
          ${category.issues.map(issue => `
            <div class="issue ${issue.severity}">
              <p>${issue.message}</p>
              ${issue.autofix ? `<small>✓ 可自动修复</small>` : ''}
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>

    <div class="recommendations">
      <h2>改进建议</h2>
      ${report.recommendations.map(rec => `
        <div class="recommendation">
          <h3>${rec.category}</h3>
          <ul>
            ${rec.suggestions.map(sug => `<li>${sug}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;
} 