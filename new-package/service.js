import { FastMCP } from 'fastmcp';
import { parse } from '@vue/compiler-sfc';

// 启用调试输出
process.env.DEBUG = 'fastmcp:*';

// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// 显示启动信息
console.error('VueSage MCP 服务启动中...');

class VueSageService {
  constructor() {
    this.serverInfo = {
      name: 'vuesage',
      version: '1.0.0',
      status: 'ready'
    };
  }

  // 分析 Vue 组件
  async analyze(params) {
    try {
      const { descriptor, errors } = parse(params.component);
      
      if (errors && errors.length > 0) {
        return {
          score: 60,
          issues: errors.length,
          warnings: 0,
          details: errors.map(error => ({
            type: 'error',
            message: error.message,
            line: error.loc?.start.line,
            column: error.loc?.start.column
          }))
        };
      }

      const analysis = {
        score: 0,
        issues: 0,
        warnings: 0,
        details: []
      };

      // 检查模板
      if (descriptor.template) {
        this.analyzeTemplate(descriptor.template, analysis);
      }

      // 检查脚本
      if (descriptor.script || descriptor.scriptSetup) {
        this.analyzeScript(descriptor.script || descriptor.scriptSetup, analysis);
      }

      // 检查样式
      if (descriptor.styles.length > 0) {
        this.analyzeStyles(descriptor.styles, analysis);
      }

      // 计算最终得分
      analysis.score = Math.max(0, 100 - (analysis.issues * 10 + analysis.warnings * 5));

      return analysis;
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  }

  // 生成 UI 建议
  async generateUI(params) {
    try {
      const { type, description, context } = params;
      
      // 基于组件类型和描述生成建议
      const suggestions = {
        component: this.generateComponentTemplate(type, description),
        improvements: this.generateUIImprovements(context)
      };

      return suggestions;
    } catch (error) {
      console.error('UI generation error:', error);
      throw error;
    }
  }

  // 搜索 21st 组件库
  async search21st(params) {
    try {
      const { query, category } = params;
      
      // 模拟 21st 组件搜索结果
      const results = {
        components: [
          {
            name: `${category || ''}${query}`,
            description: `A ${query} component with modern design`,
            code: this.generate21stComponent(query, category),
            preview: `https://21st.dev/preview/${query}`
          }
        ],
        suggestions: [
          `Consider using ${query} with accessibility features`,
          `Add responsive design to ${query}`,
          `Implement dark mode support`
        ]
      };

      return results;
    } catch (error) {
      console.error('21st search error:', error);
      throw error;
    }
  }

  generateComponentTemplate(type, description) {
    // 根据类型生成基础组件模板
    const componentName = type.charAt(0).toUpperCase() + type.slice(1);
    return `
<template>
  <div class="${type}-component" role="${type}">
    <!-- ${description} -->
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: '${componentName}',
  props: {
    // Add your props here
  },
  setup(props) {
    // Component logic
  }
}
</script>

<style scoped>
.${type}-component {
  /* Base styles */
}
</style>`;
  }

  generateUIImprovements(context) {
    return [
      {
        type: 'accessibility',
        suggestions: [
          'Add ARIA labels',
          'Ensure keyboard navigation',
          'Include focus management'
        ]
      },
      {
        type: 'design',
        suggestions: [
          'Use consistent spacing',
          'Implement responsive breakpoints',
          'Add loading states'
        ]
      }
    ];
  }

  generate21stComponent(query, category = 'ui') {
    return `
// ${category}/${query} component
export const ${query}Component = {
  name: '${query}',
  template: \`
    <div class="${query}-wrapper">
      <!-- Modern ${query} implementation -->
    </div>
  \`
}`;
  }

  analyzeTemplate(template, analysis) {
    const content = template.content;
    
    // 检查可访问性属性
    if (!content.includes('aria-') && !content.includes('role=')) {
      analysis.warnings++;
      analysis.details.push({
        type: 'warning',
        message: '建议添加 ARIA 属性以提高可访问性',
        line: template.loc.start.line
      });
    }

    // 检查 v-html 使用
    if (content.includes('v-html')) {
      analysis.warnings++;
      analysis.details.push({
        type: 'warning',
        message: '谨慎使用 v-html，可能存在 XSS 风险',
        line: template.loc.start.line
      });
    }
  }

  analyzeScript(script, analysis) {
    const content = script.content;

    // 检查组件名称
    if (!content.includes('name:')) {
      analysis.warnings++;
      analysis.details.push({
        type: 'warning',
        message: '组件应该包含 name 属性',
        line: script.loc.start.line
      });
    }

    // 检查生命周期钩子中的清理
    if (content.includes('setTimeout') || content.includes('setInterval')) {
      if (!content.includes('beforeUnmount') && !content.includes('unmounted')) {
        analysis.warnings++;
        analysis.details.push({
          type: 'warning',
          message: '使用计时器时应在组件卸载时进行清理',
          line: script.loc.start.line
        });
      }
    }
  }

  analyzeStyles(styles, analysis) {
    styles.forEach(style => {
      // 检查 scoped
      if (!style.scoped) {
        analysis.warnings++;
        analysis.details.push({
          type: 'warning',
          message: '建议使用 scoped 样式以避免样式污染',
          line: style.loc.start.line
        });
      }

      // 检查单位使用
      if (style.content.includes('px')) {
        analysis.warnings++;
        analysis.details.push({
          type: 'warning',
          message: '建议使用相对单位 (rem/em) 替代 px',
          line: style.loc.start.line
        });
      }
    });
  }
}

// 创建服务实例
const vueSageService = new VueSageService();

// 创建 MCP 服务器
const server = new FastMCP({
  name: 'vuesage',
  version: '1.0.0'
});

// 添加工具
server.addTool('analyze', async (params, session) => {
  return await vueSageService.analyze(params);
}, {
  name: 'analyze',
  description: '分析 Vue 组件代码质量',
  inputSchema: {
    type: 'object',
    properties: {
      component: {
        type: 'string',
        description: 'Vue组件代码'
      }
    },
    required: ['component']
  }
});

server.addTool('generateUI', async (params, session) => {
  return await vueSageService.generateUI(params);
}, {
  name: 'generateUI',
  description: '生成 UI 组件建议',
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: '组件类型 (button, form, card 等)'
      },
      description: {
        type: 'string',
        description: '组件描述'
      }
    },
    required: ['type', 'description']
  }
});

server.addTool('search21st', async (params, session) => {
  return await vueSageService.search21st(params);
}, {
  name: 'search21st',
  description: '搜索 21st 组件库',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词'
      },
      category: {
        type: 'string',
        description: '组件类别'
      }
    },
    required: ['query']
  }
});

// 启动服务器
try {
  server.start();
  console.error('VueSage MCP 服务已成功启动');
} catch (error) {
  console.error('启动服务失败:', error);
} 