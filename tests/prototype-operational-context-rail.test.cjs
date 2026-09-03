const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('Add remains a distinct accessible header action',()=>{
  assert.match(html,/<button class="alarm-add header-action" id="addAlarm"[^>]*aria-label="Add alarm"/);
  assert.match(html,/\.page-header \.header-action\{min-width:44px;height:44px[^}]*border-radius:22px/);
  assert.match(html,/button:focus-visible[^}]*outline:3px solid var\(--accent\)[^}]*outline-offset:3px/);
});

test('every root header contains truthful metadata and one editorial title',()=>{
  assert.match(html,/<header class="home-header page-header">[\s\S]*?Private dream archive[\s\S]*?<h1 class="greeting">Mapped fragments<\/h1>/);
  assert.match(html,/<header class="page-header">[\s\S]*?Private capture[\s\S]*?<h1 class="log-title">Capture<\/h1>/);
  assert.match(html,/<header class="insights-head page-header">[\s\S]*?id="insightsHeaderMeta"[\s\S]*?<h1 class="nav-title">Your terrain<\/h1>/);
  assert.match(html,/<header class="profile-head page-header">[\s\S]*?Private profile[\s\S]*?<h1>My Dream World<\/h1>/);
  assert.doesNotMatch(html,/class="header-meta"[^>]*(?:role="button"|tabindex=|onclick=)/);
  assert.match(html,/\.header-meta\{[^}]*color:var\(--muted\)[^}]*font-size:12px/);
});

test('History count and Insights period share their canonical data sources',()=>{
  assert.match(html,/const updateHistoryRailCount=\(\)=>\{const count=journalRecords\.length;document\.getElementById\('historyRailCount'\)\.textContent=`\$\{count\} dream\$\{count===1\?'':'s'\}`\}/);
  assert.match(html,/const renderHistoryList=\(\)=>\{[\s\S]*?updateHistoryRailCount\(\)/);
  assert.match(html,/document\.getElementById\('insightsMonth'\)\.textContent=monthLabel/);
  assert.match(html,/document\.getElementById\('insightsHeaderMeta'\)\.textContent=`\$\{monthLabel\} · \$\{dreamNights\} dream night/);
});
