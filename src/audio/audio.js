// WebAudio synth: instruments, sound effects and a small step sequencer for the music.
// Everything is generated in code; no samples. iOS needs the context to start on a user gesture.
import { SONGS } from './songs.js';

const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
export function midi(name) {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(name);
  if (!m) return null;
  return 12 * (Number(m[2]) + 1) + NOTE[m[1]];
}
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

const CHORD_SHAPES = {
  '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10],
  sus2: [0, 2, 7], sus4: [0, 5, 7], dim: [0, 3, 6], add9: [0, 4, 7, 14], m9: [0, 3, 7, 10, 14], '6': [0, 4, 7, 9],
};
export function chordNotes(sym, octave = 4) {
  const m = /^([A-G][#b]?)(.*)$/.exec(sym);
  const root = 12 * (octave + 1) + NOTE[m[1]];
  const shape = CHORD_SHAPES[m[2]] || CHORD_SHAPES[''];
  return { root, notes: shape.map(i => root + i) };
}

export const Audio = {
  ctx: null, master: null, music: null, sfxBus: null, reverb: null, reverbSend: null,
  started: false, soundOn: true, musicOn: true,
  song: null, songStart: 0, nextStep: 0, stepIndex: 0, timer: null, noise: null,
  coinStreak: 0, lastCoin: 0,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC({ latencyHint: 'interactive' });
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = this.soundOn ? 0.9 : 0;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    this.master.connect(comp); comp.connect(c.destination);
    this.music = c.createGain(); this.music.gain.value = this.musicOn ? 0.55 : 0; this.music.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = 0.8; this.sfxBus.connect(this.master);
    // Reverb from a generated impulse response.
    this.reverb = c.createConvolver();
    const len = Math.floor(c.sampleRate * 2.4);
    const ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    this.reverb.buffer = ir;
    const wet = c.createGain(); wet.gain.value = 0.35;
    this.reverb.connect(wet); wet.connect(this.master);
    this.reverbSend = c.createGain(); this.reverbSend.gain.value = 1; this.reverbSend.connect(this.reverb);
    // Shared white-noise buffer for drums and whooshes.
    const nb = c.createBuffer(1, c.sampleRate * 1, c.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;
  },

  // Call from the first pointerdown / keydown (iOS requirement).
  unlock() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
    if (!this.started) {
      const b = this.ctx.createBuffer(1, 1, 22050);
      const s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination); s.start(0);
      this.started = true;
    }
  },
  get running() { return !!this.ctx && this.ctx.state === 'running'; },
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {}); },
  resume() { if (this.ctx && this.ctx.state !== 'running' && this.started) this.ctx.resume().catch(() => {}); },
  setSound(on) { this.soundOn = on; if (this.master) this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05); },
  setMusic(on) { this.musicOn = on; if (this.music) this.music.gain.setTargetAtTime(on ? 0.55 : 0, this.ctx.currentTime, 0.05); },

  // ---------- instruments ----------
  env(g, t, a, peak, d, sustain = 0.0001) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
  },
  osc(type, f, t, end, dest, detune = 0) {
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
    o.connect(dest); o.start(t); o.stop(end + 0.05); return o;
  },
  out(dest, rev = 0) {
    const g = this.ctx.createGain();
    g.connect(dest);
    if (rev > 0) { const s = this.ctx.createGain(); s.gain.value = rev; g.connect(s); s.connect(this.reverbSend); }
    return g;
  },

  play(inst, m, t, dur, vel = 1, dest = this.music) {
    const c = this.ctx; const f = mtof(m);
    switch (inst) {
      case 'pluck': {
        const g = this.out(dest, 0.25); const lp = c.createBiquadFilter(); lp.type = 'lowpass';
        lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(700, t + 0.35); lp.connect(g);
        this.env(g, t, 0.006, 0.22 * vel, Math.max(0.25, dur * 1.2));
        this.osc('triangle', f, t, t + dur * 1.4 + 0.3, lp); this.osc('sine', f * 2, t, t + 0.3, lp);
        break;
      }
      case 'marimba': {
        const g = this.out(dest, 0.2); this.env(g, t, 0.004, 0.3 * vel, 0.45);
        this.osc('sine', f, t, t + 0.6, g);
        const g2 = this.out(dest); this.env(g2, t, 0.002, 0.06 * vel, 0.08); this.osc('sine', f * 4, t, t + 0.15, g2);
        break;
      }
      case 'bell': {
        const g = this.out(dest, 0.45); this.env(g, t, 0.004, 0.16 * vel, 1.6);
        const car = this.osc('sine', f, t, t + 1.8, g);
        const mod = c.createOscillator(); mod.frequency.value = f * 3.51;
        const mg = c.createGain(); mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(1, t + 1.2);
        mod.connect(mg); mg.connect(car.frequency); mod.start(t); mod.stop(t + 1.9);
        break;
      }
      case 'lead': {
        const g = this.out(dest, 0.3); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = 0.7; lp.connect(g);
        const hold = Math.max(0.08, dur - 0.04);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.13 * vel, t + 0.02);
        g.gain.setValueAtTime(0.11 * vel, t + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + hold + 0.18);
        const o1 = this.osc('triangle', f, t, t + hold + 0.2, lp);
        const o2 = this.osc('sawtooth', f, t, t + hold + 0.2, lp, 6);
        const o2g = c.createGain(); o2g.gain.value = 0.25; o2.disconnect(); o2.connect(o2g); o2g.connect(lp);
        if (dur > 0.3) { // gentle vibrato on long notes
          const l = c.createOscillator(); l.frequency.value = 5.2; const lg = c.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + 0.3);
          l.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency); l.start(t); l.stop(t + hold + 0.2);
        }
        break;
      }
      case 'pad': {
        const g = this.out(dest, 0.6); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.connect(g);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045 * vel, t + 0.25);
        g.gain.setValueAtTime(0.04 * vel, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.7);
        this.osc('sawtooth', f, t, t + dur + 0.8, lp, -8); this.osc('sawtooth', f, t, t + dur + 0.8, lp, 8);
        break;
      }
      case 'bass': {
        const g = this.out(dest); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.connect(g);
        const hold = Math.max(0.1, dur - 0.03);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.32 * vel, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.18 * vel, t + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + hold + 0.08);
        this.osc('sine', f, t, t + hold + 0.1, lp); this.osc('triangle', f, t, t + hold + 0.1, lp);
        break;
      }
      case 'kick': {
        const g = this.out(dest); this.env(g, t, 0.002, 0.7 * vel, 0.32);
        const o = this.osc('sine', 150, t, t + 0.4, g); o.frequency.exponentialRampToValueAtTime(42, t + 0.3);
        break;
      }
      case 'boom': { // deep pulse hit used by Betelgeuse
        const g = this.out(dest, 0.4); this.env(g, t, 0.004, 0.75 * vel, 0.9);
        const o = this.osc('sine', 90, t, t + 1, g); o.frequency.exponentialRampToValueAtTime(32, t + 0.8);
        break;
      }
      case 'snare': {
        this.noiseHit(t, 0.22 * vel, 0.16, 'bandpass', 1900, dest, 0.25);
        const g = this.out(dest); this.env(g, t, 0.002, 0.12 * vel, 0.08); this.osc('triangle', 190, t, t + 0.1, g);
        break;
      }
      case 'clap': this.noiseHit(t, 0.2 * vel, 0.12, 'bandpass', 1300, dest, 0.35); break;
      case 'hat': this.noiseHit(t, 0.07 * vel, 0.035, 'highpass', 7500, dest); break;
      case 'shaker': this.noiseHit(t, 0.05 * vel, 0.06, 'highpass', 5200, dest); break;
      default: break;
    }
  },

  noiseHit(t, peak, dur, ftype, freq, dest = this.sfxBus, rev = 0) {
    const c = this.ctx; const s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; f.Q.value = 0.9;
    const g = this.out(dest, rev); this.env(g, t, 0.002, peak, dur);
    s.connect(f); f.connect(g); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    return { s, f, g };
  },

  // ---------- sound effects ----------
  sfx(name, opt = {}) {
    if (!this.ctx || !this.started || !this.soundOn) return;
    const c = this.ctx, t = c.currentTime + 0.005, bus = this.sfxBus;
    const sweep = (type, f0, f1, dur, peak, rev = 0) => {
      const g = this.out(bus, rev); this.env(g, t, 0.006, peak, dur);
      const o = this.osc(type, f0, t, t + dur + 0.05, g); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      return o;
    };
    switch (name) {
      case 'jump': sweep('triangle', 300, 620, 0.14, 0.16); sweep('sine', 600, 1240, 0.1, 0.05); break;
      case 'land': this.noiseHit(t, 0.12 * (opt.v || 1), 0.07, 'lowpass', 500); break;
      case 'step': this.noiseHit(t, 0.025, 0.03, 'lowpass', 900); break;
      case 'coin': {
        const now = c.currentTime; this.coinStreak = (now - this.lastCoin < 0.6) ? Math.min(this.coinStreak + 1, 10) : 0; this.lastCoin = now;
        const base = 84 + [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17][this.coinStreak];
        this.play('bell', base, t, 0.1, 0.8, bus); this.play('bell', base + 7, t + 0.06, 0.1, 0.6, bus);
        break;
      }
      case 'shard': [72, 76, 79, 84, 88, 91, 96].forEach((m, i) => this.play('bell', m, t + i * 0.07, 0.2, 1, bus)); this.noiseHit(t, 0.08, 0.8, 'highpass', 6000, bus, 0.6); break;
      case 'checkpoint': [79, 84, 88].forEach((m, i) => this.play('bell', m, t + i * 0.09, 0.2, 0.9, bus)); break;
      case 'fail': { sweep('triangle', 520, 140, 0.45, 0.2, 0.2); const o = sweep('sine', 380, 90, 0.5, 0.12); o.detune.value = 30; break; }
      case 'respawn': [67, 74, 79].forEach((m, i) => this.play('pluck', m, t + i * 0.05, 0.1, 0.9, bus)); break;
      case 'bounce': { const o = sweep('sine', 180, 720, 0.28, 0.32, 0.15); const l = c.createOscillator(); l.frequency.value = 22; const lg = c.createGain(); lg.gain.value = 60; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + 0.3); break; }
      case 'stomp': sweep('square', 220, 80, 0.12, 0.08); this.noiseHit(t, 0.15, 0.1, 'lowpass', 1200); break;
      case 'flareWarn': { const n = this.noiseHit(t, 0.06 * (opt.v || 1), 0.9, 'lowpass', 200); n.f.frequency.linearRampToValueAtTime(900, t + 0.9); break; }
      case 'flare': { const n = this.noiseHit(t, 0.2 * (opt.v || 1), 0.7, 'bandpass', 500, bus, 0.3); n.f.frequency.exponentialRampToValueAtTime(2400, t + 0.15); break; }
      case 'whoosh': { const n = this.noiseHit(t, 0.12, 0.3, 'bandpass', 600); n.f.frequency.exponentialRampToValueAtTime(3000, t + 0.25); break; }
      case 'reveal': [76, 83, 88, 95].forEach((m, i) => this.play('bell', m, t + i * 0.05, 0.3, 0.6, bus)); this.noiseHit(t, 0.05, 1.0, 'highpass', 4000, bus, 0.8); break;
      case 'meow': this.meow(t, opt.pitch || 1); break;
      case 'purr': { const n = this.noiseHit(t, 0.08, 1.2, 'lowpass', 180); const l = c.createOscillator(); l.frequency.value = 24; const lg = c.createGain(); lg.gain.value = 0.06; l.connect(lg); lg.connect(n.g.gain); l.start(t); l.stop(t + 1.2); break; }
      case 'ding': this.play('bell', opt.m || 88, t, 0.3, 1, bus); break;
      case 'buzz': { const g = this.out(bus); this.env(g, t, 0.01, 0.08, 0.3); this.osc('sawtooth', 110, t, t + 0.32, g); this.osc('sawtooth', 116, t, t + 0.32, g); break; }
      case 'gate': sweep('triangle', 200, 520, 0.5, 0.15, 0.3); this.noiseHit(t, 0.06, 0.5, 'bandpass', 800); break;
      case 'tap': this.play('marimba', 79, t, 0.1, 0.7, bus); break;
      case 'back': this.play('marimba', 72, t, 0.1, 0.6, bus); break;
      case 'learn': [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => this.play('bell', m, t + i * 0.06, 0.3, 0.9, bus)); break;
      case 'win': {
        const seq = [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [79, 0.52], [84, 0.64], [88, 0.8]];
        seq.forEach(([m, d]) => { this.play('lead', m, t + d, d === 0.8 ? 0.6 : 0.11, 1.2, bus); this.play('bell', m + 12, t + d, 0.1, 0.4, bus); });
        [60, 64, 67].forEach(m => this.play('pad', m, t + 0.8, 1.2, 2, bus));
        break;
      }
      case 'pulse': this.play('boom', 36, t, 0.5, 0.6 * (opt.v || 1), bus); break;
      case 'pounce': this.noiseHit(t, 0.1, 0.18, 'bandpass', 1500); this.meow(t + 0.02, 1.4, 0.5); break;
      case 'chime': this.play('bell', opt.m || 84, t, 0.2, 0.8, bus); break;
      default: break;
    }
  },

  // A little synthesized "mew": a saw through two moving formant filters with a pitch arc.
  meow(t, pitch = 1, vol = 1) {
    const c = this.ctx; const dur = 0.42 / Math.sqrt(pitch);
    const o = c.createOscillator(); o.type = 'sawtooth';
    const f0 = 520 * pitch;
    o.frequency.setValueAtTime(f0 * 0.8, t); o.frequency.linearRampToValueAtTime(f0 * 1.25, t + dur * 0.35); o.frequency.exponentialRampToValueAtTime(f0 * 0.7, t + dur);
    const g = this.out(this.sfxBus, 0.2); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22 * vol, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 5; f1.frequency.setValueAtTime(700, t); f1.frequency.linearRampToValueAtTime(1500, t + dur * 0.4); f1.frequency.linearRampToValueAtTime(800, t + dur);
    const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 6; f2.frequency.setValueAtTime(2000, t); f2.frequency.linearRampToValueAtTime(3000, t + dur * 0.4);
    const mix = c.createGain(); mix.gain.value = 1;
    o.connect(f1); o.connect(f2); f1.connect(mix); f2.connect(mix); mix.connect(g);
    o.start(t); o.stop(t + dur + 0.05);
  },

  // ---------- music sequencer ----------
  // at: song position in seconds to start from (used to keep rhythm levels in sync with the game clock)
  playSong(name, at = null) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    if (this.song && this.song.name === name && at == null) return;
    this.stopSong();
    const def = SONGS[name];
    if (!def) return;
    this.song = this.compiled?.[name] || compileSong(name, def);
    this.compiled = this.compiled || {}; this.compiled[name] = this.song;
    const pos = at || 0;
    this.songStart = this.ctx.currentTime + 0.06 - pos;
    this.stepIndex = Math.max(0, Math.ceil(pos / this.song.stepDur - 1e-6));
    this.nextStep = this.songStart + this.stepIndex * this.song.stepDur;
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
  },
  // Shift future notes so the song position matches `pos` seconds (small drift correction).
  syncTo(pos) {
    const t = this.songTime(); if (t == null) return;
    const d = t - pos;
    if (Math.abs(d) > 0.6) { this.playSong(this.song.name, pos); return; }
    if (Math.abs(d) > 0.03) { this.songStart += d; this.nextStep += d; }
  },
  stopSong() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null; this.song = null;
  },
  // Seconds since the current song's first downbeat (audio clock), or null if audio is not running.
  songTime() {
    if (!this.song || !this.running) return null;
    return this.ctx.currentTime - this.songStart;
  },
  schedule() {
    const s = this.song; if (!s || !this.ctx || this.ctx.state !== 'running') return;
    const ahead = this.ctx.currentTime + 0.15;
    while (this.nextStep < ahead) {
      const events = s.steps[this.stepIndex % s.steps.length];
      for (const e of events) this.play(e.inst, e.m, this.nextStep, e.dur, e.vel);
      this.nextStep += s.stepDur; this.stepIndex++;
    }
  },
};

