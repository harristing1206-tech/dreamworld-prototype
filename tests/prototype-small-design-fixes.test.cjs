const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('Ambient Paper softens the alarm page and every non-primary card', () => {
  const pageRule = html.match(/:root\[data-theme="light"\] \.screen\[data-screen="alarm"\]\{([^}]+)\}/);
  assert.ok(pageRule, 'light alarm canvas rule missing');
  assert.match(pageRule[1], /background:#f7f7f5/, 'alarm canvas must use the warm Stoic gray');
  const rule = html.match(/\.alarm-list \.alarm-row:not\(:first-child\)\{([^}]+)\}/);
  assert.ok(rule, 'secondary alarm card rule missing');
  assert.match(rule[1], /border:0/, 'Ambient Paper removes the hard card border');
  assert.match(rule[1], /outline:0/, 'Ambient Paper must override the legacy outline');
  assert.match(rule[1], /border-radius:24px/, 'secondary alarms need the softer radius');
  assert.match(rule[1], /background:#fffffe/, 'secondary alarms need an almost-white paper surface');
  assert.match(rule[1], /box-shadow:0 16px 38px rgba\(25,40,31,\.075\)/, 'secondary alarms need broad low-opacity ambient depth');
  assert.match(rule[1], /color:#49544e/, 'secondary alarm text needs softened forest-gray contrast');
  assert.ok(contrastRatio('#6f7972', '#fffffe') >= 4.5, 'softened secondary text must retain WCAG AA normal-text contrast');
  const darkRule = html.match(/:root\[data-theme="dark"\] \.alarm-list \.alarm-row:not\(:first-child\)\{([^}]+)\}/);
  assert.ok(darkRule, 'dark-mode Ambient Paper override missing');
  assert.match(darkRule[1], /background:var\(--surface\)/);
  assert.match(darkRule[1], /color:var\(--ink\)/);
  assert.match(darkRule[1], /box-shadow:0 16px 38px rgba\(0,0,0,\.22\)/);
  assert.match(html, /button:focus-visible[^}]*outline:3px solid var\(--accent\)/, 'card controls must retain visible keyboard focus');
});

test('both profile statistics align from the left edge of their columns', () => {
  const rule = html.match(/\.profile-stat\{([^}]+)\}/);
  assert.ok(rule, 'profile statistic rule missing');
  assert.match(rule[1], /text-align:left/, 'Dream Nights must align left within its column');
  assert.doesNotMatch(html, /\.profile-stat:last-child\{[^}]*text-align:right/, 'legacy right alignment must not return');
});
