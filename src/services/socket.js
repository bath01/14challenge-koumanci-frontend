// Service de signaling temps reel.
// Reception via Transmit (SSE) sur le canal unique `rooms/:code/events`,
// envoi via REST (chat, media-state) car SSE est unidirectionnel.
import { subscribeToRoomEvents } from '@/services/transmit'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

/**
 * Recupere le token d'authentification
 */
function getAuthToken() {
  return localStorage.getItem('koumanci_token') || ''
}

/**
 * POST JSON authentifie sur l'API backend
 */
async function postJson(endpoint, data = {}) {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.errors?.[0]?.message || body.message || 'Erreur serveur')
  }

  if (response.status === 204) return null
  return response.json()
}

/**
 * Service de signaling : combine Transmit (reception) et REST (envoi).
 * Les events emis par le backend ont la forme { event, payload } et sont
 * dispatches aux listeners via la cle `event` (ex: 'participant:joined').
 */
export class SignalingService {
  constructor() {
    this.roomCode = null
    this.username = null
    this.listeners = new Map()
    this.unsubscribe = null
  }

  /**
   * Se connecte a une room : s'abonne au canal Transmit `rooms/:code/events`
   */
  async connect(roomCode, username) {
    this.roomCode = roomCode
    this.username = username

    this.unsubscribe = await subscribeToRoomEvents(roomCode, (data) => {
      // Le backend broadcast { event: 'xxx:yyy', payload: {...} }
      const eventName = data?.event
      const payload = data?.payload ?? data
      if (!eventName) return
      this._dispatch(eventName, payload)
    })
  }

  /**
   * Se deconnecte du canal Transmit de la room
   */
  async disconnect() {
    if (this.unsubscribe) {
      await this.unsubscribe()
      this.unsubscribe = null
    }
    this.roomCode = null
    this.username = null
    this.listeners.clear()
  }

  /**
   * Ecoute un type d'evenement (ex: 'participant:joined', 'rtc:new-producer')
   */
  on(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type).push(handler)
  }

  /**
   * Retire un listener
   */
  off(type, handler) {
    const handlers = this.listeners.get(type)
    if (handlers) {
      this.listeners.set(type, handlers.filter((h) => h !== handler))
    }
  }

  /**
   * Dispatch un evenement a tous les listeners enregistres
   */
  _dispatch(type, data) {
    const handlers = this.listeners.get(type) || []
    handlers.forEach((handler) => handler(data))
  }

  // --- Envois client -> serveur via REST ---

  /**
   * Envoie un message chat dans la room courante.
   * Le backend rebroadcast sur le canal events avec event=chat:message.
   */
  async sendChatMessage(content) {
    if (!this.roomCode) return null
    return postJson(`/rooms/${this.roomCode}/chat`, { content })
  }

  /**
   * Notifie le serveur du nouvel etat media local (mute/camera/screen).
   * Le backend rebroadcast avec event=participant:media-state.
   */
  async sendMediaState(state) {
    if (!this.roomCode) return null
    return postJson(`/rooms/${this.roomCode}/media-state`, state)
  }
}

// Instance singleton
export const signalingService = new SignalingService()
