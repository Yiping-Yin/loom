import SwiftUI

/// The daily review surface (docs/canon/WHAT_IS_LOOM.md §6): today's capped,
/// no-debt session of your own anchored quotes. Constant serving — you get the
/// most-forgotten few, never a growing pile; a finished session says "done for
/// today," not "queue empty of an obligation." Returning to source posts the
/// anchor URL for the shell's existing loom://anchor routing to consume.
struct ReviewSessionView: View {
    @StateObject private var session: ReviewSession

    /// Builds today's session from the store. `onRate` persists via
    /// ReviewStore; `openAnchor` hands the URL to the shell's anchor routing.
    init(
        items: [ReviewItem] = ReviewStore.dueToday(),
        onRate: @escaping (String, ReviewRating, Date) -> Void = { id, rating, date in
            ReviewStore.recordReview(itemID: id, rating: rating, at: date)
        }
    ) {
        _session = StateObject(wrappedValue: ReviewSession(items: items, onRate: onRate))
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider()
            content
        }
        .frame(minWidth: 480, minHeight: 420)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Review")
    }

    private var header: some View {
        HStack {
            Text("Review")
                .font(.system(size: 13, weight: .medium, design: .serif))
            Spacer()
            if session.total > 0 {
                Text("\(min(session.completedCount + (session.isComplete ? 0 : 1), session.total)) / \(session.total)")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }

    @ViewBuilder
    private var content: some View {
        if session.isComplete {
            completionState
        } else if let item = session.current {
            ReviewCardView(
                item: item,
                isRevealed: session.isRevealed,
                onReveal: { session.reveal() },
                onRate: { session.rate($0) },
                onOpenSource: {
                    NotificationCenter.default.post(
                        name: .loomReviewOpenAnchor, object: nil,
                        userInfo: ["url": item.anchorURL])
                }
            )
            .id(item.id)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private var completionState: some View {
        VStack(spacing: 10) {
            Image(systemName: session.total == 0 ? "sparkles" : "checkmark.circle")
                .font(.system(size: 28))
                .foregroundStyle(.tertiary)
            Text(session.total == 0
                 ? "Nothing to review right now."
                 : "Done for today.")
                .font(.system(size: 15, design: .serif))
                .foregroundStyle(.secondary)
            if session.total == 0 {
                Text("Anchor a quote and write it in your own words — it comes back here.")
                    .font(.system(size: 12, design: .serif)).italic()
                    .foregroundStyle(.tertiary)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: 360)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

extension Notification.Name {
    /// Posted by a review card's "Source" control; the shell observes it and
    /// routes the loom://anchor back to the exact source passage.
    static let loomReviewOpenAnchor = Notification.Name("loomReviewOpenAnchor")
}
