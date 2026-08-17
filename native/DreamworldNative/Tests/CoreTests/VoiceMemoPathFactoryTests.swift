import XCTest
@testable import DreamworldCore

final class VoiceMemoPathFactoryTests: XCTestCase {
    func testNewRecordingUsesM4AExtensionInsideProvidedDirectory() {
        let directory = URL(fileURLWithPath: "/tmp/dreamworld-test", isDirectory: true)
        let factory = VoiceMemoPathFactory(directory: directory, now: { Date(timeIntervalSince1970: 1_700_000_000) })
        let result = factory.newRecordingURL()

        XCTAssertEqual(result.deletingLastPathComponent(), directory)
        XCTAssertEqual(result.pathExtension, "m4a")
    }

    func testConsecutiveRecordingsReceiveDistinctNames() {
        let directory = URL(fileURLWithPath: "/tmp/dreamworld-test", isDirectory: true)
        let factory = VoiceMemoPathFactory(directory: directory)
        XCTAssertNotEqual(factory.newRecordingURL(), factory.newRecordingURL())
    }
}
