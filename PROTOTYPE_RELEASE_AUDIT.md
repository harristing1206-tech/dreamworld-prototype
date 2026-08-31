# Dreamworld Logging Prototype Freeze Audit

Date: 2026-08-30

## Scope decision

The current Dreamworld prototype is intentionally a **dream-logging product only**. Its near-term job is to help a half-awake user preserve a dream, review the transcription, save it, and revisit it later.

The association interview, preparation pause, Listener response, dream analysis, symbolic interpretation, and private GBrain analysis integration are **not part of the current prototype scope**. Their absence is not a defect or release blocker. They must not be added until Harris explicitly reopens that phase.

## Current logging loop

> alarm preview → explicit microphone tap → record → preserve raw audio → explicit Log Dream → private transcription and punctuation → editable transcript review → durable journal save → History and Insights

## Verified in the private prototype

- Five-slot iPhone shell with Alarm, History, Log, Insights, and Profile.
- Real microphone capture with truthful recording state.
- Raw audio draft preservation and recoverable retry.
- Owner-only private Whisper transcription.
- Private punctuation restoration that preserves recognized words and source symbols.
- Editable transcript review before journal save.
- Source-grounded generated title and summary with a deterministic fallback.
- IndexedDB journal continuity across reloads.
- History, calendar, Insights, and Profile derived from one journal source.
- Raw-audio playback, transcript disclosure, title/summary editing, confirmation, swipe, and durable dream deletion.
- Durable alarm-preview records for add, edit, enabled state, and deletion.
- Truthful disclosure that the web prototype cannot schedule or fire an iOS system alarm.
- Light, dark, reduced-motion, safe-area, keyboard, and focus contracts covered by the validator suite.

## Remaining logging-prototype priorities

### P0 — Physical iPhone acceptance

Source tests and HTTP checks do not prove microphone interruption, Home Screen service-worker updates, safe areas, keyboard behavior, long transcript editing, audio playback, or storage behavior on Harris’s phone.

**Freeze criterion:** complete the logging loop on the installed private iPhone surface, record only observed failures, and rerun after fixes.

### P0 — Alarm preview durability and truthful failure states

Alarm-preview changes must survive reload without claiming to be real system alarms. Read/write failures, malformed storage, duplicates, and intentionally empty state must remain distinguishable.

**Freeze criterion:** add, edit, toggle, delete, empty collection, malformed/duplicate quarantine, denied writes, and denied reads are exercised through production event paths.

### P1 — Sheet accessibility

Alarm and dream-edit sheets should behave like accessible modals: initial focus, background inertness, Escape, focus containment, and focus restoration.

**Freeze criterion:** keyboard and assistive-technology interaction cannot escape behind an open sheet, and closing returns focus to the opener.

### P1 — Logging edge cases

Test long transcripts, empty/very short recordings, permission denial, page refresh during each capture state, metadata-generation failure, audio playback failure, and storage pressure.

**Freeze criterion:** every failure preserves recoverable user evidence and states whether it is durable or page-only.

## Current iteration

1. Finish and independently review durable alarm-preview persistence.
2. Verify the complete regression suite and all prototype validators.
3. Commit and verify the exact live private bytes.
4. Then address sheet accessibility and physical-iPhone logging QA.

## Explicitly deferred

- Association interviews.
- Listener responses.
- Dream analysis or symbolic interpretation.
- GBrain analysis persistence and remote deletion.
- Additional Insights metrics.
- More alarm visual variants.
- New themes or alternate palettes.
- Social sharing, streaks, community, or gamification.
- Store screenshots and marketing copy.

## Logging prototype freeze exit criteria

- [ ] Alarm preview add/edit/toggle/delete survives reload truthfully.
- [ ] Real audio remains preserved and retryable.
- [ ] Transcription includes natural punctuation without changing recognized words.
- [ ] Reviewed transcript, raw audio, title, summary, metadata, and immutable ID persist together.
- [ ] History reopens transcript and audio after relaunch.
- [ ] Dream edit and deletion update History, calendar, Insights, and Profile from one source.
- [ ] Failure states preserve recoverable source data and disclose durable versus page-only state.
- [ ] Web-only alarm limitations are explicit.
- [ ] Full tests, all route validators, exact-tree review, deployed-byte verification, and physical-iPhone logging tests pass.
