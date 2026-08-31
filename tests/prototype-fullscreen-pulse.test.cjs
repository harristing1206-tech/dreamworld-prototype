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
  assert.match(html, /<canvas class="voice-field-canvas" id="voiceCanvas" aria-hidden="true"><\/canvas>/);
  assert.match(html, /\.voice-field-canvas\{display:block;width:100%;height:100%\}/);
  assert.doesNotMatch(html, /voice-abstract-svg|voice-abstract-layer/);
});

test('Canvas field uses persistent particles and frame-rate-independent envelopes', () => {
  assert.match(html, /const VOICE_PARTICLE_COUNT=84/);
  assert.match(html, /const createVoiceParticles=\(\)=>Array\.from\(\{length:VOICE_PARTICLE_COUNT\}/);
  assert.match(html, /const ensureVoiceCanvasSize=/);
  assert.match(html, /const drawVoiceField=/);
  assert.match(html, /Math\.min\(2,window\.devicePixelRatio\|\|1\)/);
  assert.match(html, /const envelopeStep=\(current,target,timeConstant,deltaTime\)=>current\+\(target-current\)\*\(1-Math\.exp\(-deltaTime\/timeConstant\)\)/);
  assert.match(html, /const VOICE_RING_TAU=\[\.06,\.11,\.18,\.26\]/);
  assert.match(html, /const drawStaticVoiceField=/);
});

test('center plus action has an accessible name but no visible Log label', () => {
  const logTab = html.match(/<button class="tab log-tab"[^>]*aria-label="Log a dream"[\s\S]*?<\/button>/);
  assert.ok(logTab, 'accessible Log action is missing');
  assert.doesNotMatch(logTab[0], /<span class="tab-label">Log<\/span>/);
  assert.match(logTab[0], /<span class="plus-disc">/);
});
