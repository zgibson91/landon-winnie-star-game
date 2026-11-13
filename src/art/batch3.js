// Batch-3 art: the Dust Bunny King (WOH G64 mini-boss), The Reaper (final boss), the little star spirit,
// dust rings, black holes, slow-time bubbles and pulsar beams. All drawn as SVG in code.
import { svgSheet, svgImage, star5, INK, r1 } from './svg.js';

// ---------------- Dust Bunny King: a big fluffy dust ball with a crown ----------------
function fluff(cx, cy, rx, ry, bumps, wob = 0) {
  let d = '';
  for (let i = 0; i <= bumps; i++) {
    const a = i / bumps * Math.PI * 2;
    const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    if (!i) { d += `M${r1(x)} ${r1(y)}`; continue; }
    const am = (i - 0.5) / bumps * Math.PI * 2, k = 1.16 + Math.sin(i * 2.3 + wob) * 0.04;
    d += `Q${r1(cx + Math.cos(am) * rx * k)} ${r1(cy + Math.sin(am) * ry * k)} ${r1(x)} ${r1(y)}`;
  }
  return d + 'Z';
}

function dustKing(pose) {
  // 160 x 128 box, feet at y = 124
  const sq = { idle: [1, 1], wind: [1.12, 0.88], roll: [1, 1], dizzy: [1.04, 0.96], hurt: [1.3, 0.6] }[pose];
  const cx = 80, cy = 124 - 52 * sq[1], rx = 58 * sq[0], ry = 52 * sq[1];
  let s = `<ellipse cx="80" cy="124" rx="${r1(rx * 0.9)}" ry="6" fill="#000" opacity="0.25"/>`;
  if (pose === 'roll') {
    s += [0, 1, 2].map(i => `<path d="M${10 + i * 6} ${70 + i * 18} L${-10 + i * 6} ${70 + i * 18}" stroke="#ffe0b0" stroke-width="5" stroke-linecap="round" opacity="0.7"/>`).join('');
  }
  s += `<path d="${fluff(cx, cy, rx, ry, 18, pose.length)}" fill="#d8a070" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
  s += `<path d="${fluff(cx - 6, cy - 6, rx * 0.72, ry * 0.66, 14, 1)}" fill="#ecc090" opacity="0.8"/>`;
  // specks
  s += [[-30, 18], [26, 22], [-8, 30], [36, -6], [-40, -4]].map(([x, y]) => `<circle cx="${cx + x * sq[0]}" cy="${cy + y * sq[1]}" r="3" fill="#a87048" opacity="0.6"/>`).join('');
  if (pose !== 'roll') {
    // feet
    s += `<ellipse cx="${cx - 26}" cy="122" rx="14" ry="6" fill="#a87048" stroke="${INK}" stroke-width="2.5"/><ellipse cx="${cx + 26}" cy="122" rx="14" ry="6" fill="#a87048" stroke="${INK}" stroke-width="2.5"/>`;
    // crown
    const ct = cy - ry - 6;
    s += `<path d="M${cx - 24} ${ct + 18} L${cx - 26} ${ct - 6} L${cx - 12} ${ct + 6} L${cx} ${ct - 12} L${cx + 12} ${ct + 6} L${cx + 26} ${ct - 6} L${cx + 24} ${ct + 18} Z" fill="#ffd75e" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<circle cx="${cx}" cy="${ct + 6}" r="4" fill="#ff5a8a" stroke="${INK}" stroke-width="1.8"/>`;
    // face
    const ey = cy - 8;
    if (pose === 'dizzy' || pose === 'hurt') {
      const sw = (x) => `<path d="M${x - 9} ${ey} a9 9 0 1 1 9 9 a5 5 0 1 1 -5 -5" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      s += `<circle cx="${cx - 20}" cy="${ey}" r="14" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="${cx + 20}" cy="${ey}" r="14" fill="#fff" stroke="${INK}" stroke-width="2.5"/>` + sw(cx - 20) + sw(cx + 20);
      s += `<path d="M${cx - 12} ${ey + 26} Q${cx - 4} ${ey + 20} ${cx} ${ey + 26} Q${cx + 4} ${ey + 32} ${cx + 12} ${ey + 26}" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    } else {
      const look = pose === 'wind' ? 4 : 0;
      s += `<ellipse cx="${cx - 20}" cy="${ey}" rx="13" ry="15" fill="#fff" stroke="${INK}" stroke-width="2.5"/><ellipse cx="${cx + 20}" cy="${ey}" rx="13" ry="15" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`;
      s += `<circle cx="${cx - 17 + look}" cy="${ey + 3}" r="6.5" fill="${INK}"/><circle cx="${cx + 23 + look}" cy="${ey + 3}" r="6.5" fill="${INK}"/><circle cx="${cx - 15 + look}" cy="${ey}" r="2" fill="#fff"/><circle cx="${cx + 25 + look}" cy="${ey}" r="2" fill="#fff"/>`;
      s += `<path d="M${cx - 36} ${ey - 20} L${cx - 10} ${ey - 13} M${cx + 36} ${ey - 20} L${cx + 10} ${ey - 13}" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`;
      s += pose === 'wind' ? `<ellipse cx="${cx}" cy="${ey + 28}" rx="10" ry="8" fill="#6a2a3a" stroke="${INK}" stroke-width="2.5"/>`
        : `<path d="M${cx - 14} ${ey + 26} Q${cx} ${ey + 20} ${cx + 14} ${ey + 26}" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    }
  } else {
    // a spinning ball: swirl lines instead of a face
    s += `<path d="M${cx - 30} ${cy} A30 30 0 0 1 ${cx + 30} ${cy} M${cx - 18} ${cy + 22} A26 26 0 0 0 ${cx + 26} ${cy - 10}" stroke="#a87048" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M${cx - 6} ${cy - 44} L${cx + 4} ${cy - 56} L${cx + 12} ${cy - 44}" fill="#ffd75e" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
  }
  return s;
}

// ---------------- The Reaper: a tall robed figure with a deer-skull face and a star scythe ----------------
// 192 x 224 box; the robe hem is around y = 210. Kid-friendly spooky: big round glowing eyes, no teeth.
function reaper(pose) {
  const lean = { float: 0, telegraph: 0, swoop: 14, stuck: 0, hurt: 0, shield: 0, sad: 0 }[pose];
  const headY = pose === 'stuck' ? 108 : pose === 'sad' ? 92 : 60;
  const eye = pose === 'hurt' ? '#ffffff' : pose === 'sad' ? '#9fd8ff' : pose === 'telegraph' ? '#ff6af0' : '#c49aff';
  let s = '';
  const g = (inner) => `<g transform="rotate(${lean} 96 120)">${inner}</g>`;
  let body = '';
  // scythe behind the body
  if (pose !== 'stuck' && pose !== 'sad') {
    const up = pose === 'telegraph' || pose === 'shield';
    const sx = up ? 150 : 158, sTop = up ? 6 : 34;
    body += `<path d="M${sx} ${sTop} L${sx - 8} 214" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M${sx} ${sTop} L${sx - 8} 214" stroke="#7a5a3a" stroke-width="6" stroke-linecap="round"/>`;
    body += `<path d="M${sx} ${sTop + 4} Q${sx - 70} ${sTop - 26} ${sx - 96} ${sTop + 30} Q${sx - 62} ${sTop + 2} ${sx} ${sTop + 22} Z" fill="#cfd6ff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
    body += `<path d="M${sx - 20} ${sTop + 4} Q${sx - 56} ${sTop - 8} ${sx - 80} ${sTop + 20}" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>`;
    body += `<path d="${star5(sx - 2, sTop - 2, 9, 4)}" fill="#ffe680" stroke="${INK}" stroke-width="2"/>`;
  }
  // robe
  const hem = pose === 'stuck' ? 214 : 206;
  const robeTop = headY + 18;
  body += `<path d="M96 ${robeTop - 26} Q46 ${robeTop - 18} 40 ${robeTop + 50} Q30 ${hem - 40} 22 ${hem} L42 ${hem - 12} L56 ${hem + 2} L72 ${hem - 12} L88 ${hem + 4} L104 ${hem - 12} L120 ${hem + 2} L136 ${hem - 12} L152 ${hem + 2} L170 ${hem} Q162 ${hem - 40} 152 ${robeTop + 50} Q146 ${robeTop - 18} 96 ${robeTop - 26} Z" fill="#3a2466" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  body += `<path d="M66 ${robeTop + 20} Q60 ${hem - 40} 54 ${hem - 6} M126 ${robeTop + 20} Q132 ${hem - 40} 138 ${hem - 6} M96 ${robeTop + 30} L96 ${hem - 4}" stroke="#5a3a96" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  // a belt of little stars
  body += [0, 1, 2].map(i => `<path d="${star5(74 + i * 22, robeTop + 46, 6, 2.6)}" fill="#ffe680" stroke="${INK}" stroke-width="1.4"/>`).join('');
  // sleeves / hands
  if (pose === 'telegraph' || pose === 'shield') {
    body += `<path d="M58 ${robeTop + 10} Q34 ${robeTop - 20} 30 ${robeTop - 44}" stroke="${INK}" stroke-width="24" stroke-linecap="round" fill="none"/><path d="M58 ${robeTop + 10} Q34 ${robeTop - 20} 30 ${robeTop - 44}" stroke="#3a2466" stroke-width="17" stroke-linecap="round" fill="none"/>`;
    body += `<circle cx="30" cy="${robeTop - 50}" r="9" fill="#e8e0ff" stroke="${INK}" stroke-width="2.5"/>`;
    if (pose === 'telegraph') body += `<circle cx="30" cy="${robeTop - 50}" r="16" fill="#ff6af0" opacity="0.45"/>`;
  } else {
    body += `<path d="M58 ${robeTop + 14} Q46 ${robeTop + 44} 52 ${robeTop + 66}" stroke="${INK}" stroke-width="22" stroke-linecap="round" fill="none"/><path d="M58 ${robeTop + 14} Q46 ${robeTop + 44} 52 ${robeTop + 66}" stroke="#3a2466" stroke-width="15" stroke-linecap="round" fill="none"/>`;
    body += `<circle cx="52" cy="${robeTop + 72}" r="8" fill="#e8e0ff" stroke="${INK}" stroke-width="2.5"/>`;
  }
  // hood
  body += `<path d="M96 ${headY - 46} Q50 ${headY - 40} 48 ${headY + 10} Q50 ${headY + 40} 70 ${headY + 46} L122 ${headY + 46} Q142 ${headY + 40} 144 ${headY + 10} Q142 ${headY - 40} 96 ${headY - 46} Z" fill="#2c1a52" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  // antlers (come out through the hood)
  const antler = (dir) => {
    const x0 = 96 + dir * 26, y0 = headY - 26;
    return `M${x0} ${y0} Q${x0 + dir * 18} ${y0 - 30} ${x0 + dir * 44} ${y0 - 52} M${x0 + dir * 14} ${y0 - 22} Q${x0 + dir * 30} ${y0 - 28} ${x0 + dir * 46} ${y0 - 22} M${x0 + dir * 28} ${y0 - 38} Q${x0 + dir * 24} ${y0 - 56} ${x0 + dir * 30} ${y0 - 70}`;
  };
  for (const d of [-1, 1]) {
    body += `<path d="${antler(d)}" stroke="${INK}" stroke-width="12" stroke-linecap="round" fill="none"/><path d="${antler(d)}" stroke="#f2e6cf" stroke-width="7" stroke-linecap="round" fill="none"/>`;
  }
  // deer skull: long rounded face, two big eye holes, nose holes
  body += `<path d="M96 ${headY - 34} Q120 ${headY - 34} 122 ${headY - 8} Q122 ${headY + 14} 108 ${headY + 34} Q102 ${headY + 44} 96 ${headY + 44} Q90 ${headY + 44} 84 ${headY + 34} Q70 ${headY + 14} 70 ${headY - 8} Q72 ${headY - 34} 96 ${headY - 34} Z" fill="#f6eedd" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
  body += `<path d="M80 ${headY - 26} Q96 ${headY - 32} 112 ${headY - 26}" stroke="#d8ccb4" stroke-width="3" fill="none"/>`;
  const eyes = pose === 'stuck'
    ? `<path d="M77 ${headY - 6} a7 7 0 1 1 7 7 a4 4 0 1 1 -4 -4 M101 ${headY - 6} a7 7 0 1 1 7 7 a4 4 0 1 1 -4 -4" stroke="${INK}" stroke-width="3" fill="none"/>`
    : `<ellipse cx="84" cy="${headY - 4}" rx="10" ry="12" fill="${INK}"/><ellipse cx="108" cy="${headY - 4}" rx="10" ry="12" fill="${INK}"/>` +
      `<circle cx="84" cy="${headY - 3}" r="${pose === 'sad' ? 5 : 6}" fill="${eye}"/><circle cx="108" cy="${headY - 3}" r="${pose === 'sad' ? 5 : 6}" fill="${eye}"/>` +
      `<circle cx="86" cy="${headY - 6}" r="2" fill="#fff"/><circle cx="110" cy="${headY - 6}" r="2" fill="#fff"/>` +
      (pose === 'sad' ? `<path d="M80 ${headY + 10} Q82 ${headY + 18} 80 ${headY + 22}" stroke="#9fd8ff" stroke-width="3" fill="none" stroke-linecap="round"/>` : '');
  body += eyes;
  body += `<ellipse cx="91" cy="${headY + 30}" rx="2.6" ry="4" fill="${INK}"/><ellipse cx="101" cy="${headY + 30}" rx="2.6" ry="4" fill="${INK}"/>`;
  if (pose === 'stuck') body += [0, 1, 2].map(i => `<path d="${star5(70 + i * 26, headY - 50 - (i % 2) * 8, 7, 3)}" fill="#ffe680" stroke="${INK}" stroke-width="1.5"/>`).join('');
  s += g(body);
  return s;
}

function starSpirit(i) {
  const bob = i ? 2 : 0;
  return `<circle cx="40" cy="40" r="38" fill="url(#ssg)"/>` +
    `<path d="${star5(40, 42 - bob, 26, 13)}" fill="#fff3a0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<circle cx="33" cy="${40 - bob}" r="3.6" fill="${INK}"/><circle cx="47" cy="${40 - bob}" r="3.6" fill="${INK}"/><circle cx="34" cy="${39 - bob}" r="1.3" fill="#fff"/><circle cx="48" cy="${39 - bob}" r="1.3" fill="#fff"/>` +
    `<path d="M34 ${48 - bob} Q40 ${53 - bob} 46 ${48 - bob}" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="28" cy="${46 - bob}" rx="4" ry="2.4" fill="#ff9fb0" opacity="0.8"/><ellipse cx="52" cy="${46 - bob}" rx="4" ry="2.4" fill="#ff9fb0" opacity="0.8"/>`;
}

