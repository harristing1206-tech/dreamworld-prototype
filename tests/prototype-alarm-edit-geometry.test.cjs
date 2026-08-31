const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

test('alarm edit minus is inset with breathing room before the shifted card content', () => {
  const minusRule = html.match(/#alarmList\.editing \.edit-minus\{([^}]+)\}/);
  assert.ok(minusRule, 'alarm-specific edit-minus geometry missing');
  assert.match(minusRule[1], /left:12px/, 'alarm minus must be inset from the rounded card edge');

  const editRule = html.match(/#alarmList\.editing \.swipe-row \.swipe-main\{([^}]+)\}/);
  assert.ok(editRule, 'alarm-specific edit layout missing');
  assert.match(editRule[1], /width:calc\(100% - 48px\)/);
  assert.match(editRule[1], /translate3d\(48px,0,0\)/);

  const openRule = html.match(/#alarmList\.editing \.swipe-row\.actions-open \.swipe-main\{([^}]+)\}/);
  assert.ok(openRule, 'alarm edit/delete-open geometry missing');
  assert.match(openRule[1], /width:calc\(100% - 136px\)/);
  assert.match(openRule[1], /translate3d\(48px,0,0\)/);

  const circleLeft = 12;
  const circleWidth = 26;
  const contentStart = 48;
  assert.equal(contentStart - (circleLeft + circleWidth), 10, 'minus needs a 10px gap before card content');
});

test('alarm cards are excluded from the legacy bubble outline', () => {
  const outlineRule = html.match(/:root\[data-theme="light"\] :is\(([^)]*)\),:root\[data-theme="dark"\] :is\(([^)]*)\)\{outline:1px solid var\(--bubble-outline\)/);
  assert.ok(outlineRule, 'shared bubble outline rule missing');
  assert.doesNotMatch(outlineRule[1], /#alarmList \.alarm-row/);
  assert.doesNotMatch(outlineRule[2], /#alarmList \.alarm-row/);
});
