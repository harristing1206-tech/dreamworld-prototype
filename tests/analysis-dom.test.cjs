const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { JSDOM, ResourceLoader, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
let server;
let origin;

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.json') || file.endsWith('.webmanifest')) return 'application/json; charset=utf-8';
  if (file.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

before(async () => {
  server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const relative = pathname === '/' ? 'world.html' : pathname.replace(/^\/+/, '');
    const file = path.resolve(root, relative);
    if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, { 'content-type': contentType(file) });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
});

function createStorage(values = new Map()) {
  return {
    values,
    failSetForPrefix: '',
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) {
      if (this.failSetForPrefix && String(key).startsWith(this.failSetForPrefix)) throw new Error('blocked storage');
      values.set(String(key), String(value));
    },
    removeItem(key) { values.delete(String(key)); }
  };
}

function storedDreams(storage) {
  return [...storage.values.entries()]
    .filter(([key]) => key.startsWith('dreamworld:dream:'))
    .map(([, value]) => JSON.parse(value))
    .sort((left, right) => Date.parse(left.loggedAt) - Date.parse(right.loggedAt));
}

class PrivateOriginResourceLoader extends ResourceLoader {
  fetch(url) {
    const parsed = new URL(url);
    const relative = parsed.pathname.replace(/^\/dreamworld\//, '').replace(/^\/+/, '');
    const file = path.resolve(root, relative);
    if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
    return Promise.resolve(fs.readFileSync(file));
  }
}

async function loadPage(storage, query = '?analysis=preview', { reducedMotion = true, preparationTimings = [8, 8, 8], fetchImpl = null, privateOrigin = false } = {}) {
  const virtualConsole = new VirtualConsole();
  const errors = [];
  virtualConsole.on('jsdomError', error => errors.push(error));
  const options = {
    resources: privateOrigin ? new PrivateOriginResourceLoader() : 'usable',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      Object.defineProperty(window, 'localStorage', { value: storage });
      Object.defineProperty(window.crypto, 'subtle', { value: require('node:crypto').webcrypto.subtle });
      window.TextEncoder = require('node:util').TextEncoder;
      if (fetchImpl) window.fetch = fetchImpl;
      window.__DREAMWORLD_TEST_TIMINGS__ = { analysisPreparation: preparationTimings };
      window.matchMedia = mediaQuery => ({ matches: reducedMotion && mediaQuery.includes('prefers-reduced-motion'), addListener() {}, removeListener() {} });
      window.HTMLElement.prototype.scrollIntoView = function () {};
    }
  };
  const dom = privateOrigin
    ? new JSDOM(fs.readFileSync(path.join(root, 'world.html'), 'utf8'), { ...options, url: `https://hermes-vps.taildf1e1e.ts.net/dreamworld/world.html${query}` })
    : await JSDOM.fromURL(`${origin}/world.html${query}`, options);
  await new Promise(resolve => dom.window.addEventListener('load', () => setTimeout(resolve, 30), { once: true }));
  assert.deepEqual(errors, [], `page emitted jsdom errors: ${errors.map(error => error.message).join('; ')}`);
  return dom;
}

test('primary navigation exposes one current page without invalid button ARIA', async () => {
  const dom = await loadPage(createStorage(), '');
  try {
    const { document } = dom.window;
    const buttons = [...document.querySelectorAll('.nav-button')];
    assert.equal(buttons.some(button => button.hasAttribute('aria-selected')), false);
    assert.equal(document.querySelector('.nav-button[aria-current="page"]')?.dataset.go, 'world');
    document.querySelector('.nav-button[data-go="dreams"]').click();
    assert.equal(document.querySelector('.nav-button[aria-current="page"]')?.dataset.go, 'dreams');
    assert.equal(document.querySelectorAll('.nav-button[aria-current="page"]').length, 1);
  } finally {
    dom.window.close();
  }
});

test('persisted alarm IDs cannot create executable markup', async () => {
  const hostileID = '\"><img id="alarmXssProbe" src="x" onerror="window.__alarmXss = true">';
  const values = new Map([
    ['dreamworld:alarms', JSON.stringify([{ id: hostileID, time: '07:30', days: ['Mon'], enabled: true }])]
  ]);
  const storage = createStorage(values);
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    assert.equal(document.getElementById('alarmXssProbe'), null, 'persisted alarm data must not become HTML');
    assert.equal(document.querySelector('[onerror]'), null, 'no executable event attribute may be created');
    assert.equal(dom.window.__alarmXss, undefined);
    const row = document.querySelector('.alarm-row');
    assert.ok(row);
    assert.match(row.dataset.alarmId, /^[a-z0-9-]{1,80}$/i, 'invalid persisted IDs are normalized to inert identifiers');
    const persisted = JSON.parse(storage.values.get('dreamworld:alarms'));
    assert.match(persisted[0].id, /^[a-z0-9-]{1,80}$/i);
    assert.equal(persisted[0].time, '07:30', 'sanitizing an ID preserves the valid alarm');
  } finally {
    dom.window.close();
  }
});

test('the Listener visibly names and quotes the clarification target before asking for an answer', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'I saw an older woman holding a silver key on a train. Later, the silver key in my pocket suddenly became very hot when my reflection asked me to follow.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();

    const question = document.getElementById('analysisInterviewQuestion');
    assert.ok(question, 'the interview needs a dedicated visible question element');
    assert.equal(question.hidden, false);
    assert.notEqual(dom.window.getComputedStyle(question).display, 'none');
    assert.match(question.textContent, /silver key in my pocket suddenly became very hot/i);
    assert.match(question.textContent, /what did the key bring up for you personally/i);
    assert.equal(document.getElementById('analysisDialogueAdvance').hidden, true, 'the hidden paginated-response button is not the question container');
    assert.equal(document.getElementById('analysisInterviewAnswer').placeholder, 'Write your answer…');
  } finally {
    dom.window.close();
  }
});

test('analysis flow shows one character response and preserves deletion recovery', async () => {
  const storage = createStorage();
  let dom = await loadPage(storage);
  let originalResponse;
  try {
    const document = dom.window.document;
    assert.equal(dom.window.getComputedStyle(document.getElementById('latestDreamRow')).display, 'none');
    assert.equal(document.getElementById('analysisTranscript').textContent, 'I crossed a dark ocean toward a house with every window lit. When I reached the door, I realized the house was moving farther away.');
    assert.equal(document.getElementById('analysisCharacterName').textContent, 'The Listener');
    originalResponse = document.getElementById('analysisCharacterResponse').textContent;
    assert.match(originalResponse, /water|home|house|belong/i);
    assert.equal(document.querySelectorAll('.character-response').length, 1);

    const key = 'dreamworld:analysis:ocean-house';
    assert.equal(storage.values.has(key), true);
    const deleteButton = document.getElementById('analysisDeleteReflection');
    deleteButton.click();
    assert.equal(storage.values.has(key), true, 'first activation only arms deletion');
    assert.match(deleteButton.textContent, /Delete permanently/);
    assert.match(document.getElementById('analysisStorageStatus').textContent, /Tap again when ready/i);
    deleteButton.click();
    const deletedState = JSON.parse(storage.values.get(key));
    assert.equal(deletedState.deleted, true, 'second activation removes response content and leaves only a durable deletion marker');
    assert.equal(Object.hasOwn(deletedState, 'characterResponse'), false);
    assert.match(document.getElementById('analysisCharacterResponse').textContent, /response was deleted/i);
    const undo = document.getElementById('analysisUndoDelete');
    assert.equal(undo.hidden, false);
    assert.equal(document.getElementById('analysisControlsPanel').hidden, false, 'Undo must remain inside a visible controls dialog');
    assert.match(undo.textContent, /Ocean House/);
    assert.equal(document.activeElement, undo, 'Undo receives focus');
    assert.equal(deleteButton.disabled, true, 'another deletion cannot replace the pending Undo');
    const keepUndo = document.getElementById('analysisKeepUndo');
    const finishDeletion = document.getElementById('analysisFinishDeletion');
    assert.equal(keepUndo.hidden, false);
    keepUndo.click();
    assert.equal(finishDeletion.hidden, false, 'Undo can be kept available without a fixed deadline');
    assert.match(document.getElementById('analysisStorageStatus').textContent, /will remain available/i);

    document.querySelector('[data-go="capture"]').click();
    const pendingInput = document.getElementById('dreamTextInput');
    pendingInput.value = 'A second dream waiting for the recovery window.';
    pendingInput.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();
    assert.equal(storage.values.has('dreamworld:lastDream'), false, 'pending Undo prevents replacement of the only real-dream record');
    assert.equal(document.getElementById('dialogueStatus').textContent, 'Resolve pending deletion first');
    assert.equal(pendingInput.value, 'A second dream waiting for the recovery window.');

    document.querySelector('[data-go="dreams"]').click();
    document.querySelector('[data-open-analysis="quiet-gate"]').click();
    assert.equal(document.getElementById('analysisTitle').textContent, 'The Quiet Gate');
    assert.match(undo.textContent, /Ocean House/, 'cross-entry Undo names the deleted reflection');
    assert.match(document.getElementById('analysisStorageStatus').textContent, /Ocean House/);
    assert.equal(deleteButton.disabled, true);

    undo.click();
    assert.equal(storage.values.has(key), true, 'undo restores the response');
    assert.equal(document.getElementById('analysisTitle').textContent, 'Ocean House');
    assert.equal(document.getElementById('analysisCharacterResponse').textContent, originalResponse);
    assert.equal(deleteButton.disabled, false);
    assert.equal(document.activeElement, deleteButton, 'focus returns to the delete control after restoration');
  } finally {
    dom.window.close();
  }

  dom = await loadPage(storage);
  try {
    const document = dom.window.document;
    assert.equal(document.getElementById('analysisCharacterResponse').textContent, originalResponse);
    assert.equal(document.querySelectorAll('[data-analysis-lens]').length, 0);
  } finally {
    dom.window.close();
  }
});

