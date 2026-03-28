import { ref, onUnmounted, computed } from 'vue'

export function useCallTimer() {
  const seconds = ref(0)
  let intervalId = null

  const formatted = computed(() => {
    const h = Math.floor(seconds.value / 3600)
    const m = Math.floor((seconds.value % 3600) / 60)
    const s = seconds.value % 60
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  function start() {
    stop()
    seconds.value = 0
    intervalId = setInterval(() => {
      seconds.value++
    }, 1000)
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  onUnmounted(stop)

  return { seconds, formatted, start, stop }
}
