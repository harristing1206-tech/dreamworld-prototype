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
  url: 'https://preview.test/dreamworld-wheel',
  pretendToBeVisual: true,
  virtualConsole,
  beforeParse(window){window.matchMedia=()=>({matches:false,media:'',addEventListener(){},removeEventListener(){}})}
});
const d = dom.window.document;
const nextTurn = () => new Promise(resolve => dom.window.setTimeout(resolve, 0));

(async () => {
  await nextTurn();
  assert.match(source, /scroll-snap-type:y mandatory/, 'wheel snap contract missing');
  assert.match(source, /-webkit-overflow-scrolling:touch/, 'iOS momentum scrolling missing');
  assert.match(source, /touch-action:pan-y/, 'vertical touch gesture contract missing');
  assert.match(source, /behavior:smooth&&!reduceWheelMotion\?'smooth':'auto'/, 'smooth settle with reduced-motion fallback missing');
  assert.match(source, /requestAnimationFrame\(\(\)=>\{frame=0;update\(\)\}\)/, 'scroll updates are not frame-synchronized');
  assert.match(source, /settleTimer=setTimeout\(settle,110\)/, 'deceleration settle timing missing');

  assert.equal(d.querySelectorAll('#hourWheel .wheel-item').length, 84);
  assert.equal(d.querySelectorAll('#minuteWheel .wheel-item').length, 180);
  assert.equal(d.querySelectorAll('#periodWheel .wheel-item').length, 2);
  assert.deepEqual([...d.querySelectorAll('#periodWheel .wheel-item')].map(item => item.textContent), ['AM', 'PM']);
  assert.equal(d.querySelectorAll('.wheel-item.selected').length, 3);
  assert.equal(d.getElementById('alarmHour').value, '7');
  assert.equal(d.getElementById('alarmMinute').value, '00');
  assert.equal(d.getElementById('alarmPeriod').value, 'AM');

  d.getElementById('addAlarm').click();
  assert.ok(d.getElementById('alarmSheet').classList.contains('open'));

  d.getElementById('hourWheel').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.equal(d.getElementById('alarmHour').value, '8');

  const pm = [...d.querySelectorAll('#periodWheel .wheel-item')].find(item => item.dataset.value === 'PM');
  pm.click();
  assert.equal(d.getElementById('alarmPeriod').value, 'PM');

  const beforeIDs = new Set([...d.querySelectorAll('.alarm-row')].map(row => row.dataset.id));
  const before = beforeIDs.size;
  d.getElementById('saveAlarm').click();
  assert.equal(d.querySelectorAll('.alarm-row').length, before + 1);
  const added = [...d.querySelectorAll('.alarm-row')].find(row => !beforeIDs.has(row.dataset.id));
  assert.ok(added, 'new alarm must be identifiable by its immutable dataset ID');
  assert.equal(added.querySelector('.alarm-value').textContent, '8:00');
  assert.equal(added.querySelector('.alarm-period').textContent, 'PM');
  assert.deepEqual(runtimeErrors, []);

  console.log('DREAMWORLD_SMOOTH_ALARM_WHEEL_VERIFIED');
  dom.window.close();
})().catch(error => {
  console.error(error);
  dom.window.close();
  process.exitCode = 1;
});