test('game dialogue types one page, reveals it, then advances without exposing the whole response', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage, '?analysis=preview', { reducedMotion: false });
  try {
    const document = dom.window.document;
    const card = document.getElementById('analysisCharacterCard');
    const text = document.getElementById('analysisCharacterResponse');
    const advance = document.getElementById('analysisDialogueAdvance');
    const fullOpen = document.getElementById('analysisFullOpen');
    const stored = JSON.parse(storage.values.get('dreamworld:analysis:ocean-house'));
    assert.equal(card.dataset.typing, 'true');
    assert.equal(fullOpen.hidden, true);
    assert.ok(text.textContent.length < stored.characterResponse.text.length, 'the full reflection must not appear at once');
    assert.match(document.getElementById('analysisDialoguePage').textContent, /^1 \/ [2-9]/);

    advance.click();
    assert.equal(card.dataset.typing, 'false');
    const firstPage = text.textContent;
    assert.ok(firstPage.length > 80);
    assert.ok(firstPage.length < stored.characterResponse.text.length, 'reveal shows the current page, not every page');
    assert.equal(document.getElementById('analysisDialogueHint').textContent, 'Tap to continue');

    advance.click();
    assert.equal(card.dataset.typing, 'true');
    assert.match(document.getElementById('analysisDialoguePage').textContent, /^2 \/ /);
    assert.ok(text.textContent.length < firstPage.length, 'the next page begins typing from an empty dialogue field');

    advance.click();
    assert.equal(card.dataset.typing, 'false');
    assert.equal(card.dataset.complete, 'true');
    assert.equal(document.getElementById('analysisDialogueHint').textContent, 'Reflection complete');
    assert.equal(advance.disabled, true, 'the completed dialogue target must not remain actionable');
    assert.equal(fullOpen.hidden, false, 'the full-analysis option appears only after dialogue completion');
    const finalText = text.textContent;
    advance.click();
    assert.equal(text.textContent, finalText, 'tapping a completed reflection must remain a no-op');

    fullOpen.click();
    assert.equal(document.getElementById('analysisFullPanel').hidden, false);
    assert.equal(document.getElementById('analysisFullText').textContent, stored.characterResponse.text, 'full analysis uses the canonical complete response');
    assert.equal(document.activeElement, document.getElementById('analysisFullClose'));
    document.getElementById('analysisFullClose').click();
    assert.equal(document.getElementById('analysisFullPanel').hidden, true);
    assert.equal(document.activeElement, fullOpen);

    const transcriptToggle = document.getElementById('analysisTranscriptToggle');
    transcriptToggle.click();
    assert.equal(document.getElementById('analysisTranscriptPanel').hidden, false);
    assert.equal(document.activeElement, document.getElementById('analysisTranscriptClose'));
    assert.equal(document.querySelector('.analysis-hud').inert, true);
    assert.equal(document.getElementById('analysisCharacterCard').inert, true);
    document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    assert.equal(document.activeElement, document.getElementById('analysisTranscriptClose'), 'focus stays inside the transcript dialog');
    document.getElementById('analysisTranscriptClose').click();
    assert.equal(document.getElementById('analysisTranscriptPanel').hidden, true);
    assert.equal(document.querySelector('.analysis-hud').inert, false);
    assert.equal(document.activeElement, transcriptToggle);
  } finally {
    dom.window.close();
  }
});

test('analysis dreamscape changes with transcript evidence while remaining stable per dream', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage);
  try {
    const document = dom.window.document;
    const view = document.getElementById('analysisView');
    assert.equal(view.dataset.scene, 'tide');
    const oceanSky = view.style.getPropertyValue('--scene-sky-top');
    const oceanSignature = view.dataset.sceneSignature;
    assert.ok(oceanSky);
    document.querySelector('[data-go="dreams"]').click();
    document.querySelector('[data-open-analysis="quiet-gate"]').click();
    assert.equal(view.dataset.scene, 'passage');
    assert.notEqual(view.style.getPropertyValue('--scene-sky-top'), oceanSky);
    assert.notEqual(view.dataset.sceneSignature, oceanSignature);
  } finally {
    dom.window.close();
  }
});

test('unclear transcript is preserved for editing without creating a dream or analysis', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'erdcyvubibkuvkugvt';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();

    assert.deepEqual(storedDreams(storage), [], 'unclear text must not be stored as a dream');
    assert.match(document.getElementById('dialogueStatus').textContent, /needs.*clear|not enough clear/i);
    assert.match(document.getElementById('dialogueText').textContent, /no analysis|clear dream language/i);
    assert.equal(document.getElementById('dialogueFinish').textContent, 'Edit transcript');

    document.getElementById('dialogueFinish').click();
    assert.equal(document.getElementById('dialogueOverlay').classList.contains('visible'), false);
    assert.equal(input.value, 'erdcyvubibkuvkugvt', 'the questionable transcript remains available for correction');
    assert.equal(document.activeElement, input);
    assert.match(document.getElementById('captureError').textContent, /review|clear/i);

    input.value = 'I fell from a bridge into the ocean.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();
    assert.equal(storedDreams(storage).length, 1, 'a corrected meaningful transcript can be logged normally');
  } finally {
    dom.window.close();
  }
});

test('saved transcription noise opens without generating or restoring an analysis', async () => {
  const noiseRecord = {
    schemaVersion: 1,
    id: 'dream-noise',
    loggedAt: '2026-08-21T00:00:00.000Z',
    title: 'Unclear recording',
    transcript: 'erdcyvubibkuvkugvt',
    source: 'browser-local-whisper',
    model: 'Xenova/whisper-tiny'
  };
  const storage = createStorage(new Map([
    ['dreamworld:dream:dream-noise', JSON.stringify(noiseRecord)],
    ['dreamworld:lastDream', JSON.stringify(noiseRecord)]
  ]));
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-open-analysis="latest"]').click();
    assert.equal(document.getElementById('analysisView').classList.contains('active'), true);
    assert.match(document.getElementById('analysisCharacterResponse').textContent, /clear dream language|couldn.t find enough/i);
    assert.equal(document.getElementById('analysisFullOpen').hidden, true);
    assert.equal(storage.values.has('dreamworld:analysis:dream-noise'), false, 'noise must not gain a saved analysis state');
  } finally {
    dom.window.close();
  }
});

