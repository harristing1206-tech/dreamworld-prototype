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

test('bottom navigation floats over visible scroll content', () => {
  assert.match(html, /:root\{[^}]*--tabbar-bg:rgba\(250,250,248,\.76\)[^}]*--tabbar-icon:#5f6962/, 'light navigation material and inactive icons must remain legible');
  assert.match(html, /:root\[data-theme="dark"\]\{[^}]*--tabbar-bg:rgba\(12,14,17,\.76\)[^}]*--tabbar-icon:#c1c7ce/, 'dark navigation material and inactive icons must remain legible');
  const bar = html.match(/\.tabbar\{([^}]*left:max\(24px,calc\(env\(safe-area-inset-left\) \+ 8px\)\)[^}]*)\}/);
  assert.ok(bar, 'floating navigation geometry missing');
  assert.match(bar[1], /right:max\(24px,calc\(env\(safe-area-inset-right\) \+ 8px\)\)/);
  assert.match(bar[1], /border-radius:32px/);
  assert.match(bar[1], /backdrop-filter:blur\(22px\) saturate\(140%\)/, 'navigation must blur the content visible behind it');
  assert.match(html, /\.tab\{[^}]*color:var\(--tabbar-icon\)/, 'inactive navigation icons must use the controlled material-contrast token');
  assert.ok(contrastRatio('#5f6962', '#bebebc') >= 3, 'light inactive icons must retain 3:1 contrast over the darkest composited backdrop');
  assert.ok(contrastRatio('#c1c7ce', '#46484a') >= 3, 'dark inactive icons must retain 3:1 contrast over the lightest composited backdrop');
  assert.match(html, /@media\(display-mode:standalone\),\(max-width:500px\) and \(pointer:coarse\)\{[\s\S]*?\.tabbar\{bottom:max\(10px,calc\(env\(safe-area-inset-bottom\) \+ 6px\)\)/, 'installed navigation must preserve the intended safe-area gap');
  assert.match(html, /\.viewport\{inset-bottom:0\}/, 'scrolling content must extend behind the floating navigation');
  assert.match(html, /\.screen\{padding-top:8px;padding-bottom:calc\(96px \+ env\(safe-area-inset-bottom\)\)\}/, 'screen needs enough end padding to keep final actions reachable above the overlay');
  assert.match(html, /\.log-screen \.capture-state\{[^}]*inset:148px 24px calc\(96px \+ env\(safe-area-inset-bottom\)\)/, 'ready capture controls must clear the navigation overlay');
  assert.match(html, /\.log-screen \.capture-state\.active:not\(\[data-log-state="ready"\]\)\{inset:0 0 calc\(96px \+ env\(safe-area-inset-bottom\)\) 0;padding:24px/, 'non-ready capture controls must clear the navigation overlay');
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

test('both profile statistics align from the left edge of their columns', () => {
  const rule = html.match(/\.profile-stat\{([^}]+)\}/);
  assert.ok(rule, 'profile statistic rule missing');
  assert.match(rule[1], /text-align:left/, 'Dream Nights must align left within its column');
  assert.doesNotMatch(html, /\.profile-stat:last-child\{[^}]*text-align:right/, 'legacy right alignment must not return');
});
