# Dreamworld Design Playbook

**Status:** Working product standard, version 2
**Primary foundations:** Don Norman, *The Design of Everyday Things* (2013) and *Emotional Design*, read from the user-provided full copies.
**Companion lenses:** Tim Brown, Nigel Cross, Roger Martin, and Sarah Stein Greenberg, based on legally accessible excerpts and author materials until full copies are supplied.

This document converts design theory into product rules, review questions, and testable acceptance criteria. It should change when observation contradicts an assumption.

## 1. North star

> Help a half-awake person preserve and revisit a fragile dream experience with almost no cognitive effort, without demanding recall, creating judgment, or undermining trust.

Dreamworld is not primarily an alarm, recorder, interpretation engine, or game. It is an activity system spanning:

> wake → notice → capture or decline → save → recover → review → interpret → grow a personal world

The immediate and delayed jobs must remain separate:

- **Immediate:** preserve what remains and let the person return to sleep or begin the day.
- **Later:** review, correct, reflect, interpret, and explore the world.

## 2. Product conceptual model

The product must teach one stable story through its interface:

1. Dreamworld offers a brief capture opportunity.
2. The user may narrate a dream, record a fragment, defer, or report no recall.
3. Raw input is preserved before enrichment begins.
4. Recording, saving, transcription, analysis, and world generation are separate states.
5. AI output is proposed interpretation, not recovered fact or diagnosis.
6. The user controls corrections, meaning, privacy, deletion, and what enters the world.

If a user cannot accurately explain this model after one use, the system image has failed.

**Norman basis:** discoverability and understanding (Ch. 1; extracted lines 257–261); conceptual models and system image (Ch. 1; 500–562); gulf of evaluation (Ch. 2; 602–618).

## 3. Required state model

Never collapse these into an ambiguous animation or generic success state:

1. **Alarm ringing**
2. **Ready to capture**
3. **Listening**
4. **Paused**
5. **Saving locally**
6. **Saved locally**
7. **Transcribing**
8. **Needs review**
9. **Analysis available**
10. **World updated**
11. **Recoverable failure**

Every state needs a truthful signifier and a clear next action. A decorative waveform may not imply recording unless driven by real microphone input. “Stopped” may not imply “saved.”

**Norman basis:** signifiers and false signifiers (Ch. 1; 352–430); feedback (Ch. 1; 482–498); mode errors (Ch. 5; 2217–2233).

## 4. Core design rules

### Rule 1 — Discoverability precedes beauty

A new, groggy user must identify the available action without remembering onboarding, exploring, or decoding an icon. Visual restraint may not remove necessary signifiers.

**Reject:** hidden gestures, icon-only capture, clever but unfamiliar controls, aesthetic minimalism that conceals state.

### Rule 2 — Put knowledge in the world

Do not ask the user to remember command syntax, prior state, unfinished steps, or whether content saved. Keep current status and recovery actions visible.

Design practical working-memory demand below even Norman’s three-to-five-item recommendation because sleep inertia and interruption further reduce capacity.

**Norman basis:** knowledge in head/world (Ch. 3; 1041–1067); working memory (1223–1247).

### Rule 3 — Minimize both gulfs

- **Execution:** make it immediately clear how to narrate, log a fragment, defer, or report no recall.
- **Evaluation:** make it immediately clear what happened, what is safe, and what happens next.

A flow is not simple merely because it has few buttons. Hidden meaning can make a sparse interface cognitively expensive.

### Rule 4 — Use recognition, not recall

Prefer visible, familiar choices over remembered gestures or commands. Use recognizable iPhone and voice-message conventions unless testing proves a new pattern substantially better.

**Norman basis:** precise behavior from imprecise knowledge (Ch. 3; 1043–1067); conventions and standardization (Ch. 4; 1803–1853, 1935–1945).

### Rule 5 — Design around the activity, not subsystems

The user is preserving a dream—not operating microphone, transcription, storage, AI, and rendering modules. Those systems should support the activity without becoming separate morning tasks.

**Norman basis:** activity-centered controls (Ch. 4; 1723–1755); activity-centered design (Ch. 6; 2787–2815).

### Rule 6 — Accept human variation

Fragments, long pauses, whispering, uncertain chronology, invented words, corrections, silence, and “nothing… wait” are normal inputs. The system should approximate intent and preserve partial work rather than demand machine-like precision.

### Rule 7 — Preserve first capture and provenance

Dream memory is reconstructive. Keep the earliest raw audio/transcript distinct from later edits, summaries, interpretations, and generated imagery. Label content by source and time.

