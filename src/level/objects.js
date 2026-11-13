// Level objects. Each has update(dt) and reads shared state from the scene
// (scene.player, scene.hz = hazard clock seconds, scene.pulse = 0..1 star size, scene.assist).
import { TILE, ART } from '../core/constants.js';
import { Audio } from '../audio/audio.js';

const inv = 1 / ART;
const overlap = (r, x, y, w, h) => r.x < x + w && r.right > x && r.y < y + h && r.bottom > y;

// Rounded platform drawn from a 3-frame sheet (left cap, middle, right cap), any width.
export class Capsule {
  constructor(scene, key, x, y, w, depth = 20) {
    this.scene = scene; this.key = key;
    const h = scene.textures.get(key).getSourceImage().height * inv;
    this.h = h;
    this.l = scene.add.image(0, 0, key, 0).setOrigin(0, 0).setScale(inv).setDepth(depth);
    this.m = scene.add.image(0, 0, key, 1).setOrigin(0, 0).setScale(inv).setDepth(depth);
    this.r = scene.add.image(0, 0, key, 2).setOrigin(0, 0).setScale(inv).setDepth(depth);
    this.set(x, y, w);
  }
  set(x, y, w) {
    w = Math.max(48, w);
    this.l.setPosition(x, y);
    this.m.setPosition(x + 23.5, y).setScale((w - 47) / 24 * inv, inv);
    this.r.setPosition(x + w - 24, y);
  }
  setAlpha(a) { [this.l, this.m, this.r].forEach(i => i.setAlpha(a)); return this; }
  setVisible(v) { [this.l, this.m, this.r].forEach(i => i.setVisible(v)); return this; }
  setTint(c) { [this.l, this.m, this.r].forEach(i => i.setTint(c)); return this; }
  clearTint() { [this.l, this.m, this.r].forEach(i => i.clearTint()); return this; }
  destroy() { [this.l, this.m, this.r].forEach(i => i.destroy()); }
}

function solidBody(scene, x, y, w, h, oneWay = true) {
  const z = scene.add.zone(x + w / 2, y + h / 2, w, h);
  scene.physics.add.existing(z);
  const b = z.body;
  b.setAllowGravity(false); b.setImmovable(true);
  if (oneWay) { b.checkCollision.down = false; b.checkCollision.left = false; b.checkCollision.right = false; }
  scene.platforms.add(z);
  b.setAllowGravity(false); b.setImmovable(true); // group.add can reset defaults
  return z;
}

