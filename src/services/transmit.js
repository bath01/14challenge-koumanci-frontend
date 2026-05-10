// Service Transmit — communication temps reel serveur -> client via SSE
// Le backend AdonisJS expose un canal unique par room : `rooms/:code/events`
// Tous les evenements (participants, mediasoup, chat, etc.) y transitent
// avec la forme { event: 'participant:joined', payload: {...} }.
import { Transmit } from '@adonisjs/transmit-client'

let transmitInstance = null
const subscriptions = new Map()

/**
 * Recupere le token d'authentification stocke par le service api.js
 */
function getAuthToken() {
  return localStorage.getItem('koumanci_token') || ''
}

/**
 * Cree et retourne l'instance Transmit singleton.
 * Le baseUrl pointe sur l'origine courante : nginx/Vite proxy
 * `/__transmit/` vers le backend AdonisJS.
 */
export function getTransmit() {
  if (transmitInstance) return transmitInstance

  transmitInstance = new Transmit({
    baseUrl: window.location.origin,

    beforeSubscribe(request) {
      const token = getAuthToken()
      if (token) request.headers.set('Authorization', `Bearer ${token}`)
    },

    beforeUnsubscribe(request) {
      const token = getAuthToken()
      if (token) request.headers.set('Authorization', `Bearer ${token}`)
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
 * S'abonne a un canal Transmit et appelle onMessage pour chaque event recu.
 * Retourne une fonction async pour se desabonner proprement.
 */
export async function subscribe(channel, onMessage) {
  const transmit = getTransmit()
  const subscription = transmit.subscription(channel)

  await subscription.create()

  const unsubscribeMessage = subscription.onMessage((data) => {
    onMessage(data)
  })

  if (!subscriptions.has(channel)) {
    subscriptions.set(channel, [])
  }
  subscriptions.get(channel).push({ subscription, unsubscribeMessage })

  return async () => {
    unsubscribeMessage()
    await subscription.delete()
    const subs = subscriptions.get(channel)
    if (subs) {
      subscriptions.set(channel, subs.filter((s) => s.subscription !== subscription))
    }
  }
}

/**
 * S'abonne au canal d'evenements d'une room.
 * Le backend broadcaste tout (participants, rtc, chat, media-state) sur ce canal.
 *
 * @param {string} roomCode  Code de la room
 * @param {(data: { event: string, payload: any }) => void} onEvent  Callback par event
 * @returns {Promise<() => Promise<void>>}  Fonction de desabonnement
 */
export async function subscribeToRoomEvents(roomCode, onEvent) {
  return subscribe(`rooms/${roomCode}/events`, onEvent)
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
