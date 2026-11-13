// Per-star look: terrain tiles (Canvas2D, auto-tiled), parallax backgrounds and themed objects.
import { canvasTexture, svgSheet, svgImage, INK } from './svg.js';
import { ART } from '../core/constants.js';

const T2 = 48 * ART; // tile size in texture pixels
export const PAD = 3; // tileset margin; each tile is extruded into it to avoid seams
const SLOT = T2 + PAD * 2;

export const THEMES = {
  sun: {
    music: 'sun', sky: ['#ffcf6b', '#ff8a3d', '#e2492f'],
    ground: '#d9572b', speck: '#bb4320', crust: '#ffb347', crustHi: '#ffe08a', crustLo: '#e9862f',
    plat: '#5a2a1c', platRim: '#8f4326', platHi: '#b8613a',
    spike: ['#ffe36b', '#ff8a2c'], plasma: ['#fff3a0', '#ffb43a', '#ff6a2a'],
    walker: 'walker-sun', fog: 0xffb347, ember: 0xffd27a,
  },
  betelgeuse: {
    music: 'betelgeuse', sky: ['#5a1033', '#9c1f3a', '#ff5a4e'],
    ground: '#6b1d3c', speck: '#541430', crust: '#ff6b5b', crustHi: '#ffa184', crustLo: '#d8404a',
    plat: '#3a0f26', platRim: '#c9354a', platHi: '#ff7a63',
    spike: ['#ffb3c0', '#e0405a'], plasma: ['#ffd3a0', '#ff6a4a', '#b0203a'],
    walker: 'walker-red', fog: 0xff5a4e, ember: 0xff8a6a,
  },
  station: {
    music: 'hub', sky: ['#120d33', '#2b1d6b', '#4a2f8f'],
    ground: '#5b3d8f', speck: '#4a3078', crust: '#d99a5b', crustHi: '#f2c48a', crustLo: '#b5773f',
    plat: '#6a4a3a', platRim: '#c98a55', platHi: '#e8b07a',
    spike: ['#ffffff', '#bbbbbb'], plasma: ['#9fd8ff', '#5aa0ff', '#3050c0'],
    walker: 'walker-sun', fog: 0x8f7fe0, ember: 0xfff3c4,
  },
};

// Tile indices in the generated tileset.
export const TILE_IDX = { solidBase: 0, oneway: 16, spike: 20 }; // 0..15 = solid by neighbor mask; 16..19 one-way L/M/R/single

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function drawSolid(ctx, x, y, mask, th, seed) {
  const s = T2; const up = mask & 1, right = mask & 2, down = mask & 4, left = mask & 8;
  const r = 26, o = 5; // corner radius, outline width (texture px)
  const tl = !up && !left ? r : 0, tr = !up && !right ? r : 0, br = !down && !right ? r : 0, bl = !down && !left ? r : 0;
  const ex = 6; // overdraw into the padding so neighbouring tiles join without seams
  const x0 = x + (left ? -ex : o / 2), x1 = x + s + (right ? ex : -o / 2), y0 = y + (up ? -ex : o / 2), y1 = y + s + (down ? ex : -o / 2);
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x0 + tl, y0); ctx.lineTo(x1 - tr, y0); if (tr) ctx.quadraticCurveTo(x1, y0, x1, y0 + tr);
    ctx.lineTo(x1, y1 - br); if (br) ctx.quadraticCurveTo(x1, y1, x1 - br, y1);
    ctx.lineTo(x0 + bl, y1); if (bl) ctx.quadraticCurveTo(x0, y1, x0, y1 - bl);
    ctx.lineTo(x0, y0 + tl); if (tl) ctx.quadraticCurveTo(x0, y0, x0 + tl, y0);
    ctx.closePath();
  };
  ctx.save();
  ctx.beginPath(); ctx.rect(x - PAD, y - PAD, s + PAD * 2, s + PAD * 2); ctx.clip();
  path(); ctx.fillStyle = th.ground; ctx.fill();
  // specks / rocks texture
  const rnd = rng(seed);
  ctx.save(); path(); ctx.clip();
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = th.speck; ctx.beginPath();
    ctx.ellipse(x + 10 + rnd() * (s - 20), y + 30 + rnd() * (s - 40), 5 + rnd() * 7, 3 + rnd() * 4, rnd() * 3, 0, Math.PI * 2); ctx.fill();
  }
  if (!up) { // crust on top
    ctx.fillStyle = th.crustLo; ctx.fillRect(x - 4, y0, s + 8, 30);
    ctx.fillStyle = th.crust; ctx.fillRect(x - 4, y0, s + 8, 22);
    ctx.fillStyle = th.crustHi; ctx.fillRect(x - 4, y0 + 4, s + 8, 6);
    // drips
    ctx.fillStyle = th.crustLo;
    for (let i = 0; i < 2; i++) { const dx = x + 16 + rnd() * (s - 32); ctx.beginPath(); ctx.ellipse(dx, y0 + 30, 8, 7, 0, 0, Math.PI); ctx.fill(); }
  }
  ctx.restore();
  // outline on exposed sides
  ctx.lineWidth = o; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  path(); ctx.stroke();
  ctx.restore();
}

