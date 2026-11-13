// Overlay menus: pause, parent menu, level complete, ability lessons, closet, museum, trophies, telescope.
import { VIEW_H, ART } from '../core/constants.js';
import { Input } from '../core/input.js';
import { Save } from '../core/save.js';
import { Audio } from '../audio/audio.js';
import { makeText, makeButton, makePanel, FocusNav } from '../ui/ui.js';
import { STARS, STAR_BY_ID, FINAL_SHARDS } from '../data/stars.js';
import { landonFrameIndex } from '../art/landon.js';

class Menu extends Phaser.Scene {
  setup() {
    const cam = this.cameras.main; cam.setOrigin(0, 0);
    this.z = this.scale.height / VIEW_H; cam.setZoom(this.z);
    this.vw = this.scale.width / this.z; this.vh = VIEW_H; this.cx = this.vw / 2; this.cy = this.vh / 2;
    this.scene.bringToTop();
    this.nav = null;
  }
  update() { if (this.nav) this.nav.update(); }
  closeMenu(fn) { Audio.sfx('back'); this.scene.stop(); fn && fn(); }
}

// ---------------------------------------------------------------- Pause
export class PauseScene extends Menu {
  constructor() { super('Pause'); }
  create() {
    this.setup();
    const lvl = this.scene.get('Level');
    makePanel(this, this.cx, this.cy, 520, 520);
    makeText(this, this.cx, this.cy - 210, 'Paused', 48);
    const resume = () => this.closeMenu(() => this.scene.resume('Level'));
    const b = [];
    b.push(makeButton(this, this.cx, this.cy - 120, 380, 78, 'Keep playing', resume, { color: 0x5ec26a }));
    if (!lvl.isHub) {
      b.push(makeButton(this, this.cx, this.cy - 30, 380, 78, 'Back to lantern', () => this.closeMenu(() => { this.scene.resume('Level'); lvl.fail('restart'); })));
      b.push(makeButton(this, this.cx, this.cy + 60, 380, 78, 'Star Station', () => this.closeMenu(() => this.game.events.emit('goto-hub', lvl.levelId)), { color: 0xe8862a }));
    }
    const sY = this.cy + 160;
    const snd = makeButton(this, this.cx - 98, sY, 180, 70, Save.settings.sound ? 'Sound ON' : 'Sound OFF', () => {
      Save.setSetting('sound', !Save.settings.sound); Audio.setSound(Save.settings.sound); snd.label.setText(Save.settings.sound ? 'Sound ON' : 'Sound OFF');
    }, { size: 24, color: 0x6f9fd6 });
    const mus = makeButton(this, this.cx + 98, sY, 180, 70, Save.settings.music ? 'Music ON' : 'Music OFF', () => {
      Save.setSetting('music', !Save.settings.music); Audio.setMusic(Save.settings.music); mus.label.setText(Save.settings.music ? 'Music ON' : 'Music OFF');
    }, { size: 24, color: 0x6f9fd6 });
    b.push(snd, mus);
    this.nav = new FocusNav(this, b, { onBack: resume });
  }
  update() { super.update(); }
}

