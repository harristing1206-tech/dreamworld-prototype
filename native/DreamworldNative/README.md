# Dreamworld Native — AlarmKit Wake & Capture

A native iOS 26.1+ proof of concept where Dreamworld owns wake alarms, presents them through Apple’s AlarmKit system experience, and opens voice capture only after the user stops the alarm.

## Product flow

1. The user opens the **Alarms** tab.
2. They choose a time and optional repeat weekdays, then tap **Add Alarm**.
3. Dreamworld requests AlarmKit authorization the first time and schedules a Dreamworld-owned system alarm.
4. When it fires, iOS presents Apple’s system alarm surface with Dreamworld branding, **Snooze**, and the system stop control.
5. Snooze starts a nine-minute countdown. Stopping the alarm opens the Capture tab, ready for an explicit microphone tap.
6. The user speaks and stops. Dreamworld saves a local `.m4a` recording but does not transcribe it yet.
7. The user explicitly chooses **Log dream**. Only then does the one-time dialogue transcription scene open and Apple Speech begin on-device analysis.

Multiple alarms are supported. The Alarms tab reads the current AlarmKit schedule directly, so scheduled times and recurrence remain visible after relaunch.

## Local speech-to-text

Dreamworld uses Apple’s iOS 26 Speech framework. After a recording is saved **and the user chooses Log dream**, `SpeechAnalyzer` reads the preserved `.m4a` and `SpeechTranscriber` performs general-purpose transcription with a system-managed locale asset. If the newer transcriber does not support the current locale/device, Dreamworld falls back to `DictationTranscriber` with the long-dictation preset.

Capture keeps these states distinct: **Recording → Saving locally → Saved draft → Transcribing locally → Initial transcript → Logged**. Saving never starts speech analysis. The explicit Log dream transition is idempotent, so repeated taps cannot create duplicate transcription jobs. The raw audio remains in Dreamworld’s documents directory when transcription succeeds or fails, and a failed transcription creates fresh Apple Speech objects against the same recording on retry.

The first use of a locale may download a speech asset from Apple. `AssetInventory` installs and retains that system-managed model; the recorded dream itself is not uploaded for transcription. The dialogue stores and displays provider, engine/locale, and on-device provenance with the initial transcript.

## Dialogue transcription scene

The transcription surface uses an original video-game dialogue composition inspired by—not copied from—the supplied RPG references. Two anonymous pixel silhouettes establish the interaction before final character artwork is chosen: the user’s dreamer faces a listening Dreamworld presence in a quiet night clearing, while a bordered dialogue panel attributes the eventual transcript to **YOU · DREAM LOG**.

During processing, the scene shows only truthful operational language: **Listening back**, **Raw audio safe**, **Apple Speech · On device**, and **Transcribing on this device**. It does not fabricate partial words or imply that the mascot understands the dream. Apple Speech’s finalized result appears together when ready. Finishing the dialogue advances the capture session to a terminal Logged phase, so the same dialogue is not presented again for that recording. Reduced Motion disables the ambient character and listening loops.

## Ringing presentation and slide behavior

AlarmKit is the supported way for an App Store app to deliver a true system alarm that can break through silent mode and Focus after authorization. Apple owns the locked-screen alarm surface and its controls; AlarmKit does not expose an arbitrary custom swipe control there.

Dreamworld therefore includes a separate **Preview Ringing Screen** in the Alarms tab. It demonstrates the requested iOS-familiar visual hierarchy, **Snooze** action, and a 92%-threshold **Slide to Stop** gesture inside the app. Crossing the threshold only arms the action; stopping commits when the user lifts their finger. A valid release fades into Capture, while Snooze fades back to Alarms. This prototype does not claim to replace Apple’s locked-screen controls.

## Why recording does not begin silently

An alarm can open Capture, but opening the app is not equivalent to explicit microphone consent. Recording begins only after a clearly labeled microphone action. This avoids unexpected bedroom recording and preserves predictable iOS privacy behavior.

## App navigation

- **World** — the evolving dream world
- **Capture** — voice-first dream capture
- **Alarms** — add, review, preview, and cancel Dreamworld alarms
- **Settings** — AlarmKit presentation and capture preferences

The web prototype also retains **Dreams** as a separate history destination.

## Requirements

- macOS 26.2+
- Xcode 26.6+
- iOS 26.1+ deployment target
- XcodeGen 2.46+

## Generate and build

```bash
xcodegen generate
xcodebuild \
  -project DreamworldNative.xcodeproj \
  -scheme Dreamworld \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO \
  clean build
```

## Tests

```bash
xcodebuild \
  -project DreamworldNative.xcodeproj \
  -scheme Dreamworld \
  -destination 'platform=iOS Simulator,name=iPhone 17,OS=26.5' \
  CODE_SIGNING_ALLOWED=NO \
  test
```

Core tests cover:

- Alarm actions and `dreamworld://capture` routing
- Wake-time validation
- Local `.m4a` recording paths
- Unique recording filenames
- Saved-draft behavior before explicit logging
- One-time, idempotent Log dream transition
- Same-scene retry and one-time dialogue completion

## Physical iPhone acceptance test

1. Select a development team and install Dreamworld on an iOS 26.1+ iPhone.
2. Open **Alarms**, choose a time two minutes ahead, and tap **Add Alarm**.
3. Approve Dreamworld alarm access.
4. Confirm the new time appears under Active Dreamworld alarms.
5. Lock the phone and let the alarm fire.
6. Confirm Apple’s system alarm presentation displays Dreamworld, **Snooze**, and the system stop control.
7. Stop the alarm and confirm Dreamworld opens Capture only after the stop action completes.
8. Tap the microphone, speak, stop, and confirm the local saved-draft indicator appears without transcription starting.
9. Tap **Log dream** and confirm the dialogue transcription scene opens once, shows local-processing status, and eventually presents the transcript.
10. Finish logging, return to Capture, and confirm the same dialogue does not reopen for that recording.
11. Separately open **Preview Ringing Screen** and confirm Slide to Stop commits only when the finger is lifted beyond the threshold; releasing early resets it.
