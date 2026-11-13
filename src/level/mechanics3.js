// Batch-3 mechanics: dust-ring wheels (WOH G64), black-hole pulls and slow-time bubbles (Quasi-Star),
// pulsar beams (Neutron Star), the Dust Bunny King mini-boss, The Reaper final boss and the Reaper teaser.
import { TILE, ART } from '../core/constants.js';
import { Audio } from '../audio/audio.js';
import { Capsule } from './objects.js';

const inv = 1 / ART;
const overlap = (r, x, y, w, h) => r.x < x + w && r.right > x && r.y < y + h && r.bottom > y;
// does a rectangle touch an ellipse? (round bosses get round hitboxes, so near misses are misses)
function hitsEllipse(r, cx, cy, rx, ry) {
  const px = Phaser.Math.Clamp(cx, r.x, r.right), py = Phaser.Math.Clamp(cy, r.y, r.bottom);
  return ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 < 1;
}

function solidZone(scene, x, y, w, h, oneWay) {
  const z = scene.add.zone(x + w / 2, y + h / 2, w, h);
  scene.physics.add.existing(z);
  scene.platforms.add(z);
  const b = z.body;
  b.setAllowGravity(false); b.setImmovable(true);
  if (oneWay) { b.checkCollision.down = false; b.checkCollision.left = false; b.checkCollision.right = false; }
  return z;
}

// ---------------- Dust ring: rocks orbit a glowing core like a Ferris wheel ----------------
// {t:"ring", x, y, r, n, period, w, offset, id}  center = tile (x, y); negative period spins the other way.
class RingRock {
  constructor(scene, ring, i) {
    this.scene = scene; this.ring = ring; this.i = i;
    this.w = ring.w;
    this.zone = solidZone(scene, 0, 0, this.w, 20, true);
    this.zone.owner = this;
  }
}

export class RingWheel {
  constructor(scene, o) {
    this.scene = scene; this.o = o;
    this.cx = o.x * TILE + TILE / 2; this.cy = o.y * TILE + TILE / 2;
    this.R = (o.r || 3) * TILE; this.n = o.n || 4; this.period = o.period || 8; this.w = (o.w || 2) * TILE;
    this.a = (o.offset || 0) * Math.PI * 2; this.frozen = false;
    this.track = scene.add.graphics().setDepth(14);
    this.drawTrack(0xffc080);
    this.core = scene.add.image(this.cx, this.cy, 'ringcore').setScale(inv).setDepth(15);
    this.rocks = [];
    for (let i = 0; i < this.n; i++) {
      const r = new RingRock(scene, this, i);
      r.cap = new Capsule(scene, o.style ? `cap-${o.style}` : 'cap-dust', 0, 0, this.w);
      this.rocks.push(r);
    }
    if (o.id) scene.rings[o.id] = this;
    this.place(0, 1 / 60);
  }
  drawTrack(col) {
    const g = this.track; g.clear();
    g.lineStyle(4, col, 0.35);
    const n = 40;
    for (let i = 0; i < n; i += 2) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2; g.beginPath(); g.arc(this.cx, this.cy, this.R, a0, a1); g.strokePath(); }
    g.lineStyle(3, col, 0.2);
    for (let i = 0; i < this.n; i++) { const a = this.a + i / this.n * Math.PI * 2; g.lineBetween(this.cx, this.cy, this.cx + Math.cos(a) * this.R, this.cy + Math.sin(a) * this.R); }
  }
  rockPos(a, i) {
    const t = a + i / this.n * Math.PI * 2;
    return { x: this.cx + Math.cos(t) * this.R - this.w / 2, y: this.cy + Math.sin(t) * this.R };
  }
  setFrozen(on) {
    this.frozen = on;
    this.core.setTint(on ? 0x9fd8ff : 0xffffff);
    this.drawTrack(on ? 0x9fd8ff : 0xffc080);
    Audio.sfx(on ? 'tick' : 'gate');
  }
  place(step, dt) {
    const a0 = this.a, a1 = this.a + step;
    for (const r of this.rocks) {
      const now = this.rockPos(a0, r.i), next = this.rockPos(a1, r.i);
      const b = r.zone.body;
      b.velocity.x = (next.x - now.x) / dt; b.velocity.y = (next.y - now.y) / dt;
      if (Math.abs(b.x - now.x) > 2 || Math.abs(b.y - now.y) > 2) { b.x = now.x; b.y = now.y; }
      r.cap.set(b.x, b.y - 4, this.w);
    }
  }
  update(dt) {
    const s = this.scene;
    const step = this.frozen ? 0 : dt * s.hzRate / this.period * Math.PI * 2;
    this.place(step, dt);
    this.a += step;
    if (!this.frozen && Math.abs(step) > 0) this.trackT = (this.trackT || 0) + dt;
    if ((this.trackT || 0) > 0.5) { this.trackT = 0; this.drawTrack(0xffc080); }
  }
}

