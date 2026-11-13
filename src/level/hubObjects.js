// Star Station objects: star portals, doors to the closet/museum/trophy wall, and secrets.
import { TILE, ART } from '../core/constants.js';
import { Save } from '../core/save.js';
import { Audio } from '../audio/audio.js';
import { STAR_BY_ID, FINAL_SHARDS } from '../data/stars.js';
import { makeText } from '../ui/ui.js';

const inv = 1 / ART;
const hex = (s) => Phaser.Display.Color.HexStringToColor(s).color;

export function levelUnlocked(star) {
  if (star.bonus) return !!(Save.settings.unlockAll || Save.data.done.quasistar);
  if (!star.final) return true;
  return Save.settings.unlockAll || Save.totalShards() >= FINAL_SHARDS;
}

export class HubPortal {
  constructor(scene, o) {
    this.scene = scene; this.star = STAR_BY_ID[o.star];
    this.x = o.x * TILE + TILE / 2; this.y = (o.y + 1) * TILE;
    const s = this.star, col = hex(s.color);
    this.back = scene.add.image(this.x, this.y + 4, 'portal-frame').setOrigin(0.5, 1).setScale(inv).setDepth(8);
    this.swirl = scene.add.image(this.x, this.y - 56, 'portal-swirl').setScale(inv).setDepth(8.5).setTint(hex(s.glow));
    // size comparison: disc radius grows with the log of the star's size
    const r = Math.max(7, 17 + Math.log10(s.size) * 8.5); // the neutron star is a tiny dot
    this.disc = scene.add.image(this.x, this.y - 58, 'stardisc').setScale(r / 64).setTint(col).setDepth(9);
    this.sun = s.id !== 'sun' ? scene.add.circle(this.x + r + 9, this.y - 58 + r - 4, 3, 0xffcf4a).setStrokeStyle(1.5, 0x2a1f3d).setDepth(9) : null;
    this.label = makeText(scene, this.x, this.y + 22, s.short, 18, { strokeW: 5 }).setDepth(9);
    // shard pips
    this.pips = [0, 1, 2].map(i => scene.add.image(this.x + (i - 1) * 22, this.y + 46, 'shard').setScale(inv * 0.36).setDepth(9));
    this.lock = null;
    if (s.final) {
      this.lock = scene.add.image(this.x, this.y - 58, 'lock').setScale(inv * 1.1).setDepth(10);
      this.lockText = makeText(scene, this.x, this.y - 12, '', 18, { strokeW: 5 }).setDepth(10);
    }
    this.soon = null;
    this.card = null; this.near = false; this.t = Math.random() * 5;
    // the bonus portal stays hidden until it's unlocked
    this.hidden = !!s.bonus && !levelUnlocked(s);
    if (this.hidden) [this.back, this.swirl, this.disc, this.label, ...this.pips].forEach(o => o.setVisible(false));
    else if (s.bonus) {
      this.newTag = makeText(scene, this.x, this.y - 128, Save.data.done.neutron ? 'BONUS' : 'NEW!', 18, { strokeW: 5, color: '#7dff9a' }).setDepth(10);
      scene.tweens.add({ targets: this.newTag, y: this.y - 136, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.refresh();
  }
  refresh() {
    const sh = Save.shards(this.star.id);
    this.pips.forEach((p, i) => p.setTexture(sh[i] ? 'shard' : 'shard-ghost').setAlpha(sh[i] ? 1 : 0.6));
    if (this.lock) {
      const open = levelUnlocked(this.star);
      this.lock.setVisible(!open); this.lockText.setVisible(!open).setText(`${Save.totalShards()} / ${FINAL_SHARDS}`);
      this.disc.setAlpha(open ? 1 : 0.35);
    }
    if (!this.star.built && !this.soon && !(this.lock && this.lock.visible)) this.soon = makeText(this.scene, this.x, this.y - 112, 'coming soon', 14, { strokeW: 4, color: '#c9bfff' }).setDepth(10);
  }
  isNear(p) { return !this.hidden && Math.abs(p.x - this.x) < 56 && Math.abs(p.bottom - this.y) < 60; }
  showCard(on) {
    if (on === this.near) return; this.near = on;
    if (on && !this.card) this.buildCard();
    if (this.card) this.scene.tweens.add({ targets: this.card, alpha: on ? 1 : 0, y: on ? this.y - 214 : this.y - 200, duration: 180 });
  }
  buildCard() {
    const s = this.star, sc = this.scene;
    const c = sc.add.container(this.x, this.y - 200).setDepth(70).setAlpha(0);
    const g = sc.add.graphics();
    g.fillStyle(0x2a1f3d, 1); g.fillRoundedRect(-130, -62, 260, 128, 22);
    g.fillStyle(0xfff8e1, 1); g.fillRoundedRect(-126, -66, 252, 124, 20);
    g.fillStyle(hex(s.color), 1); g.fillRoundedRect(-126, -66, 252, 34, { tl: 20, tr: 20, bl: 0, br: 0 });
    c.add(g);
    c.add(makeText(sc, 0, -49, s.name, 20, { strokeW: 5 }));
    c.add(makeText(sc, 0, -14, '★'.repeat(s.diff) + '☆'.repeat(5 - s.diff), 22, { color: '#ffb000', strokeW: 4 }));
    c.add(makeText(sc, 0, 16, s.sizeText, 16, { color: '#2a1f3d', stroke: false, shadow: false }));
    const go = levelUnlocked(s) ? (s.built ? 'Tap here or press GO!' : 'Still being built!') : `Need ${FINAL_SHARDS} Star Shards`;
    c.add(makeText(sc, 0, 40, go, 14, { color: '#6f5ce0', stroke: false, shadow: false }));
    c.setSize(260, 128).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => this.activate());
    this.card = c;
  }
  activate() {
    const s = this.star;
    if (!levelUnlocked(s)) {
      Audio.sfx('buzz'); this.scene.shake(0.004, 160);
      this.scene.game.events.emit('toast', { title: 'Locked!', text: `Find ${FINAL_SHARDS} Star Shards to open the Quasi-Star. You have ${Save.totalShards()}.`, icon: 'shard', ms: 3000 });
      return;
    }
    if (!s.built) { Audio.sfx('buzz'); this.scene.game.events.emit('toast', { title: s.name, text: 'This star is still being built. Try the Sun or Betelgeuse!', icon: 'shard', ms: 2600 }); return; }
    if (this.scene.leaving) return;
    this.scene.leaving = true;
    Audio.sfx('whoosh'); Audio.sfx('learn');
    const p = this.scene.player; p.frozen = true; p.body.body.setVelocity(0, 0); p.play('celebrate');
    this.scene.tweens.add({ targets: [p.sprite, this.scene.winnie.sprite], scale: 0, alpha: 0, x: this.x, y: this.y - 56, duration: 600, ease: 'Back.easeIn' });
    this.scene.fx.starBurst(this.x, this.y - 58, 30, hex(s.glow));
    this.scene.cameras.main.zoomTo(this.scene.zoom * 1.6, 700, 'Cubic.easeIn');
    this.scene.cameras.main.fadeOut(650, 255, 255, 255);
    this.scene.time.delayedCall(700, () => this.scene.game.events.emit('goto-level', s.id));
  }
  update(dt) {
    this.t += dt;
    this.swirl.rotation += dt * 0.8;
    this.disc.setScale(this.disc.scaleX * (1 + Math.sin(this.t * 2) * 0.001));
    this.showCard(this.isNear(this.scene.player));
  }
}

export class HubDoor {
  constructor(scene, o) {
    this.scene = scene; this.kind = o.kind;
    this.x = o.x * TILE + TILE / 2; this.y = (o.y + 1) * TILE;
    const tex = { closet: 'door-closet', museum: 'door-museum', trophy: 'door-trophy', telescope: 'telescope' }[o.kind];
    this.spr = scene.add.image(this.x, this.y + 4, tex).setOrigin(0.5, 1).setScale(inv).setDepth(8);
    const label = { closet: 'Closet', museum: 'Star Museum', trophy: 'Trophies', telescope: '' }[o.kind];
    if (label) makeText(scene, this.x, this.y - 168, label, 18, { strokeW: 5 }).setDepth(9);
    this.hint = makeText(scene, this.x, this.y - 196, 'GO!', 22, { strokeW: 5, color: '#7dff9a' }).setDepth(9).setAlpha(0);
  }
  isNear(p) { return Math.abs(p.x - this.x) < 50 && Math.abs(p.bottom - this.y) < 60; }
  activate() {
    if (this.scene.busyModal) return;
    if (this.kind === 'telescope') {
      if (!Save.data.secrets.telescope) { Save.data.secrets.telescope = true; Save.save(); this.scene.game.events.emit('toast', { title: 'Secret found!', text: 'You spotted the Winnie constellation!', icon: 'eye', ms: 2600 }); }
      this.scene.freeze(true);
      this.scene.scene.launch('Telescope', { onClose: () => this.scene.freeze(false) });
      return;
    }
    const scn = { closet: 'Closet', museum: 'Museum', trophy: 'Trophy' }[this.kind];
    this.scene.freeze(true);
    this.scene.scene.launch(scn, { onClose: () => { this.scene.freeze(false); this.scene.refreshHub && this.scene.refreshHub(); } });
  }
  update() { this.hint.setAlpha(this.isNear(this.scene.player) ? 1 : 0); }
}

export class CatBed {
  constructor(scene, o) {
    this.scene = scene; this.x = o.x * TILE + TILE / 2; this.y = (o.y + 1) * TILE;
    this.spr = scene.add.image(this.x, this.y + 4, 'catbed').setOrigin(0.5, 1).setScale(inv).setDepth(8);
    this.found = false;
  }
  update() {
    if (this.found) return;
    const p = this.scene.player;
    if (Math.abs(p.x - this.x) < 60 && Math.abs(p.bottom - this.y) < 40) {
      this.found = true;
      const w = this.scene.winnie;
      w.busy = true; w.x = this.x; w.y = this.y - 6; w.play('loaf'); Audio.sfx('purr');
      this.scene.time.delayedCall(2400, () => { w.busy = false; });
      if (!Save.data.secrets.catbed) {
        Save.data.secrets.catbed = true; Save.save();
        this.scene.game.events.emit('toast', { title: 'Secret found!', text: "Winnie's secret nap spot!", icon: 'paw', ms: 2600 });
      }
    }
  }
}
