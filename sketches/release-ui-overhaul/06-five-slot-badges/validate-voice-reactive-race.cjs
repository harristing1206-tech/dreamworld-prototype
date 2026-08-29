const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const errors=[],contexts=[];
const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error));
const dom=new JSDOM(source,{runScripts:'dangerously',url:'https://preview.test/voice-race',pretendToBeVisual:true,virtualConsole:vc,beforeParse(window){
  window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  window.navigator.mediaDevices={getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})};
  class Recorder{static isTypeSupported(){return true}constructor(_stream,options={}){this.mimeType=options.mimeType||'audio/webm';this.state='inactive'}start(){this.state='recording'}stop(){this.state='inactive';this.ondataavailable?.({data:new window.Blob(['audio'],{type:this.mimeType})});this.onstop?.()}}
  window.MediaRecorder=Recorder;
  class AudioContext{constructor(){this.closed=false;this.analyserCreated=false;this.resumePromise=new Promise(resolve=>{this.resolveResume=resolve});contexts.push(this)}resume(){return this.resumePromise}createAnalyser(){this.analyserCreated=true;return{fftSize:512,smoothingTimeConstant:0,connect(){},disconnect(){},getByteTimeDomainData(samples){samples.fill(128)}}}createMediaStreamSource(){return{connect(){},disconnect(){}}}close(){this.closed=true;return Promise.resolve()}}
  window.AudioContext=AudioContext;
  window.Audio=class{play(){return Promise.resolve()}pause(){}};
  window.URL.createObjectURL=()=> 'blob:test';window.URL.revokeObjectURL=()=>{};
}});
const d=dom.window.document,wait=ms=>new Promise(resolve=>dom.window.setTimeout(resolve,ms));
(async()=>{
  d.querySelector('[data-tab="log"]').click();
  d.getElementById('startRecording').click();await wait(15);
  assert.equal(contexts.length,1);
  d.getElementById('stopRecording').click();await wait(30);
  d.getElementById('recordAgain').click();await wait(30);
  d.getElementById('startRecording').click();await wait(15);
  assert.equal(contexts.length,2);
  const [first,second]=contexts;
  assert.equal(second.closed,false);
  first.resolveResume();await wait(30);
  assert.equal(first.analyserCreated,false,'stale first start created an analyser after cancellation');
  assert.equal(second.analyserCreated,false,'stale first start mutated the newer audio context');
  assert.equal(second.closed,false,'stale first start closed the newer audio context');
  second.resolveResume();await wait(50);
  assert.equal(second.analyserCreated,true);
  assert.equal(d.getElementById('voiceVisual').dataset.reactive,'true');
  d.getElementById('stopRecording').click();await wait(30);
  assert.equal(second.closed,true);
  assert.deepEqual(errors,[]);
  console.log('DREAMWORLD_AUDIO_REACTIVE_AVATAR_RACE_VERIFIED');dom.window.close();
})().catch(error=>{console.error(error);dom.window.close();process.exitCode=1});