// ---------------- Black hole: pulls Landon sideways toward its middle ----------------
// {t:"pull", x, y, range, h, power, core}
export class Pull {
  constructor(scene, o) {
    this.scene = scene; this.o = o;
    this.cx = o.x * TILE + TILE / 2; this.cy = o.y * TILE + TILE / 2;
    this.range = (o.range || 6) * TILE; this.h = (o.h || 6) * TILE; this.power = o.power || 170;
    this.coreR = o.core === false ? 0 : 34;
    this.spr = scene.add.image(this.cx, this.cy, 'vortex').setScale(inv * (o.size || 1)).setDepth(13);
    this.parts = scene.add.particles(this.cx, this.cy, 'spark', {
      lifespan: 1100, frequency: 70, quantity: 1, scale: { start: 0.7, end: 0.1 }, alpha: { start: 0.9, end: 0 }, blendMode: 'ADD',
      tint: [0xffb07a, 0xd6a0ff, 0xffffff], moveToX: this.cx, moveToY: this.cy,
      emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, this.range * 0.7), quantity: 36 },
    }).setDepth(13);
    this.on = o.on !== false; this.near = false;
    if (!this.on) { this.spr.setVisible(false); this.parts.stop(); }
  }
  setOn(on) { this.on = on; this.spr.setVisible(on); if (on) this.parts.start(); else this.parts.stop(); }
  update(dt) {
    if (!this.on) return;
    this.spr.rotation -= dt * 1.4;
    const s = this.scene, p = s.player; if (p.dead) return;
    const dx = this.cx - p.x, dy = p.body.y - this.cy;
    const inside = Math.abs(dx) < this.range && Math.abs(dy) < this.h;
    if (inside) {
      const k = 1 - Math.min(1, Math.abs(dx) / this.range);
      p.windTarget += Math.sign(dx) * this.power * (0.35 + 0.65 * k) * (s.assist ? 0.7 : 1);
      if (!this.near) { this.near = true; Audio.sfx('vortex'); }
    } else this.near = false;
    if (this.coreR && Math.hypot(dx, dy) < this.coreR + 14) s.fail('blackhole');
  }
}

// ---------------- Slow-time bubble: hazards crawl while Landon is inside ----------------
// {t:"slow", x, y, r}
export class SlowBubble {
  constructor(scene, o) {
    this.scene = scene; this.o = o;
    this.cx = o.x * TILE + TILE / 2; this.cy = o.y * TILE + TILE / 2; this.R = (o.r || 3) * TILE;
    this.spr = scene.add.image(this.cx, this.cy, 'slowbubble').setDisplaySize(this.R * 2, this.R * 2).setDepth(34).setAlpha(0.8);
    this.hand = scene.add.image(this.cx, this.cy, 'clockhand').setOrigin(0.5, 1).setScale(inv * this.R / 110).setDepth(34).setAlpha(0.6);
    this.inside = false;
  }
  contains(p) { return Math.hypot(p.x - this.cx, p.body.y - this.cy) < this.R; }
  update(dt) {
    const p = this.scene.player;
    const now = !p.dead && this.contains(p);
    if (now && !this.inside) Audio.sfx('tick');
    this.inside = now;
    this.hand.rotation += dt * (now ? 0.4 : 2.2);
    this.spr.setAlpha(now ? 1 : 0.75);
  }
}

// ---------------- Pulsar: beams of light sweep around a tiny spinning star ----------------
// {t:"pulsar", x, y, len, period, beams, offset}
export class Pulsar {
  constructor(scene, o) {
    this.scene = scene; this.o = o;
    this.cx = o.x * TILE + TILE / 2; this.cy = o.y * TILE + TILE / 2;
    this.len = (o.len || 5) * TILE; this.period = o.period || 8; this.nb = o.beams || 2; this.offset = o.offset || 0;
    this.beams = Array.from({ length: this.nb }, () => scene.add.image(this.cx, this.cy, 'beam').setOrigin(0, 0.5).setDepth(9).setBlendMode(Phaser.BlendModes.ADD));
    this.beams.forEach(b => b.setDisplaySize(this.len, 30));
    this.star = scene.add.image(this.cx, this.cy, 'neutronstar').setScale(inv * 0.9).setDepth(16);
    this.zapT = 0;
  }
  angle() { return (this.offset + this.scene.hz / this.period) * Math.PI * 2 * (this.o.ccw ? -1 : 1); }
  update(dt) {
    const s = this.scene, a = this.angle();
    this.beams.forEach((b, i) => b.setRotation(a + i / this.nb * Math.PI * 2));
    this.star.setScale(inv * (0.85 + Math.sin(s.hz * 12) * 0.05));
    const p = s.player; if (p.dead) return;
    const hb = p.getHitbox(8);
    const pts = [[hb.centerX, hb.y + 6], [hb.centerX, hb.centerY], [hb.centerX, hb.bottom - 6]];
    for (let i = 0; i < this.nb; i++) {
      const t = a + i / this.nb * Math.PI * 2, ux = Math.cos(t), uy = Math.sin(t);
      for (const [px, py] of pts) {
        const rx = px - this.cx, ry = py - this.cy;
        const along = rx * ux + ry * uy;
        if (along < 0 || along > this.len) continue;
        const across = Math.abs(rx * uy - ry * ux);
        if (across < 14) { s.fail('beam'); return; }
      }
    }
    if (Math.hypot(p.x - this.cx, p.body.y - this.cy) < 40) s.fail('beam');
  }
}

