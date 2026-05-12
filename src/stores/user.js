// Store du profil local — username et avatar.
// Le username est local; l'avatar est synchronise avec le backend
// (table users.avatar_url) pour que les autres participants le voient.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { accountApi } from '@/services/api'

export const useUserStore = defineStore('user', () => {
  const username = ref(localStorage.getItem('koumanci_username') || '')
  const avatarUrl = ref(localStorage.getItem('koumanci_avatar') || '')

  function setUsername(name) {
    username.value = name
    localStorage.setItem('koumanci_username', name)
  }

  /**
   * Met a jour l'avatar local + push au backend (best effort).
   * Le backend rebroadcast aux autres participants au prochain join.
   */
  async function setAvatar(dataUrl) {
    avatarUrl.value = dataUrl
    localStorage.setItem('koumanci_avatar', dataUrl)
    try {
      await accountApi.updateProfile({ avatarUrl: dataUrl })
    } catch (err) {
      console.warn('[user] sync avatar serveur echoue:', err.message)
    }
  }

  /**
   * Met a jour l'avatar uniquement local (sans push API).
   * Utilise quand on recoit l'avatar du serveur via fetchProfile.
   */
  function syncAvatarFromServer(dataUrl) {
    avatarUrl.value = dataUrl || ''
    if (dataUrl) {
      localStorage.setItem('koumanci_avatar', dataUrl)
    } else {
      localStorage.removeItem('koumanci_avatar')
    }
  }

  /**
   * Supprime l'avatar local et serveur
   */
  async function removeAvatar() {
    avatarUrl.value = ''
    localStorage.removeItem('koumanci_avatar')
    try {
      await accountApi.updateProfile({ avatarUrl: null })
    } catch (err) {
      console.warn('[user] suppression avatar serveur echoue:', err.message)
    }
  }

  /**
   * Initiales pour l'avatar (2 premieres lettres des mots)
   */
  function getInitials(name = username.value) {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return {
    username,
    avatarUrl,
    setUsername,
    setAvatar,
    syncAvatarFromServer,
    removeAvatar,
    getInitials
  }
})
