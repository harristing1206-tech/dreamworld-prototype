(function exposeAnalysisInterview(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DreamAnalysisInterview = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function makeAnalysisInterviewAPI() {
  const INTERVIEW_VERSION = 1;
  const MAX_QUESTIONS = 3;
  const MAX_ANSWER_LENGTH = 600;

  const DETAIL_PATTERNS = [
    { label: 'your grandmother', pattern: /\b(?:grandmothers?|grandmas?)\b/i },
    { label: 'your grandfather', pattern: /\b(?:grandfathers?|grandpas?)\b/i },
    { label: 'the child', pattern: /\b(?:little girls?|little boys?|child|children)\b/i },
    { label: 'the car', pattern: /\bcars?\b/i },
    { label: 'the hat', pattern: /\bhats?\b/i },
    { label: 'the key', pattern: /\bkeys?\b/i },
    { label: 'the train', pattern: /\btrains?\b/i },
    { label: 'the umbrella', pattern: /\bumbrellas?\b/i },
    { label: 'the phone', pattern: /\bphones?\b/i },
    { label: 'the moth', pattern: /\bmoths?\b/i },
    { label: 'the house', pattern: /\b(?:houses?|homes?)\b/i },
    { label: 'the staircase', pattern: /\b(?:staircases?|stairs|stairways?)\b/i },
    { label: 'the water', pattern: /\b(?:water|oceans?|seas?|rivers?|lakes?)\b/i },
    { label: 'the door', pattern: /\bdoors?\b/i },
    { label: 'the forest', pattern: /\bforests?\b/i },
    { label: 'the neighborhood', pattern: /\b(?:neighbou?rhoods?)\b/i },
    { label: 'the animal', pattern: /\b(?:animals?|dogs?|cats?|birds?|spiders?|snakes?|horses?)\b/i }
  ];

  function clean(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function excerpt(value, limit = 96) {
    const text = clean(value);
    return text.length <= limit ? text : `${text.slice(0, limit - 1).trimEnd()}…`;
  }

  function detectDetails(transcript) {
    return DETAIL_PATTERNS.filter(detail => detail.pattern.test(transcript)).map(detail => detail.label).slice(0, 4);
  }

  function createQuestion(details, answers) {
    const index = answers.length;
    const focus = details[index] || details[0] || 'the detail that stands out most';
    if (index === 0) {
      return {
        id: 'personal-association',
        focus,
        text: `When you think about ${focus} in this dream, what does it mean to you personally, if anything?`
      };
    }
    if (index === 1) {
      const prior = excerpt(answers[0].answer);
      return {
        id: 'association-connection',
        focus,
        text: `You connected ${answers[0].focus} with “${prior}” When ${focus} appeared, did it feel connected to that association or different?`
      };
    }
    return {
      id: 'felt-relevance',
      focus,
      text: `Thinking about ${focus} and the feelings in this dream, does anything connect with your life right now? It’s okay if the answer is no.`
    };
  }

  function buildReflectionContext(answers) {
    if (!answers.length) return '';
    const lines = answers.map(({ focus, answer }) => `About ${focus}, you said: “${excerpt(answer, 180)}”`);
    return `Your own associations are part of the evidence:\n${lines.map(line => `- ${line}`).join('\n')}\nThese are the dreamer’s meanings, not fixed or universal symbols.`;
  }

  function normalizeSavedState(savedState, dreamID, transcript) {
    if (!savedState) return null;
    if (savedState.interviewVersion !== INTERVIEW_VERSION
      || clean(savedState.dreamID) !== dreamID
      || clean(savedState.transcript) !== transcript) {
      throw new Error('Saved interview does not match this dream transcript.');
    }
    const answers = Array.isArray(savedState.answers)
      ? savedState.answers.slice(0, MAX_QUESTIONS).map(item => ({
          questionID: clean(item?.questionID),
          focus: clean(item?.focus),
          question: clean(item?.question),
          answer: clean(item?.answer).slice(0, MAX_ANSWER_LENGTH)
        })).filter(item => item.questionID && item.focus && item.question && item.answer)
      : [];
    return { answers, complete: Boolean(savedState.complete) && answers.length > 0 };
  }

  function createInterviewSession({ dreamID, transcript, savedState = null } = {}) {
    const normalizedDreamID = clean(dreamID) || 'unspecified-dream';
    const normalizedTranscript = clean(transcript);
    if (!normalizedTranscript) throw new Error('A dream transcript is required.');
    const details = detectDetails(normalizedTranscript);
    const restored = normalizeSavedState(savedState, normalizedDreamID, normalizedTranscript);
    let answers = restored?.answers || [];
    let complete = restored?.complete || answers.length >= MAX_QUESTIONS;

    function snapshot() {
      const currentQuestion = complete ? null : createQuestion(details, answers);
      return {
        interviewVersion: INTERVIEW_VERSION,
        dreamID: normalizedDreamID,
        transcript: normalizedTranscript,
        questionIndex: answers.length,
        questionCount: MAX_QUESTIONS,
        currentQuestion,
        answers: answers.map(answer => ({ ...answer })),
        complete,
        reflectionContext: complete ? buildReflectionContext(answers) : ''
      };
    }

    function submit(value) {
      if (complete) throw new Error('This dream interview is already complete.');
      const answer = clean(value);
      if (!answer) throw new Error('Write an answer before continuing.');
      const question = createQuestion(details, answers);
      answers = [...answers, {
        questionID: question.id,
        focus: question.focus,
        question: question.text,
        answer: answer.slice(0, MAX_ANSWER_LENGTH)
      }];
      if (answers.length >= MAX_QUESTIONS) complete = true;
      return snapshot();
    }

    function finish() {
      if (!answers.length) throw new Error('Answer at least one question before finishing.');
      complete = true;
      return snapshot();
    }

    return { finish, snapshot, submit };
  }

  return { INTERVIEW_VERSION, createInterviewSession };
});
