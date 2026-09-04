const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('Alarm and History adapt functional actions to the v4 header structure',()=>{
  assert.match(html,/<header class="alarm-head page-header"><div class="header-meta-row">[\s\S]*?id="editAlarms"[\s\S]*?<div class="header-title-row">[\s\S]*?id="addAlarm"/);
  assert.match(html,/<header class="home-header page-header"><div class="header-meta-row">[\s\S]*?id="editDreams"[\s\S]*?<div class="header-title-row"><h1 class="greeting"[^>]*>Mapped fragments/);
  assert.doesNotMatch(html,/<header class="(?:alarm|home)-head"><div class="list-toolbar">/);
});

test('every root title uses one shared origin and editorial metrics',()=>{
  assert.match(html,/\.page-header\{height:96px;margin-top:14px;padding:0 0 14px;border:0\}/);
  assert.match(html,/\.page-header h1\{margin:0;font-family:var\(--font-editorial\);font-size:34px!important;line-height:38px!important;font-weight:400!important/);
  for(const title of ['Good morning.','Mapped fragments','Capture','Your terrain','My Dream World'])assert.match(html,new RegExp(`>${title.replace('.','\\.')}<`));
});

test('header actions keep contained semantic-click illumination without layout animation',()=>{
  assert.match(html,/#editAlarms,#addAlarm,#editDreams\{[^}]*position:relative[^}]*overflow:hidden[^}]*transition:scale 220ms/);
  assert.match(html,/#editAlarms:active,#addAlarm:active,#editDreams:active\{scale:\.96;transition-duration:90ms\}/);
  assert.match(html,/\.header-action\.illuminating:after\{animation:header-action-light 360ms cubic-bezier\(\.22,\.61,\.36,1\)\}/);
  assert.match(html,/const illuminateHeaderAction=button=>/);
  assert.match(html,/\['editAlarms','addAlarm','editDreams'\][\s\S]*illuminateHeaderAction/);
  const lightKeyframes=html.match(/@keyframes header-action-light\{([\s\S]*?)\}\}/)?.[1]||'';
  assert.doesNotMatch(lightKeyframes,/(?:width|height|margin|padding):/);
});
