const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

test('destination tabs use concise primary headings', () => {
  assert.match(html, /\.tab-heading\{margin:0;font-size:var\(--type-display-size\);line-height:var\(--type-display-line\);letter-spacing:var\(--type-display-tracking\);font-weight:var\(--type-display-weight\)\}/);
  assert.match(html, /data-screen="alarm"[\s\S]*?<h1 class="tab-heading">Good Morning, Harris<\/h1>/);
  assert.match(html, /data-screen="history"[\s\S]*?<h1 class="tab-heading">Dream Logs<\/h1>/);
  assert.match(html, /data-screen="insights"[\s\S]*?<h1 class="tab-heading">Sleep Patterns<\/h1>/);
  assert.match(html, /data-screen="profile"[\s\S]*?<h1 class="tab-heading">My Profile<\/h1>/);
  assert.doesNotMatch(html, /Your morning|Your private archive|Your patterns/);
});

test('bottom navigation content sits closer to its top edge without shrinking targets', () => {
  assert.match(html, /\.tab\{min-height:58px;padding:5px 1px 1px;flex-direction:column;justify-content:flex-start;gap:0\}/);
  assert.match(html, /\.tabbar\{[^}]*padding:4px max\(8px,calc\(env\(safe-area-inset-right\) \+ 4px\)\) max\(4px,env\(safe-area-inset-bottom\)\)/);
});
