// Batch-1 mechanics: stellar wind (Arcturus), star switches and lifts, light beams + mirrors + Squeeze
// tunnels (Mu Cephei), and the light/shadow swap (VV Cephei A).
import { TILE, ART } from '../core/constants.js';
import { Audio } from '../audio/audio.js';
import { TILE_IDX } from '../art/themes.js';

const inv = 1 / ART;
const overlap = (r, x, y, w, h) => r.x < x + w && r.right > x && r.y < y + h && r.bottom > y;

// ---------------- Stellar wind: gusts that push Landon sideways ----------------
// {t:"wind", x, y, w, h, dir: 1|-1, period, on, warn, offset, push}
export class Wind {
  constructor(scene, o) {
    this.scene = scene; this.o = o;
    this.x = o.x * TILE; this.y = o.y * TILE; this.w = o.w * TILE; this.h = o.h * TILE;
    this.dir = o.dir || 1; this.period = o.period || 4; this.on = o.on ?? 2; this.warn = o.warn ?? 0.9; this.offset = o.offset || 0;
    this.push = (o.push || 220) * (scene.assist ? 0.7 : 1);
    this.always = o.period === 0;
    this.streaks = scene.add.particles(0, 0, 'windstreak', {
      emitting: false, lifespan: 700, speedX: { min: 500 * this.dir, max: 800 * this.dir }, speedY: { min: -10, max: 10 },
      scaleX: { min: 0.4, max: 1.1 }, scaleY: 0.5, alpha: { start: 0.6, end: 0 }, blendMode: 'ADD',
    }).setDepth(55);
    this.state = 'idle'; this.emitT = 0; this.sound = 0;
  }
  phase() {
    if (this.always) return 'on';
    const t = (this.scene.hz + this.offset) % this.period;
    return t < this.warn ? 'warn' : t < this.warn + this.on ? 'on' : 'idle';
  }
  update(dt) {
    const s = this.scene, p = s.player;
    const prev = this.state; this.state = this.phase();
    const near = Math.abs(p.x - (this.x + this.w / 2)) < this.w / 2 + 700;
    if (!near) return;
    this.emitT -= dt;
    const rate = this.state === 'on' ? 0.025 : this.state === 'warn' ? 0.12 : 0;
    if (rate && this.emitT <= 0) {
      this.emitT = rate;
      const sx = this.dir > 0 ? this.x - 40 + Math.random() * this.w * 0.6 : this.x + this.w * 0.4 + Math.random() * this.w * 0.6;
      this.streaks.emitParticleAt(sx, this.y + Math.random() * this.h, 1);
    }
    if (this.state === 'on' && prev !== 'on' && Math.abs(p.x - (this.x + this.w / 2)) < this.w / 2 + 300) Audio.sfx('wind');
    if (this.state === 'on' && !p.dead) {
      const b = p.body.body;
      if (b.right > this.x && b.x < this.x + this.w && b.bottom > this.y && b.y < this.y + this.h) p.windTarget += this.dir * this.push;
    }
  }
}

// ---------------- Star switch: Winnie pounces it to trigger things ----------------
// {t:"lever", x, y, id, opens?: doorId, starts?: moverId, swap?: true, reveal?: true}
export class Lever {
  constructor(scene, o) {
    this.scene = scene; this.o = o; this.id = o.id;
    this.x = o.x * TILE + TILE / 2; this.y = (o.y + 1) * TILE;
    this.spr = scene.add.sprite(this.x, this.y + 2, 'lever', 0).setOrigin(0.5, 1).setScale(inv).setDepth(18);
    this.on = false; this.pounceTarget = true; this.t = Math.random() * 3;
    this.glow = scene.add.image(this.x, this.y - 40, 'softglow').setScale(1.4).setTint(0xffe680).setAlpha(0.5).setDepth(17).setBlendMode(Phaser.BlendModes.ADD);
  }
  get tx() { return this.x; } get ty() { return this.y - 40; }
  get usable() { return !this.on || this.o.toggle; }
  hit() {
    const s = this.scene;
    if (this.on && !this.o.toggle) { Audio.sfx('tap'); return; }
    this.on = this.o.toggle ? !this.on : true;
    this.spr.setFrame(this.on ? 1 : 0);
    Audio.sfx('ding', { m: 86 });
    s.fx.burst(this.x, this.y - 40, 0x7dff9a, 12);
    s.tweens.add({ targets: this.spr, scaleX: inv * 1.25, scaleY: inv * 0.8, duration: 90, yoyo: true });
    if (this.o.opens && s.doors[this.o.opens]) s.time.delayedCall(250, () => s.doors[this.o.opens].unlock());
    if (this.o.starts && s.movers[this.o.starts]) s.movers[this.o.starts].start();
    if (this.o.swap && s.phase) s.phase.toggle();
    s.events.emit('lever', this);
  }
  update(dt) {
    this.t += dt;
    this.glow.setAlpha(this.on && !this.o.toggle ? 0.15 : 0.35 + Math.sin(this.t * 3) * 0.15);
  }
}

