<template>
  <div class="room">
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
          :local-user-id="1"
        />
        <SpeakerView
          v-else
          :participants="roomStore.participants"
          :pinned-id="roomStore.pinnedParticipantId"
          :active-speaker="roomStore.activeSpeaker"
          :streams="videoStreams"
          :local-user-id="1"
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
        :current-user-id="1"
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
const notifSound = useNotificationSound()

const isSidePanelOpen = ref(true)
const activeTab = ref('chat')
// Map participantId -> MediaStream pour les flux video
const videoStreams = reactive({})
let speakingInterval = null

// Donnees fictives pour la demo (sera remplace par WebSocket)
const mockParticipants = [
  { id: 1, username: userStore.username || 'Bath Dorgeles', avatar: 'BD', avatarUrl: userStore.avatarUrl || '', isHost: true, isMuted: false, isCameraOff: false, isScreenSharing: false, isSpeaking: true },
  { id: 2, username: 'Oclin Marcel C.', avatar: 'MC', isHost: false, isMuted: false, isCameraOff: false, isScreenSharing: false, isSpeaking: false },
  { id: 3, username: 'Rayane Irie', avatar: 'RI', isHost: false, isMuted: true, isCameraOff: false, isScreenSharing: false, isSpeaking: false },
  { id: 4, username: 'Fatou Diallo', avatar: 'FD', isHost: false, isMuted: false, isCameraOff: true, isScreenSharing: false, isSpeaking: false },
  { id: 5, username: 'Konan Affoue', avatar: 'KA', isHost: false, isMuted: true, isCameraOff: false, isScreenSharing: false, isSpeaking: false },
  { id: 6, username: 'Moussa Toure', avatar: 'MT', isHost: false, isMuted: false, isCameraOff: false, isScreenSharing: false, isSpeaking: false }
]

const mockMessages = [
  { id: 1, senderId: 1, senderName: userStore.username || 'Bath Dorgeles', content: 'Bienvenue a tous dans la reunion ! 👋', timestamp: '14:00' },
  { id: 2, senderId: 2, senderName: 'Oclin Marcel C.', content: 'Salut Bath ! On est la 💪', timestamp: '14:01' },
  { id: 3, senderId: 3, senderName: 'Rayane Irie', content: 'Le back-end est pret, on peut commencer la demo', timestamp: '14:02' },
  { id: 4, senderId: 4, senderName: 'Fatou Diallo', content: 'Ma camera a un souci, je reste en audio pour l\'instant', timestamp: '14:03' },
  { id: 5, senderId: 1, senderName: userStore.username || 'Bath Dorgeles', content: 'Pas de probleme Fatou. On commence le point sur les projets difficiles', timestamp: '14:04' },
  { id: 6, senderId: 5, senderName: 'Konan Affoue', content: 'J\'ai une question sur PistCI, je la pose apres la demo', timestamp: '14:05' },
  { id: 7, senderId: 6, senderName: 'Moussa Toure', content: 'IvorioCI avance bien, le streaming HLS fonctionne 🎬', timestamp: '14:06' }
]

onMounted(async () => {
  // Rediriger vers home si pas de nom d'utilisateur
  if (!userStore.username) {
    router.push({ name: 'home' })
    return
  }

  // Initialiser la room avec les donnees fictives
  roomStore.setRoomInfo({ id: 1, code: props.code, name: '', hostId: 1 })
  mockParticipants.forEach(p => roomStore.addParticipant(p))
  mockMessages.forEach(m => chatStore.addMessage(m))

  // Demarrer la camera et le micro de l'utilisateur local
  const stream = await media.startMedia()
  if (stream) {
    videoStreams[1] = stream
    roomStore.isCameraOff = media.isCameraOff.value
    roomStore.isMuted = media.isMuted.value
    // Demarrer la detection vocale sur le flux local
    voiceDetection.start(stream)
  }

  // Demarrer le timer
  callTimer.start()

  // Mettre a jour l'indicateur de parole du user local via la detection vocale
  // + simulation aleatoire pour les autres participants (sera remplace par WebRTC)
  speakingInterval = setInterval(() => {
    // Utilisateur local : detection reelle
    roomStore.updateParticipant(1, {
      isSpeaking: !roomStore.isMuted && voiceDetection.isSpeaking.value
    })
    // Autres participants : simulation (sera remplace par les streams distants)
    roomStore.participants.forEach(p => {
      if (p.id !== 1) {
        roomStore.updateParticipant(p.id, {
          isSpeaking: !p.isMuted && Math.random() > 0.7
        })
      }
    })
  }, 200)
})

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

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  callTimer.stop()
  voiceDetection.stop()
  media.stopMedia()
  if (speakingInterval) clearInterval(speakingInterval)
  roomStore.resetRoom()
  chatStore.clearMessages()
})

function handleToggleMute() {
  media.toggleMute()
  roomStore.isMuted = media.isMuted.value
  roomStore.updateParticipant(1, { isMuted: media.isMuted.value })
}

async function handleToggleCamera() {
  await media.toggleCamera()
  roomStore.isCameraOff = media.isCameraOff.value
  roomStore.updateParticipant(1, { isCameraOff: media.isCameraOff.value })
}

async function handleToggleScreen() {
  // Fermer le panneau lateral avant le partage (evite le chevauchement sur mobile)
  isSidePanelOpen.value = false
  const stream = await media.toggleScreenSharing()
  roomStore.isScreenSharing = media.isScreenSharing.value
  roomStore.updateParticipant(1, { isScreenSharing: media.isScreenSharing.value })

  if (stream) {
    // Afficher le partage d'ecran dans la tuile de l'utilisateur
    videoStreams[1] = stream
    // Quand le partage s'arrete (via navigateur), revenir a la camera
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      roomStore.isScreenSharing = false
      roomStore.updateParticipant(1, { isScreenSharing: false })
      // Restaurer le flux camera si elle n'est pas coupee
      if (media.localStream.value && !media.isCameraOff.value) {
        videoStreams[1] = media.localStream.value
      }
    })
  } else {
    // Partage arrete, restaurer le flux camera
    if (media.localStream.value && !media.isCameraOff.value) {
      videoStreams[1] = media.localStream.value
    }
  }
}

function handleSetView(mode) {
  roomStore.setViewMode(mode)
}

function handleSendMessage(content) {
  chatStore.addMessage({
    senderId: 1,
    senderName: userStore.username,
    content
  })
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
