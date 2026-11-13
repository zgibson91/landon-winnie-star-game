import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const LEVELS = ['hub', 'sun', 'betelgeuse'];
const botSrc = fs.readFileSync(new URL('./bot.js', import.meta.url), 'utf8');

function watchErrors(page) {
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  return errors;
}
async function boot(page, query = '') {
  await page.goto(`/?nosw=1&test=1${query}`);
  await page.waitForFunction(() => window.LW && (LW.state() || LW.scenes().includes('Title')), null, { timeout: 30000 });
}
async function levelReady(page, id) {
  await page.waitForFunction((id) => LW.state() && LW.state().id === id, id, { timeout: 30000 });
}

test('title screen, then Star Station, with no console errors', async ({ page }) => {
  const errors = watchErrors(page);
  await boot(page);
  await expect.poll(() => page.evaluate(() => LW.scenes())).toContain('Title');
  await page.keyboard.press('Enter');
  await levelReady(page, 'hub');
  expect(errors).toEqual([]);
});

for (const id of LEVELS) {
  test(`level "${id}" loads cleanly and holds frame rate`, async ({ page, browserName }) => {
    const errors = watchErrors(page);
    await boot(page, `&level=${id}`);
    await levelReady(page, id);
    // let it run, then sample fps over 3 s while Landon runs right
    await page.evaluate(() => { LW.Input.bot = { right: true }; });
    await page.waitForTimeout(1500);
    const fps = await page.evaluate(async () => {
      let frames = 0; const t0 = performance.now();
      await new Promise(r => { const f = () => { frames++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
      return frames / ((performance.now() - t0) / 1000);
    });
    await page.evaluate(() => { LW.Input.bot = null; });
    console.log(`${id} fps (${browserName}): ${fps.toFixed(1)}`);
    if (browserName === 'chromium') expect(fps).toBeGreaterThan(50);
    expect(errors).toEqual([]);
  });
}

for (const id of ['sun', 'betelgeuse']) {
  test(`bot beats "${id}" and collects the secret shard`, async ({ page }, info) => {
    test.skip(info.project.name !== 'ipad-1180', 'bot runs once (desktop GPU timing)');
    test.setTimeout(300000);
    const errors = watchErrors(page);
    const route = JSON.parse(fs.readFileSync(new URL(`./routes/${id}.json`, import.meta.url)));
    await boot(page, `&level=${id}`);
    await levelReady(page, id);
    await page.addScriptTag({ content: botSrc });
    await page.evaluate((steps) => { LW.Save.reset(); LWBot.start(steps); }, route.steps);
    await page.waitForFunction(() => LWBot.done || LWBot.failed, null, { timeout: 280000, polling: 500 });
    const r = await page.evaluate(() => ({ failed: LWBot.failed, s: LW.state(), log: LWBot.log.slice(-6) }));
    expect(r.failed, r.log.join('\n')).toBeNull();
    expect(r.s.finished).toBe(true);
    expect(r.s.shards[0]).toBe(true);
    expect(r.s.shards[1]).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('touch: multi-touch run + jump, and buttons respond', async ({ page }) => {
  await boot(page, '&level=sun');
  await levelReady(page, 'sun');
  await page.waitForTimeout(600);
  const before = await page.evaluate(() => LW.state());
  // positions of the on-screen buttons in CSS pixels
  const pos = await page.evaluate(() => {
    const ui = LW.game.scene.getScene('UI'); const dpr = LW.game.registry.get('dpr'); const k = ui.z / dpr;
    return { right: [ui.btnR.x * k, ui.btnR.y * k], jump: [ui.btnJump.x * k, ui.btnJump.y * k] };
  });
  const cdp = await page.context().newCDPSession(page).catch(() => null);
  test.skip(!cdp, 'multi-touch needs Chromium CDP');
  const tp = (id, [x, y]) => ({ x, y, id, radiusX: 10, radiusY: 10, force: 1 });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [tp(1, pos.right)] });
  await page.waitForTimeout(500);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [tp(1, pos.right), tp(2, pos.jump)] });
  await page.waitForTimeout(150);
  const mid = await page.evaluate(() => LW.state());
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect(mid.x).toBeGreaterThan(before.x + 60);   // ran right
  expect(mid.vy).toBeLessThan(0);                 // and is jumping, at the same time
});

test('gamepad: standard-mapping pad moves and jumps', async ({ page }) => {
  await page.addInitScript(() => {
    const pad = { id: 'Pro Controller (STANDARD GAMEPAD)', connected: true, mapping: 'standard', index: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    window.__pad = pad;
    navigator.getGamepads = () => [pad];
  });
  await boot(page, '&level=sun');
  await levelReady(page, 'sun');
  await page.waitForTimeout(500);
  const x0 = (await page.evaluate(() => LW.state())).x;
  await page.evaluate(() => { __pad.axes[0] = 1; });
  await page.waitForTimeout(500);
  await page.evaluate(() => { __pad.buttons[1].pressed = true; });  // Switch "A" (right face)
  await page.waitForTimeout(120);
  const s = await page.evaluate(() => LW.state());
  await page.evaluate(() => { __pad.axes[0] = 0; __pad.buttons[1].pressed = false; });
  expect(s.x).toBeGreaterThan(x0 + 60);
  expect(s.vy).toBeLessThan(0);
  // plus/start opens pause
  await page.evaluate(() => { __pad.buttons[9].pressed = true; });
  await expect.poll(() => page.evaluate(() => LW.scenes())).toContain('Pause');
});

test('progress auto-saves and survives a reload; blocked storage falls back to memory', async ({ page }) => {
  await boot(page, '&level=sun');
  await levelReady(page, 'sun');
  await page.evaluate(() => { LW.Save.reset(); LW.Save.setShard('sun', 1); });
  await page.reload();
  await page.waitForFunction(() => window.LW && LW.Save);
  expect(await page.evaluate(() => LW.Save.shards('sun'))).toEqual([false, true, false]);
  // storage that throws
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('blocked'); }; Storage.prototype.getItem = () => { throw new Error('blocked'); }; });
  const errors = watchErrors(page);
  await page.reload();
  await levelReady(page, 'sun');
  const r = await page.evaluate(() => { LW.Save.setShard('sun', 2); return { ok: LW.Save.storageOk, s: LW.Save.shards('sun') }; });
  expect(r.ok).toBe(false);
  expect(r.s[2]).toBe(true);
  expect(errors).toEqual([]);
});

