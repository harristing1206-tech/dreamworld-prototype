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
  assert.match(html,/button:focus-visible[^}]*outline:3px solid var\(--accent\)[^}]*outline-offset:3px/,'keyboard focus ring must remain independent');
});

test('every root rail contains truthful actions or context',()=>{
  assert.match(html,/<header class="home-header">[\s\S]*?<button[^>]*id="editDreams"[\s\S]*?<span class="rail-meta rail-meta-right" id="historyRailCount">6 dreams<\/span>/);
  assert.match(html,/<header><div class="context-rail"><span class="rail-meta rail-meta-left"><svg[^>]*aria-hidden="true"[\s\S]*?<\/svg>Private capture<\/span><\/div><h1 class="log-title">/);
  assert.match(html,/<header class="insights-head"><div class="context-rail"><span class="rail-meta rail-meta-right" id="insightsRailPeriod">[\s\S]*?<\/span><\/div><h1 class="nav-title">Insights<\/h1><\/header>/);
  assert.match(html,/<header class="profile-head"><div class="context-rail"><span class="rail-meta rail-meta-left"><svg[^>]*aria-hidden="true"[\s\S]*?<\/svg>Private profile<\/span><\/div><h1>My Dream World<\/h1><\/header>/);
  assert.doesNotMatch(html,/class="rail-meta[^"]*"[^>]*(?:role="button"|tabindex=|onclick=)/);
});

test('rail metadata is plain subordinate text, not a false affordance',()=>{
  assert.match(html,/\.context-rail\{position:absolute;left:0;right:0;top:0;height:44px;display:flex;align-items:center;justify-content:space-between\}/);
  assert.match(html,/\.rail-meta\{[^}]*font-size:var\(--type-meta-size\)[^}]*line-height:var\(--type-meta-line\)[^}]*font-weight:550[^}]*color:var\(--muted\)[^}]*background:transparent[^}]*border:0[^}]*box-shadow:none/);
  assert.match(html,/\.rail-meta svg\{width:14px;height:14px[^}]*margin-right:6px/);
  assert.match(html,/\.log-screen \.rail-meta\{color:rgba\(241,243,245,\.72\)\}/);
});

test('History count and Insights period share their canonical data sources',()=>{
  assert.match(html,/const updateHistoryRailCount=\(\)=>\{const count=journalRecords\.length;document\.getElementById\('historyRailCount'\)\.textContent=`\$\{count\} dream\$\{count===1\?'':'s'\}`\}/);
  assert.match(html,/const renderHistoryList=\(\)=>\{[\s\S]*?updateHistoryRailCount\(\)/);
  assert.match(html,/document\.getElementById\('insightsRailPeriod'\)\.textContent=monthLabel/);
  assert.match(html,/<h2 class="visually-hidden" id="insightsMonth">This month<\/h2>/);
  assert.match(html,/\.visually-hidden\{position:absolute[^}]*clip:rect\(0 0 0 0\)/);
});
