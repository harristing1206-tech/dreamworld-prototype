const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('DM Sans exposes the accepted purpose-named role system',()=>{
  assert.match(html,/--type-display-size:31px;--type-display-line:34px;--type-display-weight:620;--type-display-tracking:-\.018em/);
  assert.match(html,/--type-section-size:22px;--type-section-line:27px;--type-section-weight:600;--type-section-tracking:-\.008em/);
  assert.match(html,/--type-body-size:16px;--type-body-line:24px;--type-body-weight:400/);
  assert.match(html,/--type-operational-size:15px;--type-operational-line:20px;--type-operational-weight:550/);
  assert.match(html,/--type-meta-size:13px;--type-meta-line:18px;--type-meta-weight:500/);
  assert.match(html,/--type-label-size:11px;--type-label-line:14px;--type-label-weight:600/);
  assert.match(html,/--type-data-size:55px;--type-data-line:55px;--type-data-weight:500;--type-data-tracking:-\.045em/);
});

test('History list matches the accepted cleaned DM Sans mockup',()=>{
  assert.match(html,/\.history-date-rail strong\{font-size:var\(--type-section-size\);line-height:var\(--type-section-line\);font-weight:var\(--type-section-weight\);letter-spacing:var\(--type-section-tracking\)\}/);
  assert.match(html,/\.history-date-rail span\{[^}]*font-size:var\(--type-label-size\)[^}]*line-height:var\(--type-label-line\)[^}]*font-weight:var\(--type-label-weight\)/);
  assert.match(html,/\.history-entry h2\{[^}]*font-size:16px;line-height:21px;[^}]*font-weight:600;letter-spacing:-\.006em/);
  assert.match(html,/\.history-entry-excerpt\{[^}]*font-size:var\(--type-meta-size\);line-height:var\(--type-meta-line\);font-weight:400/);
});

test('History detail uses shared display, body, operational, metadata, and label roles',()=>{
  assert.match(html,/\.history-focus h2\{[^}]*font-size:var\(--type-display-size\);line-height:var\(--type-display-line\);letter-spacing:var\(--type-display-tracking\);font-weight:var\(--type-display-weight\)/);
  assert.match(html,/\.history-focus-excerpt\{[^}]*font-size:var\(--type-body-size\);line-height:var\(--type-body-line\);font-weight:var\(--type-body-weight\)/);
  assert.match(html,/\.history-focus-transcript\{[^}]*font-size:var\(--type-body-size\);line-height:var\(--type-body-line\);font-weight:var\(--type-body-weight\)/);
  assert.match(html,/\.history-focus-action\{[^}]*font-size:var\(--type-operational-size\);line-height:var\(--type-operational-line\);font-weight:var\(--type-operational-weight\)/);
  assert.match(html,/\.history-focus-fact span\{[^}]*font-size:var\(--type-label-size\);line-height:var\(--type-label-line\);font-weight:var\(--type-label-weight\)/);
});