function drawOneway(ctx, x, y, kind, th) {
  const s = T2, h = 34, o = 5;
  const lx = kind === 0 || kind === 3 ? x + 6 : x - 8, rx = kind === 2 || kind === 3 ? x + s - 6 : x + s + 8;
  ctx.save(); ctx.beginPath(); ctx.rect(x - PAD, y - PAD, s + PAD * 2, s + PAD * 2); ctx.clip();
  const rr = 16;
  const pth = () => {
    ctx.beginPath();
    const L = kind === 0 || kind === 3, R = kind === 2 || kind === 3;
    ctx.moveTo(lx + (L ? rr : 0), y + o); ctx.lineTo(rx - (R ? rr : 0), y + o);
    if (R) ctx.quadraticCurveTo(rx, y + o, rx, y + o + rr); ctx.lineTo(rx, y + h - (R ? rr : 0));
    if (R) ctx.quadraticCurveTo(rx, y + h, rx - rr, y + h); ctx.lineTo(lx + (L ? rr : 0), y + h);
    if (L) ctx.quadraticCurveTo(lx, y + h, lx, y + h - rr); ctx.lineTo(lx, y + o + (L ? rr : 0));
    if (L) ctx.quadraticCurveTo(lx, y + o, lx + rr, y + o);
    ctx.closePath();
  };
  pth(); ctx.fillStyle = th.plat; ctx.fill();
  ctx.save(); pth(); ctx.clip(); ctx.fillStyle = th.platRim; ctx.fillRect(x - 4, y, s + 8, 15); ctx.fillStyle = th.platHi; ctx.fillRect(x - 4, y + 7, s + 8, 4); ctx.restore();
  ctx.lineWidth = o; ctx.strokeStyle = INK; pth(); ctx.stroke();
  ctx.restore();
}

