<template>
  <div class="room">
    <!-- Toast notification -->
    <Transition name="toast">
      <div v-if="toastMessage" class="room__toast">
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- Header -->
    <RoomHeader
      :room-code="code"
      :duration="callTimer.formatted.value"
      :participant-count="roomStore.participants.length"
      :view-mode="roomStore.viewMode"
      @set-view="handleSetView"
    />

    <!-- Zone principale -->
    <div class="room__main">
      <!-- Zone video -->
      <div class="room__video-area">
        <VideoGrid
          v-if="roomStore.viewMode === 'grid'"
          :participants="roomStore.participants"
          :columns="roomStore.gridColumns"
          :streams="videoStreams"
          :local-user-id="localUserId"
        />
        <SpeakerView
          v-else
          :participants="roomStore.participants"
          :pinned-id="roomStore.pinnedParticipantId"
          :active-speaker="roomStore.activeSpeaker"
          :streams="videoStreams"
          :local-user-id="localUserId"
          @pin="roomStore.pinParticipant"
        />
      </div>

      <!-- Panneau lateral (Chat / Participants) -->
      <SidePanel
        v-if="isSidePanelOpen"
        :active-tab="activeTab"
        :messages="chatStore.messages"
        :participants="roomStore.participants"
        :participant-count="roomStore.participants.length"
        :current-user-id="localUserId"
        :current-user-avatar-url="userStore.avatarUrl"
        @set-tab="setActiveTab"
        @send-message="handleSendMessage"
        @toggle-mute-participant="roomStore.toggleMuteParticipant"
        @remove-participant="roomStore.removeParticipant"
        @close="isSidePanelOpen = false"
      />
    </div>

    <!-- Barre de controles -->
    <ControlBar
      :room-code="code"
      :is-muted="roomStore.isMuted"
      :is-camera-off="roomStore.isCameraOff"
      :is-screen-sharing="roomStore.isScreenSharing"
      :is-chat-open="activeTab === 'chat' && isSidePanelOpen"
      :is-participants-open="activeTab === 'participants' && isSidePanelOpen"
      @toggle-mute="handleToggleMute"
      @toggle-camera="handleToggleCamera"
      @toggle-screen="handleToggleScreen"
      @toggle-chat="toggleChat"
      @toggle-participants="toggleParticipants"
      @leave="leaveRoom"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { useCallTimer } from '@/composables/useCallTimer'
import { useMediaStream } from '@/composables/useMediaStream'
import { useVoiceDetection } from '@/composables/useVoiceDetection'
import { useNotificationSound } from '@/composables/useNotificationSound'
import { useAuthStore } from '@/stores/auth'
import { roomApi, participantApi } from '@/services/api'
import { signalingService } from '@/services/socket'
import * as mediasoup from '@/services/mediasoup'
import RoomHeader from '@/components/room/RoomHeader.vue'
import VideoGrid from '@/components/room/VideoGrid.vue'
import SpeakerView from '@/components/room/SpeakerView.vue'
import SidePanel from '@/components/room/SidePanel.vue'
import ControlBar from '@/components/room/ControlBar.vue'

const props = defineProps({
  code: { type: String, required: true }
})

const router = useRouter()
const roomStore = useRoomStore()
const chatStore = useChatStore()
const userStore = useUserStore()
const callTimer = useCallTimer()
const media = useMediaStream()
const voiceDetection = useVoiceDetection()
const authStore = useAuthStore()
const notifSound = useNotificationSound()

const isSidePanelOpen = ref(true)
const activeTab = ref('chat')
// Map participantId -> MediaStream pour les flux video
const videoStreams = reactive({})
let speakingInterval = null
let participantPollingInterval = null
let producerPollingInterval = null
// ID de l'utilisateur local (depuis le profil auth)
const localUserId = ref(authStore.user?.id || 1)
// Set des producers deja consommes pour eviter les doublons
const consumedProducerIds = new Set()
// Toast de notification
const toastMessage = ref('')
let toastTimeout = null

