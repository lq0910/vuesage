# VueSage 🧙‍♂️

Vue 组件智能分析与优化引擎 - 你的 Vue 代码质量守护者

## 特性 ✨

- 🔍 **智能分析**: 自动检测 Vue 组件中的潜在问题和优化机会
- 🛠 **自动修复**: 一键修复常见问题和代码规范
- 📊 **性能优化**: 识别并解决性能瓶颈
- 🎯 **最佳实践**: 确保代码符合 Vue.js 最佳实践
- 🎨 **代码美化**: 自动格式化和优化代码结构

## 安装 📦

```bash
# 克隆仓库
git clone https://github.com/lq0910/vuesage.git

# 安装依赖
cd vuesage
npm install

# 启动服务
npm start
```

## 使用方法 🚀

### 1. 启动服务

```bash
npm start
```

服务将在 http://localhost:6188 启动

### 2. API 端点

#### 分析组件
```bash
curl -X POST http://localhost:6188/analyze \
  -H "Content-Type: application/json" \
  -d '{"component": "你的Vue组件代码"}'
```

#### 修复问题
```bash
curl -X POST http://localhost:6188/fix \
  -H "Content-Type: application/json" \
  -d '{"component": "组件代码", "issues": [问题列表]}'
```

### 3. 检查项目 ✅

VueSage 会检查以下方面:

- 组件命名规范
- Props 类型和验证
- 生命周期钩子使用
- 模板性能优化
- 代码复杂度
- 样式规范

### 4. 自动修复功能 🔧

- 添加/规范化组件名称
- 添加 Props 验证
- 更新废弃的生命周期钩子
- 优化 v-for 和 v-if 的使用
- 添加性能优化指令
- 提取复杂逻辑到 Composables
- 规范化样式定义

## 配置 ⚙️

在项目根目录创建 `.vuesagerc.json`:

```json
{
  "rules": {
    "naming": {
      "enabled": true,
      "severity": "warning"
    },
    "props": {
      "enabled": true,
      "severity": "warning"
    },
    "template": {
      "enabled": true,
      "severity": "error"
    },
    "style": {
      "enabled": true,
      "severity": "warning"
    }
  },
  "autofix": {
    "enabled": true,
    "safeMode": true
  }
}
```

## 最佳实践建议 💡

VueSage 提供的建议基于:

1. Vue.js 官方风格指南
2. 性能优化最佳实践
3. 可维护性准则
4. 团队协作规范

## 贡献 🤝

欢迎提交 Issue 和 Pull Request！

## 许可证 📄

MIT License 