// ---------------- Reaper teaser: a shadowy figure watches from the sky, laughs, and flies off ----------------
// {t:"teaser", x}
export class Teaser {
  constructor(scene, o) { this.scene = scene; this.x = o.x * TILE; this.done = false; }
  update() {
    const s = this.scene, p = s.player;
    if (this.done || p.dead || p.x < this.x || !p.grounded) return;
    this.done = true;
    p.frozen = true; p.body.body.setVelocity(0, 0); p.play('look');
    const cam = s.cameras.main, wv = cam.worldView;
    const sx = wv.right - 200, sy = wv.top + 260;
    const sil = s.add.image(sx + 300, sy, 'reaper', 0).setOrigin(0.5, 0.5).setScale(inv * 1.3).setDepth(5).setTintFill(0x14081f).setAlpha(0);
    const eyes = [-12, 12].map(dx => s.add.circle(sx + 300 + dx * 1.17, sy - 100 * 0.585 + 2, 6, 0xc49aff).setDepth(6).setAlpha(0));
    s.tweens.add({ targets: [sil, ...eyes], alpha: 1, x: `-=300`, duration: 1100, ease: 'Sine.easeOut' });
    s.time.delayedCall(1200, () => { Audio.sfx('laugh'); s.shake(0.003, 400); eyes.forEach(e => s.tweens.add({ targets: e, scale: 1.6, duration: 160, yoyo: true, repeat: 2 })); });
    s.time.delayedCall(1300, () => s.game.events.emit('toast', { title: 'Who was THAT?!', text: 'A spooky shadow is flying to the Quasi-Star. Landon and Winnie will have to be brave!', icon: 'eye', ms: 3800 }));
    s.time.delayedCall(2600, () => {
      s.tweens.add({ targets: [sil, ...eyes], x: '+=700', y: '-=320', alpha: 0, duration: 1300, ease: 'Cubic.easeIn', onComplete: () => { sil.destroy(); eyes.forEach(e => e.destroy()); } });
      Audio.sfx('whoosh');
    });
    s.time.delayedCall(3300, () => { p.frozen = false; s.winnie.react('happy'); });
  }
}

// ======================================================================================
// Boss fights. {t:"boss", kind:"dustking"|"reaper", x, x2, y, trigger}
//   x..x2 = arena columns (inside the walls), y = the floor row (top of the ground), trigger = column that starts it.
// ======================================================================================
class BossFight {
  constructor(scene, o) {
    this.scene = scene; this.o = o;
    this.x0 = o.x * TILE; this.x1 = (o.x2 + 1) * TILE; this.floor = o.y * TILE;
    this.cxA = (this.x0 + this.x1) / 2;
    this.trigger = (o.trigger ?? o.x + 2) * TILE;
    this.active = false; this.over = false; this.state = 'sleep'; this.t = 0;
    this.phase = 1; this.phases = 1; this.hearts = 3; this.maxHearts = 3;
    this.walls = [];
    scene.bossFights.push(this);
  }
  get assistK() { return this.scene.assist ? 1.35 : 1; }
  begin() {
    const s = this.scene;
    this.active = true; s.boss = this;
    // close the arena with two glowing barriers
    for (const wx of [this.x0 - TILE, this.x1]) {
      const z = solidZone(s, wx, 0, TILE, this.floor, false);
      const img = s.add.image(wx + TILE / 2, this.floor, 'barrier', 1).setOrigin(0.5, 1).setScale(inv, inv * 1.4).setDepth(19).setAlpha(0);
      s.tweens.add({ targets: img, alpha: 1, duration: 300 });
      this.walls.push({ z, img });
    }
    Audio.sfx('gate');
    this.lockCamera();
    this.ui();
  }
  lockCamera() {
    const s = this.scene, cam = s.cameras.main;
    const w = Math.max(this.x1 - this.x0 + TILE * 2, s.vw || 960);
    cam.setBounds(this.cxA - w / 2, 0, w, s.lv.H * TILE);
  }
  unlockCamera() { const s = this.scene; s.cameras.main.setBounds(0, 0, s.lv.W * TILE, s.lv.H * TILE); }
  openArena() {
    for (const w of this.walls) { w.z.destroy(); this.scene.tweens.add({ targets: w.img, alpha: 0, duration: 500, onComplete: () => w.img.destroy() }); }
    this.walls = [];
    this.unlockCamera();
  }
  ui(show = true) {
    this.scene.game.events.emit('boss-ui', { show: show && this.active && !this.over, name: this.name, hearts: this.hearts, max: this.maxHearts, phase: this.phase, phases: this.phases });
  }
  hints() { return this.hintList ? this.hintList[this.phase - 1] : null; }
  go(state) { this.state = state; this.t = 0; }
  playerHurt() { this.scene.fail(this.name === 'The Reaper' ? 'reaper' : 'boss'); }
  // Landon falling onto a zone counts as a stomp
  stompCheck(cx, top, halfW) {
    const p = this.scene.player, b = p.body.body;
    if (p.dead || b.velocity.y <= 40) return false;
    if (Math.abs(p.x - cx) < halfW + 12 && p.bottom > top - 14 && p.bottom < top + 34) { p.bounce(720); return true; }
    return false;
  }
  update(dt) {
    const s = this.scene, p = s.player;
    if (!this.active) {
      if (!this.over && p.x > this.trigger && !p.dead) this.begin();
      return;
    }
    if (this.over) return;
    this.t += dt;
    this.tick(dt * (s.assist ? 0.8 : 1));
  }
  onRespawn() {}
}

