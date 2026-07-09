import XCTest
@testable import Loom

/// G1 (three-column division, docs/canon/THREE_COLUMN_DIVISION.md) — the PURE
/// rail-tree layer that the left sidebar renders and that survives the Wave 2
/// shell rewrite verbatim. A COURSE is a top-level project (contentRoot +
/// template) holding ONE level of GROUP child-projects, each holding its chats;
/// nesting is capped by construction (a child-of-a-child degrades to top level,
/// never lost). Building the tree, deriving a course from an import plan,
/// applying an Auto-Organize diff (propose-only, never delete), and the
/// canon deletion semantics are all headless + tested here.
final class CourseRailTreeTests: XCTestCase {

    private func course(_ id: String, order: Int = 0) -> ReflectionProject {
        var p = ReflectionProject(name: "Course \(id)", order: order)
        p.id = id
        p.contentRootID = "root-\(id)"
        p.organizeTemplate = OrganizeTemplate()
        return p
    }

    private func group(_ id: String, parent: String, order: Int, subPath: String) -> ReflectionProject {
        var p = ReflectionProject(name: subPath, order: order)
        p.id = id
        p.parentID = parent
        p.folderBinding = FolderBinding(subPath: subPath, bookmarkData: nil)
        return p
    }

    private func plainProject(_ id: String, order: Int = 0) -> ReflectionProject {
        var p = ReflectionProject(name: "Plain \(id)", order: order)
        p.id = id
        return p
    }

    private func chat(in projectID: String?) -> ReflectionCase {
        var c = ReflectionCase.blank()
        c.projectID = projectID
        return c
    }

    // MARK: - railTree

    func testRailTreeCourseWithTwoGroupsRendersCourseThenGroupsInOrderEachWithItsChats() {
        let c = course("c1")
        let g1 = group("g1", parent: "c1", order: 0, subPath: "W 1")
        let g2 = group("g2", parent: "c1", order: 1, subPath: "W 2")
        let chatG1 = chat(in: "g1")
        let chatG2 = chat(in: "g2")

        let tree = CourseOrganize.railTree(projects: [c, g2, g1], cases: [chatG2, chatG1])

        XCTAssertEqual(tree.count, 1)
        XCTAssertEqual(tree[0].project.id, "c1")
        XCTAssertEqual(tree[0].groups.map(\.group.id), ["g1", "g2"])   // learning order
        XCTAssertEqual(tree[0].groups[0].caseIDs, [chatG1.id])
        XCTAssertEqual(tree[0].groups[1].caseIDs, [chatG2.id])
    }

    func testRailTreeChildOfAChildDegradesToTopLevelNeverDeeperThanOne() {
        let c = course("c1")
        let g = group("g1", parent: "c1", order: 0, subPath: "W 1")
        // gg's parent is a GROUP (g1), whose own parent exists → gg is top level.
        let gg = group("gg", parent: "g1", order: 0, subPath: "nested")

        let tree = CourseOrganize.railTree(projects: [c, g, gg], cases: [])

        // gg surfaces as its OWN top-level node, never nested under g1.
        XCTAssertTrue(tree.contains { $0.project.id == "gg" })
        let courseNode = tree.first { $0.project.id == "c1" }!
        XCTAssertEqual(courseNode.groups.map(\.group.id), ["g1"])
        XCTAssertFalse(courseNode.groups.contains { $0.group.id == "gg" })
    }

    func testRailTreeGroupProjectDoesNotAlsoAppearAsTopLevel() {
        let c = course("c1")
        let g = group("g1", parent: "c1", order: 0, subPath: "W 1")

        let tree = CourseOrganize.railTree(projects: [c, g], cases: [])

        XCTAssertEqual(tree.map(\.project.id), ["c1"])   // g1 is NOT a top-level row
        XCTAssertEqual(tree[0].groups.map(\.group.id), ["g1"])
    }

    func testRailTreeFlatProjectWithNoChildrenRendersProjectThenChatsUnchanged() {
        let p = plainProject("p1")
        let a = chat(in: "p1")
        let b = chat(in: "p1")

        let tree = CourseOrganize.railTree(projects: [p], cases: [a, b])

        XCTAssertEqual(tree.count, 1)
        XCTAssertEqual(tree[0].project.id, "p1")
        XCTAssertTrue(tree[0].groups.isEmpty)
        XCTAssertEqual(Set(tree[0].directCaseIDs), Set([a.id, b.id]))
    }

    func testRailTreeChatWhoseProjectIDIsAGroupAppearsUnderThatGroupNotCourseNotUngrouped() {
        let c = course("c1")
        let g = group("g1", parent: "c1", order: 0, subPath: "W 1")
        let inGroup = chat(in: "g1")

        let tree = CourseOrganize.railTree(projects: [c, g], cases: [inGroup])

        XCTAssertEqual(tree[0].groups[0].caseIDs, [inGroup.id])
        XCTAssertFalse(tree[0].directCaseIDs.contains(inGroup.id))
    }

