# Landon and Winnie: Journey to the Stars

A touch-first cartoon platformer for iPad. Landon and his calico kitten Winnie hop across ten real stars, from the Sun to a quasi-star with a black hole at its heart, collecting Star Shards and facing The Reaper at the end.

**Status: complete.** All ten stars are playable, from the Sun to the Quasi-Star. Star Station (the hub) has the museum, closet, trophy wall, parent menu and two secrets. The Quasi-Star ends with The Reaper boss fight, a little story and the credits. Beating it opens a hidden bonus portal to the Neutron Star.

| Star | New idea | Winnie | Bonus shard |
| --- | --- | --- | --- |
| Sun | flares, sunspots, bounce loops | learns Night Eyes | every Glimmer |
| Arcturus | stellar wind gusts, floating rocks, switch-and-lift puzzle | learns Pounce | no oops |
| Betelgeuse | the star breathes: platforms and spikes pulse to the music | bell riddle | beat 2:50 |
| Mu Cephei | light beams, mirrors to bonk or pounce, crystal caves | learns Squeeze | beat 1:50 |
| VV Cephei A | sun blocks and moon blocks, orbs, a clock that flips sides | switches and cages | every Glimmer |
| VY Canis Majoris | dust storms that hide the level, singing-crystal memory puzzles | learns Meow | every Glimmer |
| UY Scuti | gravity orbs: fall up and run on the ceiling, spikes on both sides | flips upside down with you | no oops |
| Stephenson 2-18 | the gauntlet: one section for every idea so far, then a 5-note song in a storm | everything | beat 4:00 |
| WOH G64 | dust rings: rocks that orbit like a Ferris wheel, a switch that freezes a ring, and the **Dust Bunny King** mini-boss | pounces the freeze switch | beat 3:20 |
| The Quasi-Star | black holes that pull you sideways, slow-time bubbles, and **The Reaper** (3 phases × 3 hearts) | MEOW pops its shield, POUNCE grabs its lantern | every Glimmer |
| Neutron Star (bonus) | pulsar beams that sweep like a lighthouse, plus remixes of flares, flips and rings | everything | beat 2:10 |

**The Reaper.** In phase 1 it swoops at a pink circle on the floor, then its scythe gets stuck, so you bonk its head. In phase 2 it rolls dark balls at you, then hides in a bubble that Winnie's MEOW pops. In phase 3 it opens a black hole and throws scythes, low ones to jump and high ones to stay under. When its lantern glows, Winnie POUNCES it and the Reaper tumbles out. A health bar at the top shows its hearts and phase. If Landon gets hit, he restarts at the arena lantern and the Reaper keeps the damage it has taken.

## Play it locally

The game is plain static files with no build step. You can serve the folder with any web server:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>. You can also use the bundled Node server, which prints a Wi-Fi address you can open on the iPad:

```bash
source scripts/env.sh && npm run serve
```

Useful URL options:

