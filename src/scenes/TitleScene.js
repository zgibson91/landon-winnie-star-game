// Title screen.
import { VIEW_H, FONT } from '../core/constants.js';
import { Input } from '../core/input.js';
import { Audio } from '../audio/audio.js';
import { buildBackground } from '../art/themes.js';
import { makeText, makeButton, FocusNav } from '../ui/ui.js';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    const cam = this.cameras.main; cam.setOrigin(0, 0);
    const z = this.scale.height / VIEW_H; cam.setZoom(z);
    const vw = this.scale.width / z, vh = VIEW_H, cx = vw / 2;
    const bg = buildBackground(this, 'station');
    this.add.image(cx, vh / 2, bg.sky).setDisplaySize(vw + 10, vh + 10);
    this.far = this.add.tileSprite(cx, vh / 2, vw + 10, vh + 10, bg.far).setTileScale(0.5);
    // a little round planet for the heroes to stand on
    const planet = this.add.graphics();
    planet.fillStyle(0x2a1f3d, 1); planet.fillCircle(cx, vh + 560, 720);
    planet.fillStyle(0x5b3d8f, 1); planet.fillCircle(cx, vh + 568, 710);
    planet.fillStyle(0x8f7fe0, 1); planet.fillCircle(cx, vh + 600, 690);
    planet.fillStyle(0x6f5ce0, 1); [[-300, 40, 40], [220, 70, 60], [-60, 110, 30], [420, 140, 50]].forEach(([x, y, r]) => planet.fillCircle(cx + x, vh - 150 + y + 200, r));
    this.landon = this.add.sprite(cx - 70, vh - 148, 'landon-jersey', 0).setOrigin(0.5, 101 / 104).setScale(1.1);
    this.landon.play('landon-jersey-idle');
    this.winnie = this.add.sprite(cx + 60, vh - 146, 'winnie', 0).setOrigin(0.5, 53 / 56).setScale(1);
    this.winnie.play('winnie-sit');
    // title
    const title = this.add.text(cx, 150, 'Landon and Winnie', { fontFamily: FONT, fontSize: '104px', fontStyle: '900', color: '#ffe680', stroke: '#2a1f3d', strokeThickness: 18, padding: { x: 10, y: 10 } }).setOrigin(0.5);
    title.setResolution(Math.min(3, z * 1.05));
    const grad = title.context.createLinearGradient(0, 0, 0, title.height);
    grad.addColorStop(0.15, '#fff6c9'); grad.addColorStop(0.55, '#ffd75e'); grad.addColorStop(0.9, '#ff9a3c');
    title.setFill(grad);
    title.setShadow(0, 10, 'rgba(20,10,50,0.6)', 0, true, true);
    if (title.width > vw - 40) title.setScale((vw - 40) / title.width);
    const sub = makeText(this, cx, 252, 'Journey to the Stars', 50, { color: '#c9e6ff', strokeW: 10 });
    this.tweens.add({ targets: title, y: 158, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: sub, scale: 1.03, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const play = makeButton(this, cx, 380, 300, 92, 'Play!', () => this.start(), { color: 0x5ec26a, size: 44 });
    this.tweens.add({ targets: play, scale: 1.06, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.nav = new FocusNav(this, [play]);
    // shooting stars
    this.time.addEvent({ delay: 1400, loop: true, callback: () => {
      const s = this.add.image(Math.random() * vw, Math.random() * 200, 'starpt').setScale(1.2).setTint(0xfff8c0);
      this.tweens.add({ targets: s, x: s.x + 300, y: s.y + 160, alpha: 0, duration: 900, onComplete: () => s.destroy() });
    } });
    this.input.on('pointerdown', () => { Audio.unlock(); Audio.playSong('title'); });
    Input.onKey(() => { if (this.scene.isActive()) { Audio.unlock(); Audio.playSong('title'); } });
    this.started = false;
  }
  update(t, d) {
    this.far.tilePositionX += d * 0.01;
    this.nav.update();
  }
  start() {
    if (this.started) return; this.started = true;
    Audio.unlock();
    this.landon.play('landon-jersey-celebrate'); this.winnie.play('winnie-happy'); Audio.sfx('meow', { pitch: 1.2 });
    this.cameras.main.fadeOut(500, 18, 11, 46);
    this.time.delayedCall(520, () => this.game.events.emit('goto-hub', null));
  }
}
