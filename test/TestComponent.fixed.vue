<template>
  <div class="test-component">
    <div v-for="item in items" :key="item.id">
      {{ item.name }}
    </div>
    <div v-for="user in users" :key="user.id">
      {{ user.name }}
    </div>
    <div v-for="task in tasks" :key="task.id">
      {{ task.title }}
    </div>
    <div v-for="message in messages" :key="message.id">
      {{ message.text }}
    </div>
    <div v-for="notification in notifications" :key="notification.id">
      {{ notification.content }}
    </div>
    <div v-for="event in events" :key="event.id">
      {{ event.name }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'TestComponent',
  data() {
    return {
      items: [],
      users: [],
      tasks: [],
      messages: [],
      notifications: [],
      events: [],
    }
  },
  computed: {
    filteredItems() {
      return this.items
        .filter((item) => item.active)
        .map((item) => {
          return {
            ...item,
            processed: true,
          }
        })
        .reduce((acc, curr) => {
          acc[curr.id] = curr
          return acc
        }, {})
    },
  },
  methods: {
    method1() {},
    method2() {},
    method3() {},
    method4() {},
    method5() {},
    method6() {},
    method7() {},
    method8() {},
    method9() {},
    method10() {},
    method11() {},
  },
}
</script>

<style scoped>
.test-component {
  padding: 20px;
}
</style>
