import AppIntents
import DreamworldCore
import Foundation

struct OpenDreamCaptureIntent: LiveActivityIntent {
    static let title: LocalizedStringResource = "Capture Dream"
    static let description = IntentDescription("Opens Dreamworld directly to voice capture.")
    static let supportedModes: IntentModes = [.foreground(.immediate)]

    @Parameter(title: "Alarm ID")
    var alarmID: String

    init(alarmID: String) {
        self.alarmID = alarmID
    }

    init() {
        alarmID = ""
    }

    @MainActor
    func perform() async throws -> some IntentResult {
        UserDefaults.standard.set(true, forKey: CaptureLaunchRequest.userDefaultsKey)
        return .result()
    }
}

struct DreamworldAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: OpenDreamCaptureIntent(),
            phrases: [
                "Capture a dream in \(.applicationName)",
                "Record my dream in \(.applicationName)",
                "Open dream capture in \(.applicationName)"
            ],
            shortTitle: "Capture Dream",
            systemImageName: "waveform.circle.fill"
        )
    }
}
