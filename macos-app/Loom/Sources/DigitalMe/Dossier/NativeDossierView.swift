import SwiftUI

/// The native "You" dossier — Digital Me's own surface (docs/canon/
/// WHAT_IS_LOOM.md: the moat is the judgment trace). It shows the principles
/// YOU promoted from your own reading — each a scoped conclusion with its
/// provenance and how often it's been reused — instead of the old web bundle.
/// This is the judgment trace made visible: the same records that condition
/// the Ask companion (DigitalMePrompt), shown to you honestly.
struct NativeDossierView: View {
    @State private var principles: [ReflectionPrincipleRecord] = []

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                header
                if principles.isEmpty {
                    emptyState
                } else {
                    ForEach(principles) { principleCard($0) }
                }
            }
            .padding(28)
            .frame(maxWidth: 640, alignment: .leading)
            .frame(maxWidth: .infinity)
        }
        .onAppear {
            principles = ReflectionPrincipleStore.load()
                .sorted { $0.promotedAt > $1.promotedAt }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("You — your principles")
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("You")
                .font(.system(size: 22, weight: .semibold, design: .serif))
                .foregroundStyle(.primary)
            Text("The judgments you've promoted from your own reading — your trace, not the model's.")
                .font(.system(size: 13, design: .serif))
                .italic()
                .foregroundStyle(.secondary)
            if !principles.isEmpty {
                Text(traceSummary)
                    .font(.system(size: 11))
                    .foregroundStyle(.tertiary)
                    .padding(.top, 2)
            }
        }
        .padding(.bottom, 4)
    }

    /// A quiet one-line summary: how many principles you've recorded and how
    /// many the workbench has seen you reuse — the moat, in two numbers.
    private var traceSummary: String {
        let reused = principles.filter { !$0.reuseEvents.isEmpty }.count
        let base = "\(principles.count) principle\(principles.count == 1 ? "" : "s")"
        return reused > 0 ? "\(base) · \(reused) reused" : base
    }

    private var emptyState: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: "signature")
                .font(.system(size: 24))
                .foregroundStyle(.tertiary)
            Text("Your principles will gather here.")
                .font(.system(size: 14, design: .serif))
                .foregroundStyle(.secondary)
            Text("When you promote a judgment from a note, it lands here — scoped, sourced, yours.")
                .font(.system(size: 12, design: .serif))
                .foregroundStyle(.tertiary)
        }
        .padding(.top, 8)
    }

    @ViewBuilder
    private func principleCard(_ p: ReflectionPrincipleRecord) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(p.statement)
                .font(.system(size: 15, design: .serif))
                .foregroundStyle(.primary)
                .fixedSize(horizontal: false, vertical: true)
            if !p.holdsWithin.isEmpty {
                Text("holds within: \(p.holdsWithin)")
                    .font(.system(size: 12, design: .serif))
                    .foregroundStyle(.secondary)
            }
            HStack(spacing: 10) {
                if !p.sourceCaseTitle.isEmpty {
                    Label(p.sourceCaseTitle, systemImage: "text.quote")
                        .labelStyle(.titleAndIcon)
                }
                if !p.reuseEvents.isEmpty {
                    Label("reused \(p.reuseEvents.count)×", systemImage: "arrow.triangle.2.circlepath")
                        .labelStyle(.titleAndIcon)
                }
            }
            .font(.system(size: 11))
            .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(.quinary))
    }
}
