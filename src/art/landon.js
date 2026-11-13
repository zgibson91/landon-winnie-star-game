// Landon: cartoon hero drawn as SVG, one function per pose. Facing right; the sprite is flipped for left.
import { svgSheet, limb, seg, INK, r1 } from './svg.js';

export const LANDON_FRAME = { w: 96, h: 104, originY: 101 / 104 };

const C = {
  skin: '#f8d9bd', skinB: '#ecc6a6', skinShade: '#efc3a2',
  hair: '#eac66a', hairDark: '#c99a3a', hairLight: '#f7e3a1',
  eye: '#6f9fd6', cheek: '#ff8f9c',
  jersey: '#e63946', jerseyB: '#c92f3c', jerseyShade: '#c42c3a',
  shorts: '#243b6b', sock: '#e63946', shoe: '#283a6e', sole: '#ffffff',
  pj: '#ffffff', pjB: '#eceaf2', pjTrim: '#9aa0ad', pjShade: '#e3e1ea',
};

// Animation list: name -> array of pose objects. Frame index = order in FRAMES.
const deg = (v) => v;
function pose(o) { return Object.assign({ lean: 0, bob: 0, legB: [-3, -3], legF: [4, 4], armB: [-10, -4], armF: [12, 28], eyes: 'open', mouth: 'grin', look: 0 }, o); }

const runFrames = [];
for (let i = 0; i < 6; i++) {
  const p = (i / 6) * Math.PI * 2;
  const s = Math.sin(p), c = Math.cos(p);
  const legAngle = (ph) => {
    const a1 = 42 * Math.sin(ph);
    const back = Math.cos(ph) < 0; // leg swinging forward -> knee bends
    const a2 = a1 - (back ? 55 * Math.abs(Math.cos(ph)) : 6);
    return [a1, a2];
  };
  runFrames.push(pose({
    lean: 9, bob: -2.2 * Math.abs(c) + 1,
    legF: legAngle(p), legB: legAngle(p + Math.PI),
    armF: [-40 * s, -40 * s + 75], armB: [40 * s, 40 * s + 75],
    mouth: 'grin',
  }));
}

export const LANDON_ANIMS = {
  idle: [pose({}), pose({ bob: 1, armF: [14, 32], armB: [-12, -6] }), pose({ eyes: 'blink' })],
  run: runFrames,
  jump: [pose({ legF: [62, -6], legB: [-24, 8], armF: [158, 168], armB: [-150, -160], mouth: 'open', eyes: 'wide', lean: 4 })],
  fall: [pose({ legF: [20, 30], legB: [-12, -2], armF: [118, 140], armB: [-112, -132], mouth: 'o', eyes: 'wide' })],
  land: [pose({ bob: 5, legF: [58, -22], legB: [44, -26], armF: [60, 80], armB: [-60, -80], mouth: 'grin' })],
  hurt: [pose({ lean: -10, legF: [30, 10], legB: [-30, -10], armF: [135, 160], armB: [-135, -160], eyes: 'hurt', mouth: 'ouch' })],
  celebrate: [
    pose({ armF: [176, 182], armB: [-38, -70], eyes: 'happy', mouth: 'grin' }),
    pose({ bob: -3, legF: [40, -10], legB: [-30, -5], armF: [170, 176], armB: [-150, -166], eyes: 'happy', mouth: 'open' }),
  ],
  push: [pose({ lean: 16, legF: [30, 20], legB: [-28, -22], armF: [80, 85], armB: [70, 80] })],
  look: [pose({ eyes: 'open', mouth: 'smile', look: -1 })],
};

export const LANDON_ORDER = Object.entries(LANDON_ANIMS).flatMap(([name, frames]) => frames.map((p, i) => ({ name, i, p })));
export function landonFrameIndex(name) {
  return LANDON_ORDER.findIndex(f => f.name === name);
}

function hair() {
  return `<path d="M25 37 C20 22 27 10 39 7 L37 0.5 L46 5 L51 -1 L56 6 L64 2 L64.5 9 L73 8.5 L69.5 15.5 C74 19 75.5 24 74 28.5 C69 21.5 63 19.5 57.5 21.5 L58.5 16 L52.5 21 L48.5 16.5 L44.5 22.5 C38.5 22 33.5 27.5 31.5 37 Z" fill="${C.hair}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="M33 22 C37 15 44 11 51 10" stroke="${C.hairLight}" stroke-width="2.6" stroke-linecap="round" fill="none"/>` +
    `<path d="M40 13 C45 9 50 8 55 9 M60 9 C64 10 67 12 69 15" stroke="${C.hairDark}" stroke-width="1.4" stroke-linecap="round" fill="none"/>`;
}

