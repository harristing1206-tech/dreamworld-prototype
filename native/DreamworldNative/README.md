# Dreamworld Native — AlarmKit Wake & Capture

A native iOS 26.1+ proof of concept where Dreamworld owns wake alarms, presents them through Apple’s AlarmKit system experience, and routes the **Record Dream** action directly to voice capture.

## Product flow

1. The user opens the **Alarms** tab.
2. They choose a time and optional repeat weekdays, then tap **Add Alarm**.
3. Dreamworld requests AlarmKit authorization the first time and schedules a Dreamworld-owned system alarm.
4. When it fires, iOS presents Apple’s system alarm surface with Dreamworld branding and a **Record Dream** secondary action.
5. Record Dream opens the Capture tab, ready for an explicit microphone tap.
6. The user speaks, stops, and saves a local `.m4a` voice memo.

Multiple alarms are supported. The Alarms tab reads the current AlarmKit schedule directly, so scheduled times and recurrence remain visible after relaunch.

## Ringing presentation and slide behavior

AlarmKit is the supported way for an App Store app to deliver a true system alarm that can break through silent mode and Focus after authorization. Apple owns the locked-screen alarm surface and its controls; AlarmKit does not expose an arbitrary custom swipe control there.

Dreamworld therefore includes a separate **Preview Ringing Screen** in the Alarms tab. It demonstrates the requested iOS-familiar visual hierarchy, **Record Dream** action, and a 92%-threshold **Slide to Stop** gesture inside the app. This prototype does not claim to replace Apple’s locked-screen controls.

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

## Physical iPhone acceptance test

1. Select a development team and install Dreamworld on an iOS 26.1+ iPhone.
2. Open **Alarms**, choose a time two minutes ahead, and tap **Add Alarm**.
3. Approve Dreamworld alarm access.
4. Confirm the new time appears under Active Dreamworld alarms.
5. Lock the phone and let the alarm fire.
6. Confirm Apple’s system alarm presentation displays Dreamworld and **Record Dream**.
7. Tap Record Dream and confirm Dreamworld opens Capture.
8. Tap the microphone, speak, stop, and confirm the local save indicator appears.
9. Separately open **Preview Ringing Screen** and confirm Slide to Stop dismisses only after crossing the threshold.
