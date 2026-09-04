const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

test('journal hydration distinguishes unavailable storage and never substitutes sample history',async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));const dom=new JSDOM(source,{runScripts:'dangerously',url:'https://preview.test/journal-unavailable',pretendToBeVisual:true,virtualConsole:vc,beforeParse(window){window.matchMedia=()=>({matches:false,media:'',addEventListener(){},removeEventListener(){}});Object.defineProperty(window.navigator,'serviceWorker',{configurable:true,value:{register:async()=>({update:async()=>{}})}});window.indexedDB={open(){const request={};window.setTimeout(()=>{request.error=new Error('IndexedDB unavailable');request.onerror?.()},0);return request}}}});await new Promise(r=>dom.window.setTimeout(r,40));const d=dom.window.document;
 assert.equal(d.querySelectorAll('#historyList .history-entry').length,0,'sample records must not cover an unavailable real journal');
 assert.equal(d.getElementById('historyRailCount').textContent,'0 dreams');
 assert.match(d.getElementById('toast').textContent,/saved dreams are temporarily unavailable/i);
 assert.match(source,/return\{state:'unavailable',records:\[\],keys:\[\]\}/);
 assert.deepEqual(errors,[]);dom.window.close();
});
