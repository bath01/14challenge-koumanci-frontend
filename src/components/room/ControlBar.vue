<template>
  <div class="control-bar">
    <!-- Info gauche : code room -->
    <div class="control-bar__left">
      <span class="control-bar__room-info">
        Room: <span class="control-bar__room-code">{{ roomCode }}</span>
      </span>
    </div>

    <!-- Controles centraux -->
    <div class="control-bar__center">
      <!-- Micro -->
      <button
        class="control-bar__btn"
        :class="{ 'control-bar__btn--danger': isMuted }"
        @click="$emit('toggle-mute')"
      >
        <MicOff v-if="isMuted" :size="20" />
        <Mic v-else :size="20" />
      </button>

      <!-- Camera -->
      <button
        class="control-bar__btn"
        :class="{ 'control-bar__btn--danger': isCameraOff }"
        @click="$emit('toggle-camera')"
      >
        <VideoOff v-if="isCameraOff" :size="20" />
        <Video v-else :size="20" />
      </button>

      <!-- Partage ecran -->
      <button
        class="control-bar__btn"
        :class="{ 'control-bar__btn--active-orange': isScreenSharing }"
        @click="$emit('toggle-screen')"
      >
        <ScreenShare :size="20" />
      </button>

      <!-- Chat -->
      <button
        class="control-bar__btn"
        :class="{ 'control-bar__btn--active-green': isChatOpen }"
        @click="$emit('toggle-chat')"
      >
        <MessageSquare :size="20" />
      </button>

      <!-- Participants -->
      <button
        class="control-bar__btn"
        :class="{ 'control-bar__btn--active-green': isParticipantsOpen }"
        @click="$emit('toggle-participants')"
      >
        <Users :size="20" />
      </button>

      <!-- Quitter -->
      <button class="control-bar__btn control-bar__btn--leave" @click="$emit('leave')">
        <PhoneOff :size="20" />
      </button>
    </div>

    <!-- Actions droite -->
    <div class="control-bar__right">
      <button class="control-bar__settings-btn">
        <Settings :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup>
import {
  Mic, MicOff, Video, VideoOff, ScreenShare,
  MessageSquare, Users, PhoneOff, Settings
} from 'lucide-vue-next'

defineProps({
  roomCode: { type: String, required: true },
  isMuted: { type: Boolean, default: false },
  isCameraOff: { type: Boolean, default: false },
  isScreenSharing: { type: Boolean, default: false },
  isChatOpen: { type: Boolean, default: false },
  isParticipantsOpen: { type: Boolean, default: false }
})

defineEmits([
  'toggle-mute', 'toggle-camera', 'toggle-screen',
  'toggle-chat', 'toggle-participants', 'leave'
])
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.control-bar {
  height: 72px;
  padding: 0 24px;
  background: rgba($dark-bg, 0.95);
  border-top: 1px solid $border;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__room-info {
    font-size: 11px;
    color: $text-secondary;
  }

  &__room-code {
    color: $ci-orange;
    font-weight: 600;
  }

  &__center {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__btn {
    width: 48px;
    height: 48px;
    border-radius: $radius-lg;
    border: 1px solid $border;
    background: $card;
    color: $text-primary;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;

    &--danger {
      background: $danger;
      border-color: $danger;
      color: #FFF;
    }

    &--active-orange {
      background: rgba($ci-orange, 0.12);
      border-color: $ci-orange;
      color: $ci-orange;
    }

    &--active-green {
      background: rgba($ci-green, 0.12);
      border-color: $ci-green;
      color: $ci-green;
    }

    &--leave {
      background: $danger;
      border: none;
      color: #FFF;
      box-shadow: 0 4px 12px rgba($danger, 0.3);
      margin-left: 8px;
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__settings-btn {
    padding: 10px;
    border-radius: 8px;
    border: 1px solid $border;
    background: transparent;
    color: $text-secondary;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@media (max-width: $bp-tablet) {
  .control-bar {
    height: 64px;
    padding: 0 12px;

    &__left {
      display: none;
    }

    &__right {
      display: none;
    }

    &__center {
      width: 100%;
      justify-content: center;
      gap: 8px;
    }

    &__btn {
      width: 42px;
      height: 42px;
      border-radius: 12px;

    }
  }
}

@media (max-width: $bp-mobile) {
  .control-bar {
    height: 56px;

    &__center {
      gap: 6px;
    }

    &__btn {
      width: 38px;
      height: 38px;
      border-radius: 10px;
    }
  }
}
</style>
