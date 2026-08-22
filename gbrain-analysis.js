(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DreamworldGBrain = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CLIENT_VERSION = 1;
  const RESPONSE_SCHEMA_VERSION = 1;
  const PRIVATE_ORIGIN = 'https://hermes-vps.taildf1e1e.ts.net';
  const DEFAULT_ENDPOINT = `${PRIVATE_ORIGIN}/dreamworld-ai/v1`;
  const MAX_TRANSCRIPT_LENGTH = 12000;
  const MAX_ANALYSIS_LENGTH = 6000;
  const MAX_QUESTION_LENGTH = 500;
  const MAX_EVIDENCE_ITEMS = 8;
  const REQUEST_TIMEOUT_MS = 60000;

  function clean(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function currentBrowserOrigin() {
    try { return globalThis.location?.origin || ''; } catch (_) { return ''; }
  }

  function isPrivateOrigin(origin = currentBrowserOrigin()) {
    return clean(origin).replace(/\/$/, '') === PRIVATE_ORIGIN;
  }

  function requirePrivateOrigin(origin) {
    if (!isPrivateOrigin(origin)) {
      throw new Error('Private AI is available only in the owner alpha on its exact private origin. This page remains local/offline and will not transmit dream data.');
    }
  }

  function createOperationID(prefix = 'analysis') {
    let random = '';
    if (globalThis.crypto?.randomUUID) random = globalThis.crypto.randomUUID().replace(/-/g, '');
    else if (globalThis.crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      random = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    } else if (typeof require === 'function') {
      random = require('node:crypto').randomBytes(16).toString('hex');
    } else {
      throw new Error('Secure operation identity is unavailable in this browser.');
    }
    return `${prefix}-${random}`.slice(0, 128);
  }

  function cacheKey(dreamID) {
    return `dreamworld:gbrain-analysis:${clean(dreamID)}`;
  }

  function deleteOperationKey(dreamID) {
    return `dreamworld:gbrain-delete:${clean(dreamID)}`;
  }

  function buildDeleteOperation(identity, existing = null) {
    const expected = {
      dreamID: clean(identity?.dreamID),
      transcriptFingerprint: clean(identity?.transcriptFingerprint),
      evidenceFingerprint: clean(identity?.evidenceFingerprint),
      analysisOperationID: clean(identity?.analysisOperationID)
    };
    if (!expected.dreamID || !/^[a-f0-9]{64}$/.test(expected.transcriptFingerprint)
      || !/^[a-f0-9]{64}$/.test(expected.evidenceFingerprint)
      || !/^[A-Za-z0-9][A-Za-z0-9_-]{11,127}$/.test(expected.analysisOperationID)) {
      throw new Error('The private deletion identity is invalid.');
    }
    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      const operationID = clean(existing.operationID);
      if (/^[A-Za-z0-9][A-Za-z0-9_-]{11,127}$/.test(operationID)
        && Object.entries(expected).every(([key, value]) => clean(existing[key]) === value)) {
        return { operationID, ...expected };
      }
      throw new Error('The pending private deletion belongs to different evidence.');
    }
    return { operationID: createOperationID('delete'), ...expected };
  }

  async function sha256(value) {
    const text = String(value ?? '');
    if (globalThis.crypto?.subtle && typeof TextEncoder !== 'undefined') {
      const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    }
    if (typeof require === 'function') {
      return require('node:crypto').createHash('sha256').update(text).digest('hex');
    }
    throw new Error('SHA-256 is unavailable in this browser.');
  }

  function normalizeAssociations(associations) {
    if (!Array.isArray(associations)) return [];
    return associations.slice(0, 3).map(item => ({
      questionID: clean(item?.questionID).slice(0, 80),
      focus: clean(item?.focus).slice(0, 120),
      question: clean(item?.question).slice(0, 800),
      answer: clean(item?.answer).slice(0, 600)
    })).filter(item => item.questionID && item.focus && item.question && item.answer);
  }

  async function buildRequest({ dreamID, title, transcript, source, associations }) {
    const normalizedDreamID = clean(dreamID);
    const normalizedTranscript = clean(transcript);
    if (!normalizedDreamID) throw new Error('A dream ID is required.');
    if (normalizedTranscript.length < 20) throw new Error('The transcript is too short for AI analysis.');
    if (normalizedTranscript.length > MAX_TRANSCRIPT_LENGTH) throw new Error('The transcript is too long for AI analysis.');
    const normalizedAssociations = normalizeAssociations(associations);
    if (!normalizedAssociations.length) throw new Error('At least one personal association is required before AI analysis.');
    return {
      clientVersion: CLIENT_VERSION,
      operationID: createOperationID('analysis'),
      dreamID: normalizedDreamID,
      title: clean(title).slice(0, 160) || 'Untitled dream',
      transcript: normalizedTranscript,
      source: clean(source).slice(0, 80) || 'unknown',
      associations: normalizedAssociations,
      transcriptFingerprint: await sha256(normalizedTranscript),
      evidenceFingerprint: await sha256(JSON.stringify(normalizedAssociations))
    };
  }

  function validateResult(raw, request) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('The AI service returned an invalid response.');
    if (raw.schemaVersion !== RESPONSE_SCHEMA_VERSION) throw new Error('The AI response schema is unsupported.');
    if (clean(raw.operationID) !== request.operationID) throw new Error('The AI response operation identity does not match.');
    if (clean(raw.dreamID) !== request.dreamID) throw new Error('The AI response belongs to a different dream.');
    if (clean(raw.transcriptFingerprint) !== request.transcriptFingerprint) throw new Error('The AI response transcript fingerprint does not match.');
    if (clean(raw.evidenceFingerprint) !== request.evidenceFingerprint) throw new Error('The AI response interview fingerprint does not match.');
    const analysis = clean(raw.analysis);
    const closingQuestion = clean(raw.closingQuestion);
    if (analysis.length < 80 || analysis.length > MAX_ANALYSIS_LENGTH) throw new Error('The AI analysis has an invalid length.');
    if (closingQuestion.length < 10 || closingQuestion.length > MAX_QUESTION_LENGTH) throw new Error('The AI closing question has an invalid length.');
    if (!Array.isArray(raw.evidence) || raw.evidence.length < 1 || raw.evidence.length > MAX_EVIDENCE_ITEMS) throw new Error('The AI response must cite dream evidence.');
    const evidence = raw.evidence.map(item => {
      const quote = clean(item?.quote);
      const observation = clean(item?.observation);
      const hypothesis = clean(item?.hypothesis);
      if (!quote || !request.transcript.includes(quote)) throw new Error('The AI response cited text that is not in this dream.');
      if (!observation || !hypothesis) throw new Error('The AI evidence entry is incomplete.');
      return { quote: quote.slice(0, 800), observation: observation.slice(0, 1000), hypothesis: hypothesis.slice(0, 1200) };
    });
    const provenance = raw.provenance && typeof raw.provenance === 'object' && !Array.isArray(raw.provenance) ? raw.provenance : {};
    const expectedSlug = `dreams/dreamworld/${request.dreamID}`;
    if (clean(provenance.service) !== 'dreamworld-gbrain'
      || provenance.storedInGBrain !== true
      || clean(provenance.gbrainSlug) !== expectedSlug
      || clean(provenance.gbrainSource) !== 'dreamworld') {
      throw new Error('The AI response provenance or verified GBrain slug is invalid.');
    }
    return {
      schemaVersion: RESPONSE_SCHEMA_VERSION,
      operationID: request.operationID,
      dreamID: request.dreamID,
      transcriptFingerprint: request.transcriptFingerprint,
      evidenceFingerprint: request.evidenceFingerprint,
      analysis,
      closingQuestion,
      evidence,
      provenance: {
        service: 'dreamworld-gbrain',
        model: clean(provenance.model).slice(0, 160) || 'Hermes model',
        gbrainSource: 'dreamworld',
        gbrainSlug: expectedSlug,
        storedInGBrain: true,
        generatedAt: clean(provenance.generatedAt).slice(0, 80)
      }
    };
  }

  function isMatchingResult(result, request) {
    try { validateCachedResult(result, request); return true; } catch (_) { return false; }
  }

  function validateCachedResult(raw, request) {
    const operationID = clean(raw?.operationID);
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{11,127}$/.test(operationID)) throw new Error('The cached AI provenance operation is invalid.');
    return validateResult(raw, { ...request, operationID });
  }

  function cancellationIdentity(request) {
    return {
      operationID: request.operationID,
      dreamID: request.dreamID,
      transcriptFingerprint: request.transcriptFingerprint,
      evidenceFingerprint: request.evidenceFingerprint
    };
  }

  async function fetchJSON(url, body, { fetchImpl, signal } = {}) {
    const response = await fetchImpl(url, {
      method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body), signal
    });
    const payload = await response.json().catch(() => null);
    return { response, payload };
  }

  async function cancelOperation(request, { endpoint = DEFAULT_ENDPOINT, fetchImpl = globalThis.fetch, timeoutMs = REQUEST_TIMEOUT_MS, currentOrigin = currentBrowserOrigin() } = {}) {
    requirePrivateOrigin(currentOrigin);
    if (typeof fetchImpl !== 'function') throw new Error('Network requests are unavailable in this browser.');
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const { response, payload } = await fetchJSON(`${String(endpoint).replace(/\/$/, '')}/cancel`, cancellationIdentity(request), { fetchImpl, signal: controller?.signal });
      if (!response.ok || payload?.cancelled !== true || clean(payload.operationID) !== request.operationID) {
        throw new Error(clean(payload?.error) || 'The bridge could not verify cancellation without an orphaned write.');
      }
      return true;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function analyze(request, { endpoint = DEFAULT_ENDPOINT, fetchImpl = globalThis.fetch, timeoutMs = REQUEST_TIMEOUT_MS, currentOrigin = currentBrowserOrigin(), signal = null } = {}) {
    requirePrivateOrigin(currentOrigin);
    if (typeof fetchImpl !== 'function') throw new Error('Network requests are unavailable in this browser.');
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const abortFromCaller = () => controller?.abort();
    if (signal?.aborted) abortFromCaller();
    else signal?.addEventListener?.('abort', abortFromCaller, { once: true });
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const { response, payload } = await fetchJSON(`${String(endpoint).replace(/\/$/, '')}/analyze`, request, { fetchImpl, signal: controller?.signal });
      if (controller?.signal.aborted) {
        const error = new Error('aborted'); error.name = 'AbortError'; throw error;
      }
      if (!response.ok) {
        const detail = clean(payload?.error);
        throw new Error(detail || (response.status === 403 ? 'Private GBrain analysis requires the owner’s Tailscale identity.' : `Private GBrain analysis failed (${response.status}).`));
      }
      return validateResult(payload, request);
    } catch (error) {
      if (error?.name === 'AbortError' || controller?.signal.aborted || signal?.aborted) {
        try {
          await cancelOperation(request, { endpoint, fetchImpl, timeoutMs, currentOrigin });
          throw new Error('Private GBrain analysis was cancelled and the bridge verified that no active copy remained.');
        } catch (cancelError) {
          if (/cancelled and the bridge verified/i.test(cancelError?.message || '')) throw cancelError;
          throw new Error('Private GBrain analysis timed out. The bridge could not yet verify cancellation; do not assume remote storage state.');
        }
      }
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
      signal?.removeEventListener?.('abort', abortFromCaller);
    }
  }

  async function deleteRemote(request, { deleteOperation, endpoint = DEFAULT_ENDPOINT, fetchImpl = globalThis.fetch, timeoutMs = REQUEST_TIMEOUT_MS, currentOrigin = currentBrowserOrigin(), signal = null } = {}) {
    requirePrivateOrigin(currentOrigin);
    if (typeof fetchImpl !== 'function') throw new Error('Network requests are unavailable in this browser.');
    const operation = buildDeleteOperation({
      dreamID: request.dreamID,
      transcriptFingerprint: request.transcriptFingerprint,
      evidenceFingerprint: request.evidenceFingerprint,
      analysisOperationID: request.operationID
    }, deleteOperation);
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const abortFromCaller = () => controller?.abort();
    if (signal?.aborted) abortFromCaller();
    else signal?.addEventListener?.('abort', abortFromCaller, { once: true });
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const body = {
        ...operation
      };
      const { response, payload } = await fetchJSON(`${String(endpoint).replace(/\/$/, '')}/delete`, body, { fetchImpl, signal: controller?.signal });
      if (controller?.signal.aborted) throw new Error('Private GBrain deletion was interrupted; remote deletion state was not claimed.');
      if (!response.ok || payload?.deleted !== true || clean(payload.operationID) !== operation.operationID) throw new Error(clean(payload?.error) || 'The private GBrain copy could not be deleted and verified.');
      return { deleted: true, operationID: operation.operationID };
    } finally {
      if (timer) clearTimeout(timer);
      signal?.removeEventListener?.('abort', abortFromCaller);
    }
  }

  return {
    CLIENT_VERSION,
    RESPONSE_SCHEMA_VERSION,
    PRIVATE_ORIGIN,
    DEFAULT_ENDPOINT,
    REQUEST_TIMEOUT_MS,
    isPrivateOrigin,
    createOperationID,
    cacheKey,
    deleteOperationKey,
    buildDeleteOperation,
    sha256,
    normalizeAssociations,
    buildRequest,
    validateResult,
    validateCachedResult,
    isMatchingResult,
    cancelOperation,
    analyze,
    deleteRemote
  };
});
