const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

test('persistent tab headers replace promotional copy with concise primary headings', () => {
  assert.doesNotMatch(html, /Wake gently\.|Remember more\.|Dream journal\.|What do you remember\?|My Dream World/);
  assert.doesNotMatch(html, /<h1 class="nav-title">Insights<\/h1>/);
  assert.match(html, /\.sr-only\{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect\(0,0,0,0\);white-space:nowrap;border:0\}/);
  assert.match(html, /data-screen="alarm"[^>]*aria-label="Alarms"[\s\S]*?<h1 class="tab-heading">Good Morning, Harris<\/h1>/);
  assert.match(html, /data-screen="history"[^>]*aria-label="Dream history"[\s\S]*?<h1 class="tab-heading">Dream Logs<\/h1>/);
  assert.match(html, /data-screen="log"[^>]*aria-label="Log a dream"[\s\S]*?<h1 class="sr-only">Log a dream<\/h1>/);
  assert.match(html, /data-screen="insights"[^>]*aria-label="Dream insights and sleep analytics"[\s\S]*?<h1 class="tab-heading">Sleep Patterns<\/h1>/);
  assert.match(html, /data-screen="profile"[^>]*aria-label="Profile and settings"[\s\S]*?<h1 class="tab-heading">My Profile<\/h1>/);
});

test('concise orientation and functional content remain', () => {
  for (const text of ['Good Morning, Harris', 'Dream Logs', 'Dream log', 'Sleep Patterns', 'My Profile', 'Settings', 'Start with any detail. Silence is okay.']) {
    assert.match(html, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
