import AppKit

/// The Review wedge's store (docs/canon/WHAT_IS_LOOM.md §6) — a thin policy
/// layer over the pure engine. It persists the review items, syncs a note's
/// items when the note is saved, records a self-rating, and serves today's
/// capped, no-debt session. UserDefaults is injectable so the whole thing is
/// testable without touching the owner's real store.
enum ReviewStore {
    static let defaultsKey = "loom.review.items.v1"

    /// Canon §6: default daily portion is a small constant (5–7), the OUTPUT
    /// is hard-capped and decoupled from how many are "due". An item becomes a
    /// candidate only once predicted recall decays to ≤ this threshold, so no
    /// calendar due-date exists to miss — debt is impossible by construction.
    static let defaultDailyCap = 7
    static let candidateThreshold = 0.5

    // MARK: - Persistence

    static func loadAll(defaults: UserDefaults = .standard) -> [ReviewItem] {
        guard let data = defaults.data(forKey: defaultsKey) else { return [] }
        return (try? JSONDecoder().decode([ReviewItem].self, from: data)) ?? []
    }

    @discardableResult
    static func saveAll(_ items: [ReviewItem], defaults: UserDefaults = .standard) -> Bool {
        guard let data = try? JSONEncoder().encode(items) else { return false }
        defaults.set(data, forKey: defaultsKey)
        return true
    }

    // MARK: - Sync (called when a note is saved)

    /// Extract this note's (anchored quote → your claim) pairings and upsert
    /// them into the store, preserving each existing item's review schedule.
    /// Idempotent; never deletes items from other notes.
    @discardableResult
    static func syncNote(
        document: NSAttributedString,
        sourceTitle: String,
        now: Date = Date(),
        defaults: UserDefaults = .standard
    ) -> [ReviewItem] {
        let extracted = ReviewExtraction.extract(from: document)
        let merged = ReviewExtraction.upsert(
            extracted: extracted, into: loadAll(defaults: defaults),
            sourceTitle: sourceTitle, now: now)
        saveAll(merged, defaults: defaults)
        return merged
    }

    // MARK: - Review (called by the card UI)

    /// Apply a self-rating to one item: advance/reset its half-life, stamp the
    /// review, persist.
    static func recordReview(
        itemID: String,
        rating: ReviewRating,
        at date: Date = Date(),
        defaults: UserDefaults = .standard
    ) {
        var items = loadAll(defaults: defaults)
        guard let i = items.firstIndex(where: { $0.id == itemID }) else { return }
        items[i].apply(rating: rating, at: date)
        saveAll(items, defaults: defaults)
    }

    // MARK: - Today's session (served to TodayView)

    /// The capped, most-forgotten-first, no-debt session for right now.
    static func dueToday(
        now: Date = Date(),
        dailyCap: Int = defaultDailyCap,
        defaults: UserDefaults = .standard
    ) -> [ReviewItem] {
        ReviewScheduler.todaysSession(
            items: loadAll(defaults: defaults),
            now: now, dailyCap: dailyCap, candidateThreshold: candidateThreshold)
    }
}
