<template>
<div class="example-component">
    <div v-for="item in items">
      {{ item.name }}
    </div>
    <div v-for="(user, index) in users" class="very-very-very-very-very-very-very-very-very-very-very-very-long-class-name">
      {{ user.name }}
    </div>
    <button @click="handleClick">Click me</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [],
      users: []
    }
  },
  methods: {
    handleClick() {
      // 这是一个很长的方法
      const step1 = this.doSomething();
      const step2 = this.doSomethingElse();
      const step3 = this.andMore();
      const step4 = this.evenMore();
      const step5 = this.andEvenMore();
      return step1 + step2 + step3 + step4 + step5;
    }
  }
}
</script>

<style>
.example-component {
  .button {
    .icon {
      .text {
        color: red;
      }
    }
  }
}
</style>