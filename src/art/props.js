// Collectibles, level objects and UI icons, all as SVG.
import { svgSheet, svgImage, star5, INK, r1 } from './svg.js';

const glow = (id, c1, c2) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c1}" stop-opacity="0.9"/><stop offset="1" stop-color="${c2}" stop-opacity="0"/></radialGradient>`;

// Glimmer (coin): a round gold gem with a star, 6 spin frames.
function glimmer(i) {
  const sx = Math.max(0.12, Math.abs(Math.cos(i / 6 * Math.PI)));
  return `<g transform="translate(16 16) scale(${r1(sx * 100) / 100} 1)">` +
    `<circle r="12" fill="#ffc93c" stroke="${INK}" stroke-width="2.2"/>` +
    `<circle r="8.6" fill="#ffe27a"/>` +
    `<path d="${star5(0, 0.6, 6.4, 2.8)}" fill="#fff6c9" stroke="#e8a21c" stroke-width="1"/>` +
    `<path d="M-7 -6 Q-3 -10 2 -9.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
}

// Star Shard: a chunky crystal star.
function shard(c1, c2) {
  return `<circle cx="32" cy="32" r="30" fill="url(#sg)"/>` +
    `<path d="${star5(32, 33, 22, 10)}" fill="${c1}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
    `<path d="M32 11 L32 33 L53 26 Z M32 33 L45 51 L32 43 Z M32 33 L11 26 L22 30Z" fill="${c2}" opacity="0.55"/>` +
    `<path d="M26 20 L31 14" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>` +
    `<circle cx="38" cy="25" r="2" fill="#fff"/>`;
}

function lantern(lit) {
  const glass = lit ? '#ffe680' : '#7f8db8';
  return (lit ? `<circle cx="24" cy="22" r="22" fill="url(#lg)"/>` : '') +
    `<rect x="21" y="34" width="6" height="40" rx="3" fill="#6d5aa8" stroke="${INK}" stroke-width="2"/>` +
    `<rect x="12" y="71" width="24" height="6" rx="3" fill="#6d5aa8" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M14 14 Q24 2 34 14 L33 32 Q24 36 15 32 Z" fill="${glass}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="M12 14 L36 14 M14 32 L34 32" stroke="#9b86e6" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M12 14 L36 14 M14 32 L34 32" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>` +
    // Paw print emblem
    `<g fill="${lit ? '#e8862a' : '#56628f'}"><ellipse cx="24" cy="25.5" rx="3.6" ry="3"/><circle cx="20" cy="21" r="1.5"/><circle cx="23" cy="19.4" r="1.5"/><circle cx="26.4" cy="19.6" r="1.5"/><circle cx="28.6" cy="21.6" r="1.4"/></g>` +
    `<circle cx="24" cy="5" r="3" fill="#ffd75e" stroke="${INK}" stroke-width="1.8"/>`;
}

function sign(icon) {
  return `<rect x="4" y="4" width="88" height="66" rx="18" fill="#fff8e1" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M40 70 L48 82 L56 70" fill="#fff8e1" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<rect x="41" y="66" width="14" height="6" fill="#fff8e1"/>` + icon;
}

