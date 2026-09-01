const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('root screens use exactly two intentional header archetypes',()=>{
  assert.match(html,/\.alarm-head,\.home-header\{position:relative;padding-top:52px\}/,'action headers reserve the 44px toolbar');
  assert.match(html,/\.insights-head,\.profile-head\{position:relative;padding-top:0\}/,'direct-content headers must not reserve a toolbar');
  assert.match(html,/\.log-screen>header\{[^}]*left:24px;right:24px;top:8px(?![^}]*padding-top)/,'Capture must use the direct-content origin');
  assert.match(html,/\.alarm-head \.nav-title,\.home-header \.greeting,\.insights-head \.nav-title,\.profile-head h1,\.log-screen \.log-title\{margin:0;font-size:var\(--type-display-size\);line-height:var\(--type-display-line\);letter-spacing:var\(--type-display-tracking\);font-weight:var\(--type-display-weight\)\}/,'both archetypes must share title metrics');
});

test('only action-heavy roots keep top rails',()=>{
  assert.match(html,/<header class="alarm-head"><div class="list-toolbar">/);
  assert.match(html,/<header class="home-header">[\s\S]*?<div class="list-toolbar">/);
  assert.doesNotMatch(html,/<header class="insights-head"><div class="context-rail">/);
  assert.doesNotMatch(html,/<header class="profile-head"><div class="context-rail">/);
  assert.doesNotMatch(html,/<header><div class="context-rail">[\s\S]*?Private capture/);
  assert.doesNotMatch(html,/Private profile/);
});

test('calendar visibly owns its localized month and year',()=>{
  assert.match(html,/<div class="calendar-toolbar"><h2 id="insightsMonth">This month<\/h2><span class="calendar-legend">Dream logged<\/span><\/div>/);
  assert.doesNotMatch(html,/id="insightsRailPeriod"/);
  assert.match(html,/document\.getElementById\('insightsMonth'\)\.textContent=monthLabel/);
  assert.doesNotMatch(html,/document\.getElementById\('insightsRailPeriod'\)/);
  assert.match(html,/\.insights-calendar \.calendar-toolbar\{padding:0 12px;justify-content:space-between/);
});

test('Capture moves privacy truth beside the consequential action',()=>{
  assert.match(html,/<p class="capture-privacy-note"><svg[^>]*aria-hidden="true"[\s\S]*?<\/svg>Private recording · transcription uses your private server<\/p>/);
  assert.match(html,/\.capture-privacy-note\{[^}]*display:flex[^}]*font-size:var\(--type-meta-size\)[^}]*color:rgba\(241,243,245,\.72\)/);
  assert.match(html,/\.capture-privacy-note svg\{width:14px;height:14px/);
});
