// Service Mediasoup — gestion du streaming audio/video via WebRTC SFU
// Utilise mediasoup-client pour creer Device, transports, producers et consumers
import { Device } from 'mediasoup-client'
import { rtcApi } from '@/services/api'

let device = null
let sendTransport = null
let recvTransport = null

// Map des producers locaux (audio, video, screen)
const producers = new Map()
// Map des consumers distants (consumerId -> consumer)
const consumers = new Map()

/**
 * Initialise le device mediasoup avec les capabilities du routeur serveur
 */
export async function initDevice(roomCode) {
  device = new Device()

  // Recuperer les RTP capabilities du routeur serveur
  const response = await rtcApi.getCapabilities(roomCode)
  const routerRtpCapabilities = response.data || response

  await device.load({ routerRtpCapabilities })
  console.log('[Mediasoup] Device charge, canProduce video:', device.canProduce('video'))

  return device
}

/**
 * Cree le transport d'envoi (send) pour publier audio/video
 */
export async function createSendTransport(roomCode) {
  const response = await rtcApi.createTransport(roomCode)
  const transportInfo = response.data || response

  sendTransport = device.createSendTransport({
    id: transportInfo.id,
    iceParameters: transportInfo.iceParameters,
    iceCandidates: transportInfo.iceCandidates,
    dtlsParameters: transportInfo.dtlsParameters,
    sctpParameters: transportInfo.sctpParameters
  })

  // Gerer l'evenement "connect" — envoyer les parametres DTLS au serveur
  sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
    try {
      await rtcApi.connectTransport(roomCode, {
        transportId: sendTransport.id,
        dtlsParameters
      })
      callback()
    } catch (error) {
      errback(error)
    }
  })

  // Gerer l'evenement "produce" — notifier le serveur d'un nouveau producer
  sendTransport.on('produce', async (parameters, callback, errback) => {
    try {
      const response = await rtcApi.produce(roomCode, {
        transportId: sendTransport.id,
        kind: parameters.kind,
        rtpParameters: parameters.rtpParameters,
        appData: parameters.appData
      })
      const result = response.data || response
      callback({ id: result.id })
    } catch (error) {
      errback(error)
    }
  })

  sendTransport.on('connectionstatechange', (state) => {
    console.log('[Mediasoup] Send transport:', state)
  })

  return sendTransport
}

/**
 * Cree le transport de reception (recv) pour consommer les medias des autres
 */
export async function createRecvTransport(roomCode) {
  const response = await rtcApi.createTransport(roomCode)
  const transportInfo = response.data || response

  recvTransport = device.createRecvTransport({
    id: transportInfo.id,
    iceParameters: transportInfo.iceParameters,
    iceCandidates: transportInfo.iceCandidates,
    dtlsParameters: transportInfo.dtlsParameters
  })

  // Gerer l'evenement "connect" — envoyer les parametres DTLS au serveur
  recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
    try {
      await rtcApi.connectTransport(roomCode, {
        transportId: recvTransport.id,
        dtlsParameters
      })
      callback()
    } catch (error) {
      errback(error)
    }
  })

  recvTransport.on('connectionstatechange', (state) => {
    console.log('[Mediasoup] Recv transport:', state)
  })

  return recvTransport
}

/**
 * Publie un track audio sur le transport d'envoi
 */
export async function produceAudio(track) {
  if (!sendTransport) throw new Error('Send transport non initialise')

  const producer = await sendTransport.produce({
    track,
    codecOptions: {
      opusStereo: false,
      opusDtx: true
    }
  })

  producers.set('audio', producer)

  producer.on('transportclose', () => {
    producers.delete('audio')
  })

  producer.on('trackended', () => {
    closeProducer('audio')
  })

  return producer
}

/**
 * Publie un track video sur le transport d'envoi
 */
export async function produceVideo(track) {
  if (!sendTransport) throw new Error('Send transport non initialise')

  const producer = await sendTransport.produce({
    track,
    encodings: [
      { maxBitrate: 100000 },
      { maxBitrate: 300000 },
      { maxBitrate: 900000 }
    ],
    codecOptions: {
      videoGoogleStartBitrate: 1000
    }
  })

  producers.set('video', producer)

  producer.on('transportclose', () => {
    producers.delete('video')
  })

  producer.on('trackended', () => {
    closeProducer('video')
  })

  return producer
}