| URL | What it does |
| --- | --- |
| `?level=sun`, `arcturus`, `betelgeuse`, `mucephei`, `vvcephei`, `vycma`, `uyscuti`, `stephenson`, `wohg64`, `quasistar`, `neutron`, `hub` | Jump straight into a level (level-select cheat) |
| `?debug=1` | FPS and position overlay. Keys: **N**/**B** next/previous lantern, **0/1/3** load hub/Sun/Betelgeuse, **I** invincible |
| `?debug=1&bodies=1` | Also draws the physics boxes |
| `?nosw=1` | Skips the offline cache (handy while editing files) |

## Put it on the iPad

1. Deploy it (see below) so it has an `https://` address. iPadOS only installs and caches web apps over HTTPS.
2. On the iPad, open that address in **Safari**.
3. Tap **Share** (the square with an arrow), then **Add to Home Screen**, then **Add**.
4. Launch it from the new home-screen icon. It runs full screen in landscape. After the first launch it works with no internet.

## Deploy

**GitHub Pages:** push `main` to GitHub. In the repo, go to **Settings → Pages → Build and deployment**, set **Source** to *Deploy from a branch*, and pick `main` and `/ (root)`. The site appears at `https://<user>.github.io/landon-winnie-star-game/`. All paths are relative, so the sub-folder is fine.

**Netlify:** either drag the project folder onto <https://app.netlify.com/drop>, or connect the repo with no build command and `.` as the publish directory.

**After changing any game file, run `npm run build`** (or `node scripts/build-sw.mjs`) before deploying. It regenerates `sw.js` with a new version hash, so iPads pick up the update on their next launch. Without it, they keep the old cached copy.

## Controls

| | Touch | Keyboard | Game controller (e.g. Switch Pro) |
| --- | --- | --- | --- |
| Move | Two big arrows, bottom left. Slide your finger between them | ←/→ or A/D | Left stick or D-pad |
| Jump (hold for a higher jump) | Green JUMP button | Space / Z / K | B or A (bottom/right face buttons) |
| Winnie | Purple cat button. Its icon shows what she'll do: LOOK, POUNCE, MEOW, GO! | X / J / C | Y or X (left/top face buttons) |
| Enter a portal or door | Winnie button shows GO!, or tap the info card | ↑ or X | Up or Y/X |
| Pause | Pause button, top right | Esc / P | + or − |

**Parent menu:** hold the top-left corner of the screen for 3 seconds (keyboard: Esc + ↓). It has Assist mode (slower hazards, wider platforms, extra lanterns), Invincible, Sound and Music, Unlock all levels, and Reset progress (tap twice).

## How the game works

- **Star Shards:** each level has 3: finish it, find its secret shard, and beat its bonus challenge (see the table above). The Quasi-Star portal opens at 20 shards. The Neutron Star's 3 bonus shards don't count toward the 30.
- **No lives:** a mistake costs about 1.5 seconds and puts Landon back at the last lantern. After 3 misses in one spot, a lightbulb appears with hints that get clearer each time you tap it.
- **Winnie's abilities** unlock the first time a level needs them, with a one-screen picture lesson, so every level can be played in any order.
- **Progress auto-saves** to the iPad (localStorage). If storage is blocked, it falls back to memory.

## How long is it?

The test bot plays each level in 1 to 3 minutes without mistakes. A young player takes about 3 to 6 minutes per star, with retries and exploring. That adds up to about **1 to 1.5 hours** to reach The Reaper and see the credits, and about **2 to 3 hours** to find all 30 shards and finish the bonus Neutron Star.

## Editing levels

Levels live in `levels/*.json`. Each level is a list of **sections**, and each section is 16 rows of ASCII that get joined left to right. Object coordinates are in tiles, relative to their section.

```
.  empty       #  ground       =  one-way platform    ^  spikes     ~  plasma (hazard)
L  sun block (solid on the light side)                D  moon block (solid on the dark side)
v  ceiling spikes (hang down; deadly when walking upside down)
o  Glimmer     h  hidden Glimmer (Night Eyes)          H  hidden platform (Night Eyes)
S  secret shard   P  start   G  goal gate   C  lantern (checkpoint)   c  assist-only lantern
w  walker enemy
```

Objects: `flare`, `loop` (bounce arc), `mover` (add `"id"` and `"wait": true` for a lift a switch starts), `pulse` (Betelgeuse platform), `pspike`, `wind` (gusts), `lever` (star switch Winnie pounces: `opens`, `starts`, `swap`), `emitter` / `mirror` / `receiver` (light beams), `squeeze` (cat door), `swap` (sun/moon orb, `"to": "light"` or `"dark"`), `swapclock`, `storm` (dust storm), `songstone` + `pad` (Meow memory puzzle), `gravity` (orb, `"to": "up"` or `"down"`), `ring` (dust ring: `r`, `n` rocks, `period`, negative spins the other way; a lever with `"freezes": id` and `"toggle": true` stops it), `pull` (black hole: `range`, `power`), `slow` (slow-time bubble: `r`), `pulsar` (`len`, `period`, `beams`), `boss` (`"kind": "dustking"` or `"reaper"`, arena columns `x`..`x2`, floor row `y`, `trigger` column), `teaser`, `sign`, `shrine` (teaches an ability), `bell`, `bellpuzzle`, `door`, `shard` (with `"hidden": true` for Night Eyes), and the hub's `portal` and `hubdoor`. Each section can carry three escalating `hints`.

The player's physics numbers are in `src/core/constants.js`. Jump height is about 3.3 tiles, and a running jump covers about 4.5 tiles.

## Tests

The toolchain (Node 22, Playwright, and the Chromium and WebKit test browsers) lives in `.tools/`, which is git-ignored. Load it with `source scripts/env.sh`.

```bash
source scripts/env.sh
npm test                                  # all projects: iPad 1180x820 + 1024x768 (Chromium, touch) and WebKit
npx playwright test --project=ipad-1180   # just one
node tests/reach.mjs                      # static reachability check of every level
node tests/route.mjs arcturus             # watch the bot's log for one level
node tests/boss.mjs quasistar 184         # drop the bot into a boss arena (level, arena start column)
```

What's covered:

- **Clean loads:** every level loads with no console errors, and holds ≥ 50 fps while running (Chromium with GPU).
- **Bot playthroughs:** `tests/bot.js` plays each level from `tests/routes/<level>.json` through the real input layer and physics. It must finish the level and pick up the secret shard. For boss fights it switches to a simple reactive "brain" that dodges, stomps and uses Winnie, so both bosses are proven beatable. In those runs it beats the Dust Bunny King in about 20 seconds and The Reaper in about 2 minutes, without getting hit.
- **Reachability:** `tests/reach.mjs` simulates the jump physics over the level grid and fails if any Glimmer, shard, lantern, bell or goal can't be reached.
- **Input, saving and offline:** multi-touch (run and jump at once), a mocked Switch-style gamepad, save and reload, blocked storage, the hint bulb, the parent-corner hold, and offline play through the service worker.

## Why Phaser 3

It's the most battle-tested 2D web engine. Its WebGL renderer and arcade physics hold 60 fps on iPads, and it already handles multi-touch, gamepads, particles, tweens, tilemaps and scaling. That leaves the effort for the game itself. Phaser 4 is newer and less proven, so this uses 3.90.

## Project layout

```
index.html, manifest.webmanifest, sw.js (generated), icons/
src/main.js            boot, scene flow, iPad gesture blocking, debug hooks
src/core/              constants (physics), input (touch/keys/gamepad), save
src/audio/             WebAudio synth + original songs (no samples)
src/art/               all art as code: Landon, Winnie, props, themes (tiles/backgrounds)
src/level/             level parser, player, Winnie, objects, hub objects, particles
src/scenes/            Boot, Title, Level (also the hub), UI (HUD + touch), menus
src/data/stars.js      star names, sizes, difficulty, fun facts
levels/                level JSON
tests/                 Playwright specs, bot, routes, reachability checker
tools/                 icon renderer, art preview page
```

## Credits and licenses

- **Art:** all characters, tiles, backgrounds, icons and UI are drawn in code (SVG and Canvas) in `src/art/`. There are no image assets except the app icons, which are rendered from that same code.
- **Music and sound:** all composed and synthesized in code with WebAudio (`src/audio/`). There are no audio files.
- **Engine:** [Phaser 3.90](https://phaser.io), MIT license, at `vendor/PHASER-LICENSE.md`.
- **Characters:** Landon, Winnie and The Reaper are original designs for this game. Nothing is taken from other games or shows.

### A note on star sizes

Star sizes are uncertain, and the game always says "about". Two oddities are worth knowing:

- **UY Scuti:** older estimates put it around 1,700 Sun-widths, but newer ones say closer to 900. The game shows "about 900 to 1,700".
- **WOH G64:** it is probably smaller than Stephenson 2-18, so levels 8 and 9 are not strictly increasing in size.

The lineup and order are the ones Landon approved.
