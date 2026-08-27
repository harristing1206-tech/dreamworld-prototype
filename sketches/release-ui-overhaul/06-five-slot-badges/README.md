# Dreamworld Five-Slot Navigation + Insights Demo

## Navigation

1. Alarm
2. History
3. Raised center `+` — Log a dream
4. Insights
5. Profile/Home — personal summary and Settings

## Insights contract

- A monthly calendar marks every day with at least one logged dream.
- Selecting a day reveals its dream title, sleep duration, recording length, and recall clarity.
- Monthly summaries show dream nights, average sleep, average spoken capture length, and clear-recall frequency.
- Multiple dreams on one date increase the dream-entry count without falsely increasing the number of dream nights.
- Sleep duration is explicitly sample data in this web prototype. A native release may read Apple Health sleep data only after the user grants Health permission.
- A dream updates the profile and Insights receipt only after its transcript is reviewed and saved.

## Private OpenWhispr-compatible transcription

- Recording uses the user’s actual microphone through `MediaRecorder`; no canned transcript exists in the completion path.
- The raw audio Blob is preserved in IndexedDB when iPhone storage permits, with a truthful in-memory fallback.
- **Log Dream** explicitly uploads the saved recording to the owner-only `/dreamworld-stt` route.
- Tailscale identity and the exact private app origin are required by the bridge.
- Audio is normalized with FFmpeg and transcribed by OpenWhispr’s pinned `whisper.cpp` CPU server using the multilingual Whisper Small model.
- The server deletes temporary audio after every request and does not log audio or transcript content.
- Failures preserve the same raw recording for retry; discarding requires a separate explicit action.
- Every transcript displays engine, model, processing location, and retention provenance.

## Durable journal and Insights continuity

- **Save to Journal** writes one atomic IndexedDB record containing immutable ID, local calendar date, transcript, raw audio Blob, MIME type, recording duration, recall state, and transcription provenance.
- History, Profile counts, Insights metrics, and the monthly calendar are rendered from the same journal record set.
- Every logged dream appears immediately in History and remains after relaunch.
- Seeded sample dreams are shown only while the journal is empty; once a real dream is saved, the journal and Insights switch entirely to the user’s records.
- The corresponding calendar date is marked automatically; multiple dreams on one day remain separate journal entries but count as one dream night.
- Tapping a marked date opens the newest exact dream from that date, while the complete History list retains every entry.
- If durable storage fails, the transcript and raw audio remain on the review screen and the app does not report the dream as logged.
- Other open Dreamworld tabs refresh through a journal update channel.

## Swipe, edit, and deletion controls

- Alarm and Dream History each have a top-left **Edit** pill. Like the supplied iOS Clock reference, entering Edit mode morphs it into a circular checkmark, slides in one red minus control per row, replaces alarm switches with chevrons, and keeps row content readable.
- In Edit mode, tapping a row edits it; tapping its minus reveals the red Delete action. Alarm Edit reuses the smooth alarm sheet, while Dream Edit provides bounded title and summary fields and durably updates the exact IndexedDB record.
- Outside Edit mode, holding and dragging a row left provides uninterrupted one-to-one finger feedback across the row's full measured width. The red destructive surface expands behind the moving content and can cover the entire row; there is no fixed 144px movement clamp.
- Release remains safe: drags under 60px reset, qualifying drags settle to a compact 88px Delete action, and the swipe itself never deletes anything. Tapping the exposed row closes the action rather than opening or toggling it.
- Every Delete action opens a dedicated confirmation dialog. Cancel preserves the item and restores focus; confirmed Delete is red, removes the exact alarm or dream, and cannot be triggered by the swipe itself.
- Dream deletion is durable and immediately recalculates History, calendar markers, Insights, and Profile totals. The confirmation modal makes the obscured app inert, traps focus, and supports Escape.

## Audio-reactive morning capture

- The recording state uses an original three-form botanical figure inspired by the supplied soft abstract reference, without copying its brand, controls, or composition.
- A real `AudioContext` connects the active microphone stream to an `AnalyserNode`; time-domain RMS energy drives one shared smoothed `--voice-level`, so all three forms expand and soften in unison with the user's voice.
- The visualization never connects microphone audio to speakers, never records a second stream, and stops its animation frame, source, analyser, and audio context whenever recording ends, errors, is discarded, or the user leaves Log.
- If Web Audio is unavailable, recording still works and the figure remains calm and static. With Reduce Motion enabled, analysis animation does not start.
- Recording truth remains explicit through the timer, Recording status, stop-and-save control, and local-draft flow.

## Anarlog-adapted journal titles and summaries

- After the user reviews the real transcript and taps **Save to Journal**, Dreamworld fingerprints that exact transcript and sends it to the owner-only `/dreamworld-ai/v1/title` route.
- The private route adapts Anarlog’s MIT-licensed concise-title and source-grounded summary workflow for dreams: 2–8 title words and a faithful 1–2 sentence summary, with no symbol interpretation or invented details.
- The response must bind to the exact transcript fingerprint and declare `anarlog-adapted-dream-title-summary-v1` provenance before it is accepted.
- History and the Insights calendar use the generated title; the summary appears as the journal excerpt, while the full reviewed transcript and raw audio remain separately accessible.
- If private generation is unavailable, the app saves with a deterministic transcript-derived title and summary rather than a generic date. The fallback is visibly disclosed and recorded in provenance.

## Navigation and journal refinements

- The 58px center Log button keeps its established size but sits only 4px above the icon row, so it remains prominent without floating away from the tab bar.
- History rows use a compact 66px minimum layout containing the dream title first and its short logged date directly underneath. Summary, duration, transcript, and audio details remain inside the opened dream.
- Open dream details support a release-time swipe-right exit: horizontal drag feedback follows the finger, swipes under 72px reset, and successful swipes return focus to the matching History row. The visible back button remains available.
- Profile statistics use a centered divider with 32px of breathing room; Dreams Logged aligns left and Dream Nights aligns right.

## Appearance

- Dreamworld follows the iPhone’s Light or Dark appearance by default.
- Profile → Appearance cycles between **System**, **Light**, and **Dark**.
- The preference persists locally and System mode reacts to live iOS appearance changes.
- Dark mode uses a dedicated forest-night palette across navigation, calendars, forms, alarm wheels, transcription states, journal entries, and sheets—not a simple color inversion.
- Theme-color and iOS standalone status-bar metadata update with the resolved appearance.

## Included interactions

- Dreamworld alarm list, switches, and smooth Add Alarm wheel
- History of prior dream recordings and transcripts
- Raised center Log action
- Recording → raw-audio draft → explicit Log Dream → transcribing → transcript review → saved
- Interactive monthly dream calendar and per-day detail
- Sleep, recording-duration, and recall summaries
- Profile/Home with Settings inside

## Verification

Run:

```bash
node validate-five-slot.cjs
node validate-balanced-spacing.cjs
node validate-world-palette.cjs
node validate-smooth-wheel.cjs
node validate-pwa.cjs
node validate-openwhispr-stt.cjs
node validate-stt-failure.cjs
node validate-journal-contract.cjs
node validate-journal-persistence.cjs
node validate-dark-mode.cjs
node validate-anarlog-title.cjs
node validate-tab-history-profile.cjs
node validate-voice-reactive.cjs
node validate-swipe-edit-delete.cjs
```

The tests verify the five-slot order, center plus treatment, tab routing, interactive Insights calendar and calculations, alarm creation, safe alarm-label rendering, smooth wheel behavior, and the full Log flow.
