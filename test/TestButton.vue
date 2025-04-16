<template>
  <button
    class="btn"
    @click="handleClick"
    :aria-label="label"
    :aria-busy="loading"
    role="button"
    tabindex="0"
    @keyup.enter="handleClick"
  >
    <span v-if="loading" class="btn__loading">Loading...</span>
    <span v-else class="btn__label">{{ label }}</span>
  </button>
</template>

<script>
export default {
  name: 'TestButton',
  
  data() {
    return {
      loading: false,
      label: 'Click me!'
    }
  },

  methods: {
    handleClick() {
      this.loading = true
      this.timer = setTimeout(() => {
        this.loading = false
      }, 1000)
    }
  },

  beforeUnmount() {
    if (this.timer) {
      clearTimeout(this.timer)
    }
  }
}
</script>

<style scoped>
.btn {
  background: #42b983;
  color: white;
  padding: 0.625rem 1.25rem; /* 10px 20px in rem */
  cursor: pointer;
  border: none;
  border-radius: 0.25rem;
  font-size: 1rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: #3aa876;
  }

  &:focus {
    outline: 2px solid #42b983;
    outline-offset: 2px;
  }

  &[aria-busy="true"] {
    cursor: wait;
    opacity: 0.7;
  }
}

.btn__loading,
.btn__label {
  display: inline-block;
}
</style> 