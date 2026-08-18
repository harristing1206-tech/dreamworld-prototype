(function attachDreamDialogueFlow(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DreamDialogueFlow = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function makeDreamDialogueFlowAPI() {
  function createDreamDialogueFlow() {
    let phase = 'ready';
    let transcript = '';

    return {
      get phase() { return phase; },
      get transcript() { return transcript; },

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
        phase = 'transcriptReady';
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
      }
    };
  }

  return { createDreamDialogueFlow };
});
