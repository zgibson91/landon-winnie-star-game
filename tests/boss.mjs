// Dev helper: start a level at its boss arena and let the bot's boss brain fight it.
//   node tests/boss.mjs <level> <arenaStartCol> [--shots dir]
import { chromium } from '@playwright/test';
const [level, col] = process.argv.slice(2);
const shotDir = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 }, hasTouch: true });
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await page.goto(`http://localhost:8080/?nosw=1&test=1&level=${level}`);
await page.addScriptTag({ path: new URL('./bot.js', import.meta.url).pathname });
await page.waitForFunction(() => window.LW && LW.state(), null, { timeout: 20000 });
await page.evaluate(() => { LW.Save.reset(); for (const a of ['nightEyes', 'pounce', 'meow', 'squeeze']) LW.Save.learn(a); });
await page.waitForTimeout(1500);
await page.evaluate((c) => { const L = LW.level(); L.player.teleport(c * 48 + 72, 11 * 48); }, Number(col));
await page.waitForTimeout(600);
await page.evaluate(() => LWBot.start([{ note: 'walk in', dir: 1, until: '!!L.boss', ms: 8000 }, { note: 'fight', boss: true, ms: 300000 }, { note: 'after', dir: 0, until: 'L.finished || true', ms: 100 }]));
const t0 = Date.now(); let n = 0;
while (Date.now() - t0 < 160000) {
  await page.waitForTimeout(500);
  const st = await page.evaluate(() => ({ done: LWBot.done, failed: LWBot.failed, b: LW.level().boss && [LW.level().boss.state, LW.level().boss.phase, LW.level().boss.hearts] }));
  n++; if (shotDir && n % 6 === 0) await page.screenshot({ path: `${shotDir}/${level}-boss-${String(n).padStart(3, '0')}.png` });
  if (n % 8 === 0) console.log('tick', JSON.stringify(st), await page.evaluate(() => { const L = LW.level(), P = L.player, B = L.boss; return `t=${L.levelTime.toFixed(1)} P=${P.x.toFixed(0)},${P.bottom.toFixed(0)} vy=${P.body.body.velocity.y.toFixed(0)} g=${P.grounded} B=${B ? B.x.toFixed(0) + ' floor ' + B.floor + ' x0 ' + B.x0 + ' x1 ' + B.x1 : '-'} inp=${JSON.stringify(LW.Input.bot)} sc=${B ? B.scythes.map(c => c.spr.x.toFixed(0)+","+c.y+","+c.vx).join(" ") : ""} orbs=${B ? B.orbs.map(o => o.spr.x.toFixed(0)+","+o.spr.y.toFixed(0)+","+o.vx).join(" ") : ""}`; }));
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); break; }
  if (st.failed || (st.done && Date.now() - (globalThis.doneAt ||= Date.now()) > 20000)) break;
}
const r = await page.evaluate(() => ({ done: LWBot.done, failed: LWBot.failed, log: LWBot.log.slice(-14), deaths: LWBot.bossDeaths || 0, t: LW.level().levelTime, boss: LW.level().boss && { over: LW.level().boss.over, phase: LW.level().boss.phase, hearts: LW.level().boss.hearts, state: LW.level().boss.state } }));
console.log(r.log.join('\n'));
console.log('RESULT', JSON.stringify({ level, done: r.done, failed: r.failed, deaths: r.deaths, time: r.t.toFixed(1), boss: r.boss }));
if (errs.length) console.log('ERRORS\n' + errs.join('\n'));
await browser.close();
