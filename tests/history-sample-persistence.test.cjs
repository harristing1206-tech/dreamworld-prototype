const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');
const SAMPLE_STATE_KEY='dreamworld:sample-state-v1';
function makeDom(sampleState=null){const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));const dom=new JSDOM(source,{runScripts:'dangerously',url:'https://preview.test/history-samples',pretendToBeVisual:true,virtualConsole:vc,beforeParse(window){window.matchMedia=()=>({matches:true,media:'',addEventListener(){},removeEventListener(){}});Object.defineProperty(window.navigator,'serviceWorker',{configurable:true,value:{register:async()=>({update:async()=>{}})}});const stores=new Map();let version=0;window.indexedDB={open(_name,nextVersion){const request={};window.setTimeout(()=>{const db={objectStoreNames:{contains:name=>stores.has(name)},createObjectStore(name){stores.set(name,new Map())},transaction(name){const tx={error:null,objectStore(){const store=stores.get(name);return{getAll(){const result={};window.setTimeout(()=>{result.result=[...store.values()];result.onsuccess?.()},0);return result},put(value,key){store.set(key,value);window.setTimeout(()=>tx.oncomplete?.(),0)},delete(key){store.delete(key);window.setTimeout(()=>tx.oncomplete?.(),0)}}}};return tx},close(){}};request.result=db;if(nextVersion>version){version=nextVersion;request.onupgradeneeded?.()}request.onsuccess?.()},0);return request}};if(sampleState!==null)window.localStorage.setItem(SAMPLE_STATE_KEY,sampleState)}});return{dom,errors}}
const wait=(dom,ms=20)=>new Promise(r=>dom.window.setTimeout(r,ms));

test('sample edits persist across reload and save restores focus by record identity',async()=>{
 const first=makeDom();await wait(first.dom);const d=first.dom.window.document;d.querySelector('[data-tab="history"]').click();d.getElementById('editDreams').click();const opener=d.querySelector('.history-entry[data-entry-id="sample-2026-08-25"]');opener.focus();opener.click();await wait(first.dom);
 d.getElementById('dreamEditName').value='Persistent edit check';d.getElementById('saveDreamEdit').click();await wait(first.dom);
 assert.equal(d.activeElement.dataset.entryId,'sample-2026-08-25','focus must move to the rerendered entry with the same immutable ID');
 assert.equal(d.querySelector('.history-entry[data-entry-id="sample-2026-08-25"] h2').textContent,'Persistent edit check');
 assert.ok([...d.querySelectorAll('#historyList .edit-minus')].every(button=>button.tabIndex===0&&button.getAttribute('aria-hidden')==='false'),'rerendered Edit controls must retain visible Edit-mode accessibility');
 const state=first.dom.window.localStorage.getItem(SAMPLE_STATE_KEY);assert.ok(state,'sample edit must write durable overlay state');assert.deepEqual(first.errors,[]);first.dom.window.close();
 const second=makeDom(state);await wait(second.dom);const d2=second.dom.window.document;assert.equal(d2.querySelector('.history-entry[data-entry-id="sample-2026-08-25"] h2').textContent,'Persistent edit check');assert.deepEqual(second.errors,[]);second.dom.window.close();
});

test('confirmed sample deletion persists across reload',async()=>{
 const first=makeDom();await wait(first.dom);const d=first.dom.window.document;d.querySelector('[data-tab="history"]').click();d.getElementById('editDreams').click();const row=d.querySelector('.history-swipe-row[data-entry-id="sample-2026-08-25"]');row.querySelector('.edit-minus').click();row.querySelector('.swipe-action.delete').click();d.getElementById('confirmDelete').click();await wait(first.dom,30);
 assert.equal(d.querySelector('.history-entry[data-entry-id="sample-2026-08-25"]'),null);const state=first.dom.window.localStorage.getItem(SAMPLE_STATE_KEY);assert.ok(state,'sample deletion must write a durable tombstone');assert.deepEqual(first.errors,[]);first.dom.window.close();
 const second=makeDom(state);await wait(second.dom);const d2=second.dom.window.document;assert.equal(d2.querySelector('.history-entry[data-entry-id="sample-2026-08-25"]'),null,'deleted sample must not resurrect');assert.equal(d2.querySelectorAll('.history-entry').length,5);assert.deepEqual(second.errors,[]);second.dom.window.close();
});

test('sample edit storage failure remains recoverable and never reports success',async()=>{
 const fixture=makeDom();await wait(fixture.dom);const {document,Storage}=fixture.dom.window;document.querySelector('[data-tab="history"]').click();document.getElementById('editDreams').click();const entry=document.querySelector('.history-entry[data-entry-id="sample-2026-08-25"]');entry.click();await wait(fixture.dom);const original=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error('denied')};document.getElementById('dreamEditName').value='Must not appear saved';document.getElementById('saveDreamEdit').click();await wait(fixture.dom);
 assert.equal(document.getElementById('dreamEditSheet').classList.contains('open'),true);assert.equal(document.querySelector('.history-entry[data-entry-id="sample-2026-08-25"] h2').textContent,'The station beneath the lake');assert.match(document.getElementById('toast').textContent,/could not save/i);Storage.prototype.setItem=original;assert.deepEqual(fixture.errors,[]);fixture.dom.window.close();
});

test('History delete affordances enter the keyboard and accessibility flow only in Edit mode',async()=>{
 const fixture=makeDom();await wait(fixture.dom);const {document:d}=fixture.dom.window;d.querySelector('[data-tab="history"]').click();const minuses=()=>[...d.querySelectorAll('#historyList .edit-minus')],deletes=()=>[...d.querySelectorAll('#historyList .swipe-action.delete')];
 assert.ok(minuses().length>0);assert.equal(fixture.dom.window.getComputedStyle(minuses()[0]).position,'absolute','hidden Edit control must not create a blank tappable strip');assert.ok(minuses().every(button=>button.tabIndex===-1&&button.getAttribute('aria-hidden')==='true'));assert.ok(deletes().every(button=>button.tabIndex===-1&&button.getAttribute('aria-hidden')==='true'));
 const normalEntry=d.querySelector('#historyList .history-entry');normalEntry.click();await wait(fixture.dom);assert.equal(d.getElementById('historyFocus').hidden,false);assert.equal(d.getElementById('deleteConfirm').hidden,true);d.getElementById('historyFocusBack').click();
 d.getElementById('editDreams').click();
 assert.ok(minuses().every(button=>button.tabIndex===0&&button.getAttribute('aria-hidden')==='false'));assert.ok(deletes().every(button=>button.tabIndex===-1&&button.getAttribute('aria-hidden')==='true'));
 minuses()[0].click();assert.equal(deletes()[0].tabIndex,0);assert.equal(deletes()[0].getAttribute('aria-hidden'),'false');
 minuses()[0].click();assert.equal(deletes()[0].tabIndex,-1);assert.equal(deletes()[0].getAttribute('aria-hidden'),'true');
 d.getElementById('editDreams').click();
 assert.ok(minuses().every(button=>button.tabIndex===-1&&button.getAttribute('aria-hidden')==='true'));assert.ok(deletes().every(button=>button.tabIndex===-1&&button.getAttribute('aria-hidden')==='true'));
 assert.deepEqual(fixture.errors,[]);fixture.dom.window.close();
});
