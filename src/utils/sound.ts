type SoundKind = "tap" | "success" | "notify" | "error"

let sharedCtx: AudioContext | null = null

function getCtx() {
  if (typeof window === "undefined") return null
  const AC = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!sharedCtx) sharedCtx = new AC()
  if (sharedCtx.state === "suspended") {
    sharedCtx.resume().catch(() => undefined)
  }
  return sharedCtx
}

function tone(ctx: AudioContext, freq: number, duration: number, startAt: number, type: OscillatorType, volume: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, startAt)
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.02)
}

export function playAppSound(kind: SoundKind) {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime

  if (kind === "tap") {
    tone(ctx, 520, 0.06, now, "triangle", 0.03)
    return
  }
  if (kind === "success") {
    tone(ctx, 480, 0.08, now, "sine", 0.035)
    tone(ctx, 740, 0.12, now + 0.06, "sine", 0.04)
    return
  }
  if (kind === "notify") {
    tone(ctx, 620, 0.08, now, "square", 0.028)
    tone(ctx, 880, 0.09, now + 0.11, "square", 0.03)
    return
  }
  tone(ctx, 280, 0.1, now, "sawtooth", 0.02)
}

