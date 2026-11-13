// Landon's controller: arcade body (zone) + a separate visual sprite for squash & stretch.
import { PHYS, ART } from '../core/constants.js';
import { Input } from '../core/input.js';
import { Audio } from '../audio/audio.js';
import { LANDON_FRAME } from '../art/landon.js';

export class Player {
  constructor(scene, x, y, outfit) {
    this.scene = scene;
    this.outfit = outfit;
    this.body = scene.add.zone(x, y, PHYS.bodyW, PHYS.bodyH);
    scene.physics.add.existing(this.body);
    const b = this.body.body;
    b.setMaxVelocityY(PHYS.maxFall);
    b.setSize(PHYS.bodyW, PHYS.bodyH);
    this.sprite = scene.add.sprite(x, y, `landon-${outfit}`, 0).setOrigin(0.5, LANDON_FRAME.originY).setDepth(50);
    this.shadow = scene.add.ellipse(x, y, 34, 8, 0x000000, 0.18).setDepth(49);
    this.baseScale = 1 / ART;
    this.sx = 1; this.sy = 1; // squash/stretch multipliers, ease back to 1
    this.facing = 1;
    this.vx = 0;
    this.coyote = 0; this.buffer = 0; this.jumping = false; this.grounded = false; this.wasGrounded = true;
    this.dead = false; this.frozen = false; this.invuln = 0; this.landTimer = 0;
    this.ride = null; this.stepTimer = 0;
    this.windV = 0; this.windTarget = 0; // stellar wind push (set by Wind zones each frame)
    this.gravityDir = 1;
    this.hitbox = new Phaser.Geom.Rectangle();
    this.anim = '';
    this.play('idle');
  }

  get x() { return this.body.x; }
  get y() { return this.body.y; }
  get bottom() { return this.body.body.bottom; }

  play(name) {
    if (this.anim === name) return;
    this.anim = name;
    this.sprite.play(`landon-${this.outfit}-${name}`, true);
  }

  setOutfit(o) { this.outfit = o; this.sprite.setTexture(`landon-${o}`); const a = this.anim; this.anim = ''; this.play(a || 'idle'); }

  squash(sx, sy) { this.sx = sx; this.sy = sy; }

  teleport(x, y) {
    this.body.body.reset(x, y);
    this.vx = 0; this.ride = null; this.windV = 0;
    this.sprite.setPosition(x, this.body.body.bottom);
  }

