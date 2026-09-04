const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const route=path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges');
const html=fs.readFileSync(path.join(route,'index.html'),'utf8');
const cssRule=selector=>{const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=html.match(new RegExp(`${escaped}\\{([^}]+)\\}`));assert.ok(match,`Missing CSS rule: ${selector}`);return match[1]};

test('active recording adopts the reference header, live microphone, waveform, and control hierarchy',()=>{
 assert.match(html,/<div class="capture-state recording-state capture-recording" data-log-state="recording" data-recording-state="recording">[\s\S]*?<header class="recording-header">[\s\S]*?id="exitRecording"[\s\S]*?id="recordingStatus"[\s\S]*?Dream memo[\s\S]*?class="recording-private"[\s\S]*?<div class="recording-stage" id="voiceVisual"[\s\S]*?class="recording-ripple ripple-one"[\s\S]*?class="recording-ripple ripple-two"[\s\S]*?class="recording-ripple ripple-three"[\s\S]*?class="recording-core"[\s\S]*?id="voiceCanvas"[\s\S]*?id="timer"[\s\S]*?class="recording-live"[\s\S]*?id="recordingLiveLabel"[\s\S]*?class="recording-bars"[\s\S]*?class="recording-footer"[\s\S]*?id="stopRecording"[\s\S]*?id="pauseRecording"/);
 assert.equal((html.match(/class="recording-bar"/g)||[]).length,21);
 assert.match(html,/<span class="recording-footer-item recording-safe">[\s\S]*?Private[\s\S]*?<\/span>/);
});

test('recording reference layout replaces the prior orbit and paired-pill treatment',()=>{
 assert.match(html,/:has\(\.capture-recording\.active\)>header/);
 const state=cssRule('.capture-redesign .capture-recording');assert.match(state,/position:absolute!important/);assert.match(state,/grid-template-rows:56px minmax\(160px,1fr\) auto auto 48px 92px auto/);
 const stage=cssRule('.capture-redesign .recording-stage');assert.match(stage,/width:220px/);assert.match(stage,/height:220px/);
 const core=cssRule('.capture-redesign .recording-core');assert.match(core,/width:120px/);assert.match(core,/height:120px/);assert.match(core,/background:#a7523f/);
 const bars=cssRule('.capture-redesign .recording-bars');assert.match(bars,/height:48px/);assert.match(bars,/display:flex/);
 const stop=cssRule('.capture-redesign .recording-stop-main');assert.match(stop,/width:72px/);assert.match(stop,/height:72px/);assert.match(stop,/border-radius:50%/);
 assert.match(cssRule('.capture-redesign .recording-stop-main:after'),/display:none!important/);
 assert.match(html,/@media\(max-width:350px\)[\s\S]*?\.capture-redesign \.capture-recording/);
});

test('live animation uses the existing analyser stream and drives bars, ripple, and paused state truthfully',()=>{
 for(const hook of['navigator.mediaDevices.getUserMedia','new MediaRecorder','startVoiceVisualization(mediaStream)','source.connect(analyser)','mediaRecorder.pause()','mediaRecorder.resume()','stopVoiceVisualization()'])assert.ok(html.includes(hook),`Missing recorder hook: ${hook}`);
 assert.match(html,/bars=\[\.\.\.document\.querySelectorAll\('\.recording-bar'\)\]/);
 assert.match(html,/bar\.style\.transform=`scaleY\(\$\{barLevels\[index\]\.toFixed\(3\)\}\)`/);
 assert.match(html,/visual\.style\.setProperty\('--ripple-scale',/);
 assert.match(html,/state\.dataset\.recordingState=paused\?'paused':'recording'/);
 assert.match(html,/liveLabel\.textContent=paused\?'Paused':'Live'/);
 assert.match(html,/\.capture-recording\[data-recording-state="paused"\] \.recording-ripple\{animation-play-state:paused/);
 assert.match(html,/@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.capture-redesign \.recording-ripple\{animation:none!important/);
});

test('recording overhaul preserves safe exit, stop review, draft discard, OpenWhispr, punctuation, and AI metadata',()=>{
 for(const id of['exitRecording','stopRecording','pauseRecording','recordAgain','logDream','dreamTranscript','saveDream'])assert.match(html,new RegExp(`id="${id}"`));
 for(const hook of["stopRecordingAndSave(true)","stopRecordingAndSave(false)","document.getElementById('recordAgain').addEventListener('click',()=>void discardRecording())",'const STT_ENDPOINT=','whisper.cpp','PUNCTUATION_ENDPOINT','JOURNAL_METADATA_ENDPOINT'])assert.ok(html.includes(hook),`Missing flow hook: ${hook}`);
});
