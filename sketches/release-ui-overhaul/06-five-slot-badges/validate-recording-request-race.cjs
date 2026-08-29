const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const requests=[],recorders=[],errors=[];
const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error));
const dom=new JSDOM(source,{runScripts:'dangerously',url:'https://preview.test/recording-request-race',pretendToBeVisual:true,virtualConsole:vc,beforeParse(window){
  window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  window.navigator.mediaDevices={getUserMedia:()=>new Promise(resolve=>requests.push(resolve))};
  class Recorder{static isTypeSupported(){return true}constructor(stream,options={}){this.stream=stream;this.mimeType=options.mimeType||'audio/webm';this.state='inactive';recorders.push(this)}start(){this.state='recording'}stop(){this.state='inactive';this.ondataavailable?.({data:new window.Blob(['audio'],{type:this.mimeType})});this.onstop?.()}}
  window.MediaRecorder=Recorder;window.AudioContext=undefined;window.webkitAudioContext=undefined;
  window.Audio=class{play(){return Promise.resolve()}pause(){}};window.URL.createObjectURL=()=> 'blob:test';window.URL.revokeObjectURL=()=>{};
}});
const d=dom.window.document,wait=ms=>new Promise(resolve=>dom.window.setTimeout(resolve,ms));
const makeStream=()=>{const track={stopped:false,stop(){this.stopped=true}};return{track,stream:{getTracks:()=>[track]}}};
(async()=>{
  d.querySelector('[data-tab="log"]').click();d.getElementById('startRecording').click();d.getElementById('startRecording').click();await wait(15);
  assert.equal(requests.length,1,'concurrent start taps opened multiple microphone requests');
  d.querySelector('[data-tab="history"]').click();const stale=makeStream();requests[0](stale.stream);await wait(40);
  assert.equal(stale.track.stopped,true,'microphone stream resolving after leaving Log stayed live');
  assert.equal(recorders.length,0,'stale microphone request created a recorder after navigation');
  d.querySelector('[data-tab="log"]').click();d.getElementById('startRecording').click();await wait(15);assert.equal(requests.length,2);
  const current=makeStream();requests[1](current.stream);await wait(40);
  assert.equal(recorders.length,1);assert.equal(recorders[0].state,'recording');assert.equal(current.track.stopped,false);
  d.getElementById('stopRecording').click();await wait(30);assert.equal(current.track.stopped,true);assert.deepEqual(errors,[]);
  console.log('DREAMWORLD_RECORDING_REQUEST_RACE_VERIFIED');dom.window.close();
})().catch(error=>{console.error(error);dom.window.close();process.exitCode=1});
