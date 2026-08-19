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
    case alarms
    case settings
}

public enum AppDeepLink {
    public static func destination(for url: URL) -> AppTab? {
        guard url.scheme?.lowercased() == "dreamworld" else { return nil }
        guard url.host?.lowercased() == "capture" else { return nil }
        return .capture
    }
}

public enum CaptureLaunchRequest {
    public static let userDefaultsKey = "dreamworld.openCapture"
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

public enum CapturePhase: Equatable, Sendable {
    case ready
    case recording
    case saving
    case savedDraft(audioURL: URL)
    case transcribing(audioURL: URL)
    case transcriptReady(audioURL: URL, text: String)
    case transcriptionFailed(audioURL: URL, message: String)
    case logged(audioURL: URL, text: String)
}

public struct TranscriptionProvenance: Equatable, Sendable {
    public enum Processing: String, Equatable, Sendable {
        case onDevice
        case cloud
    }

    public let provider: String
    public let model: String
    public let processing: Processing

    public init(provider: String, model: String, processing: Processing) {
        self.provider = provider
        self.model = model
        self.processing = processing
    }
}

public struct CaptureSessionState: Equatable, Sendable {
    public private(set) var phase: CapturePhase = .ready
    public private(set) var transcriptProvenance: TranscriptionProvenance?

    public init() {}

    public mutating func beginRecording() {
        transcriptProvenance = nil
        phase = .recording
    }

    public mutating func stopRequested() {
        phase = .saving
    }

    public mutating func recordingSaved(at audioURL: URL) {
        transcriptProvenance = nil
        phase = .savedDraft(audioURL: audioURL)
    }

    @discardableResult
    public mutating func logDream() -> Bool {
        guard case .savedDraft(let audioURL) = phase else { return false }
        phase = .transcribing(audioURL: audioURL)
        return true
    }

    @discardableResult
    public mutating func retryTranscription() -> Bool {
        guard case .transcriptionFailed(let audioURL, _) = phase else { return false }
        phase = .transcribing(audioURL: audioURL)
        return true
    }

    public mutating func transcriptionSucceeded(
        text: String,
        provenance: TranscriptionProvenance? = nil
    ) {
        guard case .transcribing(let audioURL) = phase else { return }
        transcriptProvenance = provenance
        phase = .transcriptReady(audioURL: audioURL, text: text)
    }

    public mutating func transcriptionFailed(message: String) {
        guard case .transcribing(let audioURL) = phase else { return }
        phase = .transcriptionFailed(audioURL: audioURL, message: message)
    }

    @discardableResult
    public mutating func finishDialogue() -> Bool {
        guard case .transcriptReady(let audioURL, let text) = phase else { return false }
        phase = .logged(audioURL: audioURL, text: text)
        return true
    }
}
