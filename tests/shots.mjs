// Dev helper: screenshots of places in a level. node tests/shots.mjs <level> <outdir> tx,ty [tx,ty ...]
import { chromium } from '@playwright/test';
const [level, out, ...spots] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true, isMobile: false });
const errs = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await page.goto(`http://localhost:8080/?nosw=1&test=1&level=${level}`);
await page.waitForFunction(() => window.LW && LW.state() && !LW.state().busy, null, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(800);
for (let k = 0; k < 4; k++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); }
let i = 0;
for (const s of spots.length ? spots : ['']) {
  if (s) { const [x, y] = s.split(',').map(Number); await page.evaluate(([x, y]) => LW.teleport(x, y), [x, y]); }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${level}-${i++}.png` });
}
console.log(JSON.stringify(await page.evaluate(() => LW.state())));
console.log(errs.join('\n') || 'no console errors');
await browser.close();
