// Service Transmit — communication temps reel serveur -> client via SSE
// Utilise @adonisjs/transmit-client pour recevoir les evenements de room, chat, participants
import { Transmit } from '@adonisjs/transmit-client'

let transmitInstance = null
const subscriptions = new Map()

/**
 * Recupere le token d'authentification
 */
function getAuthToken() {
  return localStorage.getItem('koumanci_token') || ''
}

/**
 * Cree et retourne l'instance Transmit singleton
 * Le baseUrl pointe vers la meme origine car nginx/vite proxy /__transmit/ vers le backend
 */
export function getTransmit() {
  if (transmitInstance) return transmitInstance

  transmitInstance = new Transmit({
    baseUrl: window.location.origin,

    // Ajouter le token d'auth a chaque requete de souscription
    beforeSubscribe(request) {
      const token = getAuthToken()
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`)
      }
    },

    beforeUnsubscribe(request) {
      const token = getAuthToken()
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`)
      }
    },

    onReconnectAttempt(attempt) {
      console.log(`[Transmit] Reconnexion tentative #${attempt}`)
    },

    onReconnectFailed() {
      console.warn('[Transmit] Reconnexion echouee')
    },

    onSubscribeFailed(response) {
      console.error('[Transmit] Souscription echouee:', response.status)
    }
  })

  return transmitInstance
}

/**
 * S'abonne a un canal et ecoute les messages
 * Retourne une fonction pour se desabonner
 */
export async function subscribe(channel, onMessage) {
  const transmit = getTransmit()
  const subscription = transmit.subscription(channel)

  await subscription.create()

  const unsubscribeMessage = subscription.onMessage((data) => {
    onMessage(data)
  })

  // Stocker la souscription pour pouvoir la nettoyer
  if (!subscriptions.has(channel)) {
    subscriptions.set(channel, [])
  }
  subscriptions.get(channel).push({ subscription, unsubscribeMessage })

  // Retourner une fonction pour se desabonner
  return async () => {
    unsubscribeMessage()
    await subscription.delete()
    const subs = subscriptions.get(channel)
    if (subs) {
      subscriptions.set(channel, subs.filter(s => s.subscription !== subscription))
    }
  }
}

/**
 * S'abonne aux evenements d'une room specifique
 * Canaux : room events, chat, participants
 */
export async function subscribeToRoom(roomCode, handlers = {}) {
  const unsubscribers = []

  // Canal principal de la room (join/leave/lock/etc.)
  if (handlers.onRoomEvent) {
    const unsub = await subscribe(`rooms/${roomCode}`, handlers.onRoomEvent)
    unsubscribers.push(unsub)
  }

  // Canal des messages chat
  if (handlers.onChatMessage) {
    const unsub = await subscribe(`rooms/${roomCode}/chat`, handlers.onChatMessage)
    unsubscribers.push(unsub)
  }

  // Canal des participants (join, leave, media state)
  if (handlers.onParticipantEvent) {
    const unsub = await subscribe(`rooms/${roomCode}/participants`, handlers.onParticipantEvent)
    unsubscribers.push(unsub)
  }

  // Canal signaling mediasoup (new-producer, producer-closed, etc.)
  if (handlers.onSignaling) {
    const unsub = await subscribe(`rooms/${roomCode}/signaling`, handlers.onSignaling)
    unsubscribers.push(unsub)
  }

  // Retourner une fonction pour tout desabonner d'un coup
  return async () => {
    for (const unsub of unsubscribers) {
      await unsub()
    }
  }
}

/**
 * Se desabonne de tous les canaux d'une room
 */
export async function unsubscribeFromRoom(roomCode) {
  const channels = [
    `rooms/${roomCode}`,
    `rooms/${roomCode}/chat`,
    `rooms/${roomCode}/participants`,
    `rooms/${roomCode}/signaling`
  ]

  for (const channel of channels) {
    const subs = subscriptions.get(channel)
    if (subs) {
      for (const { subscription, unsubscribeMessage } of subs) {
        unsubscribeMessage()
        await subscription.delete()
      }
      subscriptions.delete(channel)
    }
  }
}

/**
 * Deconnecte completement Transmit et nettoie toutes les souscriptions
 */
export async function disconnectTransmit() {
  for (const [, subs] of subscriptions) {
    for (const { subscription, unsubscribeMessage } of subs) {
      unsubscribeMessage()
      await subscription.delete()
    }
  }
  subscriptions.clear()
  transmitInstance = null
}
