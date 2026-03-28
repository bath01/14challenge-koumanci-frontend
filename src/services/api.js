// Service API pour communiquer avec le backend AdonisJS
const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.message || 'Erreur serveur')
  }

  return response.json()
}

// --- API Rooms ---
export const roomApi = {
  create(data) {
    return request('/rooms', { method: 'POST', body: JSON.stringify(data) })
  },

  getByCode(code) {
    return request(`/rooms/${code}`)
  },

  join(code, data) {
    return request(`/rooms/${code}/join`, { method: 'POST', body: JSON.stringify(data) })
  },

  leave(code) {
    return request(`/rooms/${code}/leave`, { method: 'POST' })
  },

  delete(code) {
    return request(`/rooms/${code}`, { method: 'DELETE' })
  }
}

// --- API Participants ---
export const participantApi = {
  list(code) {
    return request(`/rooms/${code}/participants`)
  },

  mute(code, participantId) {
    return request(`/rooms/${code}/participants/${participantId}/mute`, { method: 'PUT' })
  },

  remove(code, participantId) {
    return request(`/rooms/${code}/participants/${participantId}`, { method: 'DELETE' })
  }
}
