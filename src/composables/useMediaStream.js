import { ref, onUnmounted } from 'vue'

export function useMediaStream() {
  const localStream = ref(null)
  const screenStream = ref(null)
  const isMuted = ref(false)
  const isCameraOff = ref(false)
  const isScreenSharing = ref(false)

  // Demander l'acces camera + micro
  async function startMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      localStream.value = stream
      return stream
    } catch (error) {
      console.warn('Impossible d\'acceder a la camera/micro:', error.message)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        })
        localStream.value = stream
        isCameraOff.value = true
        return stream
      } catch {
        console.warn('Aucun peripherique media disponible')
        return null
      }
    }
  }

  // Couper / reactiver le micro
  function toggleMute() {
    if (!localStream.value) return
    const audioTracks = localStream.value.getAudioTracks()
    audioTracks.forEach(track => {
      track.enabled = !track.enabled
    })
    isMuted.value = !isMuted.value
  }

  // Couper la camera : on stop() le track video pour eteindre la LED
  // Reactiver : on relance getUserMedia video et on ajoute le track au stream
  async function toggleCamera() {
    if (!localStream.value) return

    if (!isCameraOff.value) {
      // Couper : arreter les tracks video
      localStream.value.getVideoTracks().forEach(track => track.stop())
      isCameraOff.value = true
    } else {
      // Reactiver : demander un nouveau flux video
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
        const newVideoTrack = videoStream.getVideoTracks()[0]
        // Retirer les anciens tracks video morts
        localStream.value.getVideoTracks().forEach(track => localStream.value.removeTrack(track))
        // Ajouter le nouveau track au stream existant
        localStream.value.addTrack(newVideoTrack)
        isCameraOff.value = false
      } catch (error) {
        console.warn('Impossible de reactiver la camera:', error.message)
      }
    }
  }

  // Demarrer / arreter le partage d'ecran
  // Retourne le stream ecran ou null
  async function toggleScreenSharing() {
    if (!isScreenSharing.value) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        })
        screenStream.value = stream
        isScreenSharing.value = true

        // Detecter quand l'utilisateur arrete le partage via le navigateur
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          stopScreenSharing()
        })

        return stream
      } catch (error) {
        console.warn('Partage d\'ecran annule ou refuse:', error.message)
        return null
      }
    } else {
      stopScreenSharing()
      return null
    }
  }

  function stopScreenSharing() {
    if (screenStream.value) {
      screenStream.value.getTracks().forEach(track => track.stop())
      screenStream.value = null
    }
    isScreenSharing.value = false
  }

  // Arreter tous les flux media
  function stopMedia() {
    if (localStream.value) {
      localStream.value.getTracks().forEach(track => track.stop())
      localStream.value = null
    }
    stopScreenSharing()
  }

  onUnmounted(stopMedia)

  return {
    localStream,
    screenStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    startMedia,
    toggleMute,
    toggleCamera,
    toggleScreenSharing,
    stopScreenSharing,
    stopMedia
  }
}
