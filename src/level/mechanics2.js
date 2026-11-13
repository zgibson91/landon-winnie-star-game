// Batch-2 mechanics: dust storms (VY Canis Majoris), song stones + memory pads woken by Winnie's Meow,
// and gravity orbs that flip Landon onto the ceiling (UY Scuti).
import { TILE, ART } from '../core/constants.js';
import { Audio } from '../audio/audio.js';

const inv = 1 / ART;
const PAD_COLORS = [0xff5a4e, 0x6f9fd6, 0x5ec26a, 0xffd75e, 0xb58aff];
const PAD_NOTES = [72, 76, 79, 84, 88];

// ---------------- Dust storm: a thick cloud rolls over and hides the level for a moment ----------------
// {t:"storm", x, x2, period, on, warn, offset}
export class DustStorm {
  constructor(scene, o) {
    this.scene = scene; this.o = o;
    this.x0 = o.x * TILE; this.x1 = o.x2 * TILE;
    this.period = o.period || 7; this.on = o.on ?? 2.4; this.warn = o.warn ?? 1.4; this.offset = o.offset || 0;
    this.cloud = scene.add.rectangle(0, 0, 10, 10, 0xc89060, 0).setScrollFactor(0).setDepth(70).setOrigin(0.5);
    this.grit = scene.add.particles(0, 0, 'dust', {
      emitting: false, lifespan: 900, speedX: { min: -700, max: -420 }, speedY: { min: -40, max: 40 },
      scale: { min: 0.6, max: 1.6 }, alpha: { start: 0.8, end: 0 }, tint: 0xe8c090,
    }).setDepth(71);
    this.state = 'idle'; this.level = 0; this.emitT = 0;
  }
  phase() {
    const t = (this.scene.hz + this.offset) % this.period;
    return t < this.warn ? 'warn' : t < this.warn + this.on ? 'on' : 'idle';
  }
  update(dt) {
    const s = this.scene, p = s.player, cam = s.cameras.main;
    const inside = p.x > this.x0 - 300 && p.x < this.x1 + 300;
    const prev = this.state; this.state = inside ? this.phase() : 'idle';
    const want = this.state === 'on' ? 0.86 : this.state === 'warn' ? 0.25 : 0;
    this.level += (want - this.level) * Math.min(1, dt * (want > this.level ? 2.2 : 3));
    this.cloud.setPosition(cam.width / 2, cam.height / 2).setSize(s.vw + 20, s.vh + 20).setFillStyle(0xc89060, this.level);
    if (this.state === 'warn' && prev !== 'warn') Audio.sfx('storm');
    this.emitT -= dt;
    if (this.state !== 'idle' && this.emitT <= 0) {
      this.emitT = this.state === 'on' ? 0.015 : 0.06;
      this.grit.emitParticleAt(cam.worldView.right + 40, cam.worldView.top + Math.random() * cam.worldView.height, 1);
    }
  }
}

// ---------------- Memory pads + song stone ----------------
// {t:"pad", x, y, id, color}  - a flat colored button on the floor that Landon steps on
export class Pad {
  constructor(scene, o) {
    this.scene = scene; this.o = o; this.id = o.id; this.color = o.color;
    this.x = o.x * TILE + TILE / 2; this.y = (o.y + 1) * TILE;
    const c = PAD_COLORS[o.color];
    this.halo = scene.add.image(this.x, this.y - 8, 'softglow').setScale(1.3, 0.5).setTint(c).setAlpha(0.35).setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
    this.base = scene.add.rectangle(this.x, this.y - 5, 48, 12, 0x2a1f3d).setDepth(19);
    this.top = scene.add.rectangle(this.x, this.y - 12, 42, 14, c).setDepth(20).setStrokeStyle(3, 0x2a1f3d);
    this.shine = scene.add.rectangle(this.x - 8, this.y - 15, 16, 3, 0xffffff, 0.6).setDepth(21);
    // a column of light shoots up when the pad sings or is stepped on
    this.glow = scene.add.image(this.x, this.y - 70, 'softglow').setScale(1.1, 2.6).setTint(c).setAlpha(0).setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
    this.on = false;
  }
  flash(ms = 450) {
    this.glow.setAlpha(1);
    this.scene.tweens.add({ targets: this.glow, alpha: 0, duration: ms, ease: 'Quad.easeIn' });
    this.scene.tweens.add({ targets: [this.top, this.shine], scaleY: 0.5, duration: 90, yoyo: true });
  }
  update() {
    const p = this.scene.player;
    // counts when Landon STOPS on the pad (running across a pad on the way to another one doesn't)
    const standing = !p.dead && p.g > 0 && p.grounded && Math.abs(p.x - this.x) < 26 && Math.abs(p.bottom - this.y) < 6;
    if (standing && Math.abs(p.vx) < 60) this.still = (this.still || 0) + this.scene.game.loop.delta / 1000; else this.still = 0;
    if (standing && !this.on && this.still >= 0.12) { this.on = true; this.flash(); Audio.sfx('ding', { m: PAD_NOTES[this.color] }); this.scene.events.emit('pad', this); }
    if (!standing) this.on = false;
  }
}

