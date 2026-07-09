import SwiftUI

/// The Wiki destination's front door (owner trio 2026-07-10): the personal
/// knowledge ENCYCLOPEDIA, holding two corpora side by side —
/// - the staged chapters (the 47-article LLM wiki, THE BOOK), and
/// - **Your pages**: the owner's own article-shaped notes (workspace → wiki).
/// Deep-research law (2026-07-10): the knowledge base grows by the user's own
/// auditable shaping, never by silent auto-organizing — so a note appears here
/// only once the user gave it an explicit `# ` title and real substance.
enum WikiHome {
    struct OwnPage: Identifiable, Equatable {
        let caseID: String
        let title: String
        var id: String { caseID }
    }

    /// The notes that qualify as encyclopedia pages: an explicit top-level
    /// `# ` heading (the user titled it) + a non-trivial body beyond the
    /// heading. Newest first (touchedAt), so the encyclopedia's "Your pages"
    /// shelf reads like a living publication list.
    static func ownPages(from cases: [ReflectionCase]) -> [OwnPage] {
        cases.compactMap { c -> (OwnPage, Date)? in
            guard let doc = c.documentText, !doc.isEmpty else { return nil }
            let lines = doc.components(separatedBy: .newlines)
            guard let firstContent = lines.first(where: { !$0.trimmingCharacters(in: .whitespaces).isEmpty }),
                  firstContent.hasPrefix("# ") else { return nil }
            let title = firstContent.dropFirst(2).trimmingCharacters(in: .whitespaces)
            guard !title.isEmpty else { return nil }
            // Substance gate: the body beyond the heading must be more than a stub.
            let body = doc.replacingOccurrences(of: firstContent, with: "")
                .trimmingCharacters(in: .whitespacesAndNewlines)
            guard body.count >= 40 else { return nil }
            return (OwnPage(caseID: c.id, title: title), c.touchedAt ?? .distantPast)
        }
        .sorted { $0.1 > $1.1 }
        .map(\.0)
    }
}

/// The encyclopedia's table of contents — what the Wiki destination shows
/// before a chapter is opened. Sections of the staged book + Your pages.
struct WikiHomeView: View {
    let manifest: WikiManifest?
    let ownPages: [WikiHome.OwnPage]
    var onOpenChapter: (String) -> Void = { _ in }
    var onOpenOwnPage: (String) -> Void = { _ in }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 26) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Wiki")
                        .font(.system(size: 22, weight: .semibold, design: .serif))
                    Text("Your knowledge, organized — the book you're reading and the pages you're writing.")
                        .font(.system(size: 13, design: .serif))
                        .italic()
                        .foregroundStyle(.secondary)
                }

                if !ownPages.isEmpty {
                    section("Your pages") {
                        ForEach(ownPages) { page in
                            row(title: page.title, systemImage: "square.and.pencil") {
                                onOpenOwnPage(page.caseID)
                            }
                        }
                    }
                }

                if let manifest {
                    ForEach(WikiCurriculum.railSections(in: manifest)) { group in
                        section(group.section) {
                            ForEach(group.chapters) { chapter in
                                row(title: chapter.title, systemImage: "book") {
                                    onOpenChapter(chapter.slug)
                                }
                            }
                        }
                    }
                } else if ownPages.isEmpty {
                    Text("The staged book isn't in this build, and no note has grown into a page yet — give a note a # title and real substance, and it appears here.")
                        .font(.system(size: 13, design: .serif))
                        .italic()
                        .foregroundStyle(.tertiary)
                }
            }
            .padding(28)
            .frame(maxWidth: 640, alignment: .leading)
            .frame(maxWidth: .infinity)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Wiki — table of contents")
        .accessibilityIdentifier("surface.wikiHome")
    }

    @ViewBuilder
    private func section(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 11, weight: .medium))
                .tracking(1.2)
                .textCase(.uppercase)
                .foregroundStyle(.tertiary)
            content()
        }
    }

    private func row(title: String, systemImage: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: systemImage)
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .frame(width: 20)
                Text(title)
                    .font(.system(size: 14, design: .serif))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                Spacer(minLength: 0)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
    }
}
