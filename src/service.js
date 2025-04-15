import { VueAnalyzer } from './tools/analyzer.js';
import { VueFixer } from './tools/fixer.js';

/**
 * VueSage MCP服务类
 */
export class VueSageService {
  constructor() {
    this.analyzer = new VueAnalyzer();
    this.fixer = new VueFixer();
  }

  /**
   * 分析Vue组件
   * @param {Object} params 请求参数
   * @returns {Object} 分析结果
   */
  async analyze(component) {
    return await this.analyzer.analyze(component);
  }

  /**
   * 修复Vue组件问题
   * @param {Object} params 请求参数
   * @returns {Object} 修复结果
   */
  async fix(component, issues) {
    return await this.fixer.fix(component, issues);
  }

  /**
   * 转换问题列表为MCP格式
   * @param {Array} issues 原始问题列表
   * @returns {Array} MCP格式的问题列表
   */
  transformIssues(issues) {
    const categories = {};

    // 按类型分组
    issues.forEach(issue => {
      if (!categories[issue.type]) {
        categories[issue.type] = {
          category: this.getCategoryName(issue.type),
          issues: []
        };
      }

      categories[issue.type].issues.push({
        type: issue.type,
        severity: issue.severity,
        message: issue.message,
        autofix: issue.fix ? {
          type: issue.fix,
          description: this.getFixDescription(issue.fix)
        } : null
      });
    });

    return Object.values(categories);
  }

  /**
   * 获取问题类型的显示名称
   * @param {string} type 问题类型
   * @returns {string} 显示名称
   */
  getCategoryName(type) {
    const names = {
      template: '模板相关',
      script: '脚本相关',
      style: '样式相关',
      general: '通用问题'
    };
    return names[type] || type;
  }

  /**
   * 获取修复类型的显示名称
   * @param {string} type 修复类型
   * @returns {string} 显示名称
   */
  getFixType(issue) {
    if (issue.includes('v-for')) return 'template-vfor-key';
    if (issue.includes('样式')) return 'style-scoped';
    if (issue.includes('行长度')) return 'format-long-line';
    return 'general';
  }

  /**
   * 获取修复描述
   * @param {string} fixType 修复类型
   * @returns {string} 修复描述
   */
  getFixDescription(fixType) {
    const descriptions = {
      'add-v-for-key': '添加v-for的:key绑定',
      'add-scoped-style': '添加scoped样式',
      'format-long-line': '格式化过长的代码行',
      'add-style-section': '添加样式部分'
    };
    return descriptions[fixType] || fixType;
  }
} 