export const ICONS = {
  // Simple pictograms reused on signs and buttons (drawn in a 96x74 sign box).
  move: `<path d="M18 37 L34 25 L34 49 Z M78 37 L62 25 L62 49 Z" fill="#ff7b54" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><circle cx="48" cy="37" r="9" fill="#ffd75e" stroke="${INK}" stroke-width="2.4"/>`,
  jump: `<path d="M20 56 Q48 0 76 56" stroke="#6f9fd6" stroke-width="4" fill="none" stroke-dasharray="6 6" stroke-linecap="round"/><circle cx="48" cy="27" r="13" fill="#5ec26a" stroke="${INK}" stroke-width="3"/><path d="M42 29 L48 22 L54 29" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  highjump: `<path d="M24 60 L24 46 Q24 12 60 14" stroke="#6f9fd6" stroke-width="4" fill="none" stroke-dasharray="6 6" stroke-linecap="round"/><circle cx="66" cy="44" r="12" fill="#5ec26a" stroke="${INK}" stroke-width="3"/><text x="66" y="50" font-size="15" font-weight="900" text-anchor="middle" fill="#fff" font-family="sans-serif">hold</text>`,
  bounce: `<path d="M22 60 Q48 18 74 60" stroke="#ff9a3c" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M48 32 L48 8 M40 16 L48 7 L56 16" stroke="#6f9fd6" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  flare: `<path d="M30 62 Q24 36 36 22 Q38 36 46 30 Q44 14 56 6 Q56 26 64 34 Q70 48 62 62 Z" fill="#ff7b2c" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><path d="M40 60 Q38 46 46 40 Q50 50 56 46 Q58 54 54 60Z" fill="#ffe36b"/>`,
  wait: `<circle cx="48" cy="37" r="22" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M48 37 L48 23 M48 37 L58 42" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`,
  eye: `<path d="M18 37 Q48 8 78 37 Q48 66 18 37 Z" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="48" cy="37" r="11" fill="#62c46a" stroke="${INK}" stroke-width="2"/><ellipse cx="48" cy="37" rx="3.4" ry="9" fill="${INK}"/>`,
  paw: `<g fill="#ff9fb0" stroke="${INK}" stroke-width="2.4"><ellipse cx="48" cy="44" rx="13" ry="11"/><circle cx="33" cy="28" r="5.6"/><circle cx="43" cy="22" r="5.6"/><circle cx="54" cy="22" r="5.6"/><circle cx="63" cy="28" r="5.6"/></g>`,
  bells: `<g stroke="${INK}" stroke-width="2.4"><path d="M18 50 Q18 30 28 30 Q38 30 38 50 Z" fill="#ff5a4e"/><path d="M40 50 Q40 26 50 26 Q60 26 60 50 Z" fill="#ffd75e"/><path d="M62 50 Q62 22 72 22 Q82 22 82 50 Z" fill="#8fc8ff"/></g>`,
  pulse: `<circle cx="48" cy="37" r="10" fill="#ff5a4e" stroke="${INK}" stroke-width="2.6"/><circle cx="48" cy="37" r="19" fill="none" stroke="#ff8a5e" stroke-width="3" stroke-dasharray="5 5"/><circle cx="48" cy="37" r="27" fill="none" stroke="#ffb07e" stroke-width="2" stroke-dasharray="3 6"/>`,
  thermo: `<rect x="40" y="8" width="16" height="52" rx="8" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="48" cy="62" r="10" fill="#ff5a4e" stroke="${INK}" stroke-width="3"/><rect x="44" y="30" width="8" height="30" fill="#ff5a4e"/>` +
    `<circle cx="70" cy="16" r="7" fill="#8fc8ff" stroke="${INK}" stroke-width="2.4"/><circle cx="70" cy="36" r="7" fill="#ffd75e" stroke="${INK}" stroke-width="2.4"/><circle cx="70" cy="56" r="7" fill="#ff5a4e" stroke="${INK}" stroke-width="2.4"/>` +
    `<text x="24" y="20" font-size="13" font-weight="900" text-anchor="middle" fill="#e63946" font-family="sans-serif">HOT</text><text x="24" y="62" font-size="12" font-weight="900" text-anchor="middle" fill="#3d7fd6" font-family="sans-serif">cool</text>`,
  wind: `<path d="M14 26 Q40 20 66 26 Q80 30 74 40" stroke="#6f9fd6" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M20 40 Q50 34 78 40" stroke="#9fd8ff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M14 54 Q40 48 62 54 Q76 58 70 66" stroke="#6f9fd6" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  mirror: `<rect x="30" y="14" width="40" height="40" rx="8" fill="#5a2a4a" stroke="${INK}" stroke-width="3"/><path d="M36 48 L64 20" stroke="#e8f4ff" stroke-width="8" stroke-linecap="round"/><path d="M8 34 L50 34 L50 4" stroke="#fff06b" stroke-width="4" fill="none" stroke-dasharray="6 4"/><path d="M40 70 L50 58 L60 70" stroke="#5ec26a" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  squeeze: `<path d="M30 66 L30 44 Q30 30 48 30 Q66 30 66 44 L66 66 Z" fill="#1a0a16" stroke="${INK}" stroke-width="3"/><g fill="#ff9fb0" stroke="${INK}" stroke-width="1.5"><ellipse cx="48" cy="56" rx="6" ry="5"/><circle cx="40" cy="47" r="3"/><circle cx="46" cy="44" r="3"/><circle cx="51" cy="44" r="3"/><circle cx="56" cy="47" r="3"/></g><path d="M70 48 L86 48 M80 42 L86 48 L80 54" stroke="#5ec26a" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  swap: `<circle cx="48" cy="37" r="22" fill="#ffd25a" stroke="${INK}" stroke-width="3"/><path d="M48 15 A22 22 0 0 1 48 59 Z" fill="#4a5ad8"/><circle cx="48" cy="37" r="22" fill="none" stroke="${INK}" stroke-width="3"/>`,
  lever: `<circle cx="48" cy="34" r="20" fill="#ffd75e" stroke="${INK}" stroke-width="3"/><path d="M48 20 L52 30 L62 30 L54 36 L57 46 L48 40 L39 46 L42 36 L34 30 L44 30 Z" fill="#fff6c9" stroke="${INK}" stroke-width="1.6"/><rect x="44" y="54" width="8" height="14" fill="#6d5aa8" stroke="${INK}" stroke-width="2"/>`,
  storm: `<path d="M8 50 Q30 30 52 44 Q70 54 88 40" stroke="#c89060" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M14 30 Q36 14 58 26 Q74 34 86 22" stroke="#e0b080" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="30" cy="62" r="3" fill="#c89060"/><circle cx="56" cy="62" r="2.5" fill="#c89060"/><circle cx="72" cy="58" r="2" fill="#c89060"/>`,
  meow: `<path d="M20 44 Q20 22 34 20 L30 8 L44 18 Q48 17 52 18 L66 8 L62 20 Q76 22 76 44 Q76 64 48 64 Q20 64 20 44 Z" fill="#2c2735" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="48" cy="50" rx="9" ry="7" fill="#b8435a"/><path d="M80 30 Q88 37 80 44 M86 24 Q98 37 86 50" stroke="#ffd75e" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  gravity: `<circle cx="48" cy="37" r="24" fill="#ff6a9a" stroke="${INK}" stroke-width="3"/><path d="M36 40 L48 26 L60 40 M36 52 L48 38 L60 52" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  pads: `<g stroke="${INK}" stroke-width="2.5"><rect x="8" y="50" width="22" height="10" rx="3" fill="#ff5a4e"/><rect x="37" y="50" width="22" height="10" rx="3" fill="#6f9fd6"/><rect x="66" y="50" width="22" height="10" rx="3" fill="#5ec26a"/></g><text x="19" y="40" font-size="20" font-weight="900" text-anchor="middle" fill="#2a1f3d" font-family="sans-serif">2</text><text x="48" y="40" font-size="20" font-weight="900" text-anchor="middle" fill="#2a1f3d" font-family="sans-serif">1</text><text x="77" y="40" font-size="20" font-weight="900" text-anchor="middle" fill="#2a1f3d" font-family="sans-serif">3</text>`,
  ring: `<circle cx="48" cy="37" r="26" fill="none" stroke="#d8905a" stroke-width="4" stroke-dasharray="4 4"/><circle cx="48" cy="37" r="8" fill="#ffd0a0" stroke="${INK}" stroke-width="2.4"/>` +
    [0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 - 0.4; return `<rect x="${(48 + Math.cos(a) * 26 - 11).toFixed(1)}" y="${(37 + Math.sin(a) * 26 - 5).toFixed(1)}" width="22" height="10" rx="5" fill="#d8905a" stroke="${INK}" stroke-width="2.2"/>`; }).join('') +
    `<path d="M74 14 Q84 24 80 36" stroke="#5ec26a" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M76 34 L80 38 L84 33" stroke="#5ec26a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  freeze: `<circle cx="34" cy="37" r="22" fill="none" stroke="#d8905a" stroke-width="4" stroke-dasharray="4 4"/><circle cx="34" cy="37" r="7" fill="#ffd0a0" stroke="${INK}" stroke-width="2.2"/>` +
    `<circle cx="72" cy="30" r="13" fill="#ffd75e" stroke="${INK}" stroke-width="2.6"/><path d="M72 21 L74.6 27 L81 27.4 L76 31.4 L77.8 37.6 L72 34 L66.2 37.6 L68 31.4 L63 27.4 L69.4 27 Z" fill="#fff6c9" stroke="${INK}" stroke-width="1.2"/>` +
    `<rect x="62" y="50" width="8" height="18" rx="2" fill="#6f9fd6" stroke="${INK}" stroke-width="2"/><rect x="74" y="50" width="8" height="18" rx="2" fill="#6f9fd6" stroke="${INK}" stroke-width="2"/>`,
  pull: `<circle cx="48" cy="37" r="24" fill="#b58aff" opacity="0.4"/><circle cx="48" cy="37" r="12" fill="#05020c" stroke="#d6a0ff" stroke-width="3"/>` +
    `<path d="M8 22 L26 30 M20 24 L26 30 L19 35 M88 22 L70 30 M76 24 L70 30 L77 35" stroke="#ff9a5a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M10 58 L84 58" stroke="#5ec26a" stroke-width="4" stroke-linecap="round"/><path d="M20 52 L10 58 L20 64" stroke="#5ec26a" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  slow: `<circle cx="48" cy="37" r="26" fill="#9fd8ff" opacity="0.35" stroke="#6fb0ff" stroke-width="3" stroke-dasharray="6 5"/><circle cx="48" cy="37" r="14" fill="#fff" stroke="${INK}" stroke-width="2.6"/><path d="M48 37 L48 28 M48 37 L54 40" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
    `<text x="48" y="72" font-size="13" font-weight="900" text-anchor="middle" fill="#3d7fd6" font-family="sans-serif">slow</text>`,
  pulsar: `<circle cx="48" cy="37" r="10" fill="#fff" stroke="#6ac8f0" stroke-width="3"/><path d="M48 37 L90 16" stroke="#8fe8ff" stroke-width="9" stroke-linecap="round" opacity="0.8"/><path d="M48 37 L6 58" stroke="#8fe8ff" stroke-width="9" stroke-linecap="round" opacity="0.8"/>` +
    `<path d="M66 60 A26 26 0 0 0 74 40" stroke="#5ec26a" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M70 42 L74 38 L78 43" stroke="#5ec26a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  shard: `<path d="${star5(48, 38, 24, 11)}" fill="#ffe680" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`,
  up: `<path d="M48 12 L70 40 L56 40 L56 62 L40 62 L40 40 L26 40 Z" fill="#5ec26a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
  stomp: `<path d="M48 8 L48 30 M40 22 L48 31 L56 22" stroke="#6f9fd6" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 64 Q28 42 48 42 Q68 42 68 64 Z" fill="#ff8a3c" stroke="${INK}" stroke-width="2.6"/><circle cx="42" cy="54" r="2.6" fill="${INK}"/><circle cx="54" cy="54" r="2.6" fill="${INK}"/>`,
};

