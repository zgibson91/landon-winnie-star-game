import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { checkLevel } from './reach.mjs';
for (const f of fs.readdirSync(new URL('../levels', import.meta.url)).filter(f => f.endsWith('.json'))) {
  test(`every collectible in ${f} is reachable with the game's jump physics`, async ({}, info) => {
    test.skip(info.project.name !== 'ipad-1180', 'static check, run once');
    test.setTimeout(500000);
    const r = checkLevel(JSON.parse(fs.readFileSync(new URL(`../levels/${f}`, import.meta.url))));
    expect(r.missing.map(t => `${t.kind}@${t.c},${t.r}`)).toEqual([]);
    expect(r.missingBells.map(b => b.id)).toEqual([]);
  });
}
