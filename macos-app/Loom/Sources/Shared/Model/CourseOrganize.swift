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
