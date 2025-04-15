#!/usr/bin/env node
'use strict';

function getAugmentedNamespace(n) {
	if (n.__esModule) return n;
	var a = Object.defineProperty({}, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var server = {};

/**
 * 检查是否为有效的Vue组件代码
 * @param {string} code Vue组件代码
 * @returns {boolean} 是否有效
 */
function isValidVueComponent(code) {
  try {
    // 检查基本结构
    const hasTemplate = /<template>[\s\S]*<\/template>/.test(code);
    const hasScript = /<script>[\s\S]*<\/script>/.test(code);
    return hasTemplate && hasScript;
  } catch (error) {
    return false;
  }
}

/**
 * 提取template部分的代码
 * @param {string} code Vue组件代码
 * @returns {string} template代码
 */
function extractTemplate(code) {
  const match = code.match(/<template>([\s\S]*)<\/template>/);
  return match ? match[1].trim() : '';
}

/**
 * 提取script部分的代码
 * @param {string} code Vue组件代码
 * @returns {string} script代码
 */
function extractScript(code) {
  const match = code.match(/<script>([\s\S]*)<\/script>/);
  return match ? match[1].trim() : '';
}

/**
 * 提取styles部分的代码
 * @param {string} code Vue组件代码
 * @returns {Array} styles代码数组
 */
function extractStyles(code) {
  const styles = [];
  const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/g;
  let match;
  while ((match = styleRegex.exec(code)) !== null) {
    const [fullMatch, content] = match;
    const scoped = fullMatch.includes('scoped');
    styles.push({
      content: content.trim(),
      scoped
    });
  }
  return styles;
}

/**
 * 合并Vue组件的各个部分
 * @param {string} template template代码
 * @param {string} script script代码
 * @param {Array} styles styles代码数组
 * @returns {string} 完整的Vue组件代码
 */
function mergeVueComponent(template, script, styles) {
  const templatePart = template ? `<template>\n${template}\n</template>\n\n` : '';
  const scriptPart = script ? `<script>\n${script}\n</script>\n\n` : '';
  const stylesPart = styles.map(style => `<style${style.scoped ? ' scoped' : ''}>\n${style.content}\n</style>`).join('\n\n');
  return `${templatePart}${scriptPart}${stylesPart}`.trim();
}

/**
 * Vue组件代码分析器
 */
class VueAnalyzer {
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
    const issues = [...this.analyzeTemplate(template), ...this.analyzeScript(script), ...this.analyzeStyles(styles), ...this.analyzeLifecycle(script), ...this.analyzeComplexity(script), ...this.analyzePerformance(template, script)];
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

/**
 * Vue组件代码修复器
 */
class VueFixer {
  constructor(config = {}) {
    this.config = {
      formatOptions: {
        indent: config.indent || 2,
        maxLineLength: config.maxLineLength || 80
      },
      ...config
    };
  }

  /**
   * 修复Vue组件代码
   * @param {string} component Vue组件代码
   * @param {Array} issues 需要修复的问题列表
   * @returns {Object} 修复结果
   */
  fix(component, issues) {
    if (!isValidVueComponent(component)) {
      return {
        success: false,
        error: '无效的Vue组件代码'
      };
    }
    let template = extractTemplate(component);
    let script = extractScript(component);
    let styles = extractStyles(component);
    const repairs = [];

    // 修复模板问题
    issues.filter(issue => issue.type === 'template').forEach(issue => {
      const repair = this.fixTemplate(template, issue);
      if (repair.success) {
        template = repair.code;
        repairs.push(repair);
      }
    });

    // 修复脚本问题
    issues.filter(issue => issue.type === 'script' || issue.type === 'props').forEach(issue => {
      const repair = this.fixScript(script, issue);
      if (repair.success) {
        script = repair.code;
        repairs.push(repair);
      }
    });

    // 修复样式问题
    issues.filter(issue => issue.type === 'style').forEach(issue => {
      const repair = this.fixStyles(styles, issue);
      if (repair.success) {
        styles = repair.styles;
        repairs.push(repair);
      }
    });

    // 合并修复后的代码
    const fixedCode = mergeVueComponent(template, script, styles);
    return {
      success: true,
      code: fixedCode,
      repairs
    };
  }
  fixTemplate(template, issue) {
    switch (issue.message) {
      case 'v-for指令必须绑定key':
        return this.addVForKey(template);
      case /第\d+行超过\d+个字符/.test(issue.message) && issue.message:
        return this.formatLongLine(template, issue);
      default:
        return {
          success: false,
          error: '不支持的修复类型'
        };
    }
  }
  fixScript(script, issue) {
    switch (issue.message) {
      case '组件缺少name属性':
        return this.addComponentName(script);
      case 'props必须定义类型':
        return this.addPropsType(script);
      case 'props建议设置默认值':
        return this.addPropsDefault(script);
      default:
        return {
          success: false,
          error: '不支持的修复类型'
        };
    }
  }
  fixStyles(styles, issue) {
    // 如果没有样式，添加一个空的scoped样式块
    if (!styles || styles.length === 0) {
      return {
        success: true,
        styles: [{
          content: '',
          scoped: true
        }],
        message: '添加了scoped样式块'
      };
    }
    return {
      success: false,
      error: '不支持的样式修复类型'
    };
  }
  addVForKey(template) {
    const vForRegex = /<([^>]+)v-for=["']([^"']+)["']([^>]*)>/g;
    let fixedTemplate = template;
    let match;
    let fixed = false;
    while ((match = vForRegex.exec(template)) !== null) {
      const [fullMatch, beforeVFor, vForExpr, afterVFor] = match;
      if (!afterVFor.includes(':key') && !afterVFor.includes('v-bind:key')) {
        const item = vForExpr.split(' in ')[0].trim();
        const newElement = `<${beforeVFor}v-for="${vForExpr}" :key="${item}"${afterVFor}>`;
        fixedTemplate = fixedTemplate.replace(fullMatch, newElement);
        fixed = true;
      }
    }
    return {
      success: fixed,
      code: fixedTemplate,
      message: fixed ? '添加了v-for的key绑定' : '无需修复v-for的key绑定'
    };
  }
  addComponentName(script) {
    const exportDefaultRegex = /export\s+default\s*{/;
    if (!script.includes('name:')) {
      const componentName = this.generateComponentName();
      const fixedScript = script.replace(exportDefaultRegex, `export default {\n  name: '${componentName}',`);
      return {
        success: true,
        code: fixedScript,
        message: `添加了组件名称: ${componentName}`
      };
    }
    return {
      success: false,
      message: '组件已有name属性'
    };
  }
  addPropsType(script) {
    const propsRegex = /props:\s*{([^}]+)}/;
    const match = script.match(propsRegex);
    if (match) {
      let propsContent = match[1];
      const propLines = propsContent.split(',').map(line => line.trim());
      const fixedProps = propLines.map(line => {
        if (line && !line.includes('type:')) {
          const propName = line.split(':')[0].trim();
          return `${propName}: { type: String }`;
        }
        return line;
      });
      const fixedScript = script.replace(propsRegex, `props: {\n    ${fixedProps.join(',\n    ')}\n  }`);
      return {
        success: true,
        code: fixedScript,
        message: '为props添加了类型定义'
      };
    }
    return {
      success: false,
      message: '未找到props定义'
    };
  }
  addPropsDefault(script) {
    const propsRegex = /props:\s*{([^}]+)}/;
    const match = script.match(propsRegex);
    if (match) {
      let propsContent = match[1];
      const propLines = propsContent.split(',').map(line => line.trim());
      const fixedProps = propLines.map(line => {
        if (line && !line.includes('default:')) {
          const [propName, propDef] = line.split(':').map(part => part.trim());
          if (propDef.includes('type:')) {
            const typeMatch = propDef.match(/type:\s*([^,}]+)/);
            if (typeMatch) {
              const type = typeMatch[1].trim();
              return `${propName}: { ${propDef}, default: ${this.getDefaultValueForType(type)} }`;
            }
          }
        }
        return line;
      });
      const fixedScript = script.replace(propsRegex, `props: {\n    ${fixedProps.join(',\n    ')}\n  }`);
      return {
        success: true,
        code: fixedScript,
        message: '为props添加了默认值'
      };
    }
    return {
      success: false,
      message: '未找到props定义'
    };
  }
  formatLongLine(template, issue) {
    // 简单的格式化策略：在属性之间换行
    const lines = template.split('\n');
    const lineNumber = parseInt(issue.message.match(/第(\d+)行/)[1]) - 1;
    const line = lines[lineNumber];
    if (line.length > 80) {
      const formattedLine = line.replace(/(\s+\w+="[^"]*")/g, '\n  $1');
      lines[lineNumber] = formattedLine;
      return {
        success: true,
        code: lines.join('\n'),
        message: '格式化了过长的行'
      };
    }
    return {
      success: false,
      message: '行长度正常，无需格式化'
    };
  }
  generateComponentName() {
    // 生成一个随机的组件名
    const prefix = 'Vue';
    const suffix = Math.random().toString(36).substring(2, 8);
    return prefix + suffix.charAt(0).toUpperCase() + suffix.slice(1);
  }
  getDefaultValueForType(type) {
    switch (type.trim()) {
      case 'String':
        return "''";
      case 'Number':
        return '0';
      case 'Boolean':
        return 'false';
      case 'Array':
        return '[]';
      case 'Object':
        return '{}';
      default:
        return 'null';
    }
  }

  /**
   * 更新生命周期方法
   */
  updateLifecycle(script, issue) {
    const {
      oldHook,
      newHook
    } = issue;
    const hookRegex = new RegExp(`${oldHook}\\s*:\\s*`, 'g');
    const fixedScript = script.replace(hookRegex, `${newHook}: `);
    return {
      success: true,
      code: fixedScript,
      message: `将 ${oldHook} 更新为 ${newHook}`
    };
  }

  /**
   * 重构异步的 mounted 方法
   */
  refactorAsyncMount(script) {
    const mountedRegex = /(async\s+)?mounted\s*\(\)\s*{([^}]*)}/;
    const match = script.match(mountedRegex);
    if (match) {
      const mountedBody = match[2];
      const fixedBody = mountedBody.replace(/await\s+([^;]+)/g, `this.$nextTick(async () => { await $1 })`);
      const fixedScript = script.replace(mountedRegex, `mounted() {${fixedBody}}`);
      return {
        success: true,
        code: fixedScript,
        message: '重构了 mounted 中的异步操作'
      };
    }
    return {
      success: false,
      message: '未找到需要重构的 mounted 方法'
    };
  }

  /**
   * 智能分析并优化计算属性
   */
  optimizeComputed(script) {
    const computedRegex = /computed:\s*{([^}]+)}/;
    const match = script.match(computedRegex);
    if (match) {
      const computedBody = match[1];
      const fixedBody = computedBody.replace(/(\w+)\s*\(\)\s*{([^}]+)}/g, (match, name, body) => {
        // 检查是否包含数组操作
        const hasArrayOps = body.includes('filter(') || body.includes('map(') || body.includes('reduce(');

        // 检查是否依赖其他计算属性
        const dependsOnComputed = this.checkComputedDependencies(body, computedBody);

        // 检查是否有复杂条件判断
        const hasComplexConditions = (body.match(/if|else|switch|case/g) || []).length > 2;

        // 根据情况优化
        if (hasArrayOps || dependsOnComputed || hasComplexConditions) {
          // 使用缓存
          const optimizedBody = this.optimizeComputedBody(body);
          return `${name}: {
      cache: true,
      get() {${optimizedBody}},
      // 添加依赖追踪
      dependencies: [${this.extractDependencies(body)}]
    }`;
        }
        return match;
      });
      const fixedScript = script.replace(computedRegex, `computed: {${fixedBody}}`);
      return {
        success: true,
        code: fixedScript,
        message: '优化了计算属性的性能'
      };
    }
    return {
      success: false,
      message: '未找到需要优化的计算属性'
    };
  }

  /**
   * 优化计算属性的实现
   */
  optimizeComputedBody(body) {
    // 提取数组操作链
    const chainMatch = body.match(/(\w+)\.(filter|map|reduce).*?(?=;|\}|$)/g);
    if (chainMatch) {
      // 优化数组操作链
      const optimized = chainMatch.map(chain => {
        // 将多个操作合并为一个循环
        if (chain.includes('.filter(') && chain.includes('.map(')) {
          return this.combineArrayOperations(chain);
        }
        // 添加长度检查以提前返回
        if (chain.includes('.filter(')) {
          return `const arr = ${chain.split('.')[0]};
      if (!arr || arr.length === 0) return [];
      ${chain}`;
        }
        return chain;
      });
      return optimized.join('\n');
    }
    return body;
  }

  /**
   * 合并数组操作
   */
  combineArrayOperations(chain) {
    const parts = chain.split('.');
    const array = parts[0];
    const operations = parts.slice(1);

    // 提取 filter 和 map 的条件
    const filterCondition = operations.find(op => op.includes('filter('))?.match(/filter\((.*?)\)/)[1];
    const mapTransform = operations.find(op => op.includes('map('))?.match(/map\((.*?)\)/)[1];

    // 合并为单次遍历
    return `${array}.reduce((acc, item) => {
      if (${filterCondition}) {
        acc.push(${mapTransform});
      }
      return acc;
    }, [])`;
  }

  /**
   * 检查计算属性的依赖关系
   */
  checkComputedDependencies(body, allComputed) {
    const computedProps = allComputed.match(/\w+\s*\(\)/g) || [];
    return computedProps.some(prop => body.includes(prop.replace('()', '')));
  }

  /**
   * 提取计算属性的依赖
   */
  extractDependencies(body) {
    const deps = new Set();

    // 提取 this. 引用
    const thisRefs = body.match(/this\.(\w+)/g) || [];
    thisRefs.forEach(ref => {
      deps.add(`'${ref.replace('this.', '')}'`);
    });

    // 提取 props 引用
    const propsRefs = body.match(/props\.(\w+)/g) || [];
    propsRefs.forEach(ref => {
      deps.add(`'${ref.replace('props.', '')}'`);
    });
    return Array.from(deps).join(', ');
  }

  /**
   * 智能优化 v-if 和 v-show 的使用
   */
  optimizeToggle(template) {
    // 分析条件的复杂度和使用频率
    const conditions = new Map();
    const vIfRegex = /v-if="([^"]+)"/g;
    let match;
    while ((match = vIfRegex.exec(template)) !== null) {
      const condition = match[1];
      conditions.set(condition, {
        complexity: this.analyzeConditionComplexity(condition),
        frequency: this.estimateToggleFrequency(condition)
      });
    }

    // 根据分析结果优化
    let fixedTemplate = template;
    conditions.forEach((analysis, condition) => {
      if (analysis.complexity < 3 && analysis.frequency > 0.7) {
        // 频繁切换且条件简单的使用 v-show
        fixedTemplate = fixedTemplate.replace(new RegExp(`v-if="${condition}"`, 'g'), `v-show="${condition}"`);
      }
    });
    return {
      success: true,
      code: fixedTemplate,
      message: '智能优化了条件渲染指令的使用'
    };
  }

  /**
   * 分析条件的复杂度
   */
  analyzeConditionComplexity(condition) {
    let complexity = 0;

    // 逻辑运算符增加复杂度
    complexity += (condition.match(/&&|\|\|/g) || []).length;

    // 函数调用增加复杂度
    complexity += (condition.match(/\w+\(/g) || []).length;

    // 三元运算符增加复杂度
    complexity += (condition.match(/\?/g) || []).length * 2;
    return complexity;
  }

  /**
   * 估计切换频率
   */
  estimateToggleFrequency(condition) {
    // 基于条件表达式估计切换频率
    if (condition.includes('loading')) return 0.9;
    if (condition.includes('visible') || condition.includes('show')) return 0.8;
    if (condition.includes('active') || condition.includes('selected')) return 0.7;
    if (condition.includes('error') || condition.includes('valid')) return 0.5;
    return 0.3;
  }

  /**
   * 智能拆分方法
   */
  splitMethod(script, issue) {
    const methodRegex = /(\w+)\s*\([^)]*\)\s*{([^}]*)}/;
    const match = script.match(methodRegex);
    if (match) {
      const [fullMatch, methodName, methodBody] = match;
      const lines = methodBody.split('\n');
      if (lines.length > this.config.formatOptions.maxLineLength) {
        // 分析方法的逻辑结构
        const blocks = this.analyzeMethodBlocks(methodBody);

        // 根据逻辑块拆分方法
        const {
          mainMethod,
          helperMethods
        } = this.splitMethodByBlocks(methodName, blocks);

        // 替换原方法
        const fixedScript = script.replace(fullMatch, `${mainMethod}\n${helperMethods.join('\n')}`);
        return {
          success: true,
          code: fixedScript,
          message: `将 ${methodName} 方法智能拆分为多个方法`
        };
      }
    }
    return {
      success: false,
      message: '未找到需要拆分的方法'
    };
  }

  /**
   * 分析方法的逻辑块
   */
  analyzeMethodBlocks(methodBody) {
    const blocks = [];
    let currentBlock = {
      lines: [],
      type: 'unknown',
      complexity: 0
    };
    const lines = methodBody.split('\n');
    lines.forEach(line => {
      // 识别逻辑块的类型
      if (line.includes('if') || line.includes('switch')) {
        if (currentBlock.lines.length > 0) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          lines: [line],
          type: 'condition',
          complexity: 1
        };
      } else if (line.includes('for') || line.includes('while')) {
        if (currentBlock.lines.length > 0) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          lines: [line],
          type: 'loop',
          complexity: 2
        };
      } else if (line.includes('try') || line.includes('catch')) {
        if (currentBlock.lines.length > 0) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          lines: [line],
          type: 'error_handling',
          complexity: 1
        };
      } else {
        currentBlock.lines.push(line);
        // 更新块的复杂度
        if (line.includes('&&') || line.includes('||')) {
          currentBlock.complexity++;
        }
      }
    });
    if (currentBlock.lines.length > 0) {
      blocks.push(currentBlock);
    }
    return blocks;
  }

  /**
   * 根据逻辑块拆分方法
   */
  splitMethodByBlocks(methodName, blocks) {
    const helperMethods = [];
    let mainMethodLines = [];
    blocks.forEach((block, index) => {
      if (block.complexity > 1 || block.lines.length > 5) {
        // 创建辅助方法
        const helperName = `${methodName}${this.getHelperSuffix(block.type)}${index + 1}`;
        const helperMethod = `
  ${helperName}() {
    ${block.lines.join('\n    ')}
  }`;
        helperMethods.push(helperMethod);
        mainMethodLines.push(`    this.${helperName}();`);
      } else {
        mainMethodLines.push(...block.lines);
      }
    });
    const mainMethod = `
  ${methodName}() {
    ${mainMethodLines.join('\n    ')}
  }`;
    return {
      mainMethod,
      helperMethods
    };
  }

  /**
   * 获取辅助方法的后缀
   */
  getHelperSuffix(blockType) {
    switch (blockType) {
      case 'condition':
        return 'Condition';
      case 'loop':
        return 'Process';
      case 'error_handling':
        return 'ErrorHandler';
      default:
        return 'Helper';
    }
  }

  /**
   * 提取组件
   */
  extractComponent(template, issue) {
    const componentName = this.generateComponentName();
    const templateRegex = /<template>([\s\S]*)<\/template>/;
    const match = template.match(templateRegex);
    if (match) {
      const templateContent = match[1];
      // 找到嵌套最深的部分
      const deepestNesting = this.findDeepestNesting(templateContent);
      if (deepestNesting) {
        // 创建新组件
        const newComponent = `
<template>
  ${deepestNesting}
</template>

<script>
export default {
  name: '${componentName}'
}
</script>`;

        // 在原模板中使用新组件
        const fixedTemplate = template.replace(deepestNesting, `<${componentName} />`);
        return {
          success: true,
          code: fixedTemplate,
          newComponent,
          message: `提取了嵌套组件到新文件 ${componentName}.vue`
        };
      }
    }
    return {
      success: false,
      message: '未找到需要提取的嵌套组件'
    };
  }

  /**
   * 查找最深嵌套的模板部分
   */
  findDeepestNesting(template) {
    const elements = template.match(/<[^>]+>([^<]*(?:(?!<\/).)*?)<\/[^>]+>/g) || [];
    let deepestElement = '';
    let maxDepth = 0;
    elements.forEach(element => {
      const depth = (element.match(/</g) || []).length;
      if (depth > maxDepth) {
        maxDepth = depth;
        deepestElement = element;
      }
    });
    return deepestElement;
  }
}

