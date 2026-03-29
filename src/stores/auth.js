// Store d'authentification — gere le token, l'utilisateur connecte et les actions auth
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, accountApi, setAuthToken, removeAuthToken } from '@/services/api'
import { useUserStore } from '@/stores/user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('koumanci_token') || '')
  const user = ref(null)
  const loading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => !!token.value)

  /**
   * Inscription d'un nouvel utilisateur
   */
  async function register({ fullName, email, password, passwordConfirmation }) {
    loading.value = true
    error.value = ''
    try {
      const response = await authApi.register({
        fullName,
        email,
        password,
        passwordConfirmation
      })
      // L'API AdonisJS enveloppe la reponse dans { data: { token, user } }
      const payload = response.data || response
      const rawToken = payload.token?.token || payload.token || ''
      if (rawToken) {
        token.value = rawToken
        setAuthToken(rawToken)
      }
      if (payload.user) {
        user.value = payload.user
        const userStore = useUserStore()
        userStore.setUsername(payload.user.fullName || fullName)
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Connexion d'un utilisateur existant
   */
  async function login({ email, password }) {
    loading.value = true
    error.value = ''
    try {
      const response = await authApi.login({ email, password })
      // L'API AdonisJS enveloppe la reponse dans { data: { token, user } }
      const payload = response.data || response
      const rawToken = payload.token?.token || payload.token || ''
      if (rawToken) {
        token.value = rawToken
        setAuthToken(rawToken)
      }
      if (payload.user) {
        user.value = payload.user
        const userStore = useUserStore()
        userStore.setUsername(payload.user.fullName || '')
      }
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Deconnexion de l'utilisateur
   */
  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Ignorer l'erreur, on deconnecte quand meme cote client
    } finally {
      token.value = ''
      user.value = null
      removeAuthToken()
    }
  }

  /**
   * Recupere le profil de l'utilisateur connecte
   */
  async function fetchProfile() {
    if (!token.value) return null
    loading.value = true
    try {
      const response = await accountApi.getProfile()
      const profile = response.data || response
      user.value = profile
      // Synchroniser le nom avec le user store
      const userStore = useUserStore()
      if (profile.fullName) {
        userStore.setUsername(profile.fullName)
      }
      return profile
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Reinitialise les erreurs
   */
  function clearError() {
    error.value = ''
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    fetchProfile,
    clearError
  }
})
