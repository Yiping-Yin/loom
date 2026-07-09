import SwiftUI

/// The cover→rebuild→reveal→rate state machine behind the review card
/// (docs/canon/WHAT_IS_LOOM.md §6). The valuable act is the RECALL, so this
/// forces hide → retrieve → reveal: a rating only counts after a reveal, and
/// each rating advances to the next card and re-covers it. Persistence is an
/// injected closure so the flow is testable without touching the store.
final class ReviewSession: ObservableObject {
    @Published private(set) var index: Int = 0
    /// The user's own sentence is COVERED until they've tried to rebuild it.
    @Published private(set) var isRevealed: Bool = false

    private(set) var items: [ReviewItem]
    private let now: () -> Date
    private let onRate: (String, ReviewRating, Date) -> Void

    init(
        items: [ReviewItem],
        now: @escaping () -> Date = Date.init,
        onRate: @escaping (String, ReviewRating, Date) -> Void
    ) {
        self.items = items
        self.now = now
        self.onRate = onRate
    }

    var current: ReviewItem? { index >= 0 && index < items.count ? items[index] : nil }
    var isComplete: Bool { index >= items.count }
    var completedCount: Int { min(index, items.count) }
    var total: Int { items.count }

    /// Load a fresh session — used when the review window reopens so it always
    /// shows today's live queue, not a stale one.
    func reload(items: [ReviewItem]) {
        self.items = items
        index = 0
        isRevealed = false
    }

    func reveal() {
        guard current != nil else { return }
        isRevealed = true
    }

    /// Only after a reveal — no passive rating. Records the rating and advances.
    func rate(_ rating: ReviewRating) {
        guard let card = current, isRevealed else { return }
        onRate(card.id, rating, now())
        index += 1
        isRevealed = false
    }
}