// ---------------- Solar flare: erupts from plasma on a timer ----------------
export class Flare {
  constructor(scene, o) {
    this.scene = scene; this.o = o;
    this.x = o.x * TILE + TILE / 2; this.base = o.y * TILE + 14;
    this.h = (o.h || 6) * TILE;
    this.period = o.period || 3.2; this.on = o.on || 1.1; this.warn = o.warn || 1.0; this.offset = o.offset || 0;
    this.col = scene.add.sprite(this.x, this.base, 'flare', 0).setOrigin(0.5, 1).setDepth(30).setVisible(false);
    this.ghost = scene.add.rectangle(this.x, this.base, 52, this.h, 0xfff3a0, 0.0).setOrigin(0.5, 1).setDepth(29);
    this.ghost.setStrokeStyle(3, 0xfff3a0, 0.0);
    this.glow = scene.add.image(this.x, this.base - 6, 'softglow').setScale(1.6, 0.6).setTint(0xffe36b).setDepth(31).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    this.state = 'idle'; this.frameT = 0; this.active = false;
  }
  update(dt) {
    const s = this.scene;
    const t = (s.hz + this.offset) % this.period;
    const prev = this.state;
    this.state = t < this.warn ? 'warn' : t < this.warn + this.on ? 'on' : 'idle';
    const onScreen = Math.abs(this.x - s.player.x) < 900;
    if (this.state === 'warn') {
      const k = t / this.warn;
      this.glow.setAlpha(0.3 + 0.6 * k).setScale(1.2 + k * 0.8 + Math.sin(t * 40) * 0.06, 0.5 + k * 0.4);
      this.ghost.setFillStyle(0xfff3a0, 0.08 + 0.1 * k).setStrokeStyle(3, 0xffffff, 0.25 + 0.4 * k);
      this.ghost.height = this.h; this.ghost.displayHeight = this.h;
      if (prev !== 'warn' && onScreen) Audio.sfx('flareWarn', { v: 1 - Math.abs(this.x - s.player.x) / 1200 });
      if (Math.random() < dt * 20) s.fx.emberAt(this.x + (Math.random() - 0.5) * 40, this.base - 4);
    } else { this.glow.setAlpha(Math.max(0, this.glow.alpha - dt * 3)); this.ghost.setFillStyle(0xfff3a0, 0).setStrokeStyle(3, 0xffffff, 0); }
    if (this.state === 'on') {
      const k = t - this.warn;
      const grow = Math.min(1, k / 0.12), shrink = Math.min(1, (this.on - k) / 0.15);
      const sc = Math.max(0.05, Math.min(grow, shrink));
      this.col.setVisible(true).setScale(inv * (0.95 + Math.sin(k * 30) * 0.05), inv * (this.h / 360) * sc);
      this.frameT += dt; if (this.frameT > 0.07) { this.frameT = 0; this.col.setFrame((this.col.frame.name + 1) % 4); }
      if (prev !== 'on' && onScreen) { Audio.sfx('flare', { v: 1 - Math.abs(this.x - s.player.x) / 1200 }); if (Math.abs(this.x - s.player.x) < 500) s.shake(0.004, 150); }
      this.active = sc > 0.35;
      const top = this.base - this.h * sc;
      if (this.active && !s.player.dead && overlap(s.player.getHitbox(), this.x - 22, top, 44, this.base - top)) s.fail('flare');
    } else { this.col.setVisible(false); this.active = false; }
  }
}

// ---------------- Magnetic loop: bounce arc ----------------
export class Loop {
  constructor(scene, o) {
    this.scene = scene;
    this.x = o.x * TILE + TILE * 1.5; this.bottom = o.y * TILE;
    this.power = o.power || 1150;
    this.spr = scene.add.sprite(this.x, this.bottom, 'loop', 0).setOrigin(0.5, 1).setScale(inv).setDepth(25);
    this.cool = 0;
  }
  update(dt) {
    const p = this.scene.player; if (this.cool > 0) this.cool -= dt;
    const b = p.body.body;
    if (p.dead || this.cool > 0 || b.velocity.y < 0) return;
    const top = this.bottom - 90;
    if (Math.abs(p.x - this.x) < 46 && b.bottom > top - 4 && b.bottom < top + 26) {
      p.bounce(this.power);
      this.cool = 0.25;
      Audio.sfx('bounce');
      this.spr.setFrame(1);
      this.scene.tweens.add({ targets: this.spr, scaleY: inv * 0.82, duration: 70, yoyo: true, onComplete: () => this.spr.setFrame(0) });
      this.scene.fx.burst(this.x, top + 8, 0xffe36b, 10);
      this.scene.events.emit('bounce');
    }
  }
}

// ---------------- Moving platform ----------------
export class Mover {
  constructor(scene, o) {
    this.scene = scene; this.o = o;
    this.w = (o.w || 3) * TILE;
    this.x0 = o.x * TILE; this.y0 = o.y * TILE;
    this.dx = (o.dx || 0) * TILE; this.dy = (o.dy || 0) * TILE;
    this.period = o.period || 4; this.offset = o.offset || 0;
    this.vis = new Capsule(scene, `cap-${o.style || 'sunspot'}`, this.x0, this.y0, this.w);
    this.zone = solidBody(scene, this.x0, this.y0, this.w, 20, o.oneWay !== false);
    this.zone.owner = this;
    this.bob = o.bob || 0;
  }
  pos(t) {
    const k = 0.5 - 0.5 * Math.cos((t + this.offset) / this.period * Math.PI * 2);
    return { x: this.x0 + this.dx * k, y: this.y0 + this.dy * k + Math.sin((t + this.offset) * 2) * this.bob };
  }
  update(dt) {
    const s = this.scene;
    const now = this.pos(s.hz), next = this.pos(s.hz + dt * s.hzRate);
    const b = this.zone.body;
    b.velocity.x = (next.x - now.x) / dt; b.velocity.y = (next.y - now.y) / dt;
    if (Math.abs(b.x - now.x) > 2 || Math.abs(b.y - now.y) > 2) { b.x = now.x; b.y = now.y; }
    this.vis.set(b.x, b.y - 4, this.w);
  }
}

