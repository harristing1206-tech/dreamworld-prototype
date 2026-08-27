const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');

assert.match(html, /--page-gutter:clamp\(24px,6vw,30px\)/, 'responsive page gutter missing');
assert.match(html, /--control-size:44px/, '44px minimum control size missing');
assert.match(html, /--device-width:402/, 'balanced phone logical width missing');
assert.match(html, /--device-height:840/, 'balanced phone logical height missing');
assert.ok(840 / 402 > 2.05 && 840 / 402 < 2.12, 'device shell aspect ratio is not balanced');
assert.match(html, /\.phone\{[^}]*aspect-ratio:402\/840[^}]*border-radius:42px/, 'balanced phone shell geometry missing');
assert.match(html, /@media\(max-width:500px\) and \(pointer:fine\)/, 'narrow laptop preview is incorrectly treated as a phone');
assert.match(html, /@media\(display-mode:standalone\),\(max-width:500px\) and \(pointer:coarse\)/, 'real phone and installed-app fullscreen behavior missing');
assert.match(html, /\.screen\{[^}]*padding:[^}]*env\(safe-area-inset-right\)[^}]*env\(safe-area-inset-left\)/, 'screen safe-area gutters missing');
assert.match(html, /\.alarm-head\{[^}]*padding-top:8px/, 'Alarm header does not match the other tab headers');
assert.match(html, /\.alarm-title-row\{[^}]*justify-content:space-between/, 'Alarm title and Add action are not balanced');
assert.match(html, /\.alarm-add\{[^}]*width:44px[^}]*height:44px/, 'Alarm Add action is not a full touch target');
assert.match(html, /\.alarm-row\{[^}]*min-height:88px[^}]*padding:8px 0/, 'Alarm rows are not compact');
assert.match(html, /\.alarm-edit\{[^}]*min-height:72px/, 'Alarm row edit target is too small');
assert.match(html, /--tabbar-height:76px/, 'compact tab bar height missing');
assert.match(html, /\.viewport\{[^}]*calc\(var\(--tabbar-height\) \+ env\(safe-area-inset-bottom\)\)/, 'viewport does not follow the compact safe-area tab bar');
assert.match(html, /\.tabbar\{[^}]*height:calc\(var\(--tabbar-height\) \+ env\(safe-area-inset-bottom\)\)[^}]*align-items:center/, 'tab bar is not compact and vertically centered');
assert.match(html, /\.tab\{[^}]*min-height:52px[^}]*align-items:center[^}]*justify-content:center/, 'tab icons are not centered in their grid cells');
assert.match(html, /\.tab:before\{[^}]*width:60px[^}]*height:46px[^}]*border-radius:23px[^}]*background:var\(--raised\)/, 'selected-tab capsule is missing');
assert.match(html, /\.tab\.active:not\(\.log-tab\):before\{[^}]*opacity:1[^}]*scale\(1\)/, 'selected-tab capsule does not activate');
assert.match(html, /\.tab\.log-tab\{[^}]*align-self:center[^}]*translateY\(-12px\)/, 'raised plus is not kept close to the icon row');
assert.match(html, /\.tab\.log-tab \.plus-disc\{[^}]*width:58px[^}]*height:58px[^}]*flex:0 0 58px[^}]*aspect-ratio:1\/1[^}]*border-radius:50%/, 'center plus can shrink into an oval');
assert.match(html, /<header class="alarm-head"><p class="date">Wake schedule<\/p><div class="alarm-title-row"><h1 class="nav-title">Alarms<\/h1><button[^>]*aria-label="Add alarm"><svg[\s\S]*?<path d="M12 5v14M5 12h14"\/><\/svg><\/button><\/div><\/header>/, 'Alarm header structure does not match the tab system');
assert.doesNotMatch(html, /id="editAlarms"|Dreamworld alarms use Apple’s system alarm experience\./, 'obsolete Alarm header controls or copy remain');

console.log('DREAMWORLD_BALANCED_SPACING_VERIFIED');
