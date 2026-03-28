<template>
  <Transition name="loader-fade">
    <div v-if="visible" class="loader">
      <div class="loader__content">
        <!-- Drapeau anime -->
        <div class="loader__flag">
          <div class="loader__flag-stripe loader__flag-stripe--orange" />
          <div class="loader__flag-stripe loader__flag-stripe--white" />
          <div class="loader__flag-stripe loader__flag-stripe--green" />
        </div>

        <!-- Logo -->
        <h1 class="loader__title">
          Kouman<span class="loader__title--accent">CI</span>
        </h1>

        <!-- Barre de chargement -->
        <div class="loader__bar-track">
          <div class="loader__bar-fill" />
        </div>

        <!-- Sous-titre -->
        <p class="loader__subtitle">Connexion en cours...</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: true }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $dark-bg;

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  // --- Drapeau avec animation d'entree ---
  &__flag {
    display: flex;
    width: 64px;
    height: 40px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid $border;
    animation: flag-pulse 2s ease-in-out infinite;
  }

  &__flag-stripe {
    flex: 1;
    animation: stripe-grow 0.6s ease-out both;

    &--orange {
      background: $ci-orange;
      animation-delay: 0.1s;
    }
    &--white {
      background: #FFF;
      animation-delay: 0.25s;
    }
    &--green {
      background: $ci-green;
      animation-delay: 0.4s;
    }
  }

  // --- Logo ---
  &__title {
    font-size: 36px;
    font-weight: 800;
    color: $text-primary;
    letter-spacing: -1.5px;
    animation: title-in 0.5s ease-out 0.5s both;

    &--accent {
      color: $ci-orange;
    }
  }

  // --- Barre de chargement ---
  &__bar-track {
    width: 180px;
    height: 3px;
    border-radius: 3px;
    background: $border;
    overflow: hidden;
    animation: title-in 0.4s ease-out 0.7s both;
  }

  &__bar-fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, $ci-orange, $ci-green);
    animation: bar-loading 1.5s ease-in-out infinite;
  }

  // --- Sous-titre ---
  &__subtitle {
    font-size: 12px;
    color: $text-dim;
    letter-spacing: 1px;
    animation: title-in 0.4s ease-out 0.9s both;
  }
}

// --- Animations ---
@keyframes stripe-grow {
  from {
    transform: scaleY(0);
    opacity: 0;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}

@keyframes flag-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba($ci-orange, 0); }
  50% { box-shadow: 0 0 20px 2px rgba($ci-orange, 0.15); }
}

@keyframes title-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bar-loading {
  0% { width: 0; margin-left: 0; }
  50% { width: 70%; margin-left: 15%; }
  100% { width: 0; margin-left: 100%; }
}

// --- Transition de sortie ---
.loader-fade-leave-active {
  transition: opacity 0.4s ease;
}

.loader-fade-leave-to {
  opacity: 0;
}

@media (max-width: $bp-mobile) {
  .loader {
    &__flag {
      width: 48px;
      height: 30px;
    }

    &__title {
      font-size: 28px;
    }

    &__bar-track {
      width: 140px;
    }

    &__subtitle {
      font-size: 10px;
    }
  }
}
</style>
