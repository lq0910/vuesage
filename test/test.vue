<template>
  <div class="test-component">
    <div v-for="item in items">
      {{ item.name }}
    </div>
    <button @click="handleClick">Click me</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: []
    }
  },
  methods: {
    handleClick() {
      console.log('clicked')
    }
  }
}
</script>

<style>
.test-component {
  padding: 20px;
}
</style> 