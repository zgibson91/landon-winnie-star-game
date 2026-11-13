// Renders the app icons (Landon + Winnie on a starry badge) to PNG using the game's own SVG art.
// node tools/make-icons.mjs   (needs the local server running on :8080)
import { chromium } from '@playwright/test';
const b = await chromium.launch();
const page = await b.newPage();
await page.goto('http://localhost:8080/index.html?nosw=1&noboot=1');
for (const [size, name, pad] of [[180, 'icon-180.png', 0], [192, 'icon-192.png', 0], [512, 'icon-512.png', 0], [512, 'icon-maskable-512.png', 0.12]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent('<html><body style="margin:0;background:transparent"><div id=i></div></body></html>');
  await page.addScriptTag({ type: 'module', content: `
    import { landonSvg, LANDON_ANIMS } from 'http://localhost:8080/src/art/landon.js';
    import { WINNIE_ANIMS } from 'http://localhost:8080/src/art/winnie.js';
    const p = ${pad};
    const star = (cx, cy, R, r) => { let d=''; for (let i=0;i<10;i++){ const rr=i%2?r:R, a=(-90+i*36)*Math.PI/180; d+=(i?'L':'M')+(cx+Math.cos(a)*rr).toFixed(1)+' '+(cy+Math.sin(a)*rr).toFixed(1);} return d+'Z'; };
    let stars=''; for (let i=0;i<26;i++){ const x=(i*37)%100, y=(i*53)%60; stars += '<path d="'+star(x, y, 1.6, 0.7)+'" fill="#fff" opacity="'+(0.4+(i%3)*0.2)+'"/>'; }
    document.getElementById('i').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">' +
      '<defs><radialGradient id="bg" cx="0.5" cy="0.35"><stop offset="0" stop-color="#5a3fb8"/><stop offset="1" stop-color="#1b1442"/></radialGradient></defs>' +
      '<rect width="100" height="100" fill="url(#bg)"/>' + stars +
      '<circle cx="50" cy="128" r="62" fill="#8f7fe0" stroke="#2a1f3d" stroke-width="2"/>' +
      '<g transform="translate(' + (50 - 50*(1-2*p)) + ' ' + (100*p) + ') scale(' + (1-2*p) + ')">' +
      '<g transform="translate(-4 8) scale(0.9)">' + landonSvg(LANDON_ANIMS.idle[0], 'jersey') + '</g>' +
      '<g transform="translate(50 52) scale(0.8)">' + WINNIE_ANIMS.happy[0] + '</g></g></svg>';
    window.done = true;` });
  await page.waitForFunction(() => window.done);
  await page.locator('svg').screenshot({ path: `icons/${name}`, omitBackground: false });
  console.log('wrote', name);
}
await b.close();
