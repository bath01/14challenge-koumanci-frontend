<template>
  <div class="participants-panel">
    <div
      v-for="participant in participants"
      :key="participant.id"
      class="participants-panel__item"
      :class="{ 'participants-panel__item--speaking': participant.isSpeaking }"
    >
      <div class="participants-panel__info">
        <img
          v-if="participant.avatarUrl"
          :src="participant.avatarUrl"
          class="participants-panel__avatar-photo"
          :class="{ 'participants-panel__avatar--speaking': participant.isSpeaking }"
        />
        <div
          v-else
          class="participants-panel__avatar"
          :style="{ background: gradient(participant.username) }"
          :class="{ 'participants-panel__avatar--speaking': participant.isSpeaking }"
        >
          {{ getInitials(participant) }}
        </div>
        <div class="participants-panel__details">
          <div class="participants-panel__name-row">
            <span class="participants-panel__name">{{ participant.username }}</span>
            <span v-if="participant.isHost" class="participants-panel__host-badge">HOTE</span>
          </div>
          <div class="participants-panel__status">
            <MicOff v-if="participant.isMuted" :size="12" class="participants-panel__status-icon" />
            <VideoOff v-if="participant.isCameraOff" :size="12" class="participants-panel__status-icon" />
            <AudioLines v-if="participant.isSpeaking" :size="12" class="participants-panel__status-icon participants-panel__status-icon--speaking" />
          </div>
        </div>
      </div>

      <!-- Actions hote (visible uniquement pour les autres participants) -->
      <div v-if="!isCurrentUser(participant.id)" class="participants-panel__actions">
        <button
          class="participants-panel__action-btn"
          :class="{ 'participants-panel__action-btn--muted': participant.isMuted }"
          @click="$emit('toggle-mute', participant.id)"
        >
          <MicOff v-if="participant.isMuted" :size="12" />
          <Mic v-else :size="12" />
        </button>
        <button
          class="participants-panel__action-btn participants-panel__action-btn--remove"
          @click="$emit('remove', participant.id)"
        >
          <X :size="12" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Mic, MicOff, VideoOff, AudioLines, X } from 'lucide-vue-next'
import { useGradient } from '@/composables/useGradient'

defineProps({
  participants: { type: Array, required: true },
  currentUserId: { type: [Number, String], required: true }
})

defineEmits(['toggle-mute', 'remove'])

const { generateGradient } = useGradient()

function gradient(name) {
  return generateGradient(name)
}

function getInitials(participant) {
  return participant.avatar ||
    participant.username.split(' ').map(w => w[0]).slice(0, 2).join('')
}

function isCurrentUser(id) {
  return id === 1
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.participants-panel {
  flex: 1;
  overflow-y: auto;
  padding: 14px;

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: $radius-md;
    margin-bottom: 4px;
    transition: all $transition-fast;

    &--speaking {
      background: rgba($ci-green, 0.03);
    }
  }

  &__info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.8);
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;

    &--speaking {
      border: 2px solid $ci-green;
    }
  }

  &__avatar-photo {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__name-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__name {
    font-size: 12px;
    font-weight: 600;
    color: $text-primary;
  }

  &__host-badge {
    font-size: 8px;
    padding: 1px 5px;
    border-radius: 3px;
    background: $ci-orange;
    color: #FFF;
    font-weight: 700;
  }

  &__status {
    display: flex;
    gap: 6px;
    margin-top: 2px;
    align-items: center;
  }

  &__status-icon {
    color: $text-dim;

    &--speaking {
      color: $ci-green;
    }
  }

  &__actions {
    display: flex;
    gap: 4px;
  }

  &__action-btn {
    background: $card;
    border: 1px solid $border;
    border-radius: $radius-sm;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-secondary;

    &--muted {
      color: $danger;
    }

    &--remove {
      color: $danger;
    }
  }
}
</style>