/**
 * VueSage MCP服务类
 */
class VueSageService$1 {
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
    const {
      component,
      platform = 'cursor'
    } = params;
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
    let i = 0,
      j = 0;
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
    return newIssues.filter(newIssue => !oldIssues.some(oldIssue => oldIssue.message === newIssue.message && oldIssue.type === newIssue.type));
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
    Object.values(weights).reduce((a, b) => a + b, 0);
    let score = 100;
    analysis.issues.forEach(issue => {
      score -= weights[issue.severity] || weights.warning;
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
    const safeFixes = ['addVForKey', 'addComponentName', 'addPropsType', 'addScopedStyle', 'formatLongLine'];
    return safeFixes.includes(fixType);
  }
}

var service$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	VueSageService: VueSageService$1
});

var require$$0 = /*@__PURE__*/getAugmentedNamespace(service$1);

const {
  VueSageService
} = require$$0;
const service = new VueSageService();

// 设置标准输入编码
process.stdin.setEncoding('utf-8');
let inputBuffer = '';

// 格式化输出
function formatOutput(data) {
  return JSON.stringify(data, null, 2);
}

// 错误处理
function handleError(error) {
  process.stderr.write(formatOutput({
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  }) + '\n');
}

// 监听标准输入数据
process.stdin.on('data', chunk => {
  inputBuffer += chunk;

  // 尝试解析完整的 JSON 请求
  try {
    const request = JSON.parse(inputBuffer);
    inputBuffer = ''; // 清空缓冲区

    handleRequest(request).catch(handleError);
  } catch (e) {
    // 如果解析失败，说明数据还不完整，继续等待
    if (e instanceof SyntaxError) {
      return;
    }
    // 其他错误则报告
    handleError(e);
    inputBuffer = '';
  }
});

// 处理请求
async function handleRequest(request) {
  const {
    command,
    params
  } = request;
  let response;

  // 请求日志
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${new Date().toISOString()}] 收到请求:`, command, params);
  }
  switch (command) {
    case 'analyze':
      response = await service.analyze(params);
      break;
    case 'fix':
      response = await service.fix(params.component, params.issues);
      break;
    default:
      throw new Error(`未知命令: ${command}`);
  }

  // 响应日志
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${new Date().toISOString()}] 响应:`, response);
  }
  process.stdout.write(formatOutput(response) + '\n');
}

// 错误处理
process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);

// 发送就绪信号
process.stdout.write(formatOutput({
  status: 'ready'
}) + '\n');

module.exports = server;
