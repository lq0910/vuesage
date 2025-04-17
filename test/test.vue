<template>
  <div class="test-component">
    <div v-for="(item, index) in items" :key="index">
      {{ item.name }}
    </div>
    <button @click="handleClick">Click me</button>
  </div>
</template>

<script>
export default {
  name: 'TestComponent',
  props: {
    initialItems: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      items: this.initialItems
    }
  },
  methods: {
    handleClick() {
      this.$emit('click')
      console.log('Button clicked, emitting event')
    }
  }
}
</script>

<style scoped>
.test-component {
  padding: 20px;
}
</style> 