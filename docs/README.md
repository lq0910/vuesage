# VueSage 使用文档

## 简介

VueSage 是一个强大的 Vue 组件代码质量分析和优化工具，支持 Vue 2 和 Vue 3，提供代码分析、自动修复和最佳实践建议。

## 特性

- 🔍 全面的代码分析
  - 模板语法检查
  - 脚本逻辑分析
  - 样式规范检查
  - 性能问题检测
  - 可访问性分析
  - Composition API 支持

- 🛠 智能修复建议
  - 自动修复常见问题
  - 代码格式化
  - 最佳实践应用
  - 性能优化建议

- 📊 详细的质量报告
  - HTML/JSON 格式报告
  - 问题分类统计
  - 代码质量评分
  - 改进建议

## 安装

### 全局安装
```bash
npm install -g vuesage
```

### 项目中安装
```bash
npm install --save-dev vuesage
```

## 基本使用

### 1. 分析单个文件

```bash
# 基本分析
vuesage analyze src/components/MyComponent.vue

# 生成报告
vuesage analyze src/components/MyComponent.vue --report

# 指定报告格式
vuesage analyze src/components/MyComponent.vue --report --report-format html

# 包含源代码
vuesage analyze src/components/MyComponent.vue --report --include-source
```

### 2. 自动修复

```bash
# 修复单个文件
vuesage fix src/components/MyComponent.vue

# 预览修复内容
vuesage fix src/components/MyComponent.vue --dry-run

# 批量修复
vuesage fix "src/**/*.vue"
```

### 3. 文件监听

```bash
# 监听目录
vuesage watch src/components

# 监听并自动修复
vuesage watch src/components --fix

# 排除目录
vuesage watch src --exclude "src/vendor/**"
```

## 配置文件

创建 `.vuesagerc.json` 配置文件：

```json
{
  "rules": {
    "template": {
      "maxLength": 80,
      "requireKey": true,
      "maxNestingDepth": 3,
      "requireAlt": true,
      "requireAriaLabel": true
    },
    "script": {
      "requireName": true,
      "requirePropsType": true,
      "maxMethodLines": 20,
      "maxMethods": 10,
      "enforceEmits": true
    },
    "style": {
      "enforceScoped": true,
      "maxNestingDepth": 3,
      "enforceClassNaming": true
    },
    "compositionApi": {
      "maxRefs": 10,
      "maxWatchers": 5,
      "enforceProvideComment": true
    }
  }
}
```

## 高级用法

### 1. 自定义规则

```javascript
// vuesage.config.js
module.exports = {
  rules: {
    custom: {
      'no-console': {
        test: (code) => !code.includes('console.log'),
        message: '禁止使用 console.log',
        autofix: (code) => code.replace(/console\.log\([^)]*\);?/g, '')
      }
    }
  }
};
```

### 2. CI/CD 集成

```yaml
# .github/workflows/vuesage.yml
name: Vue Code Quality

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install -g vuesage
      - run: vuesage analyze "src/**/*.vue" --report
      - uses: actions/upload-artifact@v2
        with:
          name: vuesage-report
          path: reports/
```

### 3. 编辑器集成

VueSage 支持与多种编辑器集成：

- VS Code
- WebStorm
- Cursor
- Sublime Text

## 常见问题

### Q: 如何处理误报？
使用 `<!-- vuesage-disable -->` 注释来禁用特定行的检查：

```vue
<!-- vuesage-disable max-length -->
<div class="very-long-class-name">...</div>
```

### Q: 如何自定义修复规则？
在配置文件中添加自定义修复规则：

```json
{
  "fix": {
    "custom": {
      "rules": ["my-custom-rule"],
      "transformers": {
        "my-custom-rule": "./transforms/my-custom-rule.js"
      }
    }
  }
}
```

## 最佳实践

1. **渐进式采用**
   - 先在小范围测试
   - 逐步扩大应用范围
   - 根据团队反馈调整规则

2. **自动化集成**
   - 配置 git hooks
   - 集成到 CI/CD 流程
   - 定期生成质量报告

3. **团队协作**
   - 统一配置文件
   - 共享最佳实践
   - 定期代码审查

## 性能优化

1. **批量分析优化**
   - 使用并发处理
   - 缓存分析结果
   - 增量分析变更

2. **报告生成优化**
   - 按需加载规则
   - 压缩报告文件
   - 使用流式处理

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License 