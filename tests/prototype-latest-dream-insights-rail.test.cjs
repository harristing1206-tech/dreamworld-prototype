const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('Insights uses the fixed top band as a latest-dream breadcrumb',()=>{
  assert.match(html,/<div class="context-rail insights-latest-rail"><button id="latestDreamRail" type="button" aria-label="Open latest dream"><span class="latest-dream-date"><strong id="latestDreamRailDay">25<\/strong><span id="latestDreamRailMonth">AUG<\/span><\/span><span class="latest-dream-title" id="latestDreamRailTitle">The station beneath the lake<\/span><\/button><span class="latest-dream-empty" id="latestDreamRailEmpty" hidden>No dreams logged yet<\/span><\/div>/);
  assert.doesNotMatch(html,/id="insightsRailPeriod"/);
  assert.match(html,/\.insights-latest-rail button\{width:100%;height:44px[^}]*background:transparent[^}]*text-align:left[^}]*cursor:pointer/);
  assert.match(html,/\.latest-dream-date\{width:49px;flex:0 0 49px/);
  assert.match(html,/\.latest-dream-title\{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap/);
  assert.match(html,/\.latest-dream-empty\{[^}]*font-size:var\(--type-meta-size\)[^}]*color:var\(--muted\)/);
});

test('latest-dream breadcrumb uses the canonical newest record and exact detail flow',()=>{
  assert.match(html,/let latestInsightsRecord=null/);
  assert.match(html,/const renderInsightsSourceRail=\(\)=>\{const latest=sortedJournalRecords\(\)\[0\]\|\|null;latestInsightsRecord=latest/);
  assert.match(html,/const parts=historyDateParts\(latest\)/);
  assert.match(html,/latestDreamRailDay'\)\.textContent=parts\.day/);
  assert.match(html,/latestDreamRailMonth'\)\.textContent=parts\.month\.toUpperCase\(\)/);
  assert.match(html,/latestDreamRailTitle'\)\.textContent=latest\.title/);
  assert.match(html,/latestDreamRail'\)\.setAttribute\('aria-label',`Open latest dream, \$\{latest\.title\}`\)/);
  assert.match(html,/latestDreamRail'\)\.addEventListener\('click',\(\)=>\{if\(latestInsightsRecord\)openDreamFromInsights\(latestInsightsRecord\)\}\)/);
  assert.match(html,/const refreshInsights=\(periodDate=new Date\(\)\)=>\{renderInsightsSourceRail\(\);renderInsightsCalendar\(periodDate\);updateInsights\(periodDate\)/);
});

test('calendar visibly owns the month and year',()=>{
  assert.match(html,/<div class="calendar-toolbar"><h2 id="insightsMonth">This month<\/h2><span class="calendar-legend">Dream logged<\/span><\/div>/);
  assert.match(html,/document\.getElementById\('insightsMonth'\)\.textContent=monthLabel/);
  assert.doesNotMatch(html,/document\.getElementById\('insightsRailPeriod'\)/);
  assert.match(html,/\.insights-calendar \.calendar-toolbar\{padding:0 12px;justify-content:space-between/);
});
