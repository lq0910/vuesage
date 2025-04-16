<!-- 这是一个测试组件 -->
<template>
  <div class="test-component">
    <h1>{{ title }}</h1>
    <div v-for="item in items" :key="item">
      {{ item }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'testcomponent',
  data() {
    return {
      title: 'Test Component',
      items: []
    }
  },
  mounted() {
    this.items.push('test')
  }
}
</script>

<style>
.test-component {
  color: red
}
</style> 