// --- Initialisation de la room ---
onMounted(async () => {
  // Rediriger vers home si pas de nom d'utilisateur
  if (!userStore.username) {
    router.push({ name: 'home' })
    return
  }

  // 1. S'assurer qu'on est bien enregistre dans la room cote backend
  try {
    await roomApi.join(props.code)
  } catch {
    // Peut echouer si deja rejoint, on ignore
  }

  // 2. Charger les infos de la room depuis l'API
  try {
    const response = await roomApi.getByCode(props.code)
    const room = response.data || response
    roomStore.setRoomInfo({
      id: room.id,
      code: room.code || props.code,
      name: room.name || '',
      hostId: room.hostId || room.creatorId
    })
  } catch {
    roomStore.setRoomInfo({ id: null, code: props.code, name: '', hostId: localUserId.value })
  }

  // 3. Charger les participants depuis l'API
  await refreshParticipants(false)

  // 3. Demarrer la camera et le micro de l'utilisateur local
  const stream = await media.startMedia()
  if (stream) {
    videoStreams[localUserId.value] = stream
    roomStore.isCameraOff = media.isCameraOff.value
    roomStore.isMuted = media.isMuted.value
    voiceDetection.start(stream)
  }

  // 4. Connecter Transmit (SSE) pour recevoir les evenements temps reel
  await initSignaling()

  // 5. Initialiser mediasoup (WebRTC SFU) pour le streaming
  await initMediasoup(stream)

  // 6. Demarrer le timer d'appel
  callTimer.start()

  // 7. Mettre a jour l'indicateur de parole local
  speakingInterval = setInterval(() => {
    roomStore.updateParticipant(localUserId.value, {
      isSpeaking: !roomStore.isMuted && voiceDetection.isSpeaking.value
    })
  }, 200)

  // 8. Polling des participants toutes les 5s (fallback si Transmit non disponible)
  participantPollingInterval = setInterval(() => {
    refreshParticipants(true)
  }, 5000)

  // 9. Polling des producers toutes les 5s pour consommer les nouveaux flux distants
  producerPollingInterval = setInterval(() => {
    pollRemoteProducers()
  }, 5000)
})

/**
 * Charge / rafraichit la liste des participants depuis l'API
 * Si notify=true, affiche une notification pour les nouveaux arrivants
 */
async function refreshParticipants(notify) {
  try {
    const response = await participantApi.list(props.code)
    const participantList = response.data || response || []
    const currentIds = new Set(roomStore.participants.map(p => p.id))
    let localFound = false

    participantList.forEach(p => {
      const pId = p.userId || p.id
      const pName = p.user?.fullName || p.fullName || p.username || 'Participant'
      const isLocal = pId === localUserId.value
      if (isLocal) localFound = true

      const existing = roomStore.participants.find(ep => ep.id === pId)
      if (existing) {
        // Mettre a jour le nom si manquant
        if (existing.username === 'Participant' && pName !== 'Participant') {
          roomStore.updateParticipant(pId, { username: pName })
        }
        return
      }

      // Nouveau participant detecte
      roomStore.addParticipant({
        id: pId,
        username: isLocal ? userStore.username : pName,
        avatar: (isLocal ? userStore.username : pName).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
        avatarUrl: isLocal ? (userStore.avatarUrl || '') : (p.user?.avatarUrl || p.avatarUrl || ''),
        isHost: p.role === 'host',
        isMuted: false,
        isCameraOff: !isLocal && p.videoEnabled === false,
        isScreenSharing: false,
        isSpeaking: false
      })

      // Notification pour les nouveaux participants (sauf au chargement initial)
      if (notify && !isLocal) {
        showToast(`${pName} a rejoint la reunion`)
        notifSound.playJoin()
      }
    })

    // Detecter les participants qui ont quitte (present localement mais plus dans l'API)
    if (notify) {
      const apiIds = new Set(participantList.map(p => p.userId || p.id))
      for (const id of currentIds) {
        if (id !== localUserId.value && !apiIds.has(id)) {
          const left = roomStore.participants.find(p => p.id === id)
          if (left) {
            showToast(`${left.username} a quitte la reunion`)
            notifSound.playLeave()
          }
          roomStore.removeParticipant(id)
          delete videoStreams[id]
        }
      }
    }

    // Toujours s'assurer que l'utilisateur local est present
    if (!localFound) {
      roomStore.addParticipant({
        id: localUserId.value,
        username: userStore.username,
        avatar: userStore.getInitials(),
        avatarUrl: userStore.avatarUrl || '',
        isHost: roomStore.hostId === localUserId.value,
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
        isSpeaking: false
      })
    }
  } catch {
    // Premiere fois et erreur : ajouter au moins le local
    if (!roomStore.participants.find(p => p.id === localUserId.value)) {
      roomStore.addParticipant({
        id: localUserId.value,
        username: userStore.username,
        avatar: userStore.getInitials(),
        avatarUrl: userStore.avatarUrl || '',
        isHost: roomStore.hostId === localUserId.value,
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
        isSpeaking: false
      })
    }
  }
}

