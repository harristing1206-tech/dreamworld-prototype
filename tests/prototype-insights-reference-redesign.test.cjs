const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const route=path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges');
const html=fs.readFileSync(path.join(route,'index.html'),'utf8');
const worker=fs.readFileSync(path.join(route,'service-worker.js'),'utf8');
const cssRule=selector=>{const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=html.match(new RegExp(`${escaped}\\{([^}]+)\\}`));assert.ok(match,`Missing CSS rule: ${selector}`);return match[1]};
const luminance=hex=>{const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*channels[0]+.7152*channels[1]+.0722*channels[2]};
const contrast=(a,b)=>{const [light,dark]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(light+.05)/(dark+.05)};

test('Insights adopts the supplied latest-log-first pattern hierarchy without dropping existing sections',()=>{
 assert.match(html,/<section class="screen insights-reference-remodel" data-screen="insights"[\s\S]*?<header class="insights-head page-header">[\s\S]*?<div class="insights-latest-card">[\s\S]*?<div class="insights-separator"><\/div>[\s\S]*?<section class="insights-patterns"[\s\S]*?<h2 class="insights-section-title"[^>]*>Patterns<\/h2>[\s\S]*?<section class="insights-hero"[\s\S]*?<div class="insight-metrics"[\s\S]*?<section class="insights-calendar"[\s\S]*?<section class="insight-detail"[\s\S]*?<p class="insights-disclosure">/);
 const screen=cssRule('.insights-reference-remodel');assert.match(screen,/background:#f5f2eb/);assert.match(screen,/--insights-card:#fff/);
 const title=cssRule('.insights-reference-remodel .page-header h1');assert.match(title,/font-family:"Newsreader",var\(--font-editorial\)/);assert.match(title,/font-size:44px!important/);
 const latest=cssRule('.insights-reference-remodel .insights-latest-card button');assert.match(latest,/min-height:148px/);assert.match(latest,/border-radius:24px/);assert.match(latest,/background:var\(--insights-card\)/);
 const metrics=cssRule('.insights-reference-remodel .insight-metrics');assert.match(metrics,/display:grid/);assert.match(metrics,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 const metric=cssRule('.insights-reference-remodel .insight-metric');assert.match(metric,/border-radius:20px/);assert.match(metric,/background:var\(--insights-card\)/);
 const calendar=cssRule('.insights-reference-remodel .insights-calendar');assert.match(calendar,/padding:18px 8px 14px/);assert.match(calendar,/border-radius:24px/);assert.match(calendar,/background:var\(--insights-card\)/);
 const calendarGrid=cssRule('.insights-reference-remodel .calendar-weekdays,.insights-reference-remodel .calendar-grid');assert.match(calendarGrid,/gap:0/);
});

test('latest Insights card uses the real newest record title, date, summary, and existing detail route',()=>{
 for(const id of['latestDreamRail','latestDreamRailTitle','latestDreamRailDate','latestDreamRailExcerpt','latestDreamRailEmpty'])assert.match(html,new RegExp(`id="${id}"`));
 assert.match(html,/latestDreamRailExcerpt'\)\.textContent=latest\.excerpt\|\|excerptForTranscript\(latest\.transcript\|\|''\)/);
 assert.match(html,/latestDreamRail'\)\.addEventListener\('click',\(\)=>\{if\(latestInsightsRecord\)openDreamFromInsights\(latestInsightsRecord\)\}\)/);
 assert.doesNotMatch(html,/Recurring Symbols|Dominant Mood|Water<\/|Childhood Home|Mirrors<\/|Flying<\/|Teeth<\//,'reference-only analytics must not replace real Insights data');
});

test('Insights redesign preserves recall, calendar, metrics, selected detail, disclosure, and all dynamic IDs',()=>{
 for(const id of['insightsHeaderMeta','recallPeriodLabel','recallIndex','recallTrend','insightsWave','insightsMonth','insightsCalendar','insightDreamNights','insightDreamNightsBasis','insightAverageSleep','insightAverageSleepBasis','insightAverageDream','insightAverageDreamBasis','insightRecall','insightRecallBasis','insightDetailDate','insightDetailTitle','insightDetailSleep','insightDetailDream','insightDetailRecall'])assert.match(html,new RegExp(`id="${id}"`),`Missing Insights hook #${id}`);
 for(const behavior of['renderInsightsSourceRail()','renderInsightsCalendar(periodDate)','updateInsights(periodDate)',"button.addEventListener('click',()=>{calendar.querySelectorAll('.calendar-day')","if(record)openDreamFromInsights(record);else renderInsightDetail(null)","hero.classList.toggle('no-data',currentScore===null)"])assert.ok(html.includes(behavior),`Missing Insights behavior: ${behavior}`);
 assert.match(html,/Sleep duration is sample data in this prototype/);
 assert.match(worker,/const CACHE='dreamworld-pwa-20260830-88'/);
});

test('Insights compact labels and recall guidance meet WCAG AA contrast',()=>{
 assert.ok(contrast('#6f6d68','#f5f2eb')>=4.5);
 assert.ok(contrast('#607657','#ffffff')>=4.5);
 assert.ok(contrast('#4f6648','#e3e8e4')>=4.5);
 const trendRule=cssRule('.insights-reference-remodel .insights-index span');assert.match(trendRule,/color:#5f5e59/);
 assert.ok(contrast('#5f5e59','#e3e8e4')>=4.5,`recall guidance contrast is ${contrast('#5f5e59','#e3e8e4').toFixed(2)}:1`);
 assert.ok(contrast('#77736c','#ffffff')>=4.5);
 assert.ok(contrast('#b8cbaa','#111310')>=4.5);
 const weekdayRule=cssRule('.insights-reference-remodel .calendar-weekdays span');assert.match(weekdayRule,/color:var\(--insights-muted\)/);
 assert.ok(contrast('#b4b1a9','#1a1c19')>=4.5);
});
