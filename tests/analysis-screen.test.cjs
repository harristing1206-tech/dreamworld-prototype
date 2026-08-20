const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'world.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(__dirname, '..', 'service-worker.js'), 'utf8');

const cacheVersion = serviceWorker.match(/dreamworld-world-v(\d+)/)?.[1];
assert.ok(cacheVersion, 'service worker cache must be versioned');
for (const asset of ['dialogue-state.js', 'analysis-state.js', 'browser-transcriber.js']) {
  assert.match(html, new RegExp(`<script src="\\./${asset.replace('.', '\\.') }\\?v=${cacheVersion}"><\\/script>`), `${asset} must be cache-busted with the release version`);
  assert.match(serviceWorker, new RegExp(`\\./${asset.replace('.', '\\.') }\\?v=${cacheVersion}`), `${asset} must be cached under the same release-versioned URL`);
}
assert.match(html, /id="analysisView"[^>]+data-view="analysis"/);
assert.match(html, /Speak or type before it fades\./);
assert.match(html, /<details class="experimental-capture" id="experimentalCapture">\s*<summary>Voice &amp; transcription options<\/summary>/);
assert.doesNotMatch(html, /An unfinished draft stays in this browser/);
assert.match(html, /id="noDreamButton" class="capture-skip"/);
assert.match(html, /id="analysisBack"/);
assert.match(html, /id="analysisTitle"/);
assert.match(html, /id="analysisTranscript"/);
assert.match(html, />Transcript</);
assert.match(html, /id="analysisCharacterName"/);
assert.match(html, /The Listener/);
assert.match(html, /\.character-copy\s*\{[^}]*white-space:\s*pre-wrap/s, 'multi-paragraph character analysis must preserve readable paragraph breaks');
assert.match(html, /id="analysisCharacterResponse"[^>]+aria-live="polite"/);
assert.match(html, /A reflection, not a diagnosis/);
assert.match(html, /DreamAnalysis\.createAnalysisSession/);
assert.match(html, /characterResponse/);
assert.match(html, /window\.setTimeout\(\(\) => openAnalysis\(record\.id\), 220\)/, 'logging should route directly to the character response');

assert.doesNotMatch(html, /Perspective families/);
assert.doesNotMatch(html, /analysisLensList/);
assert.doesNotMatch(html, /analysisAssociation/);
assert.doesNotMatch(html, /analysisWorkingMeaning/);
assert.doesNotMatch(html, /Freud|Jung|Plato|Aristotle|Descartes|Spinoza|Buddhist|Advaita|Zhuangzi/);

assert.match(html, /id="analysisDeleteReflection"/);
assert.match(html, /id="analysisRegenerateResponse"[^>]+hidden/);
assert.match(html, /id="analysisStorageDisclosure"/);
assert.match(html, /id="analysisUndoDelete"[^>]+hidden/);
assert.match(html, /id="analysisKeepUndo"[^>]+hidden/);
assert.match(html, /id="analysisFinishDeletion"[^>]+hidden/);
assert.match(html, /this response is saved in this browser without encryption/i);
assert.match(html, /this response could not be saved in browser storage/i);
assert.match(html, /saved response has been deleted/i);
assert.match(html, /\[hidden\]\s*\{\s*display:\s*none\s*!important/);
assert.match(html, /prefers-reduced-motion/);

const analysisSection = html.match(/<section class="view panel-view analysis-view"[\s\S]*?<\/section>\s*<section class="view capture-view"/i)?.[0] || '';
assert.ok(analysisSection.length > 0);
assert.ok((analysisSection.match(/<section\b/g) || []).length <= 3, 'analysis should contain only its outer view, transcript, and the captured opening of the following view');
assert.doesNotMatch(analysisSection, /class="analysis-section/, 'the old stacked analysis sections must be gone');
assert.ok((analysisSection.match(/<button\b/g) || []).length <= 6, 'analysis should keep actions restrained');

const navLabels = [...html.matchAll(/<span class="nav-label">([^<]+)<\/span>/g)].map(match => match[1]);
assert.deepEqual(navLabels, ['World', 'Dreams', 'Capture', 'Alarms', 'Settings']);
assert.match(serviceWorker, /\.\/analysis-state\.js/);

console.log('streamlined analysis screen contract tests passed');
