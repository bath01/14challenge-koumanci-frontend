<template>
  <div class="home">
    <div class="home__container">
      <!-- Logo -->
      <div class="home__logo-wrapper">
        <FlagBar :width="48" :height="4" />
      </div>
      <h1 class="home__title">
        Kouman<span class="home__title--accent">CI</span>
      </h1>
      <p class="home__subtitle">
        Visioconference peer-to-peer — Parle, partage, collabore
      </p>

      <!-- Barre utilisateur connecte -->
      <div class="home__user-bar">
        <span class="home__user-greeting">Salut, {{ authStore.user?.fullName || username || 'toi' }}</span>
        <div class="home__user-actions">
          <router-link to="/profile" class="home__user-link">
            <UserIcon :size="14" /> Profil
          </router-link>
          <button class="home__user-logout" @click="handleLogout">
            <LogOut :size="14" /> Quitter
          </button>
        </div>
      </div>

      <!-- Photo de profil -->
      <div class="home__avatar-section">
        <div
          class="home__avatar"
          :style="avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : { background: avatarGradient }"
          @click="triggerFileInput"
        >
          <template v-if="!avatarUrl">
            {{ userStore.getInitials(username || '?') }}
          </template>
          <div class="home__avatar-overlay">
            <Camera :size="20" />
          </div>
          <!-- Bouton supprimer -->
          <button
            v-if="avatarUrl"
            class="home__avatar-remove"
            @click.stop="removeAvatar"
          >
            <X :size="12" />
          </button>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="home__avatar-input"
          @change="handleFileSelect"
        />
        <p class="home__avatar-hint">Clique pour ajouter ta photo</p>
      </div>

      <!-- Nom d'utilisateur -->
      <div class="home__field">
        <label class="home__label">Ton nom</label>
        <input
          v-model="username"
          class="home__input"
          placeholder="Entrer ton nom..."
          @input="userStore.setUsername(username)"
        />
      </div>

      <!-- Creer une room -->
      <button class="home__btn-create" @click="createRoom" :disabled="creatingRoom">
        <Loader2 v-if="creatingRoom" :size="18" class="home__spinner" />
        <Video v-else :size="18" />
        {{ creatingRoom ? 'Creation...' : 'Creer une reunion' }}
      </button>

      <!-- Separateur -->
      <div class="home__divider">
        <div class="home__divider-line" />
        <span class="home__divider-text">ou</span>
        <div class="home__divider-line" />
      </div>

      <!-- Rejoindre une room -->
      <div class="home__join">
        <input
          v-model="joinCode"
          class="home__input home__input--join"
          placeholder="Entrer le code (ex: KCI-ABCD)"
          @keydown.enter="joinRoom"
        />
        <button class="home__btn-join" @click="joinRoom">
          <LogIn :size="14" /> Rejoindre
        </button>
      </div>

      <!-- Reunions recentes -->
      <RecentRooms :rooms="recentRooms" @join="handleJoinRecent" />

      <!-- Footer -->
      <div class="home__footer">
        <FlagBar :width="32" :height="3" />
        <p class="home__footer-text">
          CHALLENGE 14-14-14 // JOUR 14 // MARS 2026
        </p>
      </div>
    </div>

    <!-- Bouton A propos -->
    <div class="home__about-btn-wrapper">
      <router-link to="/about" class="home__about-btn">
        <Info :size="13" /> A propos
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Video, LogIn, Info, Camera, X, User as UserIcon, LogOut, Loader2 } from 'lucide-vue-next'
import { useGradient } from '@/composables/useGradient'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { roomApi } from '@/services/api'
import FlagBar from '@/components/common/FlagBar.vue'
import RecentRooms from '@/components/home/RecentRooms.vue'

const router = useRouter()
const userStore = useUserStore()
const authStore = useAuthStore()
const { generateGradient } = useGradient()

const username = ref(userStore.username)
const avatarUrl = ref(userStore.avatarUrl)
const joinCode = ref('')
const fileInput = ref(null)
const creatingRoom = ref(false)

