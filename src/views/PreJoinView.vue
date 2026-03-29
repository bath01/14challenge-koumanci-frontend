<template>
  <div class="prejoin">
    <div class="prejoin__container">
      <!-- Header -->
      <div class="prejoin__header">
        <FlagBar :width="32" :height="3" />
        <h2 class="prejoin__title">
          Kouman<span class="prejoin__title--accent">CI</span>
        </h2>
        <p class="prejoin__subtitle">Verifier avant de rejoindre</p>
      </div>

      <!-- Preview video -->
      <div class="prejoin__preview">
        <video
          v-if="!media.isCameraOff.value"
          ref="videoEl"
          class="prejoin__video"
          autoplay
          playsinline
          muted
        />
        <div v-else class="prejoin__avatar" :style="{ background: avatarGradient }">
          <img v-if="userStore.avatarUrl" :src="userStore.avatarUrl" class="prejoin__avatar-photo" />
          <span v-else class="prejoin__avatar-initials">{{ userStore.getInitials() }}</span>
        </div>

        <!-- Controles sur la preview -->
        <div class="prejoin__controls">
          <button
            class="prejoin__ctrl-btn"
            :class="{ 'prejoin__ctrl-btn--danger': media.isMuted.value }"
            @click="media.toggleMute()"
          >
            <MicOff v-if="media.isMuted.value" :size="20" />
            <Mic v-else :size="20" />
          </button>
          <button
            class="prejoin__ctrl-btn"
            :class="{ 'prejoin__ctrl-btn--danger': media.isCameraOff.value }"
            @click="handleToggleCamera"
          >
            <VideoOff v-if="media.isCameraOff.value" :size="20" />
            <Video v-else :size="20" />
          </button>
        </div>

        <!-- Indicateur audio -->
        <div v-if="!media.isMuted.value" class="prejoin__audio-indicator">
          <div
            class="prejoin__audio-bar"
            v-for="i in 5"
            :key="i"
            :class="{ 'prejoin__audio-bar--active': voiceDetection.isSpeaking.value }"
            :style="{ animationDelay: `${i * 0.1}s` }"
          />
        </div>
      </div>

      <!-- Info room -->
      <div class="prejoin__room-info">
        <div class="prejoin__room-badge">
          <span class="prejoin__room-code">{{ code }}</span>
          <button class="prejoin__copy-btn" @click="copyCode">
            <Check v-if="copied" :size="14" />
            <Copy v-else :size="14" />
          </button>
        </div>
        <p class="prejoin__room-hint">Partage ce code pour inviter des participants</p>
      </div>

      <!-- Nom utilisateur -->
      <div class="prejoin__field">
        <label class="prejoin__label">Ton nom</label>
        <input
          v-model="username"
          class="prejoin__input"
          placeholder="Entrer ton nom..."
          @input="userStore.setUsername(username)"
        />
      </div>

      <!-- Boutons -->
      <div class="prejoin__actions">
        <!-- Erreur -->
        <div v-if="errorMsg" class="prejoin__error">{{ errorMsg }}</div>

        <button class="prejoin__btn-join" @click="joinRoom" :disabled="!username.trim() || joining">
          <Loader2 v-if="joining" :size="18" class="prejoin__spinner" />
          <LogIn v-else :size="18" />
          {{ joining ? 'Connexion...' : 'Rejoindre la reunion' }}
        </button>
        <button class="prejoin__btn-back" @click="goBack">
          <ArrowLeft :size="14" /> Retour
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Mic, MicOff, Video, VideoOff,
  LogIn, ArrowLeft, Copy, Check, Loader2
} from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { useMediaStream } from '@/composables/useMediaStream'
import { useVoiceDetection } from '@/composables/useVoiceDetection'
import { roomApi } from '@/services/api'
import FlagBar from '@/components/common/FlagBar.vue'

const props = defineProps({
  code: { type: String, required: true }
})

const router = useRouter()
const userStore = useUserStore()
const authStore = useAuthStore()
const media = useMediaStream()
const voiceDetection = useVoiceDetection()

const username = ref(userStore.username)
const videoEl = ref(null)
const copied = ref(false)
const joining = ref(false)
const roomInfo = ref(null)
const errorMsg = ref('')
const avatarGradient = 'linear-gradient(135deg, #FF8C00, #009E49)'

onMounted(async () => {
  if (!userStore.username) {
    router.push({ name: 'home' })
    return
  }

  // Charger les infos de la room depuis l'API
  try {
    roomInfo.value = await roomApi.getByCode(props.code)
  } catch {
    // La room n'existe peut-etre pas encore (creation en cours)
  }

  const stream = await media.startMedia()
  if (stream) {
    voiceDetection.start(stream)
  }
})