**Norman basis:** reconstructive long-term memory (Ch. 3; 1249–1267); automation and human-machine collaboration (Ch. 5; 2605–2629).

### Rule 8 — Treat predictable error as a design input

Half-awake taps, interruptions, repeated actions, wrong modes, denied permissions, poor recognition, app termination, and network loss are not edge cases.

Design for prevention, detection, preservation, undo, and recovery. Never blame the user or require a complete restart when partial work exists.

**Norman basis:** slips vs. mistakes (Ch. 5; 2115–2157); interruption (2197–2215); undo and sensibility checks (2423–2537); resilience (2541–2603).

### Rule 9 — Make absence dignified and precise

Distinguish among:

- dream remembered;
- fragment or feeling only;
- not ready now;
- no dream remembered;
- explicit belief that no dream occurred.

Do not make “no dream” a failure state, broken streak, shrinking world, or guilt mechanism. Make accidental choices reversible.

### Rule 10 — Use multimodal, proportionate feedback

Important transitions should be perceivable through compatible combinations of visual state, haptics, and short sound. Sound should communicate state—not brand theater—and remain suitable beside a sleeping partner.

Avoid repeated chimes, long spoken confirmations, decorative motion, or transient-only recovery messages.

**Norman basis:** feedback priority (Ch. 1; 482–498); sound as signifier (Ch. 4; 1947–2013).

### Rule 11 — Keep AI tentative, traceable, and correctable

Separate transcription, descriptive summary, speculative interpretation, user-confirmed meaning, and generated world elements. Show supporting passages where useful. Allow rejection, correction, hiding, and opting out.

Never imply diagnosis, recovered truth, or psychological authority.

### Rule 12 — Resist featuritis

The product advantage is a coherent loop, not a checklist. Social feeds, sleep analytics, lucid-dream training, symbol dictionaries, mood tracking, quests, streaks, and generated media require strong evidence that they strengthen the core activity.

Every proposed addition must identify what it replaces or simplifies.

**Norman basis:** paradox of technology (Ch. 1; 564–576); featuritis and competitive imitation (Ch. 7; 3113–3145).

## 5. Alarm and capture requirements

The next alarm prototype must satisfy all of the following:

- The alarm can be silenced quickly and safely.
- Capture is available from the wake surface without navigation.
- The dominant action communicates speech capture plainly.
- Fragmentary recall has an obvious home.
- “No dream remembered” is visible, neutral, and reversible.
- “Not now” is available without penalty when appropriate.
- The user can tell within one second whether listening began.
- Listening state is truthful and persistent.
- Pause, resume, finish, and discard have distinct consequences.
- Audio begins saving incrementally from capture start.
- Interruption preserves state and offers one clear continuation action.
- Recording completion and durable save are distinct.
- Capture succeeds independently of network analysis.
- The final state communicates what is safe, what happens later, and permission to leave.
- Large targets, high contrast, reduced motion, VoiceOver, haptics, and nonvoice alternatives are considered from the start.

## 6. Recovery requirements

Dreamworld must be able to recover from:

- accidental alarm dismissal;
- accidental “no dream” selection;
- long silence or delayed speech;
- incoming calls and notifications;
- screen locking or app backgrounding;
- microphone permission denial;
- weak or absent connectivity;
- transcription failure or wrong language;
- device storage pressure;
- duplicate or partial recordings;
- app termination during capture;
- analysis or world-generation failure;
- accidental deletion.

Use layered defenses: incremental local save, retained original audio, retryable transcription, visible sync status, version history, and recoverable deletion.

## 7. Visual and interaction design posture

The visual design must emerge from the tested interaction rather than decorate an unvalidated flow.

The signed-off product direction is **world-first**:

- After a brief transition, the current dream world is the default home surface.
- Persistent, restrained navigation provides direct access to World, Dreams, Capture, and Settings.
- Returning users do not need explanatory headlines or product-description copy on the home surface.
- The retro-game identity should come from the world art, sprite construction, motion, typography, and interaction details—not competing effects or multiple bright accent colors.
- Use one muted, coherent palette and reserve contrast for current state and primary action.
- The world must reflect the user’s real local time through distinct morning blue hour, sunrise, morning, noon, afternoon, golden hour, sunset, and night states. Celestial bodies, stars, light, color temperature, and ambient motion should change coherently rather than applying a superficial tint.
- The prototype may use local clock bands; the native product should calculate solar phases from local date and location when permission is available, with a privacy-preserving clock-based fallback.

Additional posture:

