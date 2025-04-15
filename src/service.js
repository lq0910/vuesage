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
  async analyze(params) {
    const { component, platform = 'cursor' } = params;
    const result = await this.analyzer.analyze(component);
    
    return {
      summary: {
        totalIssues: result.issues.length,
        categories: new Set(result.issues.map(issue => issue.type)).size,
        hasAutoFixableIssues: result.issues.some(issue => issue.fix),
        fixableIssuesCount: result.issues.filter(issue => issue.fix).length
      },
      issues: this.transformIssues(result.issues)
    };
  }

  /**
   * 修复Vue组件问题
   * @param {Object} params 请求参数
   * @returns {Object} 修复结果
   */
  async fix(component, issues) {
    const fixResult = await this.fixer.fix(component, issues);
    
    if (!fixResult.success) {
      return {
        success: false,
        error: fixResult.error,
        originalCode: component
      };
    }

    // 修复后重新分析，检查是否引入新问题
    const analysisResult = await this.analyzer.analyze(fixResult.code);
    
    return {
      success: true,
      code: fixResult.code,
      repairs: fixResult.repairs.map(repair => ({
        ...repair,
        location: repair.location || this.findRepairLocation(component, fixResult.code, repair)
      })),
      verification: {
        remainingIssues: analysisResult.issues.length,
        newIssuesIntroduced: this.findNewIssues(analysisResult.issues, analysisResult.issues),
        qualityScore: this.calculateQualityScore(analysisResult)
      }
    };
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
        severity: issue.severity || 'warning',
        message: issue.message,
        line: issue.line,
        column: issue.column,
        autofix: issue.fix ? {
          type: issue.fix,
          description: this.getFixDescription(issue.fix),
          safe: this.isFixSafe(issue.fix)
        } : null
      });
    });

    return Object.values(categories);
  }

  /**
   * 查找修复位置
   * @param {string} oldCode 原始代码
   * @param {string} newCode 修复后的代码
   * @param {Object} repair 修复信息
   * @returns {Object} 位置信息
   */
  findRepairLocation(oldCode, newCode, repair) {
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    const changes = [];
    
    let i = 0, j = 0;
    while (i < oldLines.length && j < newLines.length) {
      if (oldLines[i] !== newLines[j]) {
        changes.push({
          type: 'change',
          oldStart: i + 1,
          oldEnd: i + 1,
          newStart: j + 1,
          newEnd: j + 1,
          oldContent: oldLines[i],
          newContent: newLines[j]
        });
      }
      i++;
      j++;
    }
    
    return changes;
  }

  /**
   * 查找新引入的问题
   * @param {Array} oldIssues 原始问题列表
   * @param {Array} newIssues 新问题列表
   * @returns {Array} 新引入的问题
   */
  findNewIssues(oldIssues, newIssues) {
    return newIssues.filter(newIssue => 
      !oldIssues.some(oldIssue => 
        oldIssue.message === newIssue.message && 
        oldIssue.type === newIssue.type
      )
    );
  }

  /**
   * 计算代码质量分数
   * @param {Object} analysis 分析结果
   * @returns {number} 质量分数 (0-100)
   */
  calculateQualityScore(analysis) {
    const weights = {
      error: 10,
      warning: 5,
      style: 2
    };

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let score = 100;

    analysis.issues.forEach(issue => {
      score -= (weights[issue.severity] || weights.warning);
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 获取问题类型的显示名称
   * @param {string} type 问题类型
   * @returns {string} 显示名称
   */
  getCategoryName(type) {
    const names = {
      error: '错误',
      warning: '警告',
      template: '模板相关',
      script: '脚本相关',
      style: '样式相关',
      general: '通用问题',
      performance: '性能相关',
      accessibility: '可访问性',
      bestPractices: '最佳实践'
    };
    return names[type] || type;
  }

  /**
   * 获取修复描述
   * @param {string} fixType 修复类型
   * @returns {string} 修复描述
   */
  getFixDescription(fixType) {
    const descriptions = {
      'addVForKey': '添加 v-for 的 :key 绑定',
      'addComponentName': '添加组件名称',
      'addPropsType': '添加 props 类型定义',
      'addPropsDefault': '添加 props 默认值',
      'addScopedStyle': '添加 scoped 样式',
      'formatLongLine': '格式化过长的代码行',
      'updateLifecycle': '更新生命周期方法名称',
      'refactorAsyncMount': '重构异步 mounted 方法',
      'splitMethod': '拆分过长方法',
      'extractComponent': '提取子组件',
      'optimizeComputed': '优化计算属性',
      'addErrorHandler': '添加错误处理'
    };
    return descriptions[fixType] || fixType;
  }

  /**
   * 判断修复是否安全
   * @param {string} fixType 修复类型
   * @returns {boolean} 是否安全
   */
  isFixSafe(fixType) {
    const safeFixes = [
      'addVForKey',
      'addComponentName',
      'addPropsType',
      'addScopedStyle',
      'formatLongLine'
    ];
    return safeFixes.includes(fixType);
  }

  /**
   * 生成代码质量报告
   * @param {Object} analysis 分析结果
   * @param {Object} options 报告选项
   * @returns {Object} 报告内容
   */
  generateReport(analysis, options = {}) {
    const {
      format = 'json',
      includeSource = false,
      timestamp = new Date().toISOString()
    } = options;

    const report = {
      timestamp,
      summary: {
        totalIssues: analysis.summary.totalIssues,
        categories: analysis.summary.categories,
        fixableIssues: analysis.summary.fixableIssuesCount,
        qualityScore: this.calculateQualityScore(analysis)
      },
      issues: analysis.issues,
      recommendations: this.generateRecommendations(analysis)
    };

    if (includeSource) {
      report.source = analysis.source;
    }

    return format === 'json' ? JSON.stringify(report, null, 2) : report;
  }

  /**
   * 生成改进建议
   * @param {Object} analysis 分析结果
   * @returns {Array} 建议列表
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    const issueTypes = new Set();

    analysis.issues.forEach(category => {
      category.issues.forEach(issue => {
        issueTypes.add(issue.type);
      });
    });

    // 根据问题类型生成建议
    if (issueTypes.has('performance')) {
      recommendations.push({
        category: '性能优化',
        suggestions: [
          '考虑使用虚拟滚动处理大列表',
          '优化计算属性的复杂度',
          '减少不必要的数据监听'
        ]
      });
    }

    if (issueTypes.has('complexity')) {
      recommendations.push({
        category: '代码复杂度',
        suggestions: [
          '将复杂组件拆分为更小的组件',
          '提取重复逻辑到 mixins 或 composables',
          '使用更多的计算属性替代复杂的模板表达式'
        ]
      });
    }

    if (issueTypes.has('accessibility')) {
      recommendations.push({
        category: '可访问性',
        suggestions: [
          '添加适当的 ARIA 属性',
          '确保所有交互元素可以通过键盘访问',
          '提供足够的颜色对比度'
        ]
      });
    }

    return recommendations;
  }
} 