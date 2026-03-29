<template>
  <div class="auth">
    <div class="auth__container">
      <!-- Header -->
      <div class="auth__header">
        <FlagBar :width="48" :height="4" />
        <h1 class="auth__title">
          Kouman<span class="auth__title--accent">CI</span>
        </h1>
        <p class="auth__subtitle">Cree ton compte pour commencer</p>
      </div>

      <!-- Formulaire -->
      <form class="auth__form" @submit.prevent="handleRegister">
        <!-- Erreur globale -->
        <div v-if="authStore.error" class="auth__error">
          <AlertCircle :size="16" />
          <span>{{ authStore.error }}</span>
        </div>

        <div class="auth__field">
          <label class="auth__label">Nom complet</label>
          <div class="auth__input-wrapper">
            <User :size="16" class="auth__input-icon" />
            <input
              v-model="fullName"
              type="text"
              class="auth__input"
              placeholder="Ton nom complet"
              required
              autocomplete="name"
            />
          </div>
        </div>

        <div class="auth__field">
          <label class="auth__label">Email</label>
          <div class="auth__input-wrapper">
            <Mail :size="16" class="auth__input-icon" />
            <input
              v-model="email"
              type="email"
              class="auth__input"
              placeholder="ton@email.com"
              required
              autocomplete="email"
            />
          </div>
        </div>

        <div class="auth__field">
          <label class="auth__label">Mot de passe</label>
          <div class="auth__input-wrapper">
            <Lock :size="16" class="auth__input-icon" />
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="auth__input auth__input--with-action"
              placeholder="Minimum 8 caracteres"
              required
              minlength="8"
              autocomplete="new-password"
            />
            <button
              type="button"
              class="auth__input-action"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" :size="16" />
              <Eye v-else :size="16" />
            </button>
          </div>
        </div>

        <div class="auth__field">
          <label class="auth__label">Confirmer le mot de passe</label>
          <div class="auth__input-wrapper">
            <Lock :size="16" class="auth__input-icon" />
            <input
              v-model="passwordConfirmation"
              :type="showPassword ? 'text' : 'password'"
              class="auth__input"
              :class="{ 'auth__input--error': passwordMismatch }"
              placeholder="Confirme ton mot de passe"
              required
              minlength="8"
              autocomplete="new-password"
            />
          </div>
          <span v-if="passwordMismatch" class="auth__field-error">
            Les mots de passe ne correspondent pas
          </span>
        </div>

        <button
          type="submit"
          class="auth__btn-submit"
          :disabled="authStore.loading || passwordMismatch"
        >
          <Loader2 v-if="authStore.loading" :size="18" class="auth__spinner" />
          <UserPlus v-else :size="18" />
          {{ authStore.loading ? 'Inscription...' : 'Creer mon compte' }}
        </button>
      </form>

      <!-- Lien vers connexion -->
      <div class="auth__footer">
        <p class="auth__footer-text">
          Deja un compte ?
          <router-link to="/login" class="auth__link">Se connecter</router-link>
        </p>
      </div>

      <!-- Footer KoumanCI -->
      <div class="auth__branding">
        <FlagBar :width="32" :height="3" />
        <p class="auth__branding-text">CHALLENGE 14-14-14 // JOUR 14 // MARS 2026</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  User, Mail, Lock, Eye, EyeOff,
  UserPlus, Loader2, AlertCircle
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import FlagBar from '@/components/common/FlagBar.vue'

const router = useRouter()
const authStore = useAuthStore()

const fullName = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)

const passwordMismatch = computed(() => {
  return passwordConfirmation.value.length > 0 && password.value !== passwordConfirmation.value
})

onMounted(() => {
  authStore.clearError()
  if (authStore.isAuthenticated) {
    router.push({ name: 'home' })
  }
})

async function handleRegister() {
  if (passwordMismatch.value) return

  try {
    await authStore.register({
      fullName: fullName.value,
      email: email.value,
      password: password.value,
      passwordConfirmation: passwordConfirmation.value
    })
    // Si le backend renvoie un token apres inscription, on redirige vers home
    // Sinon, on redirige vers login
    if (authStore.isAuthenticated) {
      router.push({ name: 'home' })
    } else {
      router.push({ name: 'login' })
    }
  } catch {
    // L'erreur est geree dans le store
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.auth {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $dark-bg 0%, $surface 50%, rgba($ci-orange, 0.02) 100%);
  padding: 32px;

  &__container {
    max-width: 440px;
    width: 100%;
  }

  &__header {
    text-align: center;
    margin-bottom: 36px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  &__title {
    font-size: 36px;
    font-weight: 800;
    color: $text-primary;
    letter-spacing: -1.5px;
    margin: 8px 0 0;

    &--accent {
      color: $ci-orange;
    }
  }

  &__subtitle {
    font-size: 14px;
    color: $text-secondary;
    margin: 0;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: $radius-md;
    background: rgba($danger, 0.1);
    border: 1px solid rgba($danger, 0.25);
    color: $danger;
    font-size: 13px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__label {
    font-size: 10px;
    color: $text-dim;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  &__field-error {
    font-size: 11px;
    color: $danger;
  }

  &__input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__input-icon {
    position: absolute;
    left: 14px;
    color: $text-dim;
    pointer-events: none;
  }

  &__input {
    width: 100%;
    padding: 14px 16px 14px 42px;
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

    &--with-action {
      padding-right: 44px;
    }

    &--error {
      border-color: $danger;
    }
  }

  &__input-action {
    position: absolute;
    right: 10px;
    width: 32px;
    height: 32px;
    border-radius: $radius-sm;
    border: none;
    background: transparent;
    color: $text-dim;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: color $transition-fast;

    &:hover {
      color: $text-secondary;
    }
  }

  &__btn-submit {
    width: 100%;
    padding: 16px 28px;
    border-radius: $radius-lg;
    border: none;
    background: linear-gradient(135deg, $ci-green, #00C05B);
    color: #FFF;
    font-size: 15px;
    font-weight: 700;
    box-shadow: 0 6px 24px rgba($ci-green, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: opacity $transition-fast;
    margin-top: 4px;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__spinner {
    animation: spin 1s linear infinite;
  }

  &__footer {
    text-align: center;
    margin-top: 24px;
  }

  &__footer-text {
    font-size: 13px;
    color: $text-secondary;
  }

  &__link {
    color: $ci-orange;
    text-decoration: none;
    font-weight: 600;
    transition: opacity $transition-fast;

    &:hover {
      opacity: 0.8;
    }
  }

  &__branding {
    margin-top: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__branding-text {
    font-size: 10px;
    color: $text-dim;
    margin: 8px 0 0;
    letter-spacing: 1px;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: $bp-tablet) {
  .auth {
    padding: 20px 16px;

    &__title {
      font-size: 28px;
    }

    &__input {
      font-size: 16px;
    }
  }
}

@media (max-width: $bp-mobile) {
  .auth {
    padding: 16px 12px;

    &__title {
      font-size: 24px;
    }
  }
}
</style>
