import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useRoomStore = defineStore('room', () => {
  // --- Modele Room ---
  const id = ref(null)
  const code = ref('')
  const name = ref('')
  const hostId = ref(null)
  const maxParticipants = ref(6)
  const isLocked = ref(false)
  const createdAt = ref(null)

  // --- Participants ---
  const participants = ref([])

  // --- Etat media local ---
  const localStream = ref(null)
  const isMuted = ref(false)
  const isCameraOff = ref(false)
  const isScreenSharing = ref(false)
  const selectedAudioDevice = ref(null)
  const selectedVideoDevice = ref(null)
  const availableDevices = ref([])

  // --- Etat media distant ---
  const remoteStreams = ref({})
  const connectionStates = ref({})

  // --- Mise en page video ---
  const viewMode = ref('grid')
  const pinnedParticipantId = ref(null)
  const activeSpeakerId = ref(null)

  // --- Colonnes de la grille (auto selon nb participants) ---
  const gridColumns = computed(() => {
    const count = participants.value.length
    if (count <= 2) return 2
    if (count <= 4) return 2
    return 3
  })

  // --- Participant actif (celui qui parle ou le premier) ---
  const activeSpeaker = computed(() => {
    return participants.value.find(p => p.isSpeaking) || participants.value[0] || null
  })

  // --- Actions Room ---
  function setRoomInfo({ id: roomId, code: roomCode, name: roomName, hostId: host }) {
    id.value = roomId
    code.value = roomCode
    name.value = roomName || ''
    hostId.value = host
    createdAt.value = new Date().toISOString()
  }

  function resetRoom() {
    id.value = null
    code.value = ''
    name.value = ''
    hostId.value = null
    participants.value = []
    isLocked.value = false
    isMuted.value = false
    isCameraOff.value = false
    isScreenSharing.value = false
    viewMode.value = 'grid'
    pinnedParticipantId.value = null
    activeSpeakerId.value = null
    remoteStreams.value = {}
    connectionStates.value = {}
  }

  // --- Actions Participants ---
  function addParticipant(participant) {
    if (!participants.value.find(p => p.id === participant.id)) {
      participants.value.push(participant)
    }
  }

  function removeParticipant(participantId) {
    participants.value = participants.value.filter(p => p.id !== participantId)
  }

  function updateParticipant(participantId, updates) {
    const participant = participants.value.find(p => p.id === participantId)
    if (participant) {
      Object.assign(participant, updates)
    }
  }

  // --- Controles de l'hote ---
  function muteParticipant(participantId) {
    updateParticipant(participantId, { isMuted: true })
  }

  function toggleMuteParticipant(participantId) {
    const p = participants.value.find(p => p.id === participantId)
    if (p) {
      updateParticipant(participantId, { isMuted: !p.isMuted })
    }
  }

  // --- Controles media locaux ---
  function toggleMute() {
    isMuted.value = !isMuted.value
  }

  function toggleCamera() {
    isCameraOff.value = !isCameraOff.value
  }

  function toggleScreenSharing() {
    isScreenSharing.value = !isScreenSharing.value
  }

  function setViewMode(mode) {
    viewMode.value = mode
    if (mode === 'grid') {
      pinnedParticipantId.value = null
    }
  }

  function pinParticipant(participantId) {
    pinnedParticipantId.value =
      pinnedParticipantId.value === participantId ? null : participantId
  }

  return {
    // Room
    id, code, name, hostId, maxParticipants, isLocked, createdAt,
    // Participants
    participants, gridColumns, activeSpeaker,
    // Media local
    localStream, isMuted, isCameraOff, isScreenSharing,
    selectedAudioDevice, selectedVideoDevice, availableDevices,
    // Media distant
    remoteStreams, connectionStates,
    // Layout
    viewMode, pinnedParticipantId, activeSpeakerId,
    // Actions
    setRoomInfo, resetRoom,
    addParticipant, removeParticipant, updateParticipant,
    muteParticipant, toggleMuteParticipant,
    toggleMute, toggleCamera, toggleScreenSharing,
    setViewMode, pinParticipant
  }
})
