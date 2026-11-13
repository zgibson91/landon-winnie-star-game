// Winnie follows Landon's recent path, idles like a curious kitten, and performs abilities.
import { ART } from '../core/constants.js';
import { Audio } from '../audio/audio.js';
import { WINNIE_FRAME } from '../art/winnie.js';

const TRAIL_MAX = 240;

export class Winnie {
  constructor(scene, player) {
    this.scene = scene; this.player = player;
    this.sprite = scene.add.sprite(player.x - 50, player.bottom, 'winnie', 0).setOrigin(0.5, WINNIE_FRAME.originY).setDepth(48).setScale(1 / ART);
    this.glow = scene.add.image(0, 0, 'winnie-eyeglow').setDepth(49).setScale(1 / ART).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    this.trail = [];
    this.x = this.sprite.x; this.y = this.sprite.y;
    this.facing = 1; this.busy = false; this.idleT = 0; this.anim = ''; this.sx = 1; this.sy = 1;
    this.nextIdleAct = 3 + Math.random() * 2;
    this.play('sit');
  }

  play(name) { if (this.anim !== name) { this.anim = name; this.sprite.play(`winnie-${name}`, true); } }

  reset() {
    this.trail.length = 0; this.busy = false;
    this.scene.tweens.killTweensOf(this);
    this.x = this.player.x - 50 * this.player.facing; this.y = this.player.bottom;
    this.sprite.setVisible(true).setAlpha(1);
    this.play('sit');
  }

  record() {
    const p = this.player;
    const last = this.trail[this.trail.length - 1];
    const x = p.x, y = p.bottom;
    if (!last || Math.abs(last.x - x) + Math.abs(last.y - y) > 3) {
      this.trail.push({ x, y, g: p.grounded });
      if (this.trail.length > TRAIL_MAX) this.trail.shift();
    }
  }

