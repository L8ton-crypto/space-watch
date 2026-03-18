"use client";

// Web Audio API sonification for satellite passes
let audioCtx: AudioContext | null = null;
let isAudioEnabled = false;

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function enableAudio() {
  const ctx = getContext();
  if (ctx.state === "suspended") ctx.resume();
  isAudioEnabled = true;
}

export function disableAudio() {
  isAudioEnabled = false;
}

export function isAudioOn() {
  return isAudioEnabled;
}

// Ethereal ping when a satellite is overhead
export function playPassTone(altitude: number, category: string) {
  if (!isAudioEnabled) return;

  const ctx = getContext();
  const now = ctx.currentTime;

  // Higher altitude = higher pitch (200-800Hz range)
  const minAlt = 200;
  const maxAlt = 36000;
  const normalised = Math.min(1, Math.max(0, (altitude - minAlt) / (maxAlt - minAlt)));
  const freq = 200 + normalised * 600;

  // Category affects timbre
  const isStation = category === "Space Stations";

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = isStation ? "sine" : "triangle";
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + 0.5);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2000, now);
  filter.Q.setValueAtTime(2, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(isStation ? 0.08 : 0.04, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 2);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 2);
}

// Ambient cosmic hum (very subtle)
export function playAmbient() {
  if (!isAudioEnabled) return;

  const ctx = getContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(60, now);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.015, now + 2);
  gain.gain.linearRampToValueAtTime(0.01, now + 4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 4);
}

// Click/select sound
export function playSelectTone() {
  if (!isAudioEnabled) return;

  const ctx = getContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.3);
}