- Calm does not require fantasy illustration.
- Minimal does not mean invisible controls.
- Aesthetic novelty may not replace conventional state communication.
- World-building imagery belongs after raw capture is safe during the wake flow, while the normal app home may foreground the existing world.
- Low-light treatment must preserve contrast and legibility.
- Animation should clarify continuity or state—not merely look dreamlike.
- A visual element must improve orientation, confidence, recall, or meaning to remain.

The world home may be visually rich. The wake and capture interactions must remain quiet and explicit.

## 8. Ethical and privacy standard

Dreamworld handles intimate and potentially trauma-related material.

- No diagnosis or deterministic symbol claims.
- No alarmist responses to disturbing dreams.
- No manipulative streaks or punishment for absence.
- No selling intimate content or default model-training consent.
- Clear local/cloud processing boundaries.
- Independent deletion controls for audio, transcript, analysis, and world derivatives.
- Export and account deletion must be understandable and complete.
- Public sharing must require deliberate, awake consent.
- Generated imagery must be editable and removable without rewriting the source dream.
- Nightmare, trauma, self-harm, and delusion-adjacent content require a safety review before automated interpretation ships.

## 9. Research and experimentation process

Use two linked divergence–convergence cycles:

1. **Discover and define the correct problem.**
2. **Develop and deliver an appropriate solution.**

Run repeated HCD loops:

> observe → generate alternatives → prototype → test → revise the problem or solution

### Required research conditions

- Test in real mornings, not only daytime walkthroughs.
- Include solo and shared-bedroom users.
- Include vivid recall, fragmentary recall, and repeated no-recall mornings.
- Include speech, hearing, motor, visual, and VoiceOver perspectives.
- Debrief later instead of demanding extensive explanation while groggy.
- Observe behavior, latency, repeated taps, abandonment, and recovery—not only stated preference.
- Test over multiple mornings to separate enduring value from novelty.

### Candidate alternatives to preserve until evidence supports convergence

- immediate open microphone;
- dominant one-tap capture;
- explicit dream/no-dream gate;
- gentle recall cue;
- fragment-only capture;
- silent or haptic invitation;
- user-selected delay;
- text or sketch fallback;
- local-only capture with later analysis.

**Norman basis:** solve the correct problem and double diamond (Ch. 6; 2645–2683); HCD spiral (2685–2767).

## 10. Measurement

Do not mistake engagement for value. Measure:

- time to first captured detail;
- recall preserved versus existing behavior;
- successful and failed capture rate;
- repeated taps and mode confusion;
- accidental dismissal and recovery;
- perceived disturbance and emotional comfort;
- transcript correction rate;
- interpretation rejection/correction rate;
- privacy-model comprehension;
- ability to explain why the world changed;
- willingness to repeat after novelty fades;
- no-recall participation without guilt;
- longitudinal attachment to the archive and world.

## 11. Stage gates

### Gate 1 — Problem evidence

Observed evidence that preserving or revisiting the waking dream experience matters and identifies meaningful impediments.

### Gate 2 — Morning ritual evidence

Repeated realistic tests show that users can capture, defer, or report no recall with low cognitive and emotional burden.

### Gate 3 — Trust and resilience

The product preserves content through interruptions and failures; users understand recording, storage, analysis, privacy, and recovery.

### Gate 4 — Later-value evidence

Analysis and world growth provide sustained value without distorting recall, implying authority, or coercing disclosure.

### Gate 5 — Feasibility and viability

Native alarm behavior, storage, transcription, inference, accessibility, support, privacy, and cost are credible.

### Gate 6 — Release readiness

The complete activity works longitudinally, including onboarding, permissions, failures, export, deletion, cancellation, model changes, and service shutdown.

## 12. Review questions

Before approving a screen or feature, ask:

1. What human goal is this serving?
2. Is the intended action discoverable without instruction?
3. What does the user believe will happen?
4. Is current state continuously perceivable and correctly interpretable?
5. What knowledge are we unnecessarily requiring the user to remember?
6. What slips, mistakes, interruptions, and mode errors are predictable?
7. What is preserved if every dependent system fails?
8. Can the user undo, recover, correct, or decline without penalty?
9. Are raw memory, machine inference, and user-confirmed meaning distinguishable?
10. Does this strengthen the wake–capture–reflect–world loop?
11. Is it based on observed need or competitive anxiety?
12. What existing element can it remove or simplify?
13. Could it exploit vulnerability, punish absence, or overstate interpretation?
14. Is this an incremental improvement or an unvalidated radical bet?
15. What evidence would cause us to change or remove it?

## 13. Reference-driven visual design workflow

