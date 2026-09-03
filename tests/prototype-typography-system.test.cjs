const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('Dreamworld uses the approved Arial and Georgia typography system',()=>{
  assert.match(html,/--font-ui:Arial,Helvetica,sans-serif;--font-editorial:Georgia,"Times New Roman",serif/);
  assert.match(html,/body,button,input,textarea\{font-family:var\(--font-ui\)\}/);
  assert.match(html,/\.page-header h1\{[^}]*font-family:var\(--font-editorial\)[^}]*font-size:34px[^}]*line-height:38px[^}]*font-weight:400/);
  assert.match(html,/#alarmList \.alarm-row\.next-alarm \.alarm-time\{[^}]*font-family:var\(--font-editorial\)[^}]*font-size:58px[^}]*font-weight:400/);
  assert.match(html,/\.history-entry h2\{[^}]*font-family:var\(--font-editorial\)[^}]*font-size:18px/);
  assert.match(html,/\.calendar-toolbar h2\{font-family:var\(--font-editorial\)/);
  assert.match(html,/\.settings-heading\{font-family:var\(--font-editorial\);font-size:24px;font-weight:400\}/);
});

test('core reading and numeric surfaces keep readable hierarchy',()=>{
  assert.match(html,/\.transcript\{[^}]*font-size:var\(--type-body-size\)[^}]*line-height:1\.55/);
  assert.match(html,/\.tab-label\{font-size:var\(--type-label-size\);line-height:var\(--type-label-line\);font-weight:600\}/);
  assert.match(html,/\.alarm-time\{[^}]*font-variant-numeric:tabular-nums/);
  assert.match(html,/\.history-entry-meta\{[^}]*font-size:11px;line-height:14px/);
  assert.match(html,/\.latest-dream-label\{[^}]*font-size:var\(--type-label-size\);line-height:var\(--type-label-line\)/);
});

test('font weights reflect standard system-font roles',()=>{
  const v4=html.slice(html.indexOf('/* v76 — premium editorial mockup'));
  const weights=[...v4.matchAll(/font-weight:(\d+)/g)].map(match=>Number(match[1]));
  const unexpected=[...new Set(weights.filter(weight=>![400,600,700].includes(weight)))];
  assert.deepEqual(unexpected,[],`unexpected v4 font weights: ${unexpected.join(', ')}`);
});
