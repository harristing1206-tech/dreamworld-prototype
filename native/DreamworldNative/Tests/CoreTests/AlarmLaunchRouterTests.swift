import Foundation
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

    func testCaptureDeepLinkRoutesToCapture() throws {
        let url = try XCTUnwrap(URL(string: "dreamworld://capture"))
        XCTAssertEqual(AppDeepLink.destination(for: url), .capture)
    }

    func testUnknownDeepLinkIsIgnored() throws {
        let url = try XCTUnwrap(URL(string: "dreamworld://alarm"))
        XCTAssertNil(AppDeepLink.destination(for: url))
    }
}
