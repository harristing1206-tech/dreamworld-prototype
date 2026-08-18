import { env, pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.3';

env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_ID = 'Xenova/whisper-tiny';
let transcriberPromise = null;
let activeRequestID = null;

function getTranscriber(id) {
  activeRequestID = id;
  if (!transcriberPromise) {
    transcriberPromise = pipeline('automatic-speech-recognition', MODEL_ID, {
      device: 'wasm',
      dtype: 'q8',
      progress_callback: progress => {
        self.postMessage({
          id: activeRequestID,
          status: 'model-progress',
          file: progress.file || '',
          progress: Number.isFinite(progress.progress) ? progress.progress : null
        });
      }
    });
  }
  return transcriberPromise;
}

self.addEventListener('message', async event => {
  const { type, id, audio } = event.data || {};
  if (type !== 'transcribe' || !id) return;

  try {
    self.postMessage({ id, status: 'loading-model' });
    const transcriber = await getTranscriber(id);
    self.postMessage({ id, status: 'transcribing' });
    const result = await transcriber(audio, {
      task: 'transcribe',
      chunk_length_s: 30,
      stride_length_s: 5
    });
    self.postMessage({ id, status: 'complete', text: String(result?.text || '').trim() });
  } catch (error) {
    transcriberPromise = null;
    self.postMessage({
      id,
      status: 'error',
      message: error instanceof Error ? error.message : 'Local transcription failed.'
    });
  }
});