// {t:"songstone", x, y, id, seq:[colors], pads:[ids], door}  - Meow at it and it sings the order to step on the pads
export class SongStone {
  constructor(scene, o) {
    this.scene = scene; this.o = o; this.seq = o.seq; this.progress = 0; this.solved = false; this.singing = false;
    this.x = o.x * TILE + TILE / 2; this.y = (o.y + 1) * TILE;
    this.spr = scene.add.image(this.x, this.y + 2, 'songstone', 0).setOrigin(0.5, 1).setScale(inv).setDepth(18);
    this.zzz = scene.makeText(this.x + 30, this.y - 120, 'z z z', 20, { color: '#c9bfff' }).setDepth(19);
    this.badges = [];
    this.lamps = this.seq.map((_, i) => scene.add.image(this.x + (i - (this.seq.length - 1) / 2) * 30, this.y - 142, 'lamp', 0).setScale(inv * 1.3).setDepth(20));
    scene.events.on('pad', this.onPad, this);
    scene.events.on('meow', this.onMeow, this);
    scene.events.once('shutdown', () => { scene.events.off('pad', this.onPad, this); scene.events.off('meow', this.onMeow, this); });
    this.t = 0;
  }
  get pads() { return this.o.pads.map(id => this.scene.pads[id]).filter(Boolean); }
  near(p) { return !this.solved && Math.abs(p.x - this.x) < 380 && Math.abs(p.bottom - this.y) < 200; }
  onMeow(x, y) {
    if (this.solved || this.singing || Math.hypot(x - this.x, y - (this.y - 60)) > 420) return;
    this.sing();
  }
  sing() {
    const s = this.scene;
    this.singing = true; this.progress = 0; this.clearBadges(); this.lamps.forEach(l => l.setFrame(0));
    this.zzz.setVisible(false); this.spr.setFrame(1);
    s.tweens.add({ targets: this.spr, scaleY: inv * 1.1, duration: 160, yoyo: true });
    const step = s.assist ? 900 : 700;
    this.seq.forEach((col, i) => {
      s.time.delayedCall(500 + i * step, () => {
        Audio.sfx('ding', { m: PAD_NOTES[col] });
        const pad = this.pads.find(p => p.color === col);
        if (pad) { pad.flash(step - 100); s.fx.burst(pad.x, pad.y - 20, PAD_COLORS[col], 10); }
        this.spr.setTint(PAD_COLORS[col]);
      });
    });
    s.time.delayedCall(500 + this.seq.length * step, () => { this.singing = false; this.spr.clearTint(); });
  }
  badge(pad, ok, label) {
    const s = this.scene;
    const c = s.add.container(pad.x, pad.y - 70).setDepth(45);
    const g = s.add.graphics();
    g.fillStyle(0x2a1f3d, 1).fillCircle(0, 3, 22); g.fillStyle(ok ? 0x3fbf5f : 0xe0404a, 1).fillCircle(0, 0, 22);
    g.lineStyle(4, 0xffffff, 1).strokeCircle(0, 0, 22);
    c.add([g, s.makeText(0, 1, label, 26, { strokeW: 5 })]);
    c.setScale(0); s.tweens.add({ targets: c, scale: 1, duration: 240, ease: 'Back.easeOut' });
    return c;
  }
  clearBadges() {
    for (const b of this.badges) this.scene.tweens.add({ targets: b, scale: 0, alpha: 0, duration: 220, onComplete: () => b.destroy() });
    this.badges = [];
  }
  onPad(pad) {
    if (this.solved || this.singing || !this.o.pads.includes(pad.id)) return;
    if (this.spr.frame.name === 0) return; // still asleep: Meow first
    if (pad.color === this.seq[this.progress]) {
      this.lamps[this.progress].setFrame(1);
      this.progress++;
      this.badges.push(this.badge(pad, true, String(this.progress)));
      if (this.progress >= this.seq.length) {
        this.solved = true; Audio.sfx('learn'); this.scene.fx.starBurst(this.x, this.y - 80, 24, 0xc9bfff);
        this.scene.time.delayedCall(400, () => this.scene.doors[this.o.door] && this.scene.doors[this.o.door].unlock());
        this.scene.puzzleSolved(this.o.id);
      }
    } else {
      Audio.sfx('buzz'); this.scene.shake(0.004, 150);
      const w = this.badge(pad, false, '✗');
      this.scene.time.delayedCall(1000, () => this.scene.tweens.add({ targets: w, scale: 0, duration: 200, onComplete: () => w.destroy() }));
      this.clearBadges(); this.progress = 0;
      this.lamps.forEach(l => l.setFrame(2));
      this.scene.time.delayedCall(800, () => { if (!this.solved) this.lamps.forEach(l => l.setFrame(0)); });
      this.scene.puzzleMistake(this.o.id);
    }
  }
  update(dt) {
    this.t += dt;
    if (this.zzz.visible) this.zzz.y = this.y - 120 + Math.sin(this.t * 2) * 6;
  }
}

// ---------------- Gravity orb: touch it to fall up (or back down) ----------------
// {t:"gravity", x, y, to:"up"|"down"}
export class GravityOrb {
  constructor(scene, o) {
    this.scene = scene; this.to = o.to === 'down' ? 1 : -1;
    this.x = o.x * TILE + TILE / 2; this.y = o.y * TILE + TILE / 2; this.inside = false; this.t = Math.random() * 5;
    this.spr = scene.add.sprite(this.x, this.y, 'gravorb', this.to < 0 ? 0 : 1).setScale(inv).setDepth(36);
  }
  update(dt) {
    this.t += dt; this.spr.y = this.y + Math.sin(this.t * 3) * 4 * this.to;
    const p = this.scene.player; if (p.dead) { this.inside = false; return; }
    const hit = Math.abs(p.x - this.x) < 34 && Math.abs(p.body.y - this.y) < 48;
    if (hit && !this.inside && p.g !== this.to) {
      p.setGravity(this.to);
      this.scene.fx.burst(this.x, this.y, 0xffb0d0, 14);
      this.scene.tweens.add({ targets: this.spr, scale: inv * 1.4, duration: 100, yoyo: true });
    }
    this.inside = hit;
  }
}
