<template>
  <div class="profile">
    <div class="profile__container">
      <!-- Header -->
      <div class="profile__header">
        <button class="profile__back" @click="goBack">
          <ArrowLeft :size="18" />
        </button>
        <h2 class="profile__title">Mon profil</h2>
      </div>

      <!-- Loader -->
      <div v-if="authStore.loading" class="profile__loader">
        <Loader2 :size="32" class="profile__spinner" />
        <p class="profile__loader-text">Chargement du profil...</p>
      </div>

      <!-- Contenu profil -->
      <template v-else-if="authStore.user">
        <!-- Avatar et nom -->
        <div class="profile__card">
          <div
            class="profile__avatar"
            :style="userStore.avatarUrl
              ? { backgroundImage: `url(${userStore.avatarUrl})` }
              : { background: avatarGradient }"
          >
            <template v-if="!userStore.avatarUrl">
              {{ userStore.getInitials(authStore.user.fullName) }}
            </template>
          </div>

          <div class="profile__info">
            <h3 class="profile__name">{{ authStore.user.fullName }}</h3>
            <p class="profile__email">{{ authStore.user.email }}</p>
          </div>
        </div>

        <!-- Details du compte -->
        <div class="profile__section">
          <h4 class="profile__section-title">
            <UserIcon :size="16" />
            Informations du compte
          </h4>

          <div class="profile__detail">
            <span class="profile__detail-label">Nom complet</span>
            <span class="profile__detail-value">{{ authStore.user.fullName }}</span>
          </div>

          <div class="profile__detail">
            <span class="profile__detail-label">Email</span>
            <span class="profile__detail-value">{{ authStore.user.email }}</span>
          </div>

          <div v-if="authStore.user.createdAt" class="profile__detail">
            <span class="profile__detail-label">Membre depuis</span>
            <span class="profile__detail-value">{{ formatDate(authStore.user.createdAt) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="profile__actions">
          <button class="profile__btn-logout" @click="handleLogout">
            <LogOut :size="16" />
            Se deconnecter
          </button>
        </div>
      </template>

      <!-- Erreur -->
      <div v-else class="profile__empty">
        <AlertCircle :size="32" />
        <p>Impossible de charger le profil</p>
        <button class="profile__btn-retry" @click="loadProfile">Reessayer</button>
      </div>

      <!-- Footer -->
      <div class="profile__branding">
        <FlagBar :width="32" :height="3" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Loader2, LogOut, AlertCircle,
  User as UserIcon
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import FlagBar from '@/components/common/FlagBar.vue'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()

const avatarGradient = 'linear-gradient(135deg, #FF8C00, #009E49)'

onMounted(() => {
  loadProfile()
})

async function loadProfile() {
  await authStore.fetchProfile()
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}

function goBack() {
  router.push({ name: 'home' })
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.profile {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: linear-gradient(135deg, $dark-bg 0%, $surface 50%, rgba($ci-orange, 0.02) 100%);
  padding: 32px;

  &__container {
    max-width: 500px;
    width: 100%;
    padding-top: 24px;
  }

  // --- Header ---
  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
  }

  &__back {
    width: 40px;
    height: 40px;
    border-radius: $radius-md;
    border: 1px solid $border;
    background: $card;
    color: $text-secondary;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      border-color: $ci-orange;
      color: $ci-orange;
    }
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    color: $text-primary;
    margin: 0;
  }

  // --- Loader ---
  &__loader {
    text-align: center;
    padding: 48px 0;
  }

  &__spinner {
    color: $ci-orange;
    animation: spin 1s linear infinite;
  }

  &__loader-text {
    font-size: 13px;
    color: $text-secondary;
    margin-top: 12px;
  }

  // --- Card profil ---
  &__card {
    display: flex;
    align-items: center;
    gap: 20px;
    background: $card;
    border: 1px solid $border;
    border-radius: $radius-xl;
    padding: 24px;
    margin-bottom: 24px;
  }

  &__avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.85);
    font-size: 24px;
    font-weight: 700;
    flex-shrink: 0;
    background-size: cover;
    background-position: center;
    border: 2px solid $border;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 18px;
    font-weight: 700;
    color: $text-primary;
    margin: 0 0 4px;
  }

  &__email {
    font-size: 13px;
    color: $text-secondary;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // --- Section details ---
  &__section {
    background: $card;
    border: 1px solid $border;
    border-radius: $radius-xl;
    padding: 20px 24px;
    margin-bottom: 24px;
  }

  &__section-title {
    font-size: 12px;
    font-weight: 600;
    color: $text-secondary;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0 0 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__detail {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;

    & + & {
      border-top: 1px solid $border;
    }
  }

  &__detail-label {
    font-size: 13px;
    color: $text-dim;
  }

  &__detail-value {
    font-size: 13px;
    color: $text-primary;
    font-weight: 500;
  }

  // --- Actions ---
  &__actions {
    margin-bottom: 32px;
  }

  &__btn-logout {
    width: 100%;
    padding: 14px 24px;
    border-radius: $radius-lg;
    border: 1px solid rgba($danger, 0.3);
    background: rgba($danger, 0.08);
    color: $danger;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: rgba($danger, 0.15);
      border-color: $danger;
    }
  }

  // --- Erreur ---
  &__empty {
    text-align: center;
    padding: 48px 0;
    color: $text-secondary;

    p {
      margin: 12px 0 16px;
      font-size: 14px;
    }
  }

  &__btn-retry {
    padding: 10px 24px;
    border-radius: $radius-md;
    border: 1px solid $border;
    background: $card;
    color: $text-primary;
    font-size: 13px;
    cursor: pointer;
    transition: border-color $transition-fast;

    &:hover {
      border-color: $ci-orange;
    }
  }

  // --- Branding ---
  &__branding {
    display: flex;
    justify-content: center;
    padding-top: 16px;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: $bp-tablet) {
  .profile {
    padding: 20px 16px;

    &__card {
      padding: 16px;
    }

    &__avatar {
      width: 56px;
      height: 56px;
      font-size: 20px;
    }
  }
}
</style>
