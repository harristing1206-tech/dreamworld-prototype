const assert = require('node:assert/strict');
const {
  ANALYSIS_VERSION,
  CHARACTER_NAME,
  assessTranscriptEligibility,
  createCharacterAnalysis,
  createAnalysisSession
} = require('../analysis-state.js');

assert.equal(CHARACTER_NAME, 'The Listener');
assert.equal(typeof ANALYSIS_VERSION, 'number');

const gibberishAssessment = assessTranscriptEligibility('erdcyvubibkuvkugvt');
assert.equal(gibberishAssessment.analyzable, false);
assert.equal(gibberishAssessment.reason, 'low-language-confidence');
assert.match(gibberishAssessment.message, /clear dream language/i);
assert.throws(() => createCharacterAnalysis('erdcyvubibkuvkugvt'), /clear dream language/i);
assert.throws(() => createAnalysisSession({ dreamID: 'noise', transcript: 'erdcyvubibkuvkugvt' }), /clear dream language/i);

for (const transcript of [
  'I fell.',
  'Falling',
  'Ocean',
  'Red room. Ocean outside.',
  'Soñé con mi abuela en una casa azul.',
  '紅色的房間裡有一隻貓。'
]) {
  assert.equal(assessTranscriptEligibility(transcript).analyzable, true, `valid short or multilingual dream should remain eligible: ${transcript}`);
}

for (const transcript of ['... 1234 ???', 'um um um', 'asdfghjkl', 'hello', 'hello world']) {
  assert.equal(assessTranscriptEligibility(transcript).analyzable, false, `obvious transcription noise should be rejected: ${transcript}`);
}

