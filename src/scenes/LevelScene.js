// Plays any level (and the Star Station hub) from its JSON definition.
import { TILE, VIEW_H, ART, DEBUG } from '../core/constants.js';
import { Input } from '../core/input.js';
import { Save } from '../core/save.js';
import { Audio } from '../audio/audio.js';
import { buildLevel } from '../level/build.js';
import { THEMES, TILE_IDX, PAD, buildTileset, buildBackground, buildThemeObjects } from '../art/themes.js';
import { Player } from '../level/Player.js';
import { Winnie } from '../level/Winnie.js';
import { FX } from '../level/fx.js';
import * as O from '../level/objects.js';
import { HubPortal, HubDoor, CatBed } from '../level/hubObjects.js';
import * as M from '../level/mechanics.js';
import { makeText } from '../ui/ui.js';
import { STAR_BY_ID } from '../data/stars.js';

const ABILITY_RANGE = { pounce: { dx: 470, dy: 380 }, meow: 360, eyes: 380 };

export class LevelScene extends Phaser.Scene {
  constructor() { super('Level'); }

  init(data) {
    this.levelId = data.id || 'hub';
    this.fromPortal = data.from || null;
    this.isHub = this.levelId === 'hub';
    // Phaser reuses this scene object on restart, so clear any flags left from the previous visit.
    this.leaving = false; this.ready = false; this.finished = false; this.busyModal = false;
    this.syncT = 0; this.lastFail = null; this.winnieAction = null; this.interact = null;
  }

  async create() {
    this.ready = false;
    const def = this.cache.json.get(`level-${this.levelId}`);
    this.def = def;
    this.lv = buildLevel(def);
    this.themeName = def.theme;
    this.theme = THEMES[def.theme];
    this.assist = !!Save.settings.assist;
    this.invincible = !!Save.settings.invincible;
    this.hzRate = this.assist ? 0.7 : 1;
    this.levelTime = 0; this.hz = 0; this.fails = 0; this.cpFails = 0; this.hintLevel = 0;
    this.glimmers = 0; this.paused = false; this.finished = false; this.busyModal = false;
    this.runShards = [false, false, false];
    this.objs = []; this.doors = {}; this.pounceTargets = []; this.walkers = []; this.hidden = []; this.revealables = [];
    this.portals = []; this.hubDoors = []; this.interact = null;
    this.movers = {}; this.beams = null; this.squeezes = [];
    Audio.setMusicTone && Audio.setMusicTone(false);
    this.phase = this.lv.rows.some(r => /[LD]/.test(r)) ? new M.PhaseSystem(this) : null;

    buildTileset(this, this.themeName);
    await buildThemeObjects(this, this.themeName);
    if (!this.sys || !this.sys.isActive()) return; // scene was stopped while textures were building
    this.setupCamera();
    this.buildBackground();
    this.buildTerrain();
    this.platforms = this.physics.add.group({ allowGravity: false, immovable: true });
    this.fx = new FX(this);
    this.buildObjects();

    // player + Winnie
    let sx = this.lv.start.c * TILE + TILE / 2, sy = (this.lv.start.r + 1) * TILE - 40;
    if (this.isHub && this.fromPortal) {
      const p = this.portals.find(q => q.star.id === this.fromPortal);
      if (p) { sx = p.x; sy = p.y - 40; }
    }
    this.player = new Player(this, sx, sy, Save.data.outfit);
    this.winnie = new Winnie(this, this.player);
    this.winnie.x = sx - 54; this.winnie.y = sy + 40;
    this.cp = { x: sx, y: sy, idx: -1, section: this.lv.sectionAt(Math.floor(sx / TILE)) };

    this.physics.add.collider(this.player.body, this.layer);
    this.physics.add.collider(this.player.body, this.platforms, (pl, plat) => {
      if (pl.body.touching.down && plat.owner) this.player.ride = plat.owner.zone;
      if (pl.body.touching.up && plat.owner && plat.owner.bump) plat.owner.bump();
    });
    this.physics.world.setBounds(0, 0, this.lv.W * TILE, this.lv.H * TILE + 400);
    this.physics.world.setBoundsCollision(true, true, false, false);
    this.player.body.body.setCollideWorldBounds(true);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.lv.W * TILE, this.lv.H * TILE);
    cam.startFollow(this.player.body, true, 0.14, 0.12);
    cam.setFollowOffset(0, 40);
    this.lookX = 0;
    cam.fadeIn(350, 18, 11, 46);

