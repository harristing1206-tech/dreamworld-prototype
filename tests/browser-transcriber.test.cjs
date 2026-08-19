const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createBrowserDreamTranscriber } = require('../browser-transcriber.js');

const seenBlobs = [];
const seenModels = [];
const progressEvents = [];
const decoder = async blob => {
  seenBlobs.push(blob);
  return new Float32Array([blob.sample]);
};
const workerClient = {
  async transcribe(audio, onProgress, options) {
    seenModels.push(options?.modelID);
    onProgress?.({ status: 'progress', progress: 50 });
    return audio[0] === 1 ? 'first recording words' : 'second recording words';
  }
};

(async () => {
  const transcriber = createBrowserDreamTranscriber({ decoder, workerClient });
  const firstBlob = { sample: 1 };
  const secondBlob = { sample: 2 };

  assert.equal(await transcriber.transcribe(firstBlob, event => progressEvents.push(event), { modelID: 'Xenova/whisper-base.en' }), 'first recording words');
  assert.equal(await transcriber.transcribe(secondBlob, null, { modelID: 'Xenova/whisper-small' }), 'second recording words');
  assert.deepEqual(seenBlobs, [firstBlob, secondBlob], 'each real recording blob must reach the decoder');
  assert.deepEqual(seenModels, ['Xenova/whisper-base.en', 'Xenova/whisper-small'], 'the selected model must reach the worker client');
  assert.equal(progressEvents.some(event => event.progress === 50), true);
  await assert.rejects(() => transcriber.transcribe(null), /recording/i);

  const html = fs.readFileSync(path.join(__dirname, '..', 'world.html'), 'utf8');
  const worker = fs.readFileSync(path.join(__dirname, '..', 'transcription-worker.js'), 'utf8');
  assert.doesNotMatch(html, /sampleTranscript|I was walking beside a dark lake under a gold moon/);
  assert.match(html, /browserTranscriber\.transcribe\(recordedBlob/);
  for (const modelID of [
    'Xenova/whisper-tiny', 'Xenova/whisper-tiny.en',
    'Xenova/whisper-base', 'Xenova/whisper-base.en',
    'Xenova/whisper-small', 'Xenova/whisper-small.en'
  ]) {
    assert.match(html, new RegExp(modelID.replace('.', '\\.')));
    assert.match(worker, new RegExp(modelID.replace('.', '\\.')));
  }
  assert.match(html, /dreamworld:transcriptionModel/);
  assert.match(worker, /modelID\.endsWith\('\.en'\)/, 'English-only models must omit multilingual generation options');
  assert.match(html, /<textarea[^>]+id="dreamTextInput"/);
  assert.match(html, /Use Wispr Flow keyboard/);
  assert.match(html, /Keyboard text · provider not detectable/);
  assert.match(html, /Experimental local transcription/);
  assert.match(html, /dialogueFlow\.saveTextDraft\(dreamTextInput\.value/);
  assert.match(html, /dreamworld:textDraft/);
  assert.match(html, /DreamDialogueFlow\.createSafeStorage/);
  assert.match(html, /appStorage\.set\(TEXT_DRAFT_KEY/);
  assert.match(html, /appStorage\.remove\(TEXT_DRAFT_KEY/);
  assert.match(html, /Clear or log your text draft before starting an experimental recording/);
  assert.match(html, /dreamTextInput\.disabled = locked/);
  assert.match(html, /wisprFocusButton\.disabled = locked/);
  assert.match(html, /DreamDialogueFlow\.resolveCaptureSource/);

  console.log('browser transcription wiring tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
