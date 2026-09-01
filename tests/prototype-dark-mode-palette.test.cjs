const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

function luminance(hex) {
  const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('dark bubble tokens use neutral graphite instead of green material', () => {
  const dark = html.match(/:root\[data-theme="dark"\]\{([^}]*--canvas:#000000;--body-bg:#000000[^}]*)\}/);
  assert.ok(dark, 'dark material override missing');
  assert.match(dark[1], /--surface:#171a20/);
  assert.match(dark[1], /--raised:#232730/);
  assert.match(dark[1], /--muted:#aeb5bf/);
  assert.match(dark[1], /--premium-dark:#0b1018/);
  assert.match(dark[1], /--premium-raised:#171c25/);
  assert.doesNotMatch(dark[1], /--surface:#18211b|--raised:#243129|--premium-dark:#080d0a|--premium-raised:#142019/);
  assert.ok(contrast('#aeb5bf', '#171a20') >= 4.5, 'neutral dark supporting text must retain AA contrast');
});

test('dark Recall Index uses a vibrant blue field with the existing fade composition', () => {
  const hero = html.match(/:root\[data-theme="dark"\] \.insights-hero\{([^}]+)\}/);
  const fade = html.match(/:root\[data-theme="dark"\] \.insights-hero:after\{([^}]+)\}/);
  assert.ok(hero, 'dark blue Recall Index surface missing');
  assert.ok(fade, 'dark blue Recall Index fade missing');
  assert.match(hero[1], /background:#06264d/);
  assert.match(hero[1], /color:#f4f8ff/);
  assert.match(hero[1], /box-shadow:0 18px 42px rgba\(0,111,230,\.24\)/);
  assert.match(fade[1], /background:rgba\(34,155,255,\.72\)/);
  assert.match(fade[1], /filter:blur\(52px\)/);
  assert.ok(contrast('#f4f8ff', '#06264d') >= 4.5, 'Recall Index text must retain AA contrast');
  assert.match(html, /:root\[data-theme="dark"\] \.insights-wave i\{[^}]*background:#62b4ff/);
  assert.match(html, /:root\[data-theme="dark"\] \.insights-wave i\[data-rating="Clear"\]\{[^}]*background:#27a2ff/);
});
