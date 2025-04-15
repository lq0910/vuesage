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
      ...this.analyzePerformance(template, script),
      ...this.analyzeCompositionAPI(script),
      ...this.analyzeAccessibility(template),
      ...this.analyzeSecurity(template, script),
      ...this.analyzeI18n(template),
      ...this.analyzeCodeStyle(script)
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

  /**
   * 分析 Composition API 相关问题
   */
  analyzeCompositionAPI(script) {
    const issues = [];

    // 检查 setup 语法糖
    const isSetupSugar = script.includes('<script setup>');
    
    // 检查 ref 和 reactive 的使用
    const refCount = (script.match(/ref\(/g) || []).length;
    const reactiveCount = (script.match(/reactive\(/g) || []).length;
    
    if (refCount + reactiveCount > 10) {
      issues.push({
        type: 'warning',
        message: `响应式变量过多（${refCount + reactiveCount}个），建议合并相关状态`,
        fix: 'mergeState'
      });
    }

    // 检查 watch 和 watchEffect 的使用
    const watchCount = (script.match(/watch\(/g) || []).length;
    const watchEffectCount = (script.match(/watchEffect\(/g) || []).length;
    
    if (watchCount + watchEffectCount > 5) {
      issues.push({
        type: 'warning',
        message: `监听器过多（${watchCount + watchEffectCount}个），可能影响性能`,
        fix: 'optimizeWatchers'
      });
    }

    // 检查计算属性的复杂度
    const computedMatches = script.match(/computed\(\(\)\s*=>\s*{([^}]+)}/g) || [];
    computedMatches.forEach(match => {
      if (match.includes('filter(') || match.includes('map(') || match.includes('reduce(')) {
        issues.push({
          type: 'performance',
          message: '计算属性中包含复杂数组操作，建议使用缓存或提前处理',
          fix: 'optimizeComputed'
        });
      }
    });

    // 检查生命周期钩子的使用
    const lifecycleHooks = [
      'onMounted',
      'onBeforeMount',
      'onUpdated',
      'onBeforeUpdate',
      'onUnmounted',
      'onBeforeUnmount'
    ];
    
    lifecycleHooks.forEach(hook => {
      const count = (script.match(new RegExp(hook + '\\(', 'g')) || []).length;
      if (count > 1) {
        issues.push({
          type: 'warning',
          message: `多次使用了 ${hook} 钩子，建议合并相关逻辑`,
          fix: 'mergeLifecycleHooks'
        });
      }
    });

    // 检查 provide/inject 的使用
    if (script.includes('provide(') && !script.includes('/* @provide */')) {
      issues.push({
        type: 'style',
        message: '使用 provide 时建议添加 @provide 注释以提高可维护性',
        fix: 'addProvideComment'
      });
    }

    return issues;
  }

  /**
   * 分析可访问性问题
   */
  analyzeAccessibility(template) {
    const issues = [];

    // 检查图片的 alt 属性
    const imgRegex = /<img[^>]*>/g;
    const imgMatches = template.match(imgRegex) || [];
    imgMatches.forEach(img => {
      if (!img.includes('alt=')) {
        issues.push({
          type: 'accessibility',
          message: '图片缺少 alt 属性，影响屏幕阅读器用户',
          fix: 'addImgAlt'
        });
      }
    });

    // 检查按钮的 aria-label
    const buttonRegex = /<button[^>]*>[^<]*<\/button>/g;
    const buttonMatches = template.match(buttonRegex) || [];
    buttonMatches.forEach(button => {
      if (!button.includes('aria-label=') && !button.match(/>([^<]+)</)) {
        issues.push({
          type: 'accessibility',
          message: '按钮缺少文本内容或 aria-label，影响屏幕阅读器用户',
          fix: 'addAriaLabel'
        });
      }
    });

    // 检查表单控件的标签
    const inputRegex = /<input[^>]*>/g;
    const inputMatches = template.match(inputRegex) || [];
    inputMatches.forEach(input => {
      if (!input.includes('id=')) {
        issues.push({
          type: 'accessibility',
          message: '表单控件缺少 id，无法与 label 关联',
          fix: 'addInputId'
        });
      }
    });

    return issues;
  }

  /**
   * 分析安全性问题
   */
  analyzeSecurity(template, script) {
    const issues = [];

    // 检查 v-html 使用
    if (template.includes('v-html')) {
      issues.push({
        type: 'security',
        message: '使用 v-html 可能导致 XSS 攻击风险，建议使用 v-text 或插值语法',
        severity: 'error',
        fix: 'replaceVHtml'
      });
    }

    // 检查敏感信息存储
    const sensitivePatterns = [
      'password',
      'token',
      'secret',
      'api_key',
      'apikey'
    ];
    
    sensitivePatterns.forEach(pattern => {
      const regex = new RegExp(`${pattern}\\s*=\\s*["'][^"']*["']`, 'i');
      if (script.match(regex)) {
        issues.push({
          type: 'security',
          message: `检测到可能的敏感信息硬编码（${pattern}），建议使用环境变量`,
          severity: 'error',
          fix: 'useEnvVariable'
        });
      }
    });

    return issues;
  }

  /**
   * 分析国际化问题
   */
  analyzeI18n(template) {
    const issues = [];

    // 检查硬编码的文本
    const textRegex = />([^<{}]+)</g;
    const textMatches = template.match(textRegex) || [];
    textMatches.forEach(match => {
      const text = match.replace(/[><]/g, '').trim();
      if (text.length > 0 && !/^\s*{{\s*[\w.]+\s*}}\s*$/.test(text)) {
        issues.push({
          type: 'i18n',
          message: `检测到硬编码的文本："${text}"，建议使用国际化键值`,
          fix: 'extractI18nKey'
        });
      }
    });

    return issues;
  }

  /**
   * 分析代码风格
   */
  analyzeCodeStyle(script) {
    const issues = [];

    // 检查方法命名
    const methodRegex = /(\w+)\s*\([^)]*\)\s*{/g;
    let match;
    while ((match = methodRegex.exec(script)) !== null) {
      const methodName = match[1];
      if (!/^[a-z][a-zA-Z0-9]*$/.test(methodName)) {
        issues.push({
          type: 'style',
          message: `方法名 "${methodName}" 不符合驼峰命名规范`,
          fix: 'fixMethodName'
        });
      }
    }

    // 检查过长的方法链
    const chainRegex = /\.\w+\([^)]*\)\.\w+\([^)]*\)\.\w+\([^)]*\)/g;
    if (script.match(chainRegex)) {
      issues.push({
        type: 'style',
        message: '检测到过长的方法链，建议拆分为中间变量',
        fix: 'splitMethodChain'
      });
    }

    return issues;
  }
} 