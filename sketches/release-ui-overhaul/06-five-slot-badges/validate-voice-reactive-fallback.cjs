const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const errors=[],unhandled=[];
const onUnhandled=reason=>unhandled.push(reason);process.on('unhandledRejection',onUnhandled);
const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error));
const dom=new JSDOM(source,{runScripts:'dangerously',url:'https://preview.test/voice-fallback',pretendToBeVisual:true,virtualConsole:vc,beforeParse(window){
  window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  window.navigator.mediaDevices={getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})};
  class Recorder{static isTypeSupported(){return true}constructor(_stream,options={}){this.mimeType=options.mimeType||'audio/webm';this.state='inactive'}start(){this.state='recording'}stop(){this.state='inactive';this.ondataavailable?.({data:new window.Blob(['audio'],{type:this.mimeType})});this.onstop?.()}}
  window.MediaRecorder=Recorder;
  window.AudioContext=class{constructor(){throw new Error('AudioContext unavailable')}};
  window.Audio=class{play(){return Promise.resolve()}pause(){}};
  window.URL.createObjectURL=()=> 'blob:test';window.URL.revokeObjectURL=()=>{};
}});
const d=dom.window.document,wait=ms=>new Promise(resolve=>dom.window.setTimeout(resolve,ms));
(async()=>{
  d.querySelector('[data-tab="log"]').click();d.getElementById('startRecording').click();await wait(50);
  const visual=d.getElementById('voiceVisual');
  assert.equal(d.querySelector('[data-log-state="recording"]').classList.contains('active'),true,'recording should survive Web Audio construction failure');
  assert.equal(visual.dataset.reactive,'false');assert.equal(visual.dataset.energy,'idle');assert.equal(unhandled.length,0,'AudioContext constructor failure escaped as an unhandled rejection');
  d.getElementById('stopRecording').click();await wait(30);assert.deepEqual(errors,[]);
  process.off('unhandledRejection',onUnhandled);console.log('DREAMWORLD_AUDIO_REACTIVE_AVATAR_FALLBACK_VERIFIED');dom.window.close();
})().catch(error=>{process.off('unhandledRejection',onUnhandled);console.error(error);dom.window.close();process.exitCode=1});
