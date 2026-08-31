const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

test('recording pulse owns the full capture surface behind controls', () => {
  assert.match(html, /\.log-screen \.recording-state\{[^}]*isolation:isolate[^}]*overflow:hidden/);
  assert.match(html, /\.log-screen \.recording-state>\*:not\(\.voice-visual\)\{position:relative;z-index:2\}/);
  assert.match(html, /\.log-screen \.recording-state \.voice-visual\{position:absolute;z-index:0;inset:0;width:100%;height:100%;margin:0;pointer-events:none\}/);
  assert.match(html, /\.log-screen \.stop:after\{background:var\(--premium-dark\)\}/, 'stop glyph must remain visible over the white control');
  assert.match(html, /<svg class="voice-abstract-svg" viewBox="0 0 320 250" preserveAspectRatio="xMidYMid slice"/);
});

test('center plus action has an accessible name but no visible Log label', () => {
  const logTab = html.match(/<button class="tab log-tab"[^>]*aria-label="Log a dream"[\s\S]*?<\/button>/);
  assert.ok(logTab, 'accessible Log action is missing');
  assert.doesNotMatch(logTab[0], /<span class="tab-label">Log<\/span>/);
  assert.match(logTab[0], /<span class="plus-disc">/);
});
