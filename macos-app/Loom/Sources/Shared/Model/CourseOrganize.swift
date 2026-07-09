import Foundation

/// The three-column division's spine types + pure planners (ratified
/// 2026-07-08, docs/canon/THREE_COLUMN_DIVISION.md). Everything here is
/// headless and unit-tested: groups DERIVE from the real course folder,
/// diffs only ever PROPOSE (deletion has no representation in these types),
/// and LOOM never writes the owner's disk (ruling ③ — reading only).

/// Group-level spine: binds a group to one subfolder of its course root.
/// Bookmark-first so a Finder rename self-heals (charter §16 idiom);
/// `subPath` is display + fallback, never the primary key.
struct FolderBinding: Codable, Equatable {
    var subPath: String
    var bookmarkData: Data?
}

/// The per-course Auto Organize template — typed rules, never free text.
/// Human-readable summaries are GENERATED from this struct; nothing ever
/// parses text back. Editing a template only affects the future: it never
/// retroactively renames existing groups.
struct OrganizeTemplate: Codable, Equatable {
    /// Glob-ish display pattern for weekly groups (e.g. "W *").
    var weekPattern: String = "W *"
    /// Non-week groups the course keeps (e.g. Guide, Additional Resources).
    var extraGroupNames: [String] = []
    /// Subfolder names the planners ignore entirely.
    var excludedSubfolders: [String] = []
    /// When set, enables teaching-week math for routing new drafts.
    var termStartDate: Date? = nil
    /// New drafts default into the computed current week's group.
    var routeNewDraftsToCurrentWeek: Bool = false
}

/// Shared resolution helpers for the one-level nesting cap.
enum CourseOrganize {
    /// Depth defense: a project renders top-level unless its parent EXISTS
    /// and is ITSELF top-level. A child-of-a-child or a dangling parentID
    /// degrades to top level — visible, never lost, never deeper than one.
    static func isTopLevel(_ project: ReflectionProject, in all: [ReflectionProject]) -> Bool {
        guard let parentID = project.parentID else { return true }
        guard let parent = all.first(where: { $0.id == parentID }) else { return true }
        return parent.parentID != nil
    }

