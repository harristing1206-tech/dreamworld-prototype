const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const source = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');
const STORAGE_KEY = 'dreamworld:alarms-v1';

function makeDom(savedAlarms = null, { storageReadFails = false } = {}) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(source, {
    runScripts: 'dangerously',
    url: 'https://preview.test/dreamworld-alarm-persistence',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      window.matchMedia = () => ({ matches: false, media: '', addEventListener() {}, removeEventListener() {} });
      Object.defineProperty(window.navigator, 'serviceWorker', { configurable: true, value: { register: async () => ({ update: async () => {} }) } });
      const stores=new Map();let version=0;window.indexedDB={open(_name,nextVersion){const request={};window.setTimeout(()=>{const db={objectStoreNames:{contains:name=>stores.has(name)},createObjectStore(name){stores.set(name,new Map())},transaction(name){const tx={error:null,objectStore(){const store=stores.get(name);return{getAll(){const result={};window.setTimeout(()=>{result.result=[...store.values()];result.onsuccess?.()},0);return result},getAllKeys(){const result={};window.setTimeout(()=>{result.result=[...store.keys()];result.onsuccess?.()},0);return result},put(value,key){store.set(key,value);window.setTimeout(()=>tx.oncomplete?.(),0)},delete(key){store.delete(key);window.setTimeout(()=>tx.oncomplete?.(),0)}}}};return tx},close(){}};request.result=db;if(nextVersion>version){version=nextVersion;request.onupgradeneeded?.()}request.onsuccess?.()},0);return request}};
      if (savedAlarms !== null) window.localStorage.setItem(STORAGE_KEY, savedAlarms);
      if (storageReadFails) window.Storage.prototype.getItem = function getItemDenied() { throw new Error('storage read denied'); };
    }
  });
  return { dom, errors };
}

const wait = (dom, milliseconds = 0) => new Promise(resolve => dom.window.setTimeout(resolve, milliseconds));

test('alarm edits, enabled state, additions, and deletion survive reload', async () => {
  const first = makeDom();
  const document = first.dom.window.document;
  await wait(first.dom, 10);

  const firstRow = document.querySelector('#alarmList .alarm-row');
  const firstAlarmID = firstRow.dataset.id;
  firstRow.querySelector('.switch').click();
  assert.equal(firstRow.querySelector('.switch').getAttribute('aria-checked'), 'false');

  document.getElementById('addAlarm').click();
  document.getElementById('alarmHour').value = '9';
  document.getElementById('alarmMinute').value = '15';
  document.getElementById('alarmPeriod').value = 'PM';
  document.getElementById('alarmLabel').value = 'Dream review';
  document.getElementById('saveAlarm').click();
  assert.equal(document.querySelectorAll('#alarmList .alarm-row').length, 3);

  const saved = first.dom.window.localStorage.getItem(STORAGE_KEY);
  assert.ok(saved, 'alarm state must be written durably');
  first.dom.window.close();

  const second = makeDom(saved);
  await wait(second.dom, 10);
  const restored = [...second.dom.window.document.querySelectorAll('#alarmList .alarm-row')];
  assert.equal(restored.length, 3);
  assert.equal(restored.find(row => row.dataset.id === firstAlarmID).querySelector('.switch').getAttribute('aria-checked'), 'false');
  const added = restored.find(row => row.dataset.label === 'Dream review');
  assert.ok(added, 'added alarm must survive reload');
  assert.deepEqual(
    { hour: added.dataset.hour, minute: added.dataset.minute, period: added.dataset.period, label: added.dataset.label },
    { hour: '9', minute: '15', period: 'PM', label: 'Dream review' }
  );

  second.dom.window.document.getElementById('editAlarms').click();
  added.querySelector('.edit-minus').click();
  added.querySelector('.swipe-action.delete').click();
  second.dom.window.document.getElementById('confirmDelete').click();
  await wait(second.dom, 20);
  assert.equal(second.dom.window.document.querySelectorAll('#alarmList .alarm-row').length, 2);
  const afterDelete = second.dom.window.localStorage.getItem(STORAGE_KEY);
  second.dom.window.close();

  const third = makeDom(afterDelete);
  await wait(third.dom, 10);
  assert.equal(third.dom.window.document.querySelectorAll('#alarmList .alarm-row').length, 2);
  assert.equal([...third.dom.window.document.querySelectorAll('#alarmList .alarm-row')].some(row => row.dataset.label === 'Dream review'), false);
  assert.deepEqual(first.errors, []);
  assert.deepEqual(second.errors, []);
  assert.deepEqual(third.errors, []);
  third.dom.window.close();
});

