import { spawn } from 'child_process';
import readline from 'readline';
import path from 'path';
import { createRequire } from 'module';
import { parse } from '@vue/compiler-sfc';

const require = createRequire(import.meta.url);

// 核心服务类
class VueSageMCPService {
  constructor() {
    this.nextId = 1;
    this.serverInfo = {
      name: 'vuesage',
      version: '1.1.35',
      status: 'ready',
      protocolVersion: '0.2.0'
    };

    // 初始化时不主动发送消息，等待 initialize 请求
    this.initialized = false;
  }

  // 日志输出改为标准错误输出
  log(...args) {
    if (this.debug) {
      console.error('[DEBUG]', ...args);
    }
  }

  // 获取服务器信息
  getServerInfo() {
    return this.serverInfo;
  }

  // 获取服务能力
  getCapabilities() {
    return {
      analyze: {
        description: '分析 Vue 组件代码质量',
        parameters: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Vue组件代码'
            }
          },
          required: ['component']
        }
      },
      generateUI: {
        description: '生成 UI 组件建议',
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: '组件类型'
            },
            description: {
              type: 'string',
              description: '组件描述'
            }
          },
          required: ['type', 'description']
        }
      },
      search21st: {
        description: '搜索 21st 组件库',
        parameters: {
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
      }
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
  async generateUIComponent(params) {
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

  // 发送消息
  sendMessage(message) {
    try {
      // 严格按照 JSON-RPC 2.0 标准格式
      const jsonMessage = {
        jsonrpc: '2.0'
      };

      // 请求或通知必须有 method
      if (message.method) {
        jsonMessage.method = message.method;
        
        // 可选的 params
        if (message.params) {
          jsonMessage.params = message.params;
        }
      }
      
      // 响应必须有 id
      if (message.id !== undefined) {
        jsonMessage.id = typeof message.id === 'string' ? message.id : String(message.id);
      }
      
      // 错误响应
      if (message.error) {
        jsonMessage.error = {
          code: message.error.code || -32603,
          message: message.error.message || 'Internal error'
        };
        if (message.error.data) {
          jsonMessage.error.data = message.error.data;
        }
      } 
      // 成功响应必须有 result
      else if (message.result !== undefined) {
        jsonMessage.result = message.result;
      }

      // 发送消息
      process.stdout.write(JSON.stringify(jsonMessage) + '\n');
    } catch (error) {
      console.error('MCP sendMessage error:', error);
      // 错误也使用标准格式
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error.message
        }
      }) + '\n');
    }
  }

  // 处理请求
  async handleRequest(request) {
    try {
      // 验证请求格式
      if (!request || typeof request !== 'object') {
        return {
          error: {
            code: -32600,
            message: 'Invalid Request: Request must be an object'
          }
        };
      }

      const { id, method, params } = request;

      // 验证必需字段
      if (!method || typeof method !== 'string') {
        return {
          id: id ? String(id) : undefined,
          error: {
            code: -32600,
            message: 'Invalid Request: Method must be a string'
          }
        };
      }

      // 验证 params 格式
      if (params && typeof params !== 'object') {
        return {
          id: id ? String(id) : undefined,
          error: {
            code: -32600,
            message: 'Invalid Request: Params must be an object'
          }
        };
      }

      switch (method) {
        case 'initialize':
          this.initialized = true;
          return {
            id: id ? String(id) : undefined,
            result: {
              serverInfo: this.serverInfo,
              capabilities: this.getCapabilities()
            }
          };

        case 'shutdown':
          return {
            id: id ? String(id) : undefined,
            result: null
          };

        case 'exit':
          process.exit(0);
          break;

        default:
          // 只有初始化后才处理其他请求
          if (!this.initialized) {
            return {
              id: id ? String(id) : undefined,
              error: {
                code: -32002,
                message: 'Server not initialized'
              }
            };
          }

          switch (method) {
            case 'analyze':
              return {
                id: id ? String(id) : undefined,
                result: await this.analyze(params)
              };

            case 'generateUI':
              return {
                id: id ? String(id) : undefined,
                result: await this.generateUIComponent(params)
              };

            case 'search21st':
              return {
                id: id ? String(id) : undefined,
                result: await this.search21st(params)
              };

            default:
              return {
                id: id ? String(id) : undefined,
                error: {
                  code: -32601,
                  message: `Method not found: ${method}`
                }
              };
          }
      }
    } catch (error) {
      return {
        id: request?.id ? String(request.id) : undefined,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error.message
        }
      };
    }
  }
}

// 创建服务实例
const service = new VueSageMCPService();

// 设置输入处理
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// 处理输入
rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);
    const response = await service.handleRequest(request);
    if (response) {
      service.sendMessage(response);
    }
  } catch (error) {
    service.sendMessage({
      error: {
        code: -32700,
        message: 'Parse error',
        data: error.message
      }
    });
  }
}); 