function eyes(kind, look) {
  const ex = [47, 61.5], ey = 31;
  if (kind === 'blink') return ex.map(x => `<path d="M${x - 5} ${ey + 1} Q${x} ${ey + 4} ${x + 5} ${ey + 1}" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`).join('');
  if (kind === 'happy') return ex.map(x => `<path d="M${x - 5} ${ey + 2} Q${x} ${ey - 5} ${x + 5} ${ey + 2}" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`).join('');
  if (kind === 'hurt') return `<path d="M43 27 L50 31 L43 35" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M65.5 27 L58.5 31 L65.5 35" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const big = kind === 'wide' ? 1.12 : 1;
  const lx = 1.3 + look * 1.6;
  return ex.map((x, i) => {
    const rx = (i === 0 ? 4.9 : 5.4) * big, ry = 6.6 * big;
    return `<ellipse cx="${x}" cy="${ey}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${INK}" stroke-width="1.7"/>` +
      `<circle cx="${r1(x + lx)}" cy="${ey + 0.8}" r="${3.9 * big}" fill="${C.eye}"/>` +
      `<circle cx="${r1(x + lx + 0.3)}" cy="${ey + 1}" r="${2.1 * big}" fill="${INK}"/>` +
      `<circle cx="${r1(x + lx - 1.2)}" cy="${ey - 1.3}" r="1.5" fill="#fff"/>` +
      `<circle cx="${r1(x + lx + 1.4)}" cy="${ey + 2.4}" r="0.7" fill="#fff"/>`;
  }).join('') +
    `<path d="M42.5 22.5 Q47 20.5 51 22.5 M57 22 Q61.5 20 66 22" stroke="${C.hairDark}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
}

function mouth(kind) {
  switch (kind) {
    case 'open': return `<path d="M53 42 Q60 43 67 41 Q66 53 59.5 53 Q53 52 53 42 Z" fill="#8e2b3a" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M54 42.4 Q60 43.4 66.4 41.6 L66 44 Q60 45.6 54.3 44.6 Z" fill="#fff"/><ellipse cx="60" cy="50" rx="4" ry="2.2" fill="#ff7d8f"/>`;
    case 'o': return `<ellipse cx="60" cy="45.5" rx="3.6" ry="4.4" fill="#8e2b3a" stroke="${INK}" stroke-width="1.8"/>`;
    case 'ouch': return `<path d="M53 46 Q55.5 43 58 46 Q60.5 49 63 46 Q65.5 43 67 45" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    case 'smile': return `<path d="M53 42.5 Q60 49 67 41.5" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    default: // huge grin
      return `<path d="M52 41.5 Q60 44 68 40.5 Q66.5 51 59 51 Q52 50 52 41.5 Z" fill="#8e2b3a" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M53 42 Q60 44.3 67.4 41.1 L66.8 44.2 Q60 46.6 53.6 44.8 Z" fill="#fff"/>` +
        `<path d="M55 48.5 Q59 46.5 63.5 48.2 Q61 50.6 58.5 50.4 Q56 50.2 55 48.5Z" fill="#ff7d8f"/>`;
  }
}