test('NEXT WAKE follows the next enabled alarm instead of DOM position', async () => {
  const fixture=makeDom();
  const document=fixture.dom.window.document;
  await wait(fixture.dom,10);
  const rows=[...document.querySelectorAll('#alarmList .alarm-row')];
  assert.equal(rows.filter(row=>row.classList.contains('next-alarm')).length,1);
  const initialNext=document.querySelector('#alarmList .alarm-row.next-alarm'),initialID=initialNext.dataset.id;
  const other=rows.find(row=>row!==initialNext);
  const otherID=other.dataset.id;
  if(other.querySelector('.switch').getAttribute('aria-checked')!=='true')other.querySelector('.switch').click();
  document.querySelector(`#alarmList .alarm-row[data-id="${initialID}"] .switch`).click();
  assert.equal(document.querySelector(`#alarmList .alarm-row[data-id="${initialID}"]`).classList.contains('next-alarm'),false);
  assert.equal(document.querySelector(`#alarmList .alarm-row[data-id="${otherID}"]`).classList.contains('next-alarm'),true);
  assert.equal(document.querySelector('#alarmList .alarm-row').dataset.id,otherID,'next enabled alarm must move to the primary card position');
  assert.deepEqual(fixture.errors,[]);
  fixture.dom.window.close();
});

test('a stale alarm tab merges mutations with newer durable records and storage events resync the UI', async () => {
  const fixture=makeDom();const {document}=fixture.dom.window;await wait(fixture.dom,10);
  const current=JSON.parse(fixture.dom.window.localStorage.getItem(STORAGE_KEY));
  const external={id:'alarm-external-abcdefgh',hour:'9',minute:'45',period:'AM',label:'Other tab',repeat:'Once',enabled:true};
  const newer=[...current,external];fixture.dom.window.localStorage.setItem(STORAGE_KEY,JSON.stringify(newer));
  document.querySelector('#alarmList .alarm-row .switch').click();
  const merged=JSON.parse(fixture.dom.window.localStorage.getItem(STORAGE_KEY));
  assert.equal(merged.length,3,'stale toggle must not drop a newer alarm');
  assert.ok(merged.some(record=>record.id===external.id),'cross-tab addition must survive stale mutation');
  fixture.dom.window.localStorage.setItem(STORAGE_KEY,JSON.stringify(newer));
  fixture.dom.window.dispatchEvent(new fixture.dom.window.StorageEvent('storage',{key:STORAGE_KEY,newValue:JSON.stringify(newer)}));await wait(fixture.dom,10);
  assert.ok(document.querySelector(`#alarmList .alarm-row[data-id="${external.id}"]`),'storage event must refresh alarm UI');
  assert.deepEqual(fixture.errors,[]);fixture.dom.window.close();
});

