const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('Insights places the real Latest Dream in the reference-led opening card',()=>{
  assert.match(html,/<header class="insights-head page-header">[\s\S]*?<div class="insights-latest-card"><button id="latestDreamRail" type="button" aria-label="Open latest dream">[\s\S]*?id="latestDreamRailDate"[\s\S]*?id="latestDreamRailTitle"[\s\S]*?id="latestDreamRailExcerpt"[\s\S]*?<\/button>/);
  assert.match(html,/\.insights-reference-remodel \.insights-latest-card button\{width:100%;min-height:148px[^}]*border:1px solid var\(--insights-border\)[^}]*border-radius:24px/);
  assert.match(html,/\.insights-reference-remodel \.latest-dream-title\{[^}]*font-family:"Newsreader",var\(--font-editorial\)[^}]*white-space:normal/);
  assert.match(html,/\.insights-reference-remodel \.latest-dream-label\{[^}]*font-size:11px/);
});

test('Latest Dream uses the canonical newest record and exact detail flow',()=>{
  assert.match(html,/let latestInsightsRecord=null/);
  assert.match(html,/const renderInsightsSourceRail=\(\)=>\{const latest=sortedJournalRecords\(\)\[0\]\|\|null;latestInsightsRecord=latest/);
  assert.match(html,/latestDreamRailDate'\)\.textContent=latestRailDateLabel\(latest\)/);
  assert.match(html,/latestDreamRailDate'\)\.dateTime=latest\.dateKey/);
  assert.match(html,/latestDreamRailTitle'\)\.textContent=latest\.title/);
  assert.match(html,/latestDreamRailExcerpt'\)\.textContent=latest\.excerpt\|\|excerptForTranscript\(latest\.transcript\|\|''\)/);
  assert.match(html,/latestDreamRail'\)\.setAttribute\('aria-label',`Open latest dream, \$\{latest\.title\}`\)/);
  assert.match(html,/latestDreamRail'\)\.addEventListener\('click',\(\)=>\{if\(latestInsightsRecord\)openDreamFromInsights\(latestInsightsRecord\)\}\)/);
  assert.match(html,/const refreshInsights=\(periodDate=new Date\(\)\)=>\{renderInsightsSourceRail\(\);renderInsightsCalendar\(periodDate\);updateInsights\(periodDate\)/);
});

test('calendar visibly owns the month, today, and selected-dream states',()=>{
  assert.match(html,/<div class="calendar-toolbar"><h2 id="insightsMonth">This month<\/h2><span class="calendar-legend">Today<\/span><\/div>/);
  assert.match(html,/document\.getElementById\('insightsMonth'\)\.textContent=monthLabel/);
  assert.match(html,/button\.classList\.toggle\('today',dateKey===localDateKey\(periodDate\)\)/);
  assert.match(html,/button\.classList\.toggle\('selected',dateKey===selectedKey\)/);
  assert.match(html,/\.insights-reference-remodel \.insights-calendar\{min-height:314px[^}]*border:1px solid var\(--insights-border\)[^}]*border-radius:24px/);
});
