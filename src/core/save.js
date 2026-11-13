// Auto-save to localStorage, with an in-memory fallback when storage is blocked (private mode etc).
const KEY = 'lw-journey-v1';
let memoryCopy = null;

function defaults() {
  return {
    v: 1,
    shards: {},     // levelId -> [finish, hidden, challenge]
    done: {},       // levelId -> true
    best: {},       // levelId -> best time ms
    coins: {},      // levelId -> best glimmer count
    outfit: 'jersey',
    abilities: {},  // nightEyes, pounce, squeeze, meow
    secrets: {},
    seen: {},       // one-time popups
    settings: { sound: true, music: true, assist: false, invincible: false, unlockAll: false },
    stats: { fails: 0, playMs: 0 },
  };
}

function merge(base, extra) {
  for (const k of Object.keys(extra || {})) {
    if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], extra[k]);
    else base[k] = extra[k];
  }
  return base;
}

export const Save = {
  data: defaults(),
  storageOk: true,
  load() {
    let raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { this.storageOk = false; raw = memoryCopy; }
    try { this.data = merge(defaults(), raw ? JSON.parse(raw) : {}); } catch (e) { this.data = defaults(); }
    return this.data;
  },
  save() {
    const raw = JSON.stringify(this.data);
    memoryCopy = raw;
    try { window.localStorage.setItem(KEY, raw); } catch (e) { this.storageOk = false; }
  },
  reset() {
    this.data = defaults();
    try { window.localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    memoryCopy = null;
    this.save();
  },
  shards(id) { return this.data.shards[id] || [false, false, false]; },
  setShard(id, i) {
    const s = this.shards(id).slice();
    if (s[i]) return false;
    s[i] = true; this.data.shards[id] = s; this.save();
    return true;
  },
  totalShards() {
    return Object.values(this.data.shards).reduce((n, a) => n + a.filter(Boolean).length, 0);
  },
  get settings() { return this.data.settings; },
  setSetting(k, v) { this.data.settings[k] = v; this.save(); },
  hasAbility(a) { return !!this.data.abilities[a]; },
  learn(a) { if (!this.data.abilities[a]) { this.data.abilities[a] = true; this.save(); return true; } return false; },
};
