# VueSage API 文档

## 安装

### 全局安装

```bash
npm install -g vuesage
```

### 项目中安装

```bash
npm install vuesage
```

## 使用方式

### 1. 命令行使用

#### 单文件分析

```bash
# 分析单个组件文件
vuesage analyze test/TestComponent.vue

# 分析并自动修复
vuesage analyze test/TestComponent.vue --fix

# 指定规则进行分析
vuesage analyze test/TestComponent.vue --rules naming,props,template

# 输出详细信息
vuesage analyze test/TestComponent.vue --verbose

# 自定义配置文件
vuesage analyze test/TestComponent.vue --config .vuesagerc.custom.json
```

示例输出：
```json
{
  "summary": {
    "totalIssues": 3,
    "categories": ["naming", "props", "template"],
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
          "autofix": true,
          "line": 15
        }
      ]
    },
    {
      "category": "template",
      "issues": [
        {
          "id": "template-001",
          "message": "v-for 指令必须使用 key 绑定",
          "severity": "error",
          "autofix": true,
          "line": 5
        }
      ]
    }
  ]
}
```

#### 批量分析

```bash
# 分析整个项目的 Vue 文件
vuesage batch src/**/*.vue

# 排除特定目录
vuesage batch "src/**/*.vue" --exclude "src/vendor/**"

# 指定并发数
vuesage batch "src/**/*.vue" --concurrent 4

# 生成 HTML 报告
vuesage batch "src/**/*.vue" --format html --output-dir ./reports

# 自动修复所有问题
vuesage batch "src/**/*.vue" --fix
```

示例输出：
```json
{
  "summary": {
    "totalFiles": 10,
    "analyzedFiles": 10,
    "totalIssues": 25,
    "fixableIssues": 15
  },
  "fileResults": [
    {
      "file": "src/components/Header.vue",
      "issues": [
        {
          "category": "props",
          "message": "Props 需要类型声明",
          "line": 12
        }
      ]
    }
  ],
  "statistics": {
    "mostCommonIssues": [
      {
        "id": "props-001",
        "count": 8,
        "description": "Props 类型声明缺失"
      }
    ]
  }
}
```

### 2. Cursor 对话框使用

在 Cursor 编辑器中，您可以直接通过对话框使用 VueSage 的功能：

#### 分析组件
```
/analyze MyComponent.vue
```
或
```
请分析 src/components/MyComponent.vue 的代码质量
```

示例对话：
```
用户: 请分析 src/components/Header.vue 的代码质量

助手: 我来帮您分析 Header.vue 组件的代码质量。

分析结果显示以下问题：
1. 命名规范问题：
   - 组件名称使用了小写 'header'，应该改为 'Header'
   - 事件名称 'click' 应该使用 kebab-case: 'on-click'

2. Props 验证问题：
   - title prop 缺少类型声明
   - isFixed prop 缺少默认值

3. 模板优化建议：
   - v-for 指令缺少 :key 绑定
   - 建议为长列表添加虚拟滚动

是否需要我帮您修复这些问题？

用户: 是的，请帮我修复

助手: 好的，我来帮您修复这些问题...
[修复过程和结果]

用户: 请对整个项目进行代码分析

助手: 我将对项目中的所有 Vue 组件进行分析。

正在执行批量分析...
分析结果显示：
1. 总文件数：15
2. 存在问题的文件：8
3. 主要问题类型：
   - Props 类型声明缺失 (5个文件)
   - 命名规范问题 (3个文件)
   - 性能优化建议 (2个文件)

需要我为您展示详细报告或者自动修复这些问题吗？
```

#### 批量分析
```
/batch src/**/*.vue
```
或
```
请分析整个项目的 Vue 组件
```

#### 修复问题
```
/fix MyComponent.vue
```
或
```
请修复 src/components/MyComponent.vue 中的代码问题
```

#### 性能优化
```
/optimize MyComponent.vue
```
或
```
请优化 src/components/MyComponent.vue 的性能
```

#### 代码重构
```
/refactor MyComponent.vue
```
或
```
请重构 src/components/MyComponent.vue 的代码
```

#### 最佳实践检查
```
/best-practices MyComponent.vue
```
或
```
请检查 src/components/MyComponent.vue 是否符合最佳实践
```

