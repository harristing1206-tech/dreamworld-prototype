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
  assert.match(rule[1], /box-shadow:0 16px 38px rgba\(25,32,40,\.075\)/, 'secondary alarms need broad low-opacity ambient depth');
  assert.match(rule[1], /color:#4d555e/, 'secondary alarm text needs softened neutral-gray contrast');
  assert.ok(contrastRatio('#6d7680', '#fffffe') >= 4.5, 'softened secondary text must retain WCAG AA normal-text contrast');
  const darkRule = html.match(/:root\[data-theme="dark"\] \.alarm-list \.alarm-row:not\(:first-child\)\{([^}]+)\}/);
  assert.ok(darkRule, 'dark-mode Ambient Paper override missing');
  assert.match(darkRule[1], /background:var\(--surface\)/);
  assert.match(darkRule[1], /color:var\(--ink\)/);
  assert.match(darkRule[1], /box-shadow:0 16px 38px rgba\(0,0,0,\.22\)/);
  assert.match(html, /button:focus-visible[^}]*outline:3px solid var\(--accent\)/, 'card controls must retain visible keyboard focus');
});

test('bottom navigation spans edge to edge and labels the four destination tabs', () => {
  assert.match(html, /--tabbar-height:68px/, 'labeled navigation needs the compact full-width height token');
  const bar = html.match(/\.tabbar\{left:0;right:0;bottom:0;([^}]+)\}/);
  assert.ok(bar, 'edge-to-edge navigation geometry missing');
  assert.match(bar[1], /height:calc\(var\(--tabbar-height\) \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(bar[1], /border-radius:0/);
  assert.match(bar[1], /outline:0/);
  assert.match(html, /:root\[data-theme="light"\] \.tabbar,:root\[data-theme="dark"\] \.tabbar\{outline:0\}/, 'theme bubble outline must not re-wrap the full-width bar');
  assert.match(html, /--tabbar-bg:#ffffff/, 'light navigation surface must be opaque');
  assert.match(html, /:root\[data-theme="dark"\]\{[\s\S]*--tabbar-bg:#000000/, 'dark navigation surface must be opaque');
  assert.match(html, /\.tab-label\{[^}]*color:var\(--muted\)[^}]*font-size:var\(--type-label-size\)/, 'visible tab-label styling missing');
  assert.ok(contrastRatio('#667168', '#ffffff') >= 4.5, 'light inactive labels must retain WCAG AA text contrast');
  for (const [tab, label] of [['alarm', 'Alarm'], ['history', 'History'], ['insights', 'Insights'], ['profile', 'Profile']]) {
    assert.match(html, new RegExp(`data-tab="${tab}"[\\s\\S]*?<span class="tab-label">${label}<\\/span>[\\s\\S]*?<\\/button>`), `${label} tab title missing`);
  }
  assert.match(html, /data-tab="log" aria-label="Log a dream"/, 'icon-only center action needs an accessible name');
  assert.doesNotMatch(html, /<span class="tab-label">Log<\/span>/, 'center plus action should not show a Log label');
  assert.match(html, /@media\(display-mode:standalone\),\(max-width:500px\) and \(pointer:coarse\)\{[\s\S]*?\.tabbar\{bottom:0;[^}]*height:calc\(var\(--tabbar-height\) \+ env\(safe-area-inset-bottom\)\)/, 'installed mode must remain edge to edge through the safe area');
});

test('alarm cards use a compact rectangular hierarchy', () => {
  const primaryRow = html.match(/#alarmList \.alarm-row:first-child\{([^}]+)\}/);
  const primaryMain = html.match(/#alarmList \.alarm-row:first-child \.swipe-main\{([^}]+)\}/);
  const secondaryMain = html.match(/\.alarm-list \.alarm-row:not\(:first-child\) \.swipe-main\{([^}]+)\}/);
  assert.ok(primaryRow, 'primary alarm card rule missing');
  assert.ok(primaryMain, 'primary alarm content rule missing');
  assert.ok(secondaryMain, 'secondary alarm content rule missing');
  assert.match(primaryRow[1], /min-height:208px/, 'primary alarm should be shorter while keeping its full available width');
  assert.match(primaryMain[1], /min-height:208px/, 'primary alarm content should match the compact card height');
  assert.match(secondaryMain[1], /min-height:72px/, 'non-primary alarms should be modestly smaller');
  assert.doesNotMatch(primaryRow[1], /width:/, 'primary alarm must keep the existing full-width behavior');
});

test('profile identity copy aligns from a consistent left edge', () => {
  const rule = html.match(/\.profile-identity-copy\{([^}]+)\}/);
  assert.ok(rule, 'profile identity copy rule missing');
  assert.match(rule[1], /text-align:left/, 'profile identity text must align left');
  assert.match(html, /\.profile-avatar\{[^}]*width:64px[^}]*height:64px/, 'profile avatar geometry missing');
});
