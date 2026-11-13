// Shared tuning constants. World units: 1 tile = 48 px, the camera always shows 720 px of height.
export const TILE = 48;
export const VIEW_H = 720;
export const ART = 2; // generated textures are drawn at 2x and displayed at 0.5 scale for retina crispness

// Player physics. The level checker (tests/reach.mjs) reads these same numbers.
export const PHYS = {
  gravity: 2000,      // px/s^2
  fallMult: 1.25,     // extra gravity when falling, for a snappier arc
  maxFall: 1000,
  runSpeed: 300,
  groundAccel: 2600,
  groundDecel: 3400,
  airAccel: 1900,
  airDecel: 900,
  jumpV: 800,         // apex ~160 px = 3.3 tiles
  jumpCut: 0.45,      // velocity multiplier when jump is released early (variable height)
  coyote: 0.10,       // seconds you can still jump after leaving a ledge
  buffer: 0.13,       // seconds a jump press is remembered before landing
  bounceV: 1150,      // magnetic-loop launch
  stompV: 640,
  bodyW: 30,
  bodyH: 62,
};

export const FONT = 'ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif';

export const COLORS = {
  ink: 0x2a1f3d,
  inkCss: '#2a1f3d',
  cream: '#fff3c4',
  gold: '#ffd75e',
  night: 0x1b1442,
};

const SEARCH = typeof location !== 'undefined' ? location.search : '';
export const DEBUG = /[?&]debug=1/.test(SEARCH);
export const TEST = /[?&]test=1/.test(SEARCH);
