// Service API pour communiquer avec le backend AdonisJS
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

/**
 * Recupere le token d'authentification depuis le localStorage
 */
function getAuthToken() {
  return localStorage.getItem('koumanci_token') || ''
}

/**
 * Sauvegarde le token d'authentification dans le localStorage
 */
export function setAuthToken(token) {
  localStorage.setItem('koumanci_token', token)
}

/**
 * Supprime le token d'authentification du localStorage
 */
export function removeAuthToken() {
  localStorage.removeItem('koumanci_token')
}

/**
 * Effectue une requete HTTP vers l'API avec gestion du token et des erreurs
 */
async function request(endpoint, options = {}) {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  // Ajouter le header Authorization si un token existe
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${API_BASE}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers
  })

  // Gerer le cas 401 (token expire ou invalide)
  if (response.status === 401) {
    removeAuthToken()
    window.location.href = '/login'
    throw new Error('Session expiree, veuillez vous reconnecter')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    // L'API AdonisJS renvoie les erreurs au format { errors: [{ message: "..." }] }
    const msg = body.errors?.[0]?.message || body.message || response.statusText || 'Erreur serveur'
    throw new Error(msg)
  }

  // Gerer les reponses vides (204 No Content)
  if (response.status === 204) {
    return null
  }

  return response.json()
}

// --- API Authentification ---
export const authApi = {
  register(data) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  login(data) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  logout() {
    return request('/auth/logout', { method: 'POST' })
  }
}

// --- API Compte ---
export const accountApi = {
  getProfile() {
    return request('/account/profile')
  },

  /**
   * Met a jour le profil (nom complet et/ou avatar).
   * @param {{ fullName?: string, avatarUrl?: string|null }} data
   */
  updateProfile(data) {
    return request('/account/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }
}

// --- API Rooms ---
export const roomApi = {
  list() {
    return request('/rooms')
  },

  create(data) {
    return request('/rooms', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  getByCode(code) {
    return request(`/rooms/${code}`)
  },

  delete(code) {
    return request(`/rooms/${code}`, { method: 'DELETE' })
  },

  join(code, data = {}) {
    return request(`/rooms/${code}/join`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  leave(code) {
    return request(`/rooms/${code}/leave`, { method: 'POST' })
  }
}

// --- API Participants ---
export const participantApi = {
  list(code) {
    return request(`/rooms/${code}/participants`)
  },

  add(code, data) {
    return request(`/rooms/${code}/participants`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  remove(code, userId) {
    return request(`/rooms/${code}/participants/${userId}`, {
      method: 'DELETE'
    })
  },

  admit(code, userId) {
    return request(`/rooms/${code}/participants/${userId}/admit`, { method: 'POST' })
  },

  reject(code, userId) {
    return request(`/rooms/${code}/participants/${userId}/reject`, { method: 'POST' })
  }
}

// --- API RTC (WebRTC via mediasoup) ---
export const rtcApi = {
  getCapabilities(code) {
    return request(`/rooms/${code}/rtc/capabilities`)
  },

  createTransport(code) {
    return request(`/rooms/${code}/rtc/transport`, { method: 'POST' })
  },

  connectTransport(code, data) {
    return request(`/rooms/${code}/rtc/transport/connect`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  getProducers(code) {
    return request(`/rooms/${code}/rtc/producers`)
  },

  produce(code, data) {
    return request(`/rooms/${code}/rtc/produce`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  consume(code, data) {
    return request(`/rooms/${code}/rtc/consume`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  resumeConsumer(code, data) {
    return request(`/rooms/${code}/rtc/consume/resume`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}
