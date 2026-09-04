const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const route=path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges');
const html=fs.readFileSync(path.join(route,'index.html'),'utf8');
const worker=fs.readFileSync(path.join(route,'service-worker.js'),'utf8');
const cssRule=selector=>{const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=html.match(new RegExp(`${escaped}\\{([^}]+)\\}`));assert.ok(match,`Missing CSS rule: ${selector}`);return match[1]};

test('Profile adopts the supplied identity-first grouped settings hierarchy',()=>{
 assert.match(html,/<section class="screen profile-reference-remodel" data-screen="profile"[\s\S]*?<header class="profile-head page-header">[\s\S]*?My Dream World[\s\S]*?<h1>Profile<\/h1>[\s\S]*?<button class="profile-identity" id="showProfile"[\s\S]*?<span class="profile-avatar">H<\/span>[\s\S]*?<strong>Harris<\/strong>[\s\S]*?<section class="profile-section profile-preferences"[\s\S]*?<h2[^>]*>Preferences<\/h2>[\s\S]*?id="appearanceSetting"[\s\S]*?System alarm status[\s\S]*?data-setting="snooze"[\s\S]*?<section class="profile-section profile-data"[\s\S]*?<h2[^>]*>Capture &amp; data<\/h2>[\s\S]*?Microphone[\s\S]*?data-setting="transcription"[\s\S]*?data-setting="recordings"/);
 assert.doesNotMatch(html,/eleanor@example\.com|Somni Plus|Notifications|Export Data|Sign Out/);
});

test('Profile uses warm grouped cards, a 64px avatar, and readable iPhone spacing',()=>{
 const screen=cssRule('.profile-reference-remodel');assert.match(screen,/background:#f4f3ef/);assert.match(screen,/padding-bottom:48px/);
 const title=cssRule('.profile-reference-remodel .page-header h1');assert.match(title,/font-family:"Newsreader",var\(--font-editorial\)/);assert.match(title,/font-size:44px!important/);
 const identity=cssRule('.profile-reference-remodel .profile-identity');assert.match(identity,/min-height:88px/);assert.match(identity,/border:0/);
 const avatar=cssRule('.profile-reference-remodel .profile-avatar');assert.match(avatar,/width:64px/);assert.match(avatar,/height:64px/);assert.match(avatar,/background:#e3e8e4/);
 const section=cssRule('.profile-reference-remodel .profile-section');assert.match(section,/margin-top:30px/);
 const group=cssRule('.profile-reference-remodel .settings-group');assert.match(group,/border:1px solid/);assert.match(group,/border-radius:22px/);assert.match(group,/overflow:hidden/);
 const row=cssRule('.profile-reference-remodel .setting-row');assert.match(row,/min-height:72px/);assert.match(row,/grid-template-columns:40px minmax\(0,1fr\) auto/);
 assert.match(html,/@media\(max-width:350px\)[\s\S]*?\.profile-reference-remodel\{padding-left:16px;padding-right:16px/);
});

test('Profile redesign preserves real controls and truthful static capability rows',()=>{
 for(const id of['showProfile','appearanceSetting','appearanceStatus'])assert.match(html,new RegExp(`id="${id}"`));
 for(const setting of['snooze','transcription','recordings'])assert.match(html,new RegExp(`data-setting="${setting}"`));
 for(const hook of["document.getElementById('appearanceSetting').addEventListener('click',cycleAppearance)","document.getElementById('showProfile').addEventListener('click'",'Native AlarmKit build required','Native setting unavailable in this prototype','Private whisper.cpp server','Review or delete in History'])assert.ok(html.includes(hook),`Missing Profile behavior/copy: ${hook}`);
});

test('Profile redesign ships in a fresh installed app shell',()=>{
 assert.match(worker,/const CACHE='dreamworld-pwa-20260830-91'/);
});
