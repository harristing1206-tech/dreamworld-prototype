import Foundation
import WhisperKit

protocol DreamTranscribing: Sendable {
    func transcribe(recordingAt audioURL: URL) async throws -> String
}

actor WhisperDreamTranscriber: DreamTranscribing {
    enum TranscriptionError: LocalizedError {
        case emptyTranscript

        var errorDescription: String? {
            switch self {
            case .emptyTranscript:
                return "Dreamworld could not hear enough speech to create a transcript. Your recording is still saved locally."
            }
        }
    }

    private var engine: WhisperKit?

    func transcribe(recordingAt audioURL: URL) async throws -> String {
        let engine = try await preparedEngine()
        let results = try await engine.transcribe(audioPath: audioURL.path)
        let transcript = results
            .map(\.text)
            .joined(separator: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard !transcript.isEmpty else {
            throw TranscriptionError.emptyTranscript
        }
        return transcript
    }

    private func preparedEngine() async throws -> WhisperKit {
        if let engine {
            return engine
        }
        let configuration = WhisperKitConfig(model: "base")
        let engine = try await WhisperKit(configuration)
        self.engine = engine
        return engine
    }
}
