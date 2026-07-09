import Foundation

/// The Review wedge's pure scheduling engine (docs/canon/WHAT_IS_LOOM.md §6).
///
/// Design law — NO ACCUMULATING DEBT. Anki's death is a calendar of hard due
/// dates that pile up when you skip; the visible "1,847 overdue" is an
/// aversive stimulus that drives users away (a doom loop). Here there are no
/// due dates at all: each item has a predicted RECALL PROBABILITY that decays
/// continuously, an item becomes a candidate only once that probability
/// crosses a threshold, and the daily session is a hard-capped constant. It
/// is therefore mathematically impossible to "owe" a growing pile — nothing
/// is ever "late," and a skipped week just means the top-N most-forgotten
/// items surface, never all of them.
///
/// Deliberately NOT full FSRS: a single user's early history can't feed FSRS's
/// ~1000-review personalization, so this is a simplified half-life model that
/// upgrades to FSRS later once there's enough history.
enum ReviewScheduler {
    /// Fresh items start with a 1-day half-life: a new item surfaces for its
    /// first real retrieval after about a day.
    static let initialStabilityDays = 1.0

    /// Recall probability on the forgetting curve: 1.0 at zero elapsed, 0.5 at
    /// one half-life, halving each half-life after. Clamped to [0, 1] so clock
    /// skew (negative elapsed) never exceeds certainty.
    static func recallProbability(stabilityDays: Double, elapsedDays: Double) -> Double {
        guard stabilityDays > 0 else { return elapsedDays <= 0 ? 1.0 : 0.0 }
        if elapsedDays <= 0 { return 1.0 }
        return pow(2.0, -elapsedDays / stabilityDays)
    }

    /// A self-rating grows or resets the half-life. Forgot resets to the
    /// initial floor (fast return); fuzzy grows modestly; solid expands far.
    /// Strictly ordered so solid > fuzzy > forgot for any input.
    static func updatedStability(current: Double, rating: ReviewRating) -> Double {
        let base = max(current, initialStabilityDays)
        switch rating {
        case .forgot:
            // Reset to the floor — but strictly below fuzzy/solid growth, and
            // never <= 0.
            return initialStabilityDays
        case .fuzzy:
            return base * 1.4
        case .solid:
            return base * 2.4
        }
    }

    /// Today's session: the candidates (predicted recall at or below the
    /// threshold), most-forgotten first, capped at the daily maximum. The cap
    /// is what makes debt impossible — with 100 overdue items you still get
    /// exactly `dailyCap`, never a pile.
    static func todaysSession(
        items: [ReviewItem],
        now: Date,
        dailyCap: Int,
        candidateThreshold: Double
    ) -> [ReviewItem] {
        let scored: [(item: ReviewItem, recall: Double)] = items.map { item in
            let anchor = item.lastReviewedAt ?? item.createdAt
            let elapsedDays = now.timeIntervalSince(anchor) / 86_400.0
            let recall = recallProbability(stabilityDays: item.stabilityDays, elapsedDays: elapsedDays)
            return (item, recall)
        }
        return scored
            .filter { $0.recall <= candidateThreshold }
            .sorted { $0.recall < $1.recall }   // most-forgotten first (highest-value)
            .prefix(max(0, dailyCap))
            .map(\.item)
    }
}
