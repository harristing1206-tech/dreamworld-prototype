@preconcurrency import AlarmKit
import Foundation
import SwiftUI

struct DreamAlarmMetadata: AlarmMetadata {
    let destination: String
}

@MainActor
final class DreamAlarmService: ObservableObject {
    enum ServiceError: LocalizedError {
        case authorizationDenied

        var errorDescription: String? {
            "Alarm permission is required to schedule a Dreamworld wake alarm."
        }
    }

    @Published private(set) var scheduledAlarms: [Alarm] = []
    @Published private(set) var authorizationState = AlarmManager.shared.authorizationState

    private let manager = AlarmManager.shared
    private var updatesTask: Task<Void, Never>?

    init() {
        scheduledAlarms = (try? manager.alarms) ?? []
        observeAlarmUpdates()
    }

    deinit {
        updatesTask?.cancel()
    }

    func requestAuthorization() async throws {
        let state = try await manager.requestAuthorization()
        authorizationState = state
        guard state == .authorized else {
            throw ServiceError.authorizationDenied
        }
    }

    @discardableResult
    func scheduleWakeAlarm(
        hour: Int,
        minute: Int,
        weekdays: Set<Locale.Weekday>
    ) async throws -> UUID {
        if manager.authorizationState != .authorized {
            try await requestAuthorization()
        }

        let id = UUID()
        let time = Alarm.Schedule.Relative.Time(hour: hour, minute: minute)
        let recurrence: Alarm.Schedule.Relative.Recurrence = weekdays.isEmpty
            ? .never
            : .weekly(Array(weekdays))
        let schedule: Alarm.Schedule = .relative(.init(time: time, repeats: recurrence))

        let snoozeButton = AlarmButton(
            text: "Snooze",
            textColor: .white,
            systemImageName: "zzz"
        )
        let alert = AlarmPresentation.Alert(
            title: "Dreamworld",
            secondaryButton: snoozeButton,
            secondaryButtonBehavior: .countdown
        )
        let presentation = AlarmPresentation(
            alert: alert,
            countdown: AlarmPresentation.Countdown(title: "Snoozed")
        )
        let attributes = AlarmAttributes<DreamAlarmMetadata>(
            presentation: presentation,
            metadata: DreamAlarmMetadata(destination: "capture"),
            tintColor: Color(red: 0.58, green: 0.68, blue: 0.63)
        )
        let configuration = AlarmManager.AlarmConfiguration<DreamAlarmMetadata>(
            countdownDuration: Alarm.CountdownDuration(preAlert: nil, postAlert: 9 * 60),
            schedule: schedule,
            attributes: attributes,
            stopIntent: OpenDreamCaptureIntent(alarmID: id.uuidString)
        )

        _ = try await manager.schedule(id: id, configuration: configuration)
        return id
    }

    func cancelAlarm(id: UUID) throws {
        try manager.cancel(id: id)
    }

    private func observeAlarmUpdates() {
        updatesTask = Task { [weak self] in
            guard let self else { return }
            for await alarms in manager.alarmUpdates {
                guard !Task.isCancelled else { return }
                scheduledAlarms = alarms
                authorizationState = manager.authorizationState
            }
        }
    }
}
