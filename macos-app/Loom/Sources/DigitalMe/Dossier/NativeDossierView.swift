import SwiftUI

/// The native "You" dossier — Digital Me's own surface (docs/canon/
/// WHAT_IS_LOOM.md: the moat is the judgment trace). It shows the principles
/// YOU promoted from your own reading — each a scoped conclusion with its
/// provenance and how often it's been reused — instead of the old web bundle.
/// This is the judgment trace made visible: the same records that condition
/// the Ask companion (DigitalMePrompt), shown to you honestly.
struct NativeDossierView: View {
    @State private var principles: [ReflectionPrincipleRecord] = []
    @State private var copiedConfirmation = false
    // Online presence (owner trio: LinkedIn/GitHub/Ins/Outlook supplement the
    // wiki into the professional self). Owner-registered links, local.
    @State private var profiles: [OnlineProfile] = []
    @State private var isAddingProfile = false
    @State private var newProfileLabel = ""
    @State private var newProfileURL = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                header
                onlinePresenceSection
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
            profiles = OnlinePresenceStore.load()
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("You — your principles")
        // UI-verification handle for the "You" dossier surface. Non-behavioral.
        .accessibilityIdentifier("surface.dossier")
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
                // Digital Me across desktops: copy the judgment trace as a
                // portable context to paste into ANY AI model — your judgment
                // travels with you, commanding models outside LOOM too.
                Button {
                    if let context = DigitalMePrompt.portableContext(from: principles) {
                        NSPasteboard.general.clearContents()
                        NSPasteboard.general.setString(context, forType: .string)
                        copiedConfirmation = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                            copiedConfirmation = false
                        }
                    }
                } label: {
                    Label(copiedConfirmation ? "Copied — paste into any AI" : "Copy for any AI",
                          systemImage: copiedConfirmation ? "checkmark" : "doc.on.doc")
                        .font(.system(size: 11))
                }
                .buttonStyle(.plain)
                .foregroundStyle(Color.accentColor)
                .padding(.top, 6)
                .help("Copy your principles as a context you can paste into ChatGPT, Claude, or any AI — so it works with YOUR judgment.")
                .accessibilityLabel("Copy your judgment context for any AI")
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

    /// Online presence — the places that supplement the wiki into the
    /// professional self (LinkedIn / GitHub / Instagram / Outlook…). Owner-
    /// registered links: local, honest, one click to open.
    private var onlinePresenceSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Text("Online presence")
                    .font(.system(size: 11, weight: .medium))
                    .tracking(1.2)
                    .textCase(.uppercase)
                    .foregroundStyle(.tertiary)
                Button {
                    isAddingProfile.toggle()
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 10, weight: .medium))
                }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
                .help("Add a profile link (LinkedIn, GitHub, …)")
                .accessibilityLabel("Add online profile")
            }

            if profiles.isEmpty && !isAddingProfile {
                Text("Add your LinkedIn, GitHub, or other profiles — the online places that round out who you are.")
                    .font(.system(size: 12, design: .serif))
                    .italic()
                    .foregroundStyle(.tertiary)
            }

            ForEach(profiles) { profile in
                Button {
                    NSWorkspace.shared.open(profile.url)
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "link")
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                            .frame(width: 18)
                        Text(profile.label)
                            .font(.system(size: 13))
                            .foregroundStyle(.primary)
                        Text(profile.url.host() ?? "")
                            .font(.system(size: 11))
                            .foregroundStyle(.tertiary)
                        Spacer(minLength: 0)
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .contextMenu {
                    Button("Remove", role: .destructive) {
                        OnlinePresenceStore.remove(id: profile.id)
                        profiles = OnlinePresenceStore.load()
                    }
                }
                .accessibilityLabel("\(profile.label) profile")
            }

            if isAddingProfile {
                HStack(spacing: 8) {
                    TextField("Label (e.g. LinkedIn)", text: $newProfileLabel)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 150)
                    TextField("URL", text: $newProfileURL)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit(commitNewProfile)
                    Button("Add", action: commitNewProfile)
                        .disabled(OnlinePresenceStore.normalizedWebURL(from: newProfileURL) == nil
                                  || newProfileLabel.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .font(.system(size: 12))
            }
        }
    }

    private func commitNewProfile() {
        OnlinePresenceStore.add(label: newProfileLabel, urlString: newProfileURL)
        profiles = OnlinePresenceStore.load()
        newProfileLabel = ""
        newProfileURL = ""
        isAddingProfile = false
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
