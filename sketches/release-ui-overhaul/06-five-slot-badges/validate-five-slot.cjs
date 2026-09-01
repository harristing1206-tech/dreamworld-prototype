const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const source = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const runtimeErrors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => runtimeErrors.push(error));
const dom = new JSDOM(source, {
  runScripts: 'dangerously',
  url: 'https://preview.test/dreamworld-five-slot',
  pretendToBeVisual: true,
  virtualConsole,
  beforeParse(window) {
    window.matchMedia=()=>({matches:false,media:'',addEventListener(){},removeEventListener(){}});
    window.TextEncoder=global.TextEncoder;
    const RealDate=window.Date;class FixedDate extends RealDate{constructor(...args){super(...(args.length?args:['2026-08-26T14:00:00-07:00']))}static now(){return new RealDate('2026-08-26T14:00:00-07:00').getTime()}}window.Date=FixedDate;
    window.navigator.mediaDevices = { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) };
    class FakeMediaRecorder {
      static isTypeSupported(type) { return type.startsWith('audio/'); }
      constructor(_stream, options = {}) { this.mimeType = options.mimeType || 'audio/webm'; this.state = 'inactive'; }
      start() { this.state = 'recording'; }
      pause() { if (this.state === 'recording') this.state = 'paused'; }
      resume() { if (this.state === 'paused') this.state = 'recording'; }
      stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new window.Blob(['fixture-audio'], { type: this.mimeType }) }); this.onstop?.(); }
    }
    window.MediaRecorder = FakeMediaRecorder;
    window.fetch = async (url,options={}) => {
      if (String(url).includes('/dreamworld-stt/')) return { ok: true, json: async () => ({ text: 'I walked through a bright station beneath the lake.', provenance: { provider: 'OpenWhispr-compatible private engine', engine: 'whisper.cpp', model: 'small', processing: 'private-vps', audioRetainedByServer: false } }) };
      if (String(url).includes('/dreamworld-ai/v1/punctuate')) { const request=JSON.parse(options.body); return { ok:true, json:async()=>({schemaVersion:1,text:request.text,provenance:{method:'punctuation-only-v1',model:'test-punctuation-model',wordsPreserved:true}}) }; }
      if (String(url).includes('/dreamworld-ai/v1/title')) { const request=JSON.parse(options.body); return { ok:true, json:async()=>({schemaVersion:1,title:'Bright Station Beneath Lake',summary:'The dreamer walked through a bright station beneath the lake.',transcriptFingerprint:request.transcriptFingerprint,provenance:{method:'anarlog-adapted-dream-title-summary-v1',model:'test-title-model',sourceGrounded:true}}) }; }
      throw new Error(`Unexpected fetch: ${url}`);
    };
    window.Audio = class {
      constructor() {
        this.paused = true; this.currentTime = 0; this.deferred = Boolean(window.__deferNextAudio); window.__deferNextAudio = false;
        if (this.deferred) this.playPromise = new Promise((resolve,reject) => { this.resolvePlay = resolve; this.rejectPlay = reject; });
        window.__lastAudio = this;
        (window.__audioInstances ||= []).push(this);
      }
      play() { this.paused = false; return this.deferred ? this.playPromise : Promise.resolve(); }
      pause() { this.paused = true; }
    };
    window.__createdURLs=[];window.__revokedURLs=[];
    window.URL.createObjectURL = () => { const url=`blob:fixture-${window.__createdURLs.length+1}`;window.__createdURLs.push(url);return url; };
    window.URL.revokeObjectURL = url => window.__revokedURLs.push(url);
    const stores = new Map(); let currentVersion = 0; let idCounter = 0;
    window.indexedDB = { open(_name, version) { const request = {}; window.setTimeout(() => { const db = { objectStoreNames: { contains: name => stores.has(name) }, createObjectStore(name) { if (!stores.has(name)) stores.set(name, new Map()); return {}; }, transaction(name) { const tx = { error: null, objectStore() { const store = stores.get(name); return { put(value, key) { store.set(key, value); window.setTimeout(() => tx.oncomplete?.(), 0); }, get(key) { const result = {}; window.setTimeout(() => { result.result = store.get(key); result.onsuccess?.(); }, 0); return result; }, getAll() { const result = {}; window.setTimeout(() => { result.result = [...store.values()]; result.onsuccess?.(); }, 0); return result; }, delete(key) { store.delete(key); window.setTimeout(() => tx.oncomplete?.(), 0); } }; } }; return tx; }, close() {} }; request.result = db; if (version > currentVersion) { currentVersion = version; request.onupgradeneeded?.(); } request.onsuccess?.(); }, 0); return request; } };
    Object.defineProperty(window.crypto, 'subtle', { configurable: true, value: { digest: async () => new Uint8Array(32).buffer } });
    Object.defineProperty(window.crypto, 'randomUUID', { configurable: true, value: () => `test-dream-${++idCounter}-abcdefgh` });
  }
});
const d = dom.window.document;
const wait = ms => new Promise(resolve => dom.window.setTimeout(resolve, ms));

