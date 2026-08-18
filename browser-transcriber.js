(function attachBrowserDreamTranscriber(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BrowserDreamTranscriber = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function makeBrowserDreamTranscriberAPI(root) {
  async function decodeAudioBlob(blob, targetSampleRate = 16000) {
    if (!blob || typeof blob.arrayBuffer !== 'function') {
      throw new Error('A saved recording is required before transcription.');
    }

    const AudioContextClass = root.AudioContext || root.webkitAudioContext;
    if (!AudioContextClass) throw new Error('This browser cannot decode the saved recording.');

    const context = new AudioContextClass();
    try {
      const decoded = await context.decodeAudioData(await blob.arrayBuffer());
      const mono = new Float32Array(decoded.length);
      for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
        const samples = decoded.getChannelData(channel);
        for (let index = 0; index < samples.length; index += 1) {
          mono[index] += samples[index] / decoded.numberOfChannels;
        }
      }

      if (decoded.sampleRate === targetSampleRate) return mono;

      const ratio = decoded.sampleRate / targetSampleRate;
      const outputLength = Math.max(1, Math.round(mono.length / ratio));
      const resampled = new Float32Array(outputLength);
      for (let index = 0; index < outputLength; index += 1) {
        const sourcePosition = index * ratio;
        const lower = Math.floor(sourcePosition);
        const upper = Math.min(lower + 1, mono.length - 1);
        const fraction = sourcePosition - lower;
        resampled[index] = mono[lower] * (1 - fraction) + mono[upper] * fraction;
      }
      return resampled;
    } finally {
      if (typeof context.close === 'function') await context.close();
    }
  }

  function createTranscriptionWorkerClient(workerURL = './transcription-worker.js') {
    if (typeof root.Worker !== 'function') {
      throw new Error('This browser cannot run local transcription workers.');
    }

    const worker = new root.Worker(workerURL, { type: 'module' });
    const pending = new Map();
    let nextID = 1;

    worker.addEventListener('message', event => {
      const message = event.data || {};
      const request = pending.get(message.id);
      if (!request) return;

      if (message.status === 'complete') {
        pending.delete(message.id);
        request.resolve(String(message.text || '').trim());
      } else if (message.status === 'error') {
        pending.delete(message.id);
        request.reject(new Error(message.message || 'Local transcription failed.'));
      } else {
        request.onProgress?.(message);
      }
    });

    worker.addEventListener('error', event => {
      const error = new Error(event.message || 'Local transcription worker failed.');
      for (const request of pending.values()) request.reject(error);
      pending.clear();
    });

    return {
      transcribe(audio, onProgress, options = {}) {
        const id = nextID;
        nextID += 1;
        return new Promise((resolve, reject) => {
          pending.set(id, { resolve, reject, onProgress });
          worker.postMessage({ type: 'transcribe', id, audio, modelID: options.modelID }, [audio.buffer]);
        });
      }
    };
  }

  function createBrowserDreamTranscriber(options = {}) {
    const decoder = options.decoder || decodeAudioBlob;
    const workerClient = options.workerClient || createTranscriptionWorkerClient(options.workerURL);

    return {
      async transcribe(recordingBlob, onProgress, options = {}) {
        if (!recordingBlob) throw new Error('A saved recording is required before transcription.');
        onProgress?.({ status: 'decoding' });
        const audio = await decoder(recordingBlob);
        if (!(audio instanceof Float32Array) || audio.length === 0) {
          throw new Error('The saved recording did not contain decodable audio.');
        }
        const text = String(await workerClient.transcribe(audio, onProgress, options) || '').trim();
        if (!text) throw new Error('No speech was found in the recording.');
        return text;
      }
    };
  }

  return { decodeAudioBlob, createTranscriptionWorkerClient, createBrowserDreamTranscriber };
});
