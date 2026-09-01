const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges','index.html'),'utf8');

const functionalLabels=[
  ['History fact labels',/\.history-focus-fact span\{[^}]*font-size:11px/],
  ['Calendar weekday labels',/\.calendar-weekdays span\{[^}]*font-size:11px/],
  ['Insight metric suffixes',/\.metric-value span\{[^}]*font-size:11px/],
  ['Insight detail labels',/\.detail-fact span\{[^}]*font-size:11px/],
  ['Next Wake label',/#alarmList \.alarm-row:first-child \.alarm-copy:before\{[^}]*font-size:11px/],
  ['History month labels',/\.history-date-rail span\{[^}]*font-size:11px/],
  ['Recall Index period label',/\.insights-hero-label\{[^}]*font-size:11px/]
];

test('all compact functional labels meet the 11px readability floor',()=>{
  for(const [name,pattern] of functionalLabels)assert.match(html,pattern,`${name} remains undersized`);
});

test('known functional label selectors do not retain 9px or 10px overrides',()=>{
  for(const selector of ['history-focus-fact span','calendar-weekdays span','metric-value span','detail-fact span','alarm-copy:before','history-date-rail span','insights-hero-label']){
    const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/ /g,'\\s+');
    assert.doesNotMatch(html,new RegExp(`${escaped}\\{[^}]*font-size:(?:9|10)px`),`${selector} regressed below 11px`);
  }
});
