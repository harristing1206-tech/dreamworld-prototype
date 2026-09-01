const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

test('History uses one clear title while Edit anchors top-left', () => {
  assert.match(html, /\.alarm-head,\.home-header\{position:relative;padding-top:52px\}/);
  assert.match(html, /\.alarm-head \.list-toolbar,\.home-header \.list-toolbar\{position:absolute;left:0;right:0;top:0;width:auto;height:44px\}/);
  assert.match(html, /\.list-edit\{min-width:44px;min-height:44px/);
  assert.match(html, /\.list-edit\[aria-pressed="true"\]\{width:44px;min-width:44px/);
  assert.match(html, /<header class="home-header">[\s\S]*?<button class="list-edit header-action" id="editDreams"[^>]*>Edit<\/button><span class="rail-meta rail-meta-right" id="historyRailCount">[\s\S]*?<\/span>[\s\S]*?<h1 class="greeting">Dream journal\.<\/h1>[\s\S]*?<\/header>/);
  assert.doesNotMatch(html, />Your private archive</);
});
