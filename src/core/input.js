// One input layer for touch, keyboard and gamepads. Polled once per frame (game 'prestep').
// Scenes read Input.left/right/jump (held) and Input.pressed('jump') (edge this frame).

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', KeyZ: 'jump', KeyK: 'jump',
  KeyX: 'winnie', KeyJ: 'winnie', KeyC: 'winnie',
  Escape: 'pause', KeyP: 'pause',
  Enter: 'confirm',
};

const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'winnie', 'pause', 'confirm'];

export const Input = {
  held: Object.fromEntries(ACTIONS.map(a => [a, false])),
  prev: Object.fromEntries(ACTIONS.map(a => [a, false])),
  kb: Object.fromEntries(ACTIONS.map(a => [a, false])),
  touch: Object.fromEntries(ACTIONS.map(a => [a, false])),
  pad: Object.fromEntries(ACTIONS.map(a => [a, false])),
  bot: null,              // test bot can override all inputs: {left, right, jump, ...}
  lastDevice: 'keyboard', // 'touch' | 'keyboard' | 'gamepad'
  padConnected: false,
  listeners: [],

  init() {
    window.addEventListener('keydown', (e) => {
      const a = KEYMAP[e.code];
      if (a) { this.kb[a] = true; this.lastDevice = 'keyboard'; e.preventDefault(); }
      this.listeners.forEach(fn => fn('key', e));
    }, { passive: false });
    window.addEventListener('keyup', (e) => {
      const a = KEYMAP[e.code];
      if (a) { this.kb[a] = false; e.preventDefault(); }
    }, { passive: false });
    window.addEventListener('blur', () => { for (const a of ACTIONS) { this.kb[a] = false; this.touch[a] = false; } });
    window.addEventListener('gamepadconnected', () => { this.padConnected = true; });
    window.addEventListener('gamepaddisconnected', () => { this.padConnected = false; });
  },

  pollPad() {
    const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
    for (const a of ACTIONS) this.pad[a] = false;
    let any = false;
    for (const gp of pads) {
      if (!gp || !gp.connected) continue;
      const b = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      const p = this.pad;
      p.left = p.left || ax < -0.4 || b(14);
      p.right = p.right || ax > 0.4 || b(15);
      p.up = p.up || ay < -0.5 || b(12);
      p.down = p.down || ay > 0.5 || b(13);
      // Standard mapping: 0 = bottom face, 1 = right face, 2 = left face, 3 = top face.
      // Switch Pro: B/A jump (and confirm), Y/X Winnie. Xbox: A/B jump, X/Y Winnie.
      p.jump = p.jump || b(0) || b(1);
      p.confirm = p.confirm || b(0) || b(1);
      p.winnie = p.winnie || b(2) || b(3) || b(5) || b(7);
      p.pause = p.pause || b(9) || b(8);
      if (ACTIONS.some(a => p[a])) any = true;
    }
    if (any) this.lastDevice = 'gamepad';
  },

  update() {
    this.pollPad();
    for (const a of ACTIONS) {
      this.prev[a] = this.held[a];
      if (this.bot) this.held[a] = !!this.bot[a];
      else this.held[a] = this.kb[a] || this.touch[a] || this.pad[a];
    }
  },

  get left() { return this.held.left && !this.held.right; },
  get right() { return this.held.right && !this.held.left; },
  get jump() { return this.held.jump; },
  pressed(a) { return this.held[a] && !this.prev[a]; },
  released(a) { return !this.held[a] && this.prev[a]; },
  // Menus: "confirm" accepts jump/confirm presses from any device.
  confirmPressed() { return this.pressed('confirm') || (this.pressed('jump') && !this.kbSpaceIsTyping); },
  onKey(fn) { this.listeners.push(fn); },
  clearTouch() { for (const a of ACTIONS) this.touch[a] = false; },
};
