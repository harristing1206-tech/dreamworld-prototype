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
  'My wedding',
  'giant spider',
  'I was naked',
  'flying alone',
  'could not move',
  'Soñé con abuela',
  'Casa azul',
  'volé sobre montañas',
  'je volais',
  'ein Albtraum',
  'sonhei voando',
  'Red room. Ocean outside.',
  'Soñé con mi abuela en una casa azul.',
  '紅色的房間裡有一隻貓。'
]) {
  assert.equal(assessTranscriptEligibility(transcript).analyzable, true, `valid short or multilingual dream should remain eligible: ${transcript}`);
}

for (const transcript of ['... 1234 ???', 'um um um', 'asdfghjkl']) {
  assert.equal(assessTranscriptEligibility(transcript).analyzable, false, `obvious transcription noise should be rejected: ${transcript}`);
}

for (const transcript of ['hello', 'hello world', 'foo bar baz qux', 'blarg snorf glibble wobble', 'Casa azul']) {
  assert.throws(
    () => createCharacterAnalysis(transcript),
    error => error?.code === 'DREAM_ANALYSIS_NEEDS_DETAIL' && /concrete dream detail/i.test(error.message),
    `plausible but unsupported content must not receive a generic interpretation: ${transcript}`
  );
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

const childhoodKeyDream = `I was walking through my childhood neighborhood at night, but every house was floating a few feet above the ground. I followed a trail of glowing blue flowers to my old home and found the front door standing open. Inside, the rooms were filled with shallow ocean water, and a giant white moth was resting on the ceiling. My grandmother was sitting at the kitchen table even though I knew she had passed away. She handed me a small golden key and told me, “You already know which door it opens.” When I looked down, a dark staircase had appeared beneath the water. I felt afraid to descend, but also strangely relieved—like something important had been waiting for me there.`;
const childhoodKeyResponse = createCharacterAnalysis(childhoodKeyDream);
assert.match(childhoodKeyResponse, /childhood|old home|neighborhood/i, 'analysis should address the transformed childhood setting');
assert.match(childhoodKeyResponse, /blue flowers|glowing flowers|flower/i, 'analysis should preserve the trail that guides the dreamer home');
assert.match(childhoodKeyResponse, /grandmother/i, 'analysis should address the grandmother as part of the dream’s emotional logic');
assert.match(childhoodKeyResponse, /memory|trusted|internal|relationship/i, 'analysis should explain the grandmother’s possible role without claiming a supernatural message');
assert.match(childhoodKeyResponse, /golden key|key/i, 'analysis should interpret the object she gives the dreamer');
assert.match(childhoodKeyResponse, /already know/i, 'analysis should preserve the grandmother’s actual message');
assert.match(childhoodKeyResponse, /staircase[\s\S]{0,100}(water|submerged|beneath)/i, 'analysis should connect the staircase to its position beneath the water');
assert.match(childhoodKeyResponse, /afraid|fear/i, 'analysis should preserve the fear of descending');
assert.match(childhoodKeyResponse, /relie(?:f|ved)/i, 'analysis should preserve the simultaneous relief');
assert.match(childhoodKeyResponse, /white moth|moth/i, 'analysis should acknowledge the unusual secondary image');
assert.match(childhoodKeyResponse, /not a fixed symbol|could|may|possible/i, 'analysis should keep symbolic claims tentative');
assert.match(childhoodKeyResponse, /descend|door|already know/i, 'the final question should come from the dream’s actual choice rather than generic insecurity');
assert.doesNotMatch(childhoodKeyResponse, /distance between the water and the place that should feel like home/i, 'the shallow water-home template must not flatten a layered dream');
assert.ok(childhoodKeyResponse.length >= 700 && childhoodKeyResponse.length <= 1700, 'a layered dream should receive a substantive but bounded response');

const sparseKeyResponse = createCharacterAnalysis('My dead grandfather gave me a key at the top of a staircase. I felt afraid.');
assert.match(sparseKeyResponse, /grandfather/i);
assert.doesNotMatch(sparseKeyResponse, /grandmother|grandparents|childhood|old home|familiar home|kitchen|water|golden key/i, 'analysis must not import absent scene details from the richer branch');

const grandparentsKeyResponse = createCharacterAnalysis('My dead grandmother and grandfather give me a key beside a staircase. I feel afraid.');
assert.match(grandparentsKeyResponse, /grandparents (?:sit|appear)/i, 'plural relatives require plural grammar');
assert.match(grandparentsKeyResponse, /grandparents[\s\S]{0,100}give/i, 'plural relatives must give rather than gives');
assert.doesNotMatch(grandparentsKeyResponse, /grandparents (?:sits|gives)/i);

assert.throws(
  () => createCharacterAnalysis('My living grandfather said my dog died. Later my grandmother played a piano key while reading recipe steps.'),
  error => error?.code === 'DREAM_ANALYSIS_NEEDS_DETAIL' && /enough concrete dream detail/i.test(error.message),
  'unrelated death, piano-key, and recipe-step tokens must be rejected rather than activating the entrusted-key branch'
);

const crossRelativeResponse = createCharacterAnalysis('My dead grandfather watched from across the room. My living grandmother gave me a key beside a staircase.');
assert.doesNotMatch(
  crossRelativeResponse,
  /grandfather[\s\S]{0,120}(?:gives|gave|hands|handed|offers|offered)[\s\S]{0,40}key|grandfather[\s\S]{0,120}safe guide/i,
  'a living relative’s key must not be attributed to a different deceased relative mentioned earlier'
);

const assertNoEntrustedThreshold = (transcript, message) => {
  let response;
  try {
    response = createCharacterAnalysis(transcript);
  } catch (error) {
    assert.equal(error?.code, 'DREAM_ANALYSIS_NEEDS_DETAIL', message);
    return;
  }
  assert.doesNotMatch(response, /safe guide|receiving a key and facing a staircase|offers access without opening|returns authority to you/i, message);
};
assertNoEntrustedThreshold('My deceased grandmother watched quietly. My friend gave me a key. Then I walked down a staircase.', 'another actor’s gift must not be attributed to the deceased relative');
assertNoEntrustedThreshold('My deceased grandmother watched while my friend gave me a key beside a staircase.', 'another actor in the same sentence must remain the transfer subject');
assertNoEntrustedThreshold('My deceased grandmother watched my friend dance and give me a key beside a staircase.', 'a nested conjunction must not transfer the relative’s subject to a friend');
assertNoEntrustedThreshold('My deceased grandmother told my friend to sing and give me a key beside a staircase.', 'an infinitive conjunction must not transfer the relative’s subject to a friend');
assertNoEntrustedThreshold('My deceased grandmother gave my friend a key beside a staircase.', 'a key given to someone else must not be described as given to the dreamer');
assertNoEntrustedThreshold('My deceased grandmother did not give me a key beside a staircase.', 'a negated transfer must not activate the branch');
assertNoEntrustedThreshold('My deceased grandmother had a hand-painted key beside a staircase.', 'a hand-painted key must not be parsed as the verb hand');
assertNoEntrustedThreshold('My deceased grandmother gave me a key on the piano beside a staircase.', 'a piano key in either word order must not be treated as a physical entrusted key');
assertNoEntrustedThreshold('My deceased grandmother gave me a key from the keyboard beside a staircase.', 'a keyboard key in either word order must not be treated as a physical entrusted key');
assertNoEntrustedThreshold('My deceased grandmother gave me a key. A bell rang. I entered a garden. At school I climbed stairs.', 'unrelated stairs several sentences later must not complete the branch');
assertNoEntrustedThreshold('My deceased grandmother gave me a key. I did not descend the staircase.', 'negated descent must not complete the branch');
assertNoEntrustedThreshold('My deceased grandmother gave me a key. I never saw a staircase.', 'never seeing a staircase must not complete the branch');
assertNoEntrustedThreshold('My deceased grandmother gave me a key, but no staircase appeared.', 'an explicitly absent staircase must not complete the branch');
assertNoEntrustedThreshold('My deceased grandmother gave me a key. I climbed the stairs upward.', 'explicit upward movement must not become a downward descent');
assertNoEntrustedThreshold('My deceased grandmother gave me a key beside a staircase, but I never went down the stairs.', 'never going down must not produce a downward-descent analysis');
assertNoEntrustedThreshold('My deceased grandmother gave me a key. My brother discussed a staircase.', 'a staircase mentioned by another person must not complete the branch');

const pluralNaturalResponse = createCharacterAnalysis('My deceased grandparents gave me a key beside a staircase. I felt afraid.');
assert.match(pluralNaturalResponse, /grandparents (?:appear and give|sit[\s\S]{0,40}give)/i);
const noLongerAliveResponse = createCharacterAnalysis('My grandmother is no longer alive. She gave me a key beside a staircase. I felt afraid.');
assert.match(noLongerAliveResponse, /grandmother/i);
const passedAwayResponse = createCharacterAnalysis('My grandmother had passed away. She gave me a key beside a staircase. I felt afraid.');
assert.match(passedAwayResponse, /grandmother/i);
const diedResponse = createCharacterAnalysis('My grandmother died. She gave me a key beside a staircase. I felt afraid.');
assert.match(diedResponse, /grandmother/i);
const whoPassedResponse = createCharacterAnalysis('My grandmother, who had passed away, gave me a key beside a staircase. I felt afraid.');
assert.match(whoPassedResponse, /grandmother/i);
const whoPassedWithoutAuxResponse = createCharacterAnalysis('My grandmother, who passed away, gave me a key beside a staircase. I felt afraid.');
assert.match(whoPassedWithoutAuxResponse, /grandmother/i);
const whoWasDeceasedResponse = createCharacterAnalysis('My grandmother, who was deceased, gave me a key beside a staircase. I felt afraid.');
assert.match(whoWasDeceasedResponse, /grandmother/i);
const appositiveResponse = createCharacterAnalysis('My grandmother, now deceased, gave me a key beside a staircase. I felt afraid.');
assert.match(appositiveResponse, /grandmother/i);
const passiveGiftResponse = createCharacterAnalysis('A key was given to me by my deceased grandmother beside a staircase. I felt afraid.');
assert.match(passiveGiftResponse, /grandmother/i);
const prepositionalGiftResponse = createCharacterAnalysis('My deceased grandmother gave a key to me beside a staircase. I felt afraid.');
assert.match(prepositionalGiftResponse, /grandmother/i);
const handedPrepositionalResponse = createCharacterAnalysis('My deceased grandmother handed a key to me beside a staircase. I felt afraid.');
assert.match(handedPrepositionalResponse, /grandmother/i);
const scopedNegationResponse = createCharacterAnalysis('My friend did not give me anything, but my deceased grandmother gave me a key beside a staircase. I felt afraid.');
assert.match(scopedNegationResponse, /grandmother/i);

const ordinaryChildhoodResponse = createCharacterAnalysis('My deceased grandmother handed me a key beside a staircase in my childhood school. I felt afraid.');
assert.match(ordinaryChildhoodResponse, /childhood/i);
assert.doesNotMatch(ordinaryChildhoodResponse, /floating houses|open old home/i, 'childhood alone must not invent floating houses or an open home');

const unrelatedWaterResponse = createCharacterAnalysis('My deceased grandmother handed me a key beside a staircase. Earlier, I walked through rain. I felt afraid.');
assert.doesNotMatch(unrelatedWaterResponse, /staircase appears beneath the water|steps remain visible/i, 'water elsewhere must not be attached to the staircase');

const plainMothResponse = createCharacterAnalysis('My deceased grandmother handed me a key beside a staircase. A moth flew past. I felt afraid.');
assert.doesNotMatch(plainMothResponse, /giant white moth|resting above the room/i, 'a plain moth must not inherit absent size, color, or position');

const balloonResponse = createCharacterAnalysis('My deceased grandmother gave me a key beside a staircase. A house stood nearby while balloons were floating. I felt afraid.');
assert.doesNotMatch(balloonResponse, /floating houses/i, 'floating balloons must not make a nearby house float');
const openedBookResponse = createCharacterAnalysis('At home, my deceased grandmother gave me a key beside a staircase. She opened a book. I felt afraid.');
assert.doesNotMatch(openedBookResponse, /open home/i, 'opening a book must not make the home open');
const closedHomeResponse = createCharacterAnalysis('My deceased grandmother gave me a key beside a staircase. The home was not open. I felt afraid.');
assert.doesNotMatch(closedHomeResponse, /open home/i, 'an explicitly non-open home must remain closed');
const contractedClosedHomeResponse = createCharacterAnalysis("My deceased grandmother gave me a key beside a staircase. The home wasn't open. I felt afraid.");
assert.doesNotMatch(contractedClosedHomeResponse, /open home/i, 'a contracted non-open home must remain closed');
const waterGlassResponse = createCharacterAnalysis('My deceased grandmother gave me a key beside a staircase next to a glass of water. I felt afraid.');
assert.doesNotMatch(waterGlassResponse, /staircase appears beneath the water|steps remain visible/i, 'water in a glass must not submerge the staircase');
const roomWaterGlassResponse = createCharacterAnalysis('My deceased grandmother gave me a key beside a staircase in a room with a glass of water. I felt afraid.');
assert.doesNotMatch(roomWaterGlassResponse, /staircase appears beneath the water|steps remain visible/i, 'a staircase in a room containing water must not become a staircase in water');
const dryStairsResponse = createCharacterAnalysis('My deceased grandmother gave me a key beside a staircase. The stairs were not under water. I felt afraid.');
assert.doesNotMatch(dryStairsResponse, /staircase appears beneath the water|steps remain visible/i, 'explicitly dry stairs must not become submerged');
const contractedDryStairsResponse = createCharacterAnalysis("My deceased grandmother gave me a key beside a staircase. The stairs weren't under water. I felt afraid.");
assert.doesNotMatch(contractedDryStairsResponse, /staircase appears beneath the water|steps remain visible/i, 'contracted dry stairs must not become submerged');
const neverWetStairsResponse = createCharacterAnalysis('My deceased grandmother gave me a key beside a staircase. The stairs were never under water. I felt afraid.');
assert.doesNotMatch(neverWetStairsResponse, /staircase appears beneath the water|steps remain visible/i, 'stairs never under water must remain dry');
const restingDreamerResponse = createCharacterAnalysis('My deceased grandmother gave me a key beside a staircase. A moth flew past. I was resting beneath the ceiling.');
assert.doesNotMatch(restingDreamerResponse, /resting above the room|moth[\s\S]{0,80}witness/i, 'the dreamer’s resting position must not be assigned to the moth');
const wallMothResponse = createCharacterAnalysis('My deceased grandmother gave me a key beside a staircase. A moth rested against a wall. I felt afraid.');
assert.doesNotMatch(wallMothResponse, /resting above the room|moth[\s\S]{0,80}witness/i, 'a moth against a wall must not become a witness above the room');
const nearbyMothResponse = createCharacterAnalysis('My deceased grandmother gave me a key beside a staircase. A moth rested near the room. I felt afraid.');
assert.doesNotMatch(nearbyMothResponse, /resting above the room|moth[\s\S]{0,80}witness/i, 'a moth near a room must not become a witness above it');

const overlapResponse = createCharacterAnalysis(`${childhoodKeyDream} Before I reached the house, my friends drove away one by one.`);
assert.match(overlapResponse, /golden key/i);
assert.match(overlapResponse, /staircase/i, 'the richer key-and-descent structure should outrank the generic social-departure branch');
assert.doesNotMatch(overlapResponse, /friends leave one by one while you watch/i);

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
  assert.throws(
    () => createCharacterAnalysis(transcript),
    error => error?.code === 'DREAM_ANALYSIS_NEEDS_DETAIL',
    `substring fragments must not trigger a water reading or a generic fallback: ${transcript}`
  );
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
  transcript: 'I missed the train and could not reach the station.',
  transcriptSource: 'keyboard-text-unverified-provider',
  savedState: snapshot
});
assert.notEqual(changedEvidence.snapshot().characterResponse.text, snapshot.characterResponse.text);
assert.equal(changedEvidence.snapshot().evidence.transcript, 'I missed the train and could not reach the station.');

assert.throws(() => createCharacterAnalysis('   '), /transcript/i);
assert.throws(() => createAnalysisSession({ dreamID: 'empty', transcript: '   ' }), /transcript/i);

console.log('streamlined character analysis state tests passed');
