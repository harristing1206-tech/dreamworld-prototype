const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const route=path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges');
const html=fs.readFileSync(path.join(route,'index.html'),'utf8');
const worker=fs.readFileSync(path.join(route,'service-worker.js'),'utf8');

const captureTab=html.match(/<button class="tab log-tab"[\s\S]*?<\/button>/)?.[0]||'';

test('center navigation uses a truthful microphone signifier for Capture',()=>{
  assert.match(captureTab,/data-tab="log" aria-label="Capture a dream"/);
  assert.match(captureTab,/<svg[^>]*class="capture-tab-mic"[^>]*aria-hidden="true"/);
  assert.match(captureTab,/<rect x="8" y="3" width="8" height="12" rx="4"\/>/);
  assert.match(captureTab,/<path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"\/>/);
  assert.doesNotMatch(captureTab,/M12 5v14M5 12h14/);
});

test('Capture signifier preserves the established center-disc geometry',()=>{
  assert.match(html,/\.tab\.log-tab \.plus-disc\{width:44px;height:44px;min-width:44px;min-height:44px;flex-basis:44px/);
  assert.match(html,/\.tab\.log-tab \.capture-tab-mic\{width:22px;height:22px/);
});

test('Capture signifier ships in a fresh app-shell cache',()=>{
  assert.match(worker,/const CACHE='dreamworld-pwa-20260830-75'/);
});
