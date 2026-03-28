import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const username = ref(localStorage.getItem('koumanci_username') || '')
  const avatarUrl = ref(localStorage.getItem('koumanci_avatar') || '')

  function setUsername(name) {
    username.value = name
    localStorage.setItem('koumanci_username', name)
  }

  function setAvatar(dataUrl) {
    avatarUrl.value = dataUrl
    localStorage.setItem('koumanci_avatar', dataUrl)
  }

  function removeAvatar() {
    avatarUrl.value = ''
    localStorage.removeItem('koumanci_avatar')
  }

  // Initiales pour l'avatar (2 premieres lettres des mots)
  function getInitials(name = username.value) {
    return name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return { username, avatarUrl, setUsername, setAvatar, removeAvatar, getInitials }
})
