import AVFoundation
import DreamworldCore
import Foundation
import Speech

struct DreamTranscription: Sendable {
    let text: String
    let provenance: TranscriptionProvenance
}

protocol DreamTranscribing: Sendable {
    func transcribe(recordingAt audioURL: URL) async throws -> DreamTranscription
}

actor AppleSpeechDreamTranscriber: DreamTranscribing {
    enum TranscriptionError: LocalizedError {
        case unsupportedLocale
        case emptyTranscript
        case noAudioSamples

        var errorDescription: String? {
            switch self {
            case .unsupportedLocale:
                return "Apple Speech does not currently support this device language. Your recording is still saved locally."
            case .emptyTranscript, .noAudioSamples:
                return "Dreamworld could not hear enough speech to create a transcript. Your recording is still saved locally."
            }
        }
    }

    func transcribe(recordingAt audioURL: URL) async throws -> DreamTranscription {
        if let locale = await SpeechTranscriber.supportedLocale(equivalentTo: .current) {
            return try await transcribeWithSpeechTranscriber(audioURL: audioURL, locale: locale)
        }
        if let locale = await DictationTranscriber.supportedLocale(equivalentTo: .current) {
            return try await transcribeWithDictationTranscriber(audioURL: audioURL, locale: locale)
        }
        throw TranscriptionError.unsupportedLocale
    }

    private func transcribeWithSpeechTranscriber(
        audioURL: URL,
        locale: Locale
    ) async throws -> DreamTranscription {
        let transcriber = SpeechTranscriber(locale: locale, preset: .transcription)
        if let installation = try await AssetInventory.assetInstallationRequest(supporting: [transcriber]) {
            try await installation.downloadAndInstall()
        }

        let audioFile = try AVAudioFile(forReading: audioURL)
        let analyzer = SpeechAnalyzer(modules: [transcriber])
        async let attributedTranscript: AttributedString = transcriber.results.reduce(into: AttributedString()) {
            transcript, result in
            if result.isFinal { transcript.append(result.text) }
        }

        do {
            guard let lastSampleTime = try await analyzer.analyzeSequence(from: audioFile) else {
                await analyzer.cancelAndFinishNow()
                _ = try await attributedTranscript
                throw TranscriptionError.noAudioSamples
            }
            try await analyzer.finalizeAndFinish(through: lastSampleTime)
            let transcript = try await attributedTranscript
            return try makeResult(
                text: String(transcript.characters),
                locale: locale,
                model: "SpeechTranscriber"
            )
        } catch {
            await analyzer.cancelAndFinishNow()
            _ = try? await attributedTranscript
            throw error
        }
    }

    private func transcribeWithDictationTranscriber(
        audioURL: URL,
        locale: Locale
    ) async throws -> DreamTranscription {
        let transcriber = DictationTranscriber(locale: locale, preset: .longDictation)
        if let installation = try await AssetInventory.assetInstallationRequest(supporting: [transcriber]) {
            try await installation.downloadAndInstall()
        }

        let audioFile = try AVAudioFile(forReading: audioURL)
        let analyzer = SpeechAnalyzer(modules: [transcriber])
        async let attributedTranscript: AttributedString = transcriber.results.reduce(into: AttributedString()) {
            transcript, result in
            if result.isFinal { transcript.append(result.text) }
        }

        do {
            guard let lastSampleTime = try await analyzer.analyzeSequence(from: audioFile) else {
                await analyzer.cancelAndFinishNow()
                _ = try await attributedTranscript
                throw TranscriptionError.noAudioSamples
            }
            try await analyzer.finalizeAndFinish(through: lastSampleTime)
            let transcript = try await attributedTranscript
            return try makeResult(
                text: String(transcript.characters),
                locale: locale,
                model: "System Dictation fallback"
            )
        } catch {
            await analyzer.cancelAndFinishNow()
            _ = try? await attributedTranscript
            throw error
        }
    }

    private func makeResult(
        text: String,
        locale: Locale,
        model: String
    ) throws -> DreamTranscription {
        let normalized = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalized.isEmpty else { throw TranscriptionError.emptyTranscript }
        return DreamTranscription(
            text: normalized,
            provenance: TranscriptionProvenance(
                provider: "Apple Speech",
                model: "\(model) · \(locale.identifier(.bcp47))",
                processing: .onDevice
            )
        )
    }
}
