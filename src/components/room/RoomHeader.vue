<template>
  <div class="room-header">
    <div class="room-header__left">
      <FlagBar :width="24" :height="3" />
      <span class="room-header__logo">
        Kouman<span class="room-header__logo--accent">CI</span>
      </span>
      <button class="room-header__code" @click="copyCode">
        {{ roomCode }}
        <Check v-if="copied" :size="10" />
        <Copy v-else :size="10" />
      </button>
    </div>

    <div class="room-header__right">
      <!-- Timer -->
      <div class="room-header__timer">
        <div class="room-header__timer-dot" />
        <span class="room-header__timer-text">{{ duration }}</span>
      </div>

      <!-- Nombre de participants -->
      <span class="room-header__participants">
        <Users :size="13" /> {{ participantCount }} participant{{ participantCount > 1 ? 's' : '' }}
      </span>

      <!-- Switch vue mode -->
      <div class="room-header__view-switch">
        <button
          class="room-header__view-btn"
          :class="{ 'room-header__view-btn--active': viewMode === 'grid' }"
          @click="$emit('set-view', 'grid')"
        >
          <LayoutGrid :size="13" /> Grille
        </button>
        <button
          class="room-header__view-btn"
          :class="{ 'room-header__view-btn--active': viewMode === 'speaker' }"
          @click="$emit('set-view', 'speaker')"
        >
          <MonitorSpeaker :size="13" /> Speaker
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Users, LayoutGrid, MonitorSpeaker, Copy, Check } from 'lucide-vue-next'
import FlagBar from '@/components/common/FlagBar.vue'

const props = defineProps({
  roomCode: { type: String, required: true },
  duration: { type: String, default: '00:00' },
  participantCount: { type: Number, default: 0 },
  viewMode: { type: String, default: 'grid' }
})

defineEmits(['set-view'])

const copied = ref(false)

function copyCode() {
  navigator.clipboard.writeText(props.roomCode)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.room-header {
  height: 52px;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba($dark-bg, 0.95);
  border-bottom: 1px solid $border;
  flex-shrink: 0;

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__logo {
    font-size: 15px;
    font-weight: 700;
    color: $text-primary;

    &--accent {
      color: $ci-orange;
    }
  }

  &__code {
    font-size: 10px;
    padding: 3px 10px;
    border-radius: $radius-sm;
    background: rgba($ci-orange, 0.08);
    border: 1px solid rgba($ci-orange, 0.15);
    color: $ci-orange;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: rgba($ci-orange, 0.15);
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__timer {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 8px;
    background: rgba($ci-green, 0.08);
  }

  &__timer-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $ci-green;
    box-shadow: 0 0 6px $ci-green;
  }

  &__timer-text {
    font-size: 12px;
    color: $ci-green;
    font-weight: 600;
  }

  &__participants {
    font-size: 11px;
    color: $text-secondary;
  }

  &__view-switch {
    display: flex;
    gap: 2px;
    background: $card;
    border-radius: 8px;
    padding: 2px;
  }

  &__view-btn {
    padding: 4px 10px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: $text-dim;
    font-size: 11px;
    font-weight: 500;

    &--active {
      background: rgba($ci-orange, 0.12);
      color: $ci-orange;
    }
  }
}

@media (max-width: $bp-tablet) {
  .room-header {
    height: 44px;
    padding: 0 12px;

    &__left {
      gap: 8px;
    }

    &__logo {
      font-size: 13px;
    }

    &__code {
      display: none;
    }

    &__right {
      gap: 8px;
    }

    &__participants {
      font-size: 10px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    &__timer {
      padding: 3px 8px;
    }

    &__timer-text {
      font-size: 11px;
    }

    &__view-switch {
      display: none;
    }
  }
}
</style>
