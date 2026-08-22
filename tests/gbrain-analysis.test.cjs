const assert = require('node:assert/strict');
const { test } = require('node:test');
const GBrain = require('../gbrain-analysis.js');

const transcript = 'I stood beside a dark lake. The silver key in my pocket suddenly became very hot, and I woke up.';
const associations = [{
  questionID: 'first-association',
  focus: 'the key',
  question: 'What did the key bring up for you personally?',
  answer: 'Permission and access, but the heat made acting too soon feel dangerous.'
}];

async function requestFixture() {
  return GBrain.buildRequest({ dreamID: 'dream-1', title: 'Hot key', transcript, source: 'typed text', associations });
}

function resultFixture(request) {
  return {
    schemaVersion: 1,
    operationID: request.operationID,
    dreamID: request.dreamID,
    transcriptFingerprint: request.transcriptFingerprint,
    evidenceFingerprint: request.evidenceFingerprint,
    analysis: 'Your association makes permission the central tension here. The dream first places you beside a dark lake, then turns the key from a possible means of access into an immediate bodily warning. One tentative reading is that part of you is considering entry or movement while another part is registering that the timing or cost is not yet safe. This is a hypothesis grounded in your own words, not a fixed meaning for keys.',
    closingQuestion: 'Where in your waking life do permission and timing currently feel inseparable?',
    evidence: [{
      quote: 'The silver key in my pocket suddenly became very hot, and I woke up.',
      observation: 'The key changes state immediately before waking.',
      hypothesis: 'The heat may represent your felt concern that acting with permission could still be premature.'
    }],
    provenance: {
      service: 'dreamworld-gbrain', model: 'gpt-5.6-sol', gbrainSource: 'dreamworld',
      gbrainSlug: 'dreams/dreamworld/dream-1', storedInGBrain: true,
      generatedAt: '2026-08-22T02:00:00Z'
    }
  };
}

test('buildRequest binds transcript, evidence, and operation with fingerprints', async () => {
  const request = await requestFixture();
  assert.match(request.transcriptFingerprint, /^[a-f0-9]{64}$/);
  assert.match(request.evidenceFingerprint, /^[a-f0-9]{64}$/);
  assert.match(request.operationID, /^[A-Za-z0-9_-]{12,128}$/);
  assert.equal(request.associations[0].answer, associations[0].answer);
});

test('buildRequest requires a personal association before remote analysis', async () => {
  await assert.rejects(() => GBrain.buildRequest({ dreamID: 'dream-1', transcript, associations: [] }), /personal association/i);
});

test('validateResult accepts only independently verified exact provenance', async () => {
  const request = await requestFixture();
  const result = GBrain.validateResult(resultFixture(request), request);
  assert.equal(result.provenance.storedInGBrain, true);
  assert.match(result.analysis, /tentative reading/i);
  assert.throws(() => GBrain.validateResult({ ...resultFixture(request), dreamID: 'dream-2' }, request), /different dream/i);
  assert.throws(() => GBrain.validateResult({ ...resultFixture(request), transcriptFingerprint: '0'.repeat(64) }, request), /fingerprint/i);
  assert.throws(() => GBrain.validateResult({ ...resultFixture(request), operationID: 'other-operation-id' }, request), /operation/i);
  const badQuote = resultFixture(request);
  badQuote.evidence[0].quote = 'A sentence that never appeared.';
  assert.throws(() => GBrain.validateResult(badQuote, request), /not in this dream/i);
  const forgedSlug = resultFixture(request);
  forgedSlug.provenance.gbrainSlug = 'dreams/dreamworld/different';
  assert.throws(() => GBrain.validateResult(forgedSlug, request), /provenance|slug/i);
  const selfAttested = resultFixture(request);
  selfAttested.provenance.storedInGBrain = false;
  assert.throws(() => GBrain.validateResult(selfAttested, request), /provenance|stored/i);
});

