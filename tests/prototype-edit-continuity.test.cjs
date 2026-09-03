const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('Alarm and History retain reachable Edit actions in the v4 metadata rows',()=>{
  assert.match(html,/\.page-header\{height:96px;margin-top:14px/);
  assert.match(html,/<header class="home-header page-header"><div class="header-meta-row">[\s\S]*?<button class="header-meta-action" id="editDreams"/);
  assert.match(html,/<header class="alarm-head page-header"><div class="header-meta-row">[\s\S]*?<button class="header-meta-action" id="editAlarms"/);
  assert.match(html,/\.header-meta-action\{min-width:44px;height:44px/);
});

test('Add Alarm is a native right-side header bubble',()=>{
  assert.match(html,/<button class="alarm-add header-action" id="addAlarm"[^>]*aria-label="Add alarm"[^>]*>[\s\S]*?<path d="M12 5v14M5 12h14"\/><\/svg><\/button>/);
  assert.match(html,/\.alarm-add\{width:44px;height:44px[^}]*border-radius:50%[^}]*background:var\(--raised\)/);
  assert.match(html,/\.alarm-add svg\{width:22px;height:22px[^}]*\}/);
  assert.doesNotMatch(html,/alarm-create-row|class="alarm-create"|<span>Add alarm<\/span>/);
});

test('Alarm edit mode suppresses creation and sheet closure restores focus',()=>{
  assert.match(html,/list\.id==='alarmList'[\s\S]*addAlarm[\s\S]*hidden=editing/);
  assert.match(html,/editorSheetReturnFocus\.set\(dialog,document\.activeElement\)/);
  assert.match(html,/const returnFocus=editorSheetReturnFocus\.get\(dialog\)/);
  assert.match(html,/returnFocus\?\.focus\?\.\(\)/);
});
