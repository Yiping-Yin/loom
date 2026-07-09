import XCTest
@testable import Loom

/// You = the professional self, supplemented by your ONLINE presence (owner
/// trio 2026-07-10: LinkedIn / Instagram / GitHub / Outlook…). The honest v1
/// is owner-registered links — local, yours, one click away — the first
/// external tile of the simulated professional. Injectable defaults so tests
/// never touch the owner's real store.
final class OnlinePresenceStoreTests: XCTestCase {

    private func freshDefaults() -> UserDefaults {
        UserDefaults(suiteName: "loom.presence.tests.\(UUID().uuidString)")!
    }

    func testAddPersistsAndLoadsBack() {
        let d = freshDefaults()
        XCTAssertTrue(OnlinePresenceStore.load(defaults: d).isEmpty)
        OnlinePresenceStore.add(label: "GitHub", urlString: "https://github.com/yiping", defaults: d)
        let profiles = OnlinePresenceStore.load(defaults: d)
        XCTAssertEqual(profiles.count, 1)
        XCTAssertEqual(profiles[0].label, "GitHub")
        XCTAssertEqual(profiles[0].url.absoluteString, "https://github.com/yiping")
    }

    func testAddRejectsInvalidOrNonWebURLs() {
        let d = freshDefaults()
        OnlinePresenceStore.add(label: "bad", urlString: "not a url", defaults: d)
        OnlinePresenceStore.add(label: "file", urlString: "file:///etc/passwd", defaults: d)
        OnlinePresenceStore.add(label: "empty", urlString: "", defaults: d)
        XCTAssertTrue(OnlinePresenceStore.load(defaults: d).isEmpty,
                      "only http(s) links qualify as online presence")
    }

    func testAddWithoutSchemeAssumesHTTPS() {
        let d = freshDefaults()
        OnlinePresenceStore.add(label: "LinkedIn", urlString: "linkedin.com/in/yiping", defaults: d)
        XCTAssertEqual(OnlinePresenceStore.load(defaults: d).first?.url.absoluteString,
                       "https://linkedin.com/in/yiping")
    }

    func testRemoveDeletesOnlyThatProfile() {
        let d = freshDefaults()
        OnlinePresenceStore.add(label: "GitHub", urlString: "https://github.com/a", defaults: d)
        OnlinePresenceStore.add(label: "LinkedIn", urlString: "https://linkedin.com/in/a", defaults: d)
        let id = OnlinePresenceStore.load(defaults: d)[0].id
        OnlinePresenceStore.remove(id: id, defaults: d)
        let rest = OnlinePresenceStore.load(defaults: d)
        XCTAssertEqual(rest.count, 1)
        XCTAssertNotEqual(rest[0].id, id)
    }
}
