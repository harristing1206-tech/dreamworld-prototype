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
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('labeled bottom navigation is compact without shrinking icons or labels', () => {
  assert.match(html, /--tabbar-height:68px/);
  assert.match(html, /\.tab\{min-height:58px;padding:5px 1px 1px;[^}]*justify-content:flex-start[^}]*gap:0/);
  assert.match(html, /\.tab svg\{width:20px;height:20px\}/);
  assert.match(html, /\.tab-label\{[^}]*font-size:var\(--type-label-size\)/);
  assert.match(html, /\.tab\.log-tab \.plus-disc\{width:44px;height:44px/);
});

test('History edit minus occupies a centered rail that glides open', () => {
  assert.match(html, /\.history-swipe-row\{display:grid;grid-template-columns:0 minmax\(0,1fr\);align-items:stretch[^}]*transition:grid-template-columns 240ms cubic-bezier\(\.22,\.61,\.36,1\)/);
  assert.match(html, /\.history-swipe-row \.edit-minus\{position:relative;left:auto;top:auto;min-width:0;align-self:center;justify-self:center;transform:scale\(\.65\);grid-column:1;grid-row:1\}/);
  assert.match(html, /\.history-swipe-row \.swipe-main\{grid-column:2;grid-row:1;width:100%;transform:none\}/);
  assert.match(html, /#historyList\.editing \.history-swipe-row\{grid-template-columns:50px minmax\(0,1fr\)\}/);
  assert.match(html, /#historyList\.editing \.edit-minus\{transform:scale\(1\)\}/);
  assert.match(html, /#historyList\.editing \.history-swipe-row \.swipe-main\{width:100%;transform:none\}/);
});

test('Appearance offers only explicit Light and Dark modes', () => {
  assert.doesNotMatch(html, /choices=\['system','light','dark'\]/);
  assert.doesNotMatch(html, /appearanceMedia\.addEventListener/);
  assert.match(html, /const cycleAppearance=\(\)=>applyAppearance\(appearancePreference==='light'\?'dark':'light',\{persist:true\}\)/);
  assert.match(html, /Choose light or dark mode/);
  assert.doesNotMatch(html, /Follow iPhone or choose a theme/);
  assert.doesNotMatch(html, /id="appearanceStatus">System</);
  assert.doesNotMatch(html, /currently System/);
});

test('legacy forest-green chrome does not return outside the alarm control', () => {
  assert.doesNotMatch(html, /--green:/);
  assert.doesNotMatch(html, /#315a43|#a6c7ad|#486a4d|#a3bf92|#6e965c|#789f67|#455148|#49544e|#6f7972|#d9dcd8|#142019|#eef4ee|#17251e|#18251d|#b8d2bf|#203028|#f1eee5|rgba\(69,112,80|rgba\(72,132,92|rgba\(166,199,173/);
});

test('primary alarm switch does not override semantic active and off colors', () => {
  const primarySwitch = html.match(/#alarmList \.alarm-row:first-child \.switch\{([^}]+)\}/);
  assert.ok(primarySwitch, 'primary alarm switch positioning rule missing');
  assert.doesNotMatch(primarySwitch[1], /background:/, 'primary switch must not override semantic state colors');
  assert.match(html, /\.switch\.on\{background:var\(--alarm-on\)\}/);
  assert.match(html, /--switch-off:#b9c0c7/);
  assert.match(html, /:root\[data-theme="dark"\]\{[\s\S]*--switch-off:#48505a/);
});

test('theme text is monochrome while enabled alarms use iOS green', () => {
  assert.match(html, /--accent:#1f252b/);
  assert.match(html, /--active:#1f252b/);
  assert.match(html, /:root\[data-theme="dark"\]\{[\s\S]*--accent:#f1f3f5/);
  assert.match(html, /:root\[data-theme="dark"\]\{[\s\S]*--active:#f1f3f5/);
  assert.match(html, /:root\[data-theme="dark"\]\{[\s\S]*--accent-ink:#000000/);
  assert.match(html, /--alarm-on:#34c759/);
  assert.match(html, /\.switch\.on\{background:var\(--alarm-on\)\}/);
  assert.ok(contrast('#1f252b', '#ffffff') >= 4.5, 'light theme text must remain readable black');
  assert.ok(contrast('#f1f3f5', '#000000') >= 4.5, 'dark theme text must remain readable white');
});
