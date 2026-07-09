import SwiftUI

/// The Today destination — first of the approved 3-way top IA (charter §20:
/// Today · Workspace · Digital Me). Owner-ratified shape (2026-07-08): the
/// minimal version — Reading now / Open questions / Recent, pure aggregation,
/// no hero object in the void. Built unwired in charter W0-11; W2-2 slots it
/// into the sidebar as a destination and routes row taps back into the
/// workspace (`onOpenCase`).
struct TodayView: View {
    let digest: TodayDigest
    var onOpenCase: (String) -> Void = { _ in }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                section("Reading now", items: digest.readingNow,
                        empty: "Nothing open — add a source and start reading.")
                section("Open questions", items: digest.openQuestions,
                        empty: "No open questions. Start a line with ❓ in any note.")
                section("Recent", items: digest.recent,
                        empty: "Your recent notes will gather here.")
            }
            .padding(28)
            .frame(maxWidth: 560, alignment: .leading)
            .frame(maxWidth: .infinity)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Today")
        // UI-verification handle: disambiguates the Today SURFACE from the
        // sidebar "Today" destination row (which shares the label). Non-behavioral.
        .accessibilityIdentifier("surface.today")
    }

    @ViewBuilder
    private func section(_ title: String, items: [TodayDigest.Item], empty: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.system(size: 11, weight: .medium))
                .tracking(1.2)
                .textCase(.uppercase)
                .foregroundStyle(.tertiary)
            if items.isEmpty {
                Text(empty)
                    .font(.system(size: 13, design: .serif))
                    .italic()
                    .foregroundStyle(.secondary)
            } else {
                ForEach(items) { item in
                    Button {
                        onOpenCase(item.caseID)
                    } label: {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.title)
                                .font(.system(size: 14, design: .serif))
                                .foregroundStyle(.primary)
                            if !item.subtitle.isEmpty {
                                Text(item.subtitle)
                                    .font(.system(size: 12, design: .serif))
                                    .foregroundStyle(.secondary)
                                    .lineLimit(2)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("\(item.title). \(item.subtitle)")
                }
            }
        }
    }
}
