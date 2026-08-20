const assert = require('node:assert/strict');
const { createTypewriterDialogue, paginateResponse } = require('../analysis-dialogue.js');

const response = 'The dream begins with a slow departure. Your friends leave one by one while you remain watching. Your grandfather appears young and asks whether you are sad. You answer that sometimes you are. He reassures you that people come and go. Only then does your grandmother appear, and grief and love arrive together.';
const pages = paginateResponse(response, { maxCharacters: 126 });
assert.ok(pages.length >= 3, 'a layered response should become several conversational pages');
assert.ok(pages.every(page => page.length <= 150), 'dialogue pages should remain readable on a phone');
assert.equal(pages.join(' ').replace(/\s+/g, ' '), response, 'pagination must preserve every word in order');
assert.match(pages[0], /slow departure/i);
assert.match(pages.at(-1), /grief and love/i);

const oversizedToken = 'x'.repeat(255);
const tokenPages = paginateResponse(oversizedToken, { maxCharacters: 100 });
assert.ok(tokenPages.every(page => page.length <= 100), 'unbroken tokens must respect the page limit');
assert.equal(tokenPages.join(''), oversizedToken);

const scheduled = [];
const cancelled = [];
const updates = [];
const dialogue = createTypewriterDialogue({
  pages,
  onUpdate: snapshot => updates.push(snapshot),
  schedule: callback => { scheduled.push(callback); return scheduled.length; },
  cancel: id => cancelled.push(id),
  reducedMotion: false
});

dialogue.start();
assert.equal(dialogue.snapshot().pageIndex, 0);
assert.equal(dialogue.snapshot().visibleText, '');
assert.equal(dialogue.snapshot().typing, true);
scheduled.shift()();
assert.equal(dialogue.snapshot().visibleText.length, 1, 'typing should reveal the response incrementally');

assert.equal(dialogue.activate(), 'revealed');
assert.equal(dialogue.snapshot().visibleText, pages[0], 'the first activation reveals only the current page');
assert.equal(dialogue.snapshot().typing, false);
assert.equal(dialogue.activate(), 'advanced');
assert.equal(dialogue.snapshot().pageIndex, 1);
assert.equal(dialogue.snapshot().visibleText, '', 'advancing starts the next page without exposing it all');
assert.equal(dialogue.snapshot().typing, true);

dialogue.destroy();
assert.ok(cancelled.length > 0, 'destroy should cancel pending character timers');

const reducedUpdates = [];
const reduced = createTypewriterDialogue({ pages, onUpdate: state => reducedUpdates.push(state), reducedMotion: true });
reduced.start();
assert.equal(reduced.snapshot().visibleText, pages[0], 'reduced motion should reveal the current page immediately');
assert.equal(reduced.snapshot().typing, false);
assert.equal(reduced.activate(), 'advanced');
assert.equal(reduced.snapshot().visibleText, pages[1], 'reduced motion still preserves page-by-page conversation');

console.log('analysis dialogue pagination and typewriter tests passed');