// Turn the compact song description into a flat list of per-16th-step events.
function compileSong(name, def) {
  const stepDur = 60 / def.bpm / 4; // 16th notes
  const bars = def.chords.length;
  const steps = Array.from({ length: bars * 16 }, () => []);
  const add = (step, inst, m, durSteps, vel = 1) => { if (m != null) steps[step % steps.length].push({ inst, m, dur: durSteps * stepDur, vel }); };

  def.chords.forEach((sym, bar) => {
    const ch = chordNotes(sym, def.padOct || 4);
    const b0 = bar * 16;
    if (def.pad !== false) ch.notes.slice(0, 4).forEach(m => add(b0, 'pad', m, 16, def.padVel || 1));
    // bass
    const root = ch.root - 24 + (def.bassShift || 0);
    const bp = def.bass || 'pulse';
    const bassPat = {
      pulse: [[0, 3], [6, 2], [8, 3], [14, 2]],
      drive: [[0, 2], [2, 2], [4, 2], [6, 2], [8, 2], [10, 2], [12, 2], [14, 2]],
      slow: [[0, 7], [8, 7]],
      bounce: [[0, 3], [4, 2], [8, 3], [11, 2], [14, 2]],
    }[bp];
    bassPat.forEach(([s, d], i) => add(b0 + s, 'bass', root + ((bp === 'bounce' && i === 3) || (bp === 'drive' && i % 2) ? 12 : (bp === 'pulse' && i === 1 ? 7 : 0)), d));
    // arpeggio
    if (def.arp) {
      const inst = def.arpInst || 'pluck';
      const tones = ch.notes.map(n => n + 12 * (def.arpOct || 0));
      const order = { up: [0, 1, 2, 3], updown: [0, 1, 2, 1], wide: [0, 2, 1, 3] }[def.arp] || [0, 1, 2, 3];
      const every = def.arpEvery || 2;
      for (let s = 0; s < 16; s += every) {
        const i = order[(s / every) % order.length] % tones.length;
        add(b0 + s, inst, tones[i] + ((s / every) % 8 >= 4 && def.arp === 'wide' ? 12 : 0), every, 0.7);
      }
    }
    // drums
    const dr = def.drums || {};
    for (const [inst, pat] of Object.entries(dr)) {
      const p = pat.replace(/\s/g, '');
      for (let s = 0; s < 16; s++) {
        const ch2 = p[s % p.length];
        if (ch2 === 'x') add(b0 + s, inst, 60, 1, 1);
        else if (ch2 === 'o') add(b0 + s, inst, 60, 1, 0.5);
      }
    }
  });

  // melody / extra voices: tokens are 8th notes, "-" holds, "." rests, "|" ignored
  for (const v of def.voices || []) {
    const toks = v.notes.split(/\s+/).filter(x => x && x !== '|');
    let pos = 0;
    for (let i = 0; i < toks.length; i++) {
      const tk = toks[i];
      if (tk !== '-' && tk !== '.') {
        let len = 1; while (toks[i + len] === '-') len++;
        add(pos * 2 + (v.offset || 0), v.inst, midi(tk) + (v.shift || 0), len * 2 - 0.3, v.vel || 1);
      }
      pos++;
    }
  }
  return { name, steps, stepDur, barDur: stepDur * 16, bpm: def.bpm };
}
