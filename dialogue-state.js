(function attachDreamDialogueFlow(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DreamDialogueFlow = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function makeDreamDialogueFlowAPI() {
  function createDreamDialogueFlow() {
    let phase = 'ready';
    let transcript = '';
    let error = '';

    return {
      get phase() { return phase; },
      get transcript() { return transcript; },
      get error() { return error; },

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
      }
    };
  }

  return { createDreamDialogueFlow };
});
