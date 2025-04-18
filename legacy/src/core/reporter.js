const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

class Reporter {
  constructor(config) {
    this.config = config;
  }

  async generateReport({ format, data, outputPath }) {
    switch (format) {
      case 'html':
        return this.generateHtmlReport(data, outputPath);
      case 'md':
        return this.generateMarkdownReport(data, outputPath);
      case 'json':
        return this.generateJsonReport(data, outputPath);
      default:
        throw new Error(`不支持的报告格式: ${format}`);
    }
  }

  generateHtmlReport(data, outputPath) {
    const timestamp = dayjs().format(this.config.template.dateFormat);
    const template = this.getHtmlTemplate()
      .replace('${timestamp}', timestamp)
      .replace('${data.summary.totalFiles}', data.summary.totalFiles)
      .replace('${data.summary.averageScore}', data.summary.averageScore)
      .replace('${data.summary.totalIssues}', data.summary.totalIssues)
      .replace('${data.summary.totalWarnings}', data.summary.totalWarnings)
      .replace('${data.summary.passRate}', data.summary.passRate);

    fs.writeFileSync(outputPath, template, 'utf8');
  }

  generateMarkdownReport(data, outputPath) {
    const timestamp = dayjs().format(this.config.template.dateFormat);
    const template = this.getMarkdownTemplate()
      .replace('${timestamp}', timestamp)
      // 替换其他数据...
      .replace('${data.summary}', JSON.stringify(data.summary, null, 2));

    fs.writeFileSync(outputPath, template, 'utf8');
  }

  generateJsonReport(data, outputPath) {
    const report = {
      timestamp: dayjs().format(this.config.template.dateFormat),
      ...data
    };
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
  }

  getHtmlTemplate() {
    const templatePath = path.join(__dirname, '../templates/report.html');
    return fs.readFileSync(templatePath, 'utf8');
  }

  getMarkdownTemplate() {
    const templatePath = path.join(__dirname, '../templates/report.md');
    return fs.readFileSync(templatePath, 'utf8');
  }
}

module.exports = {
  generateReport: async (options) => {
    const reporter = new Reporter(options.config);
    return reporter.generateReport(options);
  }
}; 