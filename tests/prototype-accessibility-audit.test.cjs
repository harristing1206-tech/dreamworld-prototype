const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

function luminance(hex) {
  const channels=[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16)/255).map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4);
  return 0.2126*channels[0]+0.7152*channels[1]+0.0722*channels[2];
}
function contrast(a,b){const [light,dark]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (light+0.05)/(dark+0.05)}

test('muted text clears AA contrast on raised light surfaces', () => {
  assert.match(html, /--raised:#f1f2ef;[\s\S]*?--muted:#646f79/);
  assert.ok(contrast('#646f79','#f1f2ef')>=4.5);
});

test('alarm switches expose a 44px target around the native-size track', () => {
  assert.match(html, /\.switch\{position:relative;width:51px;height:44px/);
  assert.match(html, /\.switch:before\{content:"";position:absolute;left:0;top:6\.5px;width:51px;height:31px/);
  assert.match(html, /\.switch:after\{content:"";position:absolute;top:8\.5px;left:2px;width:27px;height:27px/);
  assert.match(html, /\.switch\.on:before\{background:var\(--alarm-on\)\}/);
});

test('calendar day targets remain 44px at the 375px supported viewport', () => {
  assert.match(html, /\.insights-calendar\{margin-top:0;padding:16px 0 14px/);
  assert.match(html, /\.calendar-weekdays,\.calendar-grid\{gap:3px\}/);
  assert.match(html, /\.calendar-day\{[^}]*max-width:44px[^}]*aspect-ratio:1\/1/);
});

test('dark primary alarm uses a stable high-contrast surface', () => {
  assert.match(html, /:root\[data-theme="dark"\] #alarmList \.alarm-row:first-child\{background:#171a20;color:#f5f7f9\}/);
  assert.ok(contrast('#f5f7f9','#171a20')>=4.5);
  assert.match(html, /:root\[data-theme="dark"\] #alarmList \.alarm-row:first-child \.alarm-copy:before\{color:#b9bec4\}/);
  assert.match(html, /:root\[data-theme="dark"\] #alarmList \.alarm-row:first-child \.alarm-detail\{color:#c4c9cf\}/);
});
