const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const errors=[],vc=new VirtualConsole();
vc.on('jsdomError',error=>errors.push(error));
let contextClosed=false,sourceDisconnected=false;
const dom=new JSDOM(source,{runScripts:'dangerously',url:'https://preview.test/voice-reactive',pretendToBeVisual:true,virtualConsole:vc,beforeParse(window){
  window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  window.navigator.mediaDevices={getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})};
  class Recorder{static isTypeSupported(){return true}constructor(_stream,options={}){this.mimeType=options.mimeType||'audio/webm';this.state='inactive'}start(){this.state='recording'}stop(){this.state='inactive';this.ondataavailable?.({data:new window.Blob(['audio'],{type:this.mimeType})});this.onstop?.()}}
  window.MediaRecorder=Recorder;
  class AudioContext{constructor(){this.state='running'}resume(){return Promise.resolve()}createAnalyser(){return{fftSize:512,smoothingTimeConstant:0,connect(){},disconnect(){},getByteTimeDomainData(samples){for(let i=0;i<samples.length;i++)samples[i]=i%2?164:92}}}createMediaStreamSource(){return{connect(){},disconnect(){sourceDisconnected=true}}}close(){this.state='closed';contextClosed=true;return Promise.resolve()}}
  window.AudioContext=AudioContext;
  window.Audio=class{play(){return Promise.resolve()}pause(){}};
  window.URL.createObjectURL=()=> 'blob:test';window.URL.revokeObjectURL=()=>{};
}});
const d=dom.window.document,wait=ms=>new Promise(resolve=>dom.window.setTimeout(resolve,ms));
(async()=>{
  assert.equal(d.querySelectorAll('#voiceVisual #voiceCanvas').length,1,'Canvas voice field missing');
  assert.equal(d.querySelector('#voiceVisual svg'),null,'legacy SVG remains in the recording visualization');
  assert.equal(d.querySelector('.voice-avatar-face'),null,'face remains in the recording visualization');
  assert.equal(d.querySelector('.voice-orb'),null,'old abstract voice blobs remain');
  assert.doesNotMatch(source,/voice-abstract-layer|voice-abstract-svg|\.voice-orb/,'legacy voice renderer remains');
  assert.match(source,/const VOICE_PARTICLE_COUNT=84/,'persistent particle field missing');
  assert.match(source,/const drawVoiceField=/,'Canvas draw loop missing');
  assert.match(source,/1-Math\.exp\(-deltaTime\/timeConstant\)/,'frame-rate-independent envelope missing');
  assert.match(source,/const VOICE_RING_TAU=\[\.06,\.11,\.18,\.26\]/,'lagged ring envelopes missing');
  assert.match(source,/\.stop\{[^}]*margin-inline:auto[^}]*display:grid/,'recording stop control lacks layout-independent centering');
  assert.match(source,/speakingThreshold=\.14,listeningThreshold=\.08/,'speaking-state hysteresis thresholds missing');
  assert.match(source,/if\(nextEnergy!==energyState\)/,'energy state is rewritten every animation frame');
  assert.equal(d.querySelector('.wave'),null,'decorative waveform remains');
  assert.match(source,/createMediaStreamSource\(stream\)/);
  assert.match(source,/getByteTimeDomainData\(samples\)/);
  assert.match(source,/Math\.sqrt\(energy\/samples\.length\)/);
  assert.match(source,/prefers-reduced-motion: reduce/);
  d.querySelector('[data-tab="log"]').click();d.getElementById('startRecording').click();await wait(80);
  const visual=d.getElementById('voiceVisual'),level=Number(visual.style.getPropertyValue('--voice-level'));
  assert.equal(visual.dataset.reactive,'true');assert.equal(visual.dataset.energy,'speaking');assert.ok(level>.04,`expected microphone-driven level, got ${level}`);
  d.getElementById('stopRecording').click();await wait(30);
  assert.equal(visual.dataset.reactive,'false');assert.equal(visual.dataset.energy,'idle');assert.equal(visual.style.getPropertyValue('--voice-level'),'0');
  assert.ok(contextClosed);assert.ok(sourceDisconnected);assert.deepEqual(errors,[]);
  console.log('DREAMWORLD_AUDIO_REACTIVE_CANVAS_FIELD_VERIFIED');dom.window.close();
})().catch(error=>{console.error(error);dom.window.close();process.exitCode=1});