// ---------------- Light beams: emitter -> mirrors -> receiver crystal ----------------
// {t:"emitter", x, y, dir:"r|l|u|d"}  {t:"mirror", x, y, o:"/" or "\\", fixed?}  {t:"receiver", x, y, opens}
const DIRS = { r: [1, 0], l: [-1, 0], u: [0, -1], d: [0, 1] };
const REFLECT = {
  '/': { r: 'u', u: 'r', l: 'd', d: 'l' },
  '\\': { r: 'd', d: 'r', l: 'u', u: 'l' },
};

export class Mirror {
  constructor(scene, o) {
    this.scene = scene; this.o = o; this.c = o.x; this.r = o.y; this.kind = o.o === '\\' ? '\\' : '/';
    this.x = o.x * TILE + TILE / 2; this.y = o.y * TILE + TILE / 2;
    this.spr = scene.add.sprite(this.x, this.y, 'mirror', this.kind === '/' ? 0 : 1).setScale(inv).setDepth(26);
    this.zone = scene.add.zone(this.x, this.y, TILE, TILE);
    scene.physics.add.existing(this.zone);
    this.zone.body.setAllowGravity(false); this.zone.body.setImmovable(true);
    scene.platforms.add(this.zone); this.zone.body.setAllowGravity(false); this.zone.body.setImmovable(true);
    this.zone.owner = this; this.pounceTarget = !o.fixed; this.cool = 0;
  }
  get tx() { return this.x; } get ty() { return this.y; }
  get usable() { return !this.o.fixed; }
  // Winnie only goes for mirrors Landon can't bonk himself (more than a jump above his feet)
  canPounce(p) { return p.bottom - this.y > 200; }
  flip() {
    if (this.o.fixed || this.cool > 0) return;
    this.cool = 0.35;
    this.kind = this.kind === '/' ? '\\' : '/';
    this.spr.setFrame(this.kind === '/' ? 0 : 1);
    Audio.sfx('chime', { m: 90 });
    this.scene.tweens.add({ targets: this.spr, angle: { from: -90, to: 0 }, duration: 220, ease: 'Back.easeOut' });
    this.scene.beams && this.scene.beams.dirty();
  }
  hit() { this.flip(); }
  bump() { this.flip(); } // Landon bonks it from below
  update(dt) { if (this.cool > 0) this.cool -= dt; }
}

export class Receiver {
  constructor(scene, o) {
    this.scene = scene; this.o = o; this.c = o.x; this.r = o.y; this.lit = false;
    this.x = o.x * TILE + TILE / 2; this.y = o.y * TILE + TILE / 2;
    this.spr = scene.add.sprite(this.x, this.y, 'receiver', 0).setScale(inv).setDepth(26);
  }
  light() {
    if (this.lit) return; this.lit = true;
    this.spr.setFrame(1); Audio.sfx('learn');
    this.scene.fx.starBurst(this.x, this.y, 20, 0x7dff9a);
    if (this.o.opens && this.scene.doors[this.o.opens]) this.scene.time.delayedCall(300, () => this.scene.doors[this.o.opens].unlock());
    this.scene.puzzleSolved && this.scene.puzzleSolved(this.o.opens);
  }
  update() {}
}

export class Emitter {
  constructor(scene, o) {
    this.scene = scene; this.o = o; this.c = o.x; this.r = o.y; this.dir = o.dir || 'r';
    this.x = o.x * TILE + TILE / 2; this.y = o.y * TILE + TILE / 2;
    const ang = { r: 0, d: 90, l: 180, u: -90 }[this.dir];
    this.spr = scene.add.image(this.x, this.y, 'emitter').setScale(inv).setDepth(26).setAngle(ang);
  }
  update() {}
}

