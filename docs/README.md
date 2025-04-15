# VueSage - Vue组件智能分析与优化引擎

VueSage 是一个智能的 Vue 组件分析和优化工具，它可以帮助开发者发现潜在问题并自动修复常见的代码质量问题。

## 功能特点

### 1. 代码分析
- 模板分析
  - v-for 指令的 key 绑定检查
  - 代码行长度检查
  - 模板嵌套深度检查
  - 条件渲染优化建议

- 脚本分析
  - 组件名称检查
  - Props 类型和默认值检查
  - 方法复杂度检查
  - 生命周期方法检查

- 性能分析
  - 计算属性优化建议
  - Watch 数量检查
  - v-if/v-show 使用优化

### 2. 自动修复
- 自动添加缺失的 key 绑定
- 自动格式化过长的代码行
- 自动添加组件名称
- 自动添加 Props 类型和默认值
- 自动优化计算属性性能
- 自动重构复杂组件

## 快速开始

### 安装
```bash
npm install vuesage
```

### 基本使用
```javascript
import { VueAnalyzer, VueFixer } from 'vuesage';

// 创建分析器实例
const analyzer = new VueAnalyzer({
  maxLineLength: 80,
  maxMethodLines: 20,
  maxMethods: 10,
  maxNestingDepth: 3
});

// 分析组件代码
const result = analyzer.analyze(componentCode);
console.log(result.summary);
console.log(result.issues);

// 创建修复器实例
const fixer = new VueFixer();

// 修复发现的问题
const fixResult = fixer.fix(componentCode, result.issues);
console.log(fixResult.code);
```

## API 文档

### VueAnalyzer

#### 配置选项
```javascript
{
  maxLineLength: 80,        // 最大行长度
  requireComponentName: true,// 是否要求组件名称
  requirePropsType: true,   // 是否要求 Props 类型
  requirePropsDefault: true,// 是否要求 Props 默认值
  requireVForKey: true,     // 是否要求 v-for 的 key
  requireScopedStyle: true, // 是否要求 scoped 样式
  maxMethodLines: 20,       // 方法最大行数
  maxMethods: 10,          // 组件最大方法数
  maxNestingDepth: 3       // 最大嵌套深度
}
```

#### 方法
- `analyze(code: string): AnalysisResult`
  分析 Vue 组件代码，返回分析结果。

#### 返回值类型
```typescript
interface AnalysisResult {
  success: boolean;
  summary: string;
  issues: Array<{
    type: 'error' | 'warning' | 'style' | 'performance';
    message: string;
    fix?: string;
    line?: number;
    prop?: string;
  }>;
}
```

### VueFixer

#### 配置选项
```javascript
{
  formatOptions: {
    indent: 2,            // 缩进空格数
    maxLineLength: 80     // 最大行长度
  }
}
```

#### 方法
- `fix(code: string, issues: Array<Issue>): FixResult`
  修复 Vue 组件代码中的问题。

#### 返回值类型
```typescript
interface FixResult {
  success: boolean;
  code: string;
  repairs: Array<{
    message: string;
    type: string;
  }>;
}
```

## 最佳实践

### 1. 组件命名
- 使用 PascalCase 命名组件
- 组件名应该是描述性的
- 避免单个单词的组件名

### 2. Props 定义
- 始终指定 Props 的类型
- 为 Props 提供默认值
- 使用验证函数确保数据有效性

### 3. 性能优化
- 合理使用 v-if 和 v-show
- 避免在计算属性中进行复杂计算
- 控制 watch 的数量
- 使用 scoped 样式避免样式污染

### 4. 代码组织
- 将大型组件拆分为小组件
- 使用 mixins 或 composition API 复用逻辑
- 保持方法简短且职责单一

## 常见问题

### Q: 如何处理误报？
A: 可以通过配置选项调整检查规则的严格程度，或者在特定场景下禁用某些规则。

### Q: 自动修复是否安全？
A: 自动修复功能经过严格测试，但建议在应用修复前先查看修复建议，并在版本控制系统中提交代码。

### Q: 如何自定义规则？
A: 目前不支持自定义规则，但计划在未来版本中添加此功能。

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT 