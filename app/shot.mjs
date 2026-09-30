import { chromium } from '@playwright/test';
const [,, url, out, w, h] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto(url); await p.waitForTimeout(500);
await p.screenshot({ path: out, fullPage: true }); await b.close();
