const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

test('dream logs glide into edit mode with the alarm timing curve', () => {
  assert.match(html, /\.swipe-main\{[^}]*transition:transform 240ms cubic-bezier\(\.22,\.61,\.36,1\),width 240ms cubic-bezier\(\.22,\.61,\.36,1\)/);
  assert.match(html, /\.history-swipe-row\{[^}]*display:grid;grid-template-columns:0 minmax\(0,1fr\)[^}]*transition:grid-template-columns 240ms cubic-bezier\(\.22,\.61,\.36,1\)/);
  assert.match(html, /#historyList\.editing \.history-swipe-row\{grid-template-columns:50px minmax\(0,1fr\)\}/);
  assert.match(html, /\.history-swipe-row \.edit-minus\{[^}]*grid-column:1;grid-row:1/);
  assert.match(html, /\.history-swipe-row \.swipe-main\{[^}]*grid-column:2;grid-row:1;width:100%;transform:none/);
  assert.match(html, /#historyList\.editing \.history-swipe-row \.swipe-main\{width:100%;transform:none\}/);
});