/**
 * Affiche un toast de notification temporaire
 */
function showToast(message) {
  toastMessage.value = message
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    toastMessage.value = ''
  }, 4000)
}

// --- Connexion Transmit (evenements temps reel) ---
async function initSignaling() {
  try {
    await signalingService.connect(props.code, userStore.username)

    // Un participant rejoint la room
    signalingService.on('participant-joined', (data) => {
      roomStore.addParticipant({
        id: data.userId || data.id,
        username: data.fullName || data.username || 'Participant',
        avatar: (data.fullName || data.username || 'P').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
        avatarUrl: data.avatarUrl || '',
        isHost: data.role === 'host',
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
        isSpeaking: false
      })
      notifSound.playJoin?.()
    })

    // Un participant quitte la room
    signalingService.on('participant-left', (data) => {
      const participantId = data.userId || data.id
      roomStore.removeParticipant(participantId)
      // Supprimer son stream video
      delete videoStreams[participantId]
      notifSound.playLeave?.()
    })

    // Un participant change son etat media (mute, camera off, etc.)
    signalingService.on('media-state', (data) => {
      roomStore.updateParticipant(data.userId || data.id, {
        isMuted: data.isMuted,
        isCameraOff: data.isCameraOff,
        isScreenSharing: data.isScreenSharing
      })
    })

    // Nouveau message chat recu
    signalingService.on('chat-message', (data) => {
      // Ne pas ajouter les messages envoyes par nous-meme
      if ((data.senderId || data.userId) === localUserId.value) return
      chatStore.addMessage({
        senderId: data.senderId || data.userId,
        senderName: data.senderName || data.fullName || 'Participant',
        content: data.content || data.message
      })
      notifSound.playMessage()
    })

    // Nouveau producer mediasoup disponible (un participant publie un flux)
    signalingService.on('new-producer', async (data) => {
      await consumeRemoteProducer(data.producerId, data.userId)
    })

    // Un producer mediasoup est ferme
    signalingService.on('producer-closed', (data) => {
      mediasoup.closeConsumer(data.consumerId)
    })
  } catch (err) {
    console.warn('[Room] Erreur connexion signaling:', err.message)
  }
}

// --- Initialisation mediasoup (streaming WebRTC) ---
async function initMediasoup(localStream) {
  try {
    // Initialiser le device avec les capabilities du serveur
    await mediasoup.initDevice(props.code)

    // Creer les transports d'envoi et de reception
    await mediasoup.createSendTransport(props.code)
    await mediasoup.createRecvTransport(props.code)

    // Publier l'audio et la video locale si disponibles
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      const videoTrack = localStream.getVideoTracks()[0]

      if (audioTrack) {
        await mediasoup.produceAudio(audioTrack)
      }
      if (videoTrack) {
        await mediasoup.produceVideo(videoTrack)
      }
    }

    // Consommer les producers existants (participants deja dans la room)
    await consumeExistingProducers()
  } catch (err) {
    console.warn('[Room] Erreur init mediasoup:', err.message)
  }
}