// ---------------- Betelgeuse pulse platform: width follows the star's breathing ----------------
export class PulsePlat {
  constructor(scene, o) {
    this.scene = scene; this.o = o;
    this.cx = o.x * TILE + TILE / 2; this.y = o.y * TILE;
    const widen = scene.assist ? 1 : 0;
    this.min = ((o.min ?? 1) + widen) * TILE; this.max = ((o.max ?? 4) + widen * 0.5) * TILE; this.phase = o.phase || 0;
    this.invert = !!o.invert;
    this.vis = new Capsule(scene, 'cap-pulse', this.cx - this.min / 2, this.y, this.min);
    this.zone = solidBody(scene, this.cx - this.min / 2, this.y, this.min, 20, true);
  }
  update() {
    let s = this.scene.pulseAt(this.phase);
    if (this.invert) s = 1 - s;
    const w = this.min + (this.max - this.min) * s;
    const b = this.zone.body;
    b.setSize(w, 20); b.x = this.cx - w / 2; b.y = this.y; this.zone.x = this.cx; this.zone.width = w;
    this.vis.set(this.cx - w / 2, this.y - 4, w);
  }
}

// ---------------- Pulse spikes: rise when the star swells ----------------
export class PulseSpikes {
  constructor(scene, o) {
    this.scene = scene; this.o = o;
    this.x = o.x * TILE; this.y = (o.y + 1) * TILE; this.w = (o.w || 1) * TILE; this.phase = o.phase || 0; this.invert = !!o.invert;
    this.spr = [];
    for (let i = 0; i < (o.w || 1); i++) this.spr.push(scene.add.image(this.x + i * TILE, this.y, 'pulsespike').setOrigin(0, 1).setScale(inv).setDepth(18));
  }
  update() {
    let s = this.scene.pulseAt(this.phase); if (this.invert) s = 1 - s;
    const up = Math.max(0, Math.min(1, (s - 0.35) / 0.4)); // 0..1 extension
    const off = (1 - up) * 44;
    for (const sp of this.spr) sp.y = this.y + off;
    const p = this.scene.player;
    if (up > 0.5 && !p.dead && overlap(p.getHitbox(), this.x + 4, this.y - 44 * up + 8, this.w - 8, 44 * up)) this.scene.fail('spikes');
  }
}

// ---------------- Hidden platform (revealed by Night Eyes) ----------------
export class HiddenPlat {
  constructor(scene, run) {
    this.scene = scene;
    this.x = run.c * TILE; this.y = run.r * TILE; this.w = run.w * TILE;
    this.vis = new Capsule(scene, 'cap-hidden', this.x, this.y, this.w, 21).setAlpha(0.12);
    this.zone = solidBody(scene, this.x, this.y, this.w, 20, true);
    this.zone.body.enable = false;
    this.timer = 0; this.twinkle = Math.random() * 2;
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y; }
  reveal() {
    const dur = this.scene.assist ? 16 : 10;
    if (this.timer <= 0) this.scene.fx.burst(this.cx, this.y + 10, 0xd6ccff, 14);
    this.timer = dur; this.zone.body.enable = true;
  }
  update(dt) {
    if (this.timer > 0) {
      this.timer -= dt;
      const blink = this.timer < 2.2 ? (Math.floor(this.timer * 8) % 2 ? 0.35 : 1) : 1;
      this.vis.setAlpha(blink);
      if (this.timer <= 0) { this.zone.body.enable = false; this.vis.setAlpha(0.12); }
    } else {
      // faint twinkle so it's never a blind leap
      this.twinkle -= dt;
      if (this.twinkle <= 0) { this.twinkle = 1.2 + Math.random(); this.scene.fx.twinkle(this.x + Math.random() * this.w, this.y + 8); }
      this.vis.setAlpha(0.1 + 0.06 * Math.sin(this.scene.time.now / 300));
    }
  }
}

