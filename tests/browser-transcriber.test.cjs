const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createBrowserDreamTranscriber } = require('../browser-transcriber.js');

const seenBlobs = [];
const progressEvents = [];
const decoder = async blob => {
  seenBlobs.push(blob);
  return new Float32Array([blob.sample]);
};
const workerClient = {
  async transcribe(audio, onProgress) {
    onProgress?.({ status: 'progress', progress: 50 });
    return audio[0] === 1 ? 'first recording words' : 'second recording words';
  }
};

(async () => {
  const transcriber = createBrowserDreamTranscriber({ decoder, workerClient });
  const firstBlob = { sample: 1 };
  const secondBlob = { sample: 2 };

  assert.equal(await transcriber.transcribe(firstBlob, event => progressEvents.push(event)), 'first recording words');
  assert.equal(await transcriber.transcribe(secondBlob), 'second recording words');
  assert.deepEqual(seenBlobs, [firstBlob, secondBlob], 'each real recording blob must reach the decoder');
  assert.equal(progressEvents.some(event => event.progress === 50), true);
  await assert.rejects(() => transcriber.transcribe(null), /recording/i);

  const html = fs.readFileSync(path.join(__dirname, '..', 'world.html'), 'utf8');
  assert.doesNotMatch(html, /sampleTranscript|I was walking beside a dark lake under a gold moon/);
  assert.match(html, /browserTranscriber\.transcribe\(recordedBlob/);

  console.log('browser transcription wiring tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
