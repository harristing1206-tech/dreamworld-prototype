const assert = require('node:assert/strict');
const {
  METHOD_VERSION,
  buildJungianContext,
  appendLongitudinalNote
} = require('../jungian-method.js');

assert.equal(typeof METHOD_VERSION, 'number');

const associations = [
  {
    focus: 'the key',
    question: 'What does the key mean to you personally?',
    answer: 'It reminds me of being trusted with responsibility.'
  },
  {
    focus: 'the staircase',
    question: 'What feeling comes up around the staircase?',
    answer: 'It feels like choosing whether to go deeper.'
  }
];

const context = buildJungianContext({
  dreamID: 'dream-current',
  transcript: 'My grandmother gave me a key beside a staircase.',
  associations,
  priorDreams: [
    {
      id: 'dream-current',
      title: 'Duplicate route alias',
      transcript: 'My grandmother gave me a key beside a staircase.',
      loggedAt: '2026-08-21T04:00:00.000Z'
    },
    {
      id: 'dream-earlier-key',
      title: 'Locked garden',
      transcript: 'I found a key under a tree and felt relieved.',
      loggedAt: '2026-08-20T04:00:00.000Z'
    },
    {
      id: 'dream-monkey',
      title: 'Monkey dream',
      transcript: 'A monkey climbed a wall while I watched.',
      loggedAt: '2026-08-19T04:00:00.000Z'
    },
    {
      id: 'dream-stairs',
      title: 'Station steps',
      transcript: 'I stood at the bottom of a staircase and did not climb.',
      loggedAt: '2026-08-18T04:00:00.000Z'
    }
  ]
});

assert.equal(context.methodVersion, METHOD_VERSION);
assert.equal(context.framework, 'Context-first Jungian reflection');
assert.equal(context.claimStatus, 'interpretive-hypothesis');
assert.equal(context.evidenceTier, 'jung-derived-method');
assert.equal(context.personalAssociations.length, 2);
assert.deepEqual(
  context.longitudinal.recurrences.map(item => [item.dreamID, item.focus]),
  [
    ['dream-earlier-key', 'the key'],
    ['dream-stairs', 'the staircase']
  ],
  'recurrence should be anchored to the user’s interview focus and immutable prior record IDs'
);
assert.doesNotMatch(JSON.stringify(context.longitudinal), /dream-current|dream-monkey/i, 'the current record and interior substring decoys must not count as prior recurrence');
assert.match(context.longitudinal.note, /other logged dream/i);
assert.match(context.longitudinal.note, /does not give (?:it|them) a fixed meaning|not a fixed meaning/i);
assert.match(context.longitudinal.note, /feeling|role|outcome/i);
assert.ok(context.citations.some(item => /CW 7/.test(item.source) && /123/.test(item.locator)));
assert.ok(context.citations.some(item => /Man and His Symbols/.test(item.source)));
assert.ok(context.safeguards.includes('no-fixed-symbol-meaning'));
assert.ok(context.safeguards.includes('no-diagnosis-or-prediction'));

const response = 'The key may concern responsibility because that is the association you gave it.';
const withHistory = appendLongitudinalNote(response, context);
assert.match(withHistory, /^The key may concern responsibility/);
assert.match(withHistory, /Across your saved history/);
assert.doesNotMatch(withHistory, /proves|definitely means|always means/i);

const withoutAssociations = buildJungianContext({
  dreamID: 'dream-no-association',
  transcript: 'A key appeared.',
  associations: [],
  priorDreams: [{ id: 'old', transcript: 'Another key appeared.' }]
});
assert.deepEqual(withoutAssociations.longitudinal.recurrences, [], 'raw keyword overlap cannot substitute for personal association');
assert.equal(appendLongitudinalNote('One possible reflection.', withoutAssociations), 'One possible reflection.');

const changedHistory = buildJungianContext({
  dreamID: 'dream-current',
  transcript: 'My grandmother gave me a key beside a staircase.',
  associations,
  priorDreams: []
});
assert.notEqual(changedHistory.historyFingerprint, context.historyFingerprint, 'history changes must invalidate saved longitudinal output');

const recurrenceAliasCases = [
  ['your grandmother', ['grandma', 'grandmothers']],
  ['your grandfather', ['grandpa', 'grandfathers']],
  ['the child', ['little girl', 'little boys', 'children']],
  ['the car', ['cars']],
  ['the hat', ['hats']],
  ['the key', ['keys']],
  ['the train', ['trains']],
  ['the umbrella', ['umbrellas']],
  ['the phone', ['phones']],
  ['the moth', ['moths']],
  ['the house', ['home', 'houses']],
  ['the staircase', ['stairs', 'stairways']],
  ['the water', ['ocean', 'rivers', 'lakes']],
  ['the door', ['doors']],
  ['the forest', ['forests']],
  ['the neighborhood', ['neighbourhood', 'neighborhoods']],
  ['the animal', ['dog', 'cats', 'birds', 'spiders', 'snakes', 'horses']]
];
for (const [focus, aliases] of recurrenceAliasCases) {
  for (const alias of aliases) {
    const aliasContext = buildJungianContext({
      dreamID: 'current-alias-test',
      associations: [{ focus, question: `What does ${focus} mean to you?`, answer: 'It matters personally.' }],
      priorDreams: [{ id: `prior-${focus}-${alias}`, transcript: `I noticed ${alias} in the dream.` }]
    });
    assert.equal(aliasContext.longitudinal.recurrences.length, 1, `${focus} should match prior transcript alias “${alias}”`);
  }
}

console.log('Jungian method and longitudinal evidence tests passed');
