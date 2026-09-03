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
  const profile=html.match(/<section class="screen" data-screen="profile"[\s\S]*?<\/section>/)?.[0]||'';
  assert.match(profile,/<header class="profile-head page-header">[\s\S]*?Private profile[\s\S]*?<h1>My Dream World<\/h1>/);
  assert.match(profile,/<button class="profile-identity" id="showProfile"[^>]*aria-label="Show Harris profile"/);
  assert.match(profile,/<span class="profile-avatar">H<\/span>/);
  assert.match(profile,/<span class="profile-identity-copy"><strong>Harris<\/strong><span>Show profile<\/span><\/span>/);
  assert.match(profile,/<span class="profile-chevron" aria-hidden="true">›<\/span>/);
  assert.match(profile,/<h2 class="settings-heading">Settings<\/h2>[\s\S]*?<p class="section-label">Appearance<\/p>/);
  assert.doesNotMatch(profile,/profile-stats|Dreams logged|Dream nights|Your profile, privacy/);
});

test('Profile rows preserve identity hierarchy and native touch targets',()=>{
  assert.match(html,/\.profile-identity\{[^}]*min-height:76px/);
  assert.match(html,/\.profile-avatar\{width:52px;height:52px/);
  assert.match(html,/\.profile-identity-copy\{flex:1;min-width:0;text-align:left\}/);
  assert.match(html,/\.settings-heading\{font-family:var\(--font-editorial\);font-size:24px;font-weight:400\}/);
  assert.match(html,/\.setting-row\{min-height:60px/);
});