// Attacher le stream a la video preview
watch(
  [videoEl, () => media.localStream.value],
  ([el, stream]) => {
    if (el && stream) {
      el.srcObject = stream
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  voiceDetection.stop()
  media.stopMedia()
})

async function handleToggleCamera() {
  await media.toggleCamera()
  // Reattacher le stream apres reactivation de la camera
  if (!media.isCameraOff.value && videoEl.value && media.localStream.value) {
    videoEl.value.srcObject = media.localStream.value
  }
}

function copyCode() {
  navigator.clipboard.writeText(props.code)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

async function joinRoom() {
  if (!username.value.trim() || joining.value) return
  userStore.setUsername(username.value.trim())
  joining.value = true
  errorMsg.value = ''

  try {
    // Appeler l'API pour rejoindre la room
    await roomApi.join(props.code)
    // Stopper les streams ici, RoomView les redemarre
    voiceDetection.stop()
    media.stopMedia()
    router.push({ name: 'room', params: { code: props.code } })
  } catch (err) {
    errorMsg.value = err.message || 'Impossible de rejoindre la reunion'
    joining.value = false
  }
}

function goBack() {
  router.push({ name: 'home' })
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.prejoin {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $dark-bg 0%, $surface 50%, rgba($ci-orange, 0.02) 100%);
  padding: 32px;

  &__container {
    max-width: 480px;
    width: 100%;
  }

  &__header {
    text-align: center;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  &__title {
    font-size: 24px;
    font-weight: 800;
    color: $text-primary;
    letter-spacing: -1px;

    &--accent {
      color: $ci-orange;
    }
  }

  &__subtitle {
    font-size: 13px;
    color: $text-secondary;
    margin: 0;
  }

  // --- Preview video ---
  &__preview {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 10;
    border-radius: $radius-2xl;
    overflow: hidden;
    background: $card;
    border: 1px solid $border;
    margin-bottom: 20px;
  }

  &__video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
  }

  &__avatar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__avatar-photo {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.15);
  }

  &__avatar-initials {
    font-size: 48px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.8);
  }

  &__controls {
    position: absolute;
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
  }

  &__ctrl-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    color: #FFF;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all $transition-fast;

    &--danger {
      background: $danger;
    }
  }

  // --- Indicateur audio ---
  &__audio-indicator {
    position: absolute;
    bottom: 14px;
    right: 14px;
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 24px;
  }

  &__audio-bar {
    width: 4px;
    height: 6px;
    border-radius: 2px;
    background: $text-dim;
    transition: all 0.15s ease;

    &--active {
      background: $ci-green;
      animation: audio-bounce 0.5s ease-in-out infinite alternate;
    }
  }

  // --- Info room ---
  &__room-info {
    text-align: center;
    margin-bottom: 20px;
  }

  &__room-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: $card;
    border: 1px solid $border;
    border-radius: $radius-md;
    padding: 8px 14px;
  }

  &__room-code {
    font-size: 16px;
    font-weight: 700;
    color: $ci-orange;
    letter-spacing: 1px;
  }

  &__copy-btn {
    width: 28px;
    height: 28px;
    border-radius: $radius-sm;
    border: 1px solid $border;
    background: $surface;
    color: $text-secondary;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;

    &:hover {
      border-color: $ci-orange;
      color: $ci-orange;
    }
  }

  &__room-hint {
    font-size: 10px;
    color: $text-dim;
    margin: 8px 0 0;
  }

  // --- Champ nom ---
  &__field {
    margin-bottom: 16px;
  }

  &__label {
    font-size: 10px;
    color: $text-dim;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    display: block;
    margin-bottom: 6px;
  }

  &__input {
    width: 100%;
    padding: 12px 16px;
    border-radius: $radius-lg;
    background: $card;
    border: 1px solid $border;
    color: $text-primary;
    font-size: 14px;
    outline: none;
    transition: border $transition-fast;

    &:focus {
      border-color: $ci-orange;
    }
  }

  // --- Boutons ---
  &__actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__error {
    text-align: center;
    padding: 10px 16px;
    border-radius: $radius-md;
    background: rgba($danger, 0.1);
    border: 1px solid rgba($danger, 0.25);
    color: $danger;
    font-size: 12px;
  }

  &__spinner {
    animation: spin 1s linear infinite;
  }

  &__btn-join {
    width: 100%;
    padding: 14px 24px;
    border-radius: $radius-lg;
    border: none;
    background: linear-gradient(135deg, $ci-orange, $ci-orange-light);
    color: #FFF;
    font-size: 15px;
    font-weight: 700;
    box-shadow: 0 6px 24px rgba($ci-orange, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__btn-back {
    width: 100%;
    padding: 12px;
    border-radius: $radius-lg;
    border: 1px solid $border;
    background: transparent;
    color: $text-secondary;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
}

@keyframes audio-bounce {
  0% { height: 6px; }
  100% { height: 20px; }
}

@media (max-width: $bp-tablet) {
  .prejoin {
    padding: 20px 16px;

    &__preview {
      aspect-ratio: 4 / 3;
    }

    &__input {
      font-size: 16px;
    }
  }
}

@media (max-width: $bp-mobile) {
  .prejoin {
    padding: 16px 12px;

    &__title {
      font-size: 20px;
    }

    &__avatar-photo {
      width: 72px;
      height: 72px;
    }

    &__avatar-initials {
      font-size: 36px;
    }
  }
}
</style>