// ---------------- Glimmer coin ----------------
export class Glimmer {
  constructor(scene, c, r, hidden = false) {
    this.scene = scene; this.x = c * TILE + TILE / 2; this.y = r * TILE + TILE / 2; this.hidden = hidden; this.taken = false;
    this.spr = scene.add.sprite(this.x, this.y, 'glimmer', 0).setScale(inv * 0.95).setDepth(35);
    this.spr.play('glimmer-spin'); this.spr.anims.setProgress(((c * 7 + r * 3) % 6) / 6);
    if (hidden) this.spr.setAlpha(0.12).setTint(0xb5a6ff);
    this.revealed = !hidden;
  }
  reveal() { if (this.hidden && !this.revealed) { this.revealed = true; this.spr.clearTint(); this.scene.tweens.add({ targets: this.spr, alpha: 1, duration: 300 }); } }
  update() {
    if (this.taken || !this.revealed) return;
    const p = this.scene.player;
    if (!p.dead && Math.abs(p.x - this.x) < 36 && Math.abs(p.body.y - this.y) < 50) this.collect();
  }
  collect() {
    this.taken = true; Audio.sfx('coin');
    this.scene.onGlimmer(this);
    this.scene.fx.burst(this.x, this.y, 0xffe27a, 6);
    this.scene.tweens.add({ targets: this.spr, y: this.y - 40, alpha: 0, scale: inv * 1.4, duration: 260, ease: 'Quad.easeOut', onComplete: () => this.spr.setVisible(false) });
  }
}

// ---------------- Star Shard pickup (in-level) ----------------
export class ShardPickup {
  constructor(scene, x, y, index, hidden = false) {
    this.scene = scene; this.x = x; this.y = y; this.index = index; this.hidden = hidden; this.taken = false;
    const have = scene.hasShard(index);
    this.glow = scene.add.image(x, y, 'softglow').setScale(2.2).setTint(0xfff1a8).setAlpha(0.5).setDepth(34).setBlendMode(Phaser.BlendModes.ADD);
    this.spr = scene.add.image(x, y, have ? 'shard-blue' : 'shard').setScale(inv).setDepth(36);
    if (hidden) { this.spr.setTexture('shard-ghost').setAlpha(0.35); this.glow.setAlpha(0.1); }
    this.revealed = !hidden; this.t = Math.random() * 6;
  }
  reveal() {
    if (this.hidden && !this.revealed) {
      this.revealed = true; this.spr.setTexture(this.scene.hasShard(this.index) ? 'shard-blue' : 'shard').setAlpha(1);
      this.glow.setAlpha(0.5); this.scene.fx.burst(this.x, this.y, 0xfff1a8, 16); Audio.sfx('reveal');
    }
  }
  update(dt) {
    if (this.taken) return;
    this.t += dt;
    this.spr.y = this.y + Math.sin(this.t * 2.4) * 6; this.spr.rotation = Math.sin(this.t * 1.7) * 0.12;
    this.glow.y = this.spr.y; this.glow.setScale(2.1 + Math.sin(this.t * 3) * 0.2);
    if (!this.revealed) return;
    const p = this.scene.player;
    if (!p.dead && Math.abs(p.x - this.x) < 38 && Math.abs(p.body.y - this.spr.y) < 54) {
      this.taken = true;
      this.scene.onShard(this);
      this.scene.tweens.add({ targets: [this.spr, this.glow], y: this.y - 90, alpha: 0, duration: 700, ease: 'Back.easeIn' });
    }
  }
}