AI may assist visual exploration, but it may not invent Dreamworld’s interface from a vague prompt.

### Step 1 — Collect references by design problem

Build separate reference boards for:

- wake and alarm interactions;
- voice recording and truthful state feedback;
- low-light accessibility;
- reflective journals and archives;
- maps, worlds, and long-term visual continuity;
- correction, privacy, and deletion controls.

Use sources such as Mobbin, 21st.dev, platform conventions, and products with relevant interaction patterns. Extract transferable principles rather than cloning a distinctive proprietary interface.

### Step 2 — State what to avoid

Every design prompt must include an anti-style list grounded in the product, such as:

- no default purple/blue technology gradient;
- no random emoji as interface icons;
- no stacks of generic rounded cards;
- no glassmorphism or blur without a functional depth model;
- no decorative waveform that implies recording falsely;
- no oversized marketing copy on an operational wake screen;
- no hidden controls in pursuit of minimalism;
- no dream imagery competing with capture before the memory is safe.

### Step 3 — Explore materially different styles

Generate at least three coherent visual directions after the interaction flow is validated:

1. **Quiet utility:** nearly invisible, system-adjacent, and behavior-first.
2. **Tactile journal:** intimate, editorial, and materially warm without sacrificing state clarity.
3. **Living world:** atmospheric and distinctive, with expressive imagery delayed until after capture.

Do not treat color swaps as different directions.

### Step 4 — Lock a style guide before implementation

Define and document:

- color roles and accessibility contrast;
- type families, weights, sizes, and line heights;
- spacing scale;
- border, divider, and radius rules;
- elevation and shadow rules;
- icon and illustration language;
- motion posture and reduced-motion behavior;
- component states: default, pressed, focused, disabled, listening, paused, saving, saved, and failed;
- sound and haptic vocabulary.

Use design tokens and reusable components so implementation receives structured context rather than screenshots alone. Figma-to-code or MCP-style transfer may help preserve tokens and components, but generated code still requires accessibility, behavior, and device testing.

### Step 5 — Apply the system to one critical flow first

Before styling the whole app, apply the chosen system to:

> alarm → capture or no recall → listening → saved → exit

Test that flow in real morning conditions. Only extend the visual system after both usability and visual comprehension survive testing.

### Step 6 — Audit fidelity and slop

Compare implementation against the approved references and tokens. Check for generic AI defaults, visual inconsistency, false signifiers, inaccessible contrast, missing states, and unnecessary decoration. Correct the system rather than patching isolated pixels.

This workflow incorporates the useful process demonstrated in the shared Instagram reel: start from references, explore styles, explicitly name what to avoid, lock colors/typography/spacing/components, and then translate the system into code. It does not replace user research, problem framing, low-fidelity prototyping, or testing.

## 14. Current strategic decision

Dreamworld should pursue **radical meaning through incremental execution**:

- **Radical meaning:** a persistent visual relationship with one’s dream life.
- **Incremental execution:** dependable capture, graceful absence, transparent AI, careful editing, privacy, continuity, and disciplined omission.

The growing world remains the differentiated hypothesis. Reliable and humane capture is the foundation that must earn the right to build it.

## 15. Emotional design standard

Dreamworld must satisfy Norman’s three levels simultaneously:

- **Visceral:** the first second feels calm, intimate, and coherent with the user’s waking context.
- **Behavioral:** the immediate job works reliably with low cognitive load, truthful state feedback, and recoverable failure.
- **Reflective:** the archive and world accumulate personal history without prescribing identity or overstating machine interpretation.

Use the product phrase:

> **A gentle threshold into a world that remembers.**

This changes the implementation order:

1. Make durable save and **Done for now** emotionally complete before asking for transcript review.
2. Add dignified fragment, text, no-recall, and not-now paths.
3. Build the provenance-aware native Dreams archive.
4. Make every world change explainable and source-linked.
5. Only then extend atmospheric polish across the full experience.

Do not confuse cosmetic customization with personal meaning. The world becomes personal through accumulated dreams, corrections, user choices, and history—not theme pickers, points, streaks, or generic generated collectibles.

Because people readily anthropomorphize responsive systems, Dreamworld may feel warm and alive but may never imply that its AI understands the user’s psyche. Descriptive patterns, speculative interpretations, user-confirmed meaning, and world representation must remain visibly distinct.

The detailed evidence map, screen audit, prioritized backlog, experiments, and framework limitations are maintained in [`EMOTIONAL_DESIGN_APPLICATION.md`](EMOTIONAL_DESIGN_APPLICATION.md).
