<template>
  <AppLoader :visible="isLoading" />
  <RouterView v-if="!isLoading" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppLoader from '@/components/common/AppLoader.vue'

const isLoading = ref(true)

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 2200)
})
</script>
