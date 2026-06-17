/**
 * brandAudio.js — Sonic branding engine for Querube
 * Uses Web Audio API oscillators and noise generators to create
 * premium-feeling sound effects without any audio file dependencies.
 *
 * All sounds respect a global mute state and gracefully degrade
 * on browsers that don't support Web Audio.
 */

let audioCtx = null;
let muted = true; // Start muted until user interacts

/** Lazily create or resume the AudioContext (browser autoplay policy) */
function getCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

/** Create a simple convolver reverb impulse */
function createReverbImpulse(ctx, duration = 1.5, decay = 2.5) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Brand tone — Pentatonic chord (C-E-G) with piano-like attack and reverb.
 * Used on app load / landing CTA click.
 */
export function playBrandTone() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [261.63, 329.63, 392.00]; // C4, E4, G4

  // Reverb send
  const convolver = ctx.createConvolver();
  convolver.buffer = createReverbImpulse(ctx, 1.8, 3);
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.25;
  convolver.connect(reverbGain);
  reverbGain.connect(ctx.destination);

  // Dry master
  const master = ctx.createGain();
  master.gain.value = 0.18;
  master.connect(ctx.destination);
  master.connect(convolver);

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const env = ctx.createGain();
    const offset = i * 0.08;
    env.gain.setValueAtTime(0, now + offset);
    env.gain.linearRampToValueAtTime(0.6, now + offset + 0.04);
    env.gain.exponentialRampToValueAtTime(0.001, now + offset + 1.6);

    osc.connect(env);
    env.connect(master);
    osc.start(now + offset);
    osc.stop(now + offset + 1.8);
  });
}

/**
 * Lot selection chime — Crisp, crystalline F5 tone.
 * Used when a user taps/clicks a lot on the map.
 */
export function playLotSelect() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 698.46; // F5

  const harmonic = ctx.createOscillator();
  harmonic.type = 'sine';
  harmonic.frequency.value = 698.46 * 2; // F6 overtone

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(0.15, now + 0.01);
  env.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  const harmonicEnv = ctx.createGain();
  harmonicEnv.gain.setValueAtTime(0, now);
  harmonicEnv.gain.linearRampToValueAtTime(0.05, now + 0.01);
  harmonicEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(env);
  harmonic.connect(harmonicEnv);
  env.connect(ctx.destination);
  harmonicEnv.connect(ctx.destination);

  osc.start(now);
  harmonic.start(now);
  osc.stop(now + 0.7);
  harmonic.stop(now + 0.4);
}

/**
 * Tour start — Swelling synth pad (string-like).
 * Used when the cinematic drone flight begins.
 */
export function playTourStart() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const padNotes = [196.00, 261.63, 329.63, 392.00]; // G3, C4, E4, G4

  const convolver = ctx.createConvolver();
  convolver.buffer = createReverbImpulse(ctx, 3, 2);
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.4;
  convolver.connect(reverbGain);
  reverbGain.connect(ctx.destination);

  const master = ctx.createGain();
  master.gain.value = 0.12;
  master.connect(ctx.destination);
  master.connect(convolver);

  padNotes.forEach(freq => {
    // Detuned pair for richness
    [-3, 3].forEach(detune => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;

      // Low-pass for warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.7;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.3, now + 2.5);
      env.gain.linearRampToValueAtTime(0.15, now + 4.0);
      env.gain.exponentialRampToValueAtTime(0.001, now + 5.5);

      osc.connect(filter);
      filter.connect(env);
      env.connect(master);
      osc.start(now);
      osc.stop(now + 5.8);
    });
  });
}

/**
 * Panel close — Wind whisper (filtered white noise fade-out).
 * Used when closing the lot details panel.
 */
export function playPanelClose() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.6;
  const bufferSize = ctx.sampleRate * duration;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(2000, now);
  bandpass.frequency.exponentialRampToValueAtTime(400, now + duration);
  bandpass.Q.value = 1.5;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.08, now);
  env.gain.exponentialRampToValueAtTime(0.001, now + duration);

  source.connect(bandpass);
  bandpass.connect(env);
  env.connect(ctx.destination);
  source.start(now);
  source.stop(now + duration + 0.1);
}

// ─── Mute Control ────────────────────────────────────────────────

export function setMuted(value) {
  muted = !!value;
}

export function isMuted() {
  return muted;
}

/**
 * Enable sound on first user interaction.
 * Call this from a click/touch handler to comply with autoplay policy.
 */
export function enableOnInteraction() {
  muted = false;
  getCtx(); // Warm up the context
}