test('plausible but unsupported content is saved and clarified without a fabricated generic analysis', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'blarg snorf glibble wobble';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 250));
    assert.equal([...storage.values.keys()].filter(key => key.startsWith('dreamworld:dream:')).length, 1, 'plausible text remains saved for later review');
    assert.equal([...storage.values.keys()].filter(key => key.startsWith('dreamworld:analysis:')).length, 0, 'unsupported content must not gain analysis state');
    assert.equal(document.getElementById('analysisView').classList.contains('active'), true);
    assert.match(document.getElementById('analysisInterviewQuestion').textContent, /clarify this moment|most important/i);
    assert.equal(document.getElementById('analysisInterviewForm').hidden, false);
    assert.equal(document.getElementById('analysisFullOpen').hidden, true);
  } finally {
    dom.window.close();
  }
});

test('deleted legacy noise cannot expose or execute regeneration', async () => {
  const noiseRecord = {
    schemaVersion: 1,
    id: 'dream-noise-deleted',
    loggedAt: '2026-08-21T00:00:00.000Z',
    title: 'Unclear recording',
    transcript: 'erdcyvubibkuvkugvt',
    source: 'browser-local-whisper'
  };
  const storage = createStorage(new Map([
    ['dreamworld:dream:dream-noise-deleted', JSON.stringify(noiseRecord)],
    ['dreamworld:lastDream', JSON.stringify(noiseRecord)],
    ['dreamworld:analysis:dream-noise-deleted', JSON.stringify({ schemaVersion: 1, dreamID: 'dream-noise-deleted', deleted: true, deletedAt: '2026-08-21T00:01:00.000Z' })]
  ]));
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-open-analysis="latest"]').click();
    assert.equal(document.getElementById('analysisRegenerateResponse').hidden, true);
    document.getElementById('analysisRegenerateResponse').click();
    assert.match(document.getElementById('analysisCharacterResponse').textContent, /clear dream language|couldn.t find enough/i);
    assert.equal(storage.values.get('dreamworld:analysis:dream-noise-deleted'), JSON.stringify({ schemaVersion: 1, dreamID: 'dream-noise-deleted', deleted: true, deletedAt: '2026-08-21T00:01:00.000Z' }));
  } finally {
    dom.window.close();
  }
});

test('deleted plausible but unsupported content may restart a personal interview without regenerating analysis', async () => {
  const record = {
    schemaVersion: 1,
    id: 'dream-unsupported-deleted',
    loggedAt: '2026-08-21T00:00:00.000Z',
    title: 'Unclear scene',
    transcript: 'blarg snorf glibble wobble',
    source: 'keyboard-text-unverified-provider'
  };
  const tombstone = { schemaVersion: 1, dreamID: record.id, deleted: true, deletedAt: '2026-08-21T00:01:00.000Z' };
  const storage = createStorage(new Map([
    [`dreamworld:dream:${record.id}`, JSON.stringify(record)],
    ['dreamworld:lastDream', JSON.stringify(record)],
    [`dreamworld:analysis:${record.id}`, JSON.stringify(tombstone)]
  ]));
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-open-analysis="latest"]').click();
    const regenerate = document.getElementById('analysisRegenerateResponse');
    assert.equal(regenerate.hidden, false, 'unfamiliar but plausible language must not be permanently barred by an English-only gate');
    regenerate.click();
    assert.equal(document.getElementById('analysisInterviewForm').hidden, false);
    assert.match(document.getElementById('analysisInterviewQuestion').textContent, /clarify this moment|most important/i);
    assert.equal(storage.values.has(`dreamworld:analysis:${record.id}`), false, 'clearing the tombstone starts an interview but does not fabricate a response');
    assert.equal(storage.values.has(`dreamworld:interview:${record.id}`), true, 'the empty local interview is durably recoverable');
  } finally {
    dom.window.close();
  }
});

test('deleted personal reflection restarts the interview instead of regenerating without answers', async () => {
  const record = {
    schemaVersion: 1,
    id: 'dream-personal-deleted',
    loggedAt: '2026-08-21T00:00:00.000Z',
    title: 'Road dream',
    transcript: 'I drove a red car through my old neighborhood and felt nervous when it stopped.',
    source: 'keyboard-text-unverified-provider'
  };
  const analysisKey = `dreamworld:analysis:${record.id}`;
  const storage = createStorage(new Map([
    [`dreamworld:dream:${record.id}`, JSON.stringify(record)],
    ['dreamworld:lastDream', JSON.stringify(record)],
    [analysisKey, JSON.stringify({ schemaVersion: 1, dreamID: record.id, deleted: true, deletedAt: '2026-08-21T00:01:00.000Z' })]
  ]));
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-open-analysis="latest"]').click();
    const regenerate = document.getElementById('analysisRegenerateResponse');
    assert.equal(regenerate.hidden, false);
    regenerate.click();
    assert.equal(document.getElementById('analysisInterviewForm').hidden, false);
    assert.match(document.getElementById('analysisInterviewQuestion').textContent, /car/i);
    assert.equal(storage.values.has(analysisKey), false, 'no replacement response exists before new answers');
  } finally {
    dom.window.close();
  }
});