// --- Consommer les producers existants dans la room ---
async function consumeExistingProducers() {
  await pollRemoteProducers()
}

/**
 * Polle les producers distants et consomme ceux qu'on n'a pas encore consommes
 */
async function pollRemoteProducers() {
  try {
    const response = await import('@/services/api').then(m => m.rtcApi.getProducers(props.code))
    const producerList = response.data || response || []

    for (const producer of producerList) {
      const producerId = producer.id || producer.producerId
      // Ignorer les producers deja consommes
      if (consumedProducerIds.has(producerId)) continue
      // Ignorer nos propres producers
      if (producer.userId === localUserId.value) continue

      consumedProducerIds.add(producerId)
      await consumeRemoteProducer(producerId, producer.userId)
    }
  } catch {
    // Silencieux — le polling reessaiera
  }
}

// --- Consommer un producer distant et attacher le stream ---
async function consumeRemoteProducer(producerId, userId) {
  try {
    const consumer = await mediasoup.consume(props.code, producerId)
    const { track } = consumer

    // Creer ou mettre a jour le MediaStream du participant
    if (!videoStreams[userId]) {
      videoStreams[userId] = new MediaStream()
    }

    // Si c'est un MediaStream existant, ajouter le track
    const existingStream = videoStreams[userId]
    if (existingStream instanceof MediaStream) {
      existingStream.addTrack(track)
    } else {
      videoStreams[userId] = new MediaStream([track])
    }
  } catch (err) {
    console.warn('[Room] Erreur consume producer:', err.message)
  }
}

// --- Raccourcis clavier ---
function handleKeydown(e) {
  // Ignorer si on tape dans un input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

  switch (e.key.toLowerCase()) {
    case 'm': handleToggleMute(); break
    case 'v': handleToggleCamera(); break
    case 'e': handleToggleScreen(); break
    case 'c': toggleChat(); break
    case 'p': toggleParticipants(); break
    case 'escape': leaveRoom(); break
  }
}

window.addEventListener('keydown', handleKeydown)

onUnmounted(async () => {
  window.removeEventListener('keydown', handleKeydown)
  callTimer.stop()
  voiceDetection.stop()
  media.stopMedia()
  if (speakingInterval) clearInterval(speakingInterval)
  if (participantPollingInterval) clearInterval(participantPollingInterval)
  if (producerPollingInterval) clearInterval(producerPollingInterval)
  if (toastTimeout) clearTimeout(toastTimeout)
  // Nettoyer mediasoup (fermer transports, producers, consumers)
  mediasoup.cleanup()
  // Deconnecter le signaling Transmit
  await signalingService.disconnect()
  // Notifier le backend qu'on quitte la room
  try { await roomApi.leave(props.code) } catch { /* ignore */ }
  roomStore.resetRoom()
  chatStore.clearMessages()
})

function handleToggleMute() {
  media.toggleMute()
  roomStore.isMuted = media.isMuted.value
  roomStore.updateParticipant(localUserId.value, { isMuted: media.isMuted.value })

  // Pause/resume le producer audio mediasoup
  if (media.isMuted.value) {
    mediasoup.pauseProducer('audio')
  } else {
    mediasoup.resumeProducer('audio')
  }

  // Notifier les autres participants via signaling
  signalingService.sendMediaState({
    userId: localUserId.value,
    isMuted: media.isMuted.value,
    isCameraOff: media.isCameraOff.value,
    isScreenSharing: media.isScreenSharing.value
  })
}