// ---------------- Checkpoint lantern ----------------
export class Lantern {
  constructor(scene, c, r, idx, assistOnly) {
    this.scene = scene; this.idx = idx; this.assistOnly = assistOnly;
    this.x = c * TILE + TILE / 2; this.y = (r + 1) * TILE;
    this.spr = scene.add.sprite(this.x, this.y + 2, 'lantern', 0).setOrigin(0.5, 1).setScale(inv).setDepth(22);
    this.lit = false;
    if (assistOnly && !scene.assist) this.spr.setVisible(false);
  }
  light(silent = false) {
    if (this.lit) return; this.lit = true; this.spr.setFrame(1);
    if (!silent) {
      Audio.sfx('checkpoint');
      this.scene.fx.burst(this.x, this.y - 64, 0xffe680, 14);
      this.scene.tweens.add({ targets: this.spr, scaleX: inv * 1.2, scaleY: inv * 0.85, duration: 90, yoyo: true });
    }
  }
  update() {
    if (this.lit || (this.assistOnly && !this.scene.assist)) return;
    const p = this.scene.player;
    if (!p.dead && Math.abs(p.x - this.x) < 34 && Math.abs(p.bottom - this.y) < 80) { this.light(); this.scene.setCheckpoint(this); }
  }
}

// ---------------- Goal gate ----------------
export class Gate {
  constructor(scene, c, r) {
    this.scene = scene; this.x = c * TILE + TILE / 2; this.y = (r + 1) * TILE;
    this.swirl = scene.add.image(this.x, this.y - 78, 'gate-swirl').setScale(inv * 1.05).setDepth(19).setAlpha(0.95);
    this.frame = scene.add.image(this.x, this.y + 4, 'gate', 0).setOrigin(0.5, 1).setScale(inv).setDepth(20);
    this.done = false;
  }
  update(dt) {
    this.swirl.rotation += dt * 1.6;
    if (this.done) return;
    const p = this.scene.player;
    if (!p.dead && Math.abs(p.x - this.x) < 40 && p.bottom > this.y - 200 && p.bottom < this.y + 12) { this.done = true; this.scene.finishLevel(this); }
  }
}

// ---------------- Picture sign ----------------
export class Sign {
  constructor(scene, o) {
    this.scene = scene;
    const x = o.x * TILE + TILE / 2, y = (o.y + 1) * TILE;
    this.post = scene.add.rectangle(x, y, 8, 40, 0x6d5aa8).setOrigin(0.5, 1).setDepth(15).setStrokeStyle(2, 0x2a1f3d);
    this.img = scene.add.image(x, y - 36, `sign-${o.icon}`).setOrigin(0.5, 1).setScale(inv * 0.95).setDepth(16);
    this.text = null;
    if (o.text) this.text = scene.makeText(x, y - 128, o.text, 20, { wrap: 260, bubble: true }).setDepth(16);
    this.t = Math.random() * 5;
  }
  update(dt) { this.t += dt; this.img.y += Math.sin(this.t * 2) * 0.05; }
}

// ---------------- Ability shrine ----------------
export class Shrine {
  constructor(scene, o) {
    this.scene = scene; this.ability = o.ability; this.x = o.x * TILE + TILE / 2; this.y = (o.y + 1) * TILE;
    this.spr = scene.add.image(this.x, this.y + 2, 'shrine').setOrigin(0.5, 1).setScale(inv).setDepth(18);
    this.glow = scene.add.image(this.x, this.y - 78, 'softglow').setScale(2.4).setTint(0xbff0ff).setDepth(17).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6);
    this.used = false; this.t = 0;
  }
  update(dt) {
    this.t += dt; this.glow.setScale(2.2 + Math.sin(this.t * 3) * 0.25);
    if (this.used) return;
    const p = this.scene.player;
    if (!p.dead && Math.abs(p.x - this.x) < 50 && Math.abs(p.bottom - this.y) < 80) { this.used = true; this.glow.setTint(0xffe680); this.scene.learnAbility(this.ability, this); }
  }
}

