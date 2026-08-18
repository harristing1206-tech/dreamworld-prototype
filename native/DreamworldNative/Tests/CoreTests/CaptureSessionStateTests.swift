import DreamworldCore
import Foundation
import XCTest

final class CaptureSessionStateTests: XCTestCase {
    func testSavedRecordingWaitsForExplicitLogDecision() {
        let audioURL = URL(fileURLWithPath: "/tmp/dream.m4a")
        var session = CaptureSessionState()

        session.beginRecording()
        session.stopRequested()
        session.recordingSaved(at: audioURL)

        XCTAssertEqual(session.phase, .savedDraft(audioURL: audioURL))
    }

    func testLogDreamBeginsTranscriptionForSavedDraft() {
        let audioURL = URL(fileURLWithPath: "/tmp/dream.m4a")
        var session = CaptureSessionState()
        session.recordingSaved(at: audioURL)

        XCTAssertTrue(session.logDream())
        XCTAssertEqual(session.phase, .transcribing(audioURL: audioURL))
    }

    func testLogDreamCanBeginOnlyOnce() {
        let audioURL = URL(fileURLWithPath: "/tmp/dream.m4a")
        var session = CaptureSessionState()
        session.recordingSaved(at: audioURL)

        XCTAssertTrue(session.logDream())
        XCTAssertFalse(session.logDream())
        XCTAssertEqual(session.phase, .transcribing(audioURL: audioURL))
    }

    func testSuccessfulTranscriptionPreservesAudioAndTranscript() {
        let audioURL = URL(fileURLWithPath: "/tmp/dream.m4a")
        var session = CaptureSessionState()
        session.recordingSaved(at: audioURL)
        XCTAssertTrue(session.logDream())

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
        XCTAssertTrue(session.logDream())

        session.transcriptionFailed(message: "The language model could not be loaded.")

        XCTAssertEqual(
            session.phase,
            .transcriptionFailed(
                audioURL: audioURL,
                message: "The language model could not be loaded."
            )
        )
    }

    func testRetryRestartsFailedTranscriptionInSameSession() {
        let audioURL = URL(fileURLWithPath: "/tmp/dream.m4a")
        var session = CaptureSessionState()
        session.recordingSaved(at: audioURL)
        XCTAssertTrue(session.logDream())
        session.transcriptionFailed(message: "The language model could not be loaded.")

        XCTAssertTrue(session.retryTranscription())
        XCTAssertFalse(session.retryTranscription())
        XCTAssertEqual(session.phase, .transcribing(audioURL: audioURL))
    }

    func testFinishedDialogueCannotBePresentedAgainForSameDream() {
        let audioURL = URL(fileURLWithPath: "/tmp/dream.m4a")
        var session = CaptureSessionState()
        session.recordingSaved(at: audioURL)
        XCTAssertTrue(session.logDream())
        session.transcriptionSucceeded(text: "I crossed a quiet field.")

        XCTAssertTrue(session.finishDialogue())
        XCTAssertFalse(session.finishDialogue())
        XCTAssertEqual(
            session.phase,
            .logged(audioURL: audioURL, text: "I crossed a quiet field.")
        )
    }
}
