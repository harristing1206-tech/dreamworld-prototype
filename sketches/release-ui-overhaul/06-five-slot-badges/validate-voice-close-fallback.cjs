const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const errors=[],unhandled=[];const onUnhandled=reason=>unhandled.push(reason);process.on('unhandledRejection',onUnhandled);
const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error));
const dom=new JSDOM(source,{runScripts:'dangerously',url:'https://preview.test/voice-close-fallback',pretendToBeVisual:true,virtualConsole:vc,beforeParse(window){
  window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});window.navigator.mediaDevices={getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})};
  class Recorder{static isTypeSupported(){return true}constructor(_stream,options={}){this.mimeType=options.mimeType||'audio/webm';this.state='inactive'}start(){this.state='recording'}stop(){this.state='inactive';this.ondataavailable?.({data:new window.Blob(['audio'],{type:this.mimeType})});this.onstop?.()}}window.MediaRecorder=Recorder;
  window.AudioContext=class{resume(){return Promise.resolve()}createAnalyser(){return{fftSize:512,smoothingTimeConstant:0,disconnect(){},getByteTimeDomainData(samples){samples.fill(128)}}}createMediaStreamSource(){return{connect(){},disconnect(){}}}close(){throw new Error('close unavailable')}};
  window.Audio=class{play(){return Promise.resolve()}pause(){}};window.URL.createObjectURL=()=> 'blob:test';window.URL.revokeObjectURL=()=>{};
}});
const d=dom.window.document,wait=ms=>new Promise(resolve=>dom.window.setTimeout(resolve,ms));
(async()=>{d.querySelector('[data-tab="log"]').click();d.getElementById('startRecording').click();await wait(50);assert.equal(d.getElementById('voiceVisual').dataset.reactive,'true');d.getElementById('stopRecording').click();await wait(50);assert.equal(unhandled.length,0,'synchronous AudioContext.close failure escaped cleanup');assert.equal(d.getElementById('voiceVisual').dataset.reactive,'false');assert.deepEqual(errors,[]);process.off('unhandledRejection',onUnhandled);console.log('DREAMWORLD_AUDIO_CONTEXT_CLOSE_FALLBACK_VERIFIED');dom.window.close()})().catch(error=>{process.off('unhandledRejection',onUnhandled);console.error(error);dom.window.close();process.exitCode=1});
