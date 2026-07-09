import SwiftUI

/// The daily review surface (docs/canon/WHAT_IS_LOOM.md §6): today's capped,
/// no-debt session of your own anchored quotes. Constant serving — you get the
/// most-forgotten few, never a growing pile; a finished session says "done for
/// today," not "queue empty of an obligation." Returning to source posts the
/// anchor URL for the shell's existing loom://anchor routing to consume.
struct ReviewSessionView: View {
    @StateObject private var session: ReviewSession
    @State private var streak: Int = 0

    /// Builds today's session from the store. `onRate` persists via
    /// ReviewStore; `openAnchor` hands the URL to the shell's anchor routing.
    init(
        load: @escaping () -> [ReviewItem] = { ReviewStore.dueToday() },
        onRate: @escaping (String, ReviewRating, Date) -> Void = { id, rating, date in
            ReviewStore.recordReview(itemID: id, rating: rating, at: date)
        }
    ) {
        self.load = load
        _session = StateObject(wrappedValue: ReviewSession(items: [], onRate: onRate))
    }

    private let load: () -> [ReviewItem]

    var body: some View {
        VStack(spacing: 0) {
            header
            Divider()
            content
        }
        .frame(minWidth: 480, minHeight: 420)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Review")
        // Reload today's live queue whenever the window appears, so reopening
        // never shows a stale session; refresh the streak after each rating.
        .onAppear { session.reload(items: load()); streak = ReviewStore.currentStreak() }
        .onChange(of: session.completedCount) { _, _ in streak = ReviewStore.currentStreak() }
    }

    private var header: some View {
        HStack(spacing: 12) {
            // (No "Review" label here — the window's own titlebar already
            // says it; a duplicate title was chrome noise.)
            // A quiet streak — an asset you protect, not a debt you flee. No
            // guilt, no owl; shown only once you have one.
            if streak > 0 {
                Text("\(streak)-day streak")
                    .font(.system(size: 11))
                    .foregroundStyle(.tertiary)
            }
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
                onOpenSource: { Self.returnToSource(anchorURL: item.anchorURL) }
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

extension ReviewSessionView {
    /// Parse a `loom://anchor?src=…&page=…&rect=…` URL and post the same
    /// `.loomReflectionAnchorJump` the editor's own anchor clicks post, so the
    /// main workbench reader jumps to the exact source passage — reusing the
    /// already-shipped jump-back rather than a second routing path.
    static func returnToSource(anchorURL: String) {
        guard anchorURL.hasPrefix("loom://anchor"),
              let comps = URLComponents(string: anchorURL) else { return }
        // Wiki quotes return to their CHAPTER (the main window's Wiki
        // destination) — the wedge's jump-back, wiki edition.
        if let slug = WikiCurriculum.wikiSlugFromAnchor(anchorURL) {
            NotificationCenter.default.post(
                name: .loomOpenWikiChapter, object: nil, userInfo: ["slug": slug])
            return
        }
        let q = comps.queryItems ?? []
        guard let sourceID = q.first(where: { $0.name == "src" })?.value, !sourceID.isEmpty else { return }
        let page = Int(q.first(where: { $0.name == "page" })?.value ?? "") ?? 0
        var rect = CGRect.zero
        if let parts = q.first(where: { $0.name == "rect" })?.value?
            .split(separator: ",").compactMap({ Double($0) }), parts.count == 4 {
            rect = CGRect(x: parts[0], y: parts[1], width: parts[2], height: parts[3])
        }
        NotificationCenter.default.post(
            name: .loomReflectionAnchorJump, object: nil,
            userInfo: ["sourceID": sourceID, "page": page, "rect": NSValue(rect: rect)])
    }
}