test('alarm and dream sheets contain focus and restore it on close', async () => {
  const fixture=makeDom();
  const document=fixture.dom.window.document;
  await wait(fixture.dom,10);
  const add=document.getElementById('addAlarm');add.focus();add.click();await wait(fixture.dom,10);
  assert.equal(document.querySelector('.viewport').inert,true);
  assert.equal(document.querySelector('.tabbar').inert,true);
  assert.equal(document.activeElement,document.getElementById('cancelAlarm'));
  document.getElementById('hourWheel').focus();document.getElementById('hourWheel').dispatchEvent(new fixture.dom.window.KeyboardEvent('keydown',{key:'Tab',bubbles:true}));
  assert.equal(document.activeElement,document.getElementById('minuteWheel'),'Tab must skip wheel options with tabindex -1');
  document.getElementById('alarmLabel').focus();document.getElementById('alarmLabel').dispatchEvent(new fixture.dom.window.KeyboardEvent('keydown',{key:'Tab',bubbles:true}));
  assert.ok(document.getElementById('alarmSheet').contains(document.activeElement));
  document.getElementById('cancelAlarm').click();await wait(fixture.dom,10);
  assert.equal(document.querySelector('.viewport').inert,false);
  assert.equal(document.activeElement,add);
  const alarmEdit=document.querySelector('#alarmList .alarm-row .alarm-edit'),alarmID=alarmEdit.closest('.alarm-row').dataset.id;alarmEdit.focus();alarmEdit.click();await wait(fixture.dom,10);document.getElementById('saveAlarm').click();await wait(fixture.dom,10);
  assert.equal(document.activeElement,document.querySelector(`#alarmList .alarm-row[data-id="${alarmID}"] .alarm-edit`),'alarm save must restore focus by immutable ID after hydration');
  const liveEdit=document.querySelector(`#alarmList .alarm-row[data-id="${alarmID}"] .alarm-edit`);liveEdit.click();await wait(fixture.dom,10);const durable=JSON.parse(fixture.dom.window.localStorage.getItem(STORAGE_KEY)),pending={id:'alarm-pending-sync-abcdefgh',hour:'10',minute:'10',period:'AM',label:'Pending sync',repeat:'Once',enabled:true};fixture.dom.window.localStorage.setItem(STORAGE_KEY,JSON.stringify([...durable,pending]));fixture.dom.window.dispatchEvent(new fixture.dom.window.StorageEvent('storage',{key:STORAGE_KEY,newValue:JSON.stringify([...durable,pending])}));document.getElementById('cancelAlarm').click();await wait(fixture.dom,10);
  assert.ok(document.querySelector(`#alarmList .alarm-row[data-id="${pending.id}"]`),'deferred storage event must hydrate after the editor closes');
  assert.equal(document.activeElement.classList.contains('alarm-edit'),true,document.activeElement.outerHTML);
  assert.equal(document.activeElement.closest('.alarm-row')?.dataset.id,alarmID,'deferred hydration must restore focus to the live opener alarm identity');

  document.querySelector('[data-tab="history"]').click();
  const entry=document.querySelector('#historyList .history-entry');entry.focus();entry.click();await new Promise(resolve=>fixture.dom.window.requestAnimationFrame(()=>resolve()));document.getElementById('historyFocusEdit').click();await wait(fixture.dom,10);
  assert.equal(document.querySelector('.viewport').inert,true);
  assert.equal(document.activeElement,document.getElementById('dreamEditName'));
  document.getElementById('cancelDreamEdit').click();await wait(fixture.dom,10);
  assert.equal(document.querySelector('.viewport').inert,false);
  assert.equal(document.activeElement,document.getElementById('historyFocusEdit'));
  assert.deepEqual(fixture.errors,[]);
  fixture.dom.window.close();
});

test('alarm storage failure cannot appear saved, toggled, or deleted', async () => {
  const fixture = makeDom();
  const { document, Storage } = fixture.dom.window;
  await wait(fixture.dom, 10);
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function setItemDenied() { throw new Error('storage denied'); };

  const firstRow = document.querySelector('#alarmList .alarm-row');
  assert.equal(firstRow.querySelector('.switch').getAttribute('aria-checked'), 'true');
  firstRow.querySelector('.switch').click();
  assert.equal(firstRow.querySelector('.switch').getAttribute('aria-checked'), 'true', 'failed toggle must visibly revert');
  assert.match(document.getElementById('toast').textContent, /could not save that alarm change/i);

  const initialCount = document.querySelectorAll('#alarmList .alarm-row').length;
  document.getElementById('addAlarm').click();
  document.getElementById('alarmLabel').value = 'Unsaved alarm';
  document.getElementById('saveAlarm').click();
  assert.equal(document.querySelectorAll('#alarmList .alarm-row').length, initialCount, 'failed add must not create a ghost row');
  assert.ok(document.getElementById('alarmSheet').classList.contains('open'), 'failed add must stay recoverable in the editor');

  document.getElementById('cancelAlarm').click();
  document.getElementById('editAlarms').click();
  firstRow.querySelector('.edit-minus').click();
  firstRow.querySelector('.swipe-action.delete').click();
  document.getElementById('confirmDelete').click();
  await wait(fixture.dom, 10);
  assert.equal(document.querySelectorAll('#alarmList .alarm-row').length, initialCount, 'failed delete must preserve the alarm row');
  assert.equal(document.getElementById('deleteConfirm').hidden, false, 'failed delete must keep recovery context visible');

  Storage.prototype.setItem = originalSetItem;
  assert.deepEqual(fixture.errors, []);
  fixture.dom.window.close();
});

