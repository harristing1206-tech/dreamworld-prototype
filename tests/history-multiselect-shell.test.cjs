const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const route=path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges');
const html=fs.readFileSync(path.join(route,'index.html'),'utf8');
const worker=fs.readFileSync(path.join(route,'service-worker.js'),'utf8');
test('History multi-select ships as a coupled v93 app shell',()=>{
 assert.match(html,/const APP_SHELL_VERSION='93'/);
 assert.match(worker,/const CACHE='dreamworld-pwa-20260830-93'/);
 assert.match(html,/\.history-selection-actions \.history-selection-delete\{color:#a7523f\}/);
});
