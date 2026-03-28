<template>
  <div class="about">
    <!-- Navigation -->
    <nav class="about__nav">
      <router-link to="/" class="about__nav-logo">
        <FlagBar />
        <span class="about__nav-title">
          Kouman<span class="about__nav-title--accent">CI</span>
        </span>
      </router-link>
      <router-link to="/" class="about__nav-back">
        <ArrowLeft :size="14" /> Retour
      </router-link>
    </nav>

    <div class="about__content">
      <!-- Description principale -->
      <div class="about__card about__card--main">
        <div class="about__flag-icon">
          <div class="about__flag-stripe about__flag-stripe--orange" />
          <div class="about__flag-stripe about__flag-stripe--white" />
          <div class="about__flag-stripe about__flag-stripe--green" />
        </div>

        <h2 class="about__heading">KoumanCI</h2>
        <p class="about__text">
          Jour 14 du Challenge 14-14-14. KoumanCI est une application de visioconference
          peer-to-peer. "Kouman" signifie "parler" en nouchi, l'argot populaire ivoirien.
        </p>
        <p class="about__text">
          Creer une room, partager le code, et communiquer en video, audio et chat.
          Partage d'ecran, gestion des participants, mode grille ou speaker view.
        </p>
      </div>

      <!-- Equipe + Stack -->
      <div class="about__grid">
        <!-- Equipe -->
        <div class="about__card">
          <p class="about__card-label">L'equipe</p>
          <div
            v-for="(member, index) in team"
            :key="index"
            class="about__member"
          >
            <div class="about__member-avatar">
              {{ member.initials }}
            </div>
            <div>
              <p class="about__member-name">{{ member.name }}</p>
              <p class="about__member-role">{{ member.role }}</p>
            </div>
          </div>
        </div>

        <!-- Stack technique -->
        <div class="about__card">
          <p class="about__card-label">Stack technique</p>
          <div
            v-for="(tech, index) in stack"
            :key="index"
            class="about__tech-item"
          >
            <span class="about__tech-name">{{ tech }}</span>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="about__stats">
        <div
          v-for="(stat, index) in stats"
          :key="index"
          class="about__stat"
        >
          <p class="about__stat-value" :class="index % 2 === 0 ? 'about__stat-value--orange' : 'about__stat-value--green'">
            {{ stat.value }}
          </p>
          <p class="about__stat-label">{{ stat.label }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="about__footer-card">
        <p class="about__footer-text">
          Open Source sur <span class="about__footer-link--orange">225os.com</span> &amp;
          <span class="about__footer-link--green">GitHub</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from 'lucide-vue-next'
import FlagBar from '@/components/common/FlagBar.vue'

const team = [
  { name: 'Bath Dorgeles', role: 'Chef de projet & Front', initials: 'BD' },
  { name: 'Oclin Marcel C.', role: 'Dev Front-end (Vue.js)', initials: 'MC' },
  { name: 'Rayane Irie', role: 'Back-end (AdonisJS + WebRTC)', initials: 'RI' }
]

const stack = ['Vue.js', 'AdonisJS', 'WebSocket', 'WebRTC (STUN/TURN)', 'Peer-to-Peer']

const stats = [
  { value: 'P2P', label: 'Architecture' },
  { value: '6', label: 'Max participants' },
  { value: '2', label: 'Modes vue' },
  { value: '∞', label: 'Duree' }
]
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.about {
  min-height: 100vh;
  background: $dark-bg;
  display: flex;
  flex-direction: column;

  &__nav {
    padding: 0 32px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid $border;
  }

  &__nav-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    cursor: pointer;
  }

  &__nav-title {
    font-size: 18px;
    font-weight: 800;
    color: $text-primary;

    &--accent {
      color: $ci-orange;
    }
  }

  &__nav-back {
    font-size: 12px;
    color: $ci-orange;
    text-decoration: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
      text-decoration: underline;
    }
  }

  &__content {
    max-width: 700px;
    margin: 0 auto;
    padding: 40px 32px;
    width: 100%;
  }

  &__card {
    background: $card;
    border-radius: $radius-2xl;
    border: 1px solid $border;
    padding: 24px;

    &--main {
      padding: 36px;
      margin-bottom: 24px;
    }
  }

  &__card-label {
    font-size: 10px;
    color: $text-dim;
    margin: 0 0 14px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  &__flag-icon {
    display: flex;
    width: 56px;
    height: 35px;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 20px;
    border: 1px solid $border;
  }

  &__flag-stripe {
    flex: 1;

    &--orange { background: $ci-orange; }
    &--white { background: #FFF; }
    &--green { background: $ci-green; }
  }

  &__heading {
    font-size: 28px;
    font-weight: 800;
    color: $ci-orange;
    margin: 0 0 16px;
    letter-spacing: -0.5px;
  }

  &__text {
    font-size: 15px;
    line-height: 1.8;
    color: $text-secondary;
    margin: 0 0 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }

  &__member {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__member-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, $ci-orange, $ci-green);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFF;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__member-name {
    font-size: 13px;
    font-weight: 600;
    color: $text-primary;
    margin: 0;
  }

  &__member-role {
    font-size: 10px;
    color: $text-secondary;
    margin: 0;
  }

  &__tech-item {
    padding: 8px 12px;
    border-radius: 8px;
    background: $surface;
    border: 1px solid $border;
    margin-bottom: 6px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__tech-name {
    font-size: 12px;
    font-weight: 500;
    color: $ci-green;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  &__stat {
    text-align: center;
    padding: 20px;
    border-radius: $radius-lg;
    background: $card;
    border: 1px solid $border;
  }

  &__stat-value {
    font-size: 24px;
    font-weight: 800;
    margin: 0 0 4px;

    &--orange { color: $ci-orange; }
    &--green { color: $ci-green; }
  }

  &__stat-label {
    font-size: 11px;
    color: $text-secondary;
    margin: 0;
  }

  &__footer-card {
    text-align: center;
    padding: 16px;
    border-radius: 12px;
    background: $card;
    border: 1px solid $border;
  }

  &__footer-text {
    font-size: 12px;
    color: $text-secondary;
    margin: 0;
  }

  &__footer-link--orange {
    color: $ci-orange;
    font-weight: 600;
  }

  &__footer-link--green {
    color: $ci-green;
    font-weight: 600;
  }
}

// --- Responsive ---
@media (max-width: $bp-tablet) {
  .about {
    &__nav {
      padding: 0 16px;
    }

    &__content {
      padding: 24px 16px;
    }

    &__card--main {
      padding: 24px;
    }

    &__heading {
      font-size: 22px;
    }

    &__text {
      font-size: 13px;
    }

    &__grid {
      grid-template-columns: 1fr;
    }

    &__stats {
      grid-template-columns: repeat(2, 1fr);
    }

    &__stat {
      padding: 14px;
    }

    &__stat-value {
      font-size: 20px;
    }
  }
}

@media (max-width: $bp-mobile) {
  .about {
    &__content {
      padding: 16px 12px;
    }

    &__heading {
      font-size: 20px;
    }

    &__text {
      font-size: 12px;
    }

    &__stat-value {
      font-size: 18px;
    }
  }
}
</style>
