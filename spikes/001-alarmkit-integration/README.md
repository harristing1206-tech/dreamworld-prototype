# Spike 001 — Apple AlarmKit Integration

## Question

**Given** an iPhone running iOS 26 or later, **when** Dreamworld schedules a recurring wake alarm, **then** can the alarm use Apple’s system alarm experience and offer a direct path into dream capture?

## Result

## Verdict: PARTIAL

The platform path is validated from Apple’s current documentation and WWDC25 implementation examples. A compile-and-device test is blocked because Harris’s Mac currently has only the Command Line Tools and Swift 5.8; **Xcode 26 and the iOS 26 SDK are not installed**.

## What AlarmKit supports

- One-time alarms.
- Weekly repeating alarms.
- Alarms that override Focus and silent mode when necessary.
- Apple-managed alert presentation.
- Lock Screen, Dynamic Island, StandBy, and paired-watch presentation.
- System-provided Stop behavior.
- A custom secondary action that can open Dreamworld.
- App-owned alarm scheduling, cancellation, snoozing, and state observation.
- Custom alarm sounds.

## What it does not support

- Reading the user’s existing alarms from Apple’s Clock app.
- Editing or attaching actions to Clock-created alarms.
- Automatically beginning microphone recording while the app remains closed.
- Bypassing the one-time AlarmKit authorization prompt.
- Scheduling without `NSAlarmKitUsageDescription` in `Info.plist`.

Dreamworld therefore needs to become the place where the user creates the relevant wake alarm. The alarm remains system-presented, but Dreamworld owns its identifier and schedule.

## Proposed wake flow

1. The user creates a wake schedule inside Dreamworld.
2. Dreamworld requests AlarmKit authorization once.
3. Dreamworld schedules a one-time or weekly alarm with `AlarmManager`.
4. At wake time, Apple presents the system alarm even through Focus or silent mode.
5. The system UI provides:
   - **Stop** — Apple-managed dismissal.
   - **Record Dream** — custom AlarmKit action.
6. **Record Dream** opens Dreamworld into the capture route.
7. Dreamworld requests or uses existing microphone permission and starts capture only after an explicit foreground action.
8. Raw audio is saved locally before transcription or interpretation.

## Product recommendation

Use **Stop** and **Record Dream**, not a forced automatic launch. A forced transition from a ringing alarm into an active microphone would be surprising, brittle, and privacy-hostile—especially in shared bedrooms. The custom action gives the user control while reducing the wake-to-capture path to one deliberate tap.

For users who press Stop first, Dreamworld should preserve a short, optional follow-up path from the Lock Screen or a notification, but it must never shame the user or imply that stopping the alarm deleted a dream.

## Implementation artifacts

- `DreamAlarmService.swift` — AlarmKit authorization, repeating schedule, system presentation, app-opening intent, state stream, and cancellation.
- `Info.plist.fragment.xml` — required AlarmKit permission description.

## Required next step

1. Install **Xcode 26** on Harris’s Mac.
2. Confirm the test iPhone runs **iOS 26 or later**.
3. Create a native iOS Dreamworld target.
4. Add `NSAlarmKitUsageDescription`.
5. Add the spike files to the target.
6. Run a physical-device test with an alarm two minutes in the future.
7. Verify behavior in:
   - Silent mode
   - Focus mode
   - Locked screen
   - App terminated
   - Apple Watch paired, if available
   - Stop path
   - Record Dream path

## Primary Apple sources

- [AlarmKit framework](https://developer.apple.com/documentation/alarmkit)
- [Scheduling an alarm with AlarmKit](https://developer.apple.com/documentation/alarmkit/scheduling-an-alarm-with-alarmkit)
- [WWDC25: Wake up to the AlarmKit API](https://developer.apple.com/videos/play/wwdc2025/230/)

Apple’s current documentation states that AlarmKit is available on iOS 26+, supports one-time and repeating alarms, and that alarms can override Focus and silent mode. It also documents custom secondary actions through App Intents and app-owned alarm identifiers.
