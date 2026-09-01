const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('Alarm and History reserve the same top-right Edit slot',()=>{
  assert.match(html,/\.alarm-head,\.home-header\{position:relative;padding-top:52px\}/);
  assert.match(html,/\.alarm-head \.list-toolbar,\.home-header \.list-toolbar\{position:absolute;left:0;right:0;top:0;width:auto;height:44px\}/);
  assert.doesNotMatch(html,/\.alarm-head \.list-edit\{[^}]*background:transparent/,'Alarm Edit must use the same raised pill as History');
  assert.match(html,/<header class="home-header">[\s\S]*?<span aria-hidden="true"><\/span><button class="list-edit" id="editDreams"/);
  assert.match(html,/<header class="alarm-head">[\s\S]*?<button class="alarm-add" id="addAlarm"[\s\S]*?<button class="list-edit" id="editAlarms"/);
});

test('Add Alarm is a native left-side header action',()=>{
  assert.match(html,/<button class="alarm-add" id="addAlarm"[^>]*aria-label="Add alarm"[^>]*>[\s\S]*?<path d="M12 5v14M5 12h14"\/><\/svg><\/button>/);
  assert.match(html,/\.alarm-add\{width:44px;height:44px[^}]*background:transparent/);
  assert.match(html,/\.alarm-add svg\{width:22px;height:22px\}/);
  assert.doesNotMatch(html,/alarm-create-row|class="alarm-create"|<span>Add alarm<\/span>/);
});

test('Alarm edit mode suppresses creation and sheet closure restores focus',()=>{
  assert.match(html,/list\.id==='alarmList'[\s\S]*addAlarm[\s\S]*hidden=editing/);
  assert.match(html,/alarmSheetReturnFocus=document\.activeElement/);
  assert.match(html,/alarmSheetReturnFocus\?\.focus\(\)/);
});
