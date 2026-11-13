// Generates all the art, loads level files, then shows the title.
import { buildLandon, registerLandonAnims } from '../art/landon.js';
import { buildWinnie, registerWinnieAnims } from '../art/winnie.js';
import { buildProps } from '../art/props.js';

export const LEVEL_FILES = ['hub', 'sun', 'arcturus', 'betelgeuse', 'mucephei', 'vvcephei'];

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    for (const id of LEVEL_FILES) this.load.json(`level-${id}`, `levels/${id}.json`);
  }
  async create() {
    try {
      await Promise.all([buildLandon(this), buildWinnie(this), buildProps(this)]);
    } catch (e) { console.error(e); }
    registerLandonAnims(this);
    registerWinnieAnims(this);
    this.anims.create({ key: 'glimmer-spin', frames: this.anims.generateFrameNumbers('glimmer', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
    for (const k of ['walker-sun', 'walker-red', 'walker-orange', 'walker-garnet', 'walker-blue']) this.anims.create({ key: `${k}-walk`, frames: this.anims.generateFrameNumbers(k, { start: 0, end: 1 }), frameRate: 5, repeat: -1 });
    const boot = document.getElementById('boot');
    if (boot) { boot.style.opacity = '0'; setTimeout(() => boot.remove(), 450); }
    this.game.events.emit('boot-done');
  }
}
