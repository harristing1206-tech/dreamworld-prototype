import { env, pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.3';

env.allowLocalModels = false;
env.useBrowserCache = true;

const DEFAULT_MODEL_ID = 'Xenova/whisper-tiny';
const ALLOWED_MODEL_IDS = new Set([
  'Xenova/whisper-tiny',
  'Xenova/whisper-tiny.en',
  'Xenova/whisper-base',
  'Xenova/whisper-base.en',
  'Xenova/whisper-small',
  'Xenova/whisper-small.en'
]);

let activeModelID = null;
let transcriberPromise = null;

function getTranscriber(id, modelID) {
  if (!ALLOWED_MODEL_IDS.has(modelID)) {
    throw new Error('The selected transcription model is not supported.');
  }

  if (!transcriberPromise || activeModelID !== modelID) {
    activeModelID = modelID;
    transcriberPromise = pipeline('automatic-speech-recognition', modelID, {
      device: 'wasm',
      dtype: 'q8',
      progress_callback: progress => {
        self.postMessage({
          id,
          modelID,
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

  const modelID = event.data.modelID || DEFAULT_MODEL_ID;
  try {
    self.postMessage({ id, modelID, status: 'loading-model' });
    const transcriber = await getTranscriber(id, modelID);
    self.postMessage({ id, modelID, status: 'transcribing' });
    const generationOptions = {
      chunk_length_s: 30,
      stride_length_s: 5
    };
    if (!modelID.endsWith('.en')) generationOptions.task = 'transcribe';
    const result = await transcriber(audio, generationOptions);
    self.postMessage({ id, modelID, status: 'complete', text: String(result?.text || '').trim() });
  } catch (error) {
    transcriberPromise = null;
    activeModelID = null;
    self.postMessage({
      id,
      modelID,
      status: 'error',
      message: error instanceof Error ? error.message : 'Local transcription failed.'
    });
  }
});
