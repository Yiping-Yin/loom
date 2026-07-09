import SwiftUI

/// One review card (docs/canon/WHAT_IS_LOOM.md §6). The source's own words are
/// always visible; YOUR sentence is covered until you've tried to rebuild it.
/// Reveal, then self-rate in three tiers. A quiet control returns to the exact
/// source via the already-shipped loom://anchor jump-back. Calm, system-native
/// (no XP, no streak guilt, no confetti) — the daily unit requires a real
/// recall attempt, nothing else.
struct ReviewCardView: View {
    let item: ReviewItem
    let isRevealed: Bool
    let onReveal: () -> Void
    let onRate: (ReviewRating) -> Void
    let onOpenSource: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            // Provenance
            if !item.sourceTitle.isEmpty {
                Text(item.sourceTitle)
                    .font(.system(size: 11, weight: .medium))
                    .textCase(.uppercase)
                    .tracking(1.1)
                    .foregroundStyle(.tertiary)
            }

            // The source's words — the cue, always visible.
            Text("\u{201C}\(item.sourceQuote)\u{201D}")
                .font(.system(size: 16, design: .serif))
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.leading, 12)
                .overlay(alignment: .leading) {
                    Rectangle().fill(Color(nsColor: LoomTokens.dsAnchorNSColor).opacity(0.55)).frame(width: 2)
                }

            Divider().opacity(0.5)

            // Your distilled understanding — covered until you rebuild it.
            if isRevealed {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Your understanding")
                        .font(.system(size: 10, weight: .medium)).textCase(.uppercase)
                        .tracking(1.0).foregroundStyle(.tertiary)
                    Text(item.userSentence)
                        .font(.system(size: 17, design: .serif))
                        .foregroundStyle(.primary)
                        .fixedSize(horizontal: false, vertical: true)
                        .textSelection(.enabled)
                }
            } else {
                Button(action: onReveal) {
                    HStack(spacing: 8) {
                        Image(systemName: "eye")
                        Text("What did you understand here? Rebuild it, then reveal.")
                            .font(.system(size: 14, design: .serif)).italic()
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 18)
                    .padding(.horizontal, 14)
                    .background(.quaternary, in: RoundedRectangle(cornerRadius: 8))
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
                .keyboardShortcut(.space, modifiers: [])
                .help("Reveal your own words (Space)")
            }

            Spacer(minLength: 0)

            // Footer: rate (after reveal) + return to source.
            HStack(spacing: 10) {
                if isRevealed {
                    ratingButton("Forgot", .forgot, key: "1")
                    ratingButton("Fuzzy", .fuzzy, key: "2")
                    ratingButton("Solid", .solid, key: "3")
                }
                Spacer()
                Button(action: onOpenSource) {
                    Label("Source", systemImage: "arrow.uturn.backward")
                        .font(.system(size: 12))
                }
                .buttonStyle(.plain)
                .foregroundStyle(.tint)
                .help("Return to the exact source passage")
                .accessibilityLabel("Return to source")
            }
        }
        .padding(24)
        .frame(maxWidth: 560, alignment: .leading)
    }

    private func ratingButton(_ label: String, _ rating: ReviewRating, key: Character) -> some View {
        Button { onRate(rating) } label: {
            Text(label).font(.system(size: 13)).frame(minWidth: 64)
        }
        .buttonStyle(.bordered)
        .tint(rating == .solid ? .green : (rating == .forgot ? .orange : .secondary))
        .keyboardShortcut(KeyEquivalent(key), modifiers: [])
        .help("\(label) (\(key))")
    }
}
