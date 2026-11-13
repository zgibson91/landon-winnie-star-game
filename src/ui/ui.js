// UI helpers: crisp text, chunky buttons, panels, and keyboard/gamepad focus navigation.
import { FONT } from '../core/constants.js';
import { Input } from '../core/input.js';
import { Audio } from '../audio/audio.js';

export function textRes(scene) {
  const z = scene.cameras.main.zoom || 1;
  return Math.min(4, Math.max(1, z * 1.05));
}

export function makeText(scene, x, y, str, size = 28, opts = {}) {
  const style = {
    fontFamily: FONT, fontSize: `${size}px`, fontStyle: opts.weight || '900', color: opts.color || '#fff8e1',
    align: opts.align || 'center', stroke: opts.stroke === false ? undefined : (opts.stroke || '#2a1f3d'),
    strokeThickness: opts.stroke === false ? 0 : (opts.strokeW ?? Math.max(4, size * 0.2)),
    wordWrap: opts.wrap ? { width: opts.wrap, useAdvancedWrap: true } : undefined,
    lineSpacing: opts.lineSpacing ?? 2,
    padding: { x: 4, y: 4 },
  };
  if (opts.bubble) {
    style.backgroundColor = undefined;
  }
  const t = scene.add.text(x, y, str, style).setOrigin(opts.ox ?? 0.5, opts.oy ?? 0.5);
  t.setResolution(textRes(scene));
  if (opts.shadow !== false && !opts.bubble) t.setShadow(0, Math.max(2, size * 0.08), 'rgba(20,10,40,0.45)', 0, true, true);
  if (opts.bubble) {
    const pad = 12;
    const bg = scene.add.graphics();
    const draw = () => {
      bg.clear(); bg.fillStyle(0xfff8e1, 0.96); bg.lineStyle(3, 0x2a1f3d, 1);
      const w = t.width + pad * 2, h = t.height + pad;
      bg.fillRoundedRect(t.x - w / 2, t.y - h / 2, w, h, 16); bg.strokeRoundedRect(t.x - w / 2, t.y - h / 2, w, h, 16);
    };
    t.setColor('#2a1f3d').setStroke('#2a1f3d', 0).setShadow(0, 0, 'rgba(0,0,0,0)', 0);
    draw();
    bg.setDepth(t.depth - 0.1);
    const origSetDepth = t.setDepth.bind(t);
    t.setDepth = (d) => { origSetDepth(d); bg.setDepth(d - 0.1); return t; };
    t.once('destroy', () => bg.destroy());
    t.bubbleBg = bg;
  }
  return t;
}

// Rounded button with an optional icon key and label. Returns a Container with .press().
export function makeButton(scene, x, y, w, h, label, onPress, opts = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const color = opts.color ?? 0x8f7fe0, dark = opts.dark ?? 0x2a1f3d;
  const draw = (focused, down) => {
    g.clear();
    g.fillStyle(dark, 1); g.fillRoundedRect(-w / 2, -h / 2 + 6, w, h, Math.min(24, h / 2));
    g.fillStyle(color, 1); g.fillRoundedRect(-w / 2, -h / 2 + (down ? 5 : 0), w, h, Math.min(24, h / 2));
    g.fillStyle(0xffffff, 0.25); g.fillRoundedRect(-w / 2 + 8, -h / 2 + 6 + (down ? 5 : 0), w - 16, h * 0.3, Math.min(14, h / 4));
    g.lineStyle(focused ? 6 : 4, focused ? 0xffe680 : dark, 1); g.strokeRoundedRect(-w / 2, -h / 2 + (down ? 5 : 0), w, h, Math.min(24, h / 2));
  };
  draw(false, false);
  c.add(g);
  let icon = null;
  if (opts.icon) { icon = scene.add.image(label ? -w / 2 + h * 0.6 : 0, 0, opts.icon).setScale(opts.iconScale || 0.5); c.add(icon); }
  const t = label ? makeText(scene, icon ? h * 0.3 : 0, 0, label, opts.size || Math.min(34, h * 0.42), { strokeW: 5 }) : null;
  if (t) c.add(t);
  c.setSize(w, h + 6);
  c.setInteractive({ useHandCursor: true });
  c.focused = false; c.enabled = true; c.label = t; c.icon = icon;
  c.setFocus = (f) => { c.focused = f; draw(f, false); };
  c.press = () => {
    if (!c.enabled) return;
    Audio.sfx(opts.sound || 'tap');
    draw(c.focused, true);
    scene.tweens.add({ targets: c, scale: 0.94, duration: 60, yoyo: true, onComplete: () => { draw(c.focused, false); onPress && onPress(); } });
  };
  c.on('pointerdown', (p, lx, ly, ev) => { ev && ev.stopPropagation && ev.stopPropagation(); c.press(); });
  c.redraw = draw;
  return c;
}