// ---------------- Bell (Pounce target) ----------------
export class Bell {
  constructor(scene, o) {
    this.scene = scene; this.o = o; this.id = o.id; this.color = o.color;
    this.x = o.x * TILE + TILE / 2; this.y = o.y * TILE + TILE / 2;
    this.chain = scene.add.rectangle(this.x, this.y - 20, 4, (o.chain || 1.5) * TILE, 0xc9a24a).setOrigin(0.5, 1).setDepth(17);
    this.spr = scene.add.image(this.x, this.y + 6, 'bells', o.color).setOrigin(0.5, 0.5).setScale(inv).setDepth(18);
    this.pounceTarget = true; this.t = 0;
  }
  get tx() { return this.x; } get ty() { return this.y + 10; }
  hit() {
    Audio.sfx('ding', { m: [79, 84, 91][this.color] });
    this.scene.tweens.add({ targets: this.spr, angle: { from: -25, to: 0 }, duration: 600, ease: 'Elastic.easeOut' });
    this.scene.fx.burst(this.x, this.y + 10, [0xff5a4e, 0xffd75e, 0x8fc8ff][this.color], 10);
    this.scene.events.emit('bell', this);
  }
  update(dt) { this.t += dt; this.spr.angle += (Math.sin(this.t * 1.4) * 3 - this.spr.angle) * Math.min(1, dt * 2); }
}

// ---------------- Barrier door (opened by a puzzle) ----------------
export class Door {
  constructor(scene, o) {
    this.scene = scene; this.id = o.id;
    this.x = o.x * TILE; this.y = o.y * TILE; this.h = (o.h || 3) * TILE;
    this.spr = scene.add.sprite(this.x + TILE / 2, this.y, 'barrier', 0).setOrigin(0.5, 0).setScale(inv, inv * this.h / 144).setDepth(24);
    this.zone = solidBody(scene, this.x + 4, this.y, TILE - 8, this.h, false);
    this.open = false;
  }
  unlock() {
    if (this.open) return; this.open = true;
    this.spr.setFrame(1); Audio.sfx('gate');
    this.scene.shake(0.006, 300);
    this.scene.tweens.add({ targets: this.spr, alpha: 0, scaleY: 0, duration: 600, delay: 250, ease: 'Back.easeIn' });
    this.zone.body.enable = false;
  }
  update() {}
}

// ---------------- Bell order puzzle ----------------
export class BellPuzzle {
  constructor(scene, o) {
    this.scene = scene; this.o = o; this.order = o.order; this.progress = 0; this.solved = false;
    // Progress lamps by the door: big, on a dark board so green/red read clearly.
    const lx = o.x * TILE + TILE / 2, ly = o.y * TILE + TILE / 2, n = this.order.length, gap = 54;
    const bw = gap * n + 16, bh = 70;
    this.board = scene.add.graphics().setDepth(19);
    this.board.fillStyle(0x2a1f3d, 0.92).fillRoundedRect(lx - bw / 2, ly - bh / 2, bw, bh, 18);
    this.board.lineStyle(4, 0xfff3c4, 0.9).strokeRoundedRect(lx - bw / 2, ly - bh / 2, bw, bh, 18);
    this.lamps = this.order.map((_, i) => scene.add.image(lx + (i - (n - 1) / 2) * gap, ly, 'lamp', 0).setScale(inv * 1.9).setDepth(20));
    this.badges = [];
    scene.events.on('bell', this.onBell, this);
    scene.events.once('shutdown', () => scene.events.off('bell', this.onBell, this));
  }

  // A round badge under a bell: green with the step number when right, red with an X when wrong.
  badge(bell, ok, label) {
    const s = this.scene, x = bell.x, y = bell.y + 58;
    const c = s.add.container(x, y).setDepth(45);
    const g = s.add.graphics();
    g.fillStyle(0x2a1f3d, 1).fillCircle(0, 3, 25);
    g.fillStyle(ok ? 0x3fbf5f : 0xe0404a, 1).fillCircle(0, 0, 25);
    g.lineStyle(4, 0xffffff, 1).strokeCircle(0, 0, 25);
    c.add([g, s.makeText(0, 1, label, 28, { strokeW: 5 })]);
    c.setScale(0);
    s.tweens.add({ targets: c, scale: 1, duration: 260, ease: 'Back.easeOut' });
    return c;
  }