function head(p) {
  return `<g>` +
    `<circle cx="31.5" cy="35" r="5.3" fill="${C.skin}" stroke="${INK}" stroke-width="2.2"/>` +
    `<path d="M30 33.5 Q32.5 35 30.5 37.5" stroke="${C.skinShade}" stroke-width="1.6" fill="none"/>` +
    `<ellipse cx="51" cy="32" rx="23.5" ry="22.5" fill="${C.skin}" stroke="${INK}" stroke-width="2.4"/>` +
    `<path d="M31 38 Q36 52 51 54" stroke="${C.skinShade}" stroke-width="3" fill="none" opacity="0.7"/>` +
    `<ellipse cx="42.5" cy="40.5" rx="4.6" ry="3" fill="${C.cheek}" opacity="0.55"/>` +
    `<ellipse cx="68" cy="40" rx="3.4" ry="2.7" fill="${C.cheek}" opacity="0.55"/>` +
    `<path d="M68.5 34.5 Q71.5 37 68.5 38.6" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
    eyes(p.eyes, p.look) + mouth(p.mouth) + hair() +
    `</g>`;
}

function legSvg(x, y, a, outfit, back) {
  const pj = outfit === 'pajamas';
  const skin = back ? C.skinB : C.skin;
  const l = limb(x, y, a[0], 11, a[1], 12, 9, pj ? (back ? C.pjB : C.pj) : skin);
  let s = l.svg;
  const fx = l.ex, fy = l.ey;
  if (!pj) {
    const sx = l.kx + (fx - l.kx) * 0.35, sy = l.ky + (fy - l.ky) * 0.35;
    s += seg(sx, sy, fx, fy, 9, back ? C.jerseyB : C.sock);
    const bx = l.kx + (fx - l.kx) * 0.42, by = l.ky + (fy - l.ky) * 0.42;
    s += seg(bx, by, bx + (fx - l.kx) * 0.08, by + (fy - l.ky) * 0.08, 9, '#fff');
    const rot = r1(a[1] * 0.35);
    s += `<g transform="rotate(${rot} ${r1(fx)} ${r1(fy)})"><path d="M${r1(fx - 6)} ${r1(fy + 4)} Q${r1(fx - 6)} ${r1(fy - 4.5)} ${r1(fx + 1)} ${r1(fy - 4)} Q${r1(fx + 9)} ${r1(fy - 2)} ${r1(fx + 9)} ${r1(fy + 4)} Z" fill="${back ? '#1e2d58' : C.shoe}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
      `<path d="M${r1(fx - 5.5)} ${r1(fy + 3)} L${r1(fx + 8.5)} ${r1(fy + 3)}" stroke="#fff" stroke-width="1.8"/></g>`;
  } else {
    const cx = l.kx + (fx - l.kx) * 0.82, cy = l.ky + (fy - l.ky) * 0.82;
    s += seg(cx, cy, fx, fy, 9.6, C.pjTrim);
    const rot = r1(a[1] * 0.35);
    s += `<g transform="rotate(${rot} ${r1(fx)} ${r1(fy)})"><ellipse cx="${r1(fx + 2.5)}" cy="${r1(fy + 1.5)}" rx="6.5" ry="3.8" fill="${skin}" stroke="${INK}" stroke-width="2.1"/></g>`;
    if (!back) s += `<circle cx="${r1(l.kx + 1)}" cy="${r1(l.ky - 3)}" r="1.6" fill="#8fd16a"/>`;
  }
  return s;
}

function armSvg(x, y, a, outfit, back) {
  const pj = outfit === 'pajamas';
  const skin = back ? C.skinB : C.skin;
  const l = limb(x, y, a[0], 10, a[1], 10, 7.5, skin);
  let s = l.svg;
  if (pj) {
    const sleeveEnd = { x: l.kx + (l.ex - l.kx) * 0.72, y: l.ky + (l.ey - l.ky) * 0.72 };
    s += `<path d="M${r1(x)} ${r1(y)}L${r1(l.kx)} ${r1(l.ky)}L${r1(sleeveEnd.x)} ${r1(sleeveEnd.y)}" stroke="${back ? C.pjB : C.pj}" stroke-width="8.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    s += seg(sleeveEnd.x, sleeveEnd.y, sleeveEnd.x + (l.ex - l.kx) * 0.08, sleeveEnd.y + (l.ey - l.ky) * 0.08, 8.6, C.pjTrim);
  } else {
    const ux = x + (l.kx - x) * 0.6, uy = y + (l.ky - y) * 0.6;
    s += seg(x, y, ux, uy, 9.6, back ? C.jerseyB : C.jersey);
  }
  s += `<circle cx="${r1(l.ex)}" cy="${r1(l.ey)}" r="4.4" fill="${skin}" stroke="${INK}" stroke-width="2"/>`;
  return s;
}

const PRINT = (() => {
  // pizza slices, fries, burgers and little gray dinos scattered over the pajama top
  const pizza = (x, y, r) => `<g transform="rotate(${r} ${x} ${y})"><path d="M${x} ${y - 3} L${x + 3} ${y + 2.6} L${x - 3} ${y + 2.6} Z" fill="#ffcf5a" stroke="#d98a2b" stroke-width="0.7"/><circle cx="${x}" cy="${y + 0.8}" r="0.8" fill="#e63946"/></g>`;
  const fries = (x, y) => `<rect x="${x - 2}" y="${y - 0.5}" width="4" height="3.2" rx="0.6" fill="#e63946"/><path d="M${x - 1.3} ${y} L${x - 1.6} ${y - 3} M${x} ${y} L${x} ${y - 3.4} M${x + 1.3} ${y} L${x + 1.6} ${y - 3}" stroke="#ffcf5a" stroke-width="0.9"/>`;
  const burger = (x, y) => `<path d="M${x - 2.6} ${y} Q${x} ${y - 3.6} ${x + 2.6} ${y} Z" fill="#d98a3b"/><rect x="${x - 2.7}" y="${y}" width="5.4" height="1" fill="#6b3b22"/><rect x="${x - 2.6}" y="${y + 1}" width="5.2" height="0.9" fill="#72c04f"/><rect x="${x - 2.5}" y="${y + 1.9}" width="5" height="1" rx="0.5" fill="#d98a3b"/>`;
  const dino = (x, y) => `<path d="M${x - 3} ${y + 1.5} Q${x - 1} ${y - 1.5} ${x + 1} ${y - 0.5} L${x + 2} ${y - 3} Q${x + 3.4} ${y - 3.4} ${x + 3.4} ${y - 2} L${x + 2.6} ${y + 0.4} L${x + 2} ${y + 2.4} L${x + 1} ${y + 1.6} L${x - 0.5} ${y + 2.4} L${x - 1} ${y + 1.6} Z" fill="#8f96a3"/>`;
  return pizza(40, 58, -10) + fries(54, 60) + dino(44, 66) + burger(57, 68) + pizza(50, 70, 20) + dino(38, 70);
})();

function torso(outfit) {
  if (outfit === 'pajamas') {
    return `<path d="M35 69 L61 69 L62 81 L34.5 81 Z" fill="${C.pj}" stroke="${INK}" stroke-width="2.3" stroke-linejoin="round"/>` +
      `<path d="M36 55 Q48 49.5 60.5 55 L62.5 73 Q48 76.5 33.5 73 Z" fill="${C.pj}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<path d="M37 57 Q35 66 35.5 72" stroke="${C.pjShade}" stroke-width="3.5" fill="none"/>` + PRINT +
      `<path d="M42 53.2 Q48 57.5 54.5 53" stroke="${C.pjTrim}" stroke-width="3.4" fill="none" stroke-linecap="round"/>` +
      `<path d="M34 72.6 Q48 76 62.4 72.6" stroke="${C.pjTrim}" stroke-width="2.6" fill="none"/>`;
  }
  return `<path d="M35 69 L61 69 L62 81 L34.5 81 Z" fill="${C.shorts}" stroke="${INK}" stroke-width="2.3" stroke-linejoin="round"/>` +
    `<path d="M48 72 L48 80.5" stroke="#1a2c55" stroke-width="1.4"/>` +
    `<path d="M36 55 Q48 49.5 60.5 55 L62.5 72 Q48 75.5 33.5 72 Z" fill="${C.jersey}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="M37 57 Q35 64 35 71" stroke="${C.jerseyShade}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
    `<path d="M43 52.6 L48.5 58 L54 52.4" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M49.5 61 L57.5 61 L52.5 70.5" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M49.5 61 L57.5 61 L52.5 70.5" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
}

