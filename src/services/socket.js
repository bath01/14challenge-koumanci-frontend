// Service WebSocket pour le signaling WebRTC et le chat en temps reel
const WS_BASE = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`

export class SignalingService {
  constructor() {
    this.ws = null
    this.listeners = new Map()
  }

  connect(roomCode, username) {
    const url = `${WS_BASE}/signal?room=${roomCode}&username=${encodeURIComponent(username)}`
    this.ws = new WebSocket(url)

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const handlers = this.listeners.get(data.type) || []
      handlers.forEach(handler => handler(data.payload))
    }

    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve()
      this.ws.onerror = (error) => reject(error)
    })
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.listeners.clear()
  }

  send(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    }
  }

  on(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type).push(handler)
  }

  off(type, handler) {
    const handlers = this.listeners.get(type)
    if (handlers) {
      this.listeners.set(type, handlers.filter(h => h !== handler))
    }
  }

  // --- Signaling WebRTC ---
  sendOffer(targetId, offer) {
    this.send('offer', { targetId, offer })
  }

  sendAnswer(targetId, answer) {
    this.send('answer', { targetId, answer })
  }

  sendIceCandidate(targetId, candidate) {
    this.send('ice-candidate', { targetId, candidate })
  }

  sendMediaState(state) {
    this.send('media-state', state)
  }

  // --- Chat ---
  sendChatMessage(content) {
    this.send('chat-message', { content })
  }

  sendTyping() {
    this.send('chat-typing', {})
  }
}

// Instance singleton
export const signalingService = new SignalingService()
