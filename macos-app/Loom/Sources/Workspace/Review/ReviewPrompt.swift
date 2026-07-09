import Foundation

/// The cover prompt shown before you rebuild your own sentence — it escalates
/// with mastery (docs/canon/WHAT_IS_LOOM.md §6, the transfer caveat). A new
/// item just asks you to recall; a settling one asks WHY (elaboration); a
/// well-known one asks you to APPLY it in a new context — because by then,
/// re-reciting your line proves nothing. Keyed off the existing stability, so
/// there's no model change and no migration.
enum ReviewPrompt {
    enum Tier: Int, Equatable {
        case recall = 0     // early — just get it to stick
        case elaborate = 1  // settling — say WHY in your own words
        case transfer = 2   // solid — apply it somewhere new (real understanding)
    }

    struct Prompt: Equatable {
        let tier: Tier
        let text: String
    }

    static func coverPrompt(stabilityDays: Double) -> Prompt {
        let floor = ReviewScheduler.initialStabilityDays
        if stabilityDays < floor * 2 {
            return Prompt(tier: .recall,
                          text: "What did you understand here? Rebuild it, then reveal.")
        } else if stabilityDays < floor * 8 {
            return Prompt(tier: .elaborate,
                          text: "In your own words — why does this hold? Then reveal.")
        } else {
            return Prompt(tier: .transfer,
                          text: "Where would this NOT hold, or where else does it apply? Then reveal.")
        }
    }
}