export class BeamSystem {
  constructor(scene) {
    this.scene = scene; this.emitters = []; this.mirrors = []; this.receivers = [];
    this.g = scene.add.graphics().setDepth(25).setBlendMode(Phaser.BlendModes.ADD);
    this.needs = true; this.t = 0; this.paths = [];
  }
  dirty() { this.needs = true; }
  blocked(c, r) {
    const s = this.scene;
    if (s.lv.isSolid(c, r)) return true;
    if (s.phase && s.phase.solidAt(c, r)) return true;
    for (const d of Object.values(s.doors)) {
      if (!d.open && c === Math.floor(d.x / TILE) && r >= Math.floor(d.y / TILE) && r < Math.floor((d.y + d.h) / TILE)) return true;
    }
    return false;
  }
  trace(em) {
    let c = em.c, r = em.r, dir = em.dir;
    const pts = [[em.x, em.y]];
    for (let i = 0; i < 160; i++) {
      c += DIRS[dir][0]; r += DIRS[dir][1];
      if (c < 0 || r < 0 || c >= this.scene.lv.W || r >= this.scene.lv.H) { pts.push([c * TILE + TILE / 2, r * TILE + TILE / 2]); break; }
      const m = this.mirrors.find(q => q.c === c && q.r === r);
      if (m) { pts.push([m.x, m.y]); dir = REFLECT[m.kind][dir]; continue; }
      const rc = this.receivers.find(q => q.c === c && q.r === r);
      if (rc) { pts.push([rc.x, rc.y]); rc.light(); break; }
      if (this.blocked(c, r)) { pts.push([c * TILE + TILE / 2 - DIRS[dir][0] * TILE / 2, r * TILE + TILE / 2 - DIRS[dir][1] * TILE / 2]); break; }
    }
    return pts;
  }
  update(dt) {
    this.t += dt;
    // Redraw only when the beam path changes; the shimmer is just an alpha pulse (cheap on iPad).
    if (this.needs) { this.needs = false; this.paths = this.emitters.map(e => this.trace(e)); this.draw(); }
    this.g.setAlpha(0.85 + Math.sin(this.t * 12) * 0.15);
  }
  draw() {
    const g = this.g; g.clear();
    for (const pts of this.paths) {
      for (const [w, col, a] of [[14, 0xff3a6a, 0.35], [7, 0xffd0dc, 0.8], [3, 0xffffff, 1]]) {
        g.lineStyle(w, col, a); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
        g.strokePath();
      }
      const end = pts[pts.length - 1];
      g.fillStyle(0xffffff, 0.8); g.fillCircle(end[0], end[1], 7);
    }
  }
}

// ---------------- Squeeze tunnel: Winnie slips through and opens a door ----------------
// {t:"squeeze", x, y, x2, y2, opens}
export class Squeeze {
  constructor(scene, o) {
    this.scene = scene; this.o = o; this.done = false;
    this.ax = o.x * TILE + TILE / 2; this.ay = (o.y + 1) * TILE;
    this.bx = o.x2 * TILE + TILE / 2; this.by = (o.y2 + 1) * TILE;
    this.a = scene.add.image(this.ax, this.ay + 1, 'vent').setOrigin(0.5, 1).setScale(inv).setDepth(9);
    this.b = scene.add.image(this.bx, this.by + 1, 'vent').setOrigin(0.5, 1).setScale(inv).setDepth(9);
    this.lever = scene.add.sprite(this.bx + 36, this.by + 2, 'lever', 0).setOrigin(0.5, 1).setScale(inv * 0.8).setDepth(18);
    this.hint = scene.add.image(this.ax, this.ay - 70, 'sign-squeeze').setScale(inv * 0.7).setDepth(30).setAlpha(0);
  }
  near(p) { return !this.done && Math.abs(p.x - this.ax) < 170 && Math.abs(p.bottom - this.ay) < 70; }
  go() {
    if (this.done) return;
    this.done = true;
    this.scene.winnie.squeeze(this.ax, this.ay, this.bx, this.by, () => {
      this.lever.setFrame(1); Audio.sfx('ding', { m: 86 });
      if (this.o.opens && this.scene.doors[this.o.opens]) this.scene.doors[this.o.opens].unlock();
      if (this.o.starts && this.scene.movers[this.o.starts]) this.scene.movers[this.o.starts].start();
    });
  }
  update() { this.hint.setAlpha(this.near(this.scene.player) ? 0.95 : 0); }
}

