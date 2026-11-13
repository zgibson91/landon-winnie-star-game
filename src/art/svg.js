// Turns SVG markup (written in code) into Phaser textures and sprite sheets.
import { ART } from '../core/constants.js';

export const INK = '#2a1f3d';

function toImage(svg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('SVG failed to load: ' + String(e && e.type)));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

// frames: array of SVG inner markup strings, each drawn in a fw x fh box (1x units).
export async function svgSheet(scene, key, fw, fh, frames, defs = '', scale = ART) {
  const n = frames.length;
  const cols = Math.max(1, Math.min(n, Math.floor(4096 / (fw * scale))));
  const rows = Math.ceil(n / cols);
  const W = fw * cols, H = fh * rows;
  const body = frames.map((f, i) => `<g transform="translate(${(i % cols) * fw},${Math.floor(i / cols) * fh})">${f}</g>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * scale}" height="${H * scale}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${body}</svg>`;
  const img = await toImage(svg);
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addSpriteSheet(key, img, { frameWidth: fw * scale, frameHeight: fh * scale, endFrame: n - 1 });
}

export async function svgImage(scene, key, w, h, inner, defs = '', scale = ART) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(w * scale)}" height="${Math.ceil(h * scale)}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${inner}</svg>`;
  const img = await toImage(svg);
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addImage(key, img);
}

// ---- small helpers for writing SVG ----
export const r1 = (v) => Math.round(v * 10) / 10;
const rad = (d) => d * Math.PI / 180;

// A two-segment limb drawn as a thick round stroke with an outline.
// angles in degrees, 0 = straight down, positive = toward +x.
export function limb(x, y, a1, l1, a2, l2, w, color, ow = 2.4, ink = INK) {
  const kx = x + Math.sin(rad(a1)) * l1, ky = y + Math.cos(rad(a1)) * l1;
  const ex = kx + Math.sin(rad(a2)) * l2, ey = ky + Math.cos(rad(a2)) * l2;
  const d = `M${r1(x)} ${r1(y)}L${r1(kx)} ${r1(ky)}L${r1(ex)} ${r1(ey)}`;
  return {
    kx, ky, ex, ey,
    svg: `<path d="${d}" stroke="${ink}" stroke-width="${w + ow * 2}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
         `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
    inner: (c, ww) => `<path d="${d}" stroke="${c}" stroke-width="${ww}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  };
}

export function seg(x1, y1, x2, y2, w, color) {
  return `<path d="M${r1(x1)} ${r1(y1)}L${r1(x2)} ${r1(y2)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
}

export function star5(cx, cy, R, r, rot = -90) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r : R; const a = rad(rot + i * 36);
    d += (i ? 'L' : 'M') + r1(cx + Math.cos(a) * rr) + ' ' + r1(cy + Math.sin(a) * rr);
  }
  return d + 'Z';
}

// Draw onto a canvas and register it as a texture (for tiles and backgrounds).
export function canvasTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  draw(ctx, w, h);
  tex.refresh();
  return tex;
}
