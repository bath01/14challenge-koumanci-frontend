<template>
  <div
    class="video-tile"
    :class="{
      'video-tile--speaking': participant.isSpeaking,
      'video-tile--large': large,
      'video-tile--clickable': clickable,
      'video-tile--local': isLocal && !participant.isScreenSharing
    }"
    :style="{ background: participant.isCameraOff ? undefined : gradient }"
    @click="$emit('click', participant.id)"
  >
    <!-- Flux video reel : seulement si le stream a un track video actif -->
    <video
      v-if="hasActiveVideo"
      ref="videoEl"
      class="video-tile__stream"
      autoplay
      playsinline
      :muted="isLocal"
    />

    <!-- Photo ou initiales quand camera coupee / pas de video -->
    <div v-else-if="participant.isCameraOff || !hasActiveVideo" class="video-tile__avatar-wrapper">
      <img
        v-if="participant.avatarUrl"
        :src="participant.avatarUrl"
        class="video-tile__avatar-photo"
      />
      <div v-else class="video-tile__avatar" :style="{ background: gradient }">
        {{ initials }}
      </div>
    </div>

    <!-- Simulation video pour les participants sans stream -->
    <div v-else class="video-tile__video" :style="{ background: gradient }">
      <div class="video-tile__video-avatar">
        {{ initials }}
      </div>
    </div>

    <!-- Barre d'infos en bas -->
    <div class="video-tile__info">
      <div class="video-tile__name-badge">
        <div v-if="participant.isSpeaking" class="video-tile__speaking-dot" />
        <span class="video-tile__username">{{ participant.username }}</span>
        <span v-if="participant.isHost" class="video-tile__host-badge">HOTE</span>
      </div>
      <div class="video-tile__status-icons">
        <span v-if="participant.isMuted" class="video-tile__icon video-tile__icon--danger">
          <MicOff :size="12" />
        </span>
        <span v-if="participant.isCameraOff" class="video-tile__icon video-tile__icon--danger">
          <VideoOff :size="12" />
        </span>
        <span v-if="participant.isScreenSharing" class="video-tile__icon video-tile__icon--screen">
          <ScreenShare :size="12" />
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { MicOff, VideoOff, ScreenShare } from 'lucide-vue-next'
import { useGradient } from '@/composables/useGradient'

const props = defineProps({
  participant: { type: Object, required: true },
  large: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
  stream: { type: Object, default: null },
  isLocal: { type: Boolean, default: false }
})

defineEmits(['click'])

const { generateGradient } = useGradient()
const videoEl = ref(null)

const gradient = computed(() => generateGradient(props.participant.username))

// Verifie si le stream a au moins un track video vivant et actif
// On depend aussi de isCameraOff/isScreenSharing pour forcer la reactivite
// car MediaStream n'est pas un objet reactif Vue
const hasActiveVideo = computed(() => {
  // Lecture des props reactives pour forcer la reevaluation
  const cameraOff = props.participant.isCameraOff
  const screenSharing = props.participant.isScreenSharing

  if (!props.stream) return false
  if (cameraOff && !screenSharing) return false
  const videoTracks = props.stream.getVideoTracks()
  return videoTracks.length > 0 && videoTracks.some(t => t.readyState === 'live')
})

const initials = computed(() => {
  return props.participant.avatar ||
    props.participant.username
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
})

// Attacher le flux video des que l'element <video> et le stream sont disponibles
watch(
  [videoEl, () => props.stream],
  ([el, stream]) => {
    if (el && stream) {
      el.srcObject = stream
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.video-tile {
  border-radius: $radius-xl;
  overflow: hidden;
  position: relative;
  background: $card;
  border: 1px solid $border;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  transition: all $transition-normal;

  &--speaking {
    border: 2px solid $ci-green;
    box-shadow: 0 0 20px rgba($ci-green, 0.12);
  }

  &--large {
    min-height: 400px;
  }

  &--clickable {
    cursor: pointer;
  }

  &__avatar-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  &__avatar-photo {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.15);

    .video-tile--large & {
      width: 120px;
      height: 120px;
    }
  }

  &__avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.8);
    font-size: 20px;
    font-weight: 700;

    .video-tile--large & {
      width: 100px;
      height: 100px;
      font-size: 32px;
    }
  }

  &__stream {
    width: 100%;
    height: 100%;
    position: absolute;
    object-fit: cover;

    .video-tile--local & {
      transform: scaleX(-1);
    }
  }

  &__video {
    width: 100%;
    height: 100%;
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__video-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.8);
    font-size: 16px;
    font-weight: 700;

    .video-tile--large & {
      width: 80px;
      height: 80px;
      font-size: 28px;
    }
  }

  &__info {
    position: absolute;
    bottom: 8px;
    left: 8px;
    right: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__name-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 8px;
    padding: 4px 10px;
    backdrop-filter: blur(4px);
  }

  &__speaking-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $ci-green;
    box-shadow: 0 0 6px $ci-green;
    animation: pulse-speaking 1s ease-in-out infinite;
  }

  &__username {
    font-size: 11px;
    font-weight: 600;
    color: #FFF;
  }

  &__host-badge {
    font-size: 8px;
    padding: 1px 5px;
    border-radius: 4px;
    background: $ci-orange;
    color: #FFF;
    font-weight: 700;
  }

  &__status-icons {
    display: flex;
    gap: 4px;
  }

  &__icon {
    border-radius: $radius-sm;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;

    &--danger {
      background: rgba($danger, 0.8);
      color: #FFF;
    }

    &--screen {
      background: rgba($ci-orange, 0.8);
      color: #FFF;
    }
  }
}

@keyframes pulse-speaking {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.3); }
}

@media (max-width: $bp-tablet) {
  .video-tile {
    min-height: 120px;
    border-radius: 12px;

    &--large {
      min-height: 250px;
    }

    &__avatar {
      width: 48px;
      height: 48px;
      font-size: 16px;
    }

    &__avatar-photo {
      width: 56px;
      height: 56px;
    }

    &__video-avatar {
      width: 36px;
      height: 36px;
      font-size: 13px;
    }

    &__username {
      font-size: 10px;
    }

    &__name-badge {
      padding: 3px 7px;
      gap: 4px;
    }
  }
}

@media (max-width: $bp-mobile) {
  .video-tile {
    min-height: 100px;

    &--large {
      min-height: 180px;
    }

    &__avatar {
      width: 40px;
      height: 40px;
      font-size: 14px;
    }

    &__avatar-photo {
      width: 48px;
      height: 48px;
    }

    &__info {
      bottom: 4px;
      left: 4px;
      right: 4px;
    }

    &__username {
      font-size: 9px;
    }

    &__host-badge {
      font-size: 7px;
      padding: 1px 3px;
    }

    &__icon {
      padding: 2px;
    }
  }
}
</style>
