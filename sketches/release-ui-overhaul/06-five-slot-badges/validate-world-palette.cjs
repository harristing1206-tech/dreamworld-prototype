const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');

const requiredTokens = {
  canvas: '#f2ecd9',
  surface: '#fff9e9',
  raised: '#dfe8d0',
  ink: '#293a31',
  muted: '#5f6b5e',
  faint: '#657065',
  accent: '#4d704f',
  highlight: '#cb7548',
  sun: '#d5a13c',
  sky: '#6f93a4'
};

for (const [name, value] of Object.entries(requiredTokens)) {
  assert.ok(html.includes(`--${name}:${value}`), `missing ${name} token`);
}

const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
const luminance = hex => rgb(hex)
  .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
};

for (const [label, foreground, background] of [
  ['body text', requiredTokens.ink, requiredTokens.canvas],
  ['muted text', requiredTokens.muted, requiredTokens.canvas],
  ['inactive navigation', requiredTokens.faint, requiredTokens.surface],
  ['green actions', requiredTokens.accent, requiredTokens.canvas],
  ['button label', '#fffaf0', requiredTokens.accent]
]) {
  assert.ok(contrast(foreground, background) >= 4.5, `${label} contrast is below 4.5:1`);
}

assert.ok(contrast('#fffaf0', requiredTokens.highlight) >= 3, 'terracotta icon contrast is below 3:1');

assert.match(html, /color-scheme:light/, 'app did not switch to the light world palette');
assert.match(html, /--tabbar-bg:rgba\(255,249,233,.97\)/, 'light tab bar token is not warm ivory');
assert.match(html, /\.tabbar\{[^}]*background:var\(--tabbar-bg\)/, 'tab bar does not use the semantic theme token');
assert.match(html, /\.tab\.log-tab \.plus-disc\{[^}]*background:var\(--highlight\)/, 'log action is not using terracotta');
assert.match(html, /\.mic\{[^}]*background:var\(--highlight\)/, 'capture action is not using terracotta');
assert.match(html, /\.calendar-day\.has-dream\{[^}]*background:var\(--raised\)/, 'dream days are not using the sage highlight');
assert.match(html, /\.calendar-day\.has-dream:after\{[^}]*background:var\(--highlight\)/, 'dream-day marker is not using terracotta');
assert.doesNotMatch(html, /#0b0b0d|#101012|#17171a|#222226|rgba\(15,15,17,.98\)/, 'legacy dark palette remains');

console.log('DREAMWORLD_BOTANICAL_WORLD_PALETTE_VERIFIED');
