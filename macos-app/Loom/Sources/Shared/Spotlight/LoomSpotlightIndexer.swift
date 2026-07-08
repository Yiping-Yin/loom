import Foundation
import CoreSpotlight
import UniformTypeIdentifiers

/// Core Spotlight indexing for workspace notes — charter §22: a Mac
/// knowledge app's notes are findable from system Spotlight like Notes'
/// are. Built self-contained in W0-11; the store save/delete hooks and the
/// loom://note deep-link routing land in Wave 1 (the shell file that owns
/// URL routing is in-flight).
enum LoomSpotlightIndexer {
    static let domainIdentifier = "com.yinyiping.loom.notes"

    /// Pure item builder — testable without touching the live index.
    static func searchableItem(for reflectionCase: ReflectionCase) -> CSSearchableItem {
        let attributes = CSSearchableItemAttributeSet(contentType: UTType.text)
        attributes.title = reflectionCase.title
        let body = reflectionCase.documentText ?? reflectionCase.summary
        attributes.contentDescription = String(body.prefix(300))
        attributes.keywords = reflectionCase.tags
        attributes.contentModificationDate = reflectionCase.touchedAt

        return CSSearchableItem(
            // loom://note/<id> — Wave 1 routes this back to the case when
            // the user picks the result in Spotlight.
            uniqueIdentifier: "loom://note/\(reflectionCase.id)",
            domainIdentifier: domainIdentifier,
            attributeSet: attributes
        )
    }

    /// Index (or re-index) the given cases. Fire-and-forget: Spotlight
    /// failures must never interrupt a save.
    static func index(_ cases: [ReflectionCase]) {
        guard !cases.isEmpty else { return }
        let items = cases.map { searchableItem(for: $0) }
        CSSearchableIndex.default().indexSearchableItems(items) { _ in }
    }

    static func delete(caseID: String) {
        CSSearchableIndex.default()
            .deleteSearchableItems(withIdentifiers: ["loom://note/\(caseID)"]) { _ in }
    }

    static func deleteAll() {
        CSSearchableIndex.default()
            .deleteSearchableItems(withDomainIdentifiers: [domainIdentifier]) { _ in }
    }
}