#### 自定义规则检查
```
/analyze MyComponent.vue --rules naming,props
```
或
```
请使用命名规范和Props规则检查 src/components/MyComponent.vue
```

#### 查看规则说明
```
/rules
```
或
```
请列出所有可用的代码检查规则
```

#### 配置设置
```
/config
```
或
```
请显示当前的配置信息
```

注意事项：
1. 所有命令都支持自然语言表达
2. 可以在对话中随时询问具体的规则说明
3. 分析结果会直接在对话框中展示
4. 修复建议会在执行前征求您的同意
5. 可以通过对话框调整分析的严格程度

### 3. 作为 MCP 服务使用

#### 配置 MCP

在全局 MCP 配置文件中添加：

```json
{
  "services": {
    "vuesage": {
      "name": "vuesage",
      "type": "service",
      "transport": "stdio",
      "command": "vuesage",
      "runtime": "node",
      "global": true,
      "version": "1.1.0",
      "description": "Vue组件智能分析与优化引擎",
      "capabilities": {
        "analyze": {
          "description": "分析Vue组件代码质量",
          "type": "command",
          "input": {
            "type": "object",
            "properties": {
              "component": {
                "type": "string",
                "description": "Vue组件代码"
              },
              "options": {
                "type": "object",
                "description": "分析选项",
                "properties": {
                  "rules": {
                    "type": "array",
                    "description": "要检查的规则列表"
                  },
                  "fix": {
                    "type": "boolean",
                    "description": "是否自动修复问题"
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

#### Agent 模式示例

```javascript
// 分析单个组件
const analysis = await agent.analyze({
  component: `
    <template>
      <div class="test-component">
        <h1 v-if="show">{{ title }}</h1>
        <div v-for="(item, index) in items" :key="index">
          {{ item.name }}
        </div>
        <button @click="handleClick">
          {{ btnText }}
        </button>
      </div>
    </template>
    
    <script>
    export default {
      name: 'TestComponent',
      props: {
        title: {
          type: String,
          required: true,
          default: '标题'
        }
      },
      data() {
        return {
          show: true,
          items: [],
          btnText: '点击'
        }
      },
      methods: {
        handleClick() {
          this.items.push({ name: 'new item' })
        }
      }
    }
    </script>
  `,
  options: {
    rules: ['naming', 'props', 'template'],
    fix: true
  }
});

// 批量分析
const batchResults = await agent.batch({
  include: ['src/**/*.vue'],
  exclude: ['node_modules/**'],
  concurrent: 4,
  options: {
    fix: true,
    rules: ['all']
  }
});
```

### 4. 作为 Node.js 模块使用

```javascript
import { VueSage } from 'vuesage';

// 创建实例
const vueSage = new VueSage();

// 分析组件
const analysis = await vueSage.analyze(componentCode);

// 修复问题
const fixed = await vueSage.fix(componentCode, analysis.issues);
```

### 5. 作为独立服务使用

```bash
# 启动服务
vuesage serve
```

服务将在 http://localhost:6188 启动

## API 参考

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

#### 响应
```json
{
  "success": true,
  "fixedComponent": "修复后的组件代码",
  "appliedFixes": [
    {
      "id": "naming-001",
      "message": "已将组件名称修改为 PascalCase",
      "type": "naming"
    }
  ]
}
```

## 配置选项

### .vuesagerc.json

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

## 错误处理

所有 API 调用在发生错误时会返回一个错误对象：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {} // 可选的错误详情
  }
}
```

## 常见错误码

- `PARSE_ERROR`: 组件代码解析错误
- `INVALID_COMPONENT`: 无效的组件代码
- `RULE_ERROR`: 规则执行错误
- `FIX_ERROR`: 修复执行错误
- `CONFIG_ERROR`: 配置错误
- `INTERNAL_ERROR`: 内部错误

## 版本兼容性

- Node.js >= 14.0.0
- Vue.js >= 3.0.0

## 调试

设置环境变量开启调试模式：

```bash
DEBUG=vuesage:* vuesage
```

## 贡献指南

1. Fork 本仓库
2. 创建特性分支
3. 提交改动
4. 推送到分支
5. 提交 Pull Request

## 许可证

MIT License 