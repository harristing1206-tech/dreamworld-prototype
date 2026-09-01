const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

test('bottom navigation is slightly shorter with labels closer to icons', () => {
  assert.match(html, /--tabbar-height:68px/);
  assert.match(html, /--type-label-size:11px;--type-label-line:14px;--type-label-weight:600/);
  assert.match(html, /\.tab\{min-height:58px;padding:1px 1px 1px;flex-direction:column;gap:0\}/);
  assert.match(html, /\.tab svg\{width:20px;height:20px\}/);
  assert.match(html, /\.tab-label\{[^}]*font-size:var\(--type-label-size\)/);
  assert.match(html, /\.tab\.log-tab \.plus-disc\{width:44px;height:44px/);
});

test('Profile follows title, identity row, then settings hierarchy', () => {
  const profile = html.match(/<section class="screen" data-screen="profile"[\s\S]*?<\/section>/)?.[0] || '';
  assert.match(profile, /<header class="profile-head"><h1>My Dream World<\/h1><\/header>/);
  assert.match(profile, /<button class="profile-identity" id="showProfile"[^>]*aria-label="Show Harris profile"/);
  assert.match(profile, /<span class="profile-avatar">H<\/span>/);
  assert.match(profile, /<span class="profile-identity-copy"><strong>Harris<\/strong><span>Show profile<\/span><\/span>/);
  assert.match(profile, /<span class="profile-chevron" aria-hidden="true">›<\/span>/);
  assert.match(profile, /<h2 class="settings-heading">Settings<\/h2>[\s\S]*?<p class="section-label">Appearance<\/p>/);
  assert.doesNotMatch(profile, /profile-stats|Dreams logged|Dream nights|Your profile, privacy/);
  assert.doesNotMatch(profile, /Airbnb your place|Payments and payouts|Taxes/);
});

test('Airbnb-inspired profile rows preserve Dreamworld structure and native spacing', () => {
  assert.match(html, /\.profile-head\{[^}]*padding:18px 0 20px/);
  assert.match(html, /\.profile-identity\{[^}]*min-height:92px[^}]*border-bottom:1px solid var\(--separator\)/);
  assert.match(html, /\.profile-avatar\{width:64px;height:64px/);
  assert.match(html, /\.profile-identity-copy\{flex:1;min-width:0;text-align:left\}/);
  assert.match(html, /\.settings-heading\{margin:34px 0 12px;font-size:23px/);
  assert.match(html, /\.setting-row\{min-height:60px/);
});
