# VueSage 🧙‍♂️

Vue 组件智能分析与优化引擎 - 基于 MCP (Model-Code-Prompt) 的 Vue 代码质量分析工具

## 功能特性 ✨

- 🔍 **智能分析**: 
  - 自动检测 Vue 组件中的潜在问题
  - 基于 AST 的代码结构分析
  - 组件复杂度评估
  - 性能隐患识别
  
- 🛠 **自动修复**: 
  - 一键修复常见代码问题
  - 自动应用最佳实践
  - 代码规范自动化
  - 安全模式下的代码重构
  
- 📊 **性能优化**: 
  - 组件渲染性能分析
  - 响应式依赖优化
  - 内存泄漏检测
  - 打包体积优化建议
  
- 🎯 **最佳实践**: 
  - Vue.js 官方推荐规范
  - 组件设计模式指导
  - TypeScript 类型优化
  - 代码可维护性建议

## 安装使用 📦

### 全局安装（推荐）

```bash
npm install -g vuesage
```

### 项目中安装

```bash
npm install vuesage
```

### 1. 作为 MCP 服务使用

#### 配置 MCP

安装 vuesage 后，在编辑器的 MCP 配置文件中添加：

```json
{
  "mcpServers": {
    "vuesage": {
      "command": "node",
      "args": ["node_modules/vuesage/mcp-adapter.js"],
      "enabled": true,
      "capabilities": {
        "analyze": {
          "description": "分析 Vue 组件代码质量",
          "input": {
            "type": "object",
            "properties": {
              "component": {
                "type": "string",
                "description": "Vue 组件代码"
              }
            }
          }
        },
        "fix": {
          "description": "修复代码问题",
          "input": {
            "type": "object",
            "properties": {
              "component": {
                "type": "string",
                "description": "Vue 组件代码"
              },
              "issues": {
                "type": "array",
                "description": "需要修复的问题列表"
              }
            }
          }
        }
      }
    }
  }
}
```

支持的编辑器：
- Cursor (推荐)
- VSCode (需要安装 MCP 插件)

#### 使用方法

1. 在编辑器中打开 Vue 组件文件
2. 使用以下方式之一：
   - 命令面板（Command Palette）调用：
     - `VueSage: Analyze Component` - 分析当前组件
     - `VueSage: Fix Issues` - 修复检测到的问题
   - 对话形式（仅 Cursor）：
     - 直接输入 "分析当前组件" 或类似的自然语言指令
     - AI 助手会调用 vuesage 服务分析代码

#### 调试模式

如果需要查看详细日志，可以设置环境变量：
```bash
export VUESAGE_DEBUG=true
```

日志文件位置：`~/.vuesage/logs/vuesage.log`

### 2. 作为 Node.js 模块使用

```javascript
import { VueSage } from 'vuesage';

// 创建实例
const vueSage = new VueSage();

// 分析组件
const analysis = await vueSage.analyze(componentCode);

// 修复问题
const fixed = await vueSage.fix(componentCode, analysis.issues);
```

### 3. 作为独立服务使用

```bash
# 启动服务
vuesage serve
```

服务将在 http://localhost:6188 启动

## API 使用说明 📚

### analyze(code: string): Promise<Analysis>

分析 Vue 组件代码，返回分析结果。

#### 参数
- `code` (string): Vue 组件代码

#### 返回值
```typescript
interface Analysis {
  summary: {
    totalIssues: number;
    categories: string[];
    hasAutoFixableIssues: boolean;
  };
  issues: Array<{
    category: string;
    issues: Array<{
      id: string;
      message: string;
      severity: 'error' | 'warning';
      autofix: boolean;
      line?: number;
      column?: number;
    }>;
  }>;
}
```

### fix(code: string, issues: Issue[]): Promise<FixResult>

根据分析结果修复组件代码。

#### 参数
- `code` (string): Vue 组件代码
- `issues` (Issue[]): 需要修复的问题列表

#### 返回值
```typescript
interface FixResult {
  success: boolean;
  fixedComponent: string;
  appliedFixes: Array<{
    id: string;
    message: string;
    type: string;
  }>;
}
```

## HTTP API

### POST /analyze

分析组件代码。

#### 请求体
```json
{
  "component": "Vue组件代码"
}
```

#### 响应
```json
{
  "summary": {
    "totalIssues": 5,
    "categories": ["naming", "props", "performance"],
    "hasAutoFixableIssues": true
  },
  "issues": [
    {
      "category": "naming",
      "issues": [
        {
          "id": "naming-001",
          "message": "组件名称应使用 PascalCase",
          "severity": "warning",
          "autofix": true
        }
      ]
    }
  ]
}
```

### POST /fix

修复组件代码中的问题。

#### 请求体
```json
{
  "component": "组件代码",
  "issues": ["issue_id_1", "issue_id_2"]
}
```

## 配置说明 ⚙️

### 1. 基础配置
在项目根目录创建 `.vuesagerc.json`：

```json
{
  "rules": {
    "naming": {
      "enabled": true,
      "severity": "warning",
      "options": {
        "componentPrefix": "App",
        "propsCasing": "camelCase"
      }
    },
    "props": {
      "enabled": true,
      "severity": "warning",
      "options": {
        "requireType": true,
        "requireDefault": true
      }
    },
    "template": {
      "enabled": true,
      "severity": "error",
      "options": {
        "maxLength": 80,
        "requireKey": true
      }
    }
  },
  "autofix": {
    "safeMode": true,
    "backup": true,
    "ignoreFiles": ["dist/**/*", "node_modules/**/*"]
  },
  "formatting": {
    "indentSize": 2,
    "maxLineLength": 100,
    "singleQuote": true
  }
}
```

### 2. 规则说明

#### 命名规范 (naming)
- 组件名称规范
- Props 命名规范
- 事件名称规范
- 变量命名规则

#### Props 验证 (props)
- 类型检查
- 默认值
- 必填项验证
- 自定义验证器

#### 模板规范 (template)
- 指令使用规范
- 性能优化建议
- 可访问性检查
- 最佳实践遵循

#### 样式规范 (style)
- Scoped CSS 检查
- 选择器复杂度
- 样式复用建议
- 主题变量使用

## 最佳实践指南 💡

VueSage 的建议基于：

1. **Vue.js 官方风格指南**
   - 必要规则
   - 强烈推荐规则
   - 推荐规则

2. **性能优化最佳实践**
   - 响应式数据优化
   - 组件拆分原则
   - 渲染性能优化
   - 资源加载优化

3. **可维护性准则**
   - 代码组织结构
   - 组件通信方式
   - 状态管理方案
   - 测试友好性

4. **团队协作规范**
   - 代码一致性
   - 文档规范
   - Git 提交规范
   - 版本控制建议

## 贡献指南 🤝

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/AmazingFeature`
3. 提交改动：`git commit -m 'Add some AmazingFeature'`
4. 推送分支：`git push origin feature/AmazingFeature`
5. 提交 Pull Request

## 许可证 📄

MIT License - 详见 [LICENSE](LICENSE) 文件

## 作者 👨‍💻

lq0910 <liqiang@rmuu.cn>

## 支持 ❤️

如果这个项目对您有帮助，请给它一个星标 ⭐️ 