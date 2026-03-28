<template>
  <div class="speaker-view">
    <!-- Grand speaker principal -->
    <div class="speaker-view__main">
      <VideoTile
        v-if="mainSpeaker"
        :participant="mainSpeaker"
        :large="true"
        :clickable="true"
        :stream="streams[mainSpeaker.id] || null"
        :is-local="mainSpeaker.id === localUserId"
      />
    </div>

    <!-- Vignettes des autres participants -->
    <div class="speaker-view__thumbnails">
      <div
        v-for="participant in otherParticipants"
        :key="participant.id"
        class="speaker-view__thumb"
      >
        <VideoTile
          :participant="participant"
          :clickable="true"
          :stream="streams[participant.id] || null"
          :is-local="participant.id === localUserId"
          @click="$emit('pin', participant.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VideoTile from './VideoTile.vue'

const props = defineProps({
  participants: { type: Array, required: true },
  pinnedId: { type: [Number, String, null], default: null },
  activeSpeaker: { type: Object, default: null },
  streams: { type: Object, default: () => ({}) },
  localUserId: { type: [Number, String], default: null }
})

defineEmits(['pin'])

const mainSpeaker = computed(() => {
  if (props.pinnedId) {
    return props.participants.find(p => p.id === props.pinnedId) || props.activeSpeaker
  }
  return props.activeSpeaker
})

const otherParticipants = computed(() => {
  const mainId = mainSpeaker.value?.id
  return props.participants.filter(p => p.id !== mainId)
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.speaker-view {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;

  &__main {
    flex: 1;
  }

  &__thumbnails {
    display: flex;
    gap: 8px;
    height: 120px;
  }

  &__thumb {
    flex: 1;
    max-width: 180px;
  }
}

@media (max-width: $bp-tablet) {
  .speaker-view {
    gap: 6px;

    &__thumbnails {
      height: 90px;
      gap: 4px;
      overflow-x: auto;
    }

    &__thumb {
      min-width: 120px;
      max-width: 140px;
    }
  }
}

@media (max-width: $bp-mobile) {
  .speaker-view {
    &__thumbnails {
      height: 70px;
    }

    &__thumb {
      min-width: 90px;
      max-width: 110px;
    }
  }
}
</style>
