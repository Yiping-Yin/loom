import XCTest
@testable import Loom

/// S1 of the ratified three-column division design (docs/canon/
/// THREE_COLUMN_DIVISION.md): the model fields + pure planners that need no
/// UI and touch no in-flight file. Groups derive from the REAL course
/// folder; diffs only ever propose, never delete; nesting is capped at one
/// level by construction.
final class CourseOrganizeTests: XCTestCase {

    // MARK: - Model fields (optional + LAST, zero migration)

    func testProjectNewFieldsRoundTrip() throws {
        var p = ReflectionProject(name: "MATH 2991", order: 0)
        p.parentID = "course-1"
        p.contentRootID = "root-uuid"
        p.folderBinding = FolderBinding(subPath: "W 3", bookmarkData: Data([1, 2, 3]))
        p.organizeTemplate = OrganizeTemplate(
            weekPattern: "W *",
            extraGroupNames: ["Guide"],
            excludedSubfolders: ["Trash"],
            termStartDate: Date(timeIntervalSince1970: 1_750_000_000),
            routeNewDraftsToCurrentWeek: true
        )

        let data = try JSONEncoder().encode(p)
        let decoded = try JSONDecoder().decode(ReflectionProject.self, from: data)

        XCTAssertEqual(decoded, p)
        XCTAssertEqual(decoded.folderBinding?.subPath, "W 3")
        XCTAssertEqual(decoded.organizeTemplate?.weekPattern, "W *")
    }

    func testLegacyProjectBlobDecodesWithNilNewFields() throws {
        let legacy = #"{"id":"p1","name":"Old","order":2,"createdAt":700000000}"#
        let decoded = try JSONDecoder().decode(ReflectionProject.self, from: Data(legacy.utf8))

        XCTAssertNil(decoded.parentID)
        XCTAssertNil(decoded.contentRootID)
        XCTAssertNil(decoded.folderBinding)
        XCTAssertNil(decoded.organizeTemplate)
    }

    // MARK: - Depth defense: nesting is ONE level by construction

    func testTopLevelResolutionTreatsDeepChainsAsTopLevel() {
        let course = ReflectionProject(id: "course", name: "MATH 2991", order: 0)
        var group = ReflectionProject(id: "group", name: "W 3", order: 1)
        group.parentID = "course"
        var tooDeep = ReflectionProject(id: "deep", name: "Broken", order: 2)
        tooDeep.parentID = "group" // parent is itself a child → invalid
        var orphan = ReflectionProject(id: "orphan", name: "Dangling", order: 3)
        orphan.parentID = "vanished"

        let all = [course, group, tooDeep, orphan]

        XCTAssertTrue(CourseOrganize.isTopLevel(course, in: all))
        XCTAssertFalse(CourseOrganize.isTopLevel(group, in: all))
        // A child of a child renders as top level (defense, not crash).
        XCTAssertTrue(CourseOrganize.isTopLevel(tooDeep, in: all))
        // A parentID pointing nowhere renders as top level.
        XCTAssertTrue(CourseOrganize.isTopLevel(orphan, in: all))
    }

    // MARK: - CourseImportPlanner: groups derive from the real folder

    private func makeCourseDir() throws -> URL {
        let dir = FileManager.default.temporaryDirectory
            .appendingPathComponent("course-\(UUID().uuidString)", isDirectory: true)
        for sub in ["W 1", "W 2", "W 10", "Guide", ".git"] {
            try FileManager.default.createDirectory(
                at: dir.appendingPathComponent(sub, isDirectory: true),
                withIntermediateDirectories: true)
        }
        FileManager.default.createFile(
            atPath: dir.appendingPathComponent("syllabus.pdf").path, contents: Data())
        return dir
    }

    func testImportPlanMirrorsVisibleSubfoldersInLearningOrder() throws {
        let dir = try makeCourseDir()
        defer { try? FileManager.default.removeItem(at: dir) }

        let plan = try CourseImportPlanner.plan(courseFolder: dir, excluding: [])

        XCTAssertEqual(plan.courseName, dir.lastPathComponent)
        // Subfolders only (no syllabus.pdf), hidden skipped, natural sort:
        // W 2 before W 10 (localizedStandardCompare), Guide alphabetical.
        XCTAssertEqual(plan.groups.map(\.name), ["Guide", "W 1", "W 2", "W 10"])
        XCTAssertEqual(plan.groups.map(\.subPath), ["Guide", "W 1", "W 2", "W 10"])
    }

    func testImportPlanHonorsExclusions() throws {
        let dir = try makeCourseDir()
        defer { try? FileManager.default.removeItem(at: dir) }

        let plan = try CourseImportPlanner.plan(courseFolder: dir, excluding: ["Guide"])

        XCTAssertEqual(plan.groups.map(\.name), ["W 1", "W 2", "W 10"])
    }

    // MARK: - OrganizeDiffPlanner: propose only, never delete

    func testDiffProposesNewFoldersAndFlagsDanglingWithoutDeleting() throws {
        let dir = try makeCourseDir()
        defer { try? FileManager.default.removeItem(at: dir) }

        // Existing groups: W 1 bound; "W 99" bound to a folder that no longer
        // exists; Guide NOT yet a group.
        var w1 = ReflectionProject(id: "g1", name: "W 1", order: 0)
        w1.parentID = "course"
        w1.folderBinding = FolderBinding(subPath: "W 1", bookmarkData: nil)
        var w99 = ReflectionProject(id: "g99", name: "W 99", order: 1)
        w99.parentID = "course"
        w99.folderBinding = FolderBinding(subPath: "W 99", bookmarkData: nil)

        let diff = try OrganizeDiffPlanner.diff(
            courseFolder: dir, existingGroups: [w1, w99], excluding: [])

        XCTAssertEqual(Set(diff.proposedNewGroups.map(\.subPath)), ["Guide", "W 2", "W 10"])
        XCTAssertEqual(diff.danglingGroupIDs, ["g99"])
        // "Never delete" is guaranteed BY TYPE: OrganizeDiff has no deletion
        // member at all — nothing to assert empty.
    }
}
