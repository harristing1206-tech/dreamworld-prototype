const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const route=path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges');
const html=fs.readFileSync(path.join(route,'index.html'),'utf8');
const worker=fs.readFileSync(path.join(route,'service-worker.js'),'utf8');

test('PWA replaces legacy Dreamworld caches rather than retaining a stale transcription client',()=>{
 assert.match(worker,/key\.startsWith\('dreamworld-'\)&&key!==CACHE/);
 assert.doesNotMatch(worker,/key\.startsWith\('dreamworld-pwa-'\)/);
 assert.match(worker,/const CACHE='dreamworld-pwa-20260830-91'/);
});

test('a newly activated service worker reloads one stale document without a loop',()=>{
 assert.match(html,/const APP_SHELL_VERSION='91',SW_RELOAD_GUARD='dreamworld:sw-reloaded'/);
 assert.match(html,/navigator\.serviceWorker\.addEventListener\('controllerchange'/);
 assert.match(html,/sessionStorage\.getItem\(SW_RELOAD_GUARD\)/);
 assert.match(html,/sessionStorage\.setItem\(SW_RELOAD_GUARD,APP_SHELL_VERSION\)/);
 assert.match(html,/window\.location\.reload\(\)/);
 assert.match(html,/registration\.update\(\)/);
});
