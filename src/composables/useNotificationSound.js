// Sons de notification generes via Web Audio API (pas de fichiers externes)
export function useNotificationSound() {
  let audioCtx = null

  function getContext() {
    if (!audioCtx) {
      audioCtx = new AudioContext()
    }
    return audioCtx
  }

  // Son court quand un participant rejoint
  function playJoin() {
    const ctx = getContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  }

  // Son quand un participant quitte
  function playLeave() {
    const ctx = getContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(700, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.25)
  }

  // Son discret pour un nouveau message
  function playMessage() {
    const ctx = getContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.1)
  }

  return { playJoin, playLeave, playMessage }
}
