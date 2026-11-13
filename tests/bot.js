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
//   note:  string        label for logs
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
    flare(tx) {
      const L = LW.level(); const f = L.objs.find(o => o.constructor.name === 'Flare' && Math.floor(o.x / TILE) === tx);
      return f ? f.state : 'none';
    },
    flareT(tx) {
      const L = LW.level(); const f = L.objs.find(o => o.constructor.name === 'Flare' && Math.floor(o.x / TILE) === tx);
      return f ? (L.hz + f.offset) % f.period : 0;
    },
    tick() {
      const L = LW.level();
      if (!this.route || this.done || this.failed || !L || !L.ready) { if (this.route && (this.done || this.failed)) LW.Input.bot = {}; return; }
      if (L.busyModal) { LW.Input.bot = { confirm: !this.blink, jump: false }; this.blink = !this.blink; this.stepStart = performance.now(); return; }
      const s = this.route[this.i];
      if (!s) { this.done = true; LW.Input.bot = {}; return; }
      const P = L.player; const el = performance.now() - this.stepStart;
      const inp = { left: s.dir === -1, right: s.dir === 1, jump: !!s.jump && el < s.jump };
      if (s.winnie && !this.winnieTapped) { inp.winnie = true; this.winnieTapped = true; this.winnieAt = el; }
      LW.Input.bot = inp;
      if (P.dead) { this.failed = `died (${L.lastFail}) during step ${this.i} (${s.note || ''}) at ${this.where()}`; return; }
      if (!P.grounded) this.leftGround = true;
      const pulse = (ph) => L.pulseAt(ph || 0);
      const flare = (tx) => this.flare(tx);
      const flareT = (tx) => this.flareT(tx);
      let fin = false;
      if (s.x != null) fin = s.dir === -1 ? P.x <= s.x * TILE + TILE / 2 : P.x >= s.x * TILE + TILE / 2;
      if (s.land) fin = (s.x == null || fin) && this.leftGround && P.grounded && el > 60;
      if (s.until) { try { fin = (s.x == null || fin) && !!(new Function('L', 'P', 'pulse', 'flare', 'flareT', 'return (' + s.until + ')'))(L, P, pulse, flare, flareT); } catch (e) { this.failed = 'bad until: ' + e.message; } }
      if (s.winnie) fin = this.winnieTapped && el > 120 && !L.winnie.busy && (s.until == null || fin);
      if (s.x == null && !s.land && !s.until && !s.winnie) fin = el >= (s.ms || 0);
      else if (s.ms && el >= s.ms && !fin) { this.failed = `timeout in step ${this.i} (${s.note || ''}) at ${this.where()}`; return; }
      if (L.finished) { this.done = true; LW.Input.bot = {}; this.log.push('finished @' + this.where()); return; }
      if (fin) { this.i++; this.begin(); }
    },
  };
  window.LWBot = Bot;
})();