function bell(color, size) {
  const s = size;
  return `<g transform="translate(24 30) scale(${s})">` +
    `<path d="M0 -24 L0 -18" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="-25" r="3.4" fill="#c9a24a" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M-15 10 Q-16 -18 0 -18 Q16 -18 15 10 L19 14 L-19 14 Z" fill="${color}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
    `<path d="M-9 4 Q-9 -10 -2 -13" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/>` +
    `<circle cx="0" cy="17" r="4" fill="#c9a24a" stroke="${INK}" stroke-width="2"/></g>`;
}

function walker(c1, c2, i) {
  const sq = i === 1 ? 1.06 : 1, st = i === 1 ? 0.94 : 1;
  return `<g transform="translate(24 44) scale(${sq} ${st})">` +
    `<path d="M-20 0 Q-22 -30 0 -32 Q22 -30 20 0 Z" fill="${c1}" stroke="${INK}" stroke-width="2.6"/>` +
    `<path d="M-12 -28 Q-6 -40 -2 -30 Q4 -44 8 -30 Q14 -38 14 -26" fill="${c2}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<ellipse cx="-6" cy="-14" rx="4.6" ry="6" fill="#fff" stroke="${INK}" stroke-width="1.6"/><ellipse cx="7" cy="-14" rx="4.6" ry="6" fill="#fff" stroke="${INK}" stroke-width="1.6"/>` +
    `<circle cx="-4.6" cy="-13" r="2.6" fill="${INK}"/><circle cx="8.4" cy="-13" r="2.6" fill="${INK}"/>` +
    `<path d="M-12 -22 L-2 -19 M14 -22 L4 -19" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M-5 -4 Q1 -1 6 -4" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="${i ? -12 : -10}" cy="0" rx="6" ry="3.4" fill="${c2}" stroke="${INK}" stroke-width="2"/><ellipse cx="${i ? 12 : 10}" cy="0" rx="6" ry="3.4" fill="${c2}" stroke="${INK}" stroke-width="2"/>` +
    `</g>`;
}

