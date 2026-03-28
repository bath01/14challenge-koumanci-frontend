<template>
  <div class="side-panel__backdrop" @click="$emit('close')" />
  <div class="side-panel">
    <!-- Onglets Chat / Participants -->
    <div class="side-panel__tabs">
      <button
        class="side-panel__tab"
        :class="{ 'side-panel__tab--active': activeTab === 'chat' }"
        @click="$emit('set-tab', 'chat')"
      >
        <MessageSquare :size="14" />
        <span>Chat</span>
      </button>
      <button
        class="side-panel__tab"
        :class="{ 'side-panel__tab--active': activeTab === 'participants' }"
        @click="$emit('set-tab', 'participants')"
      >
        <Users :size="14" />
        <span>Participants ({{ participantCount }})</span>
      </button>
    </div>

    <!-- Contenu -->
    <ChatPanel
      v-if="activeTab === 'chat'"
      :messages="messages"
      :current-user-id="currentUserId"
      :current-user-avatar-url="currentUserAvatarUrl"
      @send="$emit('send-message', $event)"
    />
    <ParticipantsPanel
      v-else
      :participants="participants"
      :current-user-id="currentUserId"
      @toggle-mute="$emit('toggle-mute-participant', $event)"
      @remove="$emit('remove-participant', $event)"
    />
  </div>
</template>

<script setup>
import { MessageSquare, Users } from 'lucide-vue-next'
import ChatPanel from './ChatPanel.vue'
import ParticipantsPanel from './ParticipantsPanel.vue'

defineProps({
  activeTab: { type: String, default: 'chat' },
  messages: { type: Array, default: () => [] },
  participants: { type: Array, default: () => [] },
  participantCount: { type: Number, default: 0 },
  currentUserId: { type: [Number, String], required: true },
  currentUserAvatarUrl: { type: String, default: '' }
})

defineEmits(['set-tab', 'send-message', 'toggle-mute-participant', 'remove-participant', 'close'])
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.side-panel {
  width: 320px;
  background: $surface;
  border-left: 1px solid $border;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  &__tabs {
    display: flex;
    border-bottom: 1px solid $border;
  }

  &__tab {
    flex: 1;
    padding: 12px 0;
    border: none;
    background: transparent;
    color: $text-secondary;
    font-size: 12px;
    font-weight: 600;
    border-bottom: 2px solid transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    &--active {
      background: rgba($ci-orange, 0.06);
      color: $ci-orange;
      border-bottom-color: $ci-orange;
    }
  }
}

// Backdrop invisible sur desktop
.side-panel__backdrop {
  display: none;
}

@media (max-width: $bp-tablet) {
  .side-panel__backdrop {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 9;
    background: rgba(0, 0, 0, 0.5);
  }

  .side-panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 80%;
    max-width: 320px;
    z-index: 10;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
  }
}

@media (max-width: $bp-mobile) {
  .side-panel {
    width: 100%;
    max-width: 100%;
  }
}
</style>