(async () => {
  assert.doesNotMatch(source, /(?:linear|radial)-gradient/i);
  assert.doesNotMatch(source, />\s*Analysis\s*</i);
  assert.doesNotMatch(source, /See when dreams appear and how sleep, recording length, and recall move together\./);
  assert.match(source, /\.calendar-day\{[^}]*width:100%[^}]*max-width:44px[^}]*aspect-ratio:1\/1[^}]*justify-self:center/, 'calendar dates must render as circles');
  assert.match(source, /\.calendar-day\.has-dream\{[^}]*padding-bottom:5px[^}]*\}\.calendar-day\.has-dream:after\{[^}]*bottom:2px/, 'dream marker needs clear spacing below the date');
  assert.match(source, /\.play\{width:44px;height:44px/, 'raw-audio play controls need a 44px touch target');
  assert.equal(d.querySelectorAll('.tab').length, 5);
  const tabs = [...d.querySelectorAll('.tab')];
  assert.deepEqual(tabs.map(tab => tab.getAttribute('aria-label')), ['Alarm', 'History', 'Log a dream', 'Insights', 'Profile']);
  assert.deepEqual(tabs.map(tab => tab.querySelector('.tab-label')?.textContent.trim()), ['Alarm', 'History', undefined, 'Insights', 'Profile'], 'bottom navigation must label four destinations while the center action stays icon-only');
  assert.ok(d.querySelector('[data-tab="log"] .plus-disc'), 'center Log action must be a raised plus disc');
  assert.equal(d.querySelectorAll('.tab.active').length, 1);
  assert.equal(d.querySelector('.tab[aria-current="page"]').dataset.tab, 'alarm');
  assert.ok(d.querySelector('[data-screen="alarm"]').classList.contains('active'));

  d.querySelector('[data-tab="history"]').click();
  assert.ok(d.querySelector('[data-screen="history"]').classList.contains('active'));
  assert.equal(d.querySelectorAll('.tab.active').length, 1);
  assert.equal(d.querySelector('.tab[aria-current="page"]').dataset.tab, 'history');
  assert.equal(d.querySelectorAll('.history-entry').length, 6);
  assert.ok([...d.querySelectorAll('.history-entry')].every(entry=>entry.children.length===5&&entry.children[0].classList.contains('history-date-rail')&&entry.children[1].tagName==='H2'&&entry.children[2].classList.contains('history-entry-date')&&entry.children[3].classList.contains('history-entry-excerpt')&&entry.children[4].classList.contains('history-entry-arrow')),'History rows must use the editorial date-rail hierarchy');
  assert.equal(d.querySelector('[data-entry-id="sample-2026-08-15"] .history-entry-date').textContent,'Aug 15, 2026');

  d.querySelector('[data-tab="insights"]').click();
  assert.ok(d.querySelector('[data-screen="insights"]').classList.contains('active'));
  assert.equal(d.querySelectorAll('#insightsCalendar .calendar-day').length, 31);
  assert.equal(d.querySelectorAll('#insightsCalendar .has-dream').length, 6);
  assert.equal(d.getElementById('insightAverageSleep').textContent, '7h 26m');
  assert.equal(d.getElementById('insightAverageDream').textContent, '1m 14s');
  assert.equal(d.getElementById('insightRecall').textContent, '4 of 6');
  assert.equal(d.getElementById('recallIndex').textContent, '67');
  assert.equal(d.getElementById('recallTrend').textContent, 'Based on 6 rated dreams');
  assert.equal(d.getElementById('recallPeriodLabel').textContent, 'RECALL INDEX · AUGUST');
  assert.equal(d.getElementById('insightsWave').hidden, false);
  assert.equal(d.querySelectorAll('#insightsWave i').length, 7);
  assert.equal(d.querySelectorAll('#insightsWave i:not([data-rating="Empty"])').length, 6);
  assert.equal(d.getElementById('insightAverageSleepBasis').textContent, '6 nights');
  assert.equal(d.getElementById('insightAverageDreamBasis').textContent, '6 entries');
  assert.equal(d.getElementById('insightDetailTitle').textContent, 'The station beneath the lake');
  d.querySelector('#insightsCalendar [data-day="15"]').click();
  assert.ok(d.querySelector('[data-screen="history"]').classList.contains('active'));
  assert.equal(d.querySelector('.tab[aria-current="page"]').dataset.tab, 'history');
  assert.equal(d.getElementById('historyFocus').hidden, false);
  assert.equal(d.getElementById('historyList').hidden, true);
  assert.equal(d.querySelector('[data-screen="history"] .home-header').hidden,true,'opened dream detail must replace the list header, matching the accepted typography mockup');
  assert.equal(d.getElementById('historyFocusTitle').textContent, 'A house without doors');
  assert.equal(d.getElementById('historyFocusRecall').textContent, 'Faint');
  assert.match(d.getElementById('historyFocusExcerpt').textContent, /Every window opened/);
  assert.equal(d.getElementById('historyFocusAudio').hidden,true,'sample logs without raw audio must not expose playback');
  assert.equal(d.getElementById('historyAudioPlayer').hidden,true);
  d.getElementById('historyFocusBack').click();
  assert.equal(d.getElementById('historyFocus').hidden, true);
  assert.equal(d.getElementById('historyList').hidden, false);
  assert.equal(d.querySelector('[data-screen="history"] .home-header').hidden,false,'closing dream detail must restore the History header');
  d.querySelector('#historyList button.history-entry[data-entry-id="sample-2026-08-15"]').click();
  const swipe=(type,x,y)=>{const event=new dom.window.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(event,'touches',{value:type==='touchend'?[]:[{clientX:x,clientY:y}]});d.getElementById('historyFocus').dispatchEvent(event)};
  swipe('touchstart',18,240);swipe('touchmove',56,244);swipe('touchend',56,244);await wait(180);
  assert.equal(d.getElementById('historyFocus').hidden,false,'a short swipe must not exit dream detail');
  swipe('touchstart',18,240);swipe('touchmove',112,246);swipe('touchend',112,246);await wait(180);
  assert.equal(d.getElementById('historyFocus').hidden,true,'swiping right must exit dream detail');
  assert.equal(d.getElementById('historyList').hidden,false,'swiping right must restore History list');
  d.querySelector('[data-tab="insights"]').click();
  d.querySelector('#insightsCalendar [data-day="16"]').click();
  assert.ok(d.querySelector('[data-screen="insights"]').classList.contains('active'));
  assert.equal(d.getElementById('insightDetailTitle').textContent, 'No dream entry for this day');

  d.querySelector('[data-tab="profile"]').click();
  assert.ok(d.querySelector('[data-screen="profile"]').classList.contains('active'));
  assert.equal(d.querySelector('.profile-head h1').textContent, 'My Dream World');
  assert.equal(d.querySelector('.profile-identity-copy strong').textContent, 'Harris');
  assert.equal(d.querySelector('.profile-identity-copy span').textContent, 'Show profile');

  d.querySelector('[data-tab="log"]').click();
  assert.ok(d.querySelector('[data-screen="log"]').classList.contains('active'));
  assert.ok(d.querySelector('[data-log-state="ready"]').classList.contains('active'));
  d.getElementById('startRecording').click();
  await wait(0);
  assert.ok(d.querySelector('[data-log-state="recording"]').classList.contains('active'));
  const pauseRecording=d.getElementById('pauseRecording');
  const exitRecording=d.getElementById('exitRecording');
  assert.ok(pauseRecording,'recording surface must expose a pause control');
  assert.ok(exitRecording,'recording surface must expose an exit control');
  assert.equal(pauseRecording.getAttribute('aria-label'),'Pause recording');
  assert.equal(exitRecording.getAttribute('aria-label'),'Exit and save recording');
  pauseRecording.click();
  assert.equal(pauseRecording.getAttribute('aria-label'),'Resume recording');
  assert.equal(d.querySelector('[data-log-state="recording"] .log-kicker').textContent,'Paused');
  d.querySelector('[data-tab="history"]').click();
  assert.ok(d.querySelector('[data-screen="log"]').classList.contains('active'),'paused recording must not keep capturing off-screen');
  pauseRecording.click();
  assert.equal(pauseRecording.getAttribute('aria-label'),'Pause recording');
  assert.equal(d.querySelector('[data-log-state="recording"] .log-kicker').textContent,'Recording');
  d.querySelector('[data-tab="history"]').click();
  assert.ok(d.querySelector('[data-screen="log"]').classList.contains('active'),'active recording must keep Capture on screen');
  assert.equal(d.querySelector('.tab[aria-current="page"]').dataset.tab,'log','blocked navigation must preserve the current tab');
  assert.match(d.querySelector('.toast').textContent,/Exit and save your recording before leaving/i,'blocked navigation must explain how to leave safely');
  assert.equal(d.activeElement,d.getElementById('exitRecording'),'blocked navigation must focus the explicit exit action');
  assert.ok(d.querySelector('[data-log-state="recording"]').classList.contains('active'),'blocked navigation must not stop or finalize the recording');
  exitRecording.click();
  await wait(20);
  assert.ok(d.querySelector('[data-screen="alarm"]').classList.contains('active'),'Exit must leave Capture after preserving the recording');
  d.querySelector('[data-tab="log"]').click();
  await wait(10);
  assert.ok(d.querySelector('[data-log-state="draft"]').classList.contains('active'));
  d.getElementById('playDraft').click();await wait(0);
  const draftPlayback=dom.window.__lastAudio;
  assert.equal(draftPlayback.paused,false,'saved draft playback must start');
  d.getElementById('playDraft').focus();
  d.querySelector('[data-tab="profile"]').click();
  assert.equal(draftPlayback.paused,true,'leaving Capture must stop draft audio before it goes off-screen');
  assert.equal(d.activeElement,d.querySelector('[data-tab="profile"]'),'leaving Capture playback must focus the selected destination tab');
  assert.equal(dom.window.__revokedURLs.filter(url=>url==='blob:fixture-1').length,1,'leaving Capture must revoke the draft playback URL');
  d.querySelector('[data-tab="log"]').click();await wait(10);
  assert.ok(d.querySelector('[data-log-state="draft"]').classList.contains('active'));
  d.getElementById('playDraft').click();await wait(0);
  const draftPlaybackBeforeTranscription=dom.window.__lastAudio;
  d.getElementById('logDream').click();
  await wait(0);
  assert.equal(draftPlaybackBeforeTranscription.paused,true,'transcribing a draft must stop its off-screen playback');
  assert.ok(d.querySelector('[data-log-state="transcript"]').classList.contains('active'));
  assert.equal(d.getElementById('dreamTranscript').value, 'I walked through a bright station beneath the lake.');
  assert.match(d.getElementById('transcriptProvenance').textContent, /OpenWhispr-compatible private engine/);
  d.getElementById('saveDream').click();
  await wait(30);
  assert.ok(d.querySelector('[data-log-state="logged"]').classList.contains('active'));
  assert.equal(d.querySelectorAll('#historyList .history-entry').length,1);
  const todayButton=d.querySelector('#insightsCalendar [data-day="26"]');
  assert.ok(todayButton.classList.contains('has-dream'),'saved dream must mark its calendar date');
  todayButton.click();
  assert.equal(d.getElementById('historyFocusTitle').textContent,'Bright Station Beneath Lake');
  assert.equal(d.getElementById('historyFocusExcerpt').textContent,'The dreamer walked through a bright station beneath the lake.');
  assert.equal(d.getElementById('historyFocusAudio').hidden,false,'a saved log with raw audio must expose playback');
  d.getElementById('historyFocusAudio').click();await wait(0);
  assert.equal(d.getElementById('historyAudioPlayer').hidden,false,'History playback controls must open');
  assert.equal(d.getElementById('historyAudioPause').getAttribute('aria-label'),'Pause raw audio');
  assert.equal(d.getElementById('historyAudioStatus').textContent,'Playing raw audio');
  assert.equal(dom.window.__lastAudio.paused,false);
  assert.equal(draftPlaybackBeforeTranscription.paused,true,'History playback must not overlap earlier Capture draft playback');
  const firstHistoryAudio=dom.window.__lastAudio;firstHistoryAudio.currentTime=11;
  d.getElementById('historyAudioPause').click();
  assert.equal(dom.window.__lastAudio.paused,true);
  assert.equal(d.getElementById('historyAudioPause').getAttribute('aria-label'),'Resume raw audio');
  assert.equal(d.getElementById('historyAudioStatus').textContent,'Paused');
  d.getElementById('historyAudioPause').click();await wait(0);
  assert.equal(dom.window.__lastAudio.paused,false);
  assert.equal(dom.window.__lastAudio,firstHistoryAudio,'pause and resume must retain the same Audio instance');
  assert.equal(dom.window.__lastAudio.currentTime,11,'pause and resume must retain playback position');
  d.getElementById('historyAudioExit').focus();
  d.getElementById('historyAudioExit').click();
  assert.equal(dom.window.__lastAudio.paused,true);
  assert.equal(dom.window.__lastAudio.currentTime,0);
  assert.equal(d.getElementById('historyAudioPlayer').hidden,true,'Exit must close History playback without leaving the log');
  assert.equal(d.getElementById('historyFocus').hidden,false);
  assert.equal(d.activeElement,d.getElementById('historyFocusAudio'),'Exit must restore focus to Play raw audio');
  assert.equal(dom.window.__revokedURLs.filter(url=>url==='blob:fixture-3').length,1,'Exit must revoke its object URL exactly once');
  dom.window.__deferNextAudio=true;
  d.getElementById('historyFocusAudio').click();await wait(0);
  const staleAudio=dom.window.__lastAudio;
  d.getElementById('historyAudioExit').click();
  d.getElementById('historyFocusAudio').click();await wait(0);
  const currentAudio=dom.window.__lastAudio;
  assert.notEqual(currentAudio,staleAudio);
  staleAudio.rejectPlay(new Error('late first-play rejection'));await wait(0);
  assert.equal(currentAudio.paused,false,'a stale playback rejection must not stop the newer log audio');
  assert.equal(d.getElementById('historyAudioPlayer').hidden,false,'stale callbacks must not hide newer playback controls');
  assert.equal(dom.window.__revokedURLs.filter(url=>url==='blob:fixture-5').length,0,'a stale callback must not revoke the newer playback URL');
  d.getElementById('historyAudioExit').click();
  d.getElementById('historyFocusAudio').click();await wait(0);
  const playingBeforeBack=dom.window.__lastAudio;
  d.getElementById('historyFocusBack').click();
  assert.equal(playingBeforeBack.paused,true,'leaving a History log must stop raw-audio playback');
  assert.equal(d.getElementById('historyAudioPlayer').hidden,true);
  todayButton.click();
  d.getElementById('historyFocusAudio').click();await wait(0);
  const playingBeforeTabChange=dom.window.__lastAudio;
  d.getElementById('historyAudioPause').focus();
  d.querySelector('[data-tab="profile"]').click();
  assert.equal(playingBeforeTabChange.paused,true,'leaving History must stop raw-audio playback');
  assert.equal(d.getElementById('historyAudioPlayer').hidden,true);
  assert.equal(d.activeElement,d.querySelector('[data-tab="profile"]'),'tab navigation must move focus out of inactive History content');
  todayButton.click();
  assert.match(d.querySelector('[data-log-state="logged"] p').textContent, /Insights/);
  d.getElementById('editDreams').click();
  assert.equal(d.getElementById('editDreams').textContent,'✓');
  assert.ok(d.getElementById('historyList').classList.contains('editing'));
  let dreamRow=d.querySelector('#historyList .history-swipe-row');
  dreamRow.querySelector('.history-entry').click();
  assert.ok(d.getElementById('dreamEditSheet').classList.contains('open'));
  d.getElementById('dreamEditName').value='The luminous underwater station';
  d.getElementById('dreamEditSummary').value='A bright station appeared beneath the lake while the dreamer walked through it.';
  d.getElementById('saveDreamEdit').click();await wait(25);
  dreamRow=d.querySelector('#historyList .history-swipe-row');
  assert.equal(dreamRow.querySelector('h2').textContent,'The luminous underwater station');
  dreamRow.querySelector('.swipe-action.delete').click();
  assert.equal(d.getElementById('deleteConfirm').hidden,false);
  assert.equal(d.querySelector('.viewport').inert,true);
  assert.match(d.getElementById('deleteConfirmMessage').textContent,/Are you sure/);
  d.getElementById('cancelDelete').click();await wait(240);
  assert.equal(d.querySelector('.viewport').inert,false);
  assert.equal(d.querySelectorAll('#historyList .history-entry').length,1,'cancel must preserve dream');
  dreamRow.querySelector('.swipe-action.delete').click();d.getElementById('confirmDelete').click();await wait(25);
  assert.equal(d.querySelectorAll('#historyList .history-entry').length,0,'confirmed delete must remove dream');
  assert.equal(d.querySelector('#insightsCalendar [data-day="26"]').classList.contains('has-dream'),false);
  d.getElementById('editDreams').click();

  d.querySelector('[data-tab="alarm"]').click();
  const before = d.querySelectorAll('.alarm-row').length;
  const firstAlarm=d.querySelector('#alarmList .alarm-row');
  firstAlarm.querySelector('.alarm-edit').click();
  assert.equal(d.getElementById('alarmSheetTitle').textContent,'Edit Alarm');
  assert.equal(d.getElementById('alarmHour').value,'6');
  assert.equal(d.getElementById('alarmMinute').value,'30');
  d.getElementById('alarmHour').value='9';
  d.getElementById('alarmMinute').value='15';
  d.getElementById('alarmPeriod').value='PM';
  d.getElementById('alarmLabel').value='Early class';
  d.getElementById('saveAlarm').click();
  assert.equal(d.querySelectorAll('.alarm-row').length,before,'editing must not create a duplicate alarm');
  assert.equal(firstAlarm.querySelector('.alarm-value').textContent,'9:15');
  assert.equal(firstAlarm.querySelector('.alarm-period').textContent,'PM');
  assert.match(firstAlarm.querySelector('.alarm-detail').textContent,/Early class/);
  d.getElementById('addAlarm').click();
  assert.equal(d.getElementById('alarmSheetTitle').textContent,'Add Alarm');
  d.getElementById('alarmLabel').value = '<img src=x onerror=alert(1)>';
  d.getElementById('saveAlarm').click();
  assert.equal(d.querySelectorAll('.alarm-row').length, before + 1);
  assert.equal(d.querySelectorAll('.alarm-row img').length, 0);
  const alarmRow=d.querySelectorAll('#alarmList .alarm-row')[1],alarmMain=alarmRow.querySelector('.swipe-main');
  const swipeAlarm=(type,x,y)=>{const event=new dom.window.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(event,'touches',{value:type==='touchend'?[]:[{clientX:x,clientY:y}]});alarmMain.dispatchEvent(event)};
  swipeAlarm('touchstart',170,260);swipeAlarm('touchmove',70,264);swipeAlarm('touchend',70,264);
  assert.ok(alarmRow.classList.contains('actions-open'),'left swipe must reveal alarm actions');
  alarmRow.querySelector('.swipe-action.delete').click();
  assert.equal(d.getElementById('deleteConfirm').hidden,false);
  assert.equal(d.getElementById('confirmDelete').classList.contains('confirm-delete'),true);
  d.getElementById('cancelDelete').click();
  assert.equal(d.querySelectorAll('.alarm-row').length,before+1,'cancel must preserve alarm');
  d.getElementById('editAlarms').click();
  assert.equal(d.getElementById('editAlarms').textContent,'✓');
  assert.ok(d.getElementById('alarmList').classList.contains('editing'));
  d.getElementById('editAlarms').click();
  alarmRow.querySelector('.swipe-action.delete').click();d.getElementById('confirmDelete').click();await wait(0);
  assert.equal(d.querySelectorAll('.alarm-row').length,before,'confirmed delete must remove alarm');
  const fullRow=d.querySelector('#alarmList .alarm-row'),fullMain=fullRow.querySelector('.swipe-main');
  const fullSwipe=(type,x,y)=>{const event=new dom.window.Event(type,{bubbles:true,cancelable:true});Object.defineProperty(event,'touches',{value:type==='touchend'?[]:[{clientX:x,clientY:y}]});fullMain.dispatchEvent(event)};
  fullSwipe('touchstart',310,260);fullSwipe('touchmove',5,262);fullSwipe('touchend',5,262);await wait(230);
  assert.equal(d.querySelectorAll('.alarm-row').length,before-1,'complete swipe must automatically delete alarm');
  assert.equal(d.getElementById('deleteConfirm').hidden,true,'complete swipe must not require the trash confirmation tap');
  assert.deepEqual(runtimeErrors, []);
  console.log('DREAMWORLD_FIVE_SLOT_INSIGHTS_DEMO_VERIFIED');
  dom.window.close();
})().catch(error => {
  console.error(error);
  dom.window.close();
  process.exitCode = 1;
});
