const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('destination headers use one clear title without repeated kickers',()=>{
  for(const copy of ['Your morning','Your private archive','Dream log','Your patterns'])assert.doesNotMatch(html,new RegExp(`>${copy}<`,'i'));
  assert.match(html,/<header class="alarm-head">[\s\S]*?<h1 class="nav-title">Alarm<\/h1><\/header>/);
  assert.match(html,/<header class="home-header">[\s\S]*?<h1 class="greeting">Dream journal\.<\/h1>\s*<\/header>/);
  assert.match(html,/<header><h1 class="log-title">What do you remember\?<\/h1><p class="log-copy">Start with any detail\. Silence is okay\.<\/p><\/header>/);
  assert.match(html,/<header class="insights-head"><h1 class="nav-title">Insights<\/h1><\/header>/);
  assert.match(html,/--type-display-size:31px;--type-display-line:34px;--type-display-weight:620/,'the accepted display scale must remain');
});

test('Alarm uses one native action rail with Edit left and Add right',()=>{
  assert.match(html,/<header class="alarm-head"><div class="list-toolbar"><button class="list-edit header-action" id="editAlarms"[^>]*>Edit<\/button><button class="alarm-add header-action" id="addAlarm"[^>]*aria-label="Add alarm"[\s\S]*?<\/button><\/div><h1 class="nav-title">Alarm<\/h1><\/header>/);
  assert.doesNotMatch(html,/alarm-create-row|class="alarm-create"|<span>Add alarm<\/span>/);
  assert.match(html,/\.alarm-head \.list-toolbar,\.home-header \.list-toolbar\{position:absolute;left:0;right:0;top:0;width:auto;height:44px\}/);
  assert.match(html,/\.alarm-head,\.home-header,\.insights-head,\.profile-head\{position:relative;padding-top:52px\}/);
  assert.match(html,/\.alarm-add\{width:44px;height:44px[^}]*border-radius:50%[^}]*background:var\(--raised\)/);
});

test('Alarm inherits the shared light and dark canvas',()=>{
  assert.doesNotMatch(html,/screen\[data-screen="alarm"\]\{background:#f7f7f5\}/);
  assert.doesNotMatch(html,/screen\[data-screen="alarm"\]\{[^}]*background:/);
});

test('Alarm edit mode hides and restores the header Add control',()=>{
  assert.match(html,/list\.id==='alarmList'[\s\S]*addAlarm[\s\S]*hidden=editing/);
  assert.doesNotMatch(html,/alarmCreateRow/);
});
