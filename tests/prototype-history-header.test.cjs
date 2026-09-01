const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

test('History compact orientation leads from the top-left while Edit anchors top-right', () => {
  assert.match(html, /\.home-header\{position:relative;padding-top:4px\}/);
  assert.match(html, /\.home-header \.list-toolbar\{position:absolute;right:0;top:0;width:auto;height:44px\}/);
  assert.match(html, /\.list-edit\{min-width:44px;min-height:44px/);
  assert.match(html, /\.list-edit\[aria-pressed="true"\]\{width:44px;min-width:44px/);
  assert.match(html, /<header class="home-header">[\s\S]*?<button class="list-edit" id="editDreams"[^>]*>Edit<\/button>[\s\S]*?<h1 class="tab-heading">Dream Logs<\/h1>[\s\S]*?<\/header>/);
});
