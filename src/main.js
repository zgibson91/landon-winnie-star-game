// Landon and Winnie: Journey to the Stars — game bootstrap.
import { DEBUG, TEST } from './core/constants.js';
import { Input } from './core/input.js';
import { Save } from './core/save.js';
import { Audio } from './audio/audio.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { LevelScene } from './scenes/LevelScene.js';
import { UIScene } from './scenes/UIScene.js';
import { MENU_SCENES } from './scenes/menus.js';

// --- block zoom, scrolling, selection and long-press menus (iPad) ---
const stop = (e) => { if (e.cancelable) e.preventDefault(); };
document.addEventListener('gesturestart', stop, { passive: false });
document.addEventListener('gesturechange', stop, { passive: false });
document.addEventListener('touchmove', stop, { passive: false });
document.addEventListener('dblclick', stop, { passive: false });
document.addEventListener('contextmenu', stop);
document.addEventListener('selectstart', stop);
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => { const now = Date.now(); if (now - lastTouchEnd < 350) stop(e); lastTouchEnd = now; }, { passive: false });
// first touch / key unlocks audio (iOS)
const unlock = () => Audio.unlock();
window.addEventListener('pointerdown', unlock, { capture: true });
window.addEventListener('keydown', unlock, { capture: true });
window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') Input.lastDevice = 'touch'; }, { capture: true });

Save.load();
Audio.soundOn = Save.settings.sound;
Audio.musicOn = Save.settings.music;
Input.init();

const DPR = Math.min(window.devicePixelRatio || 1, 2);
const size = () => ({ w: Math.max(320, Math.round(window.innerWidth * DPR)), h: Math.max(240, Math.round(window.innerHeight * DPR)) });
const s0 = size();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1b1442',
  scale: { mode: Phaser.Scale.NONE, width: s0.w, height: s0.h, zoom: 1 / DPR },
  physics: { default: 'arcade', arcade: { gravity: { y: 2000 }, debug: DEBUG && /[?&]bodies=1/.test(location.search), fps: 60, tileBias: 40 } },
  input: { activePointers: 5, touch: { capture: true } },
  render: { antialias: true, roundPixels: false, powerPreference: 'high-performance' },
  fps: { target: 60, smoothStep: true },
  audio: { noAudio: true },
  banner: false,
  scene: [BootScene, TitleScene, LevelScene, UIScene, ...MENU_SCENES],
});
game.registry.set('dpr', DPR);

function onResize() {
  const s = size();
  game.scale.resize(s.w, s.h);
  game.scale.setZoom(1 / DPR);
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', () => setTimeout(onResize, 250));

game.events.on('prestep', () => Input.update());

// --- scene flow ---
const MENUS = ['Pause', 'Parent', 'Learn', 'Complete', 'Closet', 'Museum', 'Trophy', 'Telescope'];
function stopMenus() { for (const k of MENUS) if (game.scene.isActive(k) || game.scene.isPaused(k)) game.scene.stop(k); }
function startLevel(id, from) {
  stopMenus();
  const sm = game.scene;
  if (sm.isActive('Title')) sm.stop('Title');
  const lvl = sm.getScene('Level');
  if (sm.isActive('Level') || sm.isPaused('Level')) lvl.scene.restart({ id, from });
  else sm.start('Level', { id, from });
  if (!sm.isActive('UI')) sm.start('UI');
  sm.bringToTop('UI');
  Save.data.lastLevel = id; Save.save();
}
game.events.on('boot-done', () => {
  const q = new URLSearchParams(location.search);
  const lvl = q.get('level');
  if (lvl) { startLevel(lvl, null); return; }
  game.scene.start('Title');
});
game.events.on('goto-level', (id) => startLevel(id, null));
game.events.on('goto-hub', (from) => startLevel('hub', from));

// pause when the app goes to the background
document.addEventListener('visibilitychange', () => {
  if (TEST) return;
  if (document.hidden) {
    Audio.suspend();
    const ui = game.scene.getScene('UI');
    if (ui && game.scene.isActive('UI')) ui.openPause();
  } else Audio.resume();
});

// --- offline support ---
if ('serviceWorker' in navigator && !/[?&]nosw=1/.test(location.search) && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// --- debug / test hooks ---
window.LW = {
  game, Save, Input, Audio,
  level: () => game.scene.getScene('Level'),
  state: () => { const l = game.scene.getScene('Level'); return l && l.ready && game.scene.isActive('Level') ? l.debugState() : null; },
  goto: (id) => startLevel(id, null),
  hub: () => startLevel('hub', null),
  scenes: () => game.scene.getScenes(true).map(s => s.scene.key),
  teleport: (tx, ty) => { const l = game.scene.getScene('Level'); l.player.teleport(tx * 48 + 24, ty * 48 + 16); },
  test: TEST,
};
if (DEBUG) {
  console.log('[LW] debug mode: N = next lantern, B = back a lantern, 0 = hub, 1 = Sun, 3 = Betelgeuse, I = toggle invincible');
  const order = { Digit0: 'hub', Digit1: 'sun', Digit3: 'betelgeuse' };
  window.addEventListener('keydown', (e) => {
    const l = game.scene.getScene('Level');
    if (order[e.code]) startLevel(order[e.code], null);
    if (!l || !l.ready || l.isHub) return;
    if (e.code === 'KeyN' || e.code === 'KeyB') {
      const lan = l.lanterns.filter(x => !x.assistOnly || l.assist);
      const cur = lan.findIndex(x => x.idx === l.cp.idx);
      const next = lan[Math.max(0, Math.min(lan.length - 1, cur + (e.code === 'KeyN' ? 1 : -1)))];
      if (next) { next.light(true); l.setCheckpoint(next); l.respawn(); }
    }
    if (e.code === 'KeyI') { l.invincible = !l.invincible; console.log('invincible', l.invincible); }
  });
}
