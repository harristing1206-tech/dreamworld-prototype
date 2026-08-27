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
      stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new window.Blob(['fixture-audio'], { type: this.mimeType }) }); this.onstop?.(); }
    }
    window.MediaRecorder = FakeMediaRecorder;
    window.fetch = async (url,options={}) => {
      if (String(url).includes('/dreamworld-stt/')) return { ok: true, json: async () => ({ text: 'I walked through a bright station beneath the lake.', provenance: { provider: 'OpenWhispr-compatible private engine', engine: 'whisper.cpp', model: 'small', processing: 'private-vps', audioRetainedByServer: false } }) };
      if (String(url).includes('/dreamworld-ai/v1/title')) { const request=JSON.parse(options.body); return { ok:true, json:async()=>({schemaVersion:1,title:'Bright Station Beneath Lake',summary:'The dreamer walked through a bright station beneath the lake.',transcriptFingerprint:request.transcriptFingerprint,provenance:{method:'anarlog-adapted-dream-title-summary-v1',model:'test-title-model',sourceGrounded:true}}) }; }
      throw new Error(`Unexpected fetch: ${url}`);
    };
    window.Audio = class { play() { return Promise.resolve(); } pause() {} };
    window.URL.createObjectURL = () => 'blob:fixture';
    window.URL.revokeObjectURL = () => {};
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
  assert.equal(d.querySelectorAll('.tab').length, 5);
  const tabs = [...d.querySelectorAll('.tab')];
  assert.deepEqual(tabs.map(tab => tab.getAttribute('aria-label')), ['Alarm', 'History', 'Log a dream', 'Insights', 'Profile']);
  assert.ok(tabs.every(tab => tab.textContent.trim() === ''), 'bottom navigation must remain icon-only');
  assert.ok(d.querySelector('[data-tab="log"] .plus-disc'), 'center Log action must be a raised plus disc');
  assert.equal(d.querySelectorAll('.tab.active').length, 1);
  assert.equal(d.querySelector('.tab[aria-current="page"]').dataset.tab, 'alarm');
  assert.ok(d.querySelector('[data-screen="alarm"]').classList.contains('active'));

  d.querySelector('[data-tab="history"]').click();
  assert.ok(d.querySelector('[data-screen="history"]').classList.contains('active'));
  assert.equal(d.querySelectorAll('.tab.active').length, 1);
  assert.equal(d.querySelector('.tab[aria-current="page"]').dataset.tab, 'history');
  assert.equal(d.querySelectorAll('.history-entry').length, 6);
  assert.ok([...d.querySelectorAll('.history-entry')].every(entry=>entry.children.length===2&&entry.children[0].tagName==='H2'&&entry.children[1].classList.contains('history-entry-date')),'History rows must show title followed by logged date');
  assert.equal(d.querySelector('[data-entry-id="sample-2026-08-15"] .history-entry-date').textContent,'Aug 15, 2026');

  d.querySelector('[data-tab="insights"]').click();
  assert.ok(d.querySelector('[data-screen="insights"]').classList.contains('active'));
  assert.equal(d.querySelectorAll('#insightsCalendar .calendar-day').length, 31);
  assert.equal(d.querySelectorAll('#insightsCalendar .has-dream').length, 6);
  assert.equal(d.getElementById('insightAverageSleep').textContent, '7h 26m');
  assert.equal(d.getElementById('insightAverageDream').textContent, '1m 14s');
  assert.equal(d.getElementById('insightRecall').textContent, '4 of 6');
  d.querySelector('#insightsCalendar [data-day="15"]').click();
  assert.ok(d.querySelector('[data-screen="history"]').classList.contains('active'));
  assert.equal(d.querySelector('.tab[aria-current="page"]').dataset.tab, 'history');
  assert.equal(d.getElementById('historyFocus').hidden, false);
  assert.equal(d.getElementById('historyList').hidden, true);
  assert.equal(d.getElementById('historyFocusTitle').textContent, 'A house without doors');
  assert.equal(d.getElementById('historyFocusRecall').textContent, 'Faint');
  assert.match(d.getElementById('historyFocusExcerpt').textContent, /Every window opened/);
  d.getElementById('historyFocusBack').click();
  assert.equal(d.getElementById('historyFocus').hidden, true);
  assert.equal(d.getElementById('historyList').hidden, false);
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
  assert.equal(d.getElementById('profileDreamNights').textContent, '6');

  d.querySelector('[data-tab="log"]').click();
  assert.ok(d.querySelector('[data-screen="log"]').classList.contains('active'));
  assert.ok(d.querySelector('[data-log-state="ready"]').classList.contains('active'));
  d.getElementById('startRecording').click();
  await wait(0);
  assert.ok(d.querySelector('[data-log-state="recording"]').classList.contains('active'));
  d.getElementById('stopRecording').click();
  await wait(20);
  assert.ok(d.querySelector('[data-log-state="draft"]').classList.contains('active'));
  d.getElementById('logDream').click();
  await wait(0);
  assert.ok(d.querySelector('[data-log-state="transcript"]').classList.contains('active'));
  assert.equal(d.getElementById('dreamTranscript').value, 'I walked through a bright station beneath the lake.');
  assert.match(d.getElementById('transcriptProvenance').textContent, /OpenWhispr-compatible private engine/);
  d.getElementById('saveDream').click();
  await wait(30);
  assert.ok(d.querySelector('[data-log-state="logged"]').classList.contains('active'));
  assert.equal(d.getElementById('profileDreamCount').textContent, '1');
  assert.equal(d.getElementById('profileDreamNights').textContent, '1');
  assert.equal(d.querySelectorAll('#historyList .history-entry').length,1);
  const todayButton=d.querySelector('#insightsCalendar [data-day="26"]');
  assert.ok(todayButton.classList.contains('has-dream'),'saved dream must mark its calendar date');
  todayButton.click();
  assert.equal(d.getElementById('historyFocusTitle').textContent,'Bright Station Beneath Lake');
  assert.equal(d.getElementById('historyFocusExcerpt').textContent,'The dreamer walked through a bright station beneath the lake.');
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
  assert.equal(d.getElementById('profileDreamCount').textContent,'0');
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
  assert.deepEqual(runtimeErrors, []);
  console.log('DREAMWORLD_FIVE_SLOT_INSIGHTS_DEMO_VERIFIED');
  dom.window.close();
})().catch(error => {
  console.error(error);
  dom.window.close();
  process.exitCode = 1;
});
