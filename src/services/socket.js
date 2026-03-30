// Service de signaling temps reel
// Utilise @adonisjs/transmit-client (SSE) pour recevoir les evenements serveur
// et des requetes HTTP REST pour envoyer des donnees client -> serveur
import { subscribeToRoom, unsubscribeFromRoom } from '@/services/transmit'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

/**
 * Recupere le token d'authentification
 */
function getAuthToken() {
  return localStorage.getItem('koumanci_token') || ''
}

/**
 * Envoie un message au serveur via HTTP POST (client -> serveur)
 * Transmit est unidirectionnel (SSE), donc on utilise REST pour l'envoi
 */
async function sendToServer(endpoint, data = {}) {
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
 * Service de signaling qui combine Transmit (reception) et REST (envoi)
 */
export class SignalingService {
  constructor() {
    this.roomCode = null
    this.username = null
    this.listeners = new Map()
    this.unsubscribeRoom = null
  }

  /**
   * Se connecte a une room : s'abonne aux canaux Transmit
   */
  async connect(roomCode, username) {
    this.roomCode = roomCode
    this.username = username

    // S'abonner aux canaux Transmit de la room
    this.unsubscribeRoom = await subscribeToRoom(roomCode, {
      // Evenements de la room (lock, settings, etc.)
      onRoomEvent: (data) => {
        this._dispatch(data.type || 'room-event', data.payload || data)
      },

      // Messages chat
      onChatMessage: (data) => {
        this._dispatch('chat-message', data)
      },

      // Evenements participants (join, leave, media-state)
      onParticipantEvent: (data) => {
        this._dispatch(data.type || 'participant-event', data.payload || data)
      },

      // Signaling mediasoup (new-producer, producer-closed, etc.)
      onSignaling: (data) => {
        this._dispatch(data.type || 'signaling', data.payload || data)
      }
    })
  }

  /**
   * Se deconnecte de la room
   */
  async disconnect() {
    if (this.unsubscribeRoom) {
      await this.unsubscribeRoom()
      this.unsubscribeRoom = null
    }
    if (this.roomCode) {
      await unsubscribeFromRoom(this.roomCode)
    }
    this.roomCode = null
    this.username = null
    this.listeners.clear()
  }

  /**
   * Envoie un message au serveur via REST
   */
  send(type, payload) {
    if (!this.roomCode) return
    return sendToServer(`/rooms/${this.roomCode}/signal`, { type, payload })
  }

  /**
   * Ecoute un type d'evenement
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
      this.listeners.set(type, handlers.filter(h => h !== handler))
    }
  }

  /**
   * Dispatch un evenement a tous les listeners
   */
  _dispatch(type, data) {
    const handlers = this.listeners.get(type) || []
    handlers.forEach(handler => handler(data))
  }

  // --- Signaling WebRTC (envoi via REST) ---

  sendOffer(targetId, offer) {
    return this.send('offer', { targetId, offer })
  }

  sendAnswer(targetId, answer) {
    return this.send('answer', { targetId, answer })
  }

  sendIceCandidate(targetId, candidate) {
    return this.send('ice-candidate', { targetId, candidate })
  }

  sendMediaState(state) {
    return this.send('media-state', state)
  }

  // --- Chat (envoi via REST) ---

  sendChatMessage(content) {
    return sendToServer(`/rooms/${this.roomCode}/chat`, { content })
  }

  sendTyping() {
    return this.send('chat-typing', {})
  }
}

// Instance singleton
export const signalingService = new SignalingService()
