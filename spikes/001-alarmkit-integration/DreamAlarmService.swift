import AlarmKit
import AppIntents
import Foundation
import SwiftUI

@available(iOS 26.0, *)
struct DreamAlarmMetadata: AlarmMetadata {
    let destination: String
}

@available(iOS 26.0, *)
public struct OpenDreamCaptureIntent: LiveActivityIntent {
    public static var title: LocalizedStringResource = "Record Dream"
    public static var description = IntentDescription("Opens Dreamworld directly into voice capture.")
    public static var openAppWhenRun = true

    @Parameter(title: "Alarm ID")
    public var alarmID: String

    public init(alarmID: String) {
        self.alarmID = alarmID
    }

    public init() {
        self.alarmID = ""
    }

    public func perform() async throws -> some IntentResult {
        // The app reads alarmID when it becomes active and routes to Capture.
        // Do not start the microphone while the app is closed.
        .result()
    }
}

@available(iOS 26.0, *)
@MainActor
final class DreamAlarmService: ObservableObject {
    enum DreamAlarmError: Error {
        case authorizationDenied
    }

    @Published private(set) var scheduledAlarms: [Alarm] = []

    private let manager = AlarmManager.shared
    private var updatesTask: Task<Void, Never>?

    init() {
        observeAlarmUpdates()
    }

    deinit {
        updatesTask?.cancel()
    }

    func requestAuthorization() async throws {
        let state = try await manager.requestAuthorization()
        guard state == .authorized else {
            throw DreamAlarmError.authorizationDenied
        }
    }

    @discardableResult
    func scheduleWakeAlarm(
        hour: Int,
        minute: Int,
        weekdays: Set<Locale.Weekday>
    ) async throws -> UUID {
        guard manager.authorizationState == .authorized else {
            try await requestAuthorization()
            return try await scheduleWakeAlarm(hour: hour, minute: minute, weekdays: weekdays)
        }

        typealias Configuration = AlarmManager.AlarmConfiguration<DreamAlarmMetadata>

        let id = UUID()
        let time = Alarm.Schedule.Relative.Time(hour: hour, minute: minute)
        let recurrence: Alarm.Schedule.Relative.Recurrence = weekdays.isEmpty
            ? .never
            : .weekly(Array(weekdays))
        let schedule: Alarm.Schedule = .relative(.init(time: time, repeats: recurrence))

        let recordButton = AlarmButton(
            text: "Record Dream",
            textColor: .white,
            systemImageName: "waveform.circle.fill"
        )

        let alert = AlarmPresentation.Alert(
            title: "Dreamworld",
            secondaryButton: recordButton,
            secondaryButtonBehavior: .custom
        )

        let attributes = AlarmAttributes<DreamAlarmMetadata>(
            presentation: AlarmPresentation(alert: alert),
            metadata: DreamAlarmMetadata(destination: "capture"),
            tintColor: Color(red: 0.56, green: 0.63, blue: 0.59)
        )

        let configuration = Configuration(
            countdownDuration: nil,
            schedule: schedule,
            attributes: attributes,
            secondaryIntent: OpenDreamCaptureIntent(alarmID: id.uuidString)
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
            }
        }
    }
}
