const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');
const document = new JSDOM(html).window.document;

const expected = {
  snooze: { title: 'Default snooze', detail: 'Native setting unavailable in this prototype', status: 'Prototype' },
  transcription: { title: 'Transcription', detail: 'Private whisper.cpp server', status: 'Private' },
  recordings: { title: 'Dream recordings', detail: 'Review or delete in History', status: 'History' }
};

test('static Profile settings do not pretend to be navigable', () => {
  for (const [key, copy] of Object.entries(expected)) {
    const row = document.querySelector(`[data-setting="${key}"]`);
    assert.ok(row, `missing ${key} setting row`);
    assert.equal(row.tagName, 'DIV');
    assert.equal(row.hasAttribute('role'), false);
    assert.equal(row.hasAttribute('tabindex'), false);
    assert.equal(row.hasAttribute('onclick'), false);
    assert.equal(row.classList.contains('setting-button'), false, `${key} must not use interactive row styling`);
    assert.equal(row.querySelector('a,button,[role="button"],[tabindex]'), null, `${key} must not contain an interactive or focusable descendant`);
    assert.ok([...row.querySelectorAll('*')].every(element => element.tabIndex < 0), `${key} descendants must stay outside the tab order`);
    assert.equal(row.querySelector('.chevron'), null, `${key} must not show a navigation chevron`);
    assert.equal(row.querySelector('.setting-copy strong').textContent.trim(), copy.title);
    assert.equal(row.querySelector('.setting-copy span').textContent.trim(), copy.detail);
    assert.equal(row.querySelector('.status').textContent.trim(), copy.status);
  }
});

test('actionable Profile settings remain actual buttons', () => {
  const appearance = document.getElementById('appearanceSetting');
  assert.equal(appearance.tagName, 'BUTTON');
  assert.ok(appearance.classList.contains('setting-button'));
});
