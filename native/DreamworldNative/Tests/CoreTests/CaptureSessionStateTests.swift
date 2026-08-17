import DreamworldCore
import Foundation
import XCTest

final class CaptureSessionStateTests: XCTestCase {
    func testSavedRecordingBeginsTranscriptionForThatAudioFile() {
        let audioURL = URL(fileURLWithPath: "/tmp/dream.m4a")
        var session = CaptureSessionState()

        session.beginRecording()
        session.stopRequested()
        session.recordingSaved(at: audioURL)

        XCTAssertEqual(session.phase, .transcribing(audioURL: audioURL))
    }

    func testSuccessfulTranscriptionPreservesAudioAndTranscript() {
        let audioURL = URL(fileURLWithPath: "/tmp/dream.m4a")
        var session = CaptureSessionState()
        session.recordingSaved(at: audioURL)

        session.transcriptionSucceeded(text: "I was walking beside a dark lake.")

        XCTAssertEqual(
            session.phase,
            .transcriptReady(
                audioURL: audioURL,
                text: "I was walking beside a dark lake."
            )
        )
    }

    func testFailedTranscriptionKeepsAudioAvailableForRetry() {
        let audioURL = URL(fileURLWithPath: "/tmp/dream.m4a")
        var session = CaptureSessionState()
        session.recordingSaved(at: audioURL)

        session.transcriptionFailed(message: "The language model could not be loaded.")

        XCTAssertEqual(
            session.phase,
            .transcriptionFailed(
                audioURL: audioURL,
                message: "The language model could not be loaded."
            )
        )
    }
}