const grandparentsDream = `I had a dream where I was hanging out with friends, and then towards the end of our hangout, they all left one by one in a car. I watched them all leave, and I was overcome with a sense of sadness.

Then I turned around, and I saw my grandpa, who is dead now, but what was weird was he was a young version of my grandpa, too young for me to have ever seen in real life. We had a conversation about life. He asked me if I was sad that all my friends were leaving, and I said, "Sometimes I do feel sad," and he said, "That's okay. That's how life is: people come and go." A bit later, my grandma came out, and she was also a young girl. I started crying because I really missed those two, and then I woke up.`;
const grandparentsResponse = createCharacterAnalysis(grandparentsDream);
assert.match(grandparentsResponse, /friends|leav(?:e|ing)|departure/i, 'analysis should ground itself in the friends leaving');
assert.match(grandparentsResponse, /grandpa|grandfather|grandparents/i, 'analysis should address the grandparents rather than ignoring them');
assert.match(grandparentsResponse, /grief|miss(?:ed|ing)|mourning|loss/i, 'analysis should recognize grief and longing');
assert.match(grandparentsResponse, /young|younger|age|time/i, 'analysis should interpret their impossible youth');
assert.match(grandparentsResponse, /people come and go|impermanence|accept(?:ance|ing)|permission to feel/i, 'analysis should use the grandfather’s explicit message as evidence');
assert.match(grandparentsResponse, /sometimes i do feel sad/i, 'analysis should preserve the dreamer’s admission rather than flattening the dialogue');
assert.match(grandparentsResponse, /that[’']s okay[\s\S]{0,40}that[’']s how life is/i, 'analysis should preserve the grandfather’s full reassurance');
assert.match(grandparentsResponse, /sad|cry|emotion/i, 'analysis should follow the emotional arc');
assert.doesNotMatch(grandparentsResponse, /deadline|schedule|timing problem|destination/i, 'analysis must not invent a travel/deadline problem from “car” or “later”');
assert.doesNotMatch(grandparentsResponse, /grandparents, who are gone|they are absent in waking life|not simply a replay/i, 'analysis must not overstate ambiguous facts or speculative memory claims');
const sequence = [
  /friends leave/i,
  /grandfather[^.]*asks/i,
  /sometimes i do feel sad/i,
  /that[’']s okay/i,
  /grandmother appear/i,
  /cry/i
].map(pattern => grandparentsResponse.search(pattern));
assert.ok(sequence.every(index => index >= 0), `analysis must contain every step of the emotional sequence: ${sequence}`);
assert.deepEqual([...sequence].sort((a, b) => a - b), sequence, 'analysis should preserve departure → admission → reassurance → reunion → crying');
assert.ok(grandparentsResponse.length >= 500 && grandparentsResponse.length <= 1400, 'layered dreams need a substantive but bounded response');

const oceanResponse = createCharacterAnalysis('I crossed a dark ocean toward a house, but every room was empty.');
assert.match(oceanResponse, /ocean|water/i, 'the response should reflect concrete dream imagery');
assert.match(oceanResponse, /house|home|belong/i, 'the response should connect recurring imagery into one coherent reading');
assert.ok(oceanResponse.length < 700, 'the character response should stay concise');
assert.doesNotMatch(
  oceanResponse,
  /Freud|Jung|Plato|Aristotle|Descartes|Buddh|Advaita|Zhuangzi|philosoph|religio/i,
  'the character should not dump named frameworks into the response'
);
assert.equal(
  createCharacterAnalysis('I crossed a dark ocean toward a house, but every room was empty.'),
  oceanResponse,
  'the local prototype response should be stable for the same transcript'
);

const blockedResponse = createCharacterAnalysis('I kept trying to open a locked door while someone waited behind me.');
assert.match(blockedResponse, /door|blocked|access|pressure/i);
assert.notEqual(blockedResponse, oceanResponse, 'different transcripts should produce different responses');

for (const transcript of ['I saw my brain glowing on a table.', 'I was training for a marathon.']) {
  const response = createCharacterAnalysis(transcript);
  assert.doesNotMatch(response, /Water is doing most of the emotional work/i, `substring fragments must not trigger a water reading: ${transcript}`);
}

const session = createAnalysisSession({
  dreamID: 'dream-1',
  title: 'Ocean House',
  transcript: '  I crossed a dark ocean toward a house, but every room was empty.  ',
  transcriptSource: 'keyboard-text-unverified-provider'
});
const snapshot = session.snapshot();
assert.equal(snapshot.evidence.transcript, 'I crossed a dark ocean toward a house, but every room was empty.');
assert.equal(snapshot.evidence.transcriptSource, 'keyboard-text-unverified-provider');
assert.equal(snapshot.characterResponse.speaker, CHARACTER_NAME);
assert.equal(snapshot.characterResponse.text, oceanResponse);
assert.equal(snapshot.characterResponse.author, 'character');
assert.equal(snapshot.analysisVersion, ANALYSIS_VERSION);
assert.deepEqual(
  Object.keys(snapshot).sort(),
  ['analysisVersion', 'characterResponse', 'dreamID', 'evidence', 'title'].sort(),
  'the analysis state should contain only evidence and one character response'
);

const restored = createAnalysisSession({
  dreamID: 'dream-1',
  title: 'Ocean House',
  transcript: snapshot.evidence.transcript,
  transcriptSource: snapshot.evidence.transcriptSource,
  savedState: snapshot
});
assert.deepEqual(restored.snapshot(), snapshot, 'a matching saved response should restore exactly');

const staleSnapshot = JSON.parse(JSON.stringify(snapshot));
delete staleSnapshot.analysisVersion;
staleSnapshot.characterResponse.text = 'This old response incorrectly talks about deadlines and schedules.';
const regenerated = createAnalysisSession({
  dreamID: 'dream-1',
  title: 'Ocean House',
  transcript: snapshot.evidence.transcript,
  transcriptSource: snapshot.evidence.transcriptSource,
  savedState: staleSnapshot
}).snapshot();
assert.equal(regenerated.analysisVersion, ANALYSIS_VERSION);
assert.equal(regenerated.characterResponse.text, oceanResponse, 'responses from an older engine version must be regenerated');

const changedEvidence = createAnalysisSession({
  dreamID: 'dream-1',
  title: 'Ocean House',
  transcript: 'A different dream about missing a train.',
  transcriptSource: 'keyboard-text-unverified-provider',
  savedState: snapshot
});
assert.notEqual(changedEvidence.snapshot().characterResponse.text, snapshot.characterResponse.text);
assert.equal(changedEvidence.snapshot().evidence.transcript, 'A different dream about missing a train.');

assert.throws(() => createCharacterAnalysis('   '), /transcript/i);
assert.throws(() => createAnalysisSession({ dreamID: 'empty', transcript: '   ' }), /transcript/i);

console.log('streamlined character analysis state tests passed');
