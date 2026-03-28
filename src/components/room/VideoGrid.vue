<template>
  <div
    class="video-grid"
    :style="{ '--grid-cols': columns }"
  >
    <VideoTile
      v-for="participant in participants"
      :key="participant.id"
      :participant="participant"
      :stream="streams[participant.id] || null"
      :is-local="participant.id === localUserId"
    />
  </div>
</template>

<script setup>
import VideoTile from './VideoTile.vue'

defineProps({
  participants: { type: Array, required: true },
  columns: { type: Number, default: 2 },
  streams: { type: Object, default: () => ({}) },
  localUserId: { type: [Number, String], default: null }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.video-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-cols, 2), 1fr);
  gap: 10px;
  height: 100%;
  grid-auto-rows: 1fr;
}

@media (max-width: $bp-tablet) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 6px;
  }
}

@media (max-width: $bp-mobile) {
  .video-grid {
    grid-template-columns: 1fr !important;
    gap: 4px;
  }
}
</style>
