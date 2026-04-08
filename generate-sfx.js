#!/usr/bin/env node
/**
 * TeachAny zero-dependency WAV SFX generator.
 * Generates seven teaching-friendly sound effects into public/sfx.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'public', 'sfx');
const SAMPLE_RATE = 44100;

const SOUND_PRESETS = {
  pop: { duration: 0.12, type: 'sine', startFreq: 880, endFreq: 660, attack: 0.01, release: 0.07, gain: 0.45 },
  step: { duration: 0.09, type: 'square', startFreq: 240, endFreq: 180, attack: 0.005, release: 0.05, gain: 0.22 },
  highlight: { duration: 0.28, type: 'sine', startFreq: 540, endFreq: 960, attack: 0.01, release: 0.12, gain: 0.35 },
  success: { duration: 0.42, type: 'sine', notes: [523.25, 659.25, 783.99], gain: 0.36 },
  whoosh: { duration: 0.35, type: 'noise', attack: 0.02, release: 0.18, gain: 0.18 },
  ding: { duration: 0.55, type: 'sine', startFreq: 1046.5, endFreq: 880, attack: 0.01, release: 0.25, gain: 0.35 },
  error: { duration: 0.32, type: 'saw', notes: [260, 220], gain: 0.24 },
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function envelope(t, duration, attack = 0.01, release = 0.1) {
  const attackEnd = Math.max(attack, 0.001);
  const releaseStart = Math.max(duration - release, attackEnd);
  if (t < attackEnd) return t / attackEnd;
  if (t > releaseStart) return Math.max(0, (duration - t) / Math.max(duration - releaseStart, 0.001));
  return 1;
}

function oscillator(type, phase) {
  switch (type) {
    case 'square':
      return Math.sign(Math.sin(phase));
    case 'saw':
      return 2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5));
    case 'noise':
      return Math.random() * 2 - 1;
    case 'sine':
    default:
      return Math.sin(phase);
  }
}

function createSamples(config) {
  const sampleCount = Math.floor(config.duration * SAMPLE_RATE);
  const samples = new Float32Array(sampleCount);

  if (Array.isArray(config.notes) && config.notes.length > 0) {
    const sliceDuration = config.duration / config.notes.length;
    let cursor = 0;
    config.notes.forEach((note, idx) => {
      const end = idx === config.notes.length - 1 ? sampleCount : Math.floor((idx + 1) * sliceDuration * SAMPLE_RATE);
      for (; cursor < end; cursor += 1) {
        const localT = (cursor - Math.floor(idx * sliceDuration * SAMPLE_RATE)) / SAMPLE_RATE;
        const phase = 2 * Math.PI * note * localT;
        samples[cursor] = oscillator(config.type, phase) * envelope(localT, sliceDuration, 0.01, 0.12) * config.gain;
      }
    });
    return samples;
  }

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / SAMPLE_RATE;
    const progress = sampleCount <= 1 ? 0 : i / (sampleCount - 1);
    const freq = lerp(config.startFreq || 440, config.endFreq || config.startFreq || 440, progress);
    const phase = 2 * Math.PI * freq * t;
    const amp = envelope(t, config.duration, config.attack || 0.01, config.release || 0.1) * (config.gain || 0.3);
    samples[i] = oscillator(config.type, phase) * amp;
  }

  return samples;
}

function floatTo16BitPCM(samples) {
  const buffer = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, i * 2);
  }
  return buffer;
}

function createWavBuffer(samples) {
  const pcm = floatTo16BitPCM(samples);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  Object.entries(SOUND_PRESETS).forEach(([name, config]) => {
    const file = path.join(OUT_DIR, `${name}.wav`);
    const wavBuffer = createWavBuffer(createSamples(config));
    fs.writeFileSync(file, wavBuffer);
    console.log(`✅ ${path.relative(ROOT, file)}`);
  });
  console.log('\n🎉 教学音效生成完成');
}

main();
