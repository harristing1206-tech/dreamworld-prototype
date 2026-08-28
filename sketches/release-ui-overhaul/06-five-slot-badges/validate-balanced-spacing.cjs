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
assert.match(html, /\.list-toolbar\{[^}]*justify-content:space-between/, 'Edit and Add actions are not balanced');
assert.match(html, /\.alarm-add\{[^}]*width:44px[^}]*height:44px/, 'Alarm Add action is not a full touch target');
assert.match(html, /\.alarm-row \.swipe-main\{[^}]*min-height:84px[^}]*padding:7px 0/, 'Alarm rows are not compact');
assert.match(html, /\.alarm-edit\{[^}]*min-height:72px/, 'Alarm row edit target is too small');
assert.match(html, /--tabbar-height:76px/, 'compact tab bar height missing');
assert.match(html, /\.viewport\{[^}]*calc\(var\(--tabbar-height\) \+ env\(safe-area-inset-bottom\)\)/, 'viewport does not follow the compact safe-area tab bar');
assert.match(html, /\.tabbar\{[^}]*height:calc\(var\(--tabbar-height\) \+ env\(safe-area-inset-bottom\)\)[^}]*align-items:center/, 'tab bar is not compact and vertically centered');
assert.match(html, /\.tab\{[^}]*min-height:52px[^}]*align-items:center[^}]*justify-content:center/, 'tab icons are not centered in their grid cells');
assert.match(html, /\.tab:before\{[^}]*width:42px[^}]*height:38px[^}]*border-radius:19px[^}]*background:var\(--raised\)/, 'restrained selected-tab treatment is missing');
assert.match(html, /\.tab\.active:not\(\.log-tab\):before\{[^}]*opacity:\.62[^}]*scale\(1\)/, 'selected-tab treatment does not activate');
assert.match(html, /\.tab\.log-tab\{[^}]*align-self:center[^}]*translateY\(-4px\)/, 'plus button is not visually aligned with the icon row');
assert.match(html, /\.tab\.log-tab \.plus-disc\{[^}]*width:58px[^}]*height:58px[^}]*flex:0 0 58px[^}]*aspect-ratio:1\/1[^}]*border-radius:50%/, 'center plus can shrink into an oval');
assert.match(html, /<header class="alarm-head"><div class="list-toolbar"><button class="list-edit" id="editAlarms"[^>]*>Edit<\/button><button[^>]*aria-label="Add alarm"><svg[\s\S]*?<path d="M12 5v14M5 12h14"\/><\/svg><\/button><\/div><p class="date">Your morning<\/p><h1 class="nav-title">Wake gently\.<br>Remember more\.<\/h1><\/header>/, 'Alarm header structure does not preserve Edit/Add inside the next-wake composition');
assert.match(html, /#alarmList \.alarm-row:first-child\{[^}]*min-height:248px[^}]*border-radius:25px[^}]*background:var\(--premium-dark\)/, 'next enabled alarm is not presented as the dominant wake stage');
assert.doesNotMatch(html, /Dreamworld alarms use Apple’s system alarm experience\./, 'obsolete Alarm header copy remains');
assert.match(html, /\.statusbar\{display:none\}\.viewport\{inset:max\(env\(safe-area-inset-top\),12px\)/, 'installed iPhone still shows the simulated status bar');

console.log('DREAMWORLD_BALANCED_SPACING_VERIFIED');