test('analyze is exact-private-origin only, sends no credential, and validates response', async () => {
  const request = await requestFixture();
  assert.equal(GBrain.DEFAULT_ENDPOINT, 'https://hermes-vps.taildf1e1e.ts.net/dreamworld-ai/v1');
  let observed;
  const fetchImpl = async (url, options) => {
    observed = { url, options };
    return { ok: true, status: 200, json: async () => resultFixture(request) };
  };
  const result = await GBrain.analyze(request, { endpoint: 'https://brain.test/v1', fetchImpl, currentOrigin: GBrain.PRIVATE_ORIGIN });
  assert.equal(observed.url, 'https://brain.test/v1/analyze');
  assert.equal(observed.options.credentials, 'omit');
  assert.equal(observed.options.headers.Authorization, undefined);
  assert.equal(result.dreamID, 'dream-1');
});

test('non-private origins cannot transmit even when analyze is called programmatically', async () => {
  const request = await requestFixture();
  let calls = 0;
  const fetchImpl = async () => { calls += 1; throw new Error('must not fetch'); };
  await assert.rejects(() => GBrain.analyze(request, { fetchImpl, currentOrigin: 'https://harristing1206-tech.github.io' }), /owner alpha|private origin/i);
  assert.equal(calls, 0);
});

test('aborting analysis propagates signal and requests verified bridge cancellation', async () => {
  const request = await requestFixture();
  const external = new AbortController();
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    if (url.endsWith('/cancel')) return { ok: true, status: 200, json: async () => ({ cancelled: true, operationID: request.operationID }) };
    external.abort();
    const error = new Error('aborted');
    error.name = 'AbortError';
    throw error;
  };
  await assert.rejects(() => GBrain.analyze(request, { endpoint: 'https://brain.test/v1', fetchImpl, currentOrigin: GBrain.PRIVATE_ORIGIN, signal: external.signal }), /cancelled|timed out/i);
  assert.equal(calls[0].options.signal.aborted, true);
  assert.match(calls[1].url, /\/cancel$/);
  assert.deepEqual(calls[1].body, {
    operationID: request.operationID,
    dreamID: request.dreamID,
    transcriptFingerprint: request.transcriptFingerprint,
    evidenceFingerprint: request.evidenceFingerprint
  });
});

test('delete reuses a persisted operation and binds the original analysis operation', async () => {
  const request = await requestFixture();
  const pending = GBrain.buildDeleteOperation({
    dreamID: request.dreamID,
    transcriptFingerprint: request.transcriptFingerprint,
    evidenceFingerprint: request.evidenceFingerprint,
    analysisOperationID: request.operationID
  });
  const observed = [];
  const fetchImpl = async (url, options) => {
    const body = JSON.parse(options.body);
    observed.push({ url, body });
    return { ok: true, status: 200, json: async () => ({ deleted: true, operationID: body.operationID }) };
  };
  const first = await GBrain.deleteRemote(request, { deleteOperation: pending, endpoint: 'https://brain.test/v1', fetchImpl, currentOrigin: GBrain.PRIVATE_ORIGIN });
  const retriedPending = GBrain.buildDeleteOperation({
    dreamID: request.dreamID,
    transcriptFingerprint: request.transcriptFingerprint,
    evidenceFingerprint: request.evidenceFingerprint,
    analysisOperationID: request.operationID
  }, JSON.parse(JSON.stringify(pending)));
  const retried = await GBrain.deleteRemote(request, { deleteOperation: retriedPending, endpoint: 'https://brain.test/v1', fetchImpl, currentOrigin: GBrain.PRIVATE_ORIGIN });
  assert.equal(first.deleted, true);
  assert.equal(retried.deleted, true);
  assert.equal(observed[0].body.operationID, pending.operationID);
  assert.equal(observed[1].body.operationID, pending.operationID);
  assert.equal(observed[0].body.analysisOperationID, request.operationID);
  assert.equal(observed[0].body.transcriptFingerprint, request.transcriptFingerprint);
  assert.equal(observed[0].body.evidenceFingerprint, request.evidenceFingerprint);
  assert.equal(GBrain.deleteOperationKey(request.dreamID), `dreamworld:gbrain-delete:${request.dreamID}`);
});

test('analyze exposes owner-only denial without changing local data', async () => {
  const request = await requestFixture();
  const fetchImpl = async () => ({ ok: false, status: 403, json: async () => ({ error: 'Owner Tailscale identity required.' }) });
  await assert.rejects(() => GBrain.analyze(request, { fetchImpl, currentOrigin: GBrain.PRIVATE_ORIGIN }), /Tailscale identity/i);
});
