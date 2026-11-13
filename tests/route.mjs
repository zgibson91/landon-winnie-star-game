// Run a bot route on a level: node tests/route.mjs <level> [--shots dir] [--webkit]
import { chromium, webkit } from '@playwright/test';
import fs from 'node:fs';
const args = process.argv.slice(2);
const level = args[0];
const shotDir = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
const useWebkit = args.includes('--webkit');
const route = JSON.parse(fs.readFileSync(new URL(`./routes/${level}.json`, import.meta.url)));
const browser = await (useWebkit ? webkit : chromium).launch(useWebkit ? {} : { args: ['--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 }, hasTouch: true });
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await page.goto(`http://localhost:8080/?nosw=1&test=1&level=${level}`);
await page.addScriptTag({ path: new URL('./bot.js', import.meta.url).pathname });
await page.waitForFunction(() => window.LW && LW.state(), null, { timeout: 20000 });
await page.evaluate((r) => { LW.Save.reset(); LWBot.start(r.steps); }, route);
const t0 = Date.now(); let n = 0;
while (Date.now() - t0 < (route.timeout || 400) * 1000) {
  await page.waitForTimeout(500);
  const st = await page.evaluate(() => ({ done: LWBot.done, failed: LWBot.failed, i: LWBot.i, s: LW.state() }));
  if (shotDir && n++ % 6 === 0) await page.screenshot({ path: `${shotDir}/${level}-bot-${String(n).padStart(3, '0')}.png` });
  if (st.done || st.failed) break;
}
const res = await page.evaluate(() => ({ dbg: (() => { const L = LW.level(); return L ? `t=${L.levelTime.toFixed(2)} p0=${L.pulseAt(0).toFixed(2)} spikes=` + L.objs.filter(o => o.constructor.name === 'PulseSpikes').map(o => `${o.x/48}:${o.spr[0].y.toFixed(0)}`).join(',') + ` hb=${JSON.stringify(L.player.getHitbox())}` + ` songs=${(L.songstones||[]).map(q => `${q.progress}/${q.seq.length}${q.solved?'!':''} frame${q.spr.frame.name}`).join(' ')} pads=${Object.values(L.pads||{}).map(p => p.id + (p.on?'*':'')).join(',')}` : ''; })(), missed: (LW.level().objs || []).filter(o => o.constructor.name === 'Glimmer' && !o.taken).map(o => `${Math.floor(o.x / 48)},${Math.floor(o.y / 48)}${o.hidden ? 'h' : ''}`).join(' '), done: LWBot.done, failed: LWBot.failed, log: LWBot.log.slice(-12), state: LW.state(), fps: LW.game.loop.actualFps }));
console.log(res.log.join('\n'));
console.log('MISSED', res.missed);
console.log('DBG', res.dbg);
console.log('RESULT', JSON.stringify({ level, done: res.done, failed: res.failed, time: res.state && res.state.time, glimmers: res.state && `${res.state.glimmers}/${res.state.total}`, shards: res.state && res.state.shards, fails: res.state && res.state.fails }));
if (errs.length) console.log('ERRORS\n' + errs.join('\n'));
await browser.close();
process.exit(res.done && !res.failed ? 0 : 1);
