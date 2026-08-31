const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const route = path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges');
const html = fs.readFileSync(path.join(route, 'index.html'), 'utf8');
const worker = fs.readFileSync(path.join(route, 'service-worker.js'), 'utf8');
const fontName = 'dm-sans-latin-wght-normal.woff2';
const fontPath = path.join(route, fontName);
const licensePath = path.join(route, 'DM_SANS_LICENSE.txt');

test('Dreamworld self-hosts a licensed Airbnb-Cereal-like variable font', () => {
  assert.ok(fs.existsSync(fontPath), 'DM Sans variable font asset is missing');
  assert.ok(fs.statSync(fontPath).size > 20000, 'font asset is suspiciously small');
  assert.ok(fs.existsSync(licensePath), 'DM Sans license notice is missing');
  assert.match(fs.readFileSync(licensePath, 'utf8'), /SIL OPEN FONT LICENSE Version 1\.1/);
  assert.match(html, /@font-face\{font-family:"DM Sans";src:url\("\.\/dm-sans-latin-wght-normal\.woff2"\) format\("woff2-variations"\);font-style:normal;font-weight:100 1000;font-display:swap\}/);
  assert.match(html, /--font-ui:"DM Sans",-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
});

test('the installed PWA caches the local font with the shell', () => {
  assert.match(worker, /'\.\/dm-sans-latin-wght-normal\.woff2'/);
});
