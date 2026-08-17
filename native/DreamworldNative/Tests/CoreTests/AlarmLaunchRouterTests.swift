import XCTest
@testable import DreamworldCore

final class AlarmLaunchRouterTests: XCTestCase {
    func testAlarmRecordActionRoutesToCapture() {
        var router = AppRouteState(selectedTab: .world)
        router.handleAlarmAction(.recordDream)
        XCTAssertEqual(router.selectedTab, .capture)
    }

    func testOrdinaryLaunchKeepsWorldSelected() {
        var router = AppRouteState(selectedTab: .world)
        router.handleAlarmAction(nil)
        XCTAssertEqual(router.selectedTab, .world)
    }
}
