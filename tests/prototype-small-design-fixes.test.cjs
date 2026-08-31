const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

test('every non-primary alarm uses a complete secondary card surface', () => {
  const rule = html.match(/\.alarm-list \.alarm-row:not\(:first-child\)\{([^}]+)\}/);
  assert.ok(rule, 'secondary alarm card rule missing');
  assert.match(rule[1], /border:1px solid var\(--separator\)/, 'secondary alarms need a visible card boundary');
  assert.match(rule[1], /border-radius:18px/, 'secondary alarms need complete rounded card geometry');
  assert.match(rule[1], /background:var\(--surface\)/, 'secondary alarms need a distinct surface');
  assert.match(rule[1], /box-shadow:0 10px 24px rgba\(23,39,29,\.08\)/, 'secondary alarms need restrained depth against the canvas');
});

test('both profile statistics align from the left edge of their columns', () => {
  const rule = html.match(/\.profile-stat\{([^}]+)\}/);
  assert.ok(rule, 'profile statistic rule missing');
  assert.match(rule[1], /text-align:left/, 'Dream Nights must align left within its column');
  assert.doesNotMatch(html, /\.profile-stat:last-child\{[^}]*text-align:right/, 'legacy right alignment must not return');
});
