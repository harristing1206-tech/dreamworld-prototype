const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');
function luminance(hex){const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*channels[0]+.7152*channels[1]+.0722*channels[2]}
function contrast(a,b){const [light,dark]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (light+.05)/(dark+.05)}

test('v4 small text and clay actions clear AA contrast in both themes',()=>{
  assert.match(html,/--faint:#70736c/);
  assert.match(html,/--highlight:#a7523f/);
  assert.match(html,/:root\[data-theme="dark"\]\{[^}]*--highlight:#ad5944/);
  assert.ok(contrast('#70736c','#ffffff')>=4.5);
  assert.ok(contrast('#ffffff','#a7523f')>=4.5);
  assert.ok(contrast('#ffffff','#ad5944')>=4.5);
});

test('alarm switches expose a 44px target around the native-size track',()=>{
  assert.match(html,/\.switch\{position:relative;width:51px;height:44px/);
  assert.match(html,/\.switch:before\{content:"";position:absolute;left:0;top:6\.5px;width:51px;height:31px/);
  assert.match(html,/\.switch\.on:before\{background:var\(--alarm-on\)\}/);
});

test('final v4 calendar cascade preserves 44-by-44px date targets at 375px',()=>{
  const v4=html.slice(html.indexOf('/* v76 — premium editorial mockup'));
  assert.match(v4,/\.insights-calendar\{min-height:314px;margin:12px 0 0;padding:16px 0 14px/);
  assert.match(v4,/\.calendar-weekdays,.calendar-grid\{gap:2px\}/);
  assert.match(v4,/\.calendar-day,.calendar-blank\{max-width:44px;width:44px;height:44px;aspect-ratio:1\/1[^}]*justify-self:center/);
});

test('dark next alarm uses a stable high-contrast surface',()=>{
  assert.match(html,/:root\[data-theme="dark"\] #alarmList \.alarm-row\.next-alarm\{background:#171a17;color:#f8f8f5/);
  assert.ok(contrast('#f8f8f5','#171a17')>=4.5);
});
