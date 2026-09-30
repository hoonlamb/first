import { chromium } from '@playwright/test';
const [,, url, out, w, h, full, act] = process.argv;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs=[]; p.on('console', m => { if (m.type()==='error') errs.push(m.text()) }); p.on('pageerror', e => errs.push(String(e)));
await p.goto(url); await p.waitForTimeout(900);
if (act) { await eval(act); await p.waitForTimeout(700); }
await p.screenshot({ path: out, fullPage: full==='1' }); console.log('errors:', errs.length? errs.join('\n'): 'none'); await b.close();
