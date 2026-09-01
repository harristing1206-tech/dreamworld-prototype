const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('Alarm and History reserve the same top-right Edit slot',()=>{
  assert.match(html,/\.alarm-head\{position:relative;padding-top:4px\}/);
  assert.match(html,/\.alarm-head \.list-toolbar\{position:absolute;right:0;top:0;width:auto;height:44px\}/);
  assert.match(html,/\.home-header \.list-toolbar\{position:absolute;right:0;top:0;width:auto;height:44px\}/);
  assert.doesNotMatch(html,/\.alarm-head \.list-edit\{[^}]*background:transparent/,'Alarm Edit must use the same raised pill as History');
  const alarmHeader=html.match(/<header class="alarm-head">([\s\S]*?)<\/header>/)?.[1]||'';
  assert.match(alarmHeader,/id="editAlarms"/);
  assert.doesNotMatch(alarmHeader,/id="addAlarm"/,'Add Alarm must not displace Edit in the header');
});

test('Add Alarm is a labeled contextual list action',()=>{
  assert.match(html,/<div class="alarm-create-row" id="alarmCreateRow"><button class="alarm-create" id="addAlarm"[^>]*aria-label="Add alarm"[^>]*>[\s\S]*?<span>Add alarm<\/span><\/button><\/div>[\s\S]*?<div class="alarm-list" id="alarmList">/);
  assert.match(html,/\.alarm-create-row\{height:44px;margin-top:10px;display:flex;align-items:center;justify-content:flex-end\}/);
  assert.match(html,/\.alarm-create\{[^}]*min-height:44px[^}]*display:flex[^}]*gap:6px[^}]*font-size:var\(--type-operational-size\)/);
  assert.match(html,/\.alarm-create svg\{width:20px;height:20px\}/);
  assert.match(html,/\.alarm-list\{margin-top:8px/);
  assert.doesNotMatch(html,/\.alarm-create\{[^}]*(?:box-shadow|border-radius:50%|background:var\(--accent\))/,'Add Alarm must remain quiet and non-floating');
});

test('Alarm edit mode suppresses creation and sheet closure restores focus',()=>{
  assert.match(html,/list\.id==='alarmList'[\s\S]*alarmCreateRow[\s\S]*hidden=editing/);
  assert.match(html,/alarmSheetReturnFocus=document\.activeElement/);
  assert.match(html,/alarmSheetReturnFocus\?\.focus\(\)/);
});
