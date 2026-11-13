// Per-star look: terrain tiles (Canvas2D, auto-tiled), parallax backgrounds and themed objects.
import { canvasTexture, svgSheet, svgImage, INK } from './svg.js';
import { ART } from '../core/constants.js';
import { buildBatch3Art } from './batch3.js';

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
  arcturus: {
    music: 'arcturus', sky: ['#ffb36b', '#ff8a4a', '#c8503a'],
    ground: '#b8642e', speck: '#9a5022', crust: '#ffc36b', crustHi: '#ffe7a8', crustLo: '#e0903f',
    plat: '#6b3a22', platRim: '#c07040', platHi: '#e8a060',
    spike: ['#fff0b0', '#ff9a3c'], plasma: ['#fff0b0', '#ffb04a', '#e0602a'],
    walker: 'walker-orange', fog: 0xffc36b, ember: 0xffe0a0,
  },
  mucephei: {
    music: 'mucephei', sky: ['#1a0716', '#3d0c2a', '#6e1238'],
    ground: '#3a1430', speck: '#2a0c22', crust: '#d22a52', crustHi: '#ff7a9a', crustLo: '#8e1a3a',
    plat: '#2a0c22', platRim: '#c0284c', platHi: '#ff8aa6',
    spike: ['#ffd0dc', '#d22a52'], plasma: ['#ffb0c4', '#d22a52', '#5a0a24'],
    walker: 'walker-garnet', fog: 0xd22a52, ember: 0xff8aa6,
  },
  vvcephei: {
    music: 'vvcephei', sky: ['#2b1a5a', '#7a3a6a', '#ff8a5a'],
    ground: '#4a3a6a', speck: '#3a2c58', crust: '#ffb07a', crustHi: '#ffe0c0', crustLo: '#d07a5a',
    plat: '#2c2450', platRim: '#9fb8ff', platHi: '#e0ecff',
    spike: ['#e0ecff', '#7a8ad8'], plasma: ['#d0e0ff', '#6a7ae0', '#2a2a7a'],
    walker: 'walker-blue', fog: 0x9fd8ff, ember: 0xfff0d0,
  },
  vycma: {
    music: 'vycma', sky: ['#3a1e1a', '#8a4a2e', '#e0a060'],
    ground: '#7a4630', speck: '#5e3424', crust: '#e8b070', crustHi: '#ffe0a8', crustLo: '#b87a48',
    plat: '#4a2a1e', platRim: '#c08050', platHi: '#f0c088',
    spike: ['#ffe0b0', '#c87a48'], plasma: ['#ffe0a0', '#e09048', '#8a3a1e'],
    walker: 'walker-dust', fog: 0xc89060, ember: 0xffe0b0,
  },
  uyscuti: {
    music: 'uyscuti', sky: ['#1a0820', '#5a1a48', '#ff7a8a'],
    ground: '#4a2050', speck: '#381840', crust: '#ff8aa0', crustHi: '#ffd0dc', crustLo: '#c0506a',
    plat: '#30143a', platRim: '#ff7a9a', platHi: '#ffc0d0',
    spike: ['#ffe0ec', '#e05a80'], plasma: ['#ffd0e0', '#ff6a8a', '#7a1a3a'],
    walker: 'walker-pink', fog: 0xff7a9a, ember: 0xffd0e0,
  },
  stephenson: {
    music: 'stephenson', sky: ['#0c0414', '#3a0a30', '#b0204a'],
    ground: '#341832', speck: '#241024', crust: '#ff4a6a', crustHi: '#ffb0c0', crustLo: '#a0203a',
    plat: '#200a20', platRim: '#e0405a', platHi: '#ffa0b0',
    spike: ['#ffd0d8', '#e0405a'], plasma: ['#ffc0a0', '#ff4a3a', '#7a0a1a'],
    walker: 'walker-red', fog: 0xff4a6a, ember: 0xffb0c0,
  },
  wohg64: {
    music: 'wohg64', sky: ['#0a1428', '#3a2a4a', '#e0905a'],
    ground: '#5a3a3a', speck: '#463030', crust: '#ffb070', crustHi: '#ffe0b0', crustLo: '#c87848',
    plat: '#3a2430', platRim: '#ffa060', platHi: '#ffd8a8',
    spike: ['#ffe8c8', '#e08048'], plasma: ['#ffe0a0', '#ff9048', '#8a3020'],
    walker: 'walker-amber', fog: 0xffb070, ember: 0xffe0b0,
  },
  quasistar: {
    music: 'quasistar', sky: ['#04020c', '#1e0c3a', '#6a2a96'],
    ground: '#2c1a4a', speck: '#20123a', crust: '#b58aff', crustHi: '#e6d6ff', crustLo: '#7a4ac8',
    plat: '#1a0c30', platRim: '#c49aff', platHi: '#f0e6ff',
    spike: ['#f0e6ff', '#9a6ae0'], plasma: ['#e6d6ff', '#9a5aff', '#30105a'],
    walker: 'walker-violet', fog: 0xb58aff, ember: 0xe6d6ff,
  },
  neutron: {
    music: 'neutron', sky: ['#020814', '#0a2a4a', '#2a7ab0'],
    ground: '#1e3a5a', speck: '#163048', crust: '#8fe8ff', crustHi: '#e8fcff', crustLo: '#4ab0d8',
    plat: '#102438', platRim: '#8fe8ff', platHi: '#e8fcff',
    spike: ['#ffffff', '#6ac8f0'], plasma: ['#e8fcff', '#6ac8f0', '#103a6a'],
    walker: 'walker-ice', fog: 0x8fe8ff, ember: 0xe8fcff,
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
export const TILE_IDX = { solidBase: 0, oneway: 16, spike: 20, light: 21, dark: 22, spikeDown: 23 }; // 0..15 = solid by neighbor mask; 16..19 one-way L/M/R/single

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

// Light-side and shadow-side blocks for VV Cephei (only one kind is solid at a time).
function drawPhaseBlock(ctx, x, y, dark) {
  const s = T2, o = 5;
  const fill = dark ? '#4a5ad8' : '#ffb84a', hi = dark ? '#9fb8ff' : '#fff0a0', lo = dark ? '#2c3490' : '#d8782a';
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x + 4, y + 4, s - 8, s - 8, 16);
  ctx.fillStyle = fill; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = lo; ctx.fillRect(x, y + s - 22, s, 22);
  ctx.fillStyle = hi; ctx.fillRect(x + 12, y + 12, s - 40, 7);
  ctx.restore();
  ctx.lineWidth = o; ctx.strokeStyle = INK; ctx.stroke();
  // emblem: sun or moon
  ctx.translate(x + s / 2, y + s / 2 + 2);
  ctx.fillStyle = dark ? '#e0ecff' : '#fff6c9'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  if (dark) { ctx.beginPath(); ctx.arc(0, 0, 15, 0.6, Math.PI * 2 - 0.6); ctx.arc(9, 0, 11, Math.PI * 2 - 0.9, 0.9, true); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else {
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14); ctx.lineTo(Math.cos(a) * 21, Math.sin(a) * 21); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
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
    drawPhaseBlock(ctx, ...at(21), false);
    drawPhaseBlock(ctx, ...at(22), true);
    { const [sx, sy] = at(23); ctx.save(); ctx.translate(sx, sy + T2); ctx.scale(1, -1); drawSpike(ctx, 0, 0, th); ctx.restore(); }
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
    } else if (name === 'arcturus') {
      // warm haze with huge slow cloud banks
      for (let i = 0; i < 26; i++) {
        const x = rnd() * W, y = H * 0.2 + rnd() * H * 0.7, rx = 180 + rnd() * 260, ry = 40 + rnd() * 60;
        ctx.fillStyle = `rgba(255,${200 + Math.floor(rnd() * 40)},150,${0.12 + rnd() * 0.12})`;
        ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,240,200,0.35)'; ctx.beginPath(); ctx.arc(W * 0.7, H * 0.25, 120, 0, Math.PI * 2); ctx.fill();
    } else if (name === 'mucephei') {
      // dark crystal cavern: glowing gem clusters in the distance
      for (let i = 0; i < 70; i++) {
        const x = rnd() * W, y = rnd() * H, h = 30 + rnd() * 120, w = 12 + rnd() * 26;
        ctx.fillStyle = `rgba(${200 + Math.floor(rnd() * 55)},40,90,${0.15 + rnd() * 0.25})`;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h * 0.3); ctx.lineTo(x + w * 0.6, y + h); ctx.lineTo(x - w * 0.4, y + h * 0.7); ctx.closePath(); ctx.fill();
      }
      for (let i = 0; i < 120; i++) { ctx.fillStyle = `rgba(255,170,200,${0.2 + rnd() * 0.5})`; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 1 + rnd() * 2, 0, Math.PI * 2); ctx.fill(); }
    } else if (name === 'vycma') {
      // a huge dusty sky: rolling brown cloud banks and drifting grit
      for (let i = 0; i < 40; i++) {
        const x = rnd() * W, y = rnd() * H, rx = 160 + rnd() * 300, ry = 50 + rnd() * 90;
        ctx.fillStyle = `rgba(${200 + Math.floor(rnd() * 40)},${130 + Math.floor(rnd() * 40)},90,${0.12 + rnd() * 0.12})`;
        ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rnd() * 0.4, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(255,220,170,${0.15 + rnd() * 0.35})`; ctx.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 3, 1.5); }
    } else if (name === 'uyscuti') {
      // starry pink space with big soft rings (things look the same upside down!)
      for (let i = 0; i < 300; i++) { ctx.fillStyle = `rgba(255,230,240,${0.3 + rnd() * 0.6})`; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 0.8 + rnd() * 2.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.lineWidth = 18;
      for (let i = 0; i < 5; i++) { ctx.strokeStyle = `rgba(255,140,170,${0.08 + rnd() * 0.08})`; ctx.beginPath(); ctx.ellipse(rnd() * W, rnd() * H, 200 + rnd() * 200, 60 + rnd() * 60, rnd(), 0, Math.PI * 2); ctx.stroke(); }
    } else if (name === 'stephenson') {
      // a crowded star cluster: lots of big red and white stars
      for (let i = 0; i < 70; i++) {
        const x = rnd() * W, y = rnd() * H, r = 20 + rnd() * 60;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const red = rnd() < 0.7;
        g.addColorStop(0, red ? 'rgba(255,140,120,0.8)' : 'rgba(230,240,255,0.8)'); g.addColorStop(1, 'rgba(255,80,100,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < 300; i++) { ctx.fillStyle = `rgba(255,220,220,${0.3 + rnd() * 0.6})`; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 0.8 + rnd() * 2, 0, Math.PI * 2); ctx.fill(); }
    } else if (name === 'vvcephei') {
      // the big red star on one side, its hot blue partner on the other
      let g = ctx.createRadialGradient(W * 0.2, H * 0.35, 0, W * 0.2, H * 0.35, 420);
      g.addColorStop(0, 'rgba(255,170,110,0.75)'); g.addColorStop(1, 'rgba(255,120,90,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W * 0.2, H * 0.35, 420, 0, Math.PI * 2); ctx.fill();
      g = ctx.createRadialGradient(W * 0.75, H * 0.25, 0, W * 0.75, H * 0.25, 160);
      g.addColorStop(0, 'rgba(220,240,255,0.95)'); g.addColorStop(0.4, 'rgba(140,190,255,0.6)'); g.addColorStop(1, 'rgba(120,160,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W * 0.75, H * 0.25, 160, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 200; i++) { ctx.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.6})`; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 0.8 + rnd() * 2, 0, Math.PI * 2); ctx.fill(); }
    } else if (name === 'wohg64') {
      // another galaxy: a smudge of faraway stars (the Large Magellanic Cloud) and a giant tilted dust ring
      for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(255,240,220,${0.25 + rnd() * 0.6})`; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 0.8 + rnd() * 2, 0, Math.PI * 2); ctx.fill(); }
      for (let i = 0; i < 30; i++) {
        const x = W * 0.15 + rnd() * W * 0.3, y = H * 0.12 + rnd() * H * 0.2, r = 30 + rnd() * 70;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(200,220,255,0.18)'); g.addColorStop(1, 'rgba(200,220,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      const g = ctx.createRadialGradient(W * 0.68, H * 0.42, 0, W * 0.68, H * 0.42, 200);
      g.addColorStop(0, 'rgba(255,220,170,0.95)'); g.addColorStop(0.35, 'rgba(255,150,90,0.6)'); g.addColorStop(1, 'rgba(255,120,80,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W * 0.68, H * 0.42, 200, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = `rgba(${230 - k * 20},${150 - k * 20},${100 - k * 10},${0.35 - k * 0.08})`; ctx.lineWidth = 46 - k * 12;
        ctx.beginPath(); ctx.ellipse(W * 0.68, H * 0.42, 420 + k * 70, 120 + k * 22, -0.25, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (name === 'quasistar') {
      // the black hole heart: a huge dark circle ringed with glowing gas, and stars being pulled in
      const cx = W * 0.6, cy = H * 0.38;
      for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(230,214,255,${0.2 + rnd() * 0.6})`; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 0.8 + rnd() * 2, 0, Math.PI * 2); ctx.fill(); }
      for (let k = 0; k < 4; k++) {
        ctx.strokeStyle = `rgba(${255 - k * 30},${150 + k * 20},${120 + k * 40},${0.45 - k * 0.08})`; ctx.lineWidth = 34 - k * 6;
        ctx.beginPath(); ctx.ellipse(cx, cy, 300 + k * 60, 80 + k * 16, 0.12, 0, Math.PI * 2); ctx.stroke();
      }
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220);
      g.addColorStop(0, 'rgba(2,0,8,1)'); g.addColorStop(0.55, 'rgba(10,0,30,1)'); g.addColorStop(0.7, 'rgba(180,120,255,0.8)'); g.addColorStop(1, 'rgba(120,60,200,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 220, 0, Math.PI * 2); ctx.fill();
    } else if (name === 'neutron') {
      // icy sky, sweeping light beams in the distance
      for (let i = 0; i < 320; i++) { ctx.fillStyle = `rgba(220,250,255,${0.25 + rnd() * 0.6})`; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 0.8 + rnd() * 2, 0, Math.PI * 2); ctx.fill(); }
      const cx = W * 0.3, cy = H * 0.3;
      for (const a of [0.5, 0.5 + Math.PI]) {
        const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * 900, cy + Math.sin(a) * 900);
        g.addColorStop(0, 'rgba(180,240,255,0.5)'); g.addColorStop(1, 'rgba(180,240,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a - 0.08) * 1400, cy + Math.sin(a - 0.08) * 1400); ctx.lineTo(cx + Math.cos(a + 0.08) * 1400, cy + Math.sin(a + 0.08) * 1400); ctx.closePath(); ctx.fill();
      }
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(160,240,255,0.8)'); g.addColorStop(1, 'rgba(80,160,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 90, 0, Math.PI * 2); ctx.fill();
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
  add('cap-rock', 24, 34, capsule('#8a4a26', '#d08048', '#ffc890', 34, null));
  add('cap-crystal', 24, 26, capsule('#7a1236', '#ff5a86', '#ffd0dc', 26, '#ff8aa6'));
  add('cap-star', 24, 26, capsule('#4a3a8a', '#ffb07a', '#fff0d0', 26, '#ffd0a0'));
  // Lever / star switch (pounce target): off, on
  add('lever', 48, 64, [0, 1].map(i => `<rect x="20" y="30" width="8" height="32" rx="4" fill="#6d5aa8" stroke="${INK}" stroke-width="2.5"/>` +
    `<circle cx="24" cy="24" r="18" fill="${i ? '#7dff9a' : '#ffd75e'}" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M24 12 L27.5 20.5 L36.5 21 L29.5 26.5 L32 35 L24 30 L16 35 L18.5 26.5 L11.5 21 L20.5 20.5 Z" fill="${i ? '#fff' : '#fff6c9'}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`));
  // Mirror block: frame 0 = "/" , frame 1 = "\"
  add('mirror', 48, 48, [0, 1].map(i => `<rect x="2" y="2" width="44" height="44" rx="9" fill="#5a2a4a" stroke="${INK}" stroke-width="3"/>` +
    `<g transform="rotate(${i ? 45 : -45} 24 24)"><rect x="3" y="19" width="42" height="10" rx="4" fill="#e8f4ff" stroke="${INK}" stroke-width="2.5"/><rect x="6" y="21" width="20" height="3" rx="1.5" fill="#fff"/></g>` +
    `<circle cx="24" cy="24" r="4" fill="#ffd75e" stroke="${INK}" stroke-width="1.6"/>`));
  // Beam emitter (a crystal lamp) and receiver crystal (off / lit)
  add('emitter', 48, 48, [`<rect x="4" y="8" width="40" height="32" rx="10" fill="#3a1430" stroke="${INK}" stroke-width="3"/><circle cx="34" cy="24" r="10" fill="#fff4b0" stroke="${INK}" stroke-width="2.5"/><circle cx="34" cy="24" r="5" fill="#fff"/>`]);
  add('receiver', 48, 48, [0, 1].map(i => `<path d="M24 3 L40 18 L34 45 L14 45 L8 18 Z" fill="${i ? '#7dff9a' : '#8a3a5a'}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M24 3 L24 45 M8 18 L40 18" stroke="${i ? '#d0ffd8' : '#c06080'}" stroke-width="2"/><path d="M16 12 L21 8" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`));
  // Squeeze hole (tiny cat-sized tunnel mouth)
  add('vent', 48, 48, [`<path d="M4 48 L4 30 Q4 12 24 12 Q44 12 44 30 L44 48 Z" fill="#1a0a16" stroke="${INK}" stroke-width="3"/><path d="M10 48 L10 32 Q10 18 24 18 Q38 18 38 32 L38 48" fill="none" stroke="#ff8aa6" stroke-width="2" stroke-dasharray="3 5"/><g fill="#ff9fb0"><ellipse cx="24" cy="38" rx="4.5" ry="3.5"/><circle cx="18.5" cy="32" r="2"/><circle cx="22.5" cy="30" r="2"/><circle cx="26.5" cy="30" r="2"/><circle cx="30" cy="32" r="2"/></g>`]);
  // Swap orb for light/shadow (two looks)
  // Sun orb (frame 0) and moon orb (frame 1): touch to switch to that side
  const sunIcon = `<circle cx="32" cy="32" r="9" fill="#fff6c9" stroke="${INK}" stroke-width="2.5"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return `<path d="M${(32 + Math.cos(a) * 12).toFixed(1)} ${(32 + Math.sin(a) * 12).toFixed(1)} L${(32 + Math.cos(a) * 17).toFixed(1)} ${(32 + Math.sin(a) * 17).toFixed(1)}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`; }).join('');
  const moonIcon = `<path d="M37 17 A15 15 0 1 0 37 47 A12 12 0 1 1 37 17 Z" fill="#e0ecff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
  add('swaporb', 64, 64, [0, 1].map(i => `<circle cx="32" cy="32" r="31" fill="url(#so${i})"/><circle cx="32" cy="32" r="21" fill="${i ? '#4a5ad8' : '#ffb84a'}" stroke="${INK}" stroke-width="3"/>` +
    (i ? moonIcon : sunIcon) + `<path d="M19 24 Q23 16 31 14" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>`),
    `<radialGradient id="so0"><stop offset="0.55" stop-color="#fff0b0" stop-opacity="0.8"/><stop offset="1" stop-color="#ffb84a" stop-opacity="0"/></radialGradient><radialGradient id="so1"><stop offset="0.55" stop-color="#c0d4ff" stop-opacity="0.8"/><stop offset="1" stop-color="#4a5ad8" stop-opacity="0"/></radialGradient>`);
  // Song stone: a big round crystal that sleeps (0) and sings (1)
  add('songstone', 80, 112, [0, 1].map(i => `<ellipse cx="40" cy="106" rx="34" ry="6" fill="#000" opacity="0.25"/>` +
    `<path d="M14 106 L18 70 L40 40 L62 70 L66 106 Z" fill="#6a5aa8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M40 8 L64 40 L52 82 L28 82 L16 40 Z" fill="${i ? '#d6ccff' : '#8f7fe0'}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M40 8 L40 82 M16 40 L64 40" stroke="${i ? '#ffffff' : '#b5a6ff'}" stroke-width="2"/>` +
    (i ? `<path d="M28 52 Q32 46 36 52 M44 52 Q48 46 52 52" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/><ellipse cx="40" cy="64" rx="6" ry="5" fill="${INK}"/>`
       : `<path d="M28 52 Q32 56 36 52 M44 52 Q48 56 52 52" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M36 64 L44 64" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`)));
  // Gravity orb: up arrows (0) or down arrows (1)
  add('gravorb', 64, 64, [0, 1].map(i => `<circle cx="32" cy="32" r="31" fill="url(#go)"/><circle cx="32" cy="32" r="21" fill="${i ? '#5ec26a' : '#ff6a9a'}" stroke="${INK}" stroke-width="3"/>` +
    `<g transform="rotate(${i ? 180 : 0} 32 32)"><path d="M22 34 L32 22 L42 34 M22 44 L32 32 L42 44" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`),
    `<radialGradient id="go"><stop offset="0.5" stop-color="#ffd0e0" stop-opacity="0.8"/><stop offset="1" stop-color="#ff6a9a" stop-opacity="0"/></radialGradient>`);
  add('cap-dust', 24, 30, capsule('#7a4a3a', '#d8905a', '#ffd0a0', 30, '#ffc080'));
  add('cap-void', 24, 26, capsule('#2a1650', '#b58aff', '#f0e6ff', 26, '#d6b8ff'));
  add('cap-ice', 24, 26, capsule('#2a5a7a', '#8fe8ff', '#ffffff', 26, '#c8f6ff'));
  add('windstreak', 64, 8, [`<path d="M2 4 L62 4" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.9"/>`]);
  add(`obj-done-${name}`, 2, 2, ['']);
  jobs.push(buildBatch3Art(scene));
  await Promise.all(jobs);
}