// Keyboard / gamepad navigation over a list of buttons (by screen position).
export class FocusNav {
  constructor(scene, buttons, opts = {}) {
    this.scene = scene; this.buttons = buttons.filter(Boolean); this.i = -1; this.onBack = opts.onBack; this.repeat = 0;
    this.active = true; this.start = opts.start || 0;
    if (opts.autoFocus !== false && Input.lastDevice !== 'touch') this.focus(opts.start || 0);
  }
  focus(i) {
    if (this.i >= 0 && this.buttons[this.i]) this.buttons[this.i].setFocus(false);
    this.i = i; if (this.buttons[i]) this.buttons[i].setFocus(true);
  }
  move(dx, dy) {
    if (this.i < 0) { this.focus(0); return; }
    const cur = this.buttons[this.i]; const cp = cur.getWorldTransformMatrix();
    let best = -1, bestD = Infinity;
    this.buttons.forEach((b, j) => {
      if (j === this.i || !b.visible || !b.enabled) return;
      const m = b.getWorldTransformMatrix();
      const vx = m.tx - cp.tx, vy = m.ty - cp.ty;
      const along = vx * dx + vy * dy; if (along <= 4) return;
      const perp = Math.abs(vx * dy - vy * dx);
      const d = along + perp * 2.5;
      if (d < bestD) { bestD = d; best = j; }
    });
    if (best >= 0) { this.focus(best); Audio.sfx('tap'); }
  }
  update() {
    if (!this.active) return;
    if (Input.pressed('left')) this.move(-1, 0);
    if (Input.pressed('right')) this.move(1, 0);
    if (Input.pressed('up')) this.move(0, -1);
    if (Input.pressed('down')) this.move(0, 1);
    if (Input.pressed('confirm') || Input.pressed('jump')) { if (this.i < 0) this.focus(this.start || 0); this.buttons[this.i].press(); }
    if ((Input.pressed('pause') || Input.pressed('winnie')) && this.onBack) this.onBack();
  }
}

// Darkened backdrop + rounded panel; returns {panel container, w, h}.
export function makePanel(scene, cx, cy, w, h, opts = {}) {
  const shade = scene.add.rectangle(cx, cy, 5000, 5000, 0x120b2e, opts.shade ?? 0.6).setInteractive();
  const g = scene.add.graphics();
  g.fillStyle(0x2a1f3d, 1); g.fillRoundedRect(cx - w / 2, cy - h / 2 + 10, w, h, 36);
  g.fillStyle(opts.color ?? 0x3b2b8a, 1); g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 36);
  g.fillStyle(0xffffff, 0.06); g.fillRoundedRect(cx - w / 2 + 14, cy - h / 2 + 14, w - 28, 60, 24);
  g.lineStyle(6, 0x2a1f3d, 1); g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 36);
  g.lineStyle(3, 0x8f7fe0, 1); g.strokeRoundedRect(cx - w / 2 + 8, cy - h / 2 + 8, w - 16, h - 16, 30);
  return { shade, g };
}

export function starsText(n, max = 5) { return '★'.repeat(n) + '☆'.repeat(max - n); }