// ---------------------------------------------------------------- Parent menu
export class ParentScene extends Menu {
  constructor() { super('Parent'); }
  create() {
    this.setup();
    makePanel(this, this.cx, this.cy, 760, 640, { color: 0x24305e, shade: 0.8 });
    makeText(this, this.cx, this.cy - 280, 'Parent Menu', 40);
    makeText(this, this.cx, this.cy - 238, Save.storageOk ? 'Progress saves on this iPad automatically.' : 'Storage is blocked here, so progress lasts until the app closes.', 18, { color: '#c9d6ff', stroke: false });
    const S = Save.settings;
    const rows = [
      ['assist', 'Assist mode', 'Slower hazards, wider platforms, extra lanterns'],
      ['invincible', 'Invincible', 'Hazards can\'t hurt (pits still reset)'],
      ['sound', 'Sound', 'All sound effects and music'],
      ['music', 'Music', 'Background songs only'],
      ['unlockAll', 'Unlock all levels', 'Opens the Quasi-Star without 20 shards (testing)'],
    ];
    const btns = [];
    rows.forEach(([k, label, desc], i) => {
      const y = this.cy - 180 + i * 78;
      makeText(this, this.cx - 330, y - 12, label, 26, { ox: 0 });
      makeText(this, this.cx - 330, y + 16, desc, 16, { ox: 0, color: '#c9d6ff', stroke: false });
      const b = makeButton(this, this.cx + 270, y, 150, 60, S[k] ? 'ON' : 'OFF', () => {
        Save.setSetting(k, !Save.settings[k]); b.label.setText(Save.settings[k] ? 'ON' : 'OFF');
        b.redraw(b.focused, false);
        if (k === 'sound') Audio.setSound(Save.settings.sound);
        if (k === 'music') Audio.setMusic(Save.settings.music);
        this.changed = true;
      }, { color: S[k] ? 0x5ec26a : 0x8a8fa8, size: 26 });
      btns.push(b);
    });
    let confirm = 0;
    const reset = makeButton(this, this.cx - 150, this.cy + 250, 260, 70, 'Reset progress', () => {
      confirm++;
      if (confirm === 1) { reset.label.setText('Tap again!'); return; }
      Save.reset(); Audio.setSound(true); Audio.setMusic(true);
      reset.label.setText('Reset done'); this.changed = 'reset';
    }, { color: 0xd2364a, size: 24 });
    const close = makeButton(this, this.cx + 150, this.cy + 250, 260, 70, 'Close', () => this.done(), { color: 0x5ec26a });
    btns.push(reset, close);
    this.nav = new FocusNav(this, btns, { onBack: () => this.done(), start: btns.length - 1 });
  }
  done() {
    this.closeMenu(() => {
      const lvl = this.scene.get('Level');
      if (this.changed && lvl && lvl.scene.isActive()) {
        // settings like assist mode take effect by reloading the current place
        this.game.events.emit(lvl.isHub || this.changed === 'reset' ? 'goto-hub' : 'goto-level', lvl.isHub ? null : lvl.levelId);
      } else if (lvl && lvl.scene.isPaused() && !this.scene.isActive('Pause')) this.scene.resume('Level');
    });
  }
}

