<template>
  <div v-if="rooms.length > 0" class="recent-rooms">
    <p class="recent-rooms__label">Reunions recentes</p>
    <div
      v-for="room in rooms"
      :key="room.code"
      class="recent-rooms__item"
      @click="$emit('join', room.code)"
    >
      <div class="recent-rooms__info">
        <p class="recent-rooms__name">{{ room.name }}</p>
        <p class="recent-rooms__meta">
          {{ room.code }} — {{ room.participants }} participants — {{ room.date }}
        </p>
      </div>
      <ChevronRight :size="14" class="recent-rooms__arrow" />
    </div>
  </div>
</template>

<script setup>
import { ChevronRight } from 'lucide-vue-next'

defineProps({
  rooms: { type: Array, required: true }
})

defineEmits(['join'])
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.recent-rooms {
  margin-top: 36px;
  text-align: left;

  &__label {
    font-size: 10px;
    color: $text-dim;
    margin: 0 0 12px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  &__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-radius: 12px;
    cursor: pointer;
    background: $card;
    border: 1px solid $border;
    margin-bottom: 8px;
    transition: all $transition-fast;

    &:hover {
      border-color: $ci-orange;
      transform: translateX(4px);
    }
  }

  &__name {
    font-size: 13px;
    font-weight: 600;
    color: $text-primary;
    margin: 0 0 2px;
  }

  &__meta {
    font-size: 10px;
    color: $text-secondary;
    margin: 0;
  }

  &__arrow {
    font-size: 12px;
    color: $ci-orange;
  }
}
</style>