    func testRailTreeLooseChatWithProjectIDEqualToCourseAppearsDirectlyUnderCourse() {
        let c = course("c1")
        let g = group("g1", parent: "c1", order: 0, subPath: "W 1")
        let returned = chat(in: "c1")

        let tree = CourseOrganize.railTree(projects: [c, g], cases: [returned])

        XCTAssertEqual(tree[0].directCaseIDs, [returned.id])
        XCTAssertFalse(tree[0].groups[0].caseIDs.contains(returned.id))
    }

    // MARK: - makeCourse

    func testMakeCourseFromImportPlanSetsContentRootIDAndTemplateOnCourseAndParentIDOnEveryGroup() {
        let plan = CourseImportPlanner.Plan(courseName: "MATH 2991", groups: [
            .init(name: "W 1", subPath: "W 1"),
            .init(name: "W 2", subPath: "W 2"),
        ])
        let out = CourseOrganize.makeCourse(from: plan, contentRootID: "root-uuid", courseOrder: 3)

        let courseProj = out[0]
        XCTAssertEqual(courseProj.name, "MATH 2991")
        XCTAssertNil(courseProj.parentID)
        XCTAssertEqual(courseProj.contentRootID, "root-uuid")
        XCTAssertNotNil(courseProj.organizeTemplate)
        XCTAssertEqual(courseProj.order, 3)
        let groups = Array(out.dropFirst())
        XCTAssertEqual(groups.count, 2)
        XCTAssertTrue(groups.allSatisfy { $0.parentID == courseProj.id })
    }

    func testMakeCourseGroupsPreserveFolderBindingSubPathAndLearningOrder() {
        let plan = CourseImportPlanner.Plan(courseName: "C", groups: [
            .init(name: "W 1", subPath: "W 1"),
            .init(name: "W 2", subPath: "W 2"),
        ])
        let out = CourseOrganize.makeCourse(from: plan, contentRootID: "r", courseOrder: 0)
        let groups = Array(out.dropFirst())
        XCTAssertEqual(groups.map { $0.folderBinding?.subPath }, ["W 1", "W 2"])
        XCTAssertEqual(groups.map(\.order), [0, 1])   // preserves plan (learning) order
    }

    // MARK: - applyDiff (Auto Organize re-run)

    func testApplyDiffAppendsProposedGroupsAsChildProjectsReturnsDanglingDeletesNothing() {
        let c = course("c1")
        let existingGroup = group("g1", parent: "c1", order: 0, subPath: "W 1")
        let diff = OrganizeDiffPlanner.Diff(
            proposedNewGroups: [.init(name: "W 2", subPath: "W 2")],
            danglingGroupIDs: ["g1"])

        let result = CourseOrganize.applyDiff(diff, into: [c, existingGroup], courseID: "c1", startOrder: 1)

        // Nothing removed; the proposed group appended as a child of the course.
        XCTAssertEqual(result.projects.count, 3)
        XCTAssertTrue(result.projects.contains { $0.id == "c1" })
        XCTAssertTrue(result.projects.contains { $0.id == "g1" })
        let added = result.projects.first { $0.folderBinding?.subPath == "W 2" }
        XCTAssertNotNil(added)
        XCTAssertEqual(added?.parentID, "c1")
        XCTAssertEqual(result.danglingGroupIDs, ["g1"])
    }

    // MARK: - deletion semantics (canon)

    func testDeleteGroupReturnsItsChatsToTheCourseNotToUnfiled() {
        let c = course("c1")
        let g = group("g1", parent: "c1", order: 0, subPath: "W 1")
        let inGroup = chat(in: "g1")

        let result = CourseOrganize.deleteGroup("g1", from: [c, g], cases: [inGroup])

        XCTAssertFalse(result.projects.contains { $0.id == "g1" })
        let moved = result.cases.first { $0.id == inGroup.id }!
        XCTAssertEqual(moved.projectID, "c1", "a deleted group returns its chats to the course, not to unfiled")
    }

    func testDeleteCourseCascadesGroupEntitiesAndReturnsAllChatsToUnfiled() {
        let c = course("c1")
        let g = group("g1", parent: "c1", order: 0, subPath: "W 1")
        let inGroup = chat(in: "g1")
        let onCourse = chat(in: "c1")

        let result = CourseOrganize.deleteCourse("c1", from: [c, g], cases: [inGroup, onCourse])

        XCTAssertTrue(result.projects.isEmpty, "course + its group entities are all removed")
        XCTAssertNil(result.cases.first { $0.id == inGroup.id }!.projectID)
        XCTAssertNil(result.cases.first { $0.id == onCourse.id }!.projectID)
    }

    func testDeleteCourseOnPlainProjectStillUngroupsChatsToNil() {
        // A plain project == a course with no groups: deletion ungroups its
        // chats to nil, exactly as the existing deleteProject does.
        let p = plainProject("p1")
        let a = chat(in: "p1")

        let result = CourseOrganize.deleteCourse("p1", from: [p], cases: [a])

        XCTAssertTrue(result.projects.isEmpty)
        XCTAssertNil(result.cases.first { $0.id == a.id }!.projectID)
    }
}