  clearBadges() {
    for (const b of this.badges) this.scene.tweens.add({ targets: b, scale: 0, alpha: 0, duration: 250, onComplete: () => b.destroy() });
    this.badges = [];
  }

  onBell(bell) {
    if (this.solved || !this.o.bells.includes(bell.id)) return;
    if (bell.color === this.order[this.progress]) {
      this.lamps[this.progress].setFrame(1);
      this.scene.tweens.add({ targets: this.lamps[this.progress], scale: inv * 2.5, duration: 140, yoyo: true });
      this.progress++;
      this.badges.push(this.badge(bell, true, String(this.progress)));
      Audio.sfx('chime', { m: 84 + this.progress * 4 });
      if (this.progress >= this.order.length) {
        this.solved = true; Audio.sfx('learn');
        this.scene.time.delayedCall(400, () => this.scene.doors[this.o.door] && this.scene.doors[this.o.door].unlock());
        this.scene.puzzleSolved(this.o.id);
      }
    } else {
      Audio.sfx('buzz');
      this.scene.shake(0.004, 160);
      const wrong = this.badge(bell, false, '✗');
      this.scene.tweens.add({ targets: wrong, x: wrong.x + 6, duration: 50, yoyo: true, repeat: 4 });
      this.scene.time.delayedCall(1100, () => this.scene.tweens.add({ targets: wrong, scale: 0, alpha: 0, duration: 250, onComplete: () => wrong.destroy() }));
      this.clearBadges();
      this.lamps.forEach(l => l.setFrame(2));
      this.scene.time.delayedCall(900, () => { if (!this.solved) this.lamps.forEach(l => l.setFrame(0)); });
      this.progress = 0;
      this.scene.puzzleMistake(this.o.id);
    }
  }
  update() {}
}

// ---------------- Walker enemy ----------------
export class Walker {
  constructor(scene, c, r, tex, range = 3) {
    this.scene = scene; this.x = c * TILE + TILE / 2; this.y = (r + 1) * TILE; this.home = this.x;
    this.range = range * TILE; this.dir = 1; this.speed = 70; this.alive = true; this.stun = 0;
    this.spr = scene.add.sprite(this.x, this.y + 2, tex, 0).setOrigin(0.5, 1).setScale(inv).setDepth(40);
    this.spr.play(`${tex}-walk`);
  }
  startle() { if (!this.alive) return; this.stun = 2.5; this.dir *= -1; this.spr.setTint(0x9fd8ff); this.scene.tweens.add({ targets: this.spr, y: this.y - 20, duration: 160, yoyo: true }); }
  update(dt) {
    if (!this.alive) return;
    const s = this.scene;
    if (this.stun > 0) { this.stun -= dt; if (this.stun <= 0) this.spr.clearTint(); }
    else {
      this.x += this.dir * this.speed * dt * s.hzRate;
      // turn around at range ends or edges/walls
      const ahead = this.x + this.dir * 26;
      const c = Math.floor(ahead / TILE), r = Math.floor((this.y - 10) / TILE);
      if (Math.abs(this.x - this.home) > this.range || s.lv.isSolid(c, r) || !s.lv.isSolid(c, r + 1) && !s.hasPlatformAt(ahead, this.y + 6)) this.dir *= -1;
    }
    this.spr.setPosition(this.x, this.y + 2).setFlipX(this.dir < 0);
    const p = s.player; if (p.dead) return;
    const pb = p.body.body;
    const hb = p.getHitbox(4);
    if (overlap(hb, this.x - 18, this.y - 36, 36, 36)) {
      if (pb.velocity.y > 50 && pb.bottom < this.y - 14) {
        this.alive = false; p.bounce(640); Audio.sfx('stomp'); s.fx.burst(this.x, this.y - 18, 0xffd75e, 12);
        this.scene.tweens.add({ targets: this.spr, scaleY: inv * 0.2, alpha: 0, duration: 220, onComplete: () => this.spr.setVisible(false) });
        s.events.emit('stomp');
      } else if (this.stun <= 0) s.fail('enemy');
    }
  }
}
