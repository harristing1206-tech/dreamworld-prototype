import Foundation

public enum DreamWeekday: Int, CaseIterable, Hashable, Sendable {
    case sunday = 1
    case monday
    case tuesday
    case wednesday
    case thursday
    case friday
    case saturday
}

public enum WakeScheduleError: Error, Equatable {
    case invalidHour(Int)
    case invalidMinute(Int)
}

public struct WakeSchedule: Equatable, Sendable {
    public let hour: Int
    public let minute: Int
    public let weekdays: Set<DreamWeekday>

    public init(hour: Int, minute: Int, weekdays: Set<DreamWeekday>) throws {
        guard (0...23).contains(hour) else {
            throw WakeScheduleError.invalidHour(hour)
        }
        guard (0...59).contains(minute) else {
            throw WakeScheduleError.invalidMinute(minute)
        }

        self.hour = hour
        self.minute = minute
        self.weekdays = weekdays
    }

    public var repeats: Bool {
        !weekdays.isEmpty
    }
}

public enum AppTab: Equatable, Sendable {
    case world
    case capture
    case alarm
}

public enum AlarmAction: Equatable, Sendable {
    case recordDream
}

public struct AppRouteState: Equatable, Sendable {
    public var selectedTab: AppTab

    public init(selectedTab: AppTab = .world) {
        self.selectedTab = selectedTab
    }

    public mutating func handleAlarmAction(_ action: AlarmAction?) {
        if action == .recordDream {
            selectedTab = .capture
        }
    }
}

public struct VoiceMemoPathFactory: Sendable {
    private let directory: URL
    private let now: @Sendable () -> Date
    private let makeID: @Sendable () -> UUID

    public init(
        directory: URL,
        now: @escaping @Sendable () -> Date = { Date() },
        makeID: @escaping @Sendable () -> UUID = { UUID() }
    ) {
        self.directory = directory
        self.now = now
        self.makeID = makeID
    }

    public func newRecordingURL() -> URL {
        let milliseconds = Int(now().timeIntervalSince1970 * 1_000)
        let filename = "dream-\(milliseconds)-\(makeID().uuidString).m4a"
        return directory.appendingPathComponent(filename, isDirectory: false)
    }
}
