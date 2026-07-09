import Foundation

/// A single review item — the atomic unit of the Review wedge (docs/canon/
/// WHAT_IS_LOOM.md §6). It is NOT a flashcard: it's a micro-skill you're
/// crystallizing. `userSentence` is your own distilled understanding (written
/// by you, never by AI — the generation-effect red line); it is what the
/// review COVERS. `sourceQuote` + `anchorURL` are the verbatim evidence and
/// the one-tap route back to the exact source (via the already-shipped
/// loom://anchor jump-back).
struct ReviewItem: Codable, Identifiable, Equatable {
    let id: String
    /// `loom://anchor?src=…&frag=…` — jump back to the exact source location.
    var anchorURL: String
    /// The source's own words, shown during review.
    var sourceQuote: String
    /// YOUR words — the distillation. Covered during review; the thing you
    /// rebuild. Authored by the user at capture time, never by AI.
    var userSentence: String
    /// Display provenance ("DPO § Key idea", "lecture3.pdf p.4", …).
    var sourceTitle: String
    var createdAt: Date
    /// The forgetting-curve half-life in days. Grows with good ratings,
    /// resets on a miss. Recall probability = 2^(-elapsed/stability).
    var stabilityDays: Double
    /// Nil until first reviewed; recall elapsed is measured from
    /// `lastReviewedAt ?? createdAt`.
    var lastReviewedAt: Date? = nil

    /// Apply a self-rating: grow/reset the half-life and stamp the review.
    mutating func apply(rating: ReviewRating, at date: Date) {
        stabilityDays = ReviewScheduler.updatedStability(current: stabilityDays, rating: rating)
        lastReviewedAt = date
    }
}

/// Three tiers, not Anki's four — a single user can't calibrate four, and the
/// extra choice is friction (canon §6). Feeds the scheduler: forgot resurfaces
/// fast, solid retreats far.
enum ReviewRating: String, Codable, CaseIterable, Equatable {
    case forgot   // 没想起来 — aggressively resurface
    case fuzzy    // 勉强 — modest growth
    case solid    // 稳 — expand far
}
