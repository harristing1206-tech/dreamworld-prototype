const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('Insights uses the fixed top band as a latest-dream breadcrumb',()=>{
  assert.match(html,/<div class="context-rail insights-latest-rail"><button id="latestDreamRail" type="button" aria-label="Open latest dream"><span class="latest-dream-copy"><span class="latest-dream-label">Latest dream<\/span><strong class="latest-dream-title" id="latestDreamRailTitle">The station beneath the lake<\/strong><\/span><time class="latest-dream-date" id="latestDreamRailDate" datetime="2026-08-25">Aug 25<\/time><\/button><span class="latest-dream-empty" id="latestDreamRailEmpty" hidden>No dreams logged yet<\/span><\/div>/);
  assert.doesNotMatch(html,/id="insightsRailPeriod"/);
  assert.match(html,/\.insights-latest-rail button\{width:100%;height:44px[^}]*background:transparent[^}]*text-align:left[^}]*cursor:pointer/);
  assert.match(html,/\.latest-dream-copy\{min-width:0;display:flex;flex-direction:column/);
  assert.match(html,/\.latest-dream-label\{[^}]*font-size:var\(--type-label-size\)[^}]*letter-spacing:\.1em[^}]*text-transform:uppercase/);
  assert.match(html,/\.latest-dream-title\{min-width:0;[^}]*overflow:hidden;text-overflow:ellipsis;white-space:nowrap/);
  assert.match(html,/\.latest-dream-date\{flex:0 0 auto[^}]*font-size:12px/);
  assert.match(html,/\.latest-dream-empty\{[^}]*font-size:var\(--type-meta-size\)[^}]*color:var\(--muted\)/);
});

test('latest-dream breadcrumb uses the canonical newest record and exact detail flow',()=>{
  assert.match(html,/let latestInsightsRecord=null/);
  assert.match(html,/const renderInsightsSourceRail=\(\)=>\{const latest=sortedJournalRecords\(\)\[0\]\|\|null;latestInsightsRecord=latest/);
  assert.match(html,/const latestRailDateLabel=record=>/);
  assert.match(html,/latestDreamRailDate'\)\.textContent=latestRailDateLabel\(latest\)/);
  assert.match(html,/latestDreamRailDate'\)\.dateTime=latest\.dateKey/);
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