  // Called from the scene's update (after the physics step of this frame).
  update(dt, assist) {
    const b = this.body.body;
    if (this.invuln > 0) this.invuln -= dt;
    this.wasGrounded = this.grounded;
    this.grounded = b.blocked.down || b.touching.down;
    if (this.dead || this.frozen) { this.updateVisual(dt); return; }

    // --- horizontal ---
    const dir = (Input.right ? 1 : 0) - (Input.left ? 1 : 0);
    const max = PHYS.runSpeed;
    if (dir !== 0) {
      const acc = this.grounded ? PHYS.groundAccel : PHYS.airAccel;
      // turning around is snappier
      const boost = Math.sign(this.vx) !== dir && this.vx !== 0 ? 1.6 : 1;
      this.vx += dir * acc * boost * dt;
      if (Math.abs(this.vx) > max) this.vx = Math.sign(this.vx) * max;
      this.facing = dir;
    } else {
      const dec = (this.grounded ? PHYS.groundDecel : PHYS.airDecel) * dt;
      this.vx = Math.abs(this.vx) <= dec ? 0 : this.vx - Math.sign(this.vx) * dec;
    }
    if (b.blocked.left && this.vx < 0) this.vx = 0;
    if (b.blocked.right && this.vx > 0) this.vx = 0;
    let rideVx = 0;
    if (this.ride && this.grounded && this.ride.body) {
      rideVx = this.ride.body.velocity.x;
      if (this.ride.body.velocity.y > 0 && b.velocity.y < this.ride.body.velocity.y) b.velocity.y = this.ride.body.velocity.y;
    } else this.ride = null;
    // wind eases in and out so gusts feel like a push, not a teleport
    this.windV += (this.windTarget - this.windV) * Math.min(1, dt * (this.windTarget ? 3 : 12)); // fades fast when the gust ends
    this.windTarget = 0;
    if ((b.blocked.left && this.windV < 0) || (b.blocked.right && this.windV > 0)) this.windV = 0;
    b.velocity.x = this.vx + rideVx + this.windV;

    // --- jump: coyote time + buffer + variable height ---
    if (this.grounded) { this.coyote = PHYS.coyote; this.jumping = false; } else this.coyote -= dt;
    if (Input.pressed('jump')) this.buffer = PHYS.buffer; else this.buffer -= dt;
    if (this.buffer > 0 && this.coyote > 0) this.doJump(PHYS.jumpV);
    if (this.jumping && !Input.jump && b.velocity.y < 0) { b.velocity.y *= PHYS.jumpCut; this.jumping = false; }
    // heavier fall
    b.setGravityY(b.velocity.y > 0 ? PHYS.gravity * (PHYS.fallMult - 1) : 0);

    // landing
    if (this.grounded && !this.wasGrounded) {
      const impact = Math.min(1, (this.lastVy || 0) / 900);
      if (impact > 0.25) { this.squash(1 + 0.3 * impact, 1 - 0.28 * impact); Audio.sfx('land', { v: impact }); this.scene.events.emit('player-land', impact); }
      this.landTimer = 0.09;
    }
    this.lastVy = b.velocity.y;

    // footsteps
    if (this.grounded && Math.abs(this.vx) > 60) { this.stepTimer -= dt; if (this.stepTimer <= 0) { this.stepTimer = 0.26; Audio.sfx('step'); this.scene.events.emit('player-step'); } }

    // --- animation state ---
    if (!this.grounded) this.play(b.velocity.y < -40 ? 'jump' : 'fall');
    else if (this.landTimer > 0) { this.landTimer -= dt; this.play('land'); }
    else if (Math.abs(this.vx) > 20) this.play('run');
    else this.play('idle');
    this.updateVisual(dt);
  }

  doJump(v) {
    const b = this.body.body;
    b.velocity.y = -v; this.jumping = true; this.buffer = 0; this.coyote = 0; this.ride = null;
    this.squash(0.78, 1.25);
    Audio.sfx('jump');
    this.scene.events.emit('player-jump');
  }

  bounce(v, keepJumpHeld = true) {
    const b = this.body.body;
    b.velocity.y = -v; this.jumping = keepJumpHeld && Input.jump; this.coyote = 0; this.ride = null;
    this.squash(0.7, 1.35);
  }

  updateVisual(dt) {
    const b = this.body.body;
    // ease squash back toward 1
    const k = Math.min(1, dt * 12);
    this.sx += (1 - this.sx) * k; this.sy += (1 - this.sy) * k;
    // subtle stretch while moving vertically
    let vs = 1;
    if (!this.dead && !this.grounded) vs = 1 + Math.min(0.08, Math.abs(b.velocity.y) / 9000);
    this.sprite.setScale(this.baseScale * this.sx * this.facing / Math.sqrt(vs), this.baseScale * this.sy * vs);
    if (!this.dead) this.sprite.setPosition(this.body.x, b.bottom + 1);
    this.sprite.setAlpha(this.invuln > 0 && !this.dead ? (Math.floor(this.invuln * 16) % 2 ? 0.45 : 1) : 1);
    this.shadow.setVisible(this.grounded && !this.dead).setPosition(this.body.x, b.bottom + 1);
  }

  getHitbox(inset = 6) {
    const b = this.body.body;
    this.hitbox.setTo(b.x + inset, b.y + inset, b.width - inset * 2, b.height - inset * 1.5);
    return this.hitbox;
  }
}