test('hint lightbulb appears after 3 fails at the same spot', async ({ page }) => {
  await boot(page, '&level=sun');
  await levelReady(page, 'sun');
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => LW.level().fail('test'));
    await page.waitForFunction(() => !LW.state().dead, null, { timeout: 5000 });
    await page.waitForFunction(() => LW.level().player.invuln <= 0, null, { timeout: 5000 });
  }
  await expect.poll(() => page.evaluate(() => LW.game.scene.getScene('UI').hintOn)).toBe(true);
});

test('parent menu opens by holding the top-left corner', async ({ page }, info) => {
  await boot(page, '&level=hub');
  await levelReady(page, 'hub');
  const cdp = await page.context().newCDPSession(page).catch(() => null);
  test.skip(!cdp, 'needs Chromium CDP for a long touch');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 30, y: 30, id: 1 }] });
  await page.waitForTimeout(3400);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => LW.scenes())).toContain('Parent');
});

test('works offline after the first load (service worker)', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'ipad-1180', 'once is enough');
  await page.goto('/?test=1&level=sun');
  await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller || false, null, { timeout: 30000 }).catch(async () => {
    await page.reload(); await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 });
  });
  await page.waitForTimeout(1500);
  await context.setOffline(true);
  await page.reload();
  await levelReady(page, 'sun');
  await context.setOffline(false);
});

test('portals still work after coming back to Star Station from a level', async ({ page }) => {
  const errors = watchErrors(page);
  await boot(page, '&level=hub');
  await levelReady(page, 'hub');
  const enter = async (star) => {
    await page.evaluate((star) => { const L = LW.level(); const p = L.portals.find(q => q.star.id === star); L.player.teleport(p.x, p.y - 40); }, star);
    await page.waitForTimeout(400);
    await page.keyboard.press('KeyX');   // Winnie button = GO! next to a portal
    await levelReady(page, star);
  };
  await enter('sun');
  await page.evaluate(() => LW.game.events.emit('goto-hub', 'sun'));
  await levelReady(page, 'hub');
  await page.waitForTimeout(500);
  await enter('betelgeuse');
  expect(errors).toEqual([]);
});
