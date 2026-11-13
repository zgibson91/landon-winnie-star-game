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
  // cell kinds: 0 empty, 1 solid, 2 one-way, 3 hazard
  const grid = Array.from({ length: H }, (_, r) => Array.from({ length: W }, (_, c) => {
    const ch = rows[r][c];
    if (ch === '#') return 1;
    if (ch === '=' || ch === 'H') return 2;
    if (ch === '^' || ch === '~') return 3;
    return 0;
  }));
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
  }
  const cell = (c, r) => (r < 0 || c < 0 || c >= W) ? 1 : (r >= H ? 0 : grid[r][c]);
  const solidAt = (px, py) => cell(Math.floor(px / TILE), Math.floor(py / TILE)) === 1;

  // Collectibles
  const targets = [];
  lv.coins.forEach(({ c, r }) => targets.push({ kind: 'glimmer', c, r, x: c * TILE + 24, y: r * TILE + 24, rx: 36, ry: 50 }));
  lv.hiddenCoins.forEach(({ c, r }) => targets.push({ kind: 'hidden glimmer', c, r, x: c * TILE + 24, y: r * TILE + 24, rx: 36, ry: 50 }));
  lv.shardSpots.forEach(({ c, r }) => targets.push({ kind: 'shard', c, r, x: c * TILE + 24, y: r * TILE + 24, rx: 38, ry: 48 }));
  lv.objects.filter(o => o.t === 'shard').forEach(o => targets.push({ kind: 'shard', c: o.x, r: o.y, x: o.x * TILE + 24, y: o.y * TILE + 24, rx: 38, ry: 48 }));
  lv.checkpoints.forEach(({ c, r }) => targets.push({ kind: 'lantern', c, r, x: c * TILE + 24, y: (r + 1) * TILE - 31, rx: 34, ry: 60 }));
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

  // One trajectory: returns landing spot {x, y} or null (died / fell out).
  function simulate(x, bottom, dir1, t1, dir2, hold) {
    simId++;
    let vx = dir1 * PHYS.runSpeed * 0.8, vy = hold > 0 ? -PHYS.jumpV : 0, t = 0, cut = false, jumping = hold > 0;
    for (let step = 0; step < 240; step++) {
      t += DT;
      const dir = t < t1 ? dir1 : dir2;
      if (dir) { vx += dir * PHYS.airAccel * DT; vx = Math.max(-PHYS.runSpeed, Math.min(PHYS.runSpeed, vx)); }
      else { const d = PHYS.airDecel * DT; vx = Math.abs(vx) <= d ? 0 : vx - Math.sign(vx) * d; }
      if (jumping && t >= hold && vy < 0 && !cut) { vy *= PHYS.jumpCut; cut = true; }
      vy += PHYS.gravity * (vy > 0 ? PHYS.fallMult : 1) * DT; vy = Math.min(vy, PHYS.maxFall);
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
        const top = nb - BH;
        if (solidAt(x - BW / 2 + 2, top) || solidAt(x + BW / 2 - 2, top)) { nb = (Math.floor(top / TILE) + 1) * TILE + BH; vy = 0; }
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
        if (landed != null) { bottom = landed; touch(x, bottom); return { x, y: bottom }; }
      }
      bottom = nb;
      touch(x, bottom);
      // hazards
      const hc0 = Math.floor((x - BW / 2 + 7) / TILE), hc1 = Math.floor((x + BW / 2 - 7) / TILE);
      const hr0 = Math.floor((bottom - BH + 7) / TILE), hr1 = Math.floor((bottom - 1) / TILE);
      for (let r = hr0; r <= hr1; r++) for (let c = hc0; c <= hc1; c++) if (cell(c, r) === 3 && bottom > r * TILE + 16) return null;
      if (bottom > H * TILE + 60) return null;
    }
    return null;
  }

  // Walkable span on a surface at height y around x.
  function standable(x, y) {
    const r = Math.round(y / TILE);
    const onSurf = (px) => {
      const k = cell(Math.floor(px / TILE), r);
      if (k === 1 || k === 2) return true;
      return extraOneWay.some(p => Math.abs(p.y - y) < 1 && px >= p.x0 && px <= p.x1);
    };
    const free = (px) => !solidAt(px, y - 4) && !solidAt(px, y - BH + 4) && cell(Math.floor(px / TILE), r - 1) !== 3;
    let a = x, b = x;
    while (onSurf(a - 4) && free(a - BW / 2 - 4) && onSurf(a - 4)) a -= 4;
    while (onSurf(b + 4) && free(b + BW / 2 + 4)) b += 4;
    return [a, b];
  }

  const seen = new Set();
  const queue = [];
  const startX = lv.start.c * TILE + 24, startY = (lv.start.r + 1) * TILE;
  // drop to the floor under the start
  let sy = startY; while (!(cell(lv.start.c, Math.round(sy / TILE)) === 1 || cell(lv.start.c, Math.round(sy / TILE)) === 2) && sy < H * TILE) sy += TILE;
  queue.push({ x: startX, y: sy });
  const visitedStands = [];
  while (queue.length) {
    const s = queue.shift();
    const [a, b] = standable(s.x, s.y);
    const key = `${Math.round(a)}|${Math.round(b)}|${s.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    visitedStands.push({ a, b, y: s.y });
    for (let x = a; x <= b; x += 8) touch(x, s.y);
    const xs = [];
    for (let x = a; x <= b; x += 24) xs.push(x);
    xs.push(b);
    for (const x of xs) {
      for (const hold of [0.12, 0.3, 0.6]) {
        for (const d of [-1, 0, 1]) {
          for (const [t1, d2] of [[9, d], [0.3, 0], [0.35, -d]]) {
            const land = simulate(x, s.y, d, t1, d2, hold);
            if (land) queue.push(land);
          }
        }
      }
    }
    // walk off both edges
    for (const [x, d] of [[a, -1], [b, 1]]) {
      for (const [t1, d2] of [[9, d], [0.15, 0], [0.3, 0]]) {
        const land = simulate(x + d * 6, s.y + 0.1, d, t1, d2, 0);
        if (land) queue.push(land);
      }
    }
  }
  const missing = targets.filter((t, i) => !hit.has(i));
  // bells: some standable spot within Winnie's pounce range
  const missingBells = bells.filter(bl => !visitedStands.some(s => Math.max(0, s.a - bl.x, bl.x - s.b) < 470 && Math.abs(bl.y - s.y) < 380));
  const difficulty = targets.map((t, i) => ({ kind: t.kind, c: t.c, r: t.r, hits: hits[i] })).sort((a, b) => a.hits - b.hits);
  return { targets: targets.length, missing, missingBells, stands: visitedStands.length, difficulty };
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
      (r.missingBells.length ? `\n     bells out of Winnie's reach: ${r.missingBells.map(b => b.id).join(' ')}` : ''));
  }
  process.exit(bad ? 1 : 0);
}
