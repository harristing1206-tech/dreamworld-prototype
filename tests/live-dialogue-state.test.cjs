const assert = require('node:assert/strict');
const { createDreamDialogueFlow } = require('../dialogue-state.js');

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

assert.equal(flow.finishDialogue(), true);
assert.equal(flow.finishDialogue(), false, 'finished dialogue cannot reopen for the same dream');
assert.equal(flow.phase, 'logged');

flow.reset();
assert.equal(flow.phase, 'ready');
assert.equal(flow.transcript, '');

console.log('live dialogue state tests passed');
