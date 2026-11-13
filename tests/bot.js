// In-page autopilot used by the tests. It plays a level by following a "route" of steps,
// driving the same Input layer a player uses, so the real physics decide success.
//
// Step fields (all optional):
//   dir:   -1 | 0 | 1   direction to hold during the step
//   jump:  ms            hold jump for this long at the start of the step
//   x:     tile          finish when the player's center passes this tile column (in `dir`)
//   land:  true          finish when the player lands again (after leaving the ground)
//   until: "js expr"     finish when true; can use L (level scene), P (player), flare(tx), pulse(ph)
//   ms:    number        finish after this long (or as a timeout with x/until: then the route fails)
//   winnie: true         tap the Winnie button at the start and wait until she is done
//   ride:  n             stay centered on mover n (0-based, in level order) while the step runs
//   rideAt: tile offset   where on that mover to stand (default its middle)
//   stay:  tile           hold position at this tile (fight the wind) while the step runs
//   seek:  "js expr"     like stay, but the tile is computed every frame (e.g. a ring rock's position)
//   boss:  true          play the current boss fight with a simple reactive brain until it's over
//   note:  string        label for logs
// In "until" you can also use mv(n) -> {x, y, cx, vx} (tiles; x = left edge) and wind(n) -> 'idle'|'warn'|'on'.
(function () {
  const TILE = 48;
  const Bot = {
    route: null, i: 0, t: 0, log: [], done: false, failed: null, stepStart: 0, leftGround: false, jumpHeldUntil: 0,
    start(route) {
      this.route = route; this.i = 0; this.done = false; this.failed = null; this.log = [];
      this.begin();
      if (!this.hooked) { LW.game.events.on('prestep', () => this.tick()); this.hooked = true; }
    },
    begin() {
      const s = this.route[this.i]; this.stepStart = performance.now(); this.leftGround = false;
      this.winnieTapped = false;
      if (s) this.log.push(`step ${this.i} ${s.note || ''} @${this.where()}`);
    },
    where() { const L = LW.level(); if (!L || !L.player) return '?'; return `${(L.player.x / TILE).toFixed(1)},${((L.player.bottom - 1) / TILE).toFixed(1)} t=${L.levelTime.toFixed(1)}`; },
    movers(L) { return L.objs.filter(o => o.constructor.name === 'Mover'); },
    flare(tx) {
      const L = LW.level(); const f = L.objs.find(o => o.constructor.name === 'Flare' && Math.floor(o.x / TILE) === tx);
      return f ? f.state : 'none';
    },
    flareT(tx) {
      const L = LW.level(); const f = L.objs.find(o => o.constructor.name === 'Flare' && Math.floor(o.x / TILE) === tx);
      return f ? (L.hz + f.offset) % f.period : 0;
    },
    // rk(n, i): tile position of rock i on dust ring n (level order): {x, y, cx}
    rock(L, n, i) {
      const rings = L.objs.filter(o => o.constructor.name === 'RingWheel');
      const r = rings[n]; const b = r.rocks[i].zone.body;
      return { x: b.x / TILE, y: b.y / TILE, cx: (b.x + r.w / 2) / TILE };
    },
    // A simple reactive player for boss fights: dodge attacks, stomp when the boss is dazed, use Winnie when asked.
    bossBrain(L, P) {
      const B = L.boss, inp = { left: false, right: false, jump: false, winnie: false };
      if (!B || B.over || P.dead) return inp;
      const now = performance.now();
      const jump = (ms) => { if (P.grounded && now > (this.jumpUntil || 0) + 120) this.jumpUntil = now + ms; };
      const go = (x, tol = 10) => { const d = x - P.x; inp.left = d < -tol; inp.right = d > tol; };
      const stomp = (x) => {
        go(x, 6);
        if (P.grounded && Math.abs(P.x - x) < 110) jump(520);
      };
      if (B.name === 'Dust Bunny King') {
        if (B.state === 'dizzy') stomp(B.x);
        else if (B.state === 'roll') {
          const dist = (B.x - P.x) * B.dir * -1; // > 0 when it's rolling toward Landon
          if (dist > 0 && dist < 175) jump(520);
          if (dist > 0) go(P.x - B.dir * 50); // lean into the jump so Landon clears it
          else if (P.grounded) go(B.x - B.dir * 150, 30); // it rolled past: follow it to the wall
        } else if (B.state === 'wind' || B.state === 'intro') {
          // keep some room between us
          if (Math.abs(B.x - P.x) < 260) go(B.x + (P.x < B.x ? -1 : 1) * 320);
        }
      } else {
        const floor = B.floor;
        const st = B.state;
        // dodge orbs
        for (const o of B.orbs) {
          const dx = o.spr.x - P.x, toward = Math.sign(dx) !== Math.sign(o.vx);
          if (toward && Math.abs(dx) < 90 && Math.abs(dx) > 30 && o.spr.y > floor - 120) jump(520);
        }
        // dodge scythes: jump low ones, stay down for high ones
        for (const c of B.scythes) {
          const dx = c.spr.x - P.x, toward = Math.sign(dx) !== Math.sign(c.vx);
          if (toward && Math.abs(dx) < 190 && c.y > floor - 60) jump(600);
          if (toward && c.y < floor - 60 && Math.abs(dx) < 260) { this.jumpUntil = 0; }
        }
        if (st === 'telegraph' || st === 'swoop') {
          const t = B.target;
          if (Math.abs(P.x - t) < 200) go(t + (t > (B.x0 + B.x1) / 2 ? -1 : 1) * 260);
        } else if (st === 'stuck') stomp(B.x);
        else if (st === 'shield') {
          const d = P.x - B.x;
          if (Math.abs(d) > 260) go(B.x + Math.sign(d) * 220); else if (Math.abs(d) < 170) go(B.x + Math.sign(d || 1) * 230);
          if (L.winnieAction && L.winnieAction.kind === 'meow' && !L.winnie.busy && now > (this.winnieAt2 || 0)) { inp.winnie = true; this.winnieAt2 = now + 800; }
        } else if (st === 'lantern') {
          if (L.winnieAction && L.winnieAction.kind === 'pounce' && !L.winnie.busy && now > (this.winnieAt2 || 0)) { inp.winnie = true; this.winnieAt2 = now + 800; }
          else go(B.cxA, 60);
        } else if (st === 'hover' || st === 'rise' || st === 'roar' || st === 'orbs') {
          if (!B.orbs.length) go(B.cxA + (P.x < B.cxA ? -150 : 150), 60);
        } else if (st === 'sweeps' || st === 'vortex') {
          if (!B.scythes.length) go(B.cxA + (P.x < B.cxA ? -200 : 200), 80);
        }
      }
      inp.jump = now < (this.jumpUntil || 0);
      return inp;
    },
    tick() {
      const L = LW.level();
      if (!this.route || this.done || this.failed || !L || !L.ready) { if (this.route && (this.done || this.failed)) LW.Input.bot = {}; return; }
      if (!L.__botHooked) { L.__botHooked = true; L.events.on('pad', (pd) => this.log.push(`PAD ${pd.id} @${this.where()}`)); L.events.on('meow', () => this.log.push(`MEOW @${this.where()}`)); }
      if (L.busyModal) { LW.Input.bot = { confirm: !this.blink, jump: false }; this.blink = !this.blink; this.stepStart = performance.now(); return; }
      const s = this.route[this.i];
      if (!s) { this.done = true; LW.Input.bot = {}; return; }
      const P = L.player; const el = performance.now() - this.stepStart;
      const inp = { left: s.dir === -1, right: s.dir === 1, jump: !!s.jump && el < s.jump };
      if (s.stay != null) { const d = (s.stay + 0.5) * TILE - P.x; inp.left = d < -8; inp.right = d > 8; }
      if (s.ride != null) {
        const m = this.movers(L)[s.ride];
        if (m) {
          const target = s.rideAt != null ? m.zone.body.x + s.rideAt * TILE : m.zone.body.x + m.w / 2;
          const d = target - P.x;
          inp.left = d < -10; inp.right = d > 10;
        }
      }
      if (s.seek) { try { const tx = (new Function('L', 'P', 'rk', 'return (' + s.seek + ')'))(L, P, (n, i) => this.rock(L, n, i)); const d = (tx + 0.5) * TILE - P.x; inp.left = d < -8; inp.right = d > 8; } catch (e) { this.failed = 'bad seek: ' + e.message; } }
      if (s.boss) Object.assign(inp, this.bossBrain(L, P));
      if (s.winnie && !this.winnieTapped) { inp.winnie = true; this.winnieTapped = true; this.winnieAt = el; }
      LW.Input.bot = inp;
      if (P.dead && s.boss) {
        if (!this.wasDead) { this.bossDeaths = (this.bossDeaths || 0) + 1; this.log.push(`boss hit me (${L.lastFail}) @${this.where()} ${L.boss && L.boss.state} phase ${L.boss && L.boss.phase}`); }
        this.wasDead = true; if (this.bossDeaths > 12) this.failed = 'too many boss hits'; return;
      }
      this.wasDead = false;
      if (P.dead) { this.failed = `died (${L.lastFail}) during step ${this.i} (${s.note || ''}) at ${this.where()}`; return; }
      if (!P.grounded) this.leftGround = true;
      const pulse = (ph) => L.pulseAt(ph || 0);
      const flare = (tx) => this.flare(tx);
      const flareT = (tx) => this.flareT(tx);
      const mvs = this.movers(L);
      const mv = (n) => { const m = mvs[n]; const b = m.zone.body; return { x: b.x / TILE, y: b.y / TILE, cx: (b.x + m.w / 2) / TILE, vx: b.velocity.x, vy: b.velocity.y }; };
      const winds = L.objs.filter(o => o.constructor.name === 'Wind');
      const wind = (n) => winds[n].state;
      const storms = L.objs.filter(o => o.constructor.name === 'DustStorm');
      const storm = (n) => storms[n].state;
      let fin = false;
      if (s.x != null) fin = s.dir === -1 ? P.x <= s.x * TILE + TILE / 2 : P.x >= s.x * TILE + TILE / 2;
      if (s.land) fin = (s.x == null || fin) && this.leftGround && P.grounded && el > 60;
      if (s.until) { try { fin = (s.x == null || fin) && !!(new Function('L', 'P', 'pulse', 'flare', 'flareT', 'mv', 'wind', 'storm', 'return (' + s.until + ')'))(L, P, pulse, flare, flareT, mv, wind, storm); } catch (e) { this.failed = 'bad until: ' + e.message; } }
      if (s.boss) fin = !!(L.boss && L.boss.over) || L.finished;
      if (s.winnie) fin = this.winnieTapped && el > 120 && !L.winnie.busy && (s.until == null || fin);
      if (s.x == null && !s.land && !s.until && !s.winnie && !s.boss) fin = el >= (s.ms || 0);
      else if (s.ms && el >= s.ms && !fin) { this.failed = `timeout in step ${this.i} (${s.note || ''}) at ${this.where()}`; return; }
      if (L.finished) { this.done = true; LW.Input.bot = {}; this.log.push('finished @' + this.where()); return; }
      if (fin) { this.i++; this.begin(); }
    },
  };
  window.LWBot = Bot;
  // Helpers usable in "until" / "seek" expressions for dust rings (tiles; angles in degrees, 0 = right, 90 = bottom)
  const rings = () => LW.level().objs.filter(o => o.constructor.name === 'RingWheel');
  window.rk = (n, i) => Bot.rock(LW.level(), n, i);
  window.ra = (n, i) => { const r = rings()[n]; return (((r.a + i / r.n * Math.PI * 2) * 180 / Math.PI) % 360 + 360) % 360; };
  // the rock Landon is standing on: {ring, i, angle, cx} or null
  window.myRock = () => { const L = LW.level(), P = L.player; const o = P.ride && P.ride.owner; if (!o || !o.ring || !P.grounded) return null; const n = rings().indexOf(o.ring); return { ring: n, i: o.i, angle: window.ra(n, o.i), cx: (P.ride.body.x + o.ring.w / 2) / TILE - 0.5 }; };
  // beam angle of pulsar n folded to 0..180 (two opposite beams look the same); 90 = pointing straight down/up
  window.beam = (n) => { const p = LW.level().objs.filter(o => o.constructor.name === 'Pulsar')[n]; return ((p.angle() * 180 / Math.PI) % 180 + 180) % 180; };
  // index of the rock on ring n nearest to Landon
  window.nearRock = (n) => { const L = LW.level(), P = L.player, r = rings()[n]; let best = 0, bd = 1e9; r.rocks.forEach((k, i) => { const b = k.zone.body, d = Math.hypot(b.x + r.w / 2 - P.x, b.y - P.bottom); if (d < bd) { bd = d; best = i; } }); return best; };
  // ring n has a rock whose angle is within [a0, a1] (wrapping)
  window.rockIn = (n, a0, a1) => { const r = rings()[n]; for (let i = 0; i < r.n; i++) { const a = window.ra(n, i); if (a0 <= a1 ? a >= a0 && a <= a1 : a >= a0 || a <= a1) return true; } return false; };
})();
