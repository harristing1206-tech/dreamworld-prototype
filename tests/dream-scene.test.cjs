const assert = require('node:assert/strict');
const { createDreamScene } = require('../dream-scene.js');

const ocean = createDreamScene('I crossed a dark ocean toward a house while waves covered the road.', 'ocean-house');
assert.equal(ocean.motif, 'tide');
assert.match(ocean.label, /tid|shore|water/i);

const reunionText = 'My friends left one by one. My young grandfather and grandmother appeared. I cried because I missed them.';
const reunion = createDreamScene(reunionText, 'grandparents-one');
assert.equal(reunion.motif, 'echo');
assert.match(reunion.label, /echo|memory|reunion/i);

const ember = createDreamScene('A bright fire moved through a field while smoke crossed the red sky.', 'fire-field');
assert.equal(ember.motif, 'ember');

for (const [transcript, misleadingFragment] of [
  ['I was scared and woke up suddenly.', 'car'],
  ['A crystal sat on the table.', 'cry'],
  ['I started walking through a room.', 'star'],
  ['I searched everywhere for my keys.', 'sea']
]) {
  assert.equal(
    createDreamScene(transcript, `boundary-${misleadingFragment}`).motif,
    'nocturne',
    `${misleadingFragment} inside an unrelated word must not choose a dreamscape`
  );
}

assert.deepEqual(createDreamScene(reunionText, 'grandparents-one'), reunion, 'a saved dream keeps one stable dreamscape');
const separatelyLogged = createDreamScene(reunionText, 'grandparents-two');
assert.notEqual(separatelyLogged.signature, reunion.signature, 'distinct dream IDs receive distinct visual signatures');
assert.notEqual(separatelyLogged.palette.skyTop, reunion.palette.skyTop, 'distinct records should not be forced into the same background color');

for (const profile of [ocean, reunion, ember, separatelyLogged]) {
  assert.match(profile.signature, /^dreamscape-/);
  assert.ok(['tide', 'echo', 'ember', 'grove', 'sky', 'passage', 'nocturne'].includes(profile.motif));
  assert.ok(profile.palette.skyTop && profile.palette.skyBottom && profile.palette.accent && profile.palette.panel);
  assert.ok(Number.isInteger(profile.motion.driftSeconds));
  assert.ok(profile.motion.driftSeconds >= 8 && profile.motion.driftSeconds <= 18);
  assert.equal(Object.hasOwn(profile, 'meaning'), false, 'visual atmosphere must not claim a definitive dream meaning');
}

console.log('dream-responsive scene profile tests passed');
