<template>
  <div class="flag-bar" :style="{ width: `${width}px`, height: `${height}px` }">
    <div class="flag-bar__orange" />
    <div class="flag-bar__white" />
    <div class="flag-bar__green" />
  </div>
</template>

<script setup>
defineProps({
  width: { type: Number, default: 32 },
  height: { type: Number, default: 3 }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.flag-bar {
  display: flex;
  border-radius: 2px;
  overflow: hidden;

  &__orange,
  &__white,
  &__green {
    flex: 1;
  }

  &__orange { background: $ci-orange; }
  &__white { background: $ci-white; }
  &__green { background: $ci-green; }
}
</style>
