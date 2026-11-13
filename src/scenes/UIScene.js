// Always-on overlay: touch controls, HUD, pause button, hint bulb, toasts, and the hidden parent-menu corner.
import { VIEW_H, ART } from '../core/constants.js';
import { Input } from '../core/input.js';
import { Save } from '../core/save.js';
import { Audio } from '../audio/audio.js';
import { makeText } from '../ui/ui.js';

const INK = 0x2a1f3d;

export class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UI', active: false }); }

  create() {
    this.cam = this.cameras.main;
    this.cam.setOrigin(0, 0);
    this.touchMode = Input.lastDevice === 'touch' || (navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches);
    this.input.addPointer(4);
    this.hud = this.add.container(0, 0);
    this.controls = this.add.container(0, 0);
    this.buildControls();
    this.buildHud();
    this.toastQ = []; this.toastOn = false;
    this.hintOn = false;
    this.cornerHold = 0;
    this.cornerRing = this.add.graphics().setDepth(100);

    const ge = this.game.events;
    this.handlers = {
      toast: (t) => this.toast(t),
      'hint-available': () => this.showHint(true),
      'hint-reset': () => this.showHint(false),
      'level-ready': () => { this.showHint(false); this.layout(); },
    };
    for (const [k, fn] of Object.entries(this.handlers)) ge.on(k, fn);
    this.events.once('shutdown', () => { for (const [k, fn] of Object.entries(this.handlers)) ge.off(k, fn); });
    this.scale.on('resize', this.layout, this);
    this.input.on('pointerdown', (p) => {
      if (!this.touchMode) { this.touchMode = true; this.layout(); }
      Input.lastDevice = 'touch';
      // latch quick taps on the action buttons so a tap shorter than a frame still counts
      const vx = p.x / this.z, vy = p.y / this.z;
      if (Phaser.Math.Distance.Between(vx, vy, this.btnJump.x, this.btnJump.y) < this.btnJump.r + 30) Input.latch('jump');
      else if (Phaser.Math.Distance.Between(vx, vy, this.btnWinnie.x, this.btnWinnie.y) < this.btnWinnie.r + 20) Input.latch('winnie');
    });
    this.layout();
  }

  // ---- layout in virtual units: height is always 720 ----
  layout() {
    const z = this.scale.height / VIEW_H;
    this.z = z;
    this.cam.setZoom(z);
    this.vw = this.scale.width / z; this.vh = VIEW_H;
    // iPad safe areas (home indicator etc). #safe is a fixed div inset by env(safe-area-inset-*).
    const el = document.getElementById('safe');
    const dpr = this.game.registry.get('dpr') || 1;
    let L = 0, R = 0, T = 0, B = 0;
    if (el) {
      const r = el.getBoundingClientRect();
      L = r.left; T = r.top; R = window.innerWidth - r.right; B = window.innerHeight - r.bottom;
    }
    const k = dpr / z;
    this.safe = { l: L * k + 14, r: R * k + 14, t: T * k + 10, b: B * k + 10 };
    const s = this.safe, vw = this.vw, vh = this.vh;
    // controls
    const by = vh - s.b - 92;
    this.btnL.setPosition(s.l + 84, by);
    this.btnR.setPosition(s.l + 84 + 170, by);
    this.btnJump.setPosition(vw - s.r - 100, by - 6);
    this.btnWinnie.setPosition(vw - s.r - 100 - 170, by + 22);
    this.btnPause.setPosition(vw - s.r - 40, s.t + 40);
    this.btnHint.setPosition(vw - s.r - 122, s.t + 40);
    // hud
    this.hudGlim.setPosition(s.l + 20, s.t + 40);
    this.hudShards.setPosition(s.l + 200, s.t + 40);
    this.hudTimer.setPosition(vw / 2, s.t + 40);
    this.controls.setVisible(this.touchMode);
    this.btnPause.setVisible(true);
  }

  circleButton(radius, color, iconDraw) {
    const c = this.add.container(0, 0);
    const g = this.add.graphics();
    const draw = (down) => {
      g.clear();
      g.fillStyle(INK, 0.5); g.fillCircle(0, 6, radius);
      g.fillStyle(color, down ? 0.95 : 0.72); g.fillCircle(0, down ? 4 : 0, radius);
      g.fillStyle(0xffffff, down ? 0.1 : 0.22); g.fillEllipse(-radius * 0.25, -radius * 0.42 + (down ? 4 : 0), radius * 1.1, radius * 0.55);
      g.lineStyle(5, INK, 0.9); g.strokeCircle(0, down ? 4 : 0, radius);
      g.lineStyle(3, 0xffffff, 0.6); g.strokeCircle(0, down ? 4 : 0, radius - 6);
    };
    draw(false);
    c.add(g);
    const icon = this.add.container(0, 0); c.add(icon);
    if (iconDraw) iconDraw(icon);
    c.r = radius; c.draw = draw; c.icon = icon; c.down = false;
    return c;
  }

  buildControls() {
    const arrow = (dir) => (icon) => {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1); g.lineStyle(5, INK, 1);
      const pts = [new Phaser.Math.Vector2(dir * 26, 0), new Phaser.Math.Vector2(-dir * 16, -28), new Phaser.Math.Vector2(-dir * 16, 28)];
      g.fillPoints(pts, true); g.strokePoints(pts, true, true);
      icon.add(g);
    };
    this.btnL = this.circleButton(70, 0xff7b54, arrow(-1));
    this.btnR = this.circleButton(70, 0xff7b54, arrow(1));
    this.btnJump = this.circleButton(84, 0x5ec26a, (icon) => {
      const g = this.add.graphics(); g.lineStyle(12, 0xffffff, 1);
      g.beginPath(); g.moveTo(-26, 14); g.lineTo(0, -16); g.lineTo(26, 14); g.strokePath();
      icon.add(g); icon.add(makeText(this, 0, 38, 'JUMP', 18, { strokeW: 5 }));
    });
    this.btnWinnie = this.circleButton(62, 0xb58aff, null);
    this.winnieIcon = this.add.image(-4, -8, 'winnie', 0).setScale(0.62);
    this.winnieAbility = this.add.image(26, 26, 'sign-eye').setScale(0.3);
    this.winnieLabel = makeText(this, 0, 40, '', 15, { strokeW: 4 });
    this.btnWinnie.icon.add([this.winnieIcon, this.winnieAbility, this.winnieLabel]);
    this.controls.add([this.btnL, this.btnR, this.btnJump, this.btnWinnie]);

    this.btnPause = this.circleButton(32, 0x8f7fe0, (icon) => {
      const g = this.add.graphics(); g.fillStyle(0xffffff, 1); g.fillRoundedRect(-11, -13, 8, 26, 3); g.fillRoundedRect(3, -13, 8, 26, 3); icon.add(g);
    });
    this.btnPause.setSize(80, 80).setInteractive();
    this.btnPause.on('pointerdown', () => this.openPause());
    this.btnHint = this.circleButton(32, 0xffd75e, (icon) => {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1); g.fillCircle(0, -4, 12); g.fillStyle(0xc9ced8, 1); g.fillRect(-6, 8, 12, 8);
      g.lineStyle(3, INK, 1); g.strokeCircle(0, -4, 12); g.strokeRect(-6, 8, 12, 8);
      icon.add(g);
    });
    this.btnHint.setSize(80, 80).setInteractive().setVisible(false);
    this.btnHint.on('pointerdown', () => this.useHint());
  }

  buildHud() {
    this.hudGlim = this.add.container(0, 0);
    const gi = this.add.image(18, 0, 'glimmer', 0).setScale(0.62);
    this.glimText = makeText(this, 44, 0, '0', 30, { ox: 0 });
    this.hudGlim.add([gi, this.glimText]);
    this.hudShards = this.add.container(0, 0);
    this.shardIcons = [0, 1, 2].map(i => this.add.image(i * 40, 0, 'shard-ghost').setScale(0.3));
    this.hudShards.add(this.shardIcons);
    this.hudTimer = makeText(this, 0, 0, '', 28);
    this.hud.add([this.hudGlim, this.hudShards, this.hudTimer]);
  }

  // ---- per frame ----
  update(time, deltaMs) {
    const dt = deltaMs / 1000;
    const lvl = this.scene.get('Level');
    const inLevel = lvl && lvl.scene.isActive() && lvl.ready;
    const modal = this.scene.isActive('Pause') || this.scene.isActive('Parent') || this.scene.isActive('Complete') || this.scene.isActive('Learn') ||
      this.scene.isActive('Closet') || this.scene.isActive('Museum') || this.scene.isActive('Trophy') || this.scene.isActive('Telescope');
    const showPlay = inLevel && !modal;
    this.hud.setVisible(inLevel);
    this.controls.setVisible(this.touchMode && showPlay);
    this.btnPause.setVisible(inLevel && !modal);
    this.btnHint.setVisible(this.hintOn && showPlay && !lvl.isHub);
    this.readTouch(showPlay);
    if (inLevel) this.updateHud(lvl);
    if (showPlay && Input.pressed('pause')) this.openPause();
    this.updateCorner(dt);
  }

  readTouch(enabled) {
    const t = Input.touch;
    t.left = t.right = t.jump = t.winnie = false;
    const btns = [this.btnL, this.btnR, this.btnJump, this.btnWinnie];
    const downNow = [false, false, false, false];
    if (enabled && this.touchMode) {
      const z = this.z;
      for (const p of this.input.manager.pointers) {
        if (!p.isDown) continue;
        const vx = p.x / z, vy = p.y / z;
        if (vx < this.vw * 0.45 && vy > this.vh * 0.3) {
          // left side: whichever arrow is closer (lets fingers slide between them)
          const mid = (this.btnL.x + this.btnR.x) / 2;
          if (vx < mid) { t.left = true; downNow[0] = true; } else { t.right = true; downNow[1] = true; }
        } else if (vx > this.vw * 0.55 && vy > this.vh * 0.3) {
          const dj = Phaser.Math.Distance.Between(vx, vy, this.btnJump.x, this.btnJump.y);
          const dw = Phaser.Math.Distance.Between(vx, vy, this.btnWinnie.x, this.btnWinnie.y);
          if (dw < this.btnWinnie.r + 26 && dw < dj) { t.winnie = true; downNow[3] = true; }
          else if (dj < this.btnJump.r + 70) { t.jump = true; downNow[2] = true; }
        }
      }
    }
    btns.forEach((b, i) => { if (b.down !== downNow[i]) { b.down = downNow[i]; b.draw(b.down); b.icon.y = b.down ? 4 : 0; } });
  }

  updateHud(lvl) {
    this.glimText.setText(lvl.isHub ? String(Save.totalShards()) : `${lvl.glimmers}/${lvl.totalGlimmers}`);
    this.hudGlim.list[0].setTexture(lvl.isHub ? 'shard' : 'glimmer', 0).setScale(lvl.isHub ? 0.42 : 0.62);
    this.hudShards.setVisible(!lvl.isHub);
    if (!lvl.isHub) {
      const s = Save.shards(lvl.levelId);
      this.shardIcons.forEach((ic, i) => ic.setTexture(s[i] || lvl.runShards[i] ? 'shard' : 'shard-ghost'));
      const ch = lvl.def.challenge || {};
      if (ch.type === 'time') {
        const left = ch.seconds - lvl.levelTime;
        const m = Math.floor(Math.abs(left) / 60), sec = Math.floor(Math.abs(left) % 60);
        this.hudTimer.setText(`${left < 0 ? '+' : ''}${m}:${String(sec).padStart(2, '0')}`).setColor(left < 0 ? '#ffb3b3' : '#fff8e1').setVisible(true);
      } else this.hudTimer.setVisible(false);
    } else this.hudTimer.setVisible(false);
    // Winnie button icon shows what she will do
    const a = lvl.winnieAction;
    const kind = a ? a.kind : null;
    if (kind !== this.lastKind) {
      this.lastKind = kind;
      const map = { eyes: ['sign-eye', 'LOOK'], pounce: ['sign-paw', 'POUNCE'], squeeze: ['sign-squeeze', 'SQUEEZE'], meow: ['sign-pulse', 'MEOW'], go: ['sign-up', 'GO!'] };
      const m = map[kind];
      this.winnieAbility.setVisible(!!m); this.winnieLabel.setText(m ? m[1] : '');
      if (m) this.winnieAbility.setTexture(m[0]);
      this.btnWinnie.setAlpha(kind ? 1 : 0.5);
      if (kind === 'pounce' || kind === 'go' || kind === 'squeeze') this.tweens.add({ targets: this.btnWinnie, scale: 1.15, duration: 120, yoyo: true });
    }
  }

  // ---- hints ----
  showHint(on) {
    if (on && !this.hintOn) { this.tweens.add({ targets: this.btnHint, scale: { from: 0, to: 1 }, duration: 400, ease: 'Back.easeOut' }); Audio.sfx('chime', { m: 91 }); }
    this.hintOn = on;
  }
  useHint() {
    const lvl = this.scene.get('Level'); if (!lvl || !lvl.ready) return;
    const h = lvl.nextHint(); if (!h) return;
    Audio.sfx('chime', { m: 88 });
    this.toast({ title: `Hint ${h.level}/${h.max}`, text: h.text, icon: 'bulb', ms: 5200, force: true });
  }

  // ---- toasts ----
  toast(t) {
    if (t.force) { this.toastQ = [t]; if (this.toastObj) { this.toastObj.destroy(); this.toastObj = null; this.toastOn = false; } }
    else this.toastQ.push(t);
    if (!this.toastOn) this.nextToast();
  }
  nextToast() {
    const t = this.toastQ.shift(); if (!t) { this.toastOn = false; return; }
    this.toastOn = true;
    const w = Math.min(640, this.vw - 260);
    const c = this.add.container(this.vw / 2, -120).setDepth(90);
    const body = makeText(this, 0, 48, t.text, 22, { wrap: w - 100, color: '#2a1f3d', stroke: false, shadow: false, oy: 0 });
    const h = body.height + 70;
    const g = this.add.graphics();
    g.fillStyle(INK, 0.6); g.fillRoundedRect(-w / 2, 6, w, h, 26);
    g.fillStyle(0xfff8e1, 1); g.fillRoundedRect(-w / 2, 0, w, h, 26);
    g.lineStyle(4, INK, 1); g.strokeRoundedRect(-w / 2, 0, w, h, 26);
    const title = makeText(this, 0, 28, t.title || '', 26, { strokeW: 6 });
    c.add([g, title, body]);
    if (t.icon && t.icon !== 'bulb') c.add(this.add.image(-w / 2 + 40, h / 2, t.icon === 'shard' ? 'shard' : `sign-${t.icon}`).setScale(t.icon === 'shard' ? 0.5 : 0.42));
    this.toastObj = c;
    const top = (this.safe ? this.safe.t : 10) + 74;
    this.tweens.add({ targets: c, y: top, duration: 320, ease: 'Back.easeOut' });
    this.time.delayedCall(t.ms || 2500, () => {
      if (this.toastObj !== c) return;
      this.tweens.add({ targets: c, y: -h - 40, duration: 260, ease: 'Quad.easeIn', onComplete: () => { c.destroy(); if (this.toastObj === c) this.toastObj = null; this.nextToast(); } });
    });
  }

  // ---- pause ----
  openPause() {
    const lvl = this.scene.get('Level');
    if (!lvl || !lvl.ready || lvl.finished || lvl.busyModal || this.scene.isActive('Pause')) return;
    Audio.sfx('tap');
    this.scene.pause('Level');
    this.scene.launch('Pause');
  }

  // ---- parent corner: hold the top-left corner for 3 seconds ----
  updateCorner(dt) {
    const z = this.z; let held = false;
    for (const p of this.input.manager.pointers) if (p.isDown && p.x / z < 110 && p.y / z < 110) held = true;
    if (Input.kb.pause && Input.kb.down) held = true; // keyboard shortcut for testing: Esc + Down
    if (this.scene.isActive('Parent')) held = false;
    this.cornerHold = held ? this.cornerHold + dt : 0;
    const g = this.cornerRing; g.clear();
    if (this.cornerHold > 0.4) {
      const k = Math.min(1, (this.cornerHold - 0.4) / 2.6);
      g.lineStyle(8, 0xffe680, 0.9); g.beginPath(); g.arc(60, 60, 34, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); g.strokePath();
      if (k >= 1) {
        this.cornerHold = 0;
        const lvl = this.scene.get('Level');
        if (lvl && lvl.scene.isActive() && !lvl.scene.isPaused()) this.scene.pause('Level');
        this.scene.launch('Parent');
      }
    }
  }
}
