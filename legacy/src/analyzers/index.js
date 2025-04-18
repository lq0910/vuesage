const { parse } = require('@vue/compiler-sfc');
const { parse: parseESLint } = require('vue-eslint-parser');
const _ = require('lodash');

// 组件命名规则检查
function checkComponentNaming(descriptor) {
  const issues = [];
  const componentName = descriptor.script?.content.match(/name:\s*['"]([^'"]+)['"]/)?.[1];
  
  if (!componentName) {
    issues.push({
      type: 'naming',
      severity: 'warning',
      message: 'Component should have a name property',
      autofix: {
        type: 'addComponentName',
        data: { suggestedName: 'DefaultComponent' }
      }
    });
  } else if (!componentName.match(/^[A-Z][a-zA-Z0-9]+$/)) {
    issues.push({
      type: 'naming',
      severity: 'warning',
      message: 'Component name should be PascalCase',
      autofix: {
        type: 'renameComponent',
        data: { currentName: componentName, suggestedName: _.upperFirst(_.camelCase(componentName)) }
      }
    });
  }
  return issues;
}

// Props 验证检查
function checkPropsValidation(descriptor) {
  const issues = [];
  const propsMatch = descriptor.script?.content.match(/props:\s*{([^}]+)}/s);
  
  if (propsMatch) {
    const propsContent = propsMatch[1];
    if (!propsContent.includes('type:') || !propsContent.includes('required:')) {
      issues.push({
        type: 'props',
        severity: 'warning',
        message: 'Props should have type and required validation',
        autofix: {
          type: 'addPropsValidation',
          data: { props: propsContent }
        }
      });
    }
  }
  return issues;
}

// 生命周期钩子检查
function checkLifecycleHooks(descriptor) {
  const issues = [];
  const script = descriptor.script?.content || '';
  
  const deprecatedHooks = {
    beforeDestroy: 'beforeUnmount',
    destroyed: 'unmounted'
  };
  
  Object.entries(deprecatedHooks).forEach(([oldHook, newHook]) => {
    if (script.includes(oldHook)) {
      issues.push({
        type: 'lifecycle',
        severity: 'error',
        message: `Deprecated lifecycle hook "${oldHook}" found, use "${newHook}" instead`,
        autofix: {
          type: 'replaceLifecycleHook',
          data: { oldHook, newHook }
        }
      });
    }
  });
  
  return issues;
}

// 模板性能优化检查
function checkTemplateOptimization(descriptor) {
  const issues = [];
  const template = descriptor.template?.content || '';
  
  // 检查v-for和v-if同时使用
  const vForIfPattern = /<[^>]+v-for[^>]+v-if[^>]+>/g;
  if (template.match(vForIfPattern)) {
    issues.push({
      type: 'performance',
      severity: 'error',
      message: 'Avoid using v-if with v-for on the same element',
      autofix: {
        type: 'separateVForVIf',
        data: {}
      }
    });
  }
  
  // 检查大量静态内容
  const staticContentCount = (template.match(/{{\s*['"](.*?)['"]\s*}}/g) || []).length;
  if (staticContentCount > 5) {
    issues.push({
      type: 'performance',
      severity: 'warning',
      message: 'Consider using v-once for static content',
      autofix: {
        type: 'addVOnce',
        data: {}
      }
    });
  }
  
  return issues;
}

// 代码复杂度检查
function checkComplexity(descriptor) {
  const issues = [];
  
  // 检查方法长度
  const methodPattern = /methods:\s*{([^}]+)}/s;
  const methodsMatch = descriptor.script?.content.match(methodPattern);
  if (methodsMatch) {
    const methodsContent = methodsMatch[1];
    const methodLines = methodsContent.split('\n').length;
    if (methodLines > 20) {
      issues.push({
        type: 'complexity',
        severity: 'warning',
        message: 'Methods section is too long, consider splitting into composables',
        autofix: {
          type: 'extractComposable',
          data: { methodsContent }
        }
      });
    }
  }
  
  return issues;
}

// 样式检查
function checkStyles(descriptor) {
  const issues = [];
  const style = descriptor.styles[0]?.content || '';
  
  // 检查是否使用scoped
  if (descriptor.styles.length > 0 && !descriptor.styles[0].scoped) {
    issues.push({
      type: 'style',
      severity: 'warning',
      message: 'Consider using scoped styles to prevent style leaking',
      autofix: {
        type: 'addScoped',
        data: {}
      }
    });
  }
  
  // 检查选择器深度
  const deepSelectors = (style.match(/\./g) || []).length;
  if (deepSelectors > 3) {
    issues.push({
      type: 'style',
      severity: 'warning',
      message: 'Deep nesting of selectors detected, consider flattening',
      autofix: {
        type: 'flattenSelectors',
        data: {}
      }
    });
  }
  
  return issues;
}

// 主分析函数
function analyzeComponent(component) {
  const { descriptor } = parse(component);
  
  return {
    naming: checkComponentNaming(descriptor),
    props: checkPropsValidation(descriptor),
    lifecycle: checkLifecycleHooks(descriptor),
    template: checkTemplateOptimization(descriptor),
    complexity: checkComplexity(descriptor),
    style: checkStyles(descriptor)
  };
}

module.exports = {
  analyzeComponent
}; 