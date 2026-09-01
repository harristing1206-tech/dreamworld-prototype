const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('Alarm swaps Edit left and Add bubble right while History keeps Edit left',()=>{
  assert.match(html,/<header class="alarm-head"><div class="list-toolbar"><button class="list-edit header-action" id="editAlarms"[^>]*>Edit<\/button><button class="alarm-add header-action" id="addAlarm"[^>]*aria-label="Add alarm"/);
  assert.match(html,/<header class="home-header">[\s\S]*?<div class="list-toolbar"><button class="list-edit header-action" id="editDreams"[^>]*>Edit<\/button><span class="rail-meta rail-meta-right" id="historyRailCount">/);
  assert.match(html,/\.alarm-add\{width:44px;height:44px[^}]*border-radius:50%[^}]*background:var\(--raised\)[^}]*box-shadow:/);
  assert.doesNotMatch(html,/id="addAlarm"[\s\S]{0,500}background:var\(--highlight\)/,'header Add must not compete with Capture');
});

test('both header archetypes share gutters and title metrics',()=>{
  assert.match(html,/\.alarm-head,\.home-header\{position:relative;padding-top:52px\}/);
  assert.match(html,/\.insights-head,\.profile-head\{position:relative;padding-top:0\}/);
  assert.match(html,/\.alarm-head \.nav-title,\.home-header \.greeting,\.insights-head \.nav-title,\.profile-head h1,\.log-screen \.log-title\{margin:0;font-size:var\(--type-display-size\);line-height:var\(--type-display-line\);letter-spacing:var\(--type-display-tracking\);font-weight:var\(--type-display-weight\)\}/);
  assert.match(html,/\.log-screen>header\{[^}]*left:24px;right:24px;top:8px\}/);
});

test('header actions use contained semantic-click illumination without layout animation',()=>{
  assert.match(html,/#editAlarms,#addAlarm,#editDreams\{[^}]*position:relative[^}]*overflow:hidden[^}]*transition:scale 220ms/);
  assert.match(html,/#editAlarms:active,#addAlarm:active,#editDreams:active\{scale:\.96;transition-duration:90ms\}/);
  assert.match(html,/\.header-action\.illuminating:after\{animation:header-action-light 360ms cubic-bezier\(\.22,\.61,\.36,1\)\}/);
  assert.match(html,/@keyframes header-action-light\{[^}]*0%\{opacity:0;transform:scale\(\.72\)\}/);
  assert.match(html,/const illuminateHeaderAction=button=>/);
  assert.match(html,/\['editAlarms','addAlarm','editDreams'\][\s\S]*illuminateHeaderAction/);
  assert.match(html,/@media\(prefers-reduced-motion:reduce\)\{[^}]*#editAlarms:active,#addAlarm:active,#editDreams:active\{scale:1/);
  const lightKeyframes=html.match(/@keyframes header-action-light\{([\s\S]*?)\}\}/)?.[1]||'';
  assert.doesNotMatch(lightKeyframes,/(?:width|height|margin|padding):/,'illumination must not animate layout geometry');
});
