// Dev helper: screenshot title -> hub -> menus. node tests/flow.mjs <outdir>
import { chromium } from '@playwright/test';
const out = process.argv[2];
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const page = await b.newPage({ viewport: { width: 1180, height: 820 }, hasTouch: true });
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await page.goto('http://localhost:8080/?nosw=1&test=1');
await page.waitForFunction(() => window.LW && LW.scenes().includes('Title'), null, { timeout: 20000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/flow-title.png` });
await page.evaluate(() => { const t = LW.game.scene.getScene('Title'); t.start(); });
await page.waitForFunction(() => LW.state() && LW.state().id === 'hub', null, { timeout: 10000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/flow-hub.png` });
for (const [tx, name] of [[22, 'portal-sun'], [33, 'portal-betel'], [79, 'portal-final'], [8, 'doors']]) {
  await page.evaluate((tx) => LW.teleport(tx, 10), tx);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/flow-${name}.png` });
}
for (const scn of ['Museum', 'Trophy', 'Closet', 'Parent']) {
  await page.evaluate((scn) => { const L = LW.level(); L.freeze(true); LW.game.scene.start(scn, { onClose: () => L.freeze(false) }); }, scn);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/flow-${scn}.png` });
  await page.evaluate((scn) => LW.game.scene.stop(scn), scn);
}
console.log(errs.join('\n') || 'no console errors');
await b.close();