test('durable capture writes one atomic dream record and clears only after success', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'I crossed a dark ocean toward a house.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();

    assert.equal(document.getElementById('analysisPreparation').hidden, true, 'preparation waits until the user has answered The Listener');
    assert.equal(document.getElementById('analysisView').classList.contains('active'), true, 'durable logging enters the Listener interview');
    assert.equal(document.getElementById('analysisInterviewForm').hidden, false);

    const record = JSON.parse(storage.values.get('dreamworld:lastDream'));
    assert.equal(record.schemaVersion, 1);
    assert.match(record.id, /^[a-z0-9-]+$/i);
    assert.equal(record.transcript, 'I crossed a dark ocean toward a house.');
    assert.equal(record.source, 'keyboard-text-unverified-provider');
    assert.equal(storage.values.has(`dreamworld:dream:${record.id}`), true);
    assert.doesNotMatch(document.getElementById('latestDreamMeta').textContent, /Open page only/);
    assert.equal(document.getElementById('captureState').textContent, 'Dream logged');
    assert.equal(input.value, '');

    const interviewAnswer = document.getElementById('analysisInterviewAnswer');
    interviewAnswer.value = 'It feels like trying to reach a place that keeps moving away.';
    interviewAnswer.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('analysisInterviewSubmit').click();
    document.getElementById('analysisInterviewFinish').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 250));
    document.getElementById('analysisLocalFallback').click();
    assert.equal(document.getElementById('analysisView').classList.contains('active'), true, 'successful interview routes to the response after preparation');
    assert.equal(document.getElementById('analysisTranscript').textContent, record.transcript);
    const firstResponse = document.getElementById('analysisCharacterResponse').textContent;
    assert.ok(firstResponse.length > 80);
    const firstKey = `dreamworld:analysis:${record.id}`;
    assert.equal(storage.values.has(firstKey), true);
    const firstFullResponse = JSON.parse(storage.values.get(firstKey)).characterResponse.text;

    document.querySelector('[data-go="capture"]').click();
    input.value = record.transcript;
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();
    interviewAnswer.value = 'It still feels connected to something moving out of reach.';
    interviewAnswer.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('analysisInterviewSubmit').click();
    document.getElementById('analysisInterviewFinish').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 250));
    document.getElementById('analysisLocalFallback').click();
    const secondRecord = JSON.parse(storage.values.get('dreamworld:lastDream'));
    const secondResponse = document.getElementById('analysisCharacterResponse').textContent;
    const secondStoredAnalysis = JSON.parse(storage.values.get(`dreamworld:analysis:${secondRecord.id}`));
    const secondFullResponse = secondStoredAnalysis.characterResponse.text;
    assert.notEqual(secondRecord.id, record.id, 'separate logs receive separate identities even when their words match');
    assert.notEqual(secondFullResponse, firstFullResponse, 'different personal answers should create different complete responses for identical transcripts');
    assert.match(secondFullResponse, /Across your saved history/i, 'a user-associated detail recurring in an earlier immutable record should be named without decoding it');
    assert.match(secondFullResponse, /does not give it a fixed meaning/i);
    assert.equal(secondStoredAnalysis.methodology.claimStatus, 'interpretive-hypothesis');
    assert.equal(secondStoredAnalysis.methodology.longitudinal.recurrences[0].dreamID, record.id);
    assert.match(document.getElementById('analysisMethodDisclosure').textContent, /Context-first Jungian reflection/i);
    assert.match(document.getElementById('analysisMethodDisclosure').textContent, /hypothesis/i);
    assert.match(document.getElementById('analysisMethodSources').textContent, /CW 7/i);
    const library = storedDreams(storage);
    assert.deepEqual(library.map(item => item.id), [record.id, secondRecord.id]);
    const historicalRow = document.querySelector(`[data-open-analysis="${record.id}"]`);
    assert.ok(historicalRow, 'the previous real dream remains reachable in Dreams');
    historicalRow.click();
    assert.equal(document.getElementById('analysisCharacterResponse').textContent, firstResponse);
    document.getElementById('latestDreamRow').click();
    assert.equal(document.getElementById('analysisCharacterResponse').textContent, secondResponse, 'each record restores the response grounded in its own answers');

    const secondKey = `dreamworld:analysis:${secondRecord.id}`;
    const secondInterviewKey = `dreamworld:interview:${secondRecord.id}`;
    assert.equal(storage.values.has(secondKey), true);
    assert.equal(storage.values.has(secondInterviewKey), true);
    const realDreamDelete = document.getElementById('analysisDeleteReflection');
    realDreamDelete.click();
    realDreamDelete.click();
    assert.equal(JSON.parse(storage.values.get(secondKey)).deleted, true);
    assert.equal(storage.values.has(secondInterviewKey), false, 'deleting a personalized reflection removes its interview answers');
    document.getElementById('analysisUndoDelete').click();
    assert.equal(storage.values.has(secondKey), true);
    assert.equal(storage.values.has(secondInterviewKey), true, 'Undo restores interview evidence with the reflection');
    assert.equal(document.getElementById('analysisCharacterResponse').textContent, secondResponse);
  } finally {
    dom.window.close();
  }
});

test('durable logging enters a one-question-at-a-time personal interview before reflection', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage, '', { reducedMotion: true, preparationTimings: [8, 8, 8] });
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const transcript = document.getElementById('dreamTextInput');
    transcript.value = 'I drove a red car through my old neighborhood. A black hat sat on the passenger seat. I felt nervous when the car stopped.';
    transcript.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();

    const dream = JSON.parse(storage.values.get('dreamworld:lastDream'));
    const interviewKey = `dreamworld:interview:${dream.id}`;
    const analysisKey = `dreamworld:analysis:${dream.id}`;
    const form = document.getElementById('analysisInterviewForm');
    const answer = document.getElementById('analysisInterviewAnswer');
    const submit = document.getElementById('analysisInterviewSubmit');

    assert.equal(document.getElementById('analysisView').classList.contains('active'), true, 'logging should enter The Listener encounter');
    assert.equal(document.getElementById('analysisPreparation').hidden, true, 'preparation belongs after the questions, before reflection');
    assert.equal(form.hidden, false, 'the answer control should be visible for the current question');
    assert.match(document.getElementById('analysisInterviewQuestion').textContent, /car/i);
    assert.match(document.getElementById('analysisInterviewQuestion').textContent, /to you|personally/i);
    assert.equal(storage.values.has(analysisKey), false, 'no interpretation may be created before answers');
    assert.equal(document.activeElement, answer, 'keyboard focus should move to the answer field');

    answer.value = 'It reminds me of learning to drive with my older sister.';
    answer.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    submit.click();
    assert.match(document.getElementById('analysisInterviewQuestion').textContent, /learning to drive with my older sister/i);
    assert.match(document.getElementById('analysisInterviewQuestion').textContent, /hat/i);
    assert.equal(JSON.parse(storage.values.get(interviewKey)).answers.length, 1);
    assert.equal(storage.values.has(analysisKey), false);

    answer.value = "It felt out of place, like I wasn't ready.";
    answer.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    submit.click();
    assert.match(document.getElementById('analysisInterviewQuestion').textContent, /feeling|right now|life/i);

    answer.value = 'I am nervous about making a decision on my own.';
    answer.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    submit.click();
    assert.equal(document.getElementById('analysisPreparation').hidden, false, 'completed questions trigger the reflection preparation pause');
    assert.equal(storage.values.has(analysisKey), false, 'the response remains absent during preparation');

    await new Promise(resolve => dom.window.setTimeout(resolve, 45));
    assert.equal(document.getElementById('analysisPreparation').hidden, true);
    assert.equal(form.hidden, true);
    assert.equal(document.getElementById('analysisAIChoice').hidden, false, 'completed answers pause for explicit AI consent or local fallback');
    document.getElementById('analysisLocalFallback').click();
    assert.equal(storage.values.has(analysisKey), true);
    const savedAnalysis = JSON.parse(storage.values.get(analysisKey));
    assert.equal(savedAnalysis.evidence.associations.length, 3);
    assert.match(savedAnalysis.characterResponse.text, /learning to drive with my older sister/i);
    assert.match(savedAnalysis.characterResponse.text, /making a decision on my own/i);
  } finally {
    dom.window.close();
  }
});

test('private GBrain analysis is opt-in, evidence-bound, attributed, cached, and remotely deletable', async () => {
  const storage = createStorage();
  const calls = [];
  const fetchImpl = async (url, options) => {
    const request = JSON.parse(options.body);
    calls.push({ url, request });
    if (url.endsWith('/delete')) {
      return { ok: true, status: 200, json: async () => ({ deleted: true, operationID: request.operationID }) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        schemaVersion: 1,
        operationID: request.operationID,
        dreamID: request.dreamID,
        transcriptFingerprint: request.transcriptFingerprint,
        evidenceFingerprint: request.evidenceFingerprint,
        analysis: 'Your association with responsibility changes how the key can be approached. The dream places it beside a staircase and pairs it with fear, so one tentative reading is that a new capacity or obligation is present while the next step still feels consequential. This follows your own association rather than assigning the key a universal meaning.',
        closingQuestion: 'Where does responsibility currently feel like both access and a difficult next step?',
        evidence: [{
          quote: 'I found a key beside a staircase and felt afraid.',
          observation: 'The key, staircase, and fear occur in the same remembered moment.',
          hypothesis: 'The scene may hold tension between gaining responsibility and taking the next step.'
        }],
        provenance: {
          service: 'dreamworld-gbrain', model: 'gpt-5.6-sol', gbrainSource: 'dreamworld',
          gbrainSlug: `dreams/dreamworld/${request.dreamID}`, storedInGBrain: true,
          generatedAt: '2026-08-22T08:00:00Z'
        }
      })
    };
  };
  const dom = await loadPage(storage, '', { reducedMotion: true, preparationTimings: [8, 8, 8], fetchImpl, privateOrigin: true });
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'I found a key beside a staircase and felt afraid.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();
    const dream = JSON.parse(storage.values.get('dreamworld:lastDream'));
    const answer = document.getElementById('analysisInterviewAnswer');
    answer.value = 'The key feels like responsibility.';
    answer.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('analysisInterviewSubmit').click();
    document.getElementById('analysisInterviewFinish').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 50));

    assert.equal(calls.length, 0, 'opening the choice must not transmit dream data');
    assert.equal(document.getElementById('analysisAIChoice').hidden, false);
    assert.match(document.querySelector('.analysis-ai-disclosure').textContent, /Nothing is sent until you choose it/i);
    assert.equal(storage.values.has(`dreamworld:gbrain-analysis:${dream.id}`), false);

    document.getElementById('analysisGBrainStart').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 40));
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/v1\/analyze$/);
    assert.equal(calls[0].request.associations[0].answer, 'The key feels like responsibility.');
    assert.match(document.getElementById('analysisFullText').textContent, /tentative reading/i);
    assert.match(document.getElementById('analysisGBrainProvenance').textContent, /gpt-5\.6-sol.*private GBrain source dreamworld/i);
    assert.equal(document.getElementById('analysisDeleteGBrain').hidden, false);
    assert.equal(document.getElementById('analysisDeleteReflection').hidden, true);
    assert.equal(storage.values.has(`dreamworld:gbrain-analysis:${dream.id}`), true);

    const remove = document.getElementById('analysisDeleteGBrain');
    remove.click();
    assert.match(remove.textContent, /Tap again/i);
    storage.failSetForPrefix = 'dreamworld:gbrain-delete:';
    remove.click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 20));
    assert.equal(calls.length, 1, 'blocked pending-operation persistence sends no deletion request');
    assert.match(document.getElementById('analysisStorageStatus').textContent, /No deletion was sent/i);
    storage.failSetForPrefix = '';
    remove.click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 30));
    assert.equal(calls.length, 2);
    assert.match(calls[1].url, /\/v1\/delete$/);
    assert.equal(storage.values.has(`dreamworld:gbrain-analysis:${dream.id}`), false);
    assert.equal(storage.values.has(`dreamworld:gbrain-delete:${dream.id}`), false, 'verified deletion clears the persisted retry identity');
    assert.equal(document.getElementById('analysisAIChoice').hidden, false);
    assert.match(document.getElementById('analysisGBrainStatus').textContent, /deleted and verified/i);
  } finally {
    dom.window.close();
  }
});

