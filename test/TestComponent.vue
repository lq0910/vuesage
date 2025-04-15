<!-- 这是一个测试组件 -->
<template>
  <div class="test-component">
    <img src="test.jpg">
    <button v-on:click="handleClick">Click me</button>
    <div v-html="rawHtml"></div>
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
      btnText: '点击',
      rawHtml: '<span>Some HTML</span>',
    }
  },
  methods: {
    handleClick() {
      console.log('clicked')
    }
  }
}
</script>

<style scoped>
.test-component {
  color: #333;
  background-color: #fff;
}
</style> 