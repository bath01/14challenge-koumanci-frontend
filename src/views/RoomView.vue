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
// ID de l'utilisateur local (depuis le profil auth)
const localUserId = ref(authStore.user?.id || 1)

onMounted(async () => {
  // Rediriger vers home si pas de nom d'utilisateur
  if (!userStore.username) {
    router.push({ name: 'home' })
    return
  }

  // Charger les infos de la room depuis l'API
  try {
    const room = await roomApi.getByCode(props.code)
    roomStore.setRoomInfo({
      id: room.id,
      code: room.code || props.code,
      name: room.name || '',
      hostId: room.hostId || room.creatorId
    })
  } catch {
    // Fallback si la room n'est pas trouvee
    roomStore.setRoomInfo({ id: null, code: props.code, name: '', hostId: localUserId.value })
  }

  // Charger les participants depuis l'API
  try {
    const participants = await participantApi.list(props.code)
    const participantList = participants.data || participants || []
    participantList.forEach(p => {
      roomStore.addParticipant({
        id: p.userId || p.id,
        username: p.fullName || p.username || 'Participant',
        avatar: (p.fullName || p.username || 'P').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(),
        avatarUrl: p.avatarUrl || '',
        isHost: p.role === 'host',
        isMuted: false,
        isCameraOff: !p.canPublishVideo,
        isScreenSharing: false,
        isSpeaking: false
      })
    })
  } catch {
    // Ajouter au moins l'utilisateur local comme participant
    roomStore.addParticipant({
      id: localUserId.value,
      username: userStore.username,
      avatar: userStore.getInitials(),
      avatarUrl: userStore.avatarUrl || '',
      isHost: true,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      isSpeaking: false
    })
  }

  // Demarrer la camera et le micro de l'utilisateur local
  const stream = await media.startMedia()
  if (stream) {
    videoStreams[localUserId.value] = stream
    roomStore.isCameraOff = media.isCameraOff.value
    roomStore.isMuted = media.isMuted.value
    // Demarrer la detection vocale sur le flux local
    voiceDetection.start(stream)
  }

  // Demarrer le timer
  callTimer.start()

  // Mettre a jour l'indicateur de parole
  speakingInterval = setInterval(() => {
    roomStore.updateParticipant(localUserId.value, {
      isSpeaking: !roomStore.isMuted && voiceDetection.isSpeaking.value
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

onUnmounted(async () => {
  window.removeEventListener('keydown', handleKeydown)
  callTimer.stop()
  voiceDetection.stop()
  media.stopMedia()
  if (speakingInterval) clearInterval(speakingInterval)
  // Notifier le backend qu'on quitte la room
  try { await roomApi.leave(props.code) } catch { /* ignore */ }
  roomStore.resetRoom()
  chatStore.clearMessages()
})

function handleToggleMute() {
  media.toggleMute()
  roomStore.isMuted = media.isMuted.value
  roomStore.updateParticipant(localUserId.value, { isMuted: media.isMuted.value })
}

async function handleToggleCamera() {
  await media.toggleCamera()
  roomStore.isCameraOff = media.isCameraOff.value
  roomStore.updateParticipant(localUserId.value, { isCameraOff: media.isCameraOff.value })
}

async function handleToggleScreen() {
  // Fermer le panneau lateral avant le partage (evite le chevauchement sur mobile)
  isSidePanelOpen.value = false
  const stream = await media.toggleScreenSharing()
  roomStore.isScreenSharing = media.isScreenSharing.value
  roomStore.updateParticipant(localUserId.value, { isScreenSharing: media.isScreenSharing.value })

  if (stream) {
    // Afficher le partage d'ecran dans la tuile de l'utilisateur
    videoStreams[localUserId.value] = stream
    // Quand le partage s'arrete (via navigateur), revenir a la camera
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      roomStore.isScreenSharing = false
      roomStore.updateParticipant(localUserId.value, { isScreenSharing: false })
      // Restaurer le flux camera si elle n'est pas coupee
      if (media.localStream.value && !media.isCameraOff.value) {
        videoStreams[localUserId.value] = media.localStream.value
      }
    })
  } else {
    // Partage arrete, restaurer le flux camera
    if (media.localStream.value && !media.isCameraOff.value) {
      videoStreams[localUserId.value] = media.localStream.value
    }
  }
}

function handleSetView(mode) {
  roomStore.setViewMode(mode)
}

function handleSendMessage(content) {
  chatStore.addMessage({
    senderId: localUserId.value,
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
