import { isValidVueComponent, extractTemplate, extractScript, extractStyles } from './index.js';

/**
 * Vue组件代码分析器
 */
export class VueAnalyzer {
  constructor(options = {}) {
    this.options = {
      maxLineLength: options.maxLineLength || 80,
      requireComponentName: options.requireComponentName !== false,
      requirePropsType: options.requirePropsType !== false,
      requirePropsDefault: options.requirePropsDefault !== false,
      requireVForKey: options.requireVForKey !== false,
      requireScopedStyle: options.requireScopedStyle !== false,
      maxMethodLines: options.maxMethodLines || 20,
      maxMethods: options.maxMethods || 10,
      maxNestingDepth: options.maxNestingDepth || 3,
      ...options
    };
  }

  /**
   * 分析Vue组件代码
   * @param {string} component Vue组件代码
   * @returns {Object} 分析结果
   */
  analyze(component) {
    if (!isValidVueComponent(component)) {
      return {
        success: false,
        summary: '无效的 Vue 组件代码',
        issues: [{
          type: 'error',
          message: '代码必须包含 <template> 和 <script> 标签'
        }]
      };
    }

    const template = extractTemplate(component);
    const script = extractScript(component);
    const styles = extractStyles(component);

    const issues = [
      ...this.analyzeTemplate(template),
      ...this.analyzeScript(script),
      ...this.analyzeStyles(styles),
      ...this.analyzeLifecycle(script),
      ...this.analyzeComplexity(script),
      ...this.analyzePerformance(template, script)
    ];

    return {
      success: issues.length === 0,
      summary: issues.length ? `发现 ${issues.length} 个问题` : '组件代码符合规范',
      issues
    };
  }

  /**
   * 分析template部分
   * @param {string} template 模板代码
   * @returns {Array} 问题列表
   */
  analyzeTemplate(template) {
    const issues = [];
    
    // 检查 v-for 指令是否有对应的 :key 绑定
    if (this.options.requireVForKey) {
      const vForRegex = /v-for\s*=\s*["'][^"']+["']/g;
      const keyRegex = /:key\s*=\s*["'][^"']+["']/g;
      
      const vForMatches = template.match(vForRegex) || [];
      const keyMatches = template.match(keyRegex) || [];
      
      if (vForMatches.length > keyMatches.length) {
        issues.push({
          type: 'warning',
          message: '使用 v-for 指令时必须绑定 key 属性',
          fix: 'addVForKey'
        });
      }
    }

    // 检查过长的代码行
    const lines = template.split('\n');
    lines.forEach((line, index) => {
      if (line.length > this.options.maxLineLength) {
        issues.push({
          type: 'style',
          message: `第 ${index + 1} 行超过 ${this.options.maxLineLength} 个字符`,
          fix: 'formatLongLine',
          line: index + 1
        });
      }
    });

    return issues;
  }

  /**
   * 分析script部分
   * @param {string} script 脚本代码
   * @returns {Array} 问题列表
   */
  analyzeScript(script) {
    const issues = [];

    // 检查组件是否有 name 属性
    if (this.options.requireComponentName) {
      if (!script.includes('name:') && !script.includes('name :')) {
        issues.push({
          type: 'warning',
          message: '组件缺少 name 属性',
          fix: 'addComponentName'
        });
      }
    }

    // 检查 props 是否有类型定义
    if (this.options.requirePropsType) {
      const propsMatch = script.match(/props\s*:\s*{([^}]+)}/);
      if (propsMatch) {
        const propsContent = propsMatch[1];
        const propLines = propsContent.split(',').map(line => line.trim());
        
        propLines.forEach(line => {
          if (line && !line.includes('type:')) {
            issues.push({
              type: 'warning',
              message: 'props 属性缺少类型定义',
              fix: 'addPropsType',
              prop: line.split(':')[0].trim()
            });
          }
        });
      }
    }

