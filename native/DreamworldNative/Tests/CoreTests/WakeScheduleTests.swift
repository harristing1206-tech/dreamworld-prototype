import XCTest
@testable import DreamworldCore

final class WakeScheduleTests: XCTestCase {
    func testEmptyWeekdaysProducesOneTimeSchedule() throws {
        let schedule = try WakeSchedule(hour: 7, minute: 30, weekdays: [])
        XCTAssertFalse(schedule.repeats)
    }

    func testSelectedWeekdaysProducesRepeatingSchedule() throws {
        let schedule = try WakeSchedule(hour: 7, minute: 30, weekdays: [.monday, .wednesday, .friday])
        XCTAssertTrue(schedule.repeats)
    }

    func testRejectsHourOutsideClockRange() {
        XCTAssertThrowsError(try WakeSchedule(hour: 24, minute: 0, weekdays: []))
    }

    func testRejectsMinuteOutsideClockRange() {
        XCTAssertThrowsError(try WakeSchedule(hour: 7, minute: 60, weekdays: []))
    }
}