    this.events.on('player-step', () => { if (Math.random() < 0.5) this.fx.puff(this.player.x - this.player.facing * 10, this.player.bottom - 2, 1, 0xffffff); });
    this.events.on('player-land', (k) => this.fx.puff(this.player.x, this.player.bottom - 2, Math.round(4 + k * 6)));
    this.events.on('player-jump', () => this.fx.puff(this.player.x, this.player.bottom - 2, 3));

    // music
    Audio.playSong(this.theme.music, def.pulse ? 0 : null);
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => { this.scale.off('resize', this.onResize, this); });

    if (DEBUG) this.debugText = this.add.text(10, 10, '', { fontSize: '14px', color: '#fff', backgroundColor: '#0008' }).setScrollFactor(0).setDepth(999);

    this.ready = true;
    this.game.events.emit('level-ready', this);
    if (!this.isHub) this.introduce();
  }

  // ---------------------------------------------------------------- setup
  setupCamera() {
    const cam = this.cameras.main;
    this.zoom = this.scale.height / VIEW_H;
    cam.setZoom(this.zoom);
    cam.setBackgroundColor(this.theme.sky[1]);
  }

  onResize() {
    this.zoom = this.scale.height / VIEW_H;
    this.cameras.main.setZoom(this.zoom);
    this.layoutBg();
  }

  buildBackground() {
    const keys = buildBackground(this, this.themeName);
    this.bgSky = this.add.image(0, 0, keys.sky).setScrollFactor(0).setDepth(-100);
    this.bgFar = this.add.tileSprite(0, 0, 100, 100, keys.far).setScrollFactor(0).setDepth(-90).setTileScale(1 / ART);
    this.bgMid = this.add.tileSprite(0, 0, 100, 100, keys.mid).setScrollFactor(0).setDepth(-80).setTileScale(1 / ART);
    this.layoutBg();
  }

  layoutBg() {
    const cam = this.cameras.main, z = this.zoom;
    const vw = cam.width / z, vh = cam.height / z, cx = cam.width / 2, cy = cam.height / 2;
    this.bgSky.setPosition(cx, cy).setDisplaySize(vw + 4, vh + 4);
    this.bgFar.setPosition(cx, cy).setSize(vw + 4, vh + 4);
    this.bgMid.setPosition(cx, cy + vh / 2 - 180).setSize(vw + 4, 360);
    this.vw = vw; this.vh = vh;
  }

  buildTerrain() {
    const { W, H, rows } = this.lv;
    const map = this.make.tilemap({ tileWidth: TILE * ART, tileHeight: TILE * ART, width: W, height: H });
    const ts = map.addTilesetImage(`tiles-${this.themeName}`, `tiles-${this.themeName}`, TILE * ART, TILE * ART, PAD, PAD * 2);
    const layer = map.createBlankLayer('ground', ts, 0, 0);
    layer.setScale(1 / ART).setDepth(10);
    const solid = (c, r) => r >= 0 && r < H && c >= 0 && c < W && rows[r][c] === '#';
    const isOne = (c, r) => c >= 0 && c < W && rows[r][c] === '=';
    this.hazardCells = [];
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const ch = rows[r][c];
        if (ch === '#') {
          const mask = (solid(c, r - 1) || r === 0 ? 1 : 0) | (solid(c + 1, r) || c === W - 1 ? 2 : 0) | (solid(c, r + 1) || r === H - 1 ? 4 : 0) | (solid(c - 1, r) || c === 0 ? 8 : 0);
          layer.putTileAt(TILE_IDX.solidBase + mask, c, r);
        } else if (ch === '=') {
          const l = isOne(c - 1, r), rr = isOne(c + 1, r);
          const k = l && rr ? 1 : (!l && rr ? 0 : (l && !rr ? 2 : 3));
          const t = layer.putTileAt(TILE_IDX.oneway + k, c, r);
          t.setCollision(false, false, true, false);
        } else if (ch === '^') {
          layer.putTileAt(TILE_IDX.spike, c, r);
        } else if ((ch === 'L' || ch === 'D') && this.phase) {
          layer.putTileAt(ch === 'L' ? TILE_IDX.light : TILE_IDX.dark, c, r);
          this.phase.register(c, r, ch);
        }
      }
    }
    layer.setCollisionBetween(0, 15);
    // one-way tiles: collide only from above (set after setCollisionBetween so it isn't overwritten)
    layer.forEachTile(t => { if (t.index >= TILE_IDX.oneway && t.index < TILE_IDX.oneway + 4) t.setCollision(false, false, true, false); });
    this.layer = layer; this.map = map;
    if (this.phase) { this.phase.apply(true); this.objs.push(this.phase); }

    // plasma pools: animated surface strip + deep fill
    this.plasmaStrips = [];
    const deep = Phaser.Display.Color.HexStringToColor(this.theme.plasma[2]).color;
    for (let r = 0; r < H; r++) {
      let start = -1;
      for (let c = 0; c <= W; c++) {
        const isP = c < W && rows[r][c] === '~';
        if (isP && start < 0) start = c;
        if ((!isP || c === W) && start >= 0) {
          const w = (c - start) * TILE;
          const surface = r === 0 || rows[r - 1].slice(start, c).split('').some(ch => ch !== '~');
          if (surface) {
            const ts2 = this.add.tileSprite(start * TILE, r * TILE, w, TILE, `plasma-${this.themeName}`).setOrigin(0, 0).setTileScale(1 / ART).setDepth(12);
            this.plasmaStrips.push(ts2);
          } else this.add.rectangle(start * TILE, r * TILE, w, TILE, deep).setOrigin(0, 0).setDepth(12);
          start = -1;
        }
      }
    }
  }

  buildObjects() {
    const lv = this.lv, add = (o) => { this.objs.push(o); return o; };
    lv.coins.forEach(({ c, r }) => add(new O.Glimmer(this, c, r)));
    lv.hiddenCoins.forEach(({ c, r }) => { const g = add(new O.Glimmer(this, c, r, true)); this.revealables.push(g); });
    this.totalGlimmers = lv.coins.length + lv.hiddenCoins.length;
    lv.hiddenRuns.forEach(run => { const h = add(new O.HiddenPlat(this, run)); this.hidden.push(h); this.revealables.push(h); });
    this.lanterns = lv.checkpoints.map((cp, i) => add(new O.Lantern(this, cp.c, cp.r, i, cp.assist)));
    if (lv.goal) this.gate = add(new O.Gate(this, lv.goal.c, lv.goal.r));
    lv.shardSpots.forEach(({ c, r }) => add(new O.ShardPickup(this, c * TILE + TILE / 2, r * TILE + TILE / 2, 1, false)));
    lv.walkers.forEach(({ c, r }) => this.walkers.push(add(new O.Walker(this, c, r, this.theme.walker, 3))));
    for (const o of lv.objects) {
      switch (o.t) {
        case 'flare': add(new O.Flare(this, o)); break;
        case 'loop': add(new O.Loop(this, o)); break;
        case 'mover': add(new O.Mover(this, o)); break;
        case 'pulse': add(new O.PulsePlat(this, o)); break;
        case 'pspike': add(new O.PulseSpikes(this, o)); break;
        case 'sign': add(new O.Sign(this, o)); break;
        case 'shrine': add(new O.Shrine(this, o)); break;
        case 'bell': { const b = add(new O.Bell(this, o)); this.pounceTargets.push(b); break; }
        case 'door': { const d = add(new O.Door(this, o)); this.doors[o.id] = d; break; }
        case 'bellpuzzle': add(new O.BellPuzzle(this, o)); break;
        case 'walker': this.walkers.push(add(new O.Walker(this, o.x, o.y, this.theme.walker, o.range || 3))); break;
        case 'shard': { const s = add(new O.ShardPickup(this, o.x * TILE + TILE / 2, o.y * TILE + TILE / 2, 1, !!o.hidden)); if (o.hidden) this.revealables.push(s); break; }
        case 'portal': this.portals.push(add(new HubPortal(this, o))); break;
        case 'hubdoor': this.hubDoors.push(add(new HubDoor(this, o))); break;
        case 'catbed': add(new CatBed(this, o)); break;
        case 'wind': add(new M.Wind(this, o)); break;
        case 'lever': { const l = add(new M.Lever(this, o)); this.pounceTargets.push(l); break; }
        case 'mirror': { const m = add(new M.Mirror(this, o)); this.beamSys().mirrors.push(m); this.pounceTargets.push(m); break; }
        case 'emitter': this.beamSys().emitters.push(add(new M.Emitter(this, o))); break;
        case 'receiver': this.beamSys().receivers.push(add(new M.Receiver(this, o))); break;
        case 'squeeze': this.squeezes.push(add(new M.Squeeze(this, o))); break;
        case 'swap': this.phase.orbs.push(add(new M.SwapOrb(this, o))); break;
        case 'swapclock': this.phase.clocks.push({ x0: o.x * TILE, x1: o.x2 * TILE, period: o.period || 3, t: 0 }); break;
        case 'text': add({ update() {}, t: makeText(this, o.x * TILE + TILE / 2, o.y * TILE + TILE / 2, o.text, o.size || 26, { wrap: o.wrap }).setDepth(15) }); break;
        default: console.warn('unknown object', o.t);
      }
    }
  }

  beamSys() { if (!this.beams) { this.beams = new M.BeamSystem(this); this.objs.push(this.beams); } return this.beams; }

  makeText(x, y, s, size, opts) { return makeText(this, x, y, s, size, opts); }

  // ---------------------------------------------------------------- start of level
  introduce() {
    const star = STAR_BY_ID[this.levelId];
    // Teach any earlier abilities this level needs that Landon hasn't learned yet (levels can be played in any order).
    const need = (this.def.abilities || []).filter(a => a !== this.def.teaches && !Save.hasAbility(a));
    const queue = need.slice();
    const fact = () => { if (star) this.game.events.emit('toast', { title: star.name, text: star.fact, icon: 'shard', ms: 4200 }); };
    // lessons first (they pause the level), then the star's fun fact
    this.time.delayedCall(500, () => {
      if (!queue.length) { fact(); return; }
      const run = () => { const a = queue.shift(); if (!a) { fact(); return; } this.learnAbility(a, null, run); };
      run();
    });
  }

  learnAbility(ability, shrine, after) {
    const fresh = Save.learn(ability);
    this.freeze(true);
    Audio.sfx('learn');
    if (shrine) this.fx.starBurst(shrine.x, shrine.y - 80, 24, 0xbff0ff);
    this.winnie.react('happy');
    this.scene.launch('Learn', { ability, fresh, onClose: () => { this.freeze(false); after && after(); } });
  }

  freeze(on) {
    this.busyModal = on;
    if (on) { this.physics.pause(); this.player.frozen = true; this.player.play('idle'); }
    else { this.physics.resume(); this.player.frozen = false; Input.update(); }
  }

  // ---------------------------------------------------------------- per-frame
  update(time, deltaMs) {
    if (!this.ready) return;
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    if (!this.busyModal) {
      this.levelTime += dt; this.hz += dt * this.hzRate;
    }
    // keep rhythm music locked to the game clock
    if (this.def.pulse && Audio.song && Audio.song.name === this.theme.music) {
      this.syncT = (this.syncT || 0) + dt;
      if (this.syncT > 1) { this.syncT = 0; Audio.syncTo(this.levelTime); }
    }

    const p = this.player;
    if (!this.busyModal) {
      p.update(dt, this.assist);
      this.winnie.update(dt);
      for (const o of this.objs) o.update(dt);
      if (!p.dead && !this.finished) {
        this.checkHazards();
        this.updateWinnieAction();
        if (Input.pressed('winnie')) this.useWinnie();
        if (this.isHub && (Input.pressed('up')) && this.interact) this.useWinnie();
      }
    } else {
      p.updateVisual(dt);
    }

    // camera look-ahead
    const want = p.facing * 90 * (Math.abs(p.vx) > 40 ? 1 : 0.4);
    this.lookX += (want - this.lookX) * Math.min(1, dt * 2.2);
    this.cameras.main.setFollowOffset(-this.lookX, 50);

    // parallax
    const cam = this.cameras.main;
    this.bgFar.tilePositionX = cam.scrollX * 0.12 * ART;
    this.bgMid.tilePositionX = cam.scrollX * 0.3 * ART;
    for (const s of this.plasmaStrips) s.tilePositionX += dt * 40 * ART;
    if (this.def.pulse) {
      const s = this.pulseAt(0);
      this.bgSky.setTint(Phaser.Display.Color.GetColor(255, Math.round(200 + 55 * (1 - s)), Math.round(200 + 55 * (1 - s))));
      this.bgFar.setScale(1 + s * 0.015);
    }
    if (this.debugText) {
      const b = p.body.body;
      this.debugText.setText(`fps ${this.game.loop.actualFps.toFixed(0)}  x ${Math.round(p.x)} (${Math.floor(p.x / TILE)})  y ${Math.round(b.bottom)} (${Math.floor((b.bottom - 1) / TILE)})  vx ${Math.round(b.velocity.x)} vy ${Math.round(b.velocity.y)}  g ${p.grounded}  t ${this.levelTime.toFixed(1)}  fails ${this.fails}`);
    }
  }

  // 0..1 "star size" for rhythm objects. 1 = swollen (on the downbeat).
  pulseAt(phaseOffset = 0) {
    const period = this.def.pulse ? this.def.pulse.period : 2;
    const ph = this.levelTime / period + phaseOffset;
    return 0.5 + 0.5 * Math.cos(ph * Math.PI * 2);
  }

  checkHazards() {
    const p = this.player, hb = p.getHitbox(7);
    const c0 = Math.floor(hb.x / TILE), c1 = Math.floor(hb.right / TILE), r0 = Math.floor(hb.y / TILE), r1 = Math.floor(hb.bottom / TILE);
    const rows = this.lv.rows;
    for (let r = Math.max(0, r0); r <= Math.min(this.lv.H - 1, r1); r++) {
      for (let c = Math.max(0, c0); c <= Math.min(this.lv.W - 1, c1); c++) {
        const ch = rows[r][c];
        if (ch === '^' && hb.bottom > r * TILE + 22) return this.fail('spikes');
        if (ch === '~' && hb.bottom > r * TILE + 16) return this.fail('plasma');
      }
    }
    if (p.body.body.top > this.lv.H * TILE + 60) this.fail('pit');
  }

  hasPlatformAt(x, y) {
    return this.platforms.getChildren().some(z => z.body.enable && x >= z.body.left && x <= z.body.right && y >= z.body.top - 4 && y <= z.body.bottom + 8);
  }

  // ---------------------------------------------------------------- Winnie's abilities
  updateWinnieAction() {
    let act = null;
    const w = this.winnie, p = this.player;
    if (this.isHub) {
      const near = [...this.portals, ...this.hubDoors].find(o => o.isNear && o.isNear(p));
      this.interact = near || null;
      if (near) act = { kind: 'go', target: near };
    }
    if (!act && Save.hasAbility('squeeze') && !w.busy) {
      const sq = this.squeezes.find(q => q.near(p));
      if (sq) act = { kind: 'squeeze', target: sq };
    }
    if (!act && Save.hasAbility('pounce') && !w.busy) {
      let best = null, bd = Infinity;
      for (const t of this.pounceTargets) {
        if (t.usable === false || (t.canPounce && !t.canPounce(p))) continue;
        const dx = Math.abs(t.tx - p.x), dy = Math.abs(t.ty - p.bottom);
        if (dx < ABILITY_RANGE.pounce.dx && dy < ABILITY_RANGE.pounce.dy && dx + dy < bd) { bd = dx + dy; best = t; }
      }
      if (best) act = { kind: 'pounce', target: best };
    }
    if (!act && Save.hasAbility('meow')) {
      if (this.walkers.some(e => e.alive && Math.abs(e.x - p.x) < ABILITY_RANGE.meow && Math.abs(e.y - p.bottom) < 200)) act = { kind: 'meow' };
    }
    if (!act && Save.hasAbility('nightEyes')) act = { kind: 'eyes' };
    this.winnieAction = act;
  }

  useWinnie() {
    const a = this.winnieAction, w = this.winnie;
    if (!a) { w.react('happy'); Audio.sfx('meow', { pitch: 1.2 }); return; }
    if (a.kind === 'go') { a.target.activate(); return; }
    if (w.busy) return;
    if (a.kind === 'squeeze') { a.target.go(); return; }
    if (a.kind === 'pounce') {
      w.pounce(a.target.tx, a.target.ty, () => a.target.hit());
    } else if (a.kind === 'meow') {
      w.meow((x, y) => {
        this.fx.ring(x, y, 0xffe680, ABILITY_RANGE.meow);
        for (const e of this.walkers) if (e.alive && Math.hypot(e.x - x, e.y - y) < ABILITY_RANGE.meow + 40) e.startle();
        this.events.emit('meow', x, y);
      });
    } else if (a.kind === 'eyes') {
      w.nightEyes((x, y) => {
        this.fx.ring(x, y, 0x9fffb0, ABILITY_RANGE.eyes, 650);
        for (const o of this.revealables) {
          const ox = o.cx ?? o.x, oy = o.cy ?? o.y;
          // reveal if any part is within range (platform runs can be wide)
          const dx = o.w ? Math.max(0, Math.abs(ox - x) - o.w / 2) : Math.abs(ox - x);
          if (Math.hypot(dx, oy - y) < ABILITY_RANGE.eyes + 30) o.reveal();
        }
        this.events.emit('nighteyes', x, y);
      });
    }
  }

  // ---------------------------------------------------------------- events
  onGlimmer() { this.glimmers++; }

  hasShard(i) { return Save.shards(this.levelId)[i] || this.runShards[i]; }

  onShard(pick) {
    this.runShards[pick.index] = true;
    const fresh = Save.setShard(this.levelId, pick.index);
    Audio.sfx('shard');
    this.fx.starBurst(pick.x, pick.y, 26);
    this.shake(0.005, 200);
    this.winnie.react('happy');
    this.game.events.emit('toast', { title: fresh ? 'Star Shard!' : 'Star Shard (again!)', text: fresh ? 'You found the secret shard!' : 'You already had this one.', icon: 'shard', ms: 2400 });
  }

  setCheckpoint(lantern) {
    this.cp = { x: lantern.x, y: lantern.y - 40, idx: lantern.idx, section: this.lv.sectionAt(Math.floor(lantern.x / TILE)), dark: this.phase ? this.phase.dark : false };
    this.cpFails = 0; this.hintLevel = 0;
    this.game.events.emit('hint-reset');
  }

  puzzleSolved() { this.cpFails = 0; this.game.events.emit('hint-reset'); }
  puzzleMistake() { this.registerStruggle(); }

  registerStruggle() {
    this.cpFails++;
    if (this.cpFails >= 3 && this.currentHints()) this.game.events.emit('hint-available');
  }

  currentHints() {
    const sec = this.lv.sections[this.cp.section];
    const p = this.lv.sections[this.lv.sectionAt(Math.floor(this.player.x / TILE))];
    return (p && p.hints) || (sec && sec.hints) || null;
  }

  nextHint() {
    const h = this.currentHints(); if (!h) return null;
    const txt = h[Math.min(this.hintLevel, h.length - 1)];
    this.hintLevel = Math.min(this.hintLevel + 1, h.length - 1);
    return { text: txt, level: this.hintLevel, max: h.length };
  }

  shake(intensity = 0.005, ms = 200) { this.cameras.main.shake(ms, intensity); }

  fail(reason) {
    const p = this.player;
    if (p.dead || this.finished || p.invuln > 0) return;
    this.lastFail = reason;
    if (this.invincible && reason !== 'pit') { p.invuln = 0.6; this.shake(0.003, 100); return; }
    p.dead = true;
    this.fails++; Save.data.stats.fails++;
    this.registerStruggle();
    Audio.sfx('fail');
    this.winnie.react('fail');
    const b = p.body.body;
    b.setVelocity(0, 0); b.setAllowGravity(false); b.enable = false;
    if (reason !== 'pit') {
      p.play('hurt'); p.squash(1.3, 0.75);
      this.shake(0.006, 180);
      this.fx.burst(p.x, p.body.y, 0xffffff, 14);
      this.tweens.add({ targets: p.sprite, y: p.sprite.y - 60, duration: 260, ease: 'Quad.easeOut', yoyo: true, hold: 60 });
    }
    this.time.delayedCall(reason === 'pit' ? 250 : 650, () => {
      this.cameras.main.fadeOut(200, 18, 11, 46);
      this.time.delayedCall(220, () => this.respawn());
    });
  }

  respawn() {
    const p = this.player, b = p.body.body;
    b.enable = true; b.setAllowGravity(true);
    if (this.phase && this.phase.dark !== !!this.cp.dark) { this.phase.dark = !!this.cp.dark; this.phase.apply(true); }
    p.teleport(this.cp.x, this.cp.y);
    p.dead = false; p.invuln = 0.7; p.vx = 0; p.play('idle'); p.squash(0.8, 1.2);
    this.winnie.reset();
    this.cameras.main.fadeIn(260, 18, 11, 46);
    this.cameras.main.centerOn(p.x, p.y);
    Audio.sfx('respawn');
    this.fx.starBurst(p.x, p.body.y, 10, 0xffe680);
  }

  finishLevel(gate) {
    if (this.finished) return;
    this.finished = true;
    const p = this.player;
    p.frozen = true; p.body.body.setVelocity(0, 0); p.play('celebrate');
    this.winnie.react('happy');
    Audio.stopSong(); Audio.sfx('win');
    this.fx.starBurst(gate.x, gate.y - 80, 40);
    this.shake(0.004, 300);
    // evaluate shards
    const ch = this.def.challenge || {};
    let challengeOk = false;
    if (ch.type === 'coins') challengeOk = this.glimmers >= this.totalGlimmers;
    else if (ch.type === 'time') challengeOk = this.levelTime <= ch.seconds;
    else if (ch.type === 'nohit') challengeOk = this.fails === 0;
    const before = Save.shards(this.levelId).slice();
    const newFinish = Save.setShard(this.levelId, 0);
    const newChallenge = challengeOk ? Save.setShard(this.levelId, 2) : false;
    Save.data.done[this.levelId] = true;
    const ms = Math.round(this.levelTime * 1000);
    if (!Save.data.best[this.levelId] || ms < Save.data.best[this.levelId]) Save.data.best[this.levelId] = ms;
    Save.data.coins[this.levelId] = Math.max(Save.data.coins[this.levelId] || 0, this.glimmers);
    Save.save();
    const result = {
      id: this.levelId, time: this.levelTime, glimmers: this.glimmers, total: this.totalGlimmers, fails: this.fails,
      challenge: ch, challengeOk, before, after: Save.shards(this.levelId).slice(), newFinish, newChallenge, gotHidden: this.runShards[1],
    };
    this.game.events.emit('level-finished', result);
    this.time.delayedCall(1500, () => this.scene.launch('Complete', result));
  }

  // ---------------------------------------------------------------- test/debug hooks
  debugState() {
    const p = this.player;
    return {
      id: this.levelId, x: p.x, y: p.bottom, tx: Math.floor(p.x / TILE), ty: Math.floor((p.bottom - 1) / TILE), vx: p.body.body.velocity.x, vy: p.body.body.velocity.y,
      grounded: p.grounded, dead: p.dead, finished: this.finished, time: this.levelTime, fails: this.fails, glimmers: this.glimmers, total: this.totalGlimmers,
      shards: Save.shards(this.levelId), runShards: this.runShards.slice(), cp: this.cp.idx, busy: this.busyModal, winnie: this.winnieAction && this.winnieAction.kind, pulse: this.pulseAt(0),
    };
  }
}
