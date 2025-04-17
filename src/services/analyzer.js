const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const prompts = require('prompts');
const { analyze } = require('../core/analyzer');
const { generateReport } = require('../core/reporter');
const { applyFixes } = require('../core/fixer');
const { loadConfig } = require('../utils/config');

class AnalyzerService {
  constructor(options = {}) {
    this.config = loadConfig();
    this.options = { ...this.config, ...options };
    this.analysisResults = null;
  }

  async analyzeComponents(files) {
    console.log('正在分析组件...');
    this.analysisResults = await analyze(files);
    
    // 显示分析结果摘要
    this.printSummary();

    // 询问是否自动修复
    if (this.config.fix.enabled && this.config.fix.askBeforeFix) {
      const shouldFix = await this.askForAutoFix();
      if (shouldFix) {
        await this.autoFix();
      }
    }

    // 询问是否生成报告
    if (this.config.report.enabled && this.config.report.askBeforeGenerate) {
      const shouldGenerate = await this.askForReportGeneration();
      if (shouldGenerate) {
        await this.generateReports();
      }
    }

    return this.analysisResults;
  }

  printSummary() {
    const { summary } = this.analysisResults;
    console.log('\n分析完成！');
    console.log('----------------------------------------');
    console.log(`总文件数: ${summary.totalFiles}`);
    console.log(`平均得分: ${summary.averageScore}分`);
    console.log(`问题数量: ${summary.totalIssues}`);
    console.log(`警告数量: ${summary.totalWarnings}`);
    console.log(`通过率: ${summary.passRate}`);
    console.log('----------------------------------------\n');
  }

  async askForAutoFix() {
    const response = await prompts({
      type: 'confirm',
      name: 'value',
      message: '是否要自动修复发现的问题？',
      initial: false
    });
    return response.value;
  }

  async askForReportGeneration() {
    const response = await prompts({
      type: 'confirm',
      name: 'value',
      message: '是否要生成分析报告？',
      initial: true
    });
    return response.value;
  }

  async autoFix() {
    console.log('正在应用修复...');
    const fixResults = await applyFixes(this.analysisResults, this.config.fix);
    console.log('修复完成！');
    return fixResults;
  }

  async generateReports() {
    console.log('正在生成报告...');
    
    const outputDir = this.config.report.outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = dayjs().format(this.config.report.template.dateFormat);
    const baseFilename = `vuesage-report-${timestamp.replace(/[: ]/g, '-')}`;

    for (const format of this.config.report.formats) {
      const outputPath = path.join(outputDir, `${baseFilename}.${format}`);
      await generateReport({
        format,
        data: this.analysisResults,
        outputPath,
        config: this.config.report
      });
      console.log(`已生成${format}格式报告：${outputPath}`);
    }

    console.log('报告生成完成！');
  }
}

module.exports = AnalyzerService; 