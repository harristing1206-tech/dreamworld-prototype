const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const source = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

function makeDom({ punctuationMode = 'fail-once' } = {}) {
  let sttCalls = 0;
  let punctuationCalls = 0;
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(source, {
    runScripts: 'dangerously',
    url: 'https://preview.test/dreamworld-punctuation-flow',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      const nativeSetTimeout = window.setTimeout.bind(window);
      window.matchMedia = () => ({ matches: false, media: '', addEventListener() {}, removeEventListener() {} });
      window.navigator.mediaDevices = { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) };
      class Recorder {
        static isTypeSupported() { return true; }
        constructor(_stream, options = {}) { this.mimeType = options.mimeType || 'audio/webm'; this.state = 'inactive'; }
        start() { this.state = 'recording'; }
        stop() {
          this.state = 'inactive';
          this.ondataavailable?.({ data: new window.Blob(['same-recording'], { type: this.mimeType }) });
          this.onstop?.();
        }
      }
      window.MediaRecorder = Recorder;
      window.Audio = class { play() { return Promise.resolve(); } pause() {} };
      window.URL.createObjectURL = () => 'blob:test';
      window.URL.revokeObjectURL = () => {};
      if (punctuationMode === 'timeout') {
        window.setTimeout = (callback, milliseconds, ...args) => nativeSetTimeout(callback, milliseconds === 65000 ? 0 : milliseconds, ...args);
      }
      window.fetch = async (url, options = {}) => {
        if (String(url).includes('/dreamworld-stt/')) {
          sttCalls += 1;
          return {
            ok: true,
            json: async () => ({
              text: 'i entered the room and the windows were open but it was raining inside',
              provenance: { provider: 'OpenWhispr-compatible private engine', engine: 'whisper.cpp', model: 'small', processing: 'private-vps', audioRetainedByServer: false }
            })
          };
        }
        if (String(url).includes('/dreamworld-ai/v1/punctuate')) {
          punctuationCalls += 1;
          if (punctuationMode === 'timeout') {
            return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => {
              const error = new Error('aborted');
              error.name = 'AbortError';
              reject(error);
            }, { once: true }));
          }
          if (punctuationCalls === 1) return { ok: false, json: async () => ({ error: 'Punctuation temporarily unavailable.' }) };
          return {
            ok: true,
            json: async () => ({
              text: 'I entered the room, and the windows were open, but it was raining inside.',
              provenance: { method: 'punctuation-only-v1', model: 'test', wordsPreserved: true }
            })
          };
        }
        throw new Error(`Unexpected fetch: ${url}`);
      };
    }
  });
  return { dom, errors, counts: () => ({ sttCalls, punctuationCalls }) };
}

const wait = (dom, milliseconds = 10) => new Promise(resolve => dom.window.setTimeout(resolve, milliseconds));

async function recordAndTranscribe(dom) {
  const document = dom.window.document;
  document.querySelector('[data-tab="log"]').click();
  await wait(dom, 0);
  document.getElementById('startRecording').click();
  await wait(dom, 0);
  document.getElementById('stopRecording').click();
  await wait(dom, 10);
  document.getElementById('logDream').click();
  await wait(dom, 15);
}

test('punctuation retry reuses the validated raw transcript instead of rerunning STT', async () => {
  const fixture = makeDom();
  const document = fixture.dom.window.document;
  await recordAndTranscribe(fixture.dom);
  assert.ok(document.querySelector('[data-log-state="transcription-failed"]').classList.contains('active'));
  assert.match(document.getElementById('transcriptionError').textContent, /Punctuation temporarily unavailable/);
  assert.deepEqual(fixture.counts(), { sttCalls: 1, punctuationCalls: 1 });

  document.getElementById('retryFailedTranscript').click();
  await wait(fixture.dom, 15);
  assert.ok(document.querySelector('[data-log-state="transcript"]').classList.contains('active'));
  assert.equal(document.getElementById('dreamTranscript').value, 'I entered the room, and the windows were open, but it was raining inside.');
  assert.deepEqual(fixture.counts(), { sttCalls: 1, punctuationCalls: 2 });
  assert.deepEqual(fixture.errors, []);
  fixture.dom.window.close();
});

test('punctuation has an independent timeout with an accurate recovery message', async () => {
  const fixture = makeDom({ punctuationMode: 'timeout' });
  const document = fixture.dom.window.document;
  await recordAndTranscribe(fixture.dom);
  assert.ok(document.querySelector('[data-log-state="transcription-failed"]').classList.contains('active'));
  assert.match(document.getElementById('transcriptionError').textContent, /Punctuation timed out\. Your recording is still safe\./);
  assert.deepEqual(fixture.counts(), { sttCalls: 1, punctuationCalls: 1 });
  assert.deepEqual(fixture.errors, []);
  fixture.dom.window.close();
});
