const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const errors=[];let audioContexts=0;
const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error));
const dom=new JSDOM(source,{runScripts:'dangerously',url:'https://preview.test/voice-reduced-motion',pretendToBeVisual:true,virtualConsole:vc,beforeParse(window){
  window.matchMedia=query=>({matches:query.includes('prefers-reduced-motion'),addEventListener(){},removeEventListener(){}});
  window.navigator.mediaDevices={getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})};
  class Recorder{static isTypeSupported(){return true}constructor(_stream,options={}){this.mimeType=options.mimeType||'audio/webm';this.state='inactive'}start(){this.state='recording'}stop(){this.state='inactive';this.ondataavailable?.({data:new window.Blob(['audio'],{type:this.mimeType})});this.onstop?.()}}
  window.MediaRecorder=Recorder;
  window.AudioContext=class{constructor(){audioContexts++}};
  window.Audio=class{play(){return Promise.resolve()}pause(){}};
  window.URL.createObjectURL=()=> 'blob:test';window.URL.revokeObjectURL=()=>{};
}});
const d=dom.window.document,wait=ms=>new Promise(resolve=>dom.window.setTimeout(resolve,ms));
(async()=>{
  d.querySelector('[data-tab="log"]').click();d.getElementById('startRecording').click();await wait(40);
  const visual=d.getElementById('voiceVisual');
  assert.equal(d.querySelector('[data-log-state="recording"]').classList.contains('active'),true,'recording itself should still work with reduced motion');
  assert.equal(audioContexts,0,'reduced motion started microphone analysis animation');
  assert.equal(visual.dataset.reactive,'false');assert.equal(visual.dataset.energy,'idle');assert.equal(visual.style.getPropertyValue('--voice-level'),'0');
  d.getElementById('stopRecording').click();await wait(30);assert.deepEqual(errors,[]);
  console.log('DREAMWORLD_AUDIO_REACTIVE_AVATAR_REDUCED_MOTION_VERIFIED');dom.window.close();
})().catch(error=>{console.error(error);dom.window.close();process.exitCode=1});
