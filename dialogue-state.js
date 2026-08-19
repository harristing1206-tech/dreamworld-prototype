(function attachDreamDialogueFlow(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DreamDialogueFlow = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function makeDreamDialogueFlowAPI() {
  function createSafeStorage(storage) {
    const fallback = new Map();
    const overlays = new Set();
    const tombstones = new Set();

    return {
      get(key) {
        if (tombstones.has(key)) return null;
        if (overlays.has(key)) return fallback.get(key) ?? null;

        try {
          if (storage?.getItem) {
            const value = storage.getItem(key);
            if (value === null) fallback.delete(key);
            else fallback.set(key, value);
            return value;
          }
        } catch (_) {}
        return fallback.get(key) ?? null;
      },

      set(key, value) {
        const normalized = String(value);
        fallback.set(key, normalized);
        tombstones.delete(key);
        try {
          if (!storage?.setItem) {
            overlays.add(key);
            return false;
          }
          storage.setItem(key, normalized);
          overlays.delete(key);
          return true;
        } catch (_) {
          overlays.add(key);
          return false;
        }
      },

      remove(key) {
        fallback.delete(key);
        overlays.delete(key);
        try {
          if (!storage?.removeItem) {
            tombstones.add(key);
            return false;
          }
          storage.removeItem(key);
          tombstones.delete(key);
          return true;
        } catch (_) {
          tombstones.add(key);
          return false;
        }
      }
    };
  }

  function resolveCaptureSource({ textDraft = '', hasAudio = false } = {}) {
    const hasText = String(textDraft || '').trim().length > 0;
    if (hasText && hasAudio) throw new Error('Capture contains both text and audio. Choose one before logging.');
    if (hasText) return 'text';
    if (hasAudio) return 'audio';
    return null;
  }

  function createDreamDialogueFlow() {
    let phase = 'ready';
    let transcript = '';
    let error = '';
    let source = '';

    return {
      get phase() { return phase; },
      get transcript() { return transcript; },
      get error() { return error; },
      get source() { return source; },

      saveTextDraft(text, inputSource = 'user-entered') {
        if (phase !== 'ready') return false;
        const normalized = String(text || '').trim();
        if (!normalized) return false;
        transcript = normalized;
        source = inputSource;
        phase = 'transcriptReady';
        return true;
      },

      saveDraft() {
        if (phase !== 'ready') return false;
        phase = 'savedDraft';
        return true;
      },

      logDream() {
        if (phase !== 'savedDraft') return false;
        phase = 'transcribing';
        return true;
      },

      completeTranscript(text) {
        if (phase !== 'transcribing') return false;
        transcript = String(text || '').trim();
        error = '';
        source = 'browser-local-whisper';
        phase = 'transcriptReady';
        return true;
      },

      failTranscription(message) {
        if (phase !== 'transcribing') return false;
        error = String(message || 'Local transcription failed.');
        phase = 'transcriptionFailed';
        return true;
      },

      retryTranscription() {
        if (phase !== 'transcriptionFailed') return false;
        error = '';
        phase = 'transcribing';
        return true;
      },

      finishDialogue() {
        if (phase !== 'transcriptReady') return false;
        phase = 'logged';
        return true;
      },

      reset() {
        phase = 'ready';
        transcript = '';
        error = '';
        source = '';
      }
    };
  }

  return { createDreamDialogueFlow, createSafeStorage, resolveCaptureSource };
});