// ---------------- Dust Bunny King (WOH G64) ----------------
export class DustKing extends BossFight {
  constructor(scene, o) {
    super(scene, o);
    this.name = 'Dust Bunny King';
    this.x = this.cxA + TILE * 3; this.dir = -1; this.speed = 0;
    this.spr = scene.add.sprite(this.x, this.floor + 2, 'dustking', 0).setOrigin(0.5, 1).setScale(inv * 0.75).setDepth(38);
    this.zzz = scene.makeText(this.x + 40, this.floor - 120, 'z z z', 22, { color: '#ffe0b0' }).setDepth(39);
    this.dizzy = scene.add.container(0, 0).setDepth(40).setVisible(false);
    for (let i = 0; i < 3; i++) this.dizzy.add(scene.add.image(0, 0, 'starpt').setScale(1.6).setTint(0xffe680));
    this.hintList = [["The Dust Bunny King rolls when it shakes. Jump over it!", "When it bonks the wall it gets dizzy. That's your chance!", "Jump on its head while it's dizzy. Three bonks wins!"]];
  }
  begin() {
    super.begin();
    this.zzz.setVisible(false);
    Audio.playSong('miniboss');
    this.go('intro');
    this.scene.game.events.emit('toast', { title: 'Dust Bunny King!', text: 'Jump over it when it rolls. Bonk its head when it gets dizzy!', icon: 'stomp', ms: 3600 });
  }
  frame(i) { this.spr.setFrame(i); }
  tick(dt) {
    const s = this.scene, p = s.player;
    const hb = p.getHitbox(5);
    const touching = hitsEllipse(hb, this.x, this.floor - 38, 40, 36);
    switch (this.state) {
      case 'intro':
        this.frame(1);
        if (this.t > 0.4 && !this.hopped) { this.hopped = true; s.tweens.add({ targets: this.spr, y: this.floor - 60, duration: 220, yoyo: true, ease: 'Quad.easeOut' }); Audio.sfx('roar'); s.shake(0.004, 250); }
        if (this.t > 1.5) this.go('wind');
        break;
      case 'wind': {
        this.dir = p.x < this.x ? -1 : 1;
        this.spr.setFlipX(this.dir > 0);
        this.frame(1);
        this.spr.x = this.x + Math.sin(this.t * 50) * 3;
        if (Math.random() < dt * 20) s.fx.puff(this.x - this.dir * 50, this.floor - 4, 1, 0xe0b080);
        if (this.t > 0.95 * this.assistK) { this.go('roll'); this.speed = 270 + (3 - this.hearts) * 40; Audio.sfx('whoosh'); }
        if (touching && !p.dead) this.playerHurt();
        break;
      }
      case 'roll':
        this.frame(2);
        this.x += this.dir * this.speed * dt;
        this.spr.rotation += this.dir * this.speed * dt / 55;
        if (Math.random() < dt * 30) s.fx.puff(this.x - this.dir * 40, this.floor - 4, 1, 0xe0b080);
        if (touching && !p.dead) this.playerHurt();
        if (this.x < this.x0 + 64 || this.x > this.x1 - 64) {
          this.x = Phaser.Math.Clamp(this.x, this.x0 + 64, this.x1 - 64);
          this.spr.rotation = 0; Audio.sfx('stomp'); s.shake(0.007, 220); s.fx.puff(this.x + this.dir * 50, this.floor - 40, 12, 0xe0b080);
          this.go('dizzy');
        }
        break;
      case 'dizzy':
        this.frame(3);
        this.dizzy.setVisible(true);
        this.dizzy.list.forEach((st, i) => { const a = this.t * 4 + i * 2.1; st.setPosition(this.x + Math.cos(a) * 40, this.floor - 104 + Math.sin(a) * 10); });
        if (this.stompCheck(this.x, this.floor - 80, 44)) { this.hit(); break; }
        if (this.t > 3.2 * this.assistK) { this.dizzy.setVisible(false); this.go('wind'); }
        break;
      case 'hurt':
        this.frame(4);
        if (this.t > 0.9) { this.spr.clearTint(); this.go(this.hearts > 0 ? 'wind' : 'defeat'); if (this.hearts <= 0) this.defeat(); }
        break;
    }
    this.spr.x = this.state === 'wind' ? this.spr.x : this.x;
  }
  hit() {
    const s = this.scene;
    this.hearts--; this.dizzy.setVisible(false);
    Audio.sfx('bosshit'); s.shake(0.006, 200); s.fx.starBurst(this.x, this.floor - 90, 14, 0xffe0b0);
    this.spr.setTint(0xffffff);
    this.go('hurt'); this.ui();
  }
  defeat() {
    const s = this.scene;
    this.over = true; this.ui(false);
    Audio.stopSong(); Audio.sfx('win');
    s.fx.puff(this.x, this.floor - 50, 30, 0xe0b080); s.fx.starBurst(this.x, this.floor - 60, 30, 0xffe0b0);
    s.tweens.add({ targets: this.spr, scale: 0, alpha: 0, angle: 360, duration: 700, ease: 'Back.easeIn' });
    s.game.events.emit('toast', { title: 'You did it!', text: 'The Dust Bunny King puffed away into a little cloud. Achoo!', icon: 'shard', ms: 3000 });
    s.time.delayedCall(800, () => { this.openArena(); Audio.playSong(s.theme.music); s.puzzleSolved('boss'); });
  }
  onRespawn() {
    if (this.over || !this.active) return;
    this.dizzy.setVisible(false); this.spr.rotation = 0; this.spr.clearTint();
    // go back to the far side so Landon has room
    this.x = this.scene.player.x < this.cxA ? this.x1 - 90 : this.x0 + 90;
    this.go('wind'); this.t = -0.8;
  }
}