test('failed private analysis rotates retry identity only after verified cleanup and keeps the local reflection path available', async () => {
  const storage = createStorage();
  const analyzeRequests = [];
  let cleanupAllowed = false;
  const fetchImpl = async (url, options) => {
    const request = JSON.parse(options.body);
    if (url.endsWith('/cancel')) {
      if (!cleanupAllowed) throw new Error('tailnet unavailable during cleanup');
      return { ok: true, status: 200, json: async () => ({ cancelled: true, operationID: request.operationID }) };
    }
    analyzeRequests.push(request);
    throw new Error('tailnet unavailable during analysis');
  };
  const dom = await loadPage(storage, '', { reducedMotion: true, preparationTimings: [8, 8, 8], fetchImpl, privateOrigin: true });
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'I crossed a dark ocean toward a house.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();
    const dream = JSON.parse(storage.values.get('dreamworld:lastDream'));
    const answer = document.getElementById('analysisInterviewAnswer');
    answer.value = 'The moving house feels connected to uncertainty about where I belong.';
    answer.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('analysisInterviewSubmit').click();
    document.getElementById('analysisInterviewFinish').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 50));
    document.getElementById('analysisGBrainStart').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 30));

    assert.match(document.getElementById('analysisGBrainStatus').textContent, /not replaced/i);
    assert.match(document.getElementById('analysisStorageStatus').textContent, /cleanup.*not.*verified|not.*verified.*cleanup/i);
    assert.equal(storage.values.has(`dreamworld:gbrain-analysis:${dream.id}`), false);
    assert.equal(storage.values.has(`dreamworld:interview:${dream.id}`), true);
    assert.equal(analyzeRequests.length, 1);
    const firstRequest = analyzeRequests[0];

    document.getElementById('analysisGBrainStart').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 30));
    assert.equal(analyzeRequests.length, 2);
    assert.equal(analyzeRequests[1].operationID, firstRequest.operationID, 'unverified cleanup must retain the ambiguous operation identity');

    cleanupAllowed = true;
    document.getElementById('analysisGBrainStart').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 30));
    assert.equal(analyzeRequests.length, 3);
    assert.equal(analyzeRequests[2].operationID, firstRequest.operationID, 'the attempt being cleaned still uses the original identity');
    assert.match(document.getElementById('analysisStorageStatus').textContent, /new operation identity/i);

    document.getElementById('analysisGBrainStart').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 30));
    assert.equal(analyzeRequests.length, 4);
    assert.notEqual(analyzeRequests[3].operationID, firstRequest.operationID, 'retry may rotate only after the bridge verified cleanup');
    assert.equal(analyzeRequests[3].dreamID, firstRequest.dreamID);
    assert.equal(analyzeRequests[3].transcriptFingerprint, firstRequest.transcriptFingerprint);
    assert.equal(analyzeRequests[3].evidenceFingerprint, firstRequest.evidenceFingerprint);
    const local = document.getElementById('analysisLocalFallback');
    assert.equal(local.disabled, false);
    local.click();
    assert.equal(storage.values.has(`dreamworld:analysis:${dream.id}`), true);
    assert.match(document.getElementById('analysisFullText').textContent, /moving house|uncertainty|belong/i);
  } finally {
    dom.window.close();
  }
});

test('reflection preparation advances through all stages before analysis opens', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage, '', { reducedMotion: false, preparationTimings: [35, 35, 35], privateOrigin: true });
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'I crossed a dark ocean toward a house.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').focus();
    document.getElementById('dialogueFinish').click();

    const interviewAnswer = document.getElementById('analysisInterviewAnswer');
    interviewAnswer.value = 'The moving house feels connected to uncertainty about where I belong.';
    interviewAnswer.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('analysisInterviewSubmit').click();
    document.getElementById('alarmsView').inert = true;
    document.getElementById('analysisInterviewFinish').click();

    const preparation = document.getElementById('analysisPreparation');
    const title = document.getElementById('analysisPreparationTitle');
    assert.equal(preparation.hidden, false);
    assert.match(title.textContent, /Reading your dream/i);
    assert.equal(document.activeElement, preparation, 'focus moves out of the dialogue before it becomes inert');
    assert.equal(document.getElementById('dialogueOverlay').inert, true);
    assert.equal(preparation.hasAttribute('aria-busy'), false, 'live stage changes are not suppressed while busy');
    await new Promise(resolve => dom.window.setTimeout(resolve, 45));
    assert.match(title.textContent, /Following the details/i);
    await new Promise(resolve => dom.window.setTimeout(resolve, 40));
    assert.match(title.textContent, /Preparing a reflection/i);
    await new Promise(resolve => dom.window.setTimeout(resolve, 45));
    assert.equal(preparation.hidden, true);
    assert.equal(document.getElementById('analysisView').classList.contains('active'), true);
    assert.equal(document.activeElement, document.getElementById('analysisGBrainStart'), 'the explicit AI consent choice receives focus');
    assert.equal(document.getElementById('dialogueOverlay').inert, false);
    assert.equal(document.getElementById('alarmsView').inert, true, 'pre-existing inert state is restored rather than flattened');
    document.getElementById('alarmsView').inert = false;
  } finally {
    dom.window.close();
  }
});

test('Undo preserves a newer cross-tab reflection instead of restoring a stale snapshot', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage);
  try {
    const document = dom.window.document;
    const key = 'dreamworld:analysis:ocean-house';
    const newer = JSON.parse(storage.values.get(key));
    newer.characterResponse.text = 'A newer response saved in another tab.';

    const deleteButton = document.getElementById('analysisDeleteReflection');
    deleteButton.click();
    deleteButton.click();
    storage.values.set(key, JSON.stringify(newer));
    document.getElementById('analysisUndoDelete').click();
    assert.equal(document.getElementById('analysisCharacterResponse').textContent, 'A newer response saved in another tab.');
    assert.match(document.getElementById('analysisStorageStatus').textContent, /newer reflection saved elsewhere was preserved/i);
  } finally {
    dom.window.close();
  }
});

test('successful deletion expiry remains disclosed after navigation', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage);
  try {
    const document = dom.window.document;
    const key = 'dreamworld:analysis:ocean-house';
    assert.equal(storage.values.has(key), true);

    const nativeSetTimeout = dom.window.setTimeout;
    let expireUndo;
    dom.window.setTimeout = (callback, delay, ...args) => {
      if (delay === 10000) {
        expireUndo = callback;
        return 6161;
      }
      return nativeSetTimeout(callback, delay, ...args);
    };
    const deleteButton = document.getElementById('analysisDeleteReflection');
    deleteButton.click();
    deleteButton.click();
    dom.window.setTimeout = nativeSetTimeout;
    const backButton = document.getElementById('analysisBack');
    backButton.focus();
    expireUndo();
    assert.equal(document.activeElement, backButton);
    assert.equal(JSON.parse(storage.values.get(key)).deleted, true);
    assert.match(document.getElementById('analysisStorageStatus').textContent, /was deleted/i);

    document.getElementById('analysisBack').click();
    document.querySelector('[data-open-analysis="ocean-house"]').click();
    assert.match(document.getElementById('analysisCharacterResponse').textContent, /response was deleted/i);
    assert.equal(JSON.parse(storage.values.get(key)).deleted, true, 'reopening must not silently recreate deleted content');
    assert.match(document.getElementById('analysisStorageStatus').textContent, /was deleted/i);
    document.getElementById('analysisRegenerateResponse').click();
    assert.match(document.getElementById('analysisCharacterResponse').textContent, /water|home|house|belong/i);
    assert.equal(JSON.parse(storage.values.get(key)).deleted, undefined, 'regeneration occurs only after explicit user action');
  } finally {
    dom.window.close();
  }
});

test('legacy-only durability is derived from the mirror key rather than a stale marker', async () => {
  const legacy = {
    loggedAt: '2026-08-18T08:00:00.000Z',
    transcript: 'A durable legacy-only dream.',
    source: 'keyboard-text-unverified-provider'
  };
  const storage = createStorage(new Map([
    ['dreamworld:lastDream', JSON.stringify(legacy)],
    ['dreamworld:lastDreamDurable', 'false']
  ]));
  const dom = await loadPage(storage, '');
  try {
    assert.doesNotMatch(dom.window.document.getElementById('latestDreamMeta').textContent, /Open page only/);
  } finally {
    dom.window.close();
  }
});

test('legacy latest dream migrates into reachable local history on the next successful log', async () => {
  const existing = {
    schemaVersion: 1,
    id: 'dream-existing-record',
    loggedAt: '2026-08-17T08:00:00.000Z',
    title: 'Existing record',
    transcript: 'A dream already lived in the per-record library.',
    source: 'keyboard-text-unverified-provider'
  };
  const legacy = {
    loggedAt: '2026-08-18T08:00:00.000Z',
    transcript: 'An older dream remained beside a blue river.',
    source: 'keyboard-text-unverified-provider'
  };
  const storage = createStorage(new Map([
    [`dreamworld:dream:${existing.id}`, JSON.stringify(existing)],
    ['dreamworld:lastDream', JSON.stringify(legacy)],
    ['dreamworld:lastDreamDurable', 'false']
  ]));
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    assert.doesNotMatch(document.getElementById('latestDreamMeta').textContent, /Open page only/);
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'A newer dream crossed the same river.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();

    const library = storedDreams(storage);
    assert.equal(library.length, 3);
    const migratedLegacy = library.find(record => record.transcript === legacy.transcript);
    assert.match(migratedLegacy.id, /^legacy-dream-/);
    const historicalRow = document.querySelector(`[data-open-analysis="${migratedLegacy.id}"]`);
    assert.ok(historicalRow);
    historicalRow.click();
    assert.equal(document.getElementById('analysisTranscript').textContent, legacy.transcript);
  } finally {
    dom.window.close();
  }
});

test('legacy migration reallocates a colliding ID instead of losing either record', async () => {
  const legacy = {
    schemaVersion: 1,
    id: 'legacy-dream-collision',
    loggedAt: '2026-08-18T08:00:00.000Z',
    title: 'Legacy collision',
    transcript: 'The legacy dream must survive its hash collision.',
    source: 'keyboard-text-unverified-provider',
    model: ''
  };
  const conflicting = {
    ...legacy,
    transcript: 'Different content already occupies the legacy key.'
  };
  const storage = createStorage(new Map([
    [`dreamworld:dream:${legacy.id}`, JSON.stringify(conflicting)],
    ['dreamworld:lastDream', JSON.stringify(legacy)]
  ]));
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'A new dream after the collision.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();
    const records = storedDreams(storage);
    assert.equal(records.length, 3);
    assert.equal(records.filter(record => record.transcript === legacy.transcript).length, 1);
    assert.equal(records.filter(record => record.transcript === conflicting.transcript).length, 1);
    assert.equal(JSON.parse(storage.values.get(`dreamworld:dream:${legacy.id}`)).transcript, conflicting.transcript);
  } finally {
    dom.window.close();
  }
});

test('authoritative chronology ignores a stale mirror and refreshes on cross-tab storage events', async () => {
  const older = {
    schemaVersion: 1,
    id: 'dream-older-authoritative',
    loggedAt: '2026-08-18T08:00:00.000Z',
    title: 'Older',
    transcript: 'The older authoritative dream.',
    source: 'keyboard-text-unverified-provider',
    model: ''
  };
  const newer = { ...older, id: 'dream-newer-authoritative', loggedAt: '2026-08-19T08:00:00.000Z', title: 'Newer', transcript: 'The newer authoritative dream.' };
  const storage = createStorage(new Map([
    [`dreamworld:dream:${older.id}`, JSON.stringify(older)],
    [`dreamworld:dream:${newer.id}`, JSON.stringify(newer)],
    ['dreamworld:lastDream', JSON.stringify(older)]
  ]));
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.getElementById('latestDreamRow').click();
    assert.equal(document.getElementById('analysisTranscript').textContent, newer.transcript);
    document.getElementById('analysisBack').click();

    const newest = { ...newer, id: 'dream-cross-tab-refresh', loggedAt: '2026-08-20T08:00:00.000Z', title: 'Cross-tab newest', transcript: 'A dream written by another tab.' };
    const newestKey = `dreamworld:dream:${newest.id}`;
    storage.values.set(newestKey, JSON.stringify(newest));
    dom.window.dispatchEvent(new dom.window.StorageEvent('storage', { key: newestKey }));
    assert.equal(document.querySelectorAll('#loggedDreamHistory [data-open-analysis]').length, 2);
    document.getElementById('latestDreamRow').click();
    assert.equal(document.getElementById('analysisTranscript').textContent, newest.transcript);
  } finally {
    dom.window.close();
  }
});

test('external deletion invalidates a stale interview session and cannot resurrect removed answers', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'I found a key beside a staircase and felt afraid.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();
    const dream = JSON.parse(storage.values.get('dreamworld:lastDream'));
    const interviewKey = `dreamworld:interview:${dream.id}`;
    const analysisKey = `dreamworld:analysis:${dream.id}`;
    const answer = document.getElementById('analysisInterviewAnswer');
    answer.value = 'The key reminds me of responsibility.';
    answer.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('analysisInterviewSubmit').click();
    assert.equal(JSON.parse(storage.values.get(interviewKey)).answers.length, 1);

    const oldInterview = storage.values.get(interviewKey);
    storage.values.delete(interviewKey);
    const tombstone = JSON.stringify({ schemaVersion: 1, dreamID: dream.id, deleted: true, deletedAt: '2026-08-21T12:00:00.000Z' });
    storage.values.set(analysisKey, tombstone);
    dom.window.dispatchEvent(new dom.window.StorageEvent('storage', { key: analysisKey, oldValue: null, newValue: tombstone }));
    dom.window.dispatchEvent(new dom.window.StorageEvent('storage', { key: interviewKey, oldValue: oldInterview, newValue: null }));

    assert.equal(document.getElementById('analysisInterviewForm').hidden, true, 'external deletion must close the stale answer form');
    assert.match(document.getElementById('analysisCharacterResponse').textContent, /response was deleted/i);
    answer.value = 'A stale answer that must not return.';
    document.getElementById('analysisInterviewForm').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    assert.equal(storage.values.has(interviewKey), false, 'a stale in-memory session cannot recreate externally deleted answers');
    assert.equal(storage.values.get(analysisKey), tombstone);
  } finally {
    dom.window.close();
  }
});

