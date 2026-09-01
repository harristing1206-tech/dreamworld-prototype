const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

test('Alarm header separates the personalized title from its actions', () => {
  assert.match(html, /\.alarm-head\{display:grid;grid-template-columns:minmax\(0,1fr\) auto;row-gap:8px;padding-top:4px\}/);
  assert.match(html, /\.alarm-head \.tab-heading\{grid-column:1 \/ -1;max-width:none\}/);
  assert.match(html, /\.alarm-head \.list-toolbar\{position:static;grid-column:2;grid-row:2;justify-self:end;width:auto;gap:6px\}/);
  assert.doesNotMatch(html, /\.alarm-head \.list-toolbar\{[^}]*position:absolute/);
});

test('other primary headings reserve real space from adjacent content', () => {
  assert.match(html, /\.home-header \.tab-heading\{max-width:calc\(100% - 72px\)\}/);
  assert.match(html, /\.screen\[data-screen="profile"\]>\.tab-heading\{margin-bottom:var\(--text-stack-gap\)\}/);
  assert.doesNotMatch(html, /\.home-header \.tab-heading\{padding-right:/);
});

test('text stacks share one vertical rhythm token across the app', () => {
  assert.match(html, /--text-stack-gap:6px/);
  assert.match(html, /--type-display-size:31px;--type-display-line:1\.08;/);
  for (const selector of [
    '\\.profile-identity-copy span',
    '\\.setting-copy span',
    '\\.metric-copy span',
    '\\.metric-value span',
    '\\.detail-fact span',
    '\\.history-entry-excerpt',
    '\\.history-date-rail span',
    '\\.alarm-detail',
    '\\.log-copy',
    '\\.capture-state>p',
    '\\.transcript-provenance'
  ]) {
    assert.match(html, new RegExp(`${selector}\\{[^}]*margin(?:-top)?:[^;}]*var\\(--text-stack-gap\\)`), `${selector} must use the shared text gap`);
  }
});
