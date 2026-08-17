# Dreamworld Native — Existing Alarm Handoff

A native iOS 26.1+ proof of concept that opens Dreamworld Capture from a user-controlled iOS alarm automation without adding an alarm-management destination to Dreamworld.

## Product flow

1. The user keeps their existing alarm in Apple Clock.
2. Dreamworld automatically registers a **Capture Dream** App Shortcut at install time.
3. Once, the user creates a Personal Automation in Shortcuts:
   - Trigger: **Alarm → Is Stopped → Any**
   - Run immediately
   - Action: Dreamworld's ready-made **Capture Dream** action
4. Optional: repeat the automation with **Is Snoozed → Any**. Apple treats Stopped and Snoozed as separate triggers.
5. When the configured alarm action occurs, iOS runs Capture Dream and opens Dreamworld directly to Capture.
6. Capture is immediately ready for speech.
7. The user taps the prominent microphone control, speaks, and stops to save a local `.m4a` file.

Dreamworld does not ask users to predict which morning will contain a remembered dream, and it does not create or replace their alarm.

## Why recording does not begin silently

An alarm-triggered automation can open Capture, but opening the app is not equivalent to explicit microphone consent. Dreamworld begins recording only after a clearly labeled **Record Dream** or microphone action. This avoids unexpected recording in shared bedrooms and preserves predictable iOS privacy behavior.

## Apple boundary

Apple does not expose the Clock app's alarm database to third-party apps. Dreamworld therefore cannot silently install the alarm-trigger relationship itself. The **Capture Dream** App Shortcut is registered automatically for every install, but iOS requires the user to create and approve the Personal Automation trigger once. The app also retains `dreamworld://capture` as a direct fallback route.

The earlier AlarmKit scheduling experiment remains under `Sources/Alarm/` for reference, but it is not part of the application target or primary navigation.

## App navigation

- **World** — the evolving dream world
- **Capture** — voice-first dream capture
- **Settings** — existing-alarm handoff instructions and capture preferences

There is intentionally no Alarm tab.

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

- Valid and invalid `dreamworld://capture` routing
- Alarm-action routing retained for the archived AlarmKit experiment
- Wake-time validation retained for the archived experiment
- Local `.m4a` recording paths
- Unique recording filenames

## Physical iPhone acceptance test

1. Select a development team and install Dreamworld on an iPhone.
2. Open Shortcuts and confirm Dreamworld's **Capture Dream** action is available without importing a shortcut.
3. Run Capture Dream and confirm the app opens directly to Capture.
4. Create a Personal Automation for **Alarm → Is Stopped → Any**.
5. Set it to run immediately and choose **Capture Dream** as the action.
6. Optional: create a second automation for **Is Snoozed → Any**.
7. Set any existing Clock alarm two minutes ahead.
8. Lock the phone and let the alarm fire.
9. Stop the alarm.
10. Confirm Dreamworld opens directly to Capture.
11. Tap the microphone, speak, stop, and confirm the local save indicator appears.
