const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('Add bubble matches Edit material without a decorative outline',()=>{
  const rule=html.match(/\.alarm-add\{([^}]+)\}/)?.[1]||'';
  assert.match(rule,/border:0/);
  assert.match(rule,/outline:0/);
  assert.match(rule,/background:var\(--raised\)/);
  assert.match(rule,/box-shadow:/);
  assert.match(html,/button:focus-visible[^}]*outline:3px solid var\(--accent\)[^}]*outline-offset:3px/);
});

test('only the useful History collection context remains in an action rail',()=>{
  assert.match(html,/<header class="home-header">[\s\S]*?<button[^>]*id="editDreams"[\s\S]*?<span class="rail-meta rail-meta-right" id="historyRailCount">6 dreams<\/span>/);
  assert.doesNotMatch(html,/<div class="context-rail">/);
  assert.doesNotMatch(html,/Private capture|Private profile|insightsRailPeriod/);
  assert.doesNotMatch(html,/class="rail-meta[^"]*"[^>]*(?:role="button"|tabindex=|onclick=)/);
});

test('History count remains canonical and correctly pluralized',()=>{
  assert.match(html,/const updateHistoryRailCount=\(\)=>\{const count=journalRecords\.length;document\.getElementById\('historyRailCount'\)\.textContent=`\$\{count\} dream\$\{count===1\?'':'s'\}`\}/);
  assert.match(html,/const renderHistoryList=\(\)=>\{[\s\S]*?updateHistoryRailCount\(\)/);
});

test('Insights period is visible on and labels the calendar',()=>{
  assert.match(html,/<section class="insights-calendar" aria-labelledby="insightsMonth">[\s\S]*?<h2 id="insightsMonth">This month<\/h2>[\s\S]*?<span class="calendar-legend">Dream logged<\/span>/);
  assert.match(html,/document\.getElementById\('insightsMonth'\)\.textContent=monthLabel;calendar\.setAttribute\('aria-label',`Dream days in \$\{monthLabel\}`\)/);
});