export function landonSvg(p, outfit) {
  const b = p.bob;
  const upper = `<g transform="translate(0 ${b}) rotate(${p.lean} 48 78)">`;
  const front = `<g transform="rotate(${p.lean} 48 ${78 + b})">${armSvg(55, 58 + b, p.armF, outfit, false)}</g>`;
  // Raised arms go behind the big head so they never cover the face.
  const behind = Math.abs(p.armF[0]) > 100;
  return armSvg(41, 58 + b, p.armB, outfit, true) +
    legSvg(45, 75 + b, p.legB, outfit, true) +
    legSvg(51, 75 + b, p.legF, outfit, false) +
    upper + torso(outfit) + `</g>` + (behind ? front : '') +
    upper + head(p) + `</g>` + (behind ? '' : front);
}

export async function buildLandon(scene) {
  const { w, h } = LANDON_FRAME;
  for (const outfit of ['jersey', 'pajamas']) {
    await svgSheet(scene, `landon-${outfit}`, w, h, LANDON_ORDER.map(f => landonSvg(f.p, outfit)));
  }
}

export function registerLandonAnims(scene) {
  for (const outfit of ['jersey', 'pajamas']) {
    const key = `landon-${outfit}`;
    const rates = { idle: 3, run: 13, jump: 1, fall: 1, land: 1, hurt: 1, celebrate: 5, push: 1, look: 1 };
    for (const name of Object.keys(LANDON_ANIMS)) {
      const start = landonFrameIndex(name);
      const n = LANDON_ANIMS[name].length;
      let frames = Array.from({ length: n }, (_, i) => ({ key, frame: start + i }));
      if (name === 'idle') frames = [0, 1, 0, 1, 0, 1, 0, 2].map(i => ({ key, frame: start + i }));
      const animKey = `${key}-${name}`;
      if (!scene.anims.exists(animKey)) scene.anims.create({ key: animKey, frames, frameRate: rates[name], repeat: ['jump', 'fall', 'land', 'hurt', 'push', 'look'].includes(name) ? 0 : -1 });
    }
  }
}
