const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'sketches', 'release-ui-overhaul', '06-five-slot-badges', 'index.html'), 'utf8');

test('Insights ships an honest neutral state instead of static sample analytics', () => {
  assert.match(html, /<strong id="recallIndex">—<\/strong><span id="recallTrend">Rate recall when reviewing a dream\.<\/span>/);
  assert.match(html, /class="insights-wave" id="insightsWave" role="img" aria-label="No recall ratings this month" hidden/);
  assert.doesNotMatch(html, /id="recallIndex">67|<span>steady<\/span>|style="height:(?:28|62|44|72|52|86|68)%"/);
  assert.doesNotMatch(html, /id="insightsMonth">August 2026|aria-label="Dream days in August 2026"/);
});

test('Recall score, trend, wave, and supporting metrics share the current period model', () => {
  assert.match(html, /const renderRecallWave=ratedRecords=>/);
  assert.match(html, /const isRatedRecall=record=>Boolean\(record&&\['Clear','Faint'\]\.includes\(record\.recall\)\)/);
  assert.match(html, /previousMonthDate=new Date\(periodDate\.getFullYear\(\),periodDate\.getMonth\(\)-1,1\)/);
  assert.match(html, /recallTrend\.textContent='Rate recall when reviewing a dream\.'/);
  assert.match(html, /recallTrend\.textContent=`Based on \$\{ratedRecords\.length\} rated dream/);
  assert.match(html, /document\.getElementById\('insightAverageSleepBasis'\)\.textContent=/);
  assert.match(html, /document\.getElementById\('insightAverageDreamBasis'\)\.textContent=/);
  assert.match(html, /document\.getElementById\('insightRecallBasis'\)\.textContent=/);
});

test('Calendar selection and detail cannot retain a record from another month', () => {
  assert.match(html, /calendar\.setAttribute\('aria-label',`Dream days in \$\{monthLabel\}`\)/);
  assert.match(html, /selectedRecord=sortedJournalRecords\(\)\.find\(record=>record\.dateKey\?\.startsWith\(prefix\)\)\|\|null/);
  assert.match(html, /renderInsightDetail\(selectedRecord\)/);
});

test('one period snapshot refreshes the whole screen on entry and month rollover', () => {
  assert.match(html, /const renderInsightsCalendar=\(periodDate=new Date\(\)\)=>/);
  assert.match(html, /const updateInsights=\(periodDate=new Date\(\)\)=>/);
  assert.match(html, /const refreshInsights=\(periodDate=new Date\(\)\)=>\{renderInsightsSourceRail\(\);renderInsightsCalendar\(periodDate\);updateInsights\(periodDate\);insightsPeriodKey=/);
  assert.match(html, /if\(name==='insights'\)refreshInsights\(new Date\(\)\)/);
  assert.match(html, /visibilitychange[\s\S]*setInterval\(refreshInsightsIfPeriodChanged,60000\)/);
});
