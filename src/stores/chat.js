import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useChatStore = defineStore('chat', () => {
  const messages = ref([])
  const unreadCount = ref(0)
  const isOpen = ref(true)

  const lastMessage = computed(() => {
    return messages.value[messages.value.length - 1] || null
  })

  function addMessage(message) {
    messages.value.push({
      id: messages.value.length + 1,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      ...message
    })
    if (!isOpen.value) {
      unreadCount.value++
    }
  }

  function toggleChat() {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
      unreadCount.value = 0
    }
  }

  function clearMessages() {
    messages.value = []
    unreadCount.value = 0
  }

  return { messages, unreadCount, isOpen, lastMessage, addMessage, toggleChat, clearMessages }
})