async function handleToggleCamera() {
  await media.toggleCamera()
  roomStore.isCameraOff = media.isCameraOff.value
  roomStore.updateParticipant(localUserId.value, { isCameraOff: media.isCameraOff.value })

  // Forcer la reactivite en creant un nouveau MediaStream avec les tracks actuels
  if (!media.isCameraOff.value && media.localStream.value) {
    videoStreams[localUserId.value] = new MediaStream(media.localStream.value.getTracks())
    // Remplacer le track video mediasoup
    const videoTrack = media.localStream.value.getVideoTracks()[0]
    if (videoTrack) {
      mediasoup.resumeProducer('video')
      await mediasoup.replaceTrack('video', videoTrack)
    }
  } else {
    mediasoup.pauseProducer('video')
  }

  signalingService.sendMediaState({
    userId: localUserId.value,
    isMuted: media.isMuted.value,
    isCameraOff: media.isCameraOff.value,
    isScreenSharing: media.isScreenSharing.value
  })
}

async function handleToggleScreen() {
  isSidePanelOpen.value = false
  const stream = await media.toggleScreenSharing()
  roomStore.isScreenSharing = media.isScreenSharing.value
  roomStore.updateParticipant(localUserId.value, { isScreenSharing: media.isScreenSharing.value })

  if (stream) {
    videoStreams[localUserId.value] = stream
    // Publier le partage d'ecran via mediasoup
    const screenTrack = stream.getVideoTracks()[0]
    if (screenTrack) {
      await mediasoup.produceScreen(screenTrack)
    }

    screenTrack.addEventListener('ended', async () => {
      roomStore.isScreenSharing = false
      roomStore.updateParticipant(localUserId.value, { isScreenSharing: false })
      mediasoup.closeProducer('screen')
      if (media.localStream.value && !media.isCameraOff.value) {
        videoStreams[localUserId.value] = media.localStream.value
      }
      signalingService.sendMediaState({
        userId: localUserId.value,
        isMuted: media.isMuted.value,
        isCameraOff: media.isCameraOff.value,
        isScreenSharing: false
      })
    })
  } else {
    // Partage arrete, restaurer le flux camera
    mediasoup.closeProducer('screen')
    if (media.localStream.value && !media.isCameraOff.value) {
      videoStreams[localUserId.value] = media.localStream.value
    }
    if (media.localStream.value && !media.isCameraOff.value) {
      videoStreams[localUserId.value] = media.localStream.value
    }
  }

  signalingService.sendMediaState({
    userId: localUserId.value,
    isMuted: media.isMuted.value,
    isCameraOff: media.isCameraOff.value,
    isScreenSharing: media.isScreenSharing.value
  })
}

function handleSetView(mode) {
  roomStore.setViewMode(mode)
}

function handleSendMessage(content) {
  // Ajouter le message localement
  chatStore.addMessage({
    senderId: localUserId.value,
    senderName: userStore.username,
    content
  })
  // Envoyer au serveur via REST (Transmit est unidirectionnel)
  signalingService.sendChatMessage(content)
  notifSound.playMessage()
}

function toggleChat() {
  if (activeTab.value === 'chat' && isSidePanelOpen.value) {
    isSidePanelOpen.value = false
  } else {
    activeTab.value = 'chat'
    isSidePanelOpen.value = true
  }
}

function toggleParticipants() {
  if (activeTab.value === 'participants' && isSidePanelOpen.value) {
    isSidePanelOpen.value = false
  } else {
    activeTab.value = 'participants'
    isSidePanelOpen.value = true
  }
}

function setActiveTab(tab) {
  activeTab.value = tab
}

function leaveRoom() {
  router.push({ name: 'home' })
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables' as *;

.room {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $dark-bg;

  &__main {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  &__video-area {
    flex: 1;
    padding: 12px;
    overflow: auto;
  }

  &__toast {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba($ci-green, 0.9);
    color: #FFF;
    padding: 10px 24px;
    border-radius: $radius-md;
    font-size: 13px;
    font-weight: 600;
    z-index: 1000;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
}

// Toast animation
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

// --- Responsive : panneau lateral en overlay mobile ---
@media (max-width: $bp-tablet) {
  .room {
    &__main {
      position: relative;
    }

    &__video-area {
      padding: 6px;
    }
  }
}
</style>