    /// The visible (non-hidden) first-level subfolders of a course folder,
    /// in learning order (localizedStandardCompare: "W 2" before "W 10").
    static func visibleSubfolders(of courseFolder: URL, excluding excluded: Set<String>) throws -> [String] {
        let contents = try FileManager.default.contentsOfDirectory(
            at: courseFolder,
            includingPropertiesForKeys: [.isDirectoryKey],
            options: [.skipsHiddenFiles]
        )
        return contents
            .filter { (try? $0.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true }
            .map(\.lastPathComponent)
            .filter { !excluded.contains($0) }
            .sorted { $0.localizedStandardCompare($1) == .orderedAscending }
    }

    // MARK: - Rail tree (what the left sidebar renders)

    /// One group row: a GROUP project plus its chats (by projectID).
    struct GroupNode: Equatable {
        let group: ReflectionProject
        let caseIDs: [String]
    }

    /// One top-level rail row: a project (a COURSE with groups, or a plain flat
    /// project with none), its ordered groups, and the chats that sit DIRECTLY
    /// under it (projectID == this project — a plain project's chats, or a chat
    /// "returned to the course").
    struct CourseNode: Equatable {
        let project: ReflectionProject
        let groups: [GroupNode]
        let directCaseIDs: [String]
    }

    /// Build the rail tree: top-level projects in `order`, each with its ONE
    /// level of groups (capped by `isTopLevel`, so a child-of-a-child surfaces
    /// as its own top-level row — visible, never lost) and its direct chats.
    /// A plain flat project renders exactly as today (no groups, its chats
    /// directly under it). Ungrouped chats (projectID matching no project) are
    /// the caller's concern, unchanged.
    static func railTree(projects: [ReflectionProject], cases: [ReflectionCase]) -> [CourseNode] {
        let topLevel = projects
            .filter { isTopLevel($0, in: projects) }
            .sorted { $0.order < $1.order }
        return topLevel.map { top in
            let groups = projects
                .filter { $0.parentID == top.id && !isTopLevel($0, in: projects) }
                .sorted { $0.order < $1.order }
                .map { g in
                    GroupNode(group: g, caseIDs: cases.filter { $0.projectID == g.id }.map(\.id))
                }
            let direct = cases.filter { $0.projectID == top.id }.map(\.id)
            return CourseNode(project: top, groups: groups, directCaseIDs: direct)
        }
    }

    // MARK: - Course creation from an import plan

    /// Turn an accepted `CourseImportPlanner.Plan` into a course project plus
    /// one group child-project per plan group (parentID set, folderBinding
    /// bound to the subfolder, learning order preserved in `order`). The course
    /// carries the ContentRoot + a default template.
    static func makeCourse(
        from plan: CourseImportPlanner.Plan,
        contentRootID: String,
        courseOrder: Int,
        template: OrganizeTemplate = OrganizeTemplate()
    ) -> [ReflectionProject] {
        var courseProject = ReflectionProject(name: plan.courseName, order: courseOrder)
        courseProject.contentRootID = contentRootID
        courseProject.organizeTemplate = template
        let groups = plan.groups.enumerated().map { index, groupPlan -> ReflectionProject in
            var g = ReflectionProject(name: groupPlan.name, order: index)
            g.parentID = courseProject.id
            g.folderBinding = FolderBinding(subPath: groupPlan.subPath, bookmarkData: nil)
            return g
        }
        return [courseProject] + groups
    }

    // MARK: - Auto Organize re-run (apply a diff)

    struct ApplyDiffResult: Equatable {
        /// The existing projects plus the newly appended group child-projects.
        let projects: [ReflectionProject]
        /// Groups whose bound folder vanished — badged in the rail, never removed.
        let danglingGroupIDs: [String]
    }

    /// Apply an `OrganizeDiffPlanner.Diff`: append each proposed group as a new
    /// child of the course, pass the dangling IDs through for badging. Deletes
    /// nothing (deletion has no representation, by design).
    static func applyDiff(
        _ diff: OrganizeDiffPlanner.Diff,
        into existing: [ReflectionProject],
        courseID: String,
        startOrder: Int
    ) -> ApplyDiffResult {
        let newGroups = diff.proposedNewGroups.enumerated().map { index, groupPlan -> ReflectionProject in
            var g = ReflectionProject(name: groupPlan.name, order: startOrder + index)
            g.parentID = courseID
            g.folderBinding = FolderBinding(subPath: groupPlan.subPath, bookmarkData: nil)
            return g
        }
        return ApplyDiffResult(projects: existing + newGroups, danglingGroupIDs: diff.danglingGroupIDs)
    }

    // MARK: - Deletion semantics (canon)

    struct MutationResult: Equatable {
        let projects: [ReflectionProject]
        let cases: [ReflectionCase]
    }

    /// Delete a GROUP: remove the group project and return its chats to the
    /// COURSE (its parent), not to unfiled. A group with no resolvable parent
    /// falls back to plain ungrouping (to nil).
    static func deleteGroup(
        _ groupID: String,
        from projects: [ReflectionProject],
        cases: [ReflectionCase]
    ) -> MutationResult {
        let destination = projects.first(where: { $0.id == groupID })?.parentID
        let remaining = projects.filter { $0.id != groupID }
        let movedCases = cases.map { c -> ReflectionCase in
            guard c.projectID == groupID else { return c }
            var m = c
            m.projectID = destination   // to the course, or nil if none
            return m
        }
        return MutationResult(projects: remaining, cases: movedCases)
    }

    /// Delete a COURSE (or a plain project): cascade-remove its group entities
    /// and return ALL its chats (direct + in any group) to unfiled (nil). For a
    /// plain project with no groups this is exactly the existing ungroup-to-nil.
    static func deleteCourse(
        _ courseID: String,
        from projects: [ReflectionProject],
        cases: [ReflectionCase]
    ) -> MutationResult {
        let groupIDs = Set(projects.filter { $0.parentID == courseID }.map(\.id))
        let removed = groupIDs.union([courseID])
        let remaining = projects.filter { !removed.contains($0.id) }
        let unfiledCases = cases.map { c -> ReflectionCase in
            guard let pid = c.projectID, removed.contains(pid) else { return c }
            var m = c
            m.projectID = nil
            return m
        }
        return MutationResult(projects: remaining, cases: unfiledCases)
    }
}

/// "New course from folder…" — mirrors the folder's first-level subfolders
/// as a proposed group list. Pure planning: the preview sheet shows this
/// plan; nothing is created until the owner accepts.
enum CourseImportPlanner {
    struct GroupPlan: Equatable {
        let name: String
        let subPath: String
    }

    struct Plan: Equatable {
        let courseName: String
        let groups: [GroupPlan]
    }

    static func plan(courseFolder: URL, excluding excluded: [String]) throws -> Plan {
        let names = try CourseOrganize.visibleSubfolders(of: courseFolder, excluding: Set(excluded))
        return Plan(
            courseName: courseFolder.lastPathComponent,
            groups: names.map { GroupPlan(name: $0, subPath: $0) }
        )
    }
}

/// Auto Organize re-run — diff the live folder tree against the course's
/// existing groups. Proposals only: new subfolders become PROPOSED groups,
/// groups whose bound folder vanished are flagged DANGLING. Deletion has no
/// representation in this type, by design.
enum OrganizeDiffPlanner {
    struct Diff: Equatable {
        /// Subfolders with no group yet — the preview offers to add these.
        let proposedNewGroups: [CourseImportPlanner.GroupPlan]
        /// Groups whose bound subfolder no longer exists on disk — badged in
        /// the rail, never removed automatically.
        let danglingGroupIDs: [String]
    }

    static func diff(
        courseFolder: URL,
        existingGroups: [ReflectionProject],
        excluding excluded: [String]
    ) throws -> Diff {
        let onDisk = try CourseOrganize.visibleSubfolders(of: courseFolder, excluding: Set(excluded))
        let boundSubPaths = Set(existingGroups.compactMap { $0.folderBinding?.subPath })

        let proposed = onDisk
            .filter { !boundSubPaths.contains($0) }
            .map { CourseImportPlanner.GroupPlan(name: $0, subPath: $0) }

        let onDiskSet = Set(onDisk)
        let dangling = existingGroups
            .filter { group in
                guard let bound = group.folderBinding?.subPath else { return false }
                return !onDiskSet.contains(bound)
            }
            .map(\.id)

        return Diff(proposedNewGroups: proposed, danglingGroupIDs: dangling)
    }
}