// ---------------- Light / shadow swap ----------------
// Tiles 'L' are solid on the light side, 'D' on the shadow side. Orbs flip the side when touched;
// {t:"swapclock", x, x2, period} flips it on a timer while Landon is between x and x2.
export class PhaseSystem {
  constructor(scene) {
    this.scene = scene; this.dark = false; this.orbs = []; this.clocks = [];
    this.lightCells = []; this.darkCells = [];
  }
  register(c, r, ch) { (ch === 'L' ? this.lightCells : this.darkCells).push([c, r]); }
  solidAt(c, r) {
    const ch = this.scene.lv.rows[r] && this.scene.lv.rows[r][c];
    return (ch === 'L' && !this.dark) || (ch === 'D' && this.dark);
  }
  apply(instant = false) {
    const layer = this.scene.layer;
    layer.setCollision(TILE_IDX.light, !this.dark, false);
    layer.setCollision(TILE_IDX.dark, this.dark, false);
    layer.calculateFacesWithin(0, 0, this.scene.lv.W, this.scene.lv.H);
    for (const [c, r] of this.lightCells) { const t = layer.getTileAt(c, r); if (t) t.setAlpha(this.dark ? 0.22 : 1); }
    for (const [c, r] of this.darkCells) { const t = layer.getTileAt(c, r); if (t) t.setAlpha(this.dark ? 1 : 0.22); }
    const s = this.scene;
    if (s.bgSky) s.bgSky.setTint(this.dark ? 0x8fa0ff : 0xffffff);
    if (s.bgFar) s.bgFar.setTint(this.dark ? 0xa0b0ff : 0xffffff);
    if (s.bgMid) s.bgMid.setTint(this.dark ? 0x7080d0 : 0xffffff);
    Audio.setMusicTone && Audio.setMusicTone(this.dark);
    for (const o of this.orbs) if (!o.to) o.spr.setFrame(this.dark ? 1 : 0);
    if (!instant) { s.beams && s.beams.dirty(); this.unstick(); }
  }
  set(dark) { if (this.dark !== dark) this.toggle(); }
  toggle() {
    this.dark = !this.dark;
    Audio.sfx('swap');
    this.scene.cameras.main.flash(160, this.dark ? 120 : 255, this.dark ? 140 : 230, this.dark ? 255 : 160);
    this.apply();
  }
  // If a block appears inside Landon, lift him to the nearest free spot above (never trap him).
  unstick() {
    const p = this.scene.player, b = p.body.body;
    const inside = () => {
      const c0 = Math.floor((b.x + 2) / TILE), c1 = Math.floor((b.right - 2) / TILE), r0 = Math.floor((b.y + 2) / TILE), r1 = Math.floor((b.bottom - 2) / TILE);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (this.scene.lv.isSolid(c, r) || this.solidAt(c, r)) return true;
      return false;
    };
    if (!inside()) return;
    for (let k = 1; k <= 5; k++) {
      b.y -= TILE; if (!inside()) { b.velocity.y = 0; return; }
    }
    b.y += TILE * 5;
  }
  update() {
    const p = this.scene.player;
    for (const c of this.clocks) {
      if (p.x < c.x0 || p.x > c.x1 || p.dead) { c.t = 0; continue; }
      const before = c.t; c.t += this.scene.game.loop.delta / 1000 * this.scene.hzRate;
      const warnAt = c.period - 0.8;
      if (before < warnAt && c.t >= warnAt) Audio.sfx('flareWarn', { v: 0.6 });
      if (c.t >= c.period) { c.t = 0; this.toggle(); }
      c.warn = c.t >= warnAt;
    }
    // blink the soon-to-change blocks during a clock warning
    const warn = this.clocks.some(c => c.warn);
    if (warn !== this.wasWarn) { this.wasWarn = warn; if (!warn) this.apply(true); }
    if (warn) {
      const a = Math.floor(this.scene.time.now / 120) % 2 ? 0.55 : 1;
      const layer = this.scene.layer;
      for (const [c, r] of this.dark ? this.darkCells : this.lightCells) { const t = layer.getTileAt(c, r); if (t) t.setAlpha(a); }
    }
  }
}

export class SwapOrb {
  constructor(scene, o) {
    // "to": "light" | "dark" makes a sun orb / moon orb that always picks that side; without it the orb flips sides.
    this.scene = scene; this.x = o.x * TILE + TILE / 2; this.y = o.y * TILE + TILE / 2; this.inside = false; this.t = Math.random() * 5;
    this.to = o.to || null;
    this.spr = scene.add.sprite(this.x, this.y, 'swaporb', this.to === 'dark' ? 1 : 0).setScale(inv).setDepth(36);
  }
  update(dt) {
    this.t += dt; this.spr.y = this.y + Math.sin(this.t * 2.5) * 4; this.spr.rotation += dt * 0.6;
    const p = this.scene.player; if (p.dead) { this.inside = false; return; }
    const hit = Math.abs(p.x - this.x) < 40 && Math.abs(p.body.y - this.spr.y) < 64; // generous: orbs should be easy to touch
    if (hit && !this.inside) { if (this.to) this.scene.phase.set(this.to === 'dark'); else this.scene.phase.toggle(); this.scene.fx.burst(this.x, this.y, 0xffffff, 14); this.scene.tweens.add({ targets: this.spr, scale: inv * 1.4, duration: 100, yoyo: true }); }
    this.inside = hit;
  }
}