test('alarm edit preserves immutable identity and survives reload', async () => {
  const first = makeDom();
  const document = first.dom.window.document;
  await wait(first.dom, 10);
  const row = document.querySelector('#alarmList .alarm-row');
  const alarmID = row.dataset.id;
  row.querySelector('.alarm-edit').click();
  document.getElementById('alarmHour').value = '11';
  document.getElementById('alarmMinute').value = '20';
  document.getElementById('alarmPeriod').value = 'PM';
  document.getElementById('alarmLabel').value = 'Edited wake';
  document.getElementById('saveAlarm').click();
  assert.equal(row.dataset.id, alarmID);
  const saved = first.dom.window.localStorage.getItem(STORAGE_KEY);
  first.dom.window.close();

  const second = makeDom(saved);
  await wait(second.dom, 10);
  const restored = second.dom.window.document.querySelector(`#alarmList .alarm-row[data-id="${alarmID}"]`);
  assert.ok(restored);
  assert.deepEqual(
    { hour: restored.dataset.hour, minute: restored.dataset.minute, period: restored.dataset.period, label: restored.dataset.label },
    { hour: '11', minute: '20', period: 'PM', label: 'Edited wake' }
  );
  assert.deepEqual(first.errors, []);
  assert.deepEqual(second.errors, []);
  second.dom.window.close();
});

test('alarm hydration quarantines malformed and duplicate records without resurrecting seeds', async () => {
  const valid = { id: 'alarm-valid-1', hour: '10', minute: '05', period: 'AM', label: 'Keep me', repeat: 'Once', enabled: true };
  const duplicate = { ...valid, label: 'Duplicate must not win' };
  const malformed = { id: 'bad', hour: '99', minute: '99', period: 'XX', label: '', repeat: '', enabled: 'yes' };
  const raw = JSON.stringify([valid, malformed, duplicate]);
  const fixture = makeDom(raw);
  await wait(fixture.dom, 10);
  const rows = [...fixture.dom.window.document.querySelectorAll('#alarmList .alarm-row')];
  assert.equal(rows.length, 1);
  assert.equal(rows[0].dataset.id, valid.id);
  assert.equal(rows[0].dataset.label, valid.label);
  assert.equal(fixture.dom.window.localStorage.getItem(STORAGE_KEY), raw, 'hydration must not destructively rewrite quarantined storage');
  assert.equal(fixture.dom.window.document.getElementById('addAlarm').disabled, true);
  assert.equal(rows[0].querySelector('.alarm-edit').disabled, true);
  assert.equal(rows[0].querySelector('.switch').disabled, true);
  rows[0].querySelector('.alarm-edit').click();
  assert.equal(fixture.dom.window.document.getElementById('alarmSheet').classList.contains('open'), false);
  assert.match(fixture.dom.window.document.getElementById('alarmStorageStatus').textContent, /editing is paused/i);
  assert.deepEqual(fixture.errors, []);
  fixture.dom.window.close();
});

test('an intentionally empty alarm collection remains empty after reload', async () => {
  const fixture = makeDom('[]');
  await wait(fixture.dom, 10);
  assert.equal(fixture.dom.window.document.querySelectorAll('#alarmList .alarm-row').length, 0);
  assert.equal(fixture.dom.window.localStorage.getItem(STORAGE_KEY), '[]');
  assert.deepEqual(fixture.errors, []);
  fixture.dom.window.close();
});

test('alarm read failure remains distinct from an intentionally empty collection', async () => {
  const fixture = makeDom(null, { storageReadFails: true });
  await wait(fixture.dom, 10);
  const document = fixture.dom.window.document;
  assert.equal(document.querySelectorAll('#alarmList .alarm-row').length, 0);
  assert.equal(document.getElementById('addAlarm').disabled, true);
  assert.equal(document.getElementById('editAlarms').disabled, true);
  assert.equal(document.getElementById('alarmStorageStatus').hidden, false);
  assert.match(document.getElementById('alarmStorageStatus').textContent, /temporarily unavailable/i);
  assert.deepEqual(fixture.errors, []);
  fixture.dom.window.close();
});
