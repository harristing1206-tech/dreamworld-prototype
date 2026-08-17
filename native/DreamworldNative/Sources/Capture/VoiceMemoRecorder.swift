import AVFoundation
import DreamworldCore
import Foundation

@MainActor
final class VoiceMemoRecorder: NSObject, ObservableObject, @preconcurrency AVAudioRecorderDelegate {
    enum RecorderError: LocalizedError {
        case microphoneDenied
        case recordingsDirectoryUnavailable

        var errorDescription: String? {
            switch self {
            case .microphoneDenied:
                return "Microphone access is required to record a dream."
            case .recordingsDirectoryUnavailable:
                return "Dreamworld could not prepare local recording storage."
            }
        }
    }

    @Published private(set) var isRecording = false
    @Published private(set) var lastRecordingURL: URL?
    @Published private(set) var startedAt: Date?
    @Published var errorMessage: String?

    private var recorder: AVAudioRecorder?

    func start() async {
        do {
            guard await requestMicrophonePermission() else {
                throw RecorderError.microphoneDenied
            }

            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .spokenAudio, options: [.defaultToSpeaker, .allowBluetoothHFP])
            try session.setActive(true)

            let directory = try recordingsDirectory()
            let outputURL = VoiceMemoPathFactory(directory: directory).newRecordingURL()
            let settings: [String: Any] = [
                AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
                AVSampleRateKey: 44_100,
                AVNumberOfChannelsKey: 1,
                AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
            ]

            let recorder = try AVAudioRecorder(url: outputURL, settings: settings)
            recorder.delegate = self
            recorder.isMeteringEnabled = true
            guard recorder.record() else {
                throw RecorderError.recordingsDirectoryUnavailable
            }

            self.recorder = recorder
            startedAt = Date()
            isRecording = true
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func stop() {
        guard let recorder else { return }
        recorder.stop()
        lastRecordingURL = recorder.url
        self.recorder = nil
        startedAt = nil
        isRecording = false
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
        isRecording = false
        startedAt = nil
        if flag {
            lastRecordingURL = recorder.url
        } else {
            errorMessage = "The recording ended before it could be saved."
        }
        self.recorder = nil
    }

    private func requestMicrophonePermission() async -> Bool {
        await withCheckedContinuation { continuation in
            AVAudioApplication.requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
    }

    private func recordingsDirectory() throws -> URL {
        guard let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
            throw RecorderError.recordingsDirectoryUnavailable
        }
        let directory = documents.appendingPathComponent("Dream Recordings", isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory
    }
}
