const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

test('Dreamworld uses one restrained DM Sans typography token system', () => {
  assert.match(html, /--font-ui:"DM Sans",-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif/);
  assert.match(html, /--type-display-size:31px;--type-display-line:1\.06;--type-display-weight:650;--type-display-tracking:-\.03em/);
  assert.match(html, /--type-body-size:16px;--type-body-line:1\.5;--type-body-weight:400/);
  assert.match(html, /--type-meta-size:13px;--type-meta-line:1\.35;--type-meta-weight:500/);
  assert.match(html, /--type-label-size:11px;--type-label-line:1\.08;--type-label-weight:550/);
  assert.match(html, /body\{[^}]*font-family:var\(--font-ui\)/, 'body must inherit the single DM Sans stack');
  assert.match(html, /\.nav-title,\.greeting,\.log-title\{[^}]*font-size:var\(--type-display-size\)[^}]*font-weight:var\(--type-display-weight\)/);
  assert.doesNotMatch(html, /\.alarm-head \.nav-title\{[^}]*font-size:/, 'Alarm title must not bypass the shared display role');
  assert.doesNotMatch(html, /\.log-screen \.log-title\{[^}]*font-size:/, 'Log title must not bypass the shared display role');
  assert.match(html, /<h1 class="sr-only">Profile<\/h1>/);
  assert.match(html, /\.settings-heading\{[^}]*font-weight:650/);
  assert.match(html, /h1,h2,h3,strong,b\{font-weight:650\}/, 'native heading and strong defaults must not fall back to browser 700');
});

test('core reading and numeric surfaces use the refined typography roles', () => {
  assert.match(html, /\.dream-entry p\{[^}]*font-size:var\(--type-body-size\)[^}]*line-height:var\(--type-body-line\)/);
  assert.match(html, /\.transcript\{[^}]*font-size:var\(--type-body-size\)[^}]*line-height:1\.55/);
  assert.match(html, /\.tab-label\{[^}]*font-size:var\(--type-label-size\)[^}]*font-weight:var\(--type-label-weight\)/);
  assert.match(html, /\.alarm-time\{[^}]*font-variant-numeric:tabular-nums/);
  assert.match(html, /\.date,\.log-kicker\{[^}]*font-size:12px[^}]*font-weight:550[^}]*letter-spacing:\.06em/);
});

test('DM Sans uses deliberately lighter variable-font roles', () => {
  const uiCSS = html.replace(/@font-face\{[^}]+\}/g, '');
  const weights = [...uiCSS.matchAll(/font-weight:(\d+)/g)].map(match => Number(match[1]));
  const unexpected = [...new Set(weights.filter(weight => ![400, 500, 550, 650].includes(weight)))];
  assert.deepEqual(unexpected, [], `unexpected font weights: ${unexpected.join(', ')}`);
  assert.doesNotMatch(uiCSS, /font-weight:(?:600|700)/, 'legacy heavy UI weights remain');
});
