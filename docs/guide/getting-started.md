# 快速入门

## 安装

### 全局安装

```bash
npm install -g vuesage
```

### 项目安装

```bash
npm install --save-dev vuesage
```

## Cursor 编辑器集成

1. 安装 Cursor 编辑器扩展：

```bash
cursor extension install vuesage
```

2. 配置 MCP 服务：

在项目根目录创建 `mcp.json` 文件：

```json
{
  "name": "vuesage",
  "version": "1.1.6",
  "type": "service",
  "transport": "stdio",
  "command": "vuesage",
  "runtime": "node",
  "global": true,
  "platforms": ["cursor"],
  "capabilities": {
    "analyze": {
      "description": "分析 Vue 组件代码质量"
    },
    "fix": {
      "description": "自动修复代码问题"
    },
    "chat": {
      "description": "AI 对话式代码优化"
    }
  }
}
```

## 基本使用

### 命令行使用

1. 分析单个文件：
```bash
vuesage analyze src/components/Example.vue
```

2. 分析整个目录：
```bash
vuesage analyze src/components
```

3. 自动修复问题：
```bash
vuesage fix src/components/Example.vue
```

4. 生成报告：
```bash
vuesage analyze src/components --report --report-format html
```

### Cursor 编辑器中使用

在 Cursor 编辑器中打开 Vue 文件，可以使用以下命令：

- `/analyze` - 分析当前文件
- `/fix` - 修复检测到的问题
- `/chat` - 开始 AI 对话

## AI 对话功能

VueSage 提供了强大的 AI 对话功能，你可以通过自然语言与工具交互：

1. 性能优化：
```
> 检查这个组件的性能问题
```

2. 代码重构：
```
> 帮我重构这段代码，使其更易维护
```

3. 最佳实践建议：
```
> 这个组件是否符合 Vue 最佳实践？
```

## 配置文件

在项目根目录创建 `.vuesagerc.json` 文件自定义配置：

```json
{
  "rules": {
    "template": {
      "max-attributes-per-line": ["error", 3],
      "no-unused-vars": "warn"
    },
    "script": {
      "max-lines-per-function": ["warn", 50],
      "no-console": "error"
    },
    "style": {
      "no-unused-selectors": "warn"
    }
  },
  "ignore": ["dist/**/*", "node_modules/**/*"],
  "report": {
    "format": "html",
    "output": "./reports"
  }
}
```

## 下一步

- 查看 [高级特性](./advanced-features.md) 了解更多功能
- 阅读 [API 文档](../API.md) 获取详细接口信息
- 参考 [最佳实践](./best-practices.md) 优化你的代码 