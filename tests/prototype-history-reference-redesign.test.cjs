const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const route = path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges');
const html = fs.readFileSync(path.join(route, 'index.html'), 'utf8');
const worker = fs.readFileSync(path.join(route, 'service-worker.js'), 'utf8');

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

test('History list adopts the supplied warm two-column card composition', () => {
  assert.match(html, /<section class="screen history-reference-remodel" data-screen="history"/);
  const screen = cssRule('.history-reference-remodel');
  assert.match(screen, /background:#f4f3ef/i);
  assert.match(screen, /--history-card:#fff/i);

  const list = cssRule('.history-reference-remodel .history-list');
  assert.match(list, /display:grid/);
  assert.match(list, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(list, /gap:16px/);

  const row = cssRule('.history-reference-remodel .history-swipe-row');
  assert.match(row, /min-height:190px/);
  assert.match(row, /border-radius:28px/);
  assert.match(row, /background:var\(--history-card\)/);

  const entry = cssRule('.history-reference-remodel .history-entry');
  assert.match(entry, /min-height:190px/);
  assert.match(entry, /padding:20px/);
  assert.match(entry, /display:flex/);
  assert.match(entry, /flex-direction:column/);

  const title = cssRule('.history-reference-remodel .history-entry h2');
  assert.match(title, /font-family:"Newsreader",var\(--font-editorial\)/);
  assert.match(title, /font-size:22px/);
  assert.match(title, /-webkit-line-clamp:2/);

  const excerpt = cssRule('.history-reference-remodel .history-entry-excerpt');
  assert.match(excerpt, /font-size:13px/);
  assert.match(excerpt, /-webkit-line-clamp:3/);
});

test('History list redesign preserves real data, search, edit, navigation, and deletion hooks', () => {
  for (const id of ['historyRailCount', 'editDreams', 'historySearch', 'historySearchEmpty', 'historyList']) {
    assert.match(html, new RegExp(`id="${id}"`), `Missing History hook #${id}`);
  }
  for (const behavior of [
    "document.getElementById('historySearch').addEventListener('input',filterHistoryRows)",
    "document.getElementById('editDreams').addEventListener",
    "openDreamFromInsights(record)",
    "openDreamEditor(record)",
    "buildSwipeActions(trigger=>requestDelete('dream',record,row,trigger))",
    "row.dataset.searchText=[shortHistoryDate(record),formatDuration(record.recording),record.title"
  ]) assert.ok(html.includes(behavior), `Missing History behavior: ${behavior}`);
  assert.match(html, /meta\.textContent=`\$\{shortHistoryDate\(record\)\} · \$\{formatDuration\(record\.recording\)\}`/);
  assert.match(html, /title\.textContent=record\.title/);
  assert.match(html, /excerpt\.textContent=record\.excerpt\|\|excerptForTranscript\(record\.transcript\|\|''\)/);
});

test('opened dream adopts the supplied hero, overlapping journal card, and floating audio composition', () => {
  assert.match(html, /<section class="history-focus" id="historyFocus"[\s\S]*?<div class="history-focus-hero">[\s\S]*?<div class="history-focus-toolbar">[\s\S]*?id="historyFocusBack"[\s\S]*?<div class="history-focus-hero-copy">[\s\S]*?id="historyFocusDate"[\s\S]*?id="historyFocusTitle"/);
  assert.match(html, /<div class="history-focus-card">[\s\S]*?<div class="history-focus-facts">[\s\S]*?id="historyFocusSleep"[\s\S]*?id="historyFocusRecording"[\s\S]*?id="historyFocusRecall"/);
  assert.match(html, /<section class="history-focus-section history-focus-summary">[\s\S]*?id="historyFocusExcerpt"/);
  assert.match(html, /<section class="history-focus-section history-focus-transcript-section">[\s\S]*?id="historyFocusTranscript"[\s\S]*?id="historyFocusTranscriptText"/);
  assert.match(html, /class="history-audio-player" id="historyAudioPlayer"/);

  const focus = cssRule('.history-reference-remodel .history-focus');
  assert.match(focus, /position:absolute/);
  assert.match(focus, /inset:0/);
  assert.match(focus, /overflow-y:auto/);

  const hero = cssRule('.history-reference-remodel .history-focus-hero');
  assert.match(hero, /min-height:360px/);
  assert.match(hero, /radial-gradient/);

  const detailTitle = cssRule('.history-reference-remodel .history-focus h2');
  assert.match(detailTitle, /font-family:"Newsreader",var\(--font-editorial\)/);
  assert.match(detailTitle, /font-size:48px/);

  const card = cssRule('.history-reference-remodel .history-focus-card');
  assert.match(card, /margin:-28px 24px 0/);
  assert.match(card, /border-radius:32px/);
  assert.match(card, /padding:28px/);

  const player = cssRule('.history-reference-remodel .history-audio-player');
  assert.match(player, /position:sticky/);
  assert.match(player, /bottom:16px/);
  assert.match(player, /background:#1a1918/);
});

test('opened dream redesign preserves back, transcript, metadata, playback, and focus behavior', () => {
  for (const id of ['historyFocusBack', 'historyFocusDate', 'historyFocusTitle', 'historyFocusSleep', 'historyFocusRecording', 'historyFocusRecall', 'historyFocusExcerpt', 'historyFocusTranscript', 'historyFocusTranscriptText', 'historyFocusAudio', 'historyAudioPlayer', 'historyAudioStatus', 'historyAudioPause', 'historyAudioExit']) {
    assert.match(html, new RegExp(`id="${id}"`), `Missing detail hook #${id}`);
  }
  for (const behavior of [
    "document.getElementById('historyFocusBack').addEventListener('click',()=>closeDreamDetail())",
    "document.getElementById('historyFocusTranscript').addEventListener",
    "document.getElementById('historyFocusAudio').addEventListener",
    "document.getElementById('historyAudioPause').addEventListener",
    "document.getElementById('historyAudioExit').addEventListener",
    "document.getElementById('historyFocusDate').textContent=record.date",
    "document.getElementById('historyFocusTitle').textContent=record.title",
    "document.getElementById('historyFocusSleep').textContent=formatMinutes(record.sleep)",
    "document.getElementById('historyFocusRecording').textContent=formatSeconds(record.recording)",
    "document.getElementById('historyFocusRecall').textContent=record.recall||'Unrated'",
    "requestAnimationFrame(()=>document.getElementById('historyFocusTitle').focus())"
  ]) assert.ok(html.includes(behavior), `Missing detail behavior: ${behavior}`);
  assert.doesNotMatch(html, /Symbols Identified|Phone Booth|Grey Fog|Heavy Coat/, 'Reference-only fabricated symbols must not enter real History');
  assert.match(worker, /const CACHE='dreamworld-pwa-20260830-89'/);
});

test('History compact text meets the WCAG AA contrast floor in light and dark themes', () => {
  const light = cssRule('.history-reference-remodel');
  const lightMuted = light.match(/--history-muted:(#[0-9a-f]{6})/i)?.[1];
  const lightPage = light.match(/background:(#[0-9a-f]{6})/i)?.[1];
  const lightCard = light.match(/--history-card:(#[0-9a-f]{3,6})/i)?.[1].replace(/^#fff$/i, '#ffffff');
  assert.ok(contrast(lightMuted, lightPage) >= 4.5);
  assert.ok(contrast(lightMuted, lightCard) >= 4.5);
  assert.ok(contrast('#5e7057', lightPage) >= 4.5, 'detail date must remain readable over the hero base');
  assert.ok(contrast('#4e4d49', lightCard) >= 4.5, 'summary must remain readable on the detail card');
  assert.ok(contrast('#3f3e3a', lightPage) >= 4.5, 'expanded transcript must remain readable');

  const dark = cssRule(':root[data-theme="dark"] .history-reference-remodel');
  const darkMuted = dark.match(/--history-muted:(#[0-9a-f]{6})/i)?.[1];
  const darkPage = dark.match(/background:(#[0-9a-f]{6})/i)?.[1];
  const darkCard = dark.match(/--history-card:(#[0-9a-f]{6})/i)?.[1];
  assert.ok(contrast(darkMuted, darkPage) >= 4.5);
  assert.ok(contrast(darkMuted, darkCard) >= 4.5);
  assert.doesNotMatch(cssRule('.history-reference-remodel .history-entry-meta'), /font-size:(?:9|10)px/);

  const audioPause = cssRule('.history-reference-remodel .history-audio-controls #historyAudioPause');
  const audioPauseBackground = audioPause.match(/background:(#[0-9a-f]{6})/i)?.[1];
  assert.ok(audioPauseBackground, 'raw-audio Pause background must be explicit');
  assert.ok(contrast('#ffffff', audioPauseBackground) >= 4.5, `raw-audio Pause contrast is ${contrast('#ffffff', audioPauseBackground).toFixed(2)}:1`);
});

test('History edit and revealed-delete controls preserve mobile touch targets', () => {
  const dormantMinus = cssRule('.history-reference-remodel .history-swipe-row>.edit-minus');
  assert.match(dormantMinus, /position:absolute/, 'hidden Edit control must not create a tappable blank row above the card button');
  const minus = cssRule('.history-reference-remodel #historyList.editing .history-swipe-row .edit-minus');
  assert.match(minus, /width:44px/);
  assert.match(minus, /height:44px/);
  assert.match(minus, /transform:none/);
  assert.match(minus, /transition:opacity 180ms ease/);
  const minusDisc = cssRule('.history-reference-remodel #historyList.editing .history-swipe-row .edit-minus:before');
  assert.match(minusDisc, /width:26px/);
  assert.match(minusDisc, /height:26px/);
  assert.match(html, /\.swipe-action\{min-width:72px;min-height:44px/);
});
