// Parses a level JSON (sections of ASCII rows + object lists) into one grid and a flat object list.
//
// Grid legend:
//   .  empty            #  solid ground        =  one-way platform (jump up through it)
//   ^  spikes (hazard)  ~  plasma / lava (hazard)
//   o  glimmer          h  hidden glimmer (Winnie's Night Eyes reveals it)
//   H  hidden platform (Night Eyes)            S  Star Shard (the "hidden/puzzle" shard)
//   P  start            G  goal gate           C  checkpoint lantern     c  assist-only lantern
//   w  walker enemy
// Objects use tile coordinates relative to their section: {"t": "flare", "x": 12, "y": 13, ...}

export function buildLevel(def) {
  const H = def.height;
  const rows = Array.from({ length: H }, () => '');
  const objects = [];
  const sections = [];
  let col = 0;
  for (const sec of def.sections) {
    const w = sec.w || Math.max(...sec.rows.map(r => r.length));
    if (sec.rows.length !== H) console.warn(`[level ${def.id}] section "${sec.name}" has ${sec.rows.length} rows, expected ${H}`);
    for (let r = 0; r < H; r++) rows[r] += (sec.rows[r] || '').padEnd(w, '.').slice(0, w);
    for (const o of sec.objects || []) objects.push(Object.assign({}, o, { x: o.x + col, x2: o.x2 != null ? o.x2 + col : undefined, section: sections.length }));
    sections.push({ name: sec.name, start: col, end: col + w, hints: sec.hints || null });
    col += w;
  }
  const W = col;
  const out = { W, H, rows, objects, sections, coins: [], hiddenCoins: [], hiddenRuns: [], checkpoints: [], walkers: [], start: null, goal: null, shardSpots: [] };
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const ch = rows[r][c];
      switch (ch) {
        case 'o': out.coins.push({ c, r }); break;
        case 'h': out.hiddenCoins.push({ c, r }); break;
        case 'P': out.start = { c, r }; break;
        case 'G': out.goal = { c, r }; break;
        case 'C': out.checkpoints.push({ c, r, assist: false }); break;
        case 'c': out.checkpoints.push({ c, r, assist: true }); break;
        case 'w': out.walkers.push({ c, r }); break;
        case 'S': out.shardSpots.push({ c, r }); break;
        default: break;
      }
    }
    // hidden platform runs
    let runStart = -1;
    for (let c = 0; c <= W; c++) {
      const isH = c < W && rows[r][c] === 'H';
      if (isH && runStart < 0) runStart = c;
      if (!isH && runStart >= 0) { out.hiddenRuns.push({ c: runStart, r, w: c - runStart }); runStart = -1; }
    }
  }
  out.sectionAt = (c) => sections.findIndex(s => c >= s.start && c < s.end);
  out.isSolid = (c, r) => r >= 0 && r < H && c >= 0 && c < W && rows[r][c] === '#';
  return out;
}
