# VueSage 组件分析报告

生成时间: {{date}}

## 总体概况

| 指标 | 数值 |
|------|------|
| 分析文件总数 | {{summary.totalFiles}} |
| 平均得分 | {{summary.averageScore}}分 |
| 问题数量 | {{summary.totalIssues}} |
| 警告数量 | {{summary.totalWarnings}} |
| 通过率 | {{summary.passRate}} |

## 详细分析

{{#each fileAnalysis}}
### {{@index}}. {{filename}} ({{score}}分)

#### UI评估
{{#each strengths}}
- ✅ {{this}}
{{/each}}
{{#each improvements}}
- ⚠️ {{this}}
{{/each}}

#### 代码质量
{{#each codeQuality.strengths}}
- ✅ {{this}}
{{/each}}
{{#each codeQuality.improvements}}
- ⚠️ {{this}}
{{/each}}

#### 建议改进
{{#each improvements}}
- {{this}}
{{/each}}

{{/each}}

## 通用改进建议

### 1. 响应式设计
```css
@media (max-width: 768px) {
  /* 添加移动端样式 */
  .component {
    padding: 10px;
  }
  .button {
    width: 100%;
  }
}
```

### 2. 样式隔离
```vue
<style scoped>
/* 组件样式 */
.component {
  /* 局部样式 */
}
</style>
```

### 3. 可访问性增强
```vue
<button 
  aria-label="按钮描述"
  role="button"
  tabindex="0"
>
  按钮文本
</button>
```

### 4. 代码优化清单

- [ ] 统一使用scoped样式
- [ ] 添加适当的TypeScript类型定义
- [ ] 完善组件文档
- [ ] 添加单元测试
- [ ] 实现响应式设计
- [ ] 增强可访问性

## 后续步骤

1. 优先处理可访问性问题
2. 实现响应式设计
3. 统一样式隔离方案
4. 补充单元测试
5. 更新组件文档

---
*本报告由VueSage自动生成* 