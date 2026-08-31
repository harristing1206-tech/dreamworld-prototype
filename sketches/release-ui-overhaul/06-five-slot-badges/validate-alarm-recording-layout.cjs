const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');

const outlineRule=html.match(/:root\[data-theme="light"\] :is\(([^)]*)\),:root\[data-theme="dark"\] :is\(([^)]*)\)\{outline:1px solid var\(--bubble-outline\)/);
assert.ok(outlineRule,'shared light/dark surface outline rule missing');
assert.doesNotMatch(outlineRule[1],/\.form-group/,'Repeat and Options still receive sharp rectangular outlines');
assert.doesNotMatch(outlineRule[2],/\.form-group/,'dark-mode Repeat and Options still receive sharp rectangular outlines');
assert.match(html,/\.form-row:first-of-type\{border-radius:12px 12px 0 0\}/,'Options group lost its rounded top corners');
assert.match(html,/\.form-row:last-of-type\{[^}]*border-radius:0 0 12px 12px\}/,'Options group lost its rounded bottom corners');
assert.match(html,/\.log-screen:has\(\.capture-state\.active:not\(\[data-log-state="ready"\]\)\)>header\{visibility:hidden\}/,'non-ready capture states do not suppress the overlapping capture header');
assert.match(html,/\.log-screen \.capture-state\.active:not\(\[data-log-state="ready"\]\)\{inset:0 0 calc\(96px \+ env\(safe-area-inset-bottom\)\) 0;padding:24px;overflow-y:auto;align-content:safe center;background:var\(--premium-dark\)\}/,'non-ready capture states do not preserve a full opaque scrollable layout surface above the floating navigation');
console.log('DREAMWORLD_ALARM_RECORDING_LAYOUT_VERIFIED');