// ---------------------------------------------------------------- Ability lesson
const ABILITIES = {
  nightEyes: { name: 'Night Eyes', icon: 'sign-eye', pose: 'sit', text: 'Tap the Winnie button. Her glowing eyes show secret platforms and treasure close by!' },
  pounce: { name: 'Pounce', icon: 'sign-paw', pose: 'pounce', text: 'When a bell or switch is close, tap the Winnie button. She leaps over and bats it!' },
  squeeze: { name: 'Squeeze', icon: 'sign-paw', pose: 'stretch', text: 'Winnie can wiggle through tiny holes and open doors from the other side!' },
  meow: { name: 'Meow', icon: 'sign-pulse', pose: 'meow', text: 'Winnie\'s big meow wakes up sleepy crystals and scares small baddies away!' },
};
export class LearnScene extends Menu {
  constructor() { super('Learn'); }
  create(data) {
    this.setup();
    const a = ABILITIES[data.ability];
    makePanel(this, this.cx, this.cy, 640, 500, { color: 0x3b2b8a });
    makeText(this, this.cx, this.cy - 190, data.fresh === false ? 'Winnie remembers…' : 'Winnie learned…', 26, { color: '#c9bfff' });
    makeText(this, this.cx, this.cy - 145, a.name + '!', 52, { color: '#ffe680' });
    const w = this.add.sprite(this.cx - 120, this.cy + 10, 'winnie').setScale(1.1);
    w.play(`winnie-${a.pose}`);
    this.tweens.add({ targets: w, y: this.cy, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.image(this.cx + 120, this.cy - 10, a.icon).setScale(1.2);
    makeText(this, this.cx, this.cy + 110, a.text, 24, { wrap: 540 });
    const ok = makeButton(this, this.cx, this.cy + 195, 240, 72, 'Got it!', () => this.closeMenu(data.onClose), { color: 0x5ec26a });
    this.time.delayedCall(400, () => { this.nav = new FocusNav(this, [ok], { onBack: () => ok.press() }); });
  }
}

// ---------------------------------------------------------------- Level complete
export class CompleteScene extends Menu {
  constructor() { super('Complete'); }
  create(r) {
    this.setup();
    const star = STAR_BY_ID[r.id];
    makePanel(this, this.cx, this.cy, 760, 600, { color: 0x3b2b8a, shade: 0.45 });
    makeText(this, this.cx, this.cy - 250, `${star.name} complete!`, 44, { color: '#ffe680' });
    const ch = r.challenge;
    const chLabel = ch.type === 'coins' ? `Collect all ${r.total} Glimmers` : ch.type === 'time' ? `Reach the gate in ${Math.floor(ch.seconds / 60)}:${String(ch.seconds % 60).padStart(2, '0')}` : ch.type === 'nohit' ? 'Finish without a single oops' : 'Bonus challenge';
    const labels = ['Finish the level', 'Find the secret shard', chLabel];
    labels.forEach((lab, i) => {
      const x = this.cx + (i - 1) * 230, y = this.cy - 110;
      const had = r.before[i], has = r.after[i];
      const img = this.add.image(x, y, has ? 'shard' : 'shard-ghost').setScale(0);
      this.tweens.add({ targets: img, scale: has ? 0.95 : 0.7, duration: 420, delay: 300 + i * 380, ease: 'Back.easeOut', onStart: () => { if (has && !had) { Audio.sfx('shard'); this.burst(x, y); } } });
      makeText(this, x, y + 70, lab, 19, { wrap: 200 });
      if (has && !had) makeText(this, x, y - 66, 'NEW!', 22, { color: '#7dff9a' }).setAngle(-8);
    });
    const m = Math.floor(r.time / 60), s = Math.floor(r.time % 60);
    makeText(this, this.cx - 160, this.cy + 40, `Time  ${m}:${String(s).padStart(2, '0')}`, 26);
    makeText(this, this.cx + 160, this.cy + 40, `Glimmers  ${r.glimmers}/${r.total}`, 26);
    makeText(this, this.cx, this.cy + 110, star.fact, 21, { wrap: 640, color: '#e6deff' });
    const again = makeButton(this, this.cx - 160, this.cy + 220, 280, 76, 'Play again', () => this.closeMenu(() => this.game.events.emit('goto-level', r.id)), { color: 0x6f9fd6 });
    const hub = makeButton(this, this.cx + 160, this.cy + 220, 280, 76, 'Star Station', () => this.closeMenu(() => this.game.events.emit('goto-hub', r.id)), { color: 0x5ec26a });
    this.time.delayedCall(900, () => { this.nav = new FocusNav(this, [again, hub], { start: 1 }); });
    this.confetti = this.add.particles(0, 0, 'starpt', { x: { min: 0, max: this.vw }, y: -20, lifespan: 3200, speedY: { min: 120, max: 260 }, speedX: { min: -60, max: 60 }, rotate: { min: 0, max: 360 }, scale: { min: 0.8, max: 1.6 }, tint: [0xffe680, 0xff9fb0, 0x9fd8ff, 0x7dff9a, 0xffb347], frequency: 50, quantity: 2 }).setDepth(-1);
    this.time.delayedCall(2500, () => this.confetti.stop());
  }
  burst(x, y) {
    const e = this.add.particles(x, y, 'spark', { speed: { min: 100, max: 300 }, lifespan: 600, scale: { start: 1.4, end: 0 }, blendMode: 'ADD', tint: 0xfff1a8, emitting: false });
    e.explode(24);
  }
}

// ---------------------------------------------------------------- Closet
export class ClosetScene extends Menu {
  constructor() { super('Closet'); }
  create(data) {
    this.setup();
    makePanel(this, this.cx, this.cy, 720, 540, { color: 0x2f7a4a });
    makeText(this, this.cx, this.cy - 220, 'Outfit Closet', 44);
    const outfits = [['jersey', 'Soccer #7'], ['pajamas', 'Dino Pizza PJs']];
    const btns = [];
    outfits.forEach(([o, label], i) => {
      const x = this.cx + (i - 0.5) * 300, y = this.cy - 10;
      const sel = () => { Save.data.outfit = o; Save.save(); refresh(); Audio.sfx('learn'); };
      const b = makeButton(this, x, y + 175, 240, 64, label, sel, { size: 24, color: 0x8f7fe0 });
      const card = this.add.rectangle(x, y, 230, 290, 0xfff8e1).setStrokeStyle(5, 0x2a1f3d).setInteractive();
      card.on('pointerdown', () => b.press());
      const kid = this.add.sprite(x, y + 20, `landon-${o}`, landonFrameIndex('celebrate')).setScale(1.25);
      kid.play(`landon-${o}-idle`);
      btns.push(b); b.card = card; b.outfit = o; b.kid = kid;
    });
    const close = makeButton(this, this.cx, this.cy + 260, 220, 60, 'Done', () => this.closeMenu(data.onClose), { color: 0x5ec26a, size: 26 });
    const refresh = () => btns.forEach(b => {
      const on = Save.data.outfit === b.outfit;
      b.card.setStrokeStyle(on ? 9 : 5, on ? 0xffd75e : 0x2a1f3d);
      b.kid.play(`landon-${b.outfit}-${on ? 'celebrate' : 'idle'}`);
    });
    refresh();
    btns.push(close);
    this.nav = new FocusNav(this, btns, { onBack: () => close.press(), start: Save.data.outfit === 'pajamas' ? 1 : 0 });
  }
}

// ---------------------------------------------------------------- Star Museum
// If the Sun were a pea, how big would each star be?
const COMPARE = {
  sun: 'If the Sun were a tiny pea…',
  arcturus: 'Arcturus would be a soccer ball!',
  betelgeuse: 'Betelgeuse would be as tall as a two-story house!',
  mucephei: 'Mu Cephei would be as long as a school bus!',
  vvcephei: 'VV Cephei A would be about a school bus too!',
  vycma: 'VY Canis Majoris would be as long as a humpback whale!',
  uyscuti: 'UY Scuti would be somewhere between a bus and a whale!',
  stephenson: 'Stephenson 2-18 would be almost as long as a blue whale!',
  wohg64: 'WOH G64 would be about a humpback whale!',
  quasistar: 'A quasi-star might be as big as a whole football field!',
};
export class MuseumScene extends Menu {
  constructor() { super('Museum'); }
  create(data) {
    this.setup();
    makePanel(this, this.cx, this.cy, Math.min(1100, this.vw - 40), 640, { color: 0x24305e });
    makeText(this, this.cx, this.cy - 280, 'Star Museum', 42);
    const left = this.cx - Math.min(1100, this.vw - 40) / 2 + 30;
    const btns = STARS.map((s, i) => makeButton(this, left + 130 + (i % 2) * 0, this.cy - 220 + i * 50, 240, 44, s.short, () => this.pick(s), { size: 19, color: Phaser.Display.Color.HexStringToColor(s.color).color }));
    // two columns if needed
    btns.forEach((b, i) => b.setPosition(left + 130, this.cy - 222 + i * 50));
    this.view = this.add.container(0, 0);
    this.areaX = left + 270; this.areaW = this.cx + Math.min(1100, this.vw - 40) / 2 - 30 - this.areaX;
    const close = makeButton(this, this.cx + Math.min(1100, this.vw - 40) / 2 - 110, this.cy - 280, 160, 56, 'Done', () => this.closeMenu(data.onClose), { size: 24, color: 0x5ec26a });
    this.nav = new FocusNav(this, [...btns, close], { onBack: () => close.press() });
    this.pick(STARS[2]);
  }
  pick(s) {
    this.view.removeAll(true);
    const cx = this.areaX + this.areaW / 2, cy = this.cy - 20;
    const maxR = 190;
    // star circle: sizes compared to the Sun; the Sun is shown as a dot (scaled to stay visible)
    const r = s.id === 'sun' ? 120 : maxR;
    const col = Phaser.Display.Color.HexStringToColor(s.color).color;
    const glow = this.add.image(cx, cy, 'softglow').setScale(r / 18).setTint(col).setAlpha(0.5);
    const disc = this.add.circle(cx, cy, r, col).setStrokeStyle(6, 0x2a1f3d);
    const shine = this.add.ellipse(cx - r * 0.35, cy - r * 0.4, r * 0.6, r * 0.3, 0xffffff, 0.35);
    this.view.add([glow, disc, shine]);
    if (s.id !== 'sun') {
      const sunR = Math.max(1.5, r / s.size);
      const sx = cx + r + 40, sy = cy + r - 20;
      const dot = this.add.circle(sx, sy, Math.max(2.5, sunR), 0xffcf4a).setStrokeStyle(1.5, 0x2a1f3d);
      const arrow = makeText(this, sx + 4, sy - 34, '← the Sun', 18, { ox: 0 });
      arrow.setPosition(sx - 10, sy + 28);
      this.view.add([dot, arrow]);
      if (sunR < 2.5) this.view.add(makeText(this, sx, sy + 56, '(even smaller, really!)', 14, { color: '#c9d6ff', stroke: false }));
    }
    const name = makeText(this, cx, cy - r - 30, s.name, 32);
    const size = makeText(this, cx, cy, s.sizeText, 24);
    const cmp = makeText(this, cx, this.cy + 210, COMPARE[s.id], 24, { wrap: this.areaW - 20, color: '#ffe680' });
    const fact = makeText(this, cx, this.cy + 262, s.museum, 19, { wrap: this.areaW - 20, color: '#e6deff', stroke: false });
    this.view.add([name, size, cmp, fact]);
    disc.setScale(0.6); this.tweens.add({ targets: [disc, glow], scale: { from: 0.6 * disc.scale, to: disc.scale }, duration: 300, ease: 'Back.easeOut' });
    disc.setScale(1);
  }
}

// ---------------------------------------------------------------- Trophy wall
export class TrophyScene extends Menu {
  constructor() { super('Trophy'); }
  create(data) {
    this.setup();
    const W = Math.min(1100, this.vw - 40);
    makePanel(this, this.cx, this.cy, W, 640, { color: 0x6a3b1f });
    makeText(this, this.cx, this.cy - 280, `Trophy Wall   ★ ${Save.totalShards()} / 30`, 40, { color: '#ffe680' });
    STARS.forEach((s, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      const x = this.cx + (col - 2) * (W - 80) / 5, y = this.cy - 150 + row * 210;
      const done = Save.data.done[s.id];
      this.add.circle(x, y, 44, Phaser.Display.Color.HexStringToColor(s.color).color, done ? 1 : 0.35).setStrokeStyle(5, 0x2a1f3d);
      if (done) makeText(this, x + 34, y - 34, '✓', 30, { color: '#7dff9a' });
      makeText(this, x, y + 64, s.short, 17, { wrap: 180 });
      const sh = Save.shards(s.id);
      sh.forEach((h, k) => this.add.image(x + (k - 1) * 34, y + 104, h ? 'shard' : 'shard-ghost').setScale(0.36));
      const best = Save.data.best[s.id];
      if (best) makeText(this, x, y - 62, `${Math.floor(best / 60000)}:${String(Math.floor(best / 1000) % 60).padStart(2, '0')}`, 15, { color: '#ffe0b0' });
    });
    const secrets = Object.keys(Save.data.secrets).length;
    makeText(this, this.cx - W / 2 + 40, this.cy + 280, `Secrets found: ${secrets} / 2`, 22, { ox: 0 });
    const close = makeButton(this, this.cx + W / 2 - 110, this.cy + 270, 160, 56, 'Done', () => this.closeMenu(data.onClose), { size: 24, color: 0x5ec26a });
    this.nav = new FocusNav(this, [close], { onBack: () => close.press() });
  }
}

// ---------------------------------------------------------------- Telescope secret
export class TelescopeScene extends Menu {
  constructor() { super('Telescope'); }
  create(data) {
    this.setup();
    this.add.rectangle(this.cx, this.cy, 5000, 5000, 0x05030f, 0.96).setInteractive();
    this.add.circle(this.cx, this.cy, 300, 0x0d0a2a).setStrokeStyle(20, 0x2a1f3d);
    for (let i = 0; i < 120; i++) { const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * 280; this.add.circle(this.cx + Math.cos(a) * d, this.cy + Math.sin(a) * d, Math.random() * 1.8 + 0.5, 0xffffff, 0.3 + Math.random() * 0.5); }
    // the "Winnie" constellation: a sitting cat
    const pts = [[-90, 120], [-100, 30], [-70, -40], [-60, -110], [-30, -70], [10, -70], [30, -110], [40, -40], [60, 30], [70, 120], [140, 100], [170, 40]];
    const g = this.add.graphics(); g.lineStyle(3, 0x9fd8ff, 0.7);
    g.beginPath(); pts.slice(0, 10).forEach(([x, y], i) => i ? g.lineTo(this.cx + x, this.cy + y) : g.moveTo(this.cx + x, this.cy + y)); g.strokePath();
    g.beginPath(); g.moveTo(this.cx + 70, this.cy + 120); g.lineTo(this.cx + 140, this.cy + 100); g.lineTo(this.cx + 170, this.cy + 40); g.strokePath();
    g.setAlpha(0); this.tweens.add({ targets: g, alpha: 1, duration: 1600, delay: 600 });
    pts.forEach(([x, y], i) => { const s = this.add.image(this.cx + x, this.cy + y, 'starpt').setScale(1.4).setTint(0xfff8c0); this.tweens.add({ targets: s, scale: 1.9, duration: 700 + i * 60, yoyo: true, repeat: -1 }); });
    makeText(this, this.cx, this.cy + 330, 'The Winnie constellation!', 30, { color: '#9fd8ff' });
    const close = makeButton(this, this.cx, this.vh - 50, 200, 56, 'Done', () => this.closeMenu(data.onClose), { size: 24, color: 0x5ec26a });
    Audio.sfx('reveal');
    this.nav = new FocusNav(this, [close], { onBack: () => close.press() });
  }
}

export const MENU_SCENES = [PauseScene, ParentScene, LearnScene, CompleteScene, ClosetScene, MuseumScene, TrophyScene, TelescopeScene];
