const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');
const worker = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'service-worker.js'), 'utf8');

const cssRule = selector => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`${escaped}\\{([^}]+)\\}`));
  assert.ok(match, `Missing CSS rule: ${selector}`);
  return match[1];
};

const relativeLuminance = hex => {
  const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrast = (foreground, background) => {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
};

test('Alarm adopts the supplied warm premium composition without changing other root screens', () => {
  assert.match(html, /<section class="screen active alarm-reference-remodel" data-screen="alarm"/);

  const screen = cssRule('.alarm-reference-remodel');
  assert.match(screen, /background:#f4f3ef/i);
  assert.match(screen, /--alarm-card:#fff/i);
  assert.match(screen, /--alarm-dark:#1a1918/i);

  assert.match(html, /@font-face\{font-family:"Newsreader";src:url\("\.\/newsreader-latin-300-600\.woff2"\)/);
  const heading = cssRule('.alarm-reference-remodel .page-header h1');
  assert.match(heading, /font-family:"Newsreader",var\(--font-editorial\)/);
  assert.match(heading, /font-size:44px!important/);
  assert.match(heading, /line-height:1!important/);

  const primaryTime = cssRule('.alarm-reference-remodel #alarmList .alarm-row.next-alarm .alarm-time');
  assert.match(primaryTime, /font-family:"Newsreader",var\(--font-editorial\)/);

  const primary = cssRule('.alarm-reference-remodel #alarmList .alarm-row.next-alarm');
  assert.match(primary, /min-height:250px/);
  assert.match(primary, /border-radius:32px/);
  assert.match(primary, /background:var\(--alarm-dark\)/);

  const secondary = cssRule('.alarm-reference-remodel .alarm-list .alarm-row:not\(.next-alarm\)');
  assert.match(secondary, /min-height:104px/);
  assert.match(secondary, /border-radius:32px/);
  assert.match(secondary, /background:var\(--alarm-card\)/);
});

test('Alarm remodeling preserves interaction and persistence hooks', () => {
  for (const id of ['alarmDate', 'editAlarms', 'addAlarm', 'alarmList', 'alarmStorageStatus']) {
    assert.match(html, new RegExp(`id="${id}"`), `Missing Alarm hook #${id}`);
  }
  for (const behavior of ['hydrateAlarms();', "document.getElementById('addAlarm').addEventListener", 'wireAlarmSwitch', 'wireAlarmEdit', 'refreshNextAlarm']) {
    assert.ok(html.includes(behavior), `Missing Alarm behavior: ${behavior}`);
  }
  assert.match(html, /--alarm-on:#34c759/);
  assert.match(html, /role="switch" aria-checked="true"/);
  assert.match(worker, /const CACHE='dreamworld-pwa-20260830-91'/);
  assert.match(worker, /'\.\/newsreader-latin-300-600\.woff2'/);
});

test('Alarm compact light-theme text maintains WCAG AA contrast', () => {
  const screen = cssRule('.alarm-reference-remodel');
  const muted = screen.match(/--alarm-muted:(#[0-9a-f]{6})/i)?.[1];
  const page = screen.match(/background:(#[0-9a-f]{6})/i)?.[1];
  const card = screen.match(/--alarm-card:(#[0-9a-f]{3,6})/i)?.[1].replace(/^#fff$/i, '#ffffff');
  assert.ok(muted && page && card, 'Alarm contrast tokens must be explicit hex colors');
  assert.ok(contrast(muted, page) >= 4.5, `Header metadata contrast is ${contrast(muted, page).toFixed(2)}:1`);
  assert.ok(contrast(muted, card) >= 4.5, `Secondary-card metadata contrast is ${contrast(muted, card).toFixed(2)}:1`);

  const note = cssRule('.alarm-reference-remodel .sleep-note');
  const noteColor = note.match(/(?:^|;)color:(#[0-9a-f]{6})/i)?.[1];
  assert.ok(noteColor, 'Sleep note color must be explicit');
  assert.ok(contrast(noteColor, page) >= 4.5, `Sleep-note contrast is ${contrast(noteColor, page).toFixed(2)}:1`);
});

test('the self-hosted Newsreader asset ships with its license', () => {
  const licensePath = path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'NEWSREADER_LICENSE.txt');
  assert.ok(fs.existsSync(licensePath), 'Newsreader license file is missing');
  assert.match(fs.readFileSync(licensePath, 'utf8'), /SIL OPEN FONT LICENSE Version 1\.1/i);
});