/**
 * Publie un track de partage d'ecran
 */
export async function produceScreen(track) {
  if (!sendTransport) throw new Error('Send transport non initialise')

  const producer = await sendTransport.produce({
    track,
    encodings: [
      { maxBitrate: 1500000 }
    ],
    appData: { type: 'screen' }
  })

  producers.set('screen', producer)

  producer.on('transportclose', () => {
    producers.delete('screen')
  })

  producer.on('trackended', () => {
    closeProducer('screen')
  })

  return producer
}

/**
 * Consomme un producer distant (recevoir le media d'un autre participant).
 * Le backend retourne { id, producerId, kind, rtpParameters, type, producerPaused }.
 */
export async function consume(roomCode, producerId) {
  if (!recvTransport) throw new Error('Recv transport non initialise')

  const response = await rtcApi.consume(roomCode, {
    transportId: recvTransport.id,
    producerId,
    rtpCapabilities: device.rtpCapabilities
  })

  const consumerInfo = response.data || response

  const consumer = await recvTransport.consume({
    id: consumerInfo.id,
    producerId: consumerInfo.producerId || producerId,
    kind: consumerInfo.kind,
    rtpParameters: consumerInfo.rtpParameters
  })

  consumers.set(consumer.id, consumer)

  // Informer le serveur que le consumer est pret a recevoir
  await rtcApi.resumeConsumer(roomCode, { consumerId: consumer.id })

  consumer.on('transportclose', () => {
    consumers.delete(consumer.id)
  })

  return consumer
}

/**
 * Ferme un consumer par son producerId distant
 * (utilise quand le backend signale rtc:producer-closed)
 */
export function closeConsumerByProducerId(producerId) {
  for (const [id, consumer] of consumers) {
    if (consumer.producerId === producerId) {
      consumer.close()
      consumers.delete(id)
      return id
    }
  }
  return null
}

/**
 * Met en pause un producer local (mute)
 */
export function pauseProducer(type) {
  const producer = producers.get(type)
  if (producer && !producer.paused) {
    producer.pause()
  }
}

/**
 * Reprend un producer local (unmute)
 */
export function resumeProducer(type) {
  const producer = producers.get(type)
  if (producer && producer.paused) {
    producer.resume()
  }
}

/**
 * Ferme un producer local
 */
export function closeProducer(type) {
  const producer = producers.get(type)
  if (producer) {
    producer.close()
    producers.delete(type)
  }
}

/**
 * Ferme un consumer distant
 */
export function closeConsumer(consumerId) {
  const consumer = consumers.get(consumerId)
  if (consumer) {
    consumer.close()
    consumers.delete(consumerId)
  }
}

/**
 * Remplace le track d'un producer (changement de camera/micro)
 */
export async function replaceTrack(type, newTrack) {
  const producer = producers.get(type)
  if (producer) {
    await producer.replaceTrack({ track: newTrack })
  }
}

/**
 * Retourne les RTP capabilities du device pour le signaling
 */
export function getDeviceCapabilities() {
  return device?.rtpCapabilities || null
}

/**
 * Retourne un consumer par son ID
 */
export function getConsumer(consumerId) {
  return consumers.get(consumerId)
}

/**
 * Retourne tous les consumers actifs
 */
export function getAllConsumers() {
  return consumers
}

/**
 * Retourne un producer par type
 */
export function getProducer(type) {
  return producers.get(type)
}

/**
 * Nettoie toutes les ressources mediasoup (deconnexion)
 */
export function cleanup() {
  // Fermer tous les producers
  for (const [type] of producers) {
    closeProducer(type)
  }

  // Fermer tous les consumers
  for (const [id] of consumers) {
    closeConsumer(id)
  }

  // Fermer les transports
  if (sendTransport) {
    sendTransport.close()
    sendTransport = null
  }
  if (recvTransport) {
    recvTransport.close()
    recvTransport = null
  }

  device = null
}
