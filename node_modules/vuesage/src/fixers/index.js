const { parse, compileTemplate } = require('@vue/compiler-sfc');
const prettier = require('prettier');
const jscodeshift = require('jscodeshift');
const _ = require('lodash');

// 自动修复函数集合
const fixers = {
  // 添加组件名称
  addComponentName: (component, { suggestedName }) => {
    const { descriptor } = parse(component);
    const script = descriptor.script.content;
    
    // 在export default后插入name属性
    const newScript = script.replace(
      /export\s+default\s+{/,
      `export default {\n  name: '${suggestedName}',`
    );
    
    return component.replace(script, newScript);
  },

  // 重命名组件
  renameComponent: (component, { currentName, suggestedName }) => {
    const { descriptor } = parse(component);
    const script = descriptor.script.content;
    
    return component.replace(
      new RegExp(`name:\\s*['"]${currentName}['"]`),
      `name: '${suggestedName}'`
    );
  },

  // 添加Props验证
  addPropsValidation: (component, { props }) => {
    const { descriptor } = parse(component);
    const script = descriptor.script.content;
    
    // 解析现有的props
    const propsObj = {};
    props.split(',').forEach(prop => {
      const propName = prop.trim();
      if (propName) {
        propsObj[propName] = {
          type: 'String',
          required: false
        };
      }
    });
    
    // 生成新的props定义
    const newPropsContent = Object.entries(propsObj)
      .map(([name, config]) => {
        return `    ${name}: {\n      type: ${config.type},\n      required: ${config.required}\n    }`;
      })
      .join(',\n');
    
    return component.replace(
      /props:\s*{[^}]+}/s,
      `props: {\n${newPropsContent}\n  }`
    );
  },

  // 替换生命周期钩子
  replaceLifecycleHook: (component, { oldHook, newHook }) => {
    return component.replace(
      new RegExp(oldHook, 'g'),
      newHook
    );
  },

  // 分离v-for和v-if
  separateVForVIf: (component) => {
    const { descriptor } = parse(component);
    const template = descriptor.template.content;
    
    return component.replace(
      /<([^>]+)v-for="([^"]+)"([^>]*)v-if="([^"]+)"([^>]*)>/g,
      '<template v-if="$4">\n  <$1v-for="$2"$3$5>\n</$1>\n</template>'
    );
  },

  // 添加v-once指令
  addVOnce: (component) => {
    const { descriptor } = parse(component);
    const template = descriptor.template.content;
    
    return component.replace(
      /{{\s*['"]([^'"]+)['"]\s*}}/g,
      '<span v-once>$1</span>'
    );
  },

  // 提取到Composable
  extractComposable: (component, { methodsContent }) => {
    const { descriptor } = parse(component);
    const script = descriptor.script.content;
    
    // 创建composable文件内容
    const composableContent = `
import { ref } from 'vue'

export function useExtractedMethods() {
  ${methodsContent}
  
  return {
    // 返回所有方法
    ${methodsContent.match(/\w+\(\)/g).join(',\n    ')}
  }
}`;
    
    // 修改原组件
    const newScript = script.replace(
      /methods:\s*{[^}]+}/s,
      `setup() {
    const { ${methodsContent.match(/\w+\(\)/g).join(', ')} } = useExtractedMethods()
    return {
      ${methodsContent.match(/\w+\(\)/g).join(',\n      ')}
    }
  }`
    );
    
    return {
      componentContent: component.replace(script, newScript),
      composableContent
    };
  },

  // 添加scoped样式
  addScoped: (component) => {
    return component.replace(
      /<style>/,
      '<style scoped>'
    );
  },

  // 扁平化选择器
  flattenSelectors: (component) => {
    const { descriptor } = parse(component);
    const style = descriptor.styles[0].content;
    
    // 简单的选择器扁平化
    const flattenedStyle = style.replace(
      /\.[\w-]+\s+\.[\w-]+\s+\.[\w-]+/g,
      match => match.replace(/\s+/g, '__')
    );
    
    return component.replace(style, flattenedStyle);
  }
};

// 格式化代码
function formatCode(code) {
  try {
    return prettier.format(code, {
      parser: 'vue',
      semi: false,
      singleQuote: true
    });
  } catch (e) {
    console.error('Formatting error:', e);
    return code;
  }
}

// 应用修复
function applyFixes(component, issues) {
  let fixedComponent = component;
  const appliedFixes = [];
  
  for (const issue of issues) {
    if (issue.autofix) {
      const fixer = fixers[issue.autofix.type];
      if (fixer) {
        try {
          const result = fixer(fixedComponent, issue.autofix.data);
          if (typeof result === 'string') {
            fixedComponent = result;
          } else if (result.componentContent) {
            fixedComponent = result.componentContent;
            // 处理额外生成的文件
            appliedFixes.push({
              type: 'newFile',
              filename: 'composables/extractedMethods.js',
              content: result.composableContent
            });
          }
          appliedFixes.push({
            type: issue.autofix.type,
            message: `Applied fix: ${issue.message}`
          });
        } catch (e) {
          console.error(`Error applying fix ${issue.autofix.type}:`, e);
        }
      }
    }
  }
  
  return {
    fixedComponent: formatCode(fixedComponent),
    appliedFixes
  };
}

module.exports = {
  applyFixes
}; 