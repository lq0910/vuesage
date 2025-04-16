# Vue 组件最佳实践指南

## 组件设计原则

### 1. 单一职责

每个组件应该只做一件事，并且做好这件事：

```vue
<!-- 不推荐 -->
<template>
  <div>
    <user-profile></user-profile>
    <order-list></order-list>
    <payment-form></payment-form>
  </div>
</template>

<!-- 推荐 -->
<template>
  <div>
    <user-dashboard></user-dashboard>
  </div>
</template>
```

### 2. Props 验证

始终为组件的 props 提供详细的验证：

```js
// 不推荐
props: ['status']

// 推荐
props: {
  status: {
    type: String,
    required: true,
    validator: value => ['active', 'inactive'].includes(value)
  }
}
```

### 3. 事件命名

使用 kebab-case 命名事件：

```vue
<!-- 不推荐 -->
this.$emit('userLogin')

<!-- 推荐 -->
this.$emit('user-login')
```

## 性能优化

### 1. 计算属性缓存

合理使用计算属性缓存：

```js
// 不推荐
methods: {
  calculateTotal() {
    return this.items.reduce((sum, item) => sum + item.price, 0)
  }
}

// 推荐
computed: {
  total() {
    return this.items.reduce((sum, item) => sum + item.price, 0)
  }
}
```

### 2. 大列表优化

对大列表使用虚拟滚动：

```vue
<template>
  <virtual-list
    :data-key="'id'"
    :data-sources="items"
    :data-component="ItemComponent"
    :estimate-size="32"
  />
</template>
```

### 3. 异步组件

使用异步组件延迟加载：

```js
// 不推荐
import HeavyComponent from './HeavyComponent.vue'

// 推荐
const HeavyComponent = () => import('./HeavyComponent.vue')
```

## 代码组织

### 1. 文件结构

推荐的组件文件结构：

```
src/
├── components/
│   ├── common/
│   │   ├── Button.vue
│   │   └── Input.vue
│   ├── features/
│   │   ├── UserProfile/
│   │   │   ├── index.vue
│   │   │   ├── ProfileHeader.vue
│   │   │   └── ProfileStats.vue
│   │   └── OrderList/
│   └── layouts/
├── composables/
├── stores/
└── views/
```

### 2. 组件通信

选择合适的通信方式：

```js
// 父子组件：Props + Events
props: ['value'],
emits: ['update:value']

// 跨层级：Provide/Inject
provide() {
  return {
    theme: this.theme
  }
}

// 全局状态：Pinia/Vuex
const store = defineStore('counter', {
  state: () => ({ count: 0 })
})
```

### 3. 样式管理

使用 scoped 样式和 CSS 变量：

```vue
<style scoped>
.component {
  color: var(--primary-color);
}
</style>
```

## 测试实践

### 1. 单元测试

为组件编写单元测试：

```js
import { mount } from '@vue/test-utils'
import Counter from './Counter.vue'

test('increments counter', async () => {
  const wrapper = mount(Counter)
  await wrapper.find('button').trigger('click')
  expect(wrapper.text()).toContain('1')
})
```

### 2. 快照测试

使用快照测试捕获 UI 变化：

```js
it('renders correctly', () => {
  const wrapper = mount(MyComponent)
  expect(wrapper.element).toMatchSnapshot()
})
```

## 安全考虑

### 1. XSS 防护

避免使用 v-html：

```vue
<!-- 不推荐 -->
<div v-html="userInput"></div>

<!-- 推荐 -->
<div>{{ userInput }}</div>
```

### 2. 敏感数据处理

不在模板中显示敏感信息：

```vue
<!-- 不推荐 -->
<div>{{ user.token }}</div>

<!-- 推荐 -->
<div>{{ maskSensitiveData(user.token) }}</div>
```

## 文档和注释

### 1. 组件文档

使用 JSDoc 风格的注释：

```js
/**
 * 用户资料卡片组件
 * @component
 * @example
 * <user-card
 *   :user="user"
 *   @update="handleUpdate"
 * />
 */
export default {
  name: 'UserCard',
  props: {
    /** 用户对象 */
    user: {
      type: Object,
      required: true
    }
  }
}
```

### 2. 复杂逻辑注释

为复杂的业务逻辑添加注释：

```js
methods: {
  /**
   * 计算用户的会员等级
   * @param {number} points - 用户积分
   * @param {number} purchases - 购买次数
   * @returns {string} 会员等级
   */
  calculateMembershipLevel(points, purchases) {
    // 实现逻辑
  }
}
```

## 错误处理

### 1. 全局错误处理

设置全局错误处理器：

```js
app.config.errorHandler = (err, vm, info) => {
  console.error('Error:', err)
  console.error('Component:', vm)
  console.error('Info:', info)
}
```

### 2. 组件级错误处理

使用错误边界组件：

```vue
<template>
  <div>
    <error-boundary>
      <template #default>
        <my-component />
      </template>
      <template #error="{ error }">
        <div class="error-message">
          {{ error.message }}
        </div>
      </template>
    </error-boundary>
  </div>
</template>
```

## 持续改进

### 1. 代码审查清单

- [ ] Props 是否有完整的类型定义和验证？
- [ ] 是否遵循单一职责原则？
- [ ] 是否有适当的错误处理？
- [ ] 性能是否经过优化？
- [ ] 是否有充分的测试覆盖？
- [ ] 文档是否完整且最新？

### 2. 性能监控

集成性能监控：

```js
// 监控组件渲染性能
import { onMounted, onUpdated } from 'vue'

export function usePerformanceMonitoring(componentName) {
  onMounted(() => {
    console.time(`${componentName}-mount`)
  })
  
  onUpdated(() => {
    console.time(`${componentName}-update`)
  })
}
```

### 3. 定期代码健康检查

使用 VueSage 进行定期检查：

```bash
# 每周运行完整分析
vuesage analyze src --report --report-format html --output weekly-report

# 对比历史报告
vuesage compare-reports weekly-report-current.html weekly-report-previous.html
``` 