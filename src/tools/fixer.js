import { isValidVueComponent, extractTemplate, extractScript, extractStyles, mergeVueComponent } from './index.js';

/**
 * Vue组件代码修复器
 */
export class VueFixer {
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
      const fixedScript = script.replace(
        exportDefaultRegex,
        `export default {\n  name: '${componentName}',`
      );
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
      const fixedScript = script.replace(
        propsRegex,
        `props: {\n    ${fixedProps.join(',\n    ')}\n  }`
      );
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
      const fixedScript = script.replace(
        propsRegex,
        `props: {\n    ${fixedProps.join(',\n    ')}\n  }`
      );
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
    const { oldHook, newHook } = issue;
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
      const fixedBody = mountedBody.replace(
        /await\s+([^;]+)/g,
        `this.$nextTick(async () => { await $1 })`
      );
      
      const fixedScript = script.replace(
        mountedRegex,
        `mounted() {${fixedBody}}`
      );
      
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
      const fixedBody = computedBody.replace(
        /(\w+)\s*\(\)\s*{([^}]+)}/g,
        (match, name, body) => {
          // 检查是否包含数组操作
          const hasArrayOps = body.includes('filter(') || 
                            body.includes('map(') || 
                            body.includes('reduce(');
          
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
        }
      );
      
      const fixedScript = script.replace(
        computedRegex,
        `computed: {${fixedBody}}`
      );
      
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
    const filterCondition = operations.find(op => op.includes('filter('))
      ?.match(/filter\((.*?)\)/)[1];
    const mapTransform = operations.find(op => op.includes('map('))
      ?.match(/map\((.*?)\)/)[1];
    
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
    return computedProps.some(prop => 
      body.includes(prop.replace('()', ''))
    );
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
        fixedTemplate = fixedTemplate.replace(
          new RegExp(`v-if="${condition}"`, 'g'),
          `v-show="${condition}"`
        );
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
        const { mainMethod, helperMethods } = this.splitMethodByBlocks(
          methodName,
          blocks
        );
        
        // 替换原方法
        const fixedScript = script.replace(
          fullMatch,
          `${mainMethod}\n${helperMethods.join('\n')}`
        );
        
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
    
    return { mainMethod, helperMethods };
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
        const fixedTemplate = template.replace(
          deepestNesting,
          `<${componentName} />`
        );
        
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