export async function buildBatch3Art(scene) {
  if (scene.textures.exists('b3-done')) return;
  const jobs = [];
  const sheet = (k, w, h, fr, defs) => { if (!scene.textures.exists(k)) jobs.push(svgSheet(scene, k, w, h, fr, defs)); };
  const img = (k, w, h, inner, defs) => { if (!scene.textures.exists(k)) jobs.push(svgImage(scene, k, w, h, inner, defs)); };
  sheet('dustking', 160, 128, ['idle', 'wind', 'roll', 'dizzy', 'hurt'].map(dustKing));
  sheet('reaper', 192, 224, ['float', 'telegraph', 'swoop', 'stuck', 'hurt', 'shield', 'sad'].map(reaper));
  sheet('starspirit', 80, 80, [0, 1].map(starSpirit), `<radialGradient id="ssg"><stop offset="0.3" stop-color="#fff8c0" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd75e" stop-opacity="0"/></radialGradient>`);
  // dust ring hub: a glowing dusty core
  img('ringcore', 96, 96, `<circle cx="48" cy="48" r="46" fill="url(#rc)"/><circle cx="48" cy="48" r="16" fill="#ffd0a0" stroke="${INK}" stroke-width="3"/><circle cx="43" cy="43" r="5" fill="#fff" opacity="0.8"/>`,
    `<radialGradient id="rc"><stop offset="0.25" stop-color="#ffe0b0" stop-opacity="0.9"/><stop offset="1" stop-color="#ff9a5a" stop-opacity="0"/></radialGradient>`);
  // black hole: dark disc with a glowing swirl
  img('vortex', 192, 192, `<circle cx="96" cy="96" r="94" fill="url(#vg)"/>` +
    [0, 1, 2, 3].map(i => `<path d="M96 96 m${Math.round(Math.cos(i * 1.57) * 30)} ${Math.round(Math.sin(i * 1.57) * 30)} q${Math.round(Math.cos(i * 1.57 + 1) * 60)} ${Math.round(Math.sin(i * 1.57 + 1) * 60)} ${Math.round(Math.cos(i * 1.57 + 2) * 64)} ${Math.round(Math.sin(i * 1.57 + 2) * 64)}" stroke="#ffb07a" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.75"/>`).join('') +
    `<circle cx="96" cy="96" r="30" fill="#05020c" stroke="#d6a0ff" stroke-width="5"/><circle cx="96" cy="96" r="38" fill="none" stroke="#ff9a5a" stroke-width="3" stroke-dasharray="6 8" opacity="0.8"/>`,
    `<radialGradient id="vg"><stop offset="0.3" stop-color="#b58aff" stop-opacity="0.85"/><stop offset="0.7" stop-color="#5a2a96" stop-opacity="0.4"/><stop offset="1" stop-color="#2a1050" stop-opacity="0"/></radialGradient>`);
  // slow-time bubble with clock ticks
  img('slowbubble', 256, 256, `<circle cx="128" cy="128" r="124" fill="url(#sb)" stroke="#9fd8ff" stroke-width="4" stroke-dasharray="14 10"/>` +
    Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<path d="M${r1(128 + Math.cos(a) * 104)} ${r1(128 + Math.sin(a) * 104)} L${r1(128 + Math.cos(a) * 116)} ${r1(128 + Math.sin(a) * 116)}" stroke="#d0f0ff" stroke-width="${i % 3 ? 3 : 6}" stroke-linecap="round" opacity="0.8"/>`; }).join(''),
    `<radialGradient id="sb"><stop offset="0.6" stop-color="#9fd8ff" stop-opacity="0.08"/><stop offset="1" stop-color="#6fb0ff" stop-opacity="0.35"/></radialGradient>`);
  img('clockhand', 16, 96, `<rect x="5" y="4" width="6" height="92" rx="3" fill="#d0f0ff" opacity="0.85"/>`);
  // the neutron star itself: tiny and very bright
  img('neutronstar', 96, 96, `<circle cx="48" cy="48" r="46" fill="url(#ng)"/><circle cx="48" cy="48" r="17" fill="#ffffff" stroke="#8fe8ff" stroke-width="4"/>`,
    `<radialGradient id="ng"><stop offset="0.2" stop-color="#ffffff" stop-opacity="1"/><stop offset="0.5" stop-color="#8fe8ff" stop-opacity="0.6"/><stop offset="1" stop-color="#3a8aff" stop-opacity="0"/></radialGradient>`);
  img('beam', 64, 32, `<rect x="0" y="4" width="64" height="24" rx="12" fill="#8fe8ff" opacity="0.55"/><rect x="0" y="11" width="64" height="10" rx="5" fill="#ffffff"/>`);
  // Reaper's attacks
  img('darkorb', 56, 56, `<circle cx="28" cy="28" r="26" fill="url(#do)"/><circle cx="28" cy="28" r="15" fill="#3a1a6a" stroke="${INK}" stroke-width="3"/><circle cx="23" cy="23" r="4" fill="#d6a0ff"/>`,
    `<radialGradient id="do"><stop offset="0.4" stop-color="#b58aff" stop-opacity="0.8"/><stop offset="1" stop-color="#5a2a96" stop-opacity="0"/></radialGradient>`);
  img('scythe', 112, 112, `<circle cx="56" cy="56" r="10" fill="#7a5a3a" stroke="${INK}" stroke-width="3"/>` +
    [0, 1].map(i => `<g transform="rotate(${i * 180} 56 56)"><path d="M56 50 Q20 16 4 44 Q26 30 56 62 Z" fill="#cfd6ff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>`).join(''));
  img('shieldbubble', 256, 256, `<circle cx="128" cy="128" r="122" fill="url(#shg)" stroke="#d6a0ff" stroke-width="6"/><path d="M60 70 Q90 36 136 34" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.5"/>`,
    `<radialGradient id="shg"><stop offset="0.55" stop-color="#5a2a96" stop-opacity="0.15"/><stop offset="1" stop-color="#b58aff" stop-opacity="0.6"/></radialGradient>`);
  sheet('reaperlantern', 48, 72, [0, 1].map(i => `<path d="M24 2 L24 14" stroke="${INK}" stroke-width="3"/><path d="M12 18 Q24 6 36 18 L34 56 Q24 62 14 56 Z" fill="${i ? '#fff3a0' : '#8f7fe0'}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="${star5(24, 37, 10, 4.4)}" fill="${i ? '#ffd75e' : '#c9bfff'}" stroke="${INK}" stroke-width="1.6"/><rect x="10" y="56" width="28" height="7" rx="3" fill="#6d5aa8" stroke="${INK}" stroke-width="2.5"/>`));
  img('swoopmark', 128, 24, `<ellipse cx="64" cy="12" rx="60" ry="10" fill="#ff6af0" opacity="0.35" stroke="#ff6af0" stroke-width="3" stroke-dasharray="8 6"/>`);
  img('b3-done', 2, 2, '');
  await Promise.all(jobs);
}
