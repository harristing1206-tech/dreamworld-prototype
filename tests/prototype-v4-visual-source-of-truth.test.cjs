const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const route=path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges');
const html=fs.readFileSync(path.join(route,'index.html'),'utf8');
const worker=fs.readFileSync(path.join(route,'service-worker.js'),'utf8');

test('v4 typography and surface tokens replace the legacy visual system',()=>{
  assert.match(html,/--font-ui:Arial,Helvetica,sans-serif;--font-editorial:Georgia,"Times New Roman",serif/);
  assert.match(html,/--defined-border:#d8d6d0;--bluegray:#e2e8e8;--card:#ffffff/);
  assert.match(html,/\.page-header\{height:96px;margin-top:14px;padding:0 0 14px;border:0\}/);
  assert.match(html,/\.page-header h1\{[^}]*font-family:var\(--font-editorial\)[^}]*font-size:34px[^}]*line-height:38px[^}]*font-weight:400/);
});

test('root destinations use the v4 page-header hierarchy and copy',()=>{
  assert.match(html,/<header class="alarm-head page-header">[\s\S]*?id="alarmDate"[\s\S]*?<h1 class="nav-title">Good morning\.<\/h1>/);
  assert.match(html,/<header class="home-header page-header">[\s\S]*?Private dream archive[\s\S]*?<h1 class="greeting">Mapped fragments<\/h1>/);
  assert.match(html,/<header class="home-header page-header"><div class="header-meta-row"><span class="header-meta">Private dream archive<\/span><span class="visually-hidden" id="historyRailCount">6 dreams<\/span><button class="header-meta-action" id="editDreams"/);
  assert.match(html,/<header class="page-header">[\s\S]*?Private capture[\s\S]*?<h1 class="log-title">Capture<\/h1>/);
  assert.match(html,/<header class="insights-head page-header">[\s\S]*?id="insightsHeaderMeta"[\s\S]*?<h1 class="nav-title">Your terrain<\/h1>/);
  assert.match(html,/<header class="profile-head page-header">[\s\S]*?Private profile[\s\S]*?<h1>My Dream World<\/h1>/);
});

test('Alarm matches the approved v4 dominant and secondary card system',()=>{
  assert.match(html,/#alarmList \.alarm-row\.next-alarm\{[^}]*min-height:246px[^}]*border-radius:28px[^}]*background:#161916[^}]*box-shadow:0 16px 32px rgba\(32,35,31,\.10\)/);
  assert.match(html,/\.alarm-list \.alarm-row:not\(\.next-alarm\)\{[^}]*min-height:88px[^}]*border-radius:22px[^}]*background:var\(--card\)[^}]*box-shadow:0 10px 24px rgba\(32,35,31,\.055\)/);
  assert.match(html,/#alarmList \.alarm-row\.next-alarm \.alarm-period\{[^}]*font-size:16px/);
  assert.match(html,/\.alarm-list \.alarm-row:not\(\.next-alarm\) \.alarm-period\{[^}]*font-size:11px/);
  assert.match(html,/\.switch\.on:before\{background:var\(--alarm-on\)\}/);
});

test('History uses stable metadata, timer durations, chevrons, and real search',()=>{
  assert.match(html,/<label class="history-search"[^>]*>[\s\S]*?<input id="historySearch" type="search"[^>]*>[\s\S]*?<\/label>/);
  assert.match(html,/const filterHistoryRows=/);
  assert.match(html,/document\.getElementById\('historySearch'\)\.addEventListener\('input'/);
  assert.match(html,/meta\.className='history-entry-meta'/);
  assert.match(html,/meta\.textContent=`\$\{shortHistoryDate\(record\)\} · \$\{formatDuration\(record\.recording\)\}`/);
  assert.match(html,/arrow\.textContent='›'/);
});

test('Insights keeps behavior while adopting the v4 order and calendar card',()=>{
  assert.match(html,/<header class="insights-head page-header">[\s\S]*?<section class="insights-hero"[\s\S]*?<section class="insights-calendar"[\s\S]*?<div class="insights-latest-card">[\s\S]*?id="latestDreamRail"[\s\S]*?<div class="insight-metrics"/);
  assert.match(html,/\.insights-calendar\{[^}]*border:1px solid var\(--defined-border\)[^}]*border-radius:22px/);
  assert.match(html,/\.insights-calendar\{min-height:314px/);
  assert.match(html,/\.calendar-day,\.calendar-blank\{[^}]*height:44px/);
  assert.match(html,/\.insights-latest-card button\{[^}]*min-height:74px[^}]*border:1px solid var\(--defined-border\)[^}]*border-radius:14px/);
  assert.match(html,/document\.getElementById\('insightsHeaderMeta'\)\.textContent=/);
  assert.match(html,/if\(currentScore===null\)recallTrend\.textContent='Rate recall when reviewing a dream\.'/);
});

test('Capture and navigation adopt v4 geometry without replacing behavior',()=>{
  assert.match(html,/<div class="recording-controls"><button class="pause-recording" id="pauseRecording"[\s\S]*?<button class="stop" id="stopRecording"[\s\S]*?<\/div>/);
  assert.match(html,/\.recording-controls\{[^}]*display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:12px/);
  assert.match(html,/\.recording-controls :is\(\.pause-recording,\.stop\)\{[^}]*width:100%!important;height:54px!important/);
  assert.match(html,/\.tab svg\{[^}]*width:20px;height:20px[^}]*stroke-width:1\.75/);
  assert.match(html,/\.tab\.active:not\(\.log-tab\):after\{[^}]*width:3px;height:3px/);
  assert.match(worker,/const CACHE='dreamworld-pwa-20260830-82'/);
});