  // point on the trail `dist` pixels behind the player
  behind(dist) {
    let acc = 0;
    for (let i = this.trail.length - 1; i > 0; i--) {
      const a = this.trail[i], b = this.trail[i - 1];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (acc + d >= dist) { const t = (dist - acc) / d; return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, g: a.g && b.g }; }
      acc += d;
    }
    const f = this.trail[0];
    return f ? { x: f.x, y: f.y, g: f.g } : { x: this.player.x - 50, y: this.player.bottom, g: true };
  }

  update(dt) {
    const p = this.player;
    if (!p.dead) this.record();
    if (!this.busy) {
      const tgt = this.behind(64);
      const dx = tgt.x - this.x, dy = tgt.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 700) { this.x = tgt.x; this.y = tgt.y; }
      else {
        const sp = Math.min(1, dt * (dist > 120 ? 12 : 8));
        this.x += dx * sp; this.y += dy * sp;
      }
      const moving = Math.abs(dx) > 4;
      if (Math.abs(dx) > 2) this.facing = dx > 0 ? 1 : -1;
      if (!tgt.g && Math.abs(dy) > 6) { this.play('jump'); this.idleT = 0; }
      else if (moving && Math.abs(p.vx) > 10) { this.play('walk'); this.idleT = 0; }
      else {
        // idle: look at Landon, then do kitten things
        this.facing = p.x >= this.x ? 1 : -1;
        this.idleT += dt;
        if (this.idleT > this.nextIdleAct && this.anim === 'sit') {
          const acts = ['stretch', 'bat', 'sit', 'meowSoft'];
          const a = acts[Math.floor(Math.random() * acts.length)];
          if (a === 'meowSoft') { this.play('meow'); Audio.sfx('meow', { pitch: 1.3 }); this.scene.time.delayedCall(500, () => { if (this.anim === 'meow' && !this.busy) this.play('sit'); }); }
          else if (a !== 'sit') { this.play(a); this.scene.time.delayedCall(a === 'stretch' ? 1100 : 700, () => { if (this.anim === a && !this.busy) this.play('sit'); }); }
          this.nextIdleAct = this.idleT + 4 + Math.random() * 4;
        } else if (this.idleT > 20 && this.scene.isHub) this.play('loaf');
        else if (!['stretch', 'bat', 'meow', 'loaf'].includes(this.anim)) this.play('sit');
      }
    }
    this.sx += (1 - this.sx) * Math.min(1, dt * 10); this.sy += (1 - this.sy) * Math.min(1, dt * 10);
    this.sprite.setPosition(this.x, this.y + 1).setScale(this.facing * this.sx / ART, this.sy / ART);
    if (this.glow.visible) this.glow.setPosition(this.x + this.facing * 13, this.y - 26);
  }

  react(kind) {
    if (this.busy) return;
    if (kind === 'fail') { this.play('meow'); Audio.sfx('meow', { pitch: 0.85 }); }
    if (kind === 'happy') { this.play('happy'); Audio.sfx('purr'); }
    this.idleT = 0;
  }

  // --- abilities ---
  nightEyes(onPulse) {
    this.busy = true; this.play('sit'); this.facing = this.player.facing;
    this.glow.setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this.glow, alpha: 1, duration: 150, yoyo: true, hold: 600, onComplete: () => this.glow.setVisible(false) });
    Audio.sfx('reveal');
    this.scene.time.delayedCall(180, () => { onPulse(this.x, this.y - 20); });
    this.scene.time.delayedCall(700, () => { this.busy = false; });
  }

  meow(onWave) {
    this.busy = true; this.play('meow'); this.sy = 1.15; this.sx = 0.9;
    Audio.sfx('meow', { pitch: 1 });
    onWave(this.x, this.y - 20);
    this.scene.time.delayedCall(600, () => { this.busy = false; });
  }

  // Leap to (tx, ty), call onHit, then hop back to Landon.
  pounce(tx, ty, onHit) {
    this.busy = true; this.play('pounce');
    const sx = this.x, sy = this.y;
    this.facing = tx >= sx ? 1 : -1;
    Audio.sfx('pounce');
    const peak = Math.min(sy, ty) - 70;
    const o = { t: 0 };
    this.scene.tweens.add({
      targets: o, t: 1, duration: 420, ease: 'Sine.easeInOut',
      onUpdate: () => {
        const t = o.t;
        this.x = sx + (tx - sx) * t;
        // quadratic bezier through peak
        const cy = 2 * peak - (sy + ty) / 2;
        this.y = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ty + 24;
      },
      onComplete: () => {
        this.play('bat'); this.sx = 1.2; this.sy = 0.85;
        onHit && onHit();
        this.scene.time.delayedCall(260, () => {
          const back = { t: 0 }; const bx = this.x, by = this.y;
          this.play('jump');
          this.scene.tweens.add({
            targets: back, t: 1, duration: 420, ease: 'Sine.easeIn',
            onUpdate: () => {
              const ex = this.player.x - 40 * this.player.facing, ey = this.player.bottom;
              const t = back.t; const cy = Math.min(by, ey) - 60;
              this.x = bx + (ex - bx) * t;
              this.y = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * cy + t * t * ey;
              this.facing = ex >= bx ? 1 : -1;
            },
            onComplete: () => { this.busy = false; this.trail.length = 0; this.play('sit'); },
          });
        });
      },
    });
  }

  // Slip through a tiny gap: walk into it, vanish, appear at the other side, open it, come back.
  squeeze(ax, ay, bx, by, onOpen) {
    this.busy = true; this.play('walk');
    const tl = this.scene.tweens.chain({
      targets: this,
      tweens: [
        { x: ax, y: ay, duration: 380, onStart: () => { this.facing = ax >= this.x ? 1 : -1; } },
        { sx: 0.6, sy: 0.6, duration: 160, onComplete: () => { this.sprite.setAlpha(0.35); Audio.sfx('whoosh'); } },
        { x: bx, y: by, duration: 520 },
        { sx: 1, sy: 1, duration: 140, onStart: () => { this.sprite.setAlpha(1); }, onComplete: () => { this.play('bat'); onOpen && onOpen(); } },
        { x: bx, duration: 400 },
      ],
      onComplete: () => { this.busy = false; this.trail.length = 0; },
    });
    return tl;
  }
}
