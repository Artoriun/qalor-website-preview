import { chromium, devices } from 'playwright';

const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['Pixel 7'] });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message.split('\n')[0]));
await page.goto('http://localhost:4600/', { waitUntil: 'networkidle' });
const logo = page.locator('nav img[alt="Qalor Logo"]');
await logo.tap();
await page.waitForTimeout(1400);
console.log('after tap:', await logo.evaluate((el) => el.style.transform));
// nav buttons use the same pattern
await page.locator('.navbar-hamburger').tap();
await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Ons team' }).tap();
await page.waitForTimeout(900);
console.log('page errors:', errs.length ? errs : 'none');
await b.close();
