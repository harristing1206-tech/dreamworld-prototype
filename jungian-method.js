(function exposeJungianMethod(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DreamJungianMethod = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function makeJungianMethodAPI() {
  const METHOD_VERSION = 1;
  const MAX_ASSOCIATIONS = 3;
  const MAX_PRIOR_DREAMS = 100;
  const STOP_WORDS = new Set(['a', 'an', 'and', 'detail', 'dream', 'in', 'most', 'my', 'of', 'stands', 'that', 'the', 'this', 'to', 'your']);
  const FOCUS_ALIASES = new Map([
    ['your grandmother', ['grandmother', 'grandmothers', 'grandma', 'grandmas']],
    ['your grandfather', ['grandfather', 'grandfathers', 'grandpa', 'grandpas']],
    ['the child', ['child', 'children', 'little girl', 'little girls', 'little boy', 'little boys']],
    ['the car', ['car', 'cars']],
    ['the hat', ['hat', 'hats']],
    ['the key', ['key', 'keys']],
    ['the train', ['train', 'trains']],
    ['the umbrella', ['umbrella', 'umbrellas']],
    ['the phone', ['phone', 'phones']],
    ['the moth', ['moth', 'moths']],
    ['the house', ['house', 'houses', 'home', 'homes']],
    ['the staircase', ['staircase', 'staircases', 'stairs', 'stairway', 'stairways']],
    ['the water', ['water', 'ocean', 'oceans', 'sea', 'seas', 'river', 'rivers', 'lake', 'lakes']],
    ['the door', ['door', 'doors']],
    ['the forest', ['forest', 'forests']],
    ['the neighborhood', ['neighborhood', 'neighborhoods', 'neighbourhood', 'neighbourhoods']],
    ['the animal', ['animal', 'animals', 'dog', 'dogs', 'cat', 'cats', 'bird', 'birds', 'spider', 'spiders', 'snake', 'snakes', 'horse', 'horses']]
  ]);

  const clean = (value, limit = 1000) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);
  const words = value => clean(value).toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) || [];

  function normalizeAssociations(associations) {
    if (!Array.isArray(associations)) return [];
    return associations.slice(0, MAX_ASSOCIATIONS).map(item => ({
      focus: clean(item?.focus, 100),
      question: clean(item?.question, 300),
      answer: clean(item?.answer, 600)
    })).filter(item => item.focus && item.question && item.answer);
  }

  function focusTokenSequences(focus) {
    const normalizedFocus = clean(focus).toLocaleLowerCase();
    const aliases = FOCUS_ALIASES.get(normalizedFocus) || [normalizedFocus];
    return aliases.map(alias => words(alias).filter(token => !STOP_WORDS.has(token) && token.length > 2).slice(0, 4)).filter(sequence => sequence.length);
  }

  function containsTokenSequence(text, sequence) {
    if (!sequence.length) return false;
    const haystack = words(text);
    for (let start = 0; start <= haystack.length - sequence.length; start += 1) {
      if (sequence.every((token, offset) => haystack[start + offset] === token)) return true;
    }
    return false;
  }

  function stableHash(value) {
    let hash = 2166136261;
    for (const character of String(value || '')) {
      hash ^= character.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function findRecurrences(dreamID, associations, priorDreams) {
    if (!Array.isArray(priorDreams) || !associations.length) return [];
    const recurrences = [];
    const seen = new Set();
    for (const prior of priorDreams.slice(0, MAX_PRIOR_DREAMS)) {
      const priorID = clean(prior?.id, 120);
      const transcript = clean(prior?.transcript, 20000);
      if (!priorID || priorID === dreamID || !transcript) continue;
      for (const association of associations) {
        const tokenSequences = focusTokenSequences(association.focus);
        if (!tokenSequences.some(sequence => containsTokenSequence(transcript, sequence))) continue;
        const identity = `${priorID}:${association.focus.toLocaleLowerCase()}`;
        if (seen.has(identity)) continue;
        seen.add(identity);
        recurrences.push({
          dreamID: priorID,
          focus: association.focus,
          loggedAt: clean(prior?.loggedAt, 40)
        });
      }
    }
    return recurrences.sort((left, right) => {
      const dateOrder = String(right.loggedAt).localeCompare(String(left.loggedAt));
      return dateOrder || left.dreamID.localeCompare(right.dreamID) || left.focus.localeCompare(right.focus);
    });
  }

  function buildLongitudinalNote(recurrences) {
    if (!recurrences.length) return '';
    const focusCounts = new Map();
    for (const recurrence of recurrences) {
      focusCounts.set(recurrence.focus, (focusCounts.get(recurrence.focus) || 0) + 1);
    }
    const summary = [...focusCounts.entries()].map(([focus, count]) => `${focus} in ${count} other logged dream${count === 1 ? '' : 's'}`).join(' and ');
    const pronoun = focusCounts.size === 1 ? 'it' : 'them';
    return `Across your saved history, ${summary} also appears. That recurrence does not give ${pronoun} a fixed meaning; compare what changed in your feeling, role, and outcome.`;
  }

  function buildJungianContext({ dreamID, associations = [], priorDreams = [] } = {}) {
    const normalizedDreamID = clean(dreamID, 120) || 'unspecified-dream';
    const personalAssociations = normalizeAssociations(associations);
    const recurrences = findRecurrences(normalizedDreamID, personalAssociations, priorDreams);
    const historyFingerprint = stableHash(JSON.stringify(recurrences));
    return {
      methodVersion: METHOD_VERSION,
      framework: 'Context-first Jungian reflection',
      claimStatus: 'interpretive-hypothesis',
      evidenceTier: 'jung-derived-method',
      personalAssociations,
      longitudinal: {
        recurrences,
        note: buildLongitudinalNote(recurrences)
      },
      historyFingerprint,
      citations: [
        {
          source: 'C. G. Jung, CW 7',
          locator: '§§123–140, §§188–190',
          use: 'objective/subjective hypotheses and revision by later dreams'
        },
        {
          source: 'C. G. Jung, Man and His Symbols',
          locator: 'pp. 28–31, 52–53',
          use: 'stay with the image and reject fixed symbol dictionaries'
        },
        {
          source: 'C. G. Jung, CW 8',
          locator: '§§443–569',
          use: 'compensation as a contextual hypothesis'
        }
      ],
      safeguards: [
        'personal-association-first',
        'no-fixed-symbol-meaning',
        'no-diagnosis-or-prediction',
        'no-supernatural-certainty',
        'later-dreams-may-revise'
      ]
    };
  }

  function appendLongitudinalNote(response, context) {
    const text = clean(response, 20000);
    const note = clean(context?.longitudinal?.note, 1000);
    return note ? `${text}\n\n${note}` : text;
  }

  return {
    METHOD_VERSION,
    appendLongitudinalNote,
    buildJungianContext
  };
});
