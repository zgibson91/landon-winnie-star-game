// Static reachability checker. Simulates Landon's jump physics (same constants as the game) over the
// level grid and reports any glimmer, shard, lantern, bell or goal that no sequence of runs/jumps can reach.
// Moving and pulsing platforms are treated as available at every point of their path / at full size,
// hidden platforms as revealed, and puzzle doors as open — timing is checked by the bot routes instead.
//   node tests/reach.mjs [levelId ...]
import fs from 'node:fs';
import { PHYS, TILE } from '../src/core/constants.js';
import { buildLevel } from '../src/level/build.js';

const DT = 1 / 60;
const BW = PHYS.bodyW, BH = PHYS.bodyH;

export function checkLevel(def) {
  const lv = buildLevel(def);
  const { W, H, rows } = lv;
  // cell kinds: 0 empty, 1 solid, 2 one-way, 3 hazard, 4 sun block (solid on the light side), 5 moon block (dark side)
  const grid = Array.from({ length: H }, (_, r) => Array.from({ length: W }, (_, c) => {
    const ch = rows[r][c];
    if (ch === '#') return 1;
    if (ch === '=' || ch === 'H') return 2;
    if (ch === '^' || ch === '~' || ch === 'v') return 3;
    if (ch === 'L') return 4;
    if (ch === 'D') return 5;
    return 0;
  }));
  let PH = 0; // current side while simulating: 0 = light, 1 = dark
  const orbs = [];      // {x, y, to}  to: 0, 1 or null (flip)
  const flippers = [];  // things that let you change side while standing: swap switches (Winnie) and clock zones
  const squeezes = [];
  const clocks = [];
  const gorbs = [];    // gravity orbs {x, y, to: 1 | -1}
  const padSpots = []; // memory pads Landon must be able to stand on
  const extraOneWay = []; // {x0, x1, y} in px
  const loops = [];
  const bells = [];
  const hazardRects = [];
  for (const o of lv.objects) {
    if (o.t === 'mover') {
      const n = 12;
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        const x = (o.x + (o.dx || 0) * k) * TILE, y = (o.y + (o.dy || 0) * k) * TILE;
        extraOneWay.push({ x0: x, x1: x + (o.w || 3) * TILE, y });
      }
    } else if (o.t === 'pulse') {
      const cx = o.x * TILE + TILE / 2, w = (o.max ?? 4) * TILE;
      extraOneWay.push({ x0: cx - w / 2, x1: cx + w / 2, y: o.y * TILE });
    } else if (o.t === 'loop') loops.push({ x: o.x * TILE + TILE * 1.5, top: o.y * TILE - 90 });
    else if (o.t === 'bell') bells.push({ x: o.x * TILE + TILE / 2, y: o.y * TILE + TILE / 2 + 10, id: o.id });
    else if (o.t === 'lever') {
      const L = { x: o.x * TILE + TILE / 2, y: (o.y + 1) * TILE - 40, id: o.id || 'lever' };
      bells.push(L);
      if (o.swap) flippers.push({ kind: 'lever', ...L });
    } else if (o.t === 'mirror') {
      grid[o.y][o.x] = 1;
      if (!o.fixed) bells.push({ x: o.x * TILE + TILE / 2, y: o.y * TILE + TILE / 2, id: `mirror@${o.x},${o.y}`, bump: true });
    } else if (o.t === 'swap') orbs.push({ x: o.x * TILE + TILE / 2, y: o.y * TILE + TILE / 2, to: o.to ? (o.to === 'dark' ? 1 : 0) : null });
    else if (o.t === 'swapclock') { flippers.push({ kind: 'clock', x0: o.x * TILE, x1: o.x2 * TILE }); clocks.push({ x0: o.x * TILE, x1: o.x2 * TILE }); }
    else if (o.t === 'gravity') gorbs.push({ x: o.x * TILE + TILE / 2, y: o.y * TILE + TILE / 2, to: o.to === 'down' ? 1 : -1 });
    else if (o.t === 'pad') padSpots.push({ c: o.x, r: o.y, id: o.id });
    else if (o.t === 'songstone') bells.push({ x: o.x * TILE + TILE / 2, y: (o.y + 1) * TILE - 60, id: o.id || 'songstone' });
    else if (o.t === 'squeeze') squeezes.push({ x: o.x * TILE + TILE / 2, y: (o.y + 1) * TILE, id: `squeeze@${o.x}` });
  }
  const cell = (c, r) => {
    if (r < 0 || c < 0 || c >= W) return 1;
    if (r >= H) return 0;
    const k = grid[r][c];
    if (k === 4) return PH === 0 ? 1 : 0;
    if (k === 5) return PH === 1 ? 1 : 0;
    return k;
  };
  const solidAt = (px, py) => cell(Math.floor(px / TILE), Math.floor(py / TILE)) === 1;

  // Collectibles
  const targets = [];
  lv.coins.forEach(({ c, r }) => targets.push({ kind: 'glimmer', c, r, x: c * TILE + 24, y: r * TILE + 24, rx: 36, ry: 50 }));
  lv.hiddenCoins.forEach(({ c, r }) => targets.push({ kind: 'hidden glimmer', c, r, x: c * TILE + 24, y: r * TILE + 24, rx: 36, ry: 50 }));
  lv.shardSpots.forEach(({ c, r }) => targets.push({ kind: 'shard', c, r, x: c * TILE + 24, y: r * TILE + 24, rx: 38, ry: 48 }));
  lv.objects.filter(o => o.t === 'shard').forEach(o => targets.push({ kind: 'shard', c: o.x, r: o.y, x: o.x * TILE + 24, y: o.y * TILE + 24, rx: 38, ry: 48 }));
  lv.checkpoints.forEach(({ c, r }) => targets.push({ kind: 'lantern', c, r, x: c * TILE + 24, y: (r + 1) * TILE - 31, rx: 34, ry: 60 }));
  padSpots.forEach(({ c, r, id }) => targets.push({ kind: 'pad ' + id, c, r, x: c * TILE + 24, y: (r + 1) * TILE - BH / 2, rx: 22, ry: 6 }));
  if (lv.goal) targets.push({ kind: 'goal', c: lv.goal.c, r: lv.goal.r, x: lv.goal.c * TILE + 24, y: (lv.goal.r + 1) * TILE - 31, rx: 34, ry: 80 });
  const hit = new Set();
  const hits = new Array(targets.length).fill(0); // how many simulated moves touch each target (low = hard to get)
  let simId = 0; const lastSim = new Array(targets.length).fill(-1);
  const touch = (x, bottom) => {
    const cy = bottom - BH / 2;
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (Math.abs(x - t.x) < t.rx && Math.abs(cy - t.y) < t.ry) { hit.add(i); if (lastSim[i] !== simId) { lastSim[i] = simId; hits[i]++; } }
    }
  };

  // One trajectory. "feet" is the y of the surface Landon stands on: his bottom with normal gravity (G = 1),
  // his top when gravity is flipped (G = -1, standing on a ceiling). Returns where he lands, or null if he dies.
  function simulate(x, feet, dir1, t1, dir2, hold, ph = 0, flipAt = null, G = 1) {
    simId++;
    PH = ph; let flipped = false;
    const inOrb = orbs.map(() => false), inG = gorbs.map(() => false);
    let bottom = G > 0 ? feet : feet + BH;
    let vx = dir1 * PHYS.runSpeed * 0.8, vy = hold > 0 ? -PHYS.jumpV * G : 0, t = 0, cut = false, jumping = hold > 0;
    for (let step = 0; step < 240; step++) {
      t += DT;
      const dir = t < t1 ? dir1 : dir2;
      if (dir) { vx += dir * PHYS.airAccel * DT; vx = Math.max(-PHYS.runSpeed, Math.min(PHYS.runSpeed, vx)); }
      else { const d = PHYS.airDecel * DT; vx = Math.abs(vx) <= d ? 0 : vx - Math.sign(vx) * d; }
      if (jumping && t >= hold && vy * G < 0 && !cut) { vy *= PHYS.jumpCut; cut = true; }
      vy += G * PHYS.gravity * (vy * G > 0 ? PHYS.fallMult : 1) * DT; vy = Math.max(-PHYS.maxFall, Math.min(vy, PHYS.maxFall));
      // move x
      let nx = x + vx * DT;
      const left = nx - BW / 2, right = nx + BW / 2;
      for (const yy of [bottom - 2, bottom - BH / 2, bottom - BH + 2]) {
        if (vx > 0 && solidAt(right, yy)) { nx = Math.floor(right / TILE) * TILE - BW / 2 - 0.01; vx = 0; }
        if (vx < 0 && solidAt(left, yy)) { nx = (Math.floor(left / TILE) + 1) * TILE + BW / 2 + 0.01; vx = 0; }
      }
      x = nx;
      // move y
      let nb = bottom + vy * DT;
      if (vy < 0) {
        const top = nb - BH, oldTop = bottom - BH;
        // with flipped gravity, moving up is falling: land on the underside of solid tiles
        let hitRow = null;
        for (let r = Math.floor(oldTop / TILE); r >= Math.floor(top / TILE); r--) {
          const under = (r + 1) * TILE;
          if (oldTop < under - 0.5 || top > under) continue;
          if (cell(Math.floor((x - BW / 2 + 2) / TILE), r) === 1 || cell(Math.floor((x + BW / 2 - 2) / TILE), r) === 1) { hitRow = r; break; }
        }
        if (hitRow == null && (solidAt(x - BW / 2 + 2, top) || solidAt(x + BW / 2 - 2, top))) hitRow = Math.floor(top / TILE);
        if (hitRow != null) {
          nb = (hitRow + 1) * TILE + BH;
          if (G < 0) { bottom = nb; touch(x, bottom); return { x, y: bottom - BH, ph: PH, g: G }; }
          vy = 0;
        }
      } else if (G < 0) {
        // flipped and moving down = jumping "up": bump the floor below
        if (solidAt(x - BW / 2 + 2, nb) || solidAt(x + BW / 2 - 2, nb)) { nb = Math.floor(nb / TILE) * TILE - 0.01; vy = 0; }
      } else {
        // landing on solid / one-way tile tops
        const rNew = Math.floor((nb) / TILE), rOld = Math.floor((bottom) / TILE);
        let landed = null;
        for (let r = rOld; r <= rNew; r++) {
          const topY = r * TILE;
          if (bottom > topY + 0.5 || nb < topY) continue;
          for (const px of [x - BW / 2 + 1, x + BW / 2 - 1]) {
            const k = cell(Math.floor(px / TILE), r);
            if (k === 1 || k === 2) { landed = topY; break; }
          }
          if (landed != null) break;
        }
        for (const p of extraOneWay) if (landed == null && bottom <= p.y + 0.5 && nb >= p.y && x + BW / 2 > p.x0 && x - BW / 2 < p.x1) landed = p.y;
        for (const L of loops) if (bottom <= L.top + 26 && nb >= L.top - 4 && Math.abs(x - L.x) < 46) { vy = -PHYS.bounceV; jumping = false; nb = bottom; }
        if (landed != null) { bottom = landed; touch(x, bottom); return { x, y: bottom, ph: PH, g: G }; }
      }
      bottom = nb;
      touch(x, bottom);
      // a clock zone can flip the side while Landon is in the air
      if (flipAt != null && !flipped && t >= flipAt && clocks.some(c => x > c.x0 && x < c.x1)) { PH = 1 - PH; flipped = true; }
      for (let i = 0; i < orbs.length; i++) {
        const o = orbs[i], inside = Math.abs(x - o.x) < 40 && Math.abs(bottom - BH / 2 - o.y) < 64;
        if (inside && !inOrb[i]) PH = o.to == null ? 1 - PH : o.to;
        inOrb[i] = inside;
      }
      for (let i = 0; i < gorbs.length; i++) {
        const o = gorbs[i], inside = Math.abs(x - o.x) < 34 && Math.abs(bottom - BH / 2 - o.y) < 48;
        if (inside && !inG[i] && G !== o.to) { G = o.to; vy *= 0.3; jumping = false; }
        inG[i] = inside;
      }
      // hazards
      const hc0 = Math.floor((x - BW / 2 + 7) / TILE), hc1 = Math.floor((x + BW / 2 - 7) / TILE);
      const hr0 = Math.floor((bottom - BH + 7) / TILE), hr1 = Math.floor((bottom - 1) / TILE);
      for (let r = hr0; r <= hr1; r++) for (let c = hc0; c <= hc1; c++) {
        const ch = rows[r] && rows[r][c];
        if (ch === 'v' && bottom - BH + 7 < r * TILE + 26) return null;
        if ((ch === '^' || ch === '~') && bottom > r * TILE + 16) return null;
      }
      if (bottom > H * TILE + 60 || bottom < -80) return null;
    }
    return null;
  }

  // Walkable span on a surface at feet height y around x (G = -1: walking on a ceiling).
  function standable(x, y, G = 1) {
    const r = Math.round(y / TILE);
    const onSurf = G > 0
      ? (px) => { const k = cell(Math.floor(px / TILE), r); if (k === 1 || k === 2) return true; return extraOneWay.some(p => Math.abs(p.y - y) < 1 && px >= p.x0 && px <= p.x1); }
      : (px) => cell(Math.floor(px / TILE), r - 1) === 1;
    const free = G > 0
      ? (px) => !solidAt(px, y - 4) && !solidAt(px, y - BH + 4) && cell(Math.floor(px / TILE), r - 1) !== 3
      : (px) => !solidAt(px, y + 4) && !solidAt(px, y + BH - 4) && cell(Math.floor(px / TILE), r) !== 3;
    if (!onSurf(x - BW / 2 + 2) && !onSurf(x + BW / 2 - 2)) return null; // nothing underfoot (a block vanished)
    let a = x, b = x;
    while (onSurf(a - 4) && free(a - BW / 2 - 4)) a -= 4;
    while (onSurf(b + 4) && free(b + BW / 2 + 4)) b += 4;
    return [a, b];
  }

  const seen = new Set();
  const queue = [];
  const startX = lv.start.c * TILE + 24, startY = (lv.start.r + 1) * TILE;
  // drop to the floor under the start
  let sy = startY; while (!(cell(lv.start.c, Math.round(sy / TILE)) === 1 || cell(lv.start.c, Math.round(sy / TILE)) === 2) && sy < H * TILE) sy += TILE;
  queue.push({ x: startX, y: sy, ph: 0, g: 1 });
  const visitedStands = [];
  while (queue.length) {
    const s = queue.shift();
    const ph = s.ph || 0, G = s.g || 1;
    PH = ph;
    const span = standable(s.x, s.y, G);
    if (!span) { // nothing solid under both feet (a block vanished, or only a toe is on an edge): fall from here
      const fk = `fall|${Math.round(s.x)}|${s.y}|${ph}|${G}`;
      if (seen.has(fk)) continue;
      seen.add(fk);
      const land = simulate(s.x, s.y + G, 0, 9, 0, 0, ph, null, G);
      if (land && !(Math.abs(land.y - s.y) < 1 && Math.abs(land.x - s.x) < 1)) queue.push(land);
      continue;
    }
    const [a, b] = span;
    const key = `${Math.round(a)}|${Math.round(b)}|${s.y}|${ph}|${G}`;
    if (seen.has(key)) continue;
    seen.add(key);
    visitedStands.push({ a, b, y: s.y, ph, g: G });
    // switch sides from here: a swap switch in Winnie's reach, or a clock zone that flips by itself
    for (const f of flippers) {
      const ok = f.kind === 'lever' ? Math.max(0, a - f.x, f.x - b) < 470 && Math.abs(f.y - s.y) < 380 : b > f.x0 && a < f.x1;
      if (ok) queue.push({ x: s.x, y: s.y, ph: 1 - ph, g: G });
    }
    // walking along this surface into a gravity orb flips gravity: fall from there
    for (const o of gorbs) {
      if (o.to === G || o.x < a - 20 || o.x > b + 20) continue;
      const bodyMid = G > 0 ? s.y - BH / 2 : s.y + BH / 2;
      if (Math.abs(bodyMid - o.y) < 48) { const land = simulate(o.x, s.y, 0, 9, 0, 0, ph, null, o.to); if (land) queue.push(land); }
    }
    for (let x = a; x <= b; x += 8) touch(x, G > 0 ? s.y : s.y + BH);
    const xs = [];
    for (let x = a; x <= b; x += 24) xs.push(x);
    xs.push(b);
    for (const x of xs) {
      for (const hold of [0.12, 0.3, 0.6]) {
        for (const d of [-1, 0, 1]) {
          for (const [t1, d2] of [[9, d], [0.3, 0], [0.35, -d]]) {
            const land = simulate(x, s.y, d, t1, d2, hold, ph, null, G);
            if (land) queue.push(land);
            if (d !== 0 && clocks.some(c => x > c.x0 && x < c.x1)) for (const fa of [0.2, 0.4]) { const l2 = simulate(x, s.y, d, t1, d2, hold, ph, fa, G); if (l2) queue.push(l2); }
          }
        }
      }
    }
    // walk off both edges
    for (const [x, d] of [[a, -1], [b, 1]]) {
      for (const [t1, d2] of [[9, d], [0.15, 0], [0.3, 0]]) {
        const land = simulate(x + d * 6, s.y + 0.1 * G, d, t1, d2, 0, ph, null, G);
        if (land) queue.push(land);
      }
    }
  }
  const missing = targets.filter((t, i) => !hit.has(i));
  // bells: some standable spot within Winnie's pounce range
  const missingBells = bells.filter(bl => !visitedStands.some(s => Math.max(0, s.a - bl.x, bl.x - s.b) < 470 && Math.abs(bl.y - s.y) < 380))
    .concat(squeezes.filter(q => !visitedStands.some(s => Math.max(0, s.a - q.x, q.x - s.b) < 170 && Math.abs(q.y - s.y) < 70)));
  const difficulty = targets.map((t, i) => ({ kind: t.kind, c: t.c, r: t.r, hits: hits[i] })).sort((a, b) => a.hits - b.hits);
  return { targets: targets.length, missing, missingBells, stands: visitedStands.length, difficulty, visitedStands };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(new URL('../levels', import.meta.url)).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
  let bad = 0;
  for (const id of ids) {
    const def = JSON.parse(fs.readFileSync(new URL(`../levels/${id}.json`, import.meta.url)));
    const r = checkLevel(def);
    const ok = !r.missing.length && !r.missingBells.length;
    if (!ok) bad++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${id}: ${r.targets - r.missing.length}/${r.targets} targets reachable, ${r.stands} standing spots` +
      (r.missing.length ? `\n     unreachable: ${r.missing.map(t => `${t.kind}@${t.c},${t.r}`).join(' ')}` : '') +
      (r.missingBells.length ? `\n     Winnie targets out of reach: ${r.missingBells.map(b => b.id).join(' ')}` : ''));
  }
  process.exit(bad ? 1 : 0);
}
