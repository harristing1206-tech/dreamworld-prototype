const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'world.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(__dirname, '..', 'service-worker.js'), 'utf8');

const cacheVersion = serviceWorker.match(/dreamworld-world-v(\d+)/)?.[1];
assert.ok(cacheVersion, 'service worker cache must be versioned');
for (const asset of ['dialogue-state.js', 'analysis-state.js', 'analysis-dialogue.js', 'browser-transcriber.js']) {
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
assert.match(html, />Your transcript</);
assert.match(html, /id="analysisCharacterName"/);
assert.match(html, /The Listener/);
assert.match(html, /class="analysis-game-scene"/, 'analysis should remain inside the game world');
assert.match(html, /id="analysisDialogueAdvance"/, 'the dialogue box should be the reveal and advance target');
assert.match(html, /id="analysisDialoguePage"/, 'dialogue should show page progress');
assert.match(html, /\.character-response\[data-complete="true"\][^{]+\{[^}]*display:\s*none/s, 'the continuation cue should disappear after the final page');
assert.match(html, /id="analysisDialogueStatus"[^>]+aria-live="polite"/, 'page completion should be announced without reading every typed character');
assert.match(html, /id="analysisTranscriptToggle"/, 'the transcript must remain available without dominating the scene');
assert.match(html, /id="analysisControlsToggle"/, 'privacy controls must remain reachable');
assert.match(html, /id="analysisTranscriptPanel"[^>]+role="dialog"[^>]+aria-modal="true"/);
assert.match(html, /id="analysisControlsPanel"[^>]+role="dialog"[^>]+aria-modal="true"/);
assert.match(html, /id="analysisCharacterResponse"[^>]+aria-live="off"/);
assert.match(html, /A reflection, not a diagnosis/);
assert.match(html, /DreamAnalysis\.createAnalysisSession/);
assert.match(html, /DreamAnalysisDialogue\.paginateResponse/);
assert.match(html, /DreamAnalysisDialogue\.createTypewriterDialogue/);
assert.match(html, /maxCharacters:\s*280/, 'long reflections should use the reviewed adaptive page size');
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
assert.match(html, /\.character-copy[^}]+overflow-wrap:\s*anywhere/s);

const analysisSection = html.match(/<section class="view analysis-view"[\s\S]*?<\/section>\s*<section class="view capture-view"/i)?.[0] || '';
assert.ok(analysisSection.length > 0);
assert.match(analysisSection, /id="analysisTranscriptPanel"[^>]+hidden/, 'transcript starts behind a quiet game HUD action');
assert.match(analysisSection, /id="analysisControlsPanel"[^>]+hidden/, 'privacy controls start behind a quiet game HUD action');
assert.doesNotMatch(analysisSection, /class="analysis-section/, 'the old stacked analysis sections must be gone');

const navLabels = [...html.matchAll(/<span class="nav-label">([^<]+)<\/span>/g)].map(match => match[1]);
assert.deepEqual(navLabels, ['World', 'Dreams', 'Capture', 'Alarms', 'Settings']);
assert.match(serviceWorker, /\.\/analysis-state\.js/);

console.log('streamlined analysis screen contract tests passed');