// ---------------- The Reaper (Quasi-Star) ----------------
const RF = { float: 0, telegraph: 1, swoop: 2, stuck: 3, hurt: 4, shield: 5, sad: 6 };
export class Reaper extends BossFight {
  constructor(scene, o) {
    super(scene, o);
    this.name = 'The Reaper'; this.phases = 3;
    this.x = this.cxA; this.y = this.floor - 250; // y = bottom of the robe
    this.spr = scene.add.sprite(this.x, this.y, 'reaper', 0).setOrigin(0.5, 1).setScale(inv * 0.9).setDepth(37).setAlpha(0);
    this.mark = scene.add.image(0, this.floor - 2, 'swoopmark').setScale(inv).setDepth(18).setVisible(false);
    this.shield = scene.add.image(0, 0, 'shieldbubble').setScale(inv * 0.95).setDepth(39).setVisible(false);
    this.lantern = scene.add.sprite(0, 0, 'reaperlantern', 1).setScale(inv * 1.2).setDepth(39).setVisible(false);
    this.dizzy = scene.add.container(0, 0).setDepth(40).setVisible(false);
    for (let i = 0; i < 3; i++) this.dizzy.add(scene.add.image(0, 0, 'starpt').setScale(1.6).setTint(0xffe680));
    this.vortex = null; this.orbs = []; this.scythes = []; this.lines = [];
    this.shieldUp = false; this.lanternOn = false; this.lanternUsed = false;
    this.pounceTarget = this; scene.pounceTargets.push(this);
    this.hintList = [
      ["The Reaper swoops down where the pink circle is. Run away from the circle!", "After it swoops, its scythe gets stuck. That's your chance!", "Jump on the Reaper's head while it's stuck. Three bonks!"],
      ["Jump over the bouncing dark balls.", "When the Reaper hides in a bubble, use Winnie's MEOW to pop it!", "Meow when the bubble is close, then jump on the Reaper's head."],
      ["The black hole pulls you. Keep running the other way!", "Spinning scythes fly low or high. Jump over the low ones, stay down for the high ones.", "When the Reaper's lantern glows, let Winnie POUNCE it. Then bonk the Reaper!"],
    ];
  }
  // pounce target (phase 3 lantern)
  get usable() { return this.lanternOn; }
  get tx() { return this.lantern.x; } get ty() { return this.lantern.y; }
  canPounce() { return this.lanternOn; }
  hit() { // Winnie's pounce landed on the lantern
    if (!this.lanternOn) return;
    this.lanternOn = false; this.lanternUsed = true;
    Audio.sfx('pop'); this.scene.fx.starBurst(this.lantern.x, this.lantern.y, 20, 0xfff3a0);
    this.lantern.setVisible(false);
    this.collapseVortex();
  }
  meowable(p) { return this.shieldUp && Math.abs(p.x - this.x) < 330 && Math.abs(p.bottom - this.floor) < 120; }
  onMeow(x, y) {
    if (!this.shieldUp || Math.abs(x - this.x) > 380) return;
    this.shieldUp = false; Audio.sfx('pop');
    this.scene.fx.ring(this.x, this.y - 90, 0xd6a0ff, 140);
    this.scene.tweens.add({ targets: this.shield, scale: inv * 1.4, alpha: 0, duration: 260, onComplete: () => this.shield.setVisible(false).setAlpha(1).setScale(inv * 0.95) });
    this.drop();
  }
  begin() {
    super.begin();
    const s = this.scene;
    this.meowHandler = (x, y) => this.onMeow(x, y);
    s.events.on('meow', this.meowHandler);
    s.events.once('shutdown', () => s.events.off('meow', this.meowHandler));
    Audio.stopSong();
    this.go('intro');
  }
  setPose(name) { this.spr.setFrame(RF[name]); }
  bodyBox() { return { x: this.x - 40, y: this.y - 170, w: 80, h: 160 }; }
  touchingBody() { const b = this.bodyBox(), hb = this.scene.player.getHitbox(6); return overlap(hb, b.x, b.y, b.w, b.h); }
  tick(dt) {
    const s = this.scene, p = s.player;
    const bob = Math.sin(s.levelTime * 2.4) * 8;
    switch (this.state) {
      case 'intro':
        if (this.t < 0.05) { this.spr.setAlpha(0).setPosition(this.cxA, this.floor - 250); Audio.sfx('laugh'); }
        this.spr.setAlpha(Math.min(1, this.t / 1.2)); this.setPose('telegraph');
        if (this.t > 1.2 && !this.roared) { this.roared = true; Audio.sfx('roar'); s.shake(0.006, 500); s.game.events.emit('toast', { title: 'The Reaper!', text: 'Watch out for its swoop, then bonk it on the head!', icon: 'stomp', ms: 3600 }); Audio.playSong('boss'); }
        if (this.t > 2.4) this.go('hover');
        break;
      case 'hover': {
        this.setPose('float');
        // phase 1 hovers over Landon (it's going to swoop); phase 2 keeps to the far side so its balls roll in from a distance
        const want = this.phase === 2 ? (p.x < this.cxA ? this.x1 - 130 : this.x0 + 130) : Phaser.Math.Clamp(p.x, this.x0 + 120, this.x1 - 120);
        this.x += (want - this.x) * Math.min(1, dt * 1.2);
        this.y = this.floor - 250 + bob;
        const wait = [1.5, 1.1, 1.0][this.phase - 1] * this.assistK;
        if (this.t > wait) {
          if (this.phase === 1) { this.go('telegraph'); this.target = Phaser.Math.Clamp(p.x, this.x0 + 70, this.x1 - 70); this.mark.setPosition(this.target, this.floor - 2).setVisible(true); Audio.sfx('swoop'); }
          else if (this.phase === 2) { this.go('orbs'); this.thrown = 0; }
          else { this.go('vortex'); }
        }
        break;
      }
      case 'telegraph':
        this.setPose('telegraph');
        this.y = this.floor - 250 + bob;
        this.mark.setAlpha(0.5 + 0.5 * Math.sin(this.t * 20));
        if (this.t > 1.0 * this.assistK) { this.go('swoop'); this.sx = this.x; this.sy = this.y; Audio.sfx('whoosh'); }
        break;
      case 'swoop': {
        this.setPose('swoop'); this.spr.setFlipX(this.target > this.sx);
        const k = Math.min(1, this.t / 0.55);
        const e = k * k;
        this.x = this.sx + (this.target - this.sx) * k; this.y = this.sy + (this.floor + 30 - this.sy) * e;
        if (this.touchingBody() && !p.dead) this.playerHurt();
        if (k >= 1) { this.mark.setVisible(false); s.shake(0.008, 260); Audio.sfx('stomp'); s.fx.puff(this.x, this.floor - 4, 14, 0xd6a0ff); this.spr.setFlipX(false); this.stuck(2.4); }
        break;
      }
      case 'stuck':
        this.setPose('stuck'); this.spr.setDepth(9);
        this.dizzy.setVisible(true);
        this.dizzy.list.forEach((st, i) => { const a = this.t * 4 + i * 2.1; st.setPosition(this.x + Math.cos(a) * 44, this.floor - 128 + Math.sin(a) * 10); });
        if (this.stompCheck(this.x, this.floor - 104, 44)) { this.bonk(); break; }
        if (this.t > this.stuckFor * this.assistK) { this.dizzy.setVisible(false); this.go('rise'); }
        break;
      case 'rise':
        this.setPose('float'); this.spr.setDepth(37);
        this.y += (this.floor - 250 - this.y) * Math.min(1, dt * 4);
        if (this.t > 0.7) this.go('hover');
        break;
      case 'hurt':
        this.setPose('hurt');
        if (this.t > 0.8) {
          this.spr.clearTint();
          if (this.hearts > 0) this.go('rise');
          else if (this.phase < this.phases) this.nextPhase();
          else this.defeat();
        }
        break;
      case 'roar':
        this.setPose('telegraph'); this.spr.setDepth(37);
        this.y += (this.floor - 250 - this.y) * Math.min(1, dt * 3); this.x += (this.cxA - this.x) * Math.min(1, dt * 2);
        if (this.t > 2.2) this.go('hover');
        break;
      // ---- phase 2: bouncing orbs, then a shield that Winnie's meow pops ----
      case 'orbs':
        this.setPose('telegraph');
        this.y = this.floor - 250 + bob;
        if (Math.abs(p.x - this.x) < 220) { const want = p.x < this.cxA ? this.x1 - 130 : this.x0 + 130; this.x += (want - this.x) * Math.min(1, dt * 2); }
        if (this.thrown < 2 && this.t > 0.5 + this.thrown * 1.3 * this.assistK) { this.throwOrb(); this.thrown++; }
        if (this.t > 0.5 + 2 * 1.3 * this.assistK + 1.2) { this.go('shield'); this.shieldUp = true; this.shield.setVisible(true).setAlpha(0); s.tweens.add({ targets: this.shield, alpha: 1, duration: 300 }); Audio.sfx('swap'); }
        break;
      case 'shield':
        this.setPose('shield');
        this.y += (this.floor - 40 + bob * 0.5 - this.y) * Math.min(1, dt * 2);
        this.x += Phaser.Math.Clamp(p.x - this.x, -1, 1) * 55 * dt;
        this.x = Phaser.Math.Clamp(this.x, this.x0 + 100, this.x1 - 100);
        this.shield.setPosition(this.x, this.y - 90);
        if (this.shieldUp && !p.dead) {
          // the bubble gently pushes Landon away (no damage)
          const dx = p.x - this.x, dy = p.body.y - (this.y - 90);
          if (Math.hypot(dx, dy) < 125) { p.windTarget += Math.sign(dx || 1) * 420; }
        }
        if (this.t > 8 * this.assistK) { this.shieldUp = false; this.shield.setVisible(false); this.go('rise'); }
        break;
      case 'fall':
        this.setPose('hurt');
        this.y += 900 * dt;
        if (this.y >= this.floor + 30) { this.y = this.floor + 30; s.shake(0.006, 200); Audio.sfx('stomp'); this.stuck(2.8); }
        break;
      // ---- phase 3: black hole + scythe sweeps + lantern for Winnie to pounce ----
      case 'vortex':
        this.setPose('telegraph');
        this.x += (this.cxA - this.x) * Math.min(1, dt * 3); this.y += (this.floor - 230 - this.y) * Math.min(1, dt * 3);
        if (this.t > 0.8 && !this.vortex) this.openVortex();
        if (this.t > 1.2) this.spr.setAlpha(Math.max(0, 1 - (this.t - 1.2) * 2));
        if (this.t > 1.8) { this.go('sweeps'); this.swept = 0; this.lastSweep = -9; }
        break;
      case 'sweeps':
        // one scythe at a time: the next one waits until the last has flown off
        if (this.swept < 3 && !this.scythes.length && !this.lines.some(l => l.active) && this.t > 0.4 + this.swept * 1.2 * this.assistK && this.t - (this.lastSweep || -9) > 1.0 * this.assistK) { this.sweep(this.swept % 2 === 0 ? 'low' : 'high'); this.swept++; }
        if (this.swept >= 3 && !this.scythes.length && this.t - this.lastSweep > 2.2 * this.assistK) { this.go('lantern'); this.lanternOn = true; this.lantern.setVisible(true).setFrame(1); Audio.sfx('reveal'); }
        break;
      case 'lantern': {
        const a = this.t * 0.9;
        this.lantern.setPosition(this.cxA + Math.cos(a) * 150, this.floor - 190 + Math.sin(a * 2) * 20);
        if (this.t > 7 * this.assistK) { this.lanternOn = false; this.lantern.setVisible(false); this.go('sweeps'); this.swept = 0; this.lastSweep = -9; }
        break;
      }
    }
    if (this.state !== 'swoop') this.spr.setFlipX(this.state === 'hover' || this.state === 'telegraph' ? p.x > this.x : false);
    this.spr.setPosition(this.x, this.y);
    this.updateOrbs(dt); this.updateScythes(dt);
  }
  stuck(sec) { this.go('stuck'); this.stuckFor = sec; this.y = this.floor + 30; }
  bonk() {
    const s = this.scene;
    this.hearts--; this.dizzy.setVisible(false); this.clearAttacks();
    Audio.sfx('bosshit'); s.shake(0.007, 220); s.fx.starBurst(this.x, this.floor - 100, 16, 0xd6a0ff);
    this.spr.setTintFill(0xffffff); s.time.delayedCall(120, () => this.spr.clearTint());
    this.go('hurt'); this.ui();
  }
  nextPhase() {
    const s = this.scene;
    this.phase++; this.hearts = this.maxHearts; this.ui();
    this.go('roar'); Audio.sfx('roar'); s.shake(0.008, 600);
    s.cameras.main.flash(300, 214, 160, 255);
    const msg = this.phase === 2 ? 'It throws dark balls now. When it hides in a bubble, let Winnie MEOW to pop it!' : 'It made a black hole! Dodge the scythes, then let Winnie POUNCE its glowing lantern.';
    s.game.events.emit('toast', { title: `Phase ${this.phase}!`, text: msg, icon: this.phase === 2 ? 'meow' : 'paw', ms: 4200 });
    s.puzzleSolved('phase');
  }
  throwOrb() {
    const s = this.scene, p = s.player;
    const dir = p.x < this.x ? -1 : 1;
    const spr = s.add.image(this.x + dir * 40, this.y - 150, 'darkorb').setScale(inv).setDepth(41);
    this.orbs.push({ spr, vx: dir * 160, vy: -150, life: 7 });
    Audio.sfx('swoop');
  }
  updateOrbs(dt) {
    const s = this.scene, p = s.player;
    for (const o of this.orbs) {
      o.vy += 900 * dt; o.spr.x += o.vx * dt; o.spr.y += o.vy * dt; o.life -= dt; o.spr.rotation += dt * 4;
      if (o.spr.y > this.floor - 22) { o.spr.y = this.floor - 22; o.vy = o.landed ? -240 : -330; o.landed = true; } // small hops along the floor
      if (o.spr.x < this.x0 + 22 || o.spr.x > this.x1 - 22) { o.vx *= -1; o.spr.x = Phaser.Math.Clamp(o.spr.x, this.x0 + 22, this.x1 - 22); o.bounces = (o.bounces || 0) + 1; }
      if (o.bounces >= 2) o.life = Math.min(o.life, 0.3);
      if (!p.dead && hitsEllipse(p.getHitbox(7), o.spr.x, o.spr.y, 16, 16)) this.playerHurt();
      if (o.life <= 0) { s.fx.burst(o.spr.x, o.spr.y, 0xb58aff, 6); o.spr.destroy(); o.dead = true; }
    }
    this.orbs = this.orbs.filter(o => !o.dead);
  }
  drop() { this.go('fall'); }
  openVortex() {
    const s = this.scene;
    this.vortex = new Pull(s, { x: (this.cxA - TILE / 2) / TILE, y: (this.floor - 270 - TILE / 2) / TILE, range: 11, h: 7, power: 115, core: false, size: 1.2 });
    this.vortex.cx = this.cxA; this.vortex.cy = this.floor - 270; this.vortex.spr.setPosition(this.cxA, this.floor - 270); this.vortex.parts.setPosition(this.cxA, this.floor - 270);
    this.vortex.spr.setScale(0); s.tweens.add({ targets: this.vortex.spr, scale: inv * 1.2, duration: 600, ease: 'Back.easeOut' });
    Audio.sfx('vortex');
  }
  collapseVortex() {
    const s = this.scene;
    if (this.vortex) {
      const v = this.vortex; this.vortex = null;
      s.tweens.add({ targets: v.spr, scale: 0, duration: 400, onComplete: () => { v.spr.destroy(); v.parts.destroy(); } });
    }
    this.clearAttacks();
    this.x = this.cxA; this.y = this.floor - 270; this.spr.setAlpha(1);
    this.go('fall');
  }
  sweep(kind) {
    const s = this.scene;
    this.lastSweep = this.t + 0.9 * this.assistK + (this.x1 - this.x0 + 160) / 420;
    const fromLeft = Math.random() < 0.5;
    const y = kind === 'low' ? this.floor - 28 : this.floor - 112;
    const line = s.add.rectangle(this.cxA, y, this.x1 - this.x0, 8, 0xff6af0, 0.5).setDepth(17);
    s.tweens.add({ targets: line, alpha: 0.15, duration: 150, yoyo: true, repeat: 3 });
    const arrow = s.makeText(fromLeft ? this.x0 + 40 : this.x1 - 40, y - (kind === 'low' ? 40 : -40), kind === 'low' ? 'JUMP!' : 'DUCK!', 22, { color: '#ff9af0' }).setDepth(42);
    this.lines.push(line, arrow);
    s.time.delayedCall(900 * this.assistK, () => {
      line.destroy(); arrow.destroy();
      if (this.state !== 'sweeps') return;
      const spr = s.add.image(fromLeft ? this.x0 - 40 : this.x1 + 40, y, 'scythe').setScale(inv * 0.8).setDepth(41);
      this.scythes.push({ spr, vx: (fromLeft ? 1 : -1) * 420, y });
      Audio.sfx('whoosh');
    });
  }
  updateScythes(dt) {
    const s = this.scene, p = s.player;
    for (const c of this.scythes) {
      c.spr.x += c.vx * dt; c.spr.rotation += dt * 14 * Math.sign(c.vx);
      if (!p.dead && overlap(p.getHitbox(8), c.spr.x - 30, c.y - 18, 60, 36)) this.playerHurt();
      if (c.spr.x < this.x0 - 80 || c.spr.x > this.x1 + 80) { c.spr.destroy(); c.dead = true; }
    }
    this.scythes = this.scythes.filter(c => !c.dead);
  }
  clearAttacks() {
    for (const o of this.orbs) o.spr.destroy(); this.orbs = [];
    for (const c of this.scythes) c.spr.destroy(); this.scythes = [];
    for (const l of this.lines) l.destroy(); this.lines = [];
  }
  onRespawn() {
    if (this.over || !this.active) return;
    this.clearAttacks();
    this.mark.setVisible(false); this.dizzy.setVisible(false);
    this.shieldUp = false; this.shield.setVisible(false);
    this.lanternOn = false; this.lantern.setVisible(false);
    if (this.vortex) { this.vortex.spr.destroy(); this.vortex.parts.destroy(); this.vortex = null; }
    this.spr.setAlpha(1).clearTint().setDepth(37);
    this.x = this.cxA; this.y = this.floor - 250;
    this.go('hover'); this.t = -1;
  }
  defeat() {
    const s = this.scene, p = s.player;
    this.over = true; this.ui(false); this.clearAttacks();
    Audio.stopSong();
    p.frozen = true; p.body.body.setVelocity(0, 0); p.play('look');
    this.spr.setDepth(37);
    this.x = this.cxA; this.y = this.floor + 4;
    s.tweens.add({ targets: this.spr, x: this.cxA, y: this.floor + 4, duration: 600 });
    this.setPose('sad');
    const T = (ms, fn) => s.time.delayedCall(ms, fn);
    T(400, () => s.game.events.emit('toast', { title: 'Oh!', text: 'The Reaper stopped. Is it... crying?', icon: 'eye', ms: 2600 }));
    T(3000, () => {
      Audio.sfx('reveal'); s.cameras.main.flash(500, 255, 255, 255); s.shake(0.004, 400);
      s.tweens.add({ targets: this.spr, alpha: 0, scaleY: inv * 0.2, duration: 600 });
      this.spirit = s.add.sprite(this.cxA, this.floor - 80, 'starspirit', 0).setScale(0).setDepth(45);
      s.tweens.add({ targets: this.spirit, scale: inv * 1.1, duration: 500, ease: 'Back.easeOut' });
      s.tweens.add({ targets: this.spirit, y: this.floor - 100, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      s.fx.starBurst(this.cxA, this.floor - 80, 40, 0xfff3a0);
    });
    T(3700, () => s.game.events.emit('toast', { title: 'A little lost star!', text: 'The Reaper was a tiny star hiding in a spooky costume. It was lonely and just wanted a friend!', icon: 'shard', ms: 4400 }));
    T(5200, () => { s.winnie.react('happy'); p.play('celebrate'); Audio.sfx('purr'); });
    T(8400, () => {
      Audio.sfx('learn');
      s.tweens.add({ targets: this.spirit, y: this.floor - 560, scale: inv * 2.2, duration: 2200, ease: 'Sine.easeIn' });
      s.game.events.emit('toast', { title: 'It shines again!', text: 'Landon and Winnie helped the little star light up the Quasi-Star. You saved the stars!', icon: 'shard', ms: 4200 });
    });
    T(11200, () => s.bossWon(this));
  }
}