function drawSpike(ctx, x, y, th) {
  const s = T2;
  const g = ctx.createLinearGradient(0, y + s, 0, y + 30);
  g.addColorStop(0, th.spike[1]); g.addColorStop(1, th.spike[0]);
  ctx.fillStyle = g; ctx.strokeStyle = INK; ctx.lineWidth = 4.5; ctx.lineJoin = 'round';
  for (let i = 0; i < 3; i++) {
    const bx = x + 4 + i * 30;
    ctx.beginPath(); ctx.moveTo(bx, y + s - 2); ctx.lineTo(bx + 14, y + 34); ctx.lineTo(bx + 28, y + s - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 3; i++) { const bx = x + 4 + i * 30; ctx.beginPath(); ctx.moveTo(bx + 12, y + 44); ctx.lineTo(bx + 14, y + 38); ctx.lineTo(bx + 16, y + 50); ctx.fill(); }
}

export function buildTileset(scene, name) {
  const key = `tiles-${name}`;
  if (scene.textures.exists(key)) return key;
  const th = THEMES[name];
  const at = (i) => [PAD + (i % 8) * SLOT, PAD + Math.floor(i / 8) * SLOT];
  canvasTexture(scene, key, SLOT * 8, SLOT * 3, (ctx) => {
    for (let m = 0; m < 16; m++) drawSolid(ctx, ...at(m), m, th, 1234 + m * 77);
    for (let k = 0; k < 4; k++) drawOneway(ctx, ...at(16 + k), k, th);
    drawSpike(ctx, ...at(20), th);
  });
  return key;
}

// ---------- backgrounds ----------
function skyTexture(scene, name) {
  const key = `sky-${name}`;
  if (scene.textures.exists(key)) return key;
  const th = THEMES[name];
  canvasTexture(scene, key, 8, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, th.sky[0]); g.addColorStop(0.55, th.sky[1]); g.addColorStop(1, th.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  return key;
}

function farLayer(scene, name) {
  const key = `far-${name}`;
  if (scene.textures.exists(key)) return key;
  const W = 1024 * ART, H = 720 * ART;
  canvasTexture(scene, key, W, H, (ctx) => {
    const rnd = rng(name.length * 999);
    if (name === 'sun') {
      // giant convection cells (granules) glowing in the distance
      for (let i = 0; i < 60; i++) {
        const x = rnd() * W, y = H * 0.25 + rnd() * H * 0.75, r = 60 + rnd() * 120;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,240,170,0.35)'); g.addColorStop(1, 'rgba(255,160,60,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      // distant prominence arcs
      ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const x = 150 + i * 420 + rnd() * 100, w2 = 160 + rnd() * 160, hh = 200 + rnd() * 260;
        ctx.strokeStyle = 'rgba(255,120,60,0.45)'; ctx.lineWidth = 34;
        ctx.beginPath(); ctx.moveTo(x - w2, H); ctx.bezierCurveTo(x - w2, H - hh * 1.3, x + w2, H - hh * 1.3, x + w2, H); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,220,140,0.35)'; ctx.lineWidth = 12; ctx.stroke();
      }
    } else if (name === 'betelgeuse') {
      // swirling crimson dust and a huge dim star surface glow
      for (let i = 0; i < 40; i++) {
        const x = rnd() * W, y = rnd() * H, r = 80 + rnd() * 200;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(255,${90 + Math.floor(rnd() * 60)},80,0.25)`); g.addColorStop(1, 'rgba(120,20,50,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < 160; i++) { ctx.fillStyle = `rgba(255,220,200,${0.2 + rnd() * 0.5})`; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H * 0.6, 1 + rnd() * 2.5, 0, Math.PI * 2); ctx.fill(); }
    } else {
      // night sky for Star Station
      for (let i = 0; i < 380; i++) { ctx.fillStyle = `rgba(255,255,240,${0.3 + rnd() * 0.7})`; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 0.8 + rnd() * 2.6, 0, Math.PI * 2); ctx.fill(); }
      for (let i = 0; i < 6; i++) {
        const x = rnd() * W, y = rnd() * H * 0.7, r = 200 + rnd() * 260;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const hue = ['255,120,200', '120,160,255', '160,120,255'][i % 3];
        g.addColorStop(0, `rgba(${hue},0.22)`); g.addColorStop(1, `rgba(${hue},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    }
  });
  return key;
}

function midLayer(scene, name) {
  const key = `mid-${name}`;
  if (scene.textures.exists(key)) return key;
  const th = THEMES[name];
  const W = 1024 * ART, H = 360 * ART;
  canvasTexture(scene, key, W, H, (ctx) => {
    const rnd = rng(name.length * 31 + 7);
    // rolling hills silhouette with soft top highlight (tileable: endpoints match)
    const pts = [];
    for (let i = 0; i <= 16; i++) pts.push(H * 0.45 + Math.sin(i / 16 * Math.PI * 4) * 50 + (i % 16 === 0 ? 0 : (rnd() - 0.5) * 80));
    const draw = (off, col, alpha) => {
      ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
      for (let i = 0; i <= 16; i++) { const x = i / 16 * W; const y = pts[i] + off; if (i === 0) ctx.lineTo(x, y); else { const px = (i - 0.5) / 16 * W; ctx.quadraticCurveTo(px, pts[i - 1] + off, x, y); } }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    };
    if (name === 'station') { draw(40, '#1f1650', 1); draw(90, '#16103d', 1); }
    else { draw(0, th.crustLo, 0.55); draw(70, th.ground, 0.75); }
  });
  return key;
}

export function buildBackground(scene, name) {
  return { sky: skyTexture(scene, name), far: farLayer(scene, name), mid: midLayer(scene, name) };
}

// ---------- themed objects (SVG) ----------
function capsule(fill, rim, hi, h, glowCol) {
  // Three 24-wide frames (left cap, stretchable middle, right cap). Strokes are open paths so the
  // joins between frames never show a dark seam.
  const rr = Math.min(h / 2, 12), t = 2.5, bt = h - 2.5;
  const shade = (x0) => `<rect x="${x0}" y="${t}" width="26" height="${h * 0.42 - t}" fill="${rim}"/><rect x="${x0}" y="${h * 0.18}" width="26" height="2.5" fill="${hi}"/>`;
  const left = () => {
    const d = `M25 ${t} L${1.5 + rr} ${t} Q1.5 ${t} 1.5 ${t + rr} L1.5 ${bt - rr} Q1.5 ${bt} ${1.5 + rr} ${bt} L25 ${bt} Z`;
    const open = `M26 ${t} L${1.5 + rr} ${t} Q1.5 ${t} 1.5 ${t + rr} L1.5 ${bt - rr} Q1.5 ${bt} ${1.5 + rr} ${bt} L26 ${bt}`;
    return `<clipPath id="cl"><path d="${d}"/></clipPath><path d="${d}" fill="${fill}"/><g clip-path="url(#cl)">${shade(0)}</g>` +
      (glowCol ? `<path d="${open}" fill="none" stroke="${glowCol}" stroke-width="6" opacity="0.35"/>` : '') +
      `<path d="${open}" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
  };
  const right = () => {
    const d = `M-1 ${t} L${22.5 - rr} ${t} Q22.5 ${t} 22.5 ${t + rr} L22.5 ${bt - rr} Q22.5 ${bt} ${22.5 - rr} ${bt} L-1 ${bt} Z`;
    const open = `M-2 ${t} L${22.5 - rr} ${t} Q22.5 ${t} 22.5 ${t + rr} L22.5 ${bt - rr} Q22.5 ${bt} ${22.5 - rr} ${bt} L-2 ${bt}`;
    return `<clipPath id="cr"><path d="${d}"/></clipPath><path d="${d}" fill="${fill}"/><g clip-path="url(#cr)">${shade(-2)}</g>` +
      (glowCol ? `<path d="${open}" fill="none" stroke="${glowCol}" stroke-width="6" opacity="0.35"/>` : '') +
      `<path d="${open}" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
  };
  const mid = `<rect x="-1" y="${t}" width="26" height="${bt - t}" fill="${fill}"/>${shade(-1)}` +
    (glowCol ? `<path d="M-1 ${t} L25 ${t} M-1 ${bt} L25 ${bt}" stroke="${glowCol}" stroke-width="6" opacity="0.35"/>` : '') +
    `<path d="M-1 ${t} L25 ${t} M-1 ${bt} L25 ${bt}" stroke="${INK}" stroke-width="2.5"/>`;
  return [left(), mid, right()];
}

export async function buildThemeObjects(scene, name) {
  if (scene.textures.exists(`cap-hidden`) && scene.textures.exists(`obj-done-${name}`)) return;
  const jobs = [];
  const add = (key, w, h, frames, defs = '') => { if (!scene.textures.exists(key)) jobs.push(svgSheet(scene, key, w, h, frames, defs)); };
  add('cap-sunspot', 24, 28, capsule('#4a2016', '#7a3420', '#a24d2a', 28, null));
  add('cap-hidden', 24, 26, capsule('#6f5ce0', '#a99cff', '#e4ddff', 26, '#d6ccff'));
  add('cap-pulse', 24, 30, capsule('#b0283f', '#ff6b5b', '#ffc0a0', 30, '#ff8a6a'));
  add('cap-wood', 24, 24, capsule('#8a5a3c', '#c98a55', '#f2c48a', 24, null));
  add('cap-metal', 24, 26, capsule('#5d6b9a', '#9aa8d8', '#e0e8ff', 26, null));
  // Solar flare column, 4 flicker frames (72 x 360)
  const flare = (i) => {
    const wob = (k) => Math.sin(i * 1.7 + k) * 5;
    let d = 'M10 360 ';
    for (let y = 340; y >= 30; y -= 30) d += `Q${4 + wob(y)} ${y + 15} ${10 + wob(y + 1)} ${y} `;
    d += `Q36 ${-6 + wob(2)} 62 30 `;
    for (let y = 30; y <= 340; y += 30) d += `Q${68 + wob(y + 3)} ${y + 15} ${62 + wob(y + 4)} ${y + 30} `;
    d += 'Z';
    return `<path d="${d}" fill="url(#fg)" stroke="#ff5a1f" stroke-width="3"/><path d="M28 360 Q${22 + wob(5)} 200 30 60 Q36 30 42 60 Q${50 + wob(6)} 200 44 360 Z" fill="#fff7c0" opacity="0.85"/>`;
  };
  add('flare', 72, 360, [0, 1, 2, 3].map(flare), `<linearGradient id="fg" x1="0" x2="1"><stop offset="0" stop-color="#ff7b2c"/><stop offset="0.5" stop-color="#ffd25a"/><stop offset="1" stop-color="#ff7b2c"/></linearGradient>`);
  // Magnetic loop bouncer (144 x 100): glowing arc
  add('loop', 144, 100, [0, 1].map(i => {
    const h = i ? 22 : 14;
    return `<path d="M14 100 C14 ${h} 130 ${h} 130 100" stroke="#ff7b2c" stroke-width="20" fill="none" stroke-linecap="round" opacity="0.55"/>` +
      `<path d="M14 100 C14 ${h} 130 ${h} 130 100" stroke="${INK}" stroke-width="14" fill="none" stroke-linecap="round"/>` +
      `<path d="M14 100 C14 ${h} 130 ${h} 130 100" stroke="#ffb347" stroke-width="9" fill="none" stroke-linecap="round"/>` +
      `<path d="M14 100 C14 ${h} 130 ${h} 130 100" stroke="#fff3a0" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="10 12"/>` +
      `<ellipse cx="72" cy="${h + 20}" rx="26" ry="8" fill="#ffe36b" stroke="${INK}" stroke-width="2.5"/>`;
  }));
  // Goal: Star Gate
  add('gate', 128, 176, [
    `<ellipse cx="64" cy="164" rx="56" ry="11" fill="#2a1f3d" opacity="0.35"/>` +
    `<path d="M14 166 L14 72 A50 50 0 0 1 114 72 L114 166" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round"/>` +
    `<path d="M14 166 L14 72 A50 50 0 0 1 114 72 L114 166" fill="none" stroke="#8f7fe0" stroke-width="15" stroke-linecap="round"/>` +
    `<path d="M14 166 L14 72 A50 50 0 0 1 114 72 L114 166" fill="none" stroke="#c9bfff" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 14"/>` +
    `<circle cx="64" cy="20" r="10" fill="#ffe680" stroke="${INK}" stroke-width="3"/>`,
  ]);
  add('gate-swirl', 96, 96, [`<circle cx="48" cy="48" r="46" fill="url(#gs)"/><path d="M48 48 m0 -40 a40 40 0 0 1 34 60 M48 48 m0 40 a40 40 0 0 1 -34 -60 M48 48 m-24 -10 a26 26 0 0 1 40 -6 M48 48 m24 10 a26 26 0 0 1 -40 6" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.8"/>`],
    `<radialGradient id="gs"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.5" stop-color="#b5a6ff"/><stop offset="1" stop-color="#6f5ce0"/></radialGradient>`);
  // Winnie shrine: cushion pedestal with an orb
  add('shrine', 96, 112, [`<path d="M18 110 L26 66 L70 66 L78 110 Z" fill="#8f7fe0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M22 86 L74 86" stroke="#c9bfff" stroke-width="4"/>` +
    `<ellipse cx="48" cy="64" rx="34" ry="10" fill="#ff9fb0" stroke="${INK}" stroke-width="3"/><circle cx="48" cy="34" r="24" fill="url(#og)" stroke="${INK}" stroke-width="3"/><path d="M36 24 Q42 16 50 16" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>`],
    `<radialGradient id="og" cx="0.4" cy="0.35"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#bff0ff"/><stop offset="1" stop-color="#6f9fd6"/></radialGradient>`);
  // Gate barrier (48 x 144) for switch doors
  add('barrier', 48, 144, [0, 1].map(i => `<rect x="6" y="2" width="36" height="140" rx="10" fill="#3b2b6b" stroke="${INK}" stroke-width="3"/>` +
    [0, 1, 2].map(k => `<rect x="${12 + k * 9}" y="10" width="5" height="124" rx="2.5" fill="${i ? '#ffe680' : '#b5a6ff'}"/>`).join('') +
    `<circle cx="24" cy="72" r="9" fill="#ffd75e" stroke="${INK}" stroke-width="2.5"/><rect x="21" y="70" width="6" height="9" rx="1" fill="${INK}"/><path d="M20.5 70 L20.5 66 Q24 61 27.5 66 L27.5 70" stroke="${INK}" stroke-width="2" fill="none"/>`));
  // progress lamp for puzzles
  add('lamp', 24, 24, [0, 1, 2].map(i => `<circle cx="12" cy="12" r="9" fill="${['#4a3b78', '#7dff9a', '#ff6b6b'][i]}" stroke="${INK}" stroke-width="2.5"/><circle cx="9" cy="9" r="2.5" fill="#fff" opacity="0.7"/>`));
  // spike strip for pulse spikes (48x48 single)
  add('pulsespike', 48, 48, [`<g stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" fill="#ffb3c0">` + [0, 1, 2].map(k => `<path d="M${2 + k * 15} 47 L${9.5 + k * 15} 10 L${17 + k * 15} 47 Z"/>`).join('') + `</g>`]);
  // plasma surface strip (tileable 96 x 48)
  add(`plasma-${name}`, 96, 48, [0].map(() => {
    const th = THEMES[name];
    return `<rect x="0" y="12" width="96" height="36" fill="${th.plasma[2]}"/><path d="M0 14 Q12 4 24 14 T48 14 T72 14 T96 14 L96 26 L0 26Z" fill="${th.plasma[1]}"/><path d="M0 14 Q12 4 24 14 T48 14 T72 14 T96 14" stroke="${th.plasma[0]}" stroke-width="4" fill="none"/><circle cx="20" cy="34" r="4" fill="${th.plasma[1]}" opacity="0.7"/><circle cx="66" cy="40" r="3" fill="${th.plasma[1]}" opacity="0.7"/>`;
  }));
  add(`obj-done-${name}`, 2, 2, ['']);
  await Promise.all(jobs);
}
