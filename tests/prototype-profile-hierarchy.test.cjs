const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('bottom navigation uses the v4 78px shell and unified 20px icon family',()=>{
  assert.match(html,/--tabbar-height:78px/);
  assert.match(html,/\.tab\{position:relative;min-height:60px;flex-direction:column;gap:5px/);
  assert.match(html,/\.tab svg\{width:20px;height:20px;stroke-width:1\.75/);
  assert.match(html,/\.tab-label\{font-size:var\(--type-label-size\)/);
  assert.match(html,/\.tab\.log-tab \.plus-disc\{width:44px;height:44px/);
});

test('Profile follows the v4 header, identity, then settings hierarchy',()=>{
  const profile=html.match(/<section class="screen profile-reference-remodel" data-screen="profile"[\s\S]*?<\/section>/)?.[0]||'';
  assert.match(profile,/<header class="profile-head page-header">[\s\S]*?My Dream World[\s\S]*?<h1>Profile<\/h1>/);
  assert.match(profile,/<button class="profile-identity" id="showProfile"[^>]*aria-label="Show Harris profile"/);
  assert.match(profile,/<span class="profile-avatar">H<\/span>/);
  assert.match(profile,/<span class="profile-identity-copy"><strong>Harris<\/strong><span>Private profile<\/span><\/span>/);
  assert.match(profile,/<span class="profile-chevron" aria-hidden="true">›<\/span>/);
  assert.match(profile,/<section class="profile-section profile-preferences"[\s\S]*?>[\s\S]*?<h2[^>]*>Preferences<\/h2>[\s\S]*?id="appearanceSetting"/);
  assert.doesNotMatch(profile,/profile-stats|Dreams logged|Dream nights|Your profile, privacy/);
});

test('Profile rows preserve identity hierarchy and native touch targets',()=>{
  assert.match(html,/\.profile-reference-remodel \.profile-identity\{[^}]*min-height:88px/);
  assert.match(html,/\.profile-reference-remodel \.profile-avatar\{width:64px;height:64px/);
  assert.match(html,/\.profile-reference-remodel \.profile-identity-copy\{flex:1;min-width:0;text-align:left\}/);
  assert.match(html,/\.profile-reference-remodel \.profile-section h2\{[^}]*font-size:11px/);
  assert.match(html,/\.profile-reference-remodel \.setting-row\{[^}]*min-height:72px/);
});