    // 检查 props 是否有默认值
    if (this.options.requirePropsDefault) {
      const propsMatch = script.match(/props\s*:\s*{([^}]+)}/);
      if (propsMatch) {
        const propsContent = propsMatch[1];
        const propLines = propsContent.split(',').map(line => line.trim());
        
        propLines.forEach(line => {
          if (line && !line.includes('default:')) {
            issues.push({
              type: 'warning',
              message: 'props 属性缺少默认值',
              fix: 'addPropsDefault',
              prop: line.split(':')[0].trim()
            });
          }
        });
      }
    }

    return issues;
  }

  /**
   * 检查styles部分
   * @param {Array} styles 样式代码数组
   * @returns {Array} 问题列表
   */
  analyzeStyles(styles) {
    const issues = [];

    // 检查是否使用 scoped 样式
    if (this.options.requireScopedStyle && styles.length > 0) {
      const hasScoped = styles.some(style => style.scoped);
      if (!hasScoped) {
        issues.push({
          type: 'warning',
          message: '建议使用 scoped 样式以避免样式污染',
          fix: 'addScopedStyle'
        });
      }
    }

    return issues;
  }

  /**
   * 分析生命周期方法
   */
  analyzeLifecycle(script) {
    const issues = [];
    
    // 检查废弃的生命周期方法
    const deprecatedHooks = {
      beforeDestroy: 'beforeUnmount',
      destroyed: 'unmounted'
    };

    Object.keys(deprecatedHooks).forEach(hook => {
      if (script.includes(hook + ':') || script.includes(hook + ' :')) {
        issues.push({
          type: 'warning',
          message: `建议使用 ${deprecatedHooks[hook]} 替代废弃的 ${hook} 生命周期方法`,
          fix: 'updateLifecycle',
          oldHook: hook,
          newHook: deprecatedHooks[hook]
        });
      }
    });

    // 检查生命周期方法中的异步操作
    const asyncInMountRegex = /async\s+mounted\s*\(\)/;
    if (asyncInMountRegex.test(script)) {
      issues.push({
        type: 'warning',
        message: '不建议在 mounted 中直接使用 async/await，可能导致组件渲染延迟',
        fix: 'refactorAsyncMount'
      });
    }

    return issues;
  }

  /**
   * 分析代码复杂度
   */
  analyzeComplexity(script) {
    const issues = [];

    // 检查方法行数
    const methodRegex = /\w+\s*\([^)]*\)\s*{([^}]*)}/g;
    let match;
    while ((match = methodRegex.exec(script)) !== null) {
      const methodBody = match[1];
      const lines = methodBody.split('\n').length;
      
      if (lines > this.options.maxMethodLines) {
        issues.push({
          type: 'warning',
          message: `方法过长（${lines}行），建议不超过${this.options.maxMethodLines}行`,
          fix: 'splitMethod'
        });
      }
    }

    // 检查方法总数
    const methodCount = (script.match(/\w+\s*\([^)]*\)\s*{/g) || []).length;
    if (methodCount > this.options.maxMethods) {
      issues.push({
        type: 'warning',
        message: `组件方法过多（${methodCount}个），建议不超过${this.options.maxMethods}个`,
        fix: 'extractMixin'
      });
    }

    // 检查模板嵌套深度
    const maxDepth = this.getTemplateMaxDepth(script);
    if (maxDepth > this.options.maxNestingDepth) {
      issues.push({
        type: 'warning',
        message: `模板嵌套深度过高（${maxDepth}层），建议不超过${this.options.maxNestingDepth}层`,
        fix: 'extractComponent'
      });
    }

    return issues;
  }

  /**
   * 分析性能相关问题
   */
  analyzePerformance(template, script) {
    const issues = [];

    // 检查大量v-if和v-show混用
    const vIfCount = (template.match(/v-if/g) || []).length;
    const vShowCount = (template.match(/v-show/g) || []).length;
    
    if (vIfCount > 3 && vShowCount > 3) {
      issues.push({
        type: 'performance',
        message: '过多混用 v-if 和 v-show 可能影响性能，建议统一使用一种方式',
        fix: 'optimizeToggle'
      });
    }

    // 检查计算属性中的复杂计算
    const computedRegex = /computed:\s*{([^}]+)}/;
    const computedMatch = script.match(computedRegex);
    if (computedMatch) {
      const computedBody = computedMatch[1];
      if (computedBody.includes('filter(') || computedBody.includes('map(') || computedBody.includes('reduce(')) {
        issues.push({
          type: 'performance',
          message: '计算属性中包含复杂数组操作，建议使用缓存或提前处理',
          fix: 'optimizeComputed'
        });
      }
    }

    // 检查大量的数据监听
    const watchCount = (script.match(/watch:/g) || []).length;
    if (watchCount > 5) {
      issues.push({
        type: 'performance',
        message: `组件包含大量的 watch（${watchCount}个），可能影响性能`,
        fix: 'optimizeWatch'
      });
    }

    return issues;
  }

  /**
   * 获取模板最大嵌套深度
   */
  getTemplateMaxDepth(template) {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (const char of template) {
      if (char === '<' && template[template.indexOf(char) + 1] !== '/') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '<' && template[template.indexOf(char) + 1] === '/') {
        currentDepth--;
      }
    }
    
    return maxDepth;
  }
} 