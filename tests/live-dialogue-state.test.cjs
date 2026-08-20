const assert = require('node:assert/strict');
const { createDreamDialogueFlow, createSafeStorage, resolveCaptureSource } = require('../dialogue-state.js');

const blockedStorage = {
  getItem() { throw new Error('blocked'); },
  setItem() { throw new Error('blocked'); },
  removeItem() { throw new Error('blocked'); }
};
const safeStorage = createSafeStorage(blockedStorage);
assert.equal(safeStorage.set('draft', 'A remembered fragment'), false, 'blocked persistence falls back to memory');
assert.equal(safeStorage.get('draft'), 'A remembered fragment', 'fallback keeps the current-session draft available');
assert.equal(safeStorage.remove('draft'), false, 'blocked removal remains non-throwing');
assert.equal(safeStorage.get('draft'), null);

const writeBlockedStorage = {
  getItem() { return 'old durable draft'; },
  setItem() { throw new Error('quota exceeded'); },
  removeItem() { throw new Error('write blocked'); }
};
const overlayStorage = createSafeStorage(writeBlockedStorage);
assert.equal(overlayStorage.set('draft', 'new in-memory draft'), false);
assert.equal(overlayStorage.get('draft'), 'new in-memory draft', 'failed durable set must prefer the newer memory overlay');
assert.equal(overlayStorage.remove('draft'), false);
assert.equal(overlayStorage.get('draft'), null, 'failed durable remove must preserve an in-memory tombstone');

const durableValues = new Map([['dreamworld:dream:existing', 'old']]);
const enumerableStorage = {
  get length() { return durableValues.size; },
  key(index) { return [...durableValues.keys()][index] ?? null; },
  getItem(key) { return durableValues.get(key) ?? null; },
  setItem(key, value) { durableValues.set(key, String(value)); },
  removeItem(key) { durableValues.delete(key); }
};
const indexedStorage = createSafeStorage(enumerableStorage);
assert.deepEqual(indexedStorage.keys('dreamworld:dream:'), ['dreamworld:dream:existing']);
assert.equal(indexedStorage.isDurable('dreamworld:dream:existing'), true);
assert.equal(indexedStorage.getDurable('dreamworld:dream:existing'), 'old');
assert.equal(indexedStorage.set('dreamworld:dream:new', 'new'), true);
assert.deepEqual(indexedStorage.keys('dreamworld:dream:'), ['dreamworld:dream:existing', 'dreamworld:dream:new']);
assert.equal(indexedStorage.remove('dreamworld:dream:existing'), true);
assert.deepEqual(indexedStorage.keys('dreamworld:dream:'), ['dreamworld:dream:new']);
assert.equal(indexedStorage.isDurable('dreamworld:dream:existing'), false);

assert.equal(resolveCaptureSource({ textDraft: 'A fragment', hasAudio: false }), 'text');
assert.equal(resolveCaptureSource({ textDraft: '', hasAudio: true }), 'audio');
assert.equal(resolveCaptureSource({ textDraft: '', hasAudio: false }), null);
assert.throws(
  () => resolveCaptureSource({ textDraft: 'A fragment', hasAudio: true }),
  /both text and audio/i,
  'mixed capture state must never silently discard one source'
);

const flow = createDreamDialogueFlow();
assert.equal(flow.phase, 'ready');
assert.equal(flow.logDream(), false, 'cannot log before a recording is saved');

assert.equal(flow.saveDraft(), true);
assert.equal(flow.phase, 'savedDraft');
assert.equal(flow.logDream(), true);
assert.equal(flow.logDream(), false, 'log transition can happen only once');
assert.equal(flow.phase, 'transcribing');

assert.equal(flow.completeTranscript('A sample transcript.'), true);
assert.equal(flow.phase, 'transcriptReady');
assert.equal(flow.transcript, 'A sample transcript.');
assert.equal(flow.source, 'browser-local-whisper');

assert.equal(flow.finishDialogue(), true);
assert.equal(flow.finishDialogue(), false, 'finished dialogue cannot reopen for the same dream');
assert.equal(flow.phase, 'logged');

flow.reset();
assert.equal(flow.phase, 'ready');
assert.equal(flow.transcript, '');

assert.equal(flow.saveDraft(), true);
assert.equal(flow.logDream(), true);
assert.equal(flow.failTranscription('Model download failed.'), true);
assert.equal(flow.phase, 'transcriptionFailed');
assert.equal(flow.error, 'Model download failed.');
assert.equal(flow.retryTranscription(), true);
assert.equal(flow.retryTranscription(), false, 'retry can restart only a failed transcription');
assert.equal(flow.phase, 'transcribing');

flow.reset();
assert.equal(flow.saveTextDraft('   '), false, 'blank keyboard text cannot be logged');
assert.equal(flow.saveTextDraft('  A staircase rose from the ocean.  ', 'keyboard-text-unverified-provider'), true);
assert.equal(flow.phase, 'transcriptReady');
assert.equal(flow.transcript, 'A staircase rose from the ocean.');
assert.equal(flow.source, 'keyboard-text-unverified-provider');
assert.equal(flow.saveTextDraft('A duplicate.'), false, 'the same draft can become ready only once');
assert.equal(flow.finishDialogue(), true);

console.log('live dialogue state tests passed');