test('external active-dream removal closes stale interview state and cannot create orphaned evidence', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'Several keys appeared beside two houses.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();
    const dream = JSON.parse(storage.values.get('dreamworld:lastDream'));
    const dreamKey = `dreamworld:dream:${dream.id}`;
    const interviewKey = `dreamworld:interview:${dream.id}`;
    const analysisKey = `dreamworld:analysis:${dream.id}`;
    assert.equal(document.getElementById('analysisInterviewForm').hidden, false);

    storage.values.delete(dreamKey);
    dom.window.dispatchEvent(new dom.window.StorageEvent('storage', { key: dreamKey, oldValue: JSON.stringify(dream), newValue: null }));

    assert.equal(document.getElementById('analysisInterviewForm').hidden, true, 'removed active dream closes the stale interview form');
    assert.equal(document.getElementById('latestDreamRow').hidden, true, 'matching legacy mirrors cannot resurrect the deleted authoritative dream');
    assert.match(document.getElementById('analysisCharacterResponse').textContent, /dream was removed in another tab/i);
    const answer = document.getElementById('analysisInterviewAnswer');
    answer.value = 'This stale answer must not be written.';
    document.getElementById('analysisInterviewForm').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    assert.equal(storage.values.has(interviewKey), false, 'the removed dream cannot retain or recreate orphaned interview answers');
    assert.equal(storage.values.has(analysisKey), false, 'no orphaned analysis remains after its dream disappears');
  } finally {
    dom.window.close();
  }
});

test('active source removal cancels held Undo so deleted evidence cannot be restored as an orphan', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage, '', { reducedMotion: true, preparationTimings: [8, 8, 8] });
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'I found a key beside a staircase and felt afraid.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();
    const dream = JSON.parse(storage.values.get('dreamworld:lastDream'));
    const dreamKey = `dreamworld:dream:${dream.id}`;
    const interviewKey = `dreamworld:interview:${dream.id}`;
    const analysisKey = `dreamworld:analysis:${dream.id}`;
    const answer = document.getElementById('analysisInterviewAnswer');
    answer.value = 'The key feels like responsibility.';
    answer.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('analysisInterviewSubmit').click();
    document.getElementById('analysisInterviewFinish').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 45));
    document.getElementById('analysisLocalFallback').click();
    const deleteButton = document.getElementById('analysisDeleteReflection');
    deleteButton.click();
    deleteButton.click();
    document.getElementById('analysisKeepUndo').click();
    assert.equal(document.getElementById('analysisUndoDelete').hidden, false);

    storage.values.delete(dreamKey);
    dom.window.dispatchEvent(new dom.window.StorageEvent('storage', { key: dreamKey, oldValue: JSON.stringify(dream), newValue: null }));
    document.getElementById('analysisUndoDelete').click();

    assert.equal(document.getElementById('analysisUndoDelete').hidden, true, 'source removal cancels held Undo');
    assert.equal(storage.values.has(interviewKey), false, 'Undo cannot restore orphaned interview evidence');
    assert.equal(storage.values.has(analysisKey), false, 'Undo cannot restore an orphaned reflection');
  } finally {
    dom.window.close();
  }
});

test('localStorage clear fully closes an active interview lifecycle', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'A house floated over the ocean while I watched.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();
    storage.values.clear();
    dom.window.dispatchEvent(new dom.window.StorageEvent('storage', { key: null }));

    assert.equal(document.getElementById('analysisInterviewForm').hidden, true);
    assert.match(document.getElementById('analysisCharacterResponse').textContent, /storage was cleared in another tab/i);
    assert.equal(document.getElementById('latestDreamRow').hidden, true);
  } finally {
    dom.window.close();
  }
});

test('active removal preserves a split legacy mirror with a different source', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'I found a key beside a staircase and felt afraid.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();
    const dream = JSON.parse(storage.values.get('dreamworld:lastDream'));
    const dreamKey = `dreamworld:dream:${dream.id}`;
    const unrelatedMirror = { ...dream, source: 'different-device-import' };
    storage.values.set('dreamworld:lastDream', JSON.stringify(unrelatedMirror));
    storage.values.set('dreamworld:lastTranscriptSource', unrelatedMirror.source);
    storage.values.delete(dreamKey);
    dom.window.dispatchEvent(new dom.window.StorageEvent('storage', { key: dreamKey, oldValue: JSON.stringify(dream), newValue: null }));

    assert.deepEqual(JSON.parse(storage.values.get('dreamworld:lastDream')), unrelatedMirror, 'same ID alone does not authorize deleting a different-source mirror');
    assert.equal(storage.values.get('dreamworld:lastTranscript'), dream.transcript, 'same text and timestamp do not authorize deleting a different-source split mirror');
    assert.equal(storage.values.get('dreamworld:lastTranscriptSource'), 'different-device-import');
    assert.equal(document.getElementById('latestDreamRow').hidden, false, 'the unrelated legacy mirror remains visible');
    assert.notEqual(document.getElementById('latestDreamRow').dataset.openAnalysis, dream.id, 'the unrelated mirror receives its own legacy identity');
  } finally {
    dom.window.close();
  }
});

test('unrelated cross-tab history updates preserve an unfinished interview draft', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'I found a key beside a staircase and felt afraid.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();
    const activeDream = JSON.parse(storage.values.get('dreamworld:lastDream'));
    const answer = document.getElementById('analysisInterviewAnswer');
    answer.value = 'This unsent draft connects the key with responsibility.';
    answer.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

    const unrelated = {
      ...activeDream,
      id: 'dream-unrelated-cross-tab',
      loggedAt: '2026-08-22T09:00:00.000Z',
      title: 'Unrelated cross-tab dream',
      transcript: 'A train crossed an empty field.'
    };
    const unrelatedKey = `dreamworld:dream:${unrelated.id}`;
    storage.values.set(unrelatedKey, JSON.stringify(unrelated));
    dom.window.dispatchEvent(new dom.window.StorageEvent('storage', { key: unrelatedKey, oldValue: null, newValue: JSON.stringify(unrelated) }));

    assert.equal(document.getElementById('analysisInterviewForm').hidden, false);
    assert.equal(answer.value, 'This unsent draft connects the key with responsibility.', 'unrelated history refresh cannot erase unsent interview text');
    assert.equal(JSON.parse(storage.values.get(`dreamworld:interview:${activeDream.id}`)).answers.length, 0, 'the draft remains unsent until the user submits it');
  } finally {
    dom.window.close();
  }
});

