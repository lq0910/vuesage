<!-- 这是一个测试组件 -->
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

<style scoped>
.test-component {
  color: #333;
}
</style> 