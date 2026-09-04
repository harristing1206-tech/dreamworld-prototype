const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('destination headers use the v4 metadata and editorial-title hierarchy',()=>{
  assert.match(html,/<header class="alarm-head page-header">[\s\S]*?<time class="header-meta" id="alarmDate">[\s\S]*?<h1 class="nav-title">Good morning\.<\/h1>/);
  assert.match(html,/<header class="home-header page-header">[\s\S]*?Private dream archive[\s\S]*?<h1 class="greeting"[^>]*>Mapped fragments<\/h1>/);
  assert.match(html,/<header class="page-header">[\s\S]*?Private capture[\s\S]*?<h1 class="log-title">Capture<\/h1>/);
  assert.match(html,/<header class="insights-head page-header">[\s\S]*?id="insightsHeaderMeta"[\s\S]*?<h1 class="nav-title">Your terrain<\/h1>/);
  assert.match(html,/\.page-header h1\{[^}]*font-family:var\(--font-editorial\)[^}]*font-size:34px[^}]*line-height:38px/);
});

test('Alarm retains Edit and Add without restoring the old action rail',()=>{
  assert.match(html,/<header class="alarm-head page-header"><div class="header-meta-row">[\s\S]*?id="editAlarms"[\s\S]*?<div class="header-title-row">[\s\S]*?id="addAlarm"/);
  assert.doesNotMatch(html,/<header class="alarm-head"><div class="list-toolbar">/);
  assert.match(html,/\.page-header \.header-action\{min-width:44px;height:44px[^}]*border-radius:22px/);
});

test('Alarm inherits the shared light and dark canvas',()=>{
  assert.doesNotMatch(html,/screen\[data-screen="alarm"\]\{background:#f7f7f5\}/);
  assert.doesNotMatch(html,/screen\[data-screen="alarm"\]\{[^}]*background:/);
});

test('Alarm edit mode hides and restores the header Add control',()=>{
  assert.match(html,/list\.id==='alarmList'[\s\S]*addAlarm[\s\S]*hidden=editing/);
  assert.doesNotMatch(html,/alarmCreateRow/);
});
