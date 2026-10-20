import { consoleStore } from './store'

export type PadKind = 'kick' | 'hit' | 'riser' | 'drop'

type Engine = {
  ctx: AudioContext
  master: GainNode
  analyser: AnalyserNode
  noise: AudioBuffer
  samples: Uint8Array<ArrayBuffer>
}

let engine: Engine | null = null

/** Creates the audio graph on first call (must come from a user gesture). Returns false without Web Audio. */
export async function initAudio(): Promise<boolean> {
  if (engine) {
    await engine.ctx.resume()
    return true
  }
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return false

  const ctx = new Ctor()
  const master = ctx.createGain()
  master.gain.value = 0
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  master.connect(analyser)
  analyser.connect(ctx.destination)

  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

  engine = { ctx, master, analyser, noise, samples: new Uint8Array(analyser.fftSize) }

  // Mute follows the store; a short time constant avoids clicks.
  const applyMute = () => master.gain.setTargetAtTime(consoleStore.get().soundOn ? 0.8 : 0, ctx.currentTime, 0.02)
  consoleStore.subscribe(applyMute)
  applyMute()

  await ctx.resume()
  return true
}

function envelope(ctx: AudioContext, peak: number, attack: number, decay: number, t: number) {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  return g
}

function noiseSource(e: Engine) {
  const src = e.ctx.createBufferSource()
  src.buffer = e.noise
  src.loop = true
  return src
}

function kick(e: Engine, t: number, length = 0.3) {
  const osc = e.ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, t)
  osc.frequency.exponentialRampToValueAtTime(40, t + length)
  osc.connect(envelope(e.ctx, 1, 0.005, length, t)).connect(e.master)
  osc.start(t)
  osc.stop(t + length + 0.05)
}

function hit(e: Engine, t: number) {
  const src = noiseSource(e)
  const hp = e.ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1200
  src.connect(hp).connect(envelope(e.ctx, 0.7, 0.002, 0.15, t)).connect(e.master)
  src.start(t)
  src.stop(t + 0.2)
}

function riser(e: Engine, t: number) {
  const dur = 2
  const lp = e.ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(200, t)
  lp.frequency.exponentialRampToValueAtTime(8000, t + dur)

  const src = noiseSource(e)
  const saw = e.ctx.createOscillator()
  saw.type = 'sawtooth'
  saw.frequency.setValueAtTime(110, t)
  saw.frequency.exponentialRampToValueAtTime(440, t + dur)

  const g = e.ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.4, t + dur)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08)

  src.connect(lp)
  saw.connect(lp)
  lp.connect(g).connect(e.master)
  src.start(t)
  saw.start(t)
  src.stop(t + dur + 0.1)
  saw.stop(t + dur + 0.1)
}

function drop(e: Engine, t: number) {
  kick(e, t, 0.5)
  const sub = e.ctx.createOscillator()
  sub.type = 'sine'
  sub.frequency.value = 55
  sub.connect(envelope(e.ctx, 0.8, 0.01, 0.8, t)).connect(e.master)
  sub.start(t)
  sub.stop(t + 0.9)
}

const PADS: Record<PadKind, (e: Engine, t: number) => void> = {
  kick: (e, t) => kick(e, t),
  hit,
  riser,
  drop,
}

export function playPad(kind: PadKind) {
  if (!engine || !consoleStore.get().soundOn) return
  PADS[kind](engine, engine.ctx.currentTime)
}

export function playClick() {
  if (!engine || !consoleStore.get().soundOn) return
  const t = engine.ctx.currentTime
  const src = noiseSource(engine)
  src.connect(envelope(engine.ctx, 0.05, 0.0005, 0.002, t)).connect(engine.master)
  src.start(t)
  src.stop(t + 0.01)
}

/** Peak level 0..1 of the current output; 0 before audio starts. */
export function readLevel(): number {
  if (!engine) return 0
  const buf = engine.samples
  engine.analyser.getByteTimeDomainData(buf)
  let peak = 0
  for (const v of buf) peak = Math.max(peak, Math.abs(v - 128) / 128)
  return peak
}
