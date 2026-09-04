const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const route=path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges');
const html=fs.readFileSync(path.join(route,'index.html'),'utf8');
const worker=fs.readFileSync(path.join(route,'service-worker.js'),'utf8');
const cssRule=selector=>{const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=html.match(new RegExp(`${escaped}\\{([^}]+)\\}`));assert.ok(match,`Missing CSS rule: ${selector}`);return match[1]};
const luminance=hex=>{const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*channels[0]+.7152*channels[1]+.0722*channels[2]};
const contrast=(a,b)=>{const [light,dark]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(light+.05)/(dark+.05)};

test('Capture ready state adopts the supplied quote and microphone composition',()=>{
 assert.match(html,/<div class="capture-state active capture-ready" data-log-state="ready">[\s\S]*?<blockquote class="capture-quote">[\s\S]*?A dream which is not interpreted is like a letter which is not read\.[\s\S]*?The Talmud[\s\S]*?id="startRecording"[\s\S]*?class="mic-label">Start Recording<[\s\S]*?class="capture-ready-hint">Capture your dream while it’s fresh<[\s\S]*?id="noDream"/);
 const ready=cssRule('.capture-redesign .capture-ready');assert.match(ready,/min-height:100%/);assert.match(ready,/display:grid/);assert.match(ready,/background:radial-gradient/);
 const quote=cssRule('.capture-redesign .capture-quote p');assert.match(quote,/font-family:"Newsreader",var\(--font-editorial\)/);assert.match(quote,/font-size:24px/);assert.match(cssRule('.capture-redesign .capture-quote'),/text-align:center/);
 const mic=cssRule('.capture-redesign .capture-ready .mic');assert.match(mic,/width:128px/);assert.match(mic,/height:128px/);assert.match(mic,/border-radius:50%/);assert.match(mic,/background:#1a1918/);
 const label=cssRule('.capture-redesign .capture-ready .mic-label');assert.match(label,/letter-spacing:\.20em/);assert.match(label,/text-transform:uppercase/);
});

test('Capture ready redesign preserves navigation, explicit recording, no-dream, OpenWhispr, and private AI hooks',()=>{
 for(const id of['startRecording','noDream','logDream','dreamTranscript','saveDream','retryTranscript'])assert.match(html,new RegExp(`id="${id}"`));
 for(const behavior of["document.getElementById('startRecording').addEventListener('click',()=>void startRecording())","document.getElementById('noDream').addEventListener('click',()=>showLogState('empty'))","const STT_ENDPOINT=","JOURNAL_METADATA_ENDPOINT=","transcribeRecordedDream","generateJournalMetadata"])assert.ok(html.includes(behavior),`Missing Capture behavior: ${behavior}`);
 assert.match(html,/whisper\.cpp/);
});

test('active recording adopts the supplied memo header, responsive microphone, timer, waveform, and controls',()=>{
 assert.match(html,/<div class="capture-state recording-state capture-recording" data-log-state="recording" data-recording-state="recording">[\s\S]*?class="recording-header"[\s\S]*?id="exitRecording"[\s\S]*?id="recordingStatus"[\s\S]*?class="recording-stage" id="voiceVisual"[\s\S]*?id="voiceCanvas"[\s\S]*?id="timer"[\s\S]*?class="recording-bars"[\s\S]*?id="stopRecording"[\s\S]*?id="pauseRecording"[\s\S]*?preserves raw audio/);
 const state=cssRule('.capture-redesign .capture-recording');assert.match(state,/display:grid/);assert.match(state,/grid-template-rows:56px minmax\(160px,1fr\) auto auto 48px 92px auto/);
 const stage=cssRule('.capture-redesign .recording-stage');assert.match(stage,/width:220px/);assert.match(stage,/height:220px/);
 const timer=cssRule('.capture-redesign .capture-recording .timer');assert.match(timer,/font-family:var\(--font-ui\)/);assert.match(timer,/font-size:48px/);assert.match(timer,/font-variant-numeric:tabular-nums/);
 const bars=cssRule('.capture-redesign .recording-bars');assert.match(bars,/height:48px/);assert.match(bars,/display:flex/);
 const stop=cssRule('.capture-redesign .recording-stop-main');assert.match(stop,/background:#a7523f!important/);assert.match(stop,/width:72px!important/);
 assert.match(html,/@media\(max-height:700px\)\{\.capture-redesign \.capture-recording\{grid-template-rows:52px minmax\(148px,1fr\)/);
});

test('recording redesign preserves one recorder, timer, visualizer, Pause/Resume, Stop, safe Exit, and navigation guards',()=>{
 for(const id of['recordingStatus','voiceVisual','voiceCanvas','timer','exitRecording','pauseRecording','stopRecording'])assert.match(html,new RegExp(`id="${id}"`));
 for(const behavior of["navigator.mediaDevices.getUserMedia","new MediaRecorder","startVoiceVisualization(mediaStream)","renderRecordingTimer","toggleRecordingPause","stopRecordingAndSave(false)","stopRecordingAndSave(true)","['recording','paused'].includes(mediaRecorder?.state)"])assert.ok(html.includes(behavior),`Missing recording behavior: ${behavior}`);
 assert.match(html,/mediaRecorder\.pause\(\)/);assert.match(html,/mediaRecorder\.resume\(\)/);assert.match(html,/setRecordingPausedUI\(true\)/);assert.match(html,/setRecordingPausedUI\(false\)/);
});

test('saved recording adopts the supplied editorial heading, real audio rail, and bottom actions',()=>{
 assert.match(html,/<div class="capture-state capture-draft" data-log-state="draft">[\s\S]*?<div class="draft-heading">[\s\S]*?Private audio draft[\s\S]*?<h2>Recording<br><span>saved<\/span><\/h2>[\s\S]*?id="playDraft"[\s\S]*?id="draftTime"[\s\S]*?id="logDream"[\s\S]*?id="recordAgain"/);
 const draft=cssRule('.capture-redesign .capture-draft');assert.match(draft,/min-height:505px/);assert.match(draft,/display:grid/);assert.match(draft,/grid-template-rows:auto auto 1fr auto/);
 const heading=cssRule('.capture-redesign .capture-draft h2');assert.match(heading,/font-family:"Newsreader",var\(--font-editorial\)/);assert.match(heading,/font-size:42px/);
 const rail=cssRule('.capture-redesign .capture-draft .draft-row');assert.match(rail,/border-radius:32px/);assert.match(rail,/background:#fafafa/);assert.match(rail,/padding:12px/);
 const play=cssRule('.capture-redesign .capture-draft .play');assert.match(play,/width:52px/);assert.match(play,/height:52px/);assert.match(play,/border-radius:50%/);
 const primary=cssRule('.capture-redesign .capture-draft .primary');assert.match(primary,/height:60px/);assert.match(primary,/background:#a7523f/);assert.match(primary,/border-radius:30px/);
 const secondary=cssRule('.capture-redesign .capture-draft .secondary');assert.match(secondary,/height:48px/);assert.match(secondary,/border:0/);
 assert.doesNotMatch(html,/draft-waveform|fake-waveform/);
});

test('saved recording redesign preserves playback, durable status, Log Dream, discard, OpenWhispr, and AI processing',()=>{
 for(const id of['playDraft','draftTime','logDream','recordAgain'])assert.match(html,new RegExp(`id="${id}"`));
 for(const behavior of["document.getElementById('playDraft').addEventListener('click',()=>void playRecordedDraft())","document.getElementById('logDream').addEventListener('click',()=>void transcribeRecordedDream())","document.getElementById('recordAgain').addEventListener('click',()=>void discardRecording())","recordedPersisted?'Stored on this iPhone':'Available while this app stays open'","showLogState('transcribing')","showPunctuatedTranscript","generateJournalMetadata"])assert.ok(html.includes(behavior),`Missing saved-draft behavior: ${behavior}`);
 assert.match(html,/Your raw audio is preserved\. Logging sends it through your private transcription server\./);
});

test('Capture redesign compact text and primary actions meet WCAG AA contrast',()=>{
 const readyLabel=cssRule('.capture-redesign .capture-ready .mic-label').match(/color:(#[0-9a-f]{6})/i)?.[1];
 assert.ok(contrast(readyLabel,'#f4f3ef')>=4.5,`ready label contrast is ${contrast(readyLabel,'#f4f3ef').toFixed(2)}:1`);
 assert.ok(contrast('#6f6d68','#f4f3ef')>=4.5);
 assert.ok(contrast('#ffffff','#a7523f')>=4.5);
 assert.ok(contrast('#ffffff','#ad5944')>=4.5);
 assert.ok(contrast('#b4b1a9','#111310')>=4.5);
 assert.match(worker,/const CACHE='dreamworld-pwa-20260830-93'/);
});
