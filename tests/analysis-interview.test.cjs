const assert = require('node:assert/strict');
const {
  INTERVIEW_VERSION,
  createInterviewSession
} = require('../analysis-interview.js');

assert.equal(typeof INTERVIEW_VERSION, 'number');

const transcript = 'I drove a red car through my old neighborhood. A black hat sat on the passenger seat. I felt nervous when the car stopped.';
const session = createInterviewSession({ dreamID: 'dream-personal', transcript });
let state = session.snapshot();

assert.equal(state.complete, false);
assert.equal(state.answers.length, 0);
assert.equal(state.questionIndex, 0);
assert.match(state.currentQuestion.text, /car/i, 'the first question should use a concrete transcript detail');
assert.match(state.currentQuestion.text, /to you|personally/i, 'the question should ask for the dreamer’s own association');
assert.doesNotMatch(state.currentQuestion.text, /childhood|must|means that|represents your/i, 'the question must not plant a suggested interpretation');
assert.equal(state.reflectionContext, '', 'no interpretation context exists before the user answers');

const fakeDream = `I was walking through my childhood neighborhood at night, but every house was floating a few feet above the ground. The streets were covered in shallow, perfectly still water that reflected a sky full of unfamiliar stars.
I reached my old home and found the front door standing by itself with no house behind it. When I opened it, I stepped into a crowded train moving through a forest. Everyone on board was asleep except an older woman holding a small silver key. She told me, “You keep arriving before the place is ready.”
The train stopped beside a dark lake. I got off and saw my reflection standing on the opposite shore, wearing clothes I didn’t recognize. It raised its hand like it wanted me to follow, but the silver key in my pocket suddenly became very hot.
Then I heard an alarm ringing from somewhere beneath the water, and I woke up.`;
const fakeDreamQuestion = createInterviewSession({ dreamID: 'dream-fake-example', transcript: fakeDream }).snapshot().currentQuestion;
assert.equal(fakeDreamQuestion.focus, 'the key', 'the repeated object at the climactic change should outrank incidental scene objects');
assert.match(fakeDreamQuestion.text, /silver key in my pocket suddenly became very hot/i, 'the question should cite the exact dream moment needing clarification');
assert.match(fakeDreamQuestion.text, /what did the key bring up for you personally/i);
assert.doesNotMatch(fakeDreamQuestion.text, /detail that stands out most|say what this detail means/i);

assert.throws(() => session.submit('   '), /answer|response/i, 'blank answers are not accepted');
state = session.submit('It reminds me of learning to drive with my older sister.');
assert.equal(state.answers.length, 1);
assert.equal(state.complete, false);
assert.equal(state.questionIndex, 1);
assert.match(state.currentQuestion.text, /learning to drive with my older sister/i, 'the next question should visibly adapt to the prior answer');
assert.match(state.currentQuestion.text, /hat/i, 'the follow-up should move to another recorded detail');
assert.doesNotMatch(state.currentQuestion.text, /means that|must symbolize|childhood trauma/i);
assert.equal(state.reflectionContext, '');

state = session.submit("I don't know. It just felt out of place.");
assert.equal(state.answers.length, 2);
assert.equal(state.questionIndex, 2);
assert.match(state.currentQuestion.text, /felt|feeling|right now|life/i, 'the final question should ask about felt or waking-life relevance without asserting one');

state = session.submit('I am nervous about making a decision on my own.');
assert.equal(state.complete, true);
assert.equal(state.currentQuestion, null);
assert.match(state.reflectionContext, /learning to drive with my older sister/i);
assert.match(state.reflectionContext, /out of place/i);
assert.match(state.reflectionContext, /making a decision on my own/i);
assert.doesNotMatch(state.reflectionContext, /diagnos|trauma|definitely|proves/i);

const restored = createInterviewSession({ dreamID: 'dream-personal', transcript, savedState: state });
assert.deepEqual(restored.snapshot(), state, 'a completed local interview should restore exactly');

const early = createInterviewSession({ dreamID: 'dream-early', transcript: 'I found a silver key under my bed.' });
early.submit('The key reminds me of privacy.');
const earlyState = early.finish();
assert.equal(earlyState.complete, true);
assert.equal(earlyState.answers.length, 1);
assert.match(earlyState.reflectionContext, /privacy/i);

assert.throws(
  () => createInterviewSession({ dreamID: 'dream-personal', transcript: 'A different transcript.', savedState: state }),
  /does not match/i,
  'answers must never be restored onto a different transcript'
);

const pluralFocusCases = [
  ['Several keys appeared.', /key/i],
  ['Two houses and three homes floated away.', /house/i],
  ['Oceans surrounded the island.', /water/i],
  ['Dogs, cats, and birds followed me.', /animal/i],
  ['I climbed many stairs and stairways.', /staircase/i],
  ['Children and little boys waited by the doors.', /child/i]
];
for (const [pluralTranscript, expectedFocus] of pluralFocusCases) {
  const pluralState = createInterviewSession({ dreamID: `plural-${pluralTranscript}`, transcript: pluralTranscript }).snapshot();
  assert.match(pluralState.currentQuestion.focus, expectedFocus, `plural transcript should derive the specific focus for: ${pluralTranscript}`);
  assert.notEqual(pluralState.currentQuestion.focus, 'the detail that stands out most');
}

console.log('personal dream interview state tests passed');
