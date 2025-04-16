# 高级特性

## Composition API 分析

VueSage 提供了全面的 Vue 3 Composition API 分析支持：

### 1. 响应式数据优化

```js
// 检测并优化响应式数据声明
const state = reactive({  // 警告：大量数据使用 reactive
  user: { ... },
  settings: { ... },
  preferences: { ... }
})

// 建议拆分：
const user = reactive({ ... })
const settings = reactive({ ... })
const preferences = reactive({ ... })
```

### 2. 生命周期钩子分析

```js
// 检测重复的生命周期钩子
onMounted(() => {
  fetchData()
})
onMounted(() => {
  initializeUI()
})

// 建议合并：
onMounted(() => {
  fetchData()
  initializeUI()
})
```

### 3. 计算属性优化

```js
// 检测复杂计算属性
const filteredItems = computed(() => {
  return items.value
    .filter(item => item.active)
    .map(item => item.name)
    .sort()
    .slice(0, 10)
})

// 建议拆分：
const activeItems = computed(() => items.value.filter(item => item.active))
const sortedActiveItems = computed(() => activeItems.value.sort())
const topItems = computed(() => sortedActiveItems.value.slice(0, 10))
```

## 自定义规则

### 创建规则

在项目中创建 `vuesage-rules.js`：

```js
module.exports = {
  'custom-event-name': {
    create(context) {
      return {
        'CustomEvent'(node) {
          if (!/^[a-z]+(-[a-z]+)*$/.test(node.name)) {
            context.report({
              node,
              message: '自定义事件名称应使用 kebab-case'
            })
          }
        }
      }
    }
  }
}
```

### 注册规则

在 `.vuesagerc.json` 中注册规则：

```json
{
  "rules": {
    "custom": {
      "custom-event-name": "error"
    }
  }
}
```

## CI/CD 集成

### GitHub Actions

```yaml
name: Vue Code Quality

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install -g vuesage
      - name: Analyze Vue Components
        run: |
          vuesage analyze src --report --report-format json
          if [ $? -ne 0 ]; then
            echo "Found code quality issues"
            exit 1
          fi
```

### GitLab CI

```yaml
vue-quality:
  image: node:16
  script:
    - npm install -g vuesage
    - vuesage analyze src --report --report-format json
  artifacts:
    reports:
      json: report.json
```

## 性能优化

### 批量分析优化

```bash
# 使用多线程分析
vuesage analyze src --parallel 4

# 增量分析（仅分析改动文件）
vuesage analyze src --incremental
```

### 缓存配置

```json
{
  "cache": {
    "enabled": true,
    "directory": ".vuesage-cache",
    "ttl": 3600
  }
}
```

## 团队协作

### 共享配置

创建 `.vuesagerc.team.json`：

```json
{
  "extends": [
    "./node_modules/@company/vuesage-config"
  ],
  "rules": {
    "template": {
      "max-attributes-per-line": ["error", 3]
    }
  }
}
```

### 自定义报告模板

创建 `vuesage-report-template.html`：

```html
<!DOCTYPE html>
<html>
  <head>
    <title>团队代码质量报告</title>
  </head>
  <body>
    <h1>{{ teamName }} - Vue 组件分析报告</h1>
    {{#each issues}}
      <section>
        <h2>{{ category }}</h2>
        <ul>
          {{#each items}}
            <li>{{ message }}</li>
          {{/each}}
        </ul>
      </section>
    {{/each}}
  </body>
</html>
```

## API 集成

### Node.js API

```js
const { analyze, fix } = require('vuesage')

async function analyzeComponent(code) {
  const result = await analyze(code)
  console.log(result.issues)
}

async function fixComponent(code, issues) {
  const result = await fix(code, issues)
  console.log(result.fixedCode)
}
```

### REST API

启动 HTTP 服务器：

```bash
vuesage serve --port 6188
```

使用 API：

```bash
# 分析组件
curl -X POST http://localhost:6188/analyze \
  -H "Content-Type: application/json" \
  -d '{"component":"<template>...</template>"}'

# 修复问题
curl -X POST http://localhost:6188/fix \
  -H "Content-Type: application/json" \
  -d '{"component":"<template>...</template>","issues":[...]}'
``` 