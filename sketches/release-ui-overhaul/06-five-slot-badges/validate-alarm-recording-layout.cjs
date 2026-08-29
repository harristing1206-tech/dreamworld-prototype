const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');

const outlineRule=html.match(/:root\[data-theme="light"\] :is\(([^)]*)\),:root\[data-theme="dark"\] :is\(([^)]*)\)\{outline:1px solid var\(--bubble-outline\)/);
assert.ok(outlineRule,'shared light/dark surface outline rule missing');
assert.doesNotMatch(outlineRule[1],/\.form-group/,'Repeat and Options still receive sharp rectangular outlines');
assert.doesNotMatch(outlineRule[2],/\.form-group/,'dark-mode Repeat and Options still receive sharp rectangular outlines');
assert.match(html,/\.form-row:first-of-type\{border-radius:12px 12px 0 0\}/,'Options group lost its rounded top corners');
assert.match(html,/\.form-row:last-of-type\{[^}]*border-radius:0 0 12px 12px\}/,'Options group lost its rounded bottom corners');
assert.match(html,/\.log-screen:has\(\.recording-state\.active\)>header\{visibility:hidden\}/,'recording state does not suppress the overlapping capture header');
assert.match(html,/\.log-screen \.recording-state\{inset:0;padding:24px;align-content:center;background:var\(--premium-dark\)\}/,'recording state does not own a full opaque layout surface');
console.log('DREAMWORLD_ALARM_RECORDING_LAYOUT_VERIFIED');
