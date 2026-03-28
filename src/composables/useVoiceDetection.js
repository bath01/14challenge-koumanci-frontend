import { ref, onUnmounted } from 'vue'

// Detecte l'activite vocale via Web Audio API (AnalyserNode)
// Avec debounce pour eviter le clignotement rapide
export function useVoiceDetection(threshold = 12) {
  const isSpeaking = ref(false)
  const volume = ref(0)
  let audioContext = null
  let analyser = null
  let animationId = null
  let speakingTimeout = null

  function start(stream) {
    if (!stream) return

    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) return

    audioContext = new AudioContext()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.4

    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    function detect() {
      analyser.getByteFrequencyData(dataArray)

      // Calcul du volume moyen (RMS-like sur les frequences vocales)
      let sum = 0
      // Se concentrer sur les frequences vocales (bins ~85Hz-1000Hz)
      const startBin = 2
      const endBin = Math.min(60, dataArray.length)
      for (let i = startBin; i < endBin; i++) {
        sum += dataArray[i]
      }
      const average = sum / (endBin - startBin)
      volume.value = average

      if (average > threshold) {
        // Parle : activer immediatement
        isSpeaking.value = true
        // Reset le timeout de fin de parole
        if (speakingTimeout) {
          clearTimeout(speakingTimeout)
          speakingTimeout = null
        }
      } else if (isSpeaking.value && !speakingTimeout) {
        // Arrete de parler : attendre 300ms avant de desactiver
        // Evite le clignotement entre les mots
        speakingTimeout = setTimeout(() => {
          isSpeaking.value = false
          speakingTimeout = null
        }, 300)
      }

      animationId = requestAnimationFrame(detect)
    }

    detect()
  }

  function stop() {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
    if (speakingTimeout) {
      clearTimeout(speakingTimeout)
      speakingTimeout = null
    }
    if (audioContext) {
      audioContext.close()
      audioContext = null
    }
    isSpeaking.value = false
    volume.value = 0
  }

  onUnmounted(stop)

  return { isSpeaking, volume, start, stop }
}