const avatarGradient = 'linear-gradient(135deg, #FF8C00, #009E49)'

// Reunions recentes chargees depuis l'API
const recentRooms = ref([])

onMounted(async () => {
  // Charger le profil si pas encore fait
  if (!authStore.user) {
    await authStore.fetchProfile()
  }
  if (authStore.user?.fullName) {
    username.value = authStore.user.fullName
  } else if (userStore.username) {
    username.value = userStore.username
  }

  // Charger la liste des rooms depuis l'API
  await loadRooms()
})

async function loadRooms() {
  try {
    const rooms = await roomApi.list()
    // Adapter le format pour le composant RecentRooms
    recentRooms.value = (rooms.data || rooms || []).map(room => ({
      code: room.code,
      name: room.name || 'Sans nom',
      participants: room.participantCount || room.participants?.length || 0,
      date: new Date(room.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }))
  } catch {
    // Si erreur, afficher une liste vide
    recentRooms.value = []
  }
}

async function createRoom() {
  if (!username.value.trim() || creatingRoom.value) return
  userStore.setUsername(username.value.trim())
  creatingRoom.value = true
  try {
    const room = await roomApi.create({
      name: `Reunion de ${username.value.trim()}`,
      isPrivate: false,
      maxParticipants: 20
    })
    const code = room.code || room.data?.code
    router.push({ name: 'prejoin', params: { code } })
  } catch (err) {
    alert(err.message || 'Impossible de creer la reunion')
  } finally {
    creatingRoom.value = false
  }
}

function joinRoom() {
  if (!joinCode.value.trim() || !username.value.trim()) return
  userStore.setUsername(username.value.trim())
  router.push({ name: 'room', params: { code: joinCode.value.trim() } })
}

function handleJoinRecent(code) {
  if (!username.value.trim()) return
  userStore.setUsername(username.value.trim())
  router.push({ name: 'prejoin', params: { code } })
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  // Redimensionner l'image pour ne pas surcharger le localStorage
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 200
      canvas.width = size
      canvas.height = size

      const ctx = canvas.getContext('2d')
      // Recadrer au centre (crop carre)
      const min = Math.min(img.width, img.height)
      const sx = (img.width - min) / 2
      const sy = (img.height - min) / 2
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      avatarUrl.value = dataUrl
      userStore.setAvatar(dataUrl)
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
  // Reset input pour pouvoir selectionner le meme fichier
  event.target.value = ''
}

function removeAvatar() {
  avatarUrl.value = ''
  userStore.removeAvatar()
}

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.home {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $dark-bg 0%, $surface 50%, rgba($ci-orange, 0.02) 100%);
  padding: 32px;

  &__container {
    max-width: 500px;
    width: 100%;
    text-align: center;
  }

  &__logo-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 42px;
    font-weight: 800;
    color: $text-primary;
    margin: 0 0 8px;
    letter-spacing: -1.5px;

    &--accent {
      color: $ci-orange;
    }
  }

  &__subtitle {
    font-size: 15px;
    color: $text-secondary;
    margin: 0 0 16px;
  }

  &__user-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: $card;
    border: 1px solid $border;
    border-radius: $radius-md;
    padding: 10px 16px;
    margin-bottom: 28px;
  }

  &__user-greeting {
    font-size: 13px;
    color: $text-secondary;
    font-weight: 500;
  }

  &__user-actions {
    display: flex;
    gap: 8px;
  }

  &__user-link {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: $radius-sm;
    border: 1px solid $border;
    background: transparent;
    color: $text-secondary;
    font-size: 11px;
    text-decoration: none;
    transition: all $transition-fast;

    &:hover {
      border-color: $ci-orange;
      color: $ci-orange;
    }
  }

  &__user-logout {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: $radius-sm;
    border: 1px solid rgba($danger, 0.3);
    background: transparent;
    color: $danger;
    font-size: 11px;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      border-color: $danger;
      background: rgba($danger, 0.08);
    }
  }

  &__spinner {
    animation: spin 1s linear infinite;
  }

  &__avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 24px;
  }

  &__avatar {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.85);
    font-size: 28px;
    font-weight: 700;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    border: 2px solid $border;
    background-size: cover;
    background-position: center;
    transition: border-color $transition-fast;

    &:hover {
      border-color: $ci-orange;
    }

    &:hover .home__avatar-overlay {
      opacity: 1;
    }
  }

  &__avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFF;
    opacity: 0;
    transition: opacity $transition-fast;
    backdrop-filter: blur(2px);
  }

  &__avatar-remove {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: $danger;
    border: 2px solid $dark-bg;
    color: #FFF;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    z-index: 2;
    opacity: 0;
    transition: opacity $transition-fast;

    .home__avatar:hover & {
      opacity: 1;
    }
  }

  &__avatar-input {
    display: none;
  }

  &__avatar-hint {
    font-size: 10px;
    color: $text-dim;
    margin-top: 8px;
  }

  &__field {
    margin-bottom: 24px;
  }

  &__label {
    font-size: 10px;
    color: $text-dim;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    display: block;
    text-align: left;
    margin-bottom: 6px;
  }

  &__input {
    width: 100%;
    padding: 14px 18px;
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

    &--join {
      flex: 1;

      &:focus {
        border-color: $ci-green;
      }
    }
  }

  &__btn-create {
    width: 100%;
    padding: 16px 28px;
    border-radius: $radius-lg;
    border: none;
    background: linear-gradient(135deg, $ci-orange, $ci-orange-light);
    color: #FFF;
    font-size: 15px;
    font-weight: 700;
    box-shadow: 0 6px 24px rgba($ci-orange, 0.25);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  &__divider {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  &__divider-line {
    flex: 1;
    height: 1px;
    background: $border;
  }

  &__divider-text {
    font-size: 12px;
    color: $text-dim;
  }

  &__join {
    display: flex;
    gap: 10px;
  }

  &__btn-join {
    padding: 14px 24px;
    border-radius: $radius-lg;
    border: 1px solid $ci-green;
    background: rgba($ci-green, 0.08);
    color: $ci-green;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__footer {
    margin-top: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__footer-text {
    font-size: 10px;
    color: $text-dim;
    margin: 8px 0 0;
    letter-spacing: 1px;
  }

  &__about-btn-wrapper {
    position: fixed;
    bottom: 16px;
    right: 16px;
  }

  &__about-btn {
    padding: 8px 16px;
    border-radius: $radius-md;
    border: 1px solid $border;
    background: rgba($dark-bg, 0.9);
    color: $text-secondary;
    font-size: 11px;
    text-decoration: none;
    backdrop-filter: blur(8px);
    transition: all $transition-fast;
    display: flex;
    align-items: center;
    gap: 5px;

    &:hover {
      border-color: $ci-orange;
      color: $ci-orange;
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// --- Responsive ---
@media (max-width: $bp-tablet) {
  .home {
    padding: 20px 16px;

    &__title {
      font-size: 32px;
    }

    &__subtitle {
      font-size: 13px;
      margin-bottom: 28px;
    }

    &__avatar {
      width: 72px;
      height: 72px;
      font-size: 22px;
    }

    &__input {
      padding: 12px 14px;
      font-size: 16px; // Evite le zoom iOS
    }

    &__btn-create {
      padding: 14px 20px;
      font-size: 14px;
    }

    &__btn-join {
      padding: 12px 16px;
      font-size: 12px;
    }

    &__join {
      flex-direction: column;
    }
  }
}

@media (max-width: $bp-mobile) {
  .home {
    padding: 16px 12px;

    &__title {
      font-size: 28px;
    }

    &__subtitle {
      font-size: 12px;
      margin-bottom: 24px;
    }

    &__avatar {
      width: 64px;
      height: 64px;
      font-size: 20px;
    }

    &__footer-text {
      font-size: 8px;
    }
  }
}
</style>
