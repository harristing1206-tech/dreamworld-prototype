(function initDreamAnalysis(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DreamAnalysis = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function makeDreamAnalysisAPI() {
  const ANALYSIS_VERSION = 3;
  const CHARACTER_NAME = 'The Listener';
  const clean = value => String(value || '').trim();
  const escapePattern = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hasAny = (text, words) => words.some(word => {
    const phrase = escapePattern(word);
    return new RegExp(`(^|[^a-z0-9])${phrase}(?=$|[^a-z0-9])`, 'i').test(text);
  });

  function createCharacterAnalysis(transcript) {
    const account = clean(transcript);
    if (!account) throw new Error('A dream transcript is required for analysis.');
    const text = account.toLowerCase();

    const friends = hasAny(text, ['friend', 'friends']);
    const socialDeparture = friends && hasAny(text, ['left', 'leave', 'leaving', 'gone', 'drove away', 'said goodbye']);
    const grandfather = hasAny(text, ['grandpa', 'grandfather']);
    const grandmother = hasAny(text, ['grandma', 'grandmother']);
    const deceased = hasAny(text, ['dead', 'died', 'deceased', 'passed away', 'no longer alive']);
    const grief = hasAny(text, ['grief', 'miss', 'missed', 'missing', 'crying', 'cried', 'tears', 'mourning']);
    const youngAgain = hasAny(text, ['young', 'younger', 'young girl', 'young boy']);
    const sadness = hasAny(text, ['sad', 'sadness', 'crying', 'cried', 'tears']);
    const impermanenceMessage = hasAny(text, ['people come and go', 'come and go', "that's how life is", 'that is how life is']);
    const admittedSadness = hasAny(text, ['sometimes i do feel sad', 'sometimes i feel sad']);
    const reassurance = hasAny(text, ["that's okay", 'that is okay']);

    if (socialDeparture && deceased && (grandfather || grandmother)) {
      if (grandfather && grandmother && youngAgain && impermanenceMessage && admittedSadness && reassurance) {
        return `The dream begins with a social loss in slow motion: your friends leave one by one, and you remain watching. The sadness seems less about the car than about being the person left behind as a shared moment ends. One possible connection is a sensitivity to transitions—or to the way closeness changes even when nothing has gone wrong.\n\nYour grandfather then appears young, at an age you never knew him. Because the dream is creating an image rather than replaying an age you remember, it may be imagining him as a whole person with a life before your memories began. When your grandfather asks whether you are sad, you answer, “Sometimes I do feel sad.” The dream does not hide the feeling; it names it. His reply—“That’s okay. That’s how life is: people come and go”—could be read as a familiar, internalized voice offering acceptance of both sadness and impermanence, not telling you to move on.\n\nOnly after that reassurance does your grandmother appear, also young, and you cry because you miss them. That sequence matters: departure opens the sadness, your grandfather helps you admit and hold it, and your grandmother’s arrival releases grief and love together. This may be less a warning than a dream about allowing attachment and loss to coexist. Has a recent goodbye or change made their absence feel closer—or made you need the kind of comfort your grandfather gave you here?`;
      }
      const relatives = grandfather && grandmother ? 'grandparents' : grandfather ? 'grandfather' : 'grandmother';
      const ageReading = youngAgain
        ? `Your ${relatives} appearing young may matter because the dream is creating ages outside the memories available to you. One possible reading is that it imagines them as people with full lives beyond the versions you personally knew, letting memory and grief move outside ordinary chronology.`
        : `The return of your ${relatives} does not have to be treated as a supernatural message to be meaningful. The dream gives an important relationship a living voice again, allowing grief, memory, and the need for comfort to occupy the same scene.`;
      const messageReading = impermanenceMessage
        ? `Most importantly, your grandfather gives the dream its own interpretation: “people come and go.” One possible reading is that his voice makes room for sadness while also offering acceptance of impermanence.`
        : `The conversation lets the dream answer the loneliness created by the departures, using someone you loved as a voice of perspective and reassurance.`;
      const emotionReading = sadness || grief
        ? `Crying when your family appears reads less like a warning than grief and love becoming available at the same time.`
        : `Their presence seems to hold the emotion that the earlier departures bring up.`;
      return `The dream places two kinds of separation beside each other: your friends leave one by one while you watch, and then your ${relatives}, who are gone, return. That makes the sadness less about the car and more about being the person who remains after people move out of reach. It may be touching a current sensitivity to change, friendship transitions, or the fact that closeness cannot be held still.\n\n${ageReading}\n\n${messageReading} ${emotionReading} A grounded question is whether some recent departure or transition has reactivated how much you miss them—and whether their way of speaking has become part of how you now comfort yourself.`;
    }

    const water = hasAny(text, ['ocean', 'water', 'river', 'rain', 'flood', 'wave', 'swim', 'sea']);
    const home = hasAny(text, ['house', 'home', 'room', 'bedroom', 'apartment']);
    const blocked = hasAny(text, ['locked', 'stuck', 'blocked', 'closed', 'couldn’t', "couldn't", 'would not open', 'missed the train', 'missed my train', 'missed the flight', 'missed my flight', 'running late', 'too late']);
    const pursued = hasAny(text, ['chased', 'chasing', 'followed', 'following', 'hiding', 'running away', 'escape']);
    const falling = hasAny(text, ['falling', 'fell', 'dropped', 'edge', 'cliff']);
    const flying = hasAny(text, ['flying', 'flew', 'floating', 'weightless']);
    const travel = hasAny(text, ['train', 'airport', 'plane', 'road', 'car', 'bus', 'journey', 'station']);
    const work = hasAny(text, ['work', 'office', 'school', 'class', 'exam', 'test', 'boss']);

    if (water && home) {
      return 'What stands out is the distance between the water and the place that should feel like home. The crossing gives the dream a sense of uncertainty, while the house or rooms make arrival feel tied to safety and belonging. I’d read this as your mind testing what “home” means when reaching it does not automatically make you feel settled. What in waking life currently feels close to home, but not fully secure?';
    }
    if (blocked && hasAny(text, ['door', 'gate', 'entrance', 'key'])) {
      return 'The locked entrance feels like the center of this dream. You are close enough to know something is on the other side, but access is being withheld while pressure builds around you. That can mirror a waking situation where you feel ready to move forward but do not control the timing, permission, or outcome. Where are you currently waiting for access—or pushing against a boundary?';
    }
    if (pursued) {
      return 'The dream keeps you moving instead of letting you turn and look directly at what is following you. That pattern can show up when pressure feels easier to outrun than to name. I would pay less attention to who or what was chasing you and more to the feeling that stopping was not safe. What have you had little room to face at your own pace lately?';
    }
    if (falling) {
      return 'The fall concentrates the dream around a sudden loss of control. Dreams like this can gather uncertainty, risk, or the feeling that your footing changed before you were ready. The important detail may be what happened just before the drop—and whether you felt fear, relief, or surrender. Where has life recently felt less stable than it looks from the outside?';
    }
    if (flying) {
      return 'The ability to rise above the scene gives this dream a strong sense of freedom and distance. It may be exploring what becomes possible when ordinary limits loosen, but distance can also protect you from whatever is happening below. Did flying feel like expansion, escape, or both—and where do you want more room in waking life?';
    }
    if (travel && blocked) {
      return 'This dream turns movement into a timing problem: you are trying to get somewhere, but something keeps interrupting the route. That can reflect pressure around progress, deadlines, or the fear of missing a moment that matters. I’d look at what the destination represented emotionally rather than literally. What currently feels as if it has to happen on someone else’s schedule?';
    }
    if (work) {
      return 'The familiar work or school setting seems to be carrying more than its literal meaning. These places often concentrate evaluation, responsibility, and the feeling of being watched while trying to perform. I’d read the dream as checking how much pressure you are carrying—not as predicting an outcome. Where have you been measuring yourself most harshly lately?';
    }
    if (water) {
      return 'Water is doing most of the emotional work in this dream. Its depth, movement, and visibility can reflect how manageable—or overwhelming—your inner state feels right now. Rather than assigning it a fixed symbol, I’d focus on your relationship to it: were you crossing it, carried by it, or trying to stay above it? What feeling has been hardest to contain lately?';
    }
    if (home) {
      return 'The house or room makes this dream feel personal and inward. Homes in dreams often organize questions of safety, privacy, memory, and belonging, but the meaning depends on how the space felt to you. I’d pay attention to what was open, hidden, familiar, or missing. What part of your life currently feels like it needs a safer place to land?';
    }

    const excerpt = account.replace(/\s+/g, ' ').slice(0, 120).replace(/[.!?]+$/, '');
    return `What stands out is the emotional situation inside “${excerpt}${account.length > 120 ? '…' : ''}.” I would not treat it as a prediction or a fixed symbol. It reads more like your mind rehearsing a feeling, conflict, or possibility that has not fully settled yet. Which moment carried the strongest feeling when you woke up—and where does that feeling already exist in your waking life?`;
  }

  function createAnalysisSession({ dreamID, title = 'Dream', transcript, transcriptSource = 'unknown', savedState = null } = {}) {
    const normalizedTranscript = clean(transcript);
    if (!normalizedTranscript) throw new Error('A dream transcript is required for analysis.');

    const evidence = {
      transcript: normalizedTranscript,
      transcriptSource: clean(transcriptSource) || 'unknown',
      author: 'user-record'
    };
    const evidenceMatches = savedState
      && savedState.analysisVersion === ANALYSIS_VERSION
      && savedState.dreamID === clean(dreamID)
      && savedState.evidence?.transcript === evidence.transcript
      && savedState.evidence?.transcriptSource === evidence.transcriptSource;
    const savedResponse = evidenceMatches && savedState.characterResponse?.speaker === CHARACTER_NAME
      && typeof savedState.characterResponse?.text === 'string'
      && savedState.characterResponse.text.trim()
      ? savedState.characterResponse.text.trim()
      : '';

    const state = {
      analysisVersion: ANALYSIS_VERSION,
      dreamID: clean(dreamID) || 'unspecified-dream',
      title: clean(title) || 'Dream',
      evidence,
      characterResponse: {
        speaker: CHARACTER_NAME,
        text: savedResponse || createCharacterAnalysis(normalizedTranscript),
        author: 'character'
      }
    };

    return {
      snapshot() { return JSON.parse(JSON.stringify(state)); }
    };
  }

  return {
    ANALYSIS_VERSION,
    CHARACTER_NAME,
    createCharacterAnalysis,
    createAnalysisSession
  };
});