test('a cross-tab dream record refreshes the active longitudinal response', async () => {
  const storage = createStorage();
  const dom = await loadPage(storage, '', { reducedMotion: true, preparationTimings: [8, 8, 8] });
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'I found a key beside a staircase and felt afraid.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();
    const dream = JSON.parse(storage.values.get('dreamworld:lastDream'));
    const answer = document.getElementById('analysisInterviewAnswer');
    answer.value = 'The key reminds me of responsibility.';
    answer.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('analysisInterviewSubmit').click();
    document.getElementById('analysisInterviewFinish').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 100));
    document.getElementById('analysisLocalFallback').click();
    const analysisKey = `dreamworld:analysis:${dream.id}`;
    assert.doesNotMatch(JSON.parse(storage.values.get(analysisKey)).characterResponse.text, /Across your saved history/i);

    const related = {
      ...dream,
      id: 'dream-cross-tab-related',
      loggedAt: '2026-08-22T08:00:00.000Z',
      title: 'Later key dream',
      transcript: 'Several keys appeared beside a door.'
    };
    const relatedKey = `dreamworld:dream:${related.id}`;
    storage.values.set(relatedKey, JSON.stringify(related));
    dom.window.dispatchEvent(new dom.window.StorageEvent('storage', { key: relatedKey, oldValue: null, newValue: JSON.stringify(related) }));

    const refreshed = JSON.parse(storage.values.get(analysisKey));
    assert.match(refreshed.characterResponse.text, /Across your saved history/i);
    assert.equal(refreshed.methodology.longitudinal.recurrences[0].dreamID, related.id);
    assert.equal(document.getElementById('analysisTitle').textContent, dream.title, 'refreshing history must not navigate away from the active dream');
  } finally {
    dom.window.close();
  }
});

test('malformed and reserved per-dream records are quarantined without deleting valid history', async () => {
  const valid = {
    schemaVersion: 1,
    id: 'dream-valid-history',
    loggedAt: '2026-08-19T08:00:00.000Z',
    title: 'Valid history',
    transcript: 'A valid dream remained reachable.',
    source: 'keyboard-text-unverified-provider'
  };
  const storage = createStorage(new Map([
    [`dreamworld:dream:${valid.id}`, JSON.stringify(valid)],
    ['dreamworld:lastDreamDurable', 'false'],
    ['dreamworld:dream:malformed', '{not json'],
    ['dreamworld:dream:dream-invalid-date', JSON.stringify({ ...valid, id: 'dream-invalid-date', loggedAt: 'not-a-date', transcript: 'Must not enter chronology.' })],
    ['dreamworld:dream:ocean-house', JSON.stringify({ ...valid, id: 'ocean-house', transcript: 'Must not shadow sample content.' })]
  ]));
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    assert.doesNotMatch(document.getElementById('latestDreamMeta').textContent, /Open page only/);
    document.getElementById('latestDreamRow').click();
    assert.equal(document.getElementById('analysisTranscript').textContent, valid.transcript);
    assert.equal(storage.values.has('dreamworld:dream:malformed'), true, 'malformed data is quarantined rather than destructively removed');
    assert.equal(storage.values.has('dreamworld:dream:dream-invalid-date'), true);
    assert.equal(storage.values.has('dreamworld:dream:ocean-house'), true);
  } finally {
    dom.window.close();
  }
});

test('separate preloaded tabs preserve both independently logged dreams', async () => {
  const storage = createStorage();
  const [first, second] = await Promise.all([loadPage(storage, ''), loadPage(storage, '')]);
  try {
    for (const [dom, transcript] of [[first, 'A dream from the first tab.'], [second, 'A dream from the second tab.']]) {
      const document = dom.window.document;
      document.querySelector('[data-go="capture"]').click();
      const input = document.getElementById('dreamTextInput');
      input.value = transcript;
      input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      document.getElementById('saveButton').click();
      document.getElementById('dialogueFinish').click();
    }
    const records = storedDreams(storage);
    assert.equal(records.length, 2);
    assert.deepEqual(new Set(records.map(record => record.transcript)), new Set(['A dream from the first tab.', 'A dream from the second tab.']));
  } finally {
    first.window.close();
    second.window.close();
  }
});

test('failed per-record save retries once without a ghost row or duplicate identity', async () => {
  const values = new Map();
  let writesBlocked = true;
  const storage = {
    values,
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.get(String(key)) ?? null; },
    setItem(key, value) {
      if (writesBlocked && String(key).startsWith('dreamworld:dream:')) throw new Error('quota exceeded');
      values.set(String(key), String(value));
    },
    removeItem(key) { values.delete(String(key)); }
  };
  const dom = await loadPage(storage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    const input = document.getElementById('dreamTextInput');
    input.value = 'A dream waiting for storage space.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();
    assert.equal(storedDreams(storage).length, 0);
    assert.equal(document.getElementById('latestDreamRow').hidden, true);
    assert.equal(input.value, 'A dream waiting for storage space.');

    writesBlocked = false;
    document.getElementById('dialogueFinish').click();
    const records = storedDreams(storage);
    assert.equal(records.length, 1);
    assert.equal(records[0].transcript, 'A dream waiting for storage space.');
    assert.equal(document.getElementById('captureState').textContent, 'Dream logged');
  } finally {
    dom.window.close();
  }
});

test('failed permanent deletion remains disclosed after Undo expires', async () => {
  const values = new Map();
  const storage = {
    values,
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem() { throw new Error('remove blocked'); }
  };
  let dom = await loadPage(storage);
  let originalResponse;
  try {
    const document = dom.window.document;
    const key = 'dreamworld:analysis:ocean-house';
    originalResponse = document.getElementById('analysisCharacterResponse').textContent;
    assert.equal(values.has(key), true);

    const nativeSetTimeout = dom.window.setTimeout;
    let expireUndo;
    dom.window.setTimeout = (callback, delay, ...args) => {
      if (delay === 10000) {
        expireUndo = callback;
        return 5252;
      }
      return nativeSetTimeout(callback, delay, ...args);
    };
    const deleteButton = document.getElementById('analysisDeleteReflection');
    deleteButton.click();
    deleteButton.click();
    dom.window.setTimeout = nativeSetTimeout;
    assert.equal(values.has(key), true, 'blocked remove leaves the durable record present');
    assert.match(document.getElementById('analysisStorageStatus').textContent, /permanent deletion.+blocked/i);
    const backButton = document.getElementById('analysisBack');
    backButton.focus();
    expireUndo();
    assert.equal(document.activeElement, backButton, 'expiry restores the control focused after Undo was offered');
    assert.match(document.getElementById('analysisStorageStatus').textContent, /permanent deletion.+blocked/i);
    assert.match(document.getElementById('analysisStorageStatus').textContent, /restored on this device/i);
    assert.equal(document.getElementById('analysisCharacterResponse').textContent, originalResponse, 'failed deletion restores the visible response at expiry');

    document.getElementById('analysisBack').click();
    document.querySelector('[data-open-analysis="ocean-house"]').click();
    assert.equal(document.getElementById('analysisCharacterResponse').textContent, originalResponse);
    assert.match(document.getElementById('analysisStorageStatus').textContent, /permanent deletion.+blocked/i);
  } finally {
    dom.window.close();
  }

  dom = await loadPage(storage);
  try {
    assert.equal(dom.window.document.getElementById('analysisCharacterResponse').textContent, originalResponse, 'reload sees the never-deleted durable response');
  } finally {
    dom.window.close();
  }
});

test('blocked browser storage never reports a dream as durably logged or clears its draft', async () => {
  const blockedStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); }
  };
  const dom = await loadPage(blockedStorage, '');
  try {
    const document = dom.window.document;
    document.querySelector('[data-go="capture"]').click();
    document.getElementById('noDreamButton').click();
    assert.equal(document.getElementById('captureState').textContent, 'Not saved permanently');
    assert.match(document.getElementById('captureError').textContent, /not logged/i);
    const input = document.getElementById('dreamTextInput');
    input.value = 'I crossed a bridge and woke before reaching the other side.';
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    document.getElementById('saveButton').click();
    document.getElementById('dialogueFinish').click();

    assert.equal(input.value, 'I crossed a bridge and woke before reaching the other side.');
    assert.equal(document.getElementById('captureState').textContent, 'Not saved permanently');
    assert.equal(document.getElementById('dialogueStatus').textContent, 'Couldn’t save permanently');
    assert.equal(document.getElementById('dialogueOverlay').classList.contains('visible'), true);
    assert.match(document.getElementById('dialogueText').textContent, /open page only/i);
    assert.doesNotMatch(document.getElementById('captureState').textContent, /Dream logged/);
    assert.equal(document.getElementById('dialogueFinish').textContent, 'Try saving again');
  } finally {
    dom.window.close();
  }
});