export async function buildProps(scene) {
  const jobs = [
    svgSheet(scene, 'glimmer', 32, 32, [0, 1, 2, 3, 4, 5].map(glimmer)),
    svgImage(scene, 'shard', 64, 64, shard('#ffe680', '#ffb13b'), glow('sg', '#fff4b0', '#ffd75e')),
    svgImage(scene, 'shard-blue', 64, 64, shard('#bfe3ff', '#6fb0ff'), glow('sg', '#e8f6ff', '#8fc8ff')),
    svgImage(scene, 'shard-ghost', 64, 64, `<path d="${star5(32, 33, 22, 10)}" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-dasharray="4 4" stroke-linejoin="round"/>`),
    svgSheet(scene, 'lantern', 48, 80, [lantern(false), lantern(true)], glow('lg', '#fff2a8', '#ffcf4a')),
    svgSheet(scene, 'bells', 48, 52, [bell('#ff5a4e', 0.8), bell('#ffd75e', 0.9), bell('#8fc8ff', 1)]),
    svgSheet(scene, 'walker-sun', 48, 48, [walker('#ff8a3c', '#ffd75e', 0), walker('#ff8a3c', '#ffd75e', 1)]),
    svgSheet(scene, 'walker-orange', 48, 48, [walker('#e8862a', '#ffe0a0', 0), walker('#e8862a', '#ffe0a0', 1)]),
    svgSheet(scene, 'walker-garnet', 48, 48, [walker('#a01e44', '#ff8aa6', 0), walker('#a01e44', '#ff8aa6', 1)]),
    svgSheet(scene, 'walker-blue', 48, 48, [walker('#5a6ad8', '#c0d4ff', 0), walker('#5a6ad8', '#c0d4ff', 1)]),
    svgSheet(scene, 'walker-dust', 48, 48, [walker('#b8865a', '#ffe0b0', 0), walker('#b8865a', '#ffe0b0', 1)]),
    svgSheet(scene, 'walker-pink', 48, 48, [walker('#e05a8a', '#ffd0e0', 0), walker('#e05a8a', '#ffd0e0', 1)]),
    svgSheet(scene, 'walker-amber', 48, 48, [walker('#d88040', '#ffe0a0', 0), walker('#d88040', '#ffe0a0', 1)]),
    svgSheet(scene, 'walker-violet', 48, 48, [walker('#7a4ac8', '#e6d6ff', 0), walker('#7a4ac8', '#e6d6ff', 1)]),
    svgSheet(scene, 'walker-ice', 48, 48, [walker('#3a90c0', '#e8fcff', 0), walker('#3a90c0', '#e8fcff', 1)]),
    svgSheet(scene, 'walker-red', 48, 48, [walker('#d2364a', '#ff8a5e', 0), walker('#d2364a', '#ff8a5e', 1)]),
    svgImage(scene, 'spark', 16, 16, `<circle cx="8" cy="8" r="7" fill="url(#g)"/>`, glow('g', '#ffffff', '#ffffff')),
    svgImage(scene, 'softglow', 64, 64, `<circle cx="32" cy="32" r="32" fill="url(#g)"/>`, glow('g', '#ffffff', '#ffffff')),
    svgImage(scene, 'starpt', 16, 16, `<path d="${star5(8, 8.5, 7.5, 3.2)}" fill="#fff"/>`),
    svgImage(scene, 'ring', 64, 64, `<circle cx="32" cy="32" r="28" fill="none" stroke="#fff" stroke-width="4"/>`),
    svgImage(scene, 'dust', 12, 12, `<circle cx="6" cy="6" r="5" fill="#fff"/>`),
    svgImage(scene, 'winnie-eyeglow', 40, 24, `<ellipse cx="20" cy="12" rx="19" ry="11" fill="url(#g)"/>`, glow('g', '#b6ffb0', '#62c46a')),
  ];
  for (const [k, icon] of Object.entries(ICONS)) jobs.push(svgImage(scene, `sign-${k}`, 96, 86, sign(icon)));
  // ---- Star Station (hub) pieces ----
  jobs.push(svgImage(scene, 'portal-frame', 144, 200,
    `<ellipse cx="72" cy="192" rx="66" ry="8" fill="#000" opacity="0.25"/>` +
    `<path d="M14 196 L14 80 A58 58 0 0 1 130 80 L130 196 Z" fill="#160f3a" stroke="${INK}" stroke-width="4"/>` +
    `<path d="M14 196 L14 80 A58 58 0 0 1 130 80 L130 196" fill="none" stroke="${INK}" stroke-width="24" stroke-linejoin="round"/>` +
    `<path d="M14 196 L14 80 A58 58 0 0 1 130 80 L130 196" fill="none" stroke="#c98a55" stroke-width="17" stroke-linejoin="round"/>` +
    `<path d="M14 196 L14 80 A58 58 0 0 1 130 80 L130 196" fill="none" stroke="#f2c48a" stroke-width="4" stroke-dasharray="3 13"/>` +
    `<path d="M4 196 L140 196" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M6 196 L138 196" stroke="#8a5a3c" stroke-width="5" stroke-linecap="round"/>` +
    `<circle cx="72" cy="20" r="9" fill="#ffe680" stroke="${INK}" stroke-width="3"/>`));
  jobs.push(svgImage(scene, 'stardisc', 128, 128, `<circle cx="64" cy="64" r="62" fill="url(#d)"/><circle cx="64" cy="64" r="44" fill="#fff" opacity="0.85"/><circle cx="64" cy="64" r="44" fill="none" stroke="${INK}" stroke-width="4" opacity="0.6"/><path d="M40 50 Q50 34 66 32" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.9"/>`,
    `<radialGradient id="d"><stop offset="0.6" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`));
  jobs.push(svgImage(scene, 'portal-swirl', 112, 112, `<g fill="none" stroke="#fff" stroke-linecap="round" opacity="0.35" stroke-width="5"><path d="M56 56 m0 -48 a48 48 0 0 1 40 72"/><path d="M56 56 m0 48 a48 48 0 0 1 -40 -72"/><path d="M56 56 m-30 -12 a32 32 0 0 1 50 -8"/><path d="M56 56 m30 12 a32 32 0 0 1 -50 8"/></g>`));
  jobs.push(svgImage(scene, 'lock', 64, 72, `<path d="M16 34 L16 22 Q16 4 32 4 Q48 4 48 22 L48 34" fill="none" stroke="${INK}" stroke-width="11"/><path d="M16 34 L16 22 Q16 4 32 4 Q48 4 48 22 L48 34" fill="none" stroke="#c9ced8" stroke-width="6"/><rect x="6" y="30" width="52" height="40" rx="10" fill="#ffd75e" stroke="${INK}" stroke-width="3.5"/><circle cx="32" cy="46" r="6" fill="${INK}"/><rect x="29" y="48" width="6" height="12" rx="2" fill="${INK}"/>`));
  const door = (inner, col) => `<path d="M8 150 L8 44 Q8 6 48 6 Q88 6 88 44 L88 150 Z" fill="${col}" stroke="${INK}" stroke-width="4"/><path d="M18 140 L18 48 Q18 18 48 18 Q78 18 78 48 L78 140 Z" fill="#000" opacity="0.15"/><circle cx="72" cy="96" r="5" fill="#ffd75e" stroke="${INK}" stroke-width="2"/><rect x="0" y="146" width="96" height="8" rx="4" fill="#8a5a3c" stroke="${INK}" stroke-width="3"/><g transform="translate(48 66)">${inner}</g>`;
  jobs.push(svgImage(scene, 'door-closet', 96, 156, door(`<path d="M-20 -16 L-8 -22 Q0 -14 8 -22 L20 -16 L26 0 L16 4 L16 22 L-16 22 L-16 4 L-26 0 Z" fill="#e63946" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-2 -6 L6 -6 L1 8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`, '#5ec26a')));
  jobs.push(svgImage(scene, 'door-museum', 96, 156, door(`<circle cx="-12" cy="6" r="6" fill="#ffcf4a" stroke="${INK}" stroke-width="2.5"/><circle cx="10" cy="-2" r="16" fill="#ff5a4e" stroke="${INK}" stroke-width="2.5"/>`, '#6f9fd6')));
  jobs.push(svgImage(scene, 'door-trophy', 96, 156, door(`<path d="M-16 -22 L16 -22 L14 -4 Q12 8 0 10 Q-12 8 -14 -4 Z" fill="#ffd75e" stroke="${INK}" stroke-width="3"/><path d="M-16 -18 Q-28 -16 -22 -4 Q-18 2 -13 0 M16 -18 Q28 -16 22 -4 Q18 2 13 0" stroke="${INK}" stroke-width="3" fill="none"/><rect x="-4" y="10" width="8" height="8" fill="#ffd75e" stroke="${INK}" stroke-width="2.5"/><rect x="-12" y="18" width="24" height="7" rx="2" fill="#c98a55" stroke="${INK}" stroke-width="2.5"/>`, '#e8862a')));
  jobs.push(svgImage(scene, 'telescope', 120, 140, `<path d="M60 84 L30 136 M60 84 L90 136 M60 84 L60 136" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M60 84 L30 136 M60 84 L90 136 M60 84 L60 136" stroke="#8a5a3c" stroke-width="4" stroke-linecap="round"/>` +
    `<g transform="rotate(-32 60 70)"><rect x="12" y="56" width="96" height="30" rx="10" fill="#6f9fd6" stroke="${INK}" stroke-width="4"/><rect x="96" y="50" width="20" height="42" rx="6" fill="#c98a55" stroke="${INK}" stroke-width="4"/><rect x="2" y="62" width="14" height="18" rx="4" fill="#c98a55" stroke="${INK}" stroke-width="3"/><rect x="40" y="56" width="8" height="30" fill="#ffd75e" stroke="${INK}" stroke-width="2"/></g><circle cx="60" cy="84" r="7" fill="#ffd75e" stroke="${INK}" stroke-width="3"/>`));
  jobs.push(svgImage(scene, 'catbed', 112, 56, `<ellipse cx="56" cy="40" rx="52" ry="14" fill="#8f7fe0" stroke="${INK}" stroke-width="4"/><ellipse cx="56" cy="34" rx="40" ry="9" fill="#ff9fb0" stroke="${INK}" stroke-width="3"/><path d="M10 38 Q56 60 102 38" fill="none" stroke="#c9bfff" stroke-width="4"/>`));
  jobs.push(svgImage(scene, 'pennant', 200, 60, `<path d="M0 6 Q100 30 200 6" stroke="${INK}" stroke-width="3" fill="none"/>` + [0, 1, 2, 3, 4, 5, 6].map(i => { const x = 14 + i * 28, y = 10 + Math.sin(i / 6 * Math.PI) * 13; return `<path d="M${x - 10} ${y} L${x + 10} ${y} L${x} ${y + 24} Z" fill="${['#ff5a4e', '#ffd75e', '#5ec26a', '#6f9fd6', '#b58aff', '#ff9a3c', '#ff9fb0'][i]}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`; }).join('')));
  await Promise.all(jobs);
}
