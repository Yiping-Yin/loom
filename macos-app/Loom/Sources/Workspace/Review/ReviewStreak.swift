import Foundation

/// The forgiving review streak (docs/canon/WHAT_IS_LOOM.md §6). Duolingo's
/// come-back lever, done honestly: it advances only on a real recall, a single
/// missed day is auto-frozen (bridged) so one slip doesn't erase the habit,
/// and it's a quiet number — no guilt, no confetti. Loss aversion is aimed at
/// an ASSET you protect (the streak), never a growing DEBT you flee.
struct ReviewStreak: Codable, Equatable {
    var current: Int
    var lastActiveDay: Date?

    static let empty = ReviewStreak(current: 0, lastActiveDay: nil)

    /// Advance the streak for a day of real review activity (day granularity —
    /// pass a start-of-day date). Same day = no double count; consecutive =
    /// increment; exactly one missed day = auto-freeze (bridge, keep going);
    /// two or more missed = reset to 1.
    static func advance(_ state: ReviewStreak, day: Date) -> ReviewStreak {
        guard let last = state.lastActiveDay else {
            return ReviewStreak(current: 1, lastActiveDay: day)
        }
        let gapDays = Int((day.timeIntervalSince(last) / 86_400).rounded())
        switch gapDays {
        case ..<1:
            return state                                   // same day (or earlier) — no change
        case 1, 2:
            return ReviewStreak(current: state.current + 1, lastActiveDay: day) // consecutive, or one-day freeze
        default:
            return ReviewStreak(current: 1, lastActiveDay: day) // too long — reset
        }
    }
}
