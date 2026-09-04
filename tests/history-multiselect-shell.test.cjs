const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const route=path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges');
const html=fs.readFileSync(path.join(route,'index.html'),'utf8');
const worker=fs.readFileSync(path.join(route,'service-worker.js'),'utf8');
test('History top-left selection indicators ship as a coupled v94 app shell',()=>{
 assert.match(html,/const APP_SHELL_VERSION='94'/);
 assert.match(worker,/const CACHE='dreamworld-pwa-20260830-94'/);
 assert.match(html,/\.history-selection-actions \.history-selection-delete\{color:#a7523f\}/);
 assert.match(html,/\.history-select-indicator\{[^}]*border:1\.5px solid #8d8f89/);
});
