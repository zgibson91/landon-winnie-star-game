// Winnie the calico kitten. Facing right. Frame 72x56, paws on y=53.
import { svgSheet, limb, INK, r1 } from './svg.js';

export const WINNIE_FRAME = { w: 72, h: 56, originY: 53 / 56 };

const K = {
  fur: '#2c2735', furB: '#221e2a', rim: '#4d4660', ink: '#120e18',
  orange: '#f0913a', orangeD: '#d9772a', cream: '#f6dfb2', white: '#fffaf2',
  pink: '#ff9fb0', eye: '#62c46a', eyeD: '#2f8f45',
};

function face(hx, hy, o = {}) {
  const tilt = o.tilt || 0;
  const eyes = o.eyes || 'open';
  let e = '';
  const ex1 = hx + 5, ex2 = hx - 3, ey = hy - 2;
  if (eyes === 'closed' || eyes === 'happy') {
    e = [ex1, ex2].map(x => `<path d="M${x - 2.8} ${ey} Q${x} ${eyes === 'happy' ? ey - 3 : ey + 2.6} ${x + 2.8} ${ey}" stroke="${K.ink}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`).join('');
  } else {
    const wide = eyes === 'wide' ? 1.15 : 1;
    e = `<ellipse cx="${ex2}" cy="${ey}" rx="${2.5 * wide}" ry="${3.6 * wide}" fill="${K.eye}" stroke="${K.ink}" stroke-width="1"/>` +
      `<ellipse cx="${ex2 + 0.5}" cy="${ey + 0.3}" rx="${0.9 * wide}" ry="${2.5 * wide}" fill="${K.ink}"/>` +
      `<circle cx="${ex2 - 0.6}" cy="${ey - 1.3}" r="0.9" fill="#fff"/>` +
      `<ellipse cx="${ex1}" cy="${ey}" rx="${3 * wide}" ry="${3.9 * wide}" fill="${K.eye}" stroke="${K.ink}" stroke-width="1"/>` +
      `<ellipse cx="${ex1 + 0.6}" cy="${ey + 0.3}" rx="${1.1 * wide}" ry="${2.8 * wide}" fill="${K.ink}"/>` +
      `<circle cx="${ex1 - 0.6}" cy="${ey - 1.4}" r="1.1" fill="#fff"/>` +
      `<circle cx="${ex1 + 1.2}" cy="${ey + 1.6}" r="0.5" fill="#fff"/>`;
  }
  const mouth = o.mouth === 'open'
    ? `<path d="M${hx + 6} ${hy + 6.2} Q${hx + 8} ${hy + 11} ${hx + 10.4} ${hy + 6.2} Z" fill="#b8435a" stroke="${K.ink}" stroke-width="0.9"/>`
    : `<path d="M${hx + 6.4} ${hy + 6.4} q1 1.3 2 0 q1 1.3 2 0" stroke="${K.ink}" stroke-width="0.9" fill="none" stroke-linecap="round"/>`;
  return `<g transform="rotate(${tilt} ${hx} ${hy})">` +
    // ears
    `<path d="M${hx - 9} ${hy - 4} L${hx - 7} ${hy - 17} L${hx - 1} ${hy - 9} Z" fill="${K.fur}" stroke="${K.ink}" stroke-width="1.8" stroke-linejoin="round"/>` +
    `<path d="M${hx - 7.3} ${hy - 6.5} L${hx - 6.6} ${hy - 13.5} L${hx - 3} ${hy - 9} Z" fill="${K.pink}"/>` +
    `<path d="M${hx + 2} ${hy - 9} L${hx + 9} ${hy - 18} L${hx + 11} ${hy - 4} Z" fill="${K.orange}" stroke="${K.ink}" stroke-width="1.8" stroke-linejoin="round"/>` +
    `<path d="M${hx + 4.5} ${hy - 9} L${hx + 8.6} ${hy - 14.5} L${hx + 9.6} ${hy - 7} Z" fill="${K.pink}"/>` +
    // head
    `<ellipse cx="${hx}" cy="${hy}" rx="12" ry="11" fill="${K.fur}" stroke="${K.ink}" stroke-width="2"/>` +
    `<path d="M${hx - 9} ${hy - 6} Q${hx - 4} ${hy - 10.5} ${hx + 2} ${hy - 10.5}" stroke="${K.rim}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
    // orange blaze between the ears down the forehead, with a cream edge
    `<path d="M${hx - 0.5} ${hy - 10.8} Q${hx + 3} ${hy - 11.5} ${hx + 5.5} ${hy - 10} L${hx + 3.6} ${hy + 1} Q${hx + 1.6} ${hy + 1.6} ${hx + 1} ${hy} Z" fill="${K.orange}"/>` +
    `<path d="M${hx + 5.5} ${hy - 10} Q${hx + 8.5} ${hy - 8} ${hx + 9} ${hy - 4.5} L${hx + 6} ${hy - 3} Z" fill="${K.cream}"/>` +
    // white muzzle
    `<ellipse cx="${hx + 7}" cy="${hy + 4.6}" rx="6.4" ry="4.6" fill="${K.white}"/>` +
    `<path d="M${hx + 1.4} ${hy + 2.4} Q${hx + 2.5} ${hy + 8} ${hx + 7} ${hy + 9}" stroke="${K.white}" stroke-width="3" fill="none"/>` +
    e +
    // pink nose with a tiny dark spot
    `<path d="M${hx + 8.4} ${hy + 2} L${hx + 12.2} ${hy + 1.8} L${hx + 10.4} ${hy + 4.6} Z" fill="${K.pink}" stroke="${K.ink}" stroke-width="0.8" stroke-linejoin="round"/>` +
    `<circle cx="${hx + 9.7}" cy="${hy + 2.7}" r="0.6" fill="${K.ink}"/>` +
    mouth +
    // whiskers
    `<path d="M${hx + 11} ${hy + 4.5} L${hx + 19} ${hy + 2.6} M${hx + 11} ${hy + 6} L${hx + 19} ${hy + 6.8} M${hx + 3} ${hy + 4.5} L${hx - 4} ${hy + 3.5}" stroke="#fff" stroke-width="0.7" opacity="0.9" stroke-linecap="round"/>` +
    `</g>`;
}

function tailPath(d, ow = 8, w = 5.2, band = true) {
  return `<path d="${d}" stroke="${K.ink}" stroke-width="${ow}" fill="none" stroke-linecap="round"/>` +
    `<path d="${d}" stroke="${K.fur}" stroke-width="${w}" fill="none" stroke-linecap="round"/>` +
    (band ? `<path d="${d}" stroke="${K.orange}" stroke-width="${w}" fill="none" stroke-linecap="butt" stroke-dasharray="0 9 6 100"/>` : '');
}

function leg(x, y, a1, a2, front, back) {
  const l = limb(x, y, a1, 6.5, a2, 6.5, 5.6, back ? K.furB : K.fur, 1.8, K.ink);
  const paw = front ? K.white : (back ? K.furB : K.fur);
  return l.svg + `<ellipse cx="${r1(l.ex + 1)}" cy="${r1(l.ey + 0.6)}" rx="3.6" ry="2.5" fill="${paw}" stroke="${K.ink}" stroke-width="1.5"/>` +
    (front ? `<path d="M${r1(l.kx)} ${r1(l.ky)}L${r1(l.ex)} ${r1(l.ey)}" stroke="${K.white}" stroke-width="5.4" stroke-linecap="round"/>` : '');
}

// Standing / walking body. legs = [backFar, backNear, frontFar, frontNear] angle pairs.
function standing(o = {}) {
  const by = o.by || 0, bx = o.bx || 0, stretch = o.stretch || 1;
  const legs = o.legs || [[-4, 4], [4, -4], [-4, 4], [4, -4]];
  const tail = o.tail || `M${17 + bx} ${33 + by} C8 30 4 20 8 12 C10 7 16 7 15 12`;
  const hx = 51 + bx + (o.hx || 0), hy = 24 + by + (o.hy || 0);
  const bodyRx = 15 * stretch;
  return tailPath(tail) +
    leg(21 + bx, 39 + by, ...legs[0], false, true) + leg(43 + bx, 39 + by, ...legs[2], true, true) +
    `<ellipse cx="${33 + bx}" cy="${36 + by}" rx="${bodyRx}" ry="9.5" fill="${K.fur}"/>` +
    `<ellipse cx="${30 + bx}" cy="${31 + by}" rx="${7.5 * stretch}" ry="4.2" fill="${K.orange}"/>` +
    `<ellipse cx="${23 + bx}" cy="${35.5 + by}" rx="4.6" ry="3.6" fill="${K.cream}"/>` +
    `<ellipse cx="${35 + bx}" cy="${33.5 + by}" rx="3" ry="2.2" fill="${K.cream}"/>` +
    `<ellipse cx="${45 + bx}" cy="${38 + by}" rx="5.2" ry="6" fill="${K.white}"/>` +
    `<ellipse cx="${33 + bx}" cy="${36 + by}" rx="${bodyRx}" ry="9.5" fill="none" stroke="${K.ink}" stroke-width="2"/>` +
    `<path d="M${22 + bx} ${28 + by} Q${33 + bx} ${24.5 + by} ${42 + bx} ${28 + by}" stroke="${K.rim}" stroke-width="1.4" fill="none" opacity="0.7"/>` +
    leg(24 + bx, 40 + by, ...legs[1], false, false) + leg(46 + bx, 40 + by, ...legs[3], true, false) +
    face(hx, hy, o);
}

// Sitting body.
function sitting(o = {}) {
  const pawUp = o.pawUp;
  const tail = o.tail || 'M25 48 C26 56 44 56 50 50';
  return tailPath(tail, 8, 5.2, true) +
    `<ellipse cx="29" cy="43" rx="10" ry="9.5" fill="${K.fur}" stroke="${K.ink}" stroke-width="2"/>` +
    `<ellipse cx="27" cy="40" rx="5" ry="3.4" fill="${K.orange}"/>` +
    `<path d="M30 30 Q37 26 43 32 L45 49 Q37 52 30 50 Z" fill="${K.fur}" stroke="${K.ink}" stroke-width="2" stroke-linejoin="round"/>` +
    `<ellipse cx="40" cy="40" rx="4.6" ry="7.2" fill="${K.white}"/>` +
    `<ellipse cx="33" cy="35" rx="3" ry="2.4" fill="${K.cream}"/>` +
    (pawUp
      ? `<path d="M41 40 Q47 34 50 28" stroke="${K.ink}" stroke-width="7.6" stroke-linecap="round" fill="none"/><path d="M41 40 Q47 34 50 28" stroke="${K.white}" stroke-width="5.2" stroke-linecap="round" fill="none"/><circle cx="50.5" cy="27.5" r="3.2" fill="${K.white}" stroke="${K.ink}" stroke-width="1.4"/>`
      : `<path d="M42.5 42 L43 51" stroke="${K.ink}" stroke-width="7.4" stroke-linecap="round"/><path d="M42.5 42 L43 51" stroke="${K.white}" stroke-width="5" stroke-linecap="round"/><ellipse cx="44" cy="51.5" rx="3.7" ry="2.3" fill="${K.white}" stroke="${K.ink}" stroke-width="1.4"/>`) +
    `<path d="M37.5 43 L38 51" stroke="${K.ink}" stroke-width="7.4" stroke-linecap="round"/><path d="M37.5 43 L38 51" stroke="${K.white}" stroke-width="5" stroke-linecap="round"/><ellipse cx="39" cy="51.5" rx="3.6" ry="2.2" fill="${K.white}" stroke="${K.ink}" stroke-width="1.4"/>` +
    face(41 + (o.hx || 0), 22 + (o.hy || 0), o);
}

const walk = (i) => {
  const p = i / 4 * Math.PI * 2, s = Math.sin(p) * 26, s2 = Math.sin(p + Math.PI) * 26;
  return standing({ by: -Math.abs(Math.cos(p)) * 1.2, legs: [[s, s - 12], [s2, s2 - 12], [s2, s2 + 8], [s, s + 8]], tail: `M17 ${33} C7 ${31 + Math.sin(p) * 2} 3 ${19 + Math.cos(p) * 2} 8 11 C10 6 16 6 15 11` });
};

export const WINNIE_ANIMS = {
  sit: [sitting({}), sitting({ eyes: 'closed' }), sitting({ tail: 'M25 48 C20 56 10 52 10 44', tilt: 6 })],
  walk: [walk(0), walk(1), walk(2), walk(3)],
  jump: [standing({ by: -2, legs: [[-40, -30], [-46, -36], [44, 30], [50, 36]], tail: 'M17 32 C8 30 2 26 0 18', hy: -1 })],
  pounce: [standing({ stretch: 1.12, by: -1, legs: [[-60, -70], [-66, -76], [70, 85], [78, 92]], tail: 'M16 32 C8 32 2 34 -2 30', hx: 3, eyes: 'wide' })],
  meow: [sitting({ eyes: 'closed', mouth: 'open', tilt: -10, hy: -1 })],
  stretch: [standing({ by: 3, hy: 6, hx: 4, legs: [[-8, 6], [6, -6], [60, 80], [64, 84]], tail: 'M17 33 C10 22 14 10 20 6', eyes: 'happy' })],
  bat: [sitting({ pawUp: true, eyes: 'wide', tilt: -6 })],
  happy: [sitting({ eyes: 'happy', mouth: 'open', tail: 'M25 48 C18 46 14 36 18 28' })],
  loaf: [`<ellipse cx="34" cy="45" rx="17" ry="8.5" fill="${K.fur}" stroke="${K.ink}" stroke-width="2"/>` +
    `<ellipse cx="30" cy="41" rx="7" ry="3.4" fill="${K.orange}"/><ellipse cx="22" cy="45" rx="4" ry="3" fill="${K.cream}"/>` +
    tailPath('M18 50 C26 56 44 56 52 51', 8, 5.2) + face(48, 34, { eyes: 'closed' })],
};

export const WINNIE_ORDER = Object.entries(WINNIE_ANIMS).flatMap(([name, frames]) => frames.map((svg, i) => ({ name, i, svg })));
const idx = (name) => WINNIE_ORDER.findIndex(f => f.name === name);

export async function buildWinnie(scene) {
  await svgSheet(scene, 'winnie', WINNIE_FRAME.w, WINNIE_FRAME.h, WINNIE_ORDER.map(f => f.svg));
}

export function registerWinnieAnims(scene) {
  const mk = (name, seq, rate, repeat = -1) => {
    const k = `winnie-${name}`;
    if (!scene.anims.exists(k)) scene.anims.create({ key: k, frames: seq.map(i => ({ key: 'winnie', frame: idx(name) + i })), frameRate: rate, repeat });
  };
  mk('sit', [0, 0, 0, 2, 2, 0, 0, 1, 0, 0], 3);
  mk('walk', [0, 1, 2, 3], 11);
  mk('jump', [0], 1, 0); mk('pounce', [0], 1, 0); mk('meow', [0], 1, 0); mk('stretch', [0], 1, 0);
  mk('bat', [0], 1, 0); mk('happy', [0], 1, 0); mk('loaf', [0], 1, 0);
}
