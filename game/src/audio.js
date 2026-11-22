// GILDED HOUR — sound: every effect is synthesized with WebAudio.
// One job: turn the world's sound queue into bleeps, chimes and sirens.
// No downloaded audio anywhere; the game stays silent until the first key press.

let ctx = null;
let master = null;
let muted = false;
let padStarted = false;

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

function tone(freq, dur, type = 'sine', volume = 0.2, when = 0, slideTo = null) {
  if (!ensureContext() || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, volume = 0.15, lowpass = 1200) {
  if (!ensureContext() || muted) return;
  const t0 = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t0);
}

export function initAudio() {
  ensureContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
  startPad();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

// A quiet, low night-club pad: two detuned sines under everything.
function startPad() {
  if (padStarted || !ensureContext() || muted) return;
  padStarted = true;
  [110, 164.8, 220.5].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.detune.value = i === 2 ? 4 : 0;
    gain.gain.value = i === 0 ? 0.035 : 0.018;
    osc.connect(gain);
    gain.connect(master);
    osc.start();
  });
}

/** Play one named effect from the world's sound queue. */
export function playSound(name) {
  if (muted) return;
  switch (name) {
    case 'pickup':
      tone(880, 0.09, 'sine', 0.16);
      tone(1318, 0.12, 'sine', 0.14, 0.07);
      break;
    case 'star':
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'triangle', 0.18, i * 0.08));
      break;
    case 'coinThrow':
      tone(1200, 0.08, 'square', 0.05, 0, 900);
      break;
    case 'coinLand':
      tone(1567, 0.06, 'triangle', 0.14);
      tone(2093, 0.08, 'triangle', 0.1, 0.05);
      break;
    case 'smoke':
      noiseBurst(0.5, 0.2, 900);
      break;
    case 'emp':
      tone(1800, 0.25, 'sawtooth', 0.08, 0, 120);
      tone(900, 0.2, 'square', 0.05, 0.05, 90);
      break;
    case 'alarm':
      [0, 0.22, 0.44].forEach((w) => {
        tone(620, 0.2, 'square', 0.1, w, 880);
        tone(880, 0.2, 'square', 0.1, w + 0.11, 620);
      });
      break;
    case 'caught':
      tone(220, 0.5, 'sawtooth', 0.16, 0, 55);
      noiseBurst(0.2, 0.12, 600);
      break;
    case 'clear':
      [392, 523, 659, 784].forEach((f, i) => tone(f, 0.2, 'triangle', 0.16, i * 0.09));
      break;
    case 'win':
      [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, 0.3, 'triangle', 0.16, i * 0.11));
      break;
    case 'click':
      tone(700, 0.05, 'square', 0.08);
      break;
    case 'step':
      noiseBurst(0.05, 0.04, 500);
      break;
    default:
      break;
  }
}
