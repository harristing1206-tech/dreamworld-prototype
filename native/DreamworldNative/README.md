# Dreamworld Native — Wake & Capture

A native iOS 26.1+ proof of concept connecting Dreamworld to Apple’s system alarm experience through AlarmKit.

## Product flow

1. Choose a wake time and optional repeating weekdays in the Alarm tab.
2. Grant Dreamworld alarm permission.
3. Dreamworld schedules an app-owned Apple system alarm.
4. When it rings, choose Apple’s **Stop** action or Dreamworld’s **Record Dream** action.
5. **Record Dream** opens the Capture tab.
6. Tap the microphone to begin recording; tap Stop to save a local `.m4a` file.

Recording never starts merely because an alarm fired. The explicit microphone tap is intentional for privacy, shared-bedroom safety, and predictable iOS permission behavior.

## Apple limitation

AlarmKit lets Dreamworld create and manage Dreamworld-owned alarms displayed by iOS. Apple does not expose the built-in Clock app’s alarm database, so Dreamworld cannot attach to or edit alarms the user previously created in Clock.

## Requirements

- macOS 26.2+
- Xcode 26.6+
- iOS 26.1+ deployment target
- Physical iPhone on iOS 26.1+ for system alarm verification
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

The platform-independent core can be tested directly:

```bash
swift test
```

Or through the generated Xcode project with an available simulator:

```bash
xcodebuild \
  -project DreamworldNative.xcodeproj \
  -scheme Dreamworld \
  -destination 'platform=iOS Simulator,name=iPhone 17,OS=26.5' \
  CODE_SIGNING_ALLOWED=NO \
  test
```

Core tests cover:

- Wake-time validation
- One-time versus weekly recurrence
- Alarm action routing into Capture
- Local `.m4a` recording paths
- Unique recording filenames

## Physical iPhone acceptance test

1. Select the project’s Dreamworld app target in Xcode.
2. Choose the development team used to sign the app.
3. Connect an iPhone running iOS 26.1 or newer.
4. Build and run Dreamworld on the iPhone.
5. In Alarm, schedule an alarm two minutes ahead with no weekdays selected.
6. Lock the phone and enable silent mode or Focus.
7. Confirm the system alarm appears and sounds.
8. Tap **Record Dream**.
9. Confirm Dreamworld opens to Capture without starting the microphone automatically.
10. Tap the microphone, speak, stop, and confirm the `.m4a` save indicator appears.
11. Repeat once with a weekly schedule and cancel it from Dreamworld.
