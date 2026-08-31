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
  assert.equal(restored[0].querySelector('.switch').getAttribute('aria-checked'), 'false');
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
