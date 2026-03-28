<template>
  <div class="chat-panel">
    <!-- Liste des messages -->
    <div class="chat-panel__messages" ref="messagesContainer">
      <div v-for="message in messages" :key="message.id" class="chat-panel__message">
        <div class="chat-panel__message-header">
          <img
            v-if="isCurrentUser(message.senderId) && currentUserAvatarUrl"
            :src="currentUserAvatarUrl"
            class="chat-panel__message-avatar-photo"
          />
          <div
            v-else
            class="chat-panel__message-avatar"
            :style="{ background: isCurrentUser(message.senderId) ? currentUserGradient : gradient(message.senderName) }"
          >
            {{ getInitials(message.senderName) }}
          </div>
          <span
            class="chat-panel__message-sender"
            :class="{ 'chat-panel__message-sender--self': isCurrentUser(message.senderId) }"
          >
            {{ message.senderName }}
          </span>
          <span class="chat-panel__message-time">{{ message.timestamp }}</span>
        </div>
        <p class="chat-panel__message-content">{{ message.content }}</p>
      </div>
      <div ref="chatEnd" />
    </div>

    <!-- Input message -->
    <div class="chat-panel__input-wrapper">
      <div class="chat-panel__input-container">
        <input
          v-model="newMessage"
          class="chat-panel__input"
          placeholder="Ecrire un message..."
          @keydown.enter="sendMessage"
        />
        <button class="chat-panel__send-btn" @click="sendMessage">
          <SendHorizontal :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { SendHorizontal } from 'lucide-vue-next'
import { useGradient } from '@/composables/useGradient'

const props = defineProps({
  messages: { type: Array, required: true },
  currentUserId: { type: [Number, String], required: true },
  currentUserAvatarUrl: { type: String, default: '' }
})

const emit = defineEmits(['send'])

const { generateGradient } = useGradient()
const newMessage = ref('')
const chatEnd = ref(null)

const currentUserGradient = 'linear-gradient(135deg, #FF8C00, #009E49)'

function gradient(name) {
  return generateGradient(name)
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('')
}

function isCurrentUser(senderId) {
  return senderId === props.currentUserId
}

function sendMessage() {
  if (!newMessage.value.trim()) return
  emit('send', newMessage.value.trim())
  newMessage.value = ''
}

// Auto-scroll vers le dernier message
watch(() => props.messages.length, async () => {
  await nextTick()
  chatEnd.value?.scrollIntoView({ behavior: 'smooth' })
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;

  &__messages {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
  }

  &__message {
    margin-bottom: 14px;
  }

  &__message-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  &__message-avatar-photo {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__message-avatar {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFF;
    font-size: 8px;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__message-sender {
    font-size: 11px;
    font-weight: 600;
    color: $text-primary;

    &--self {
      color: $ci-orange;
    }
  }

  &__message-time {
    font-size: 9px;
    color: $text-dim;
  }

  &__message-content {
    font-size: 12px;
    color: $text-secondary;
    margin: 0 0 0 32px;
    line-height: 1.5;
  }

  &__input-wrapper {
    padding: 12px;
    border-top: 1px solid $border;
  }

  &__input-container {
    display: flex;
    gap: 8px;
    background: $card;
    border-radius: 12px;
    border: 1px solid $border;
    padding: 8px 12px;
  }

  &__input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: $text-primary;
    font-size: 12px;
  }

  &__send-btn {
    background: $ci-orange;
    border: none;
    border-radius: 8px;
    color: #FFF;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@media (max-width: $bp-tablet) {
  .chat-panel {
    &__messages {
      padding: 10px;
    }

    &__input {
      font-size: 16px; // Evite le zoom iOS
    }

    &__input-wrapper {
      padding: 8px;
    }
  }
}
</style>
