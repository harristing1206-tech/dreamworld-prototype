const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('History uses the stable v4 archive header without crowding its title',()=>{
  assert.match(html,/\.page-header\{height:96px;margin-top:14px;padding:0 0 14px;border:0\}/);
  assert.match(html,/\.header-meta-action\{min-width:44px;height:44px/);
  assert.match(html,/<header class="home-header page-header"><div class="header-meta-row"><span class="header-meta">Private dream archive<\/span><span class="visually-hidden" id="historyRailCount">6 dreams<\/span><button class="header-meta-action" id="editDreams"[^>]*>Edit<\/button><\/div><div class="header-title-row"><h1 class="greeting">Mapped fragments<\/h1><\/div><\/header>/);
  assert.doesNotMatch(html,/>August 2026 · Dream journal</);
  assert.match(html,/<input id="historySearch" type="search"[^>]*placeholder="Search dreams"/);
});
