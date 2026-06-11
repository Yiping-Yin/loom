import XCTest

@testable import Loom

final class LoomDraftStoreTests: XCTestCase {
    func testDraftsPersistAndReopenFromManagedStore() throws {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? fm.removeItem(at: root) }

        let store = LoomDraftStore(rootURL: root, fileManager: fm)
        let created = try store.create(
            title: " Flipdisc frame ",
            body: "Frame format needs preserved structure.",
            references: [
                LoomDraftReference(label: "flipdisc capture", href: "loom://capture/flipdisc")
            ],
            now: Date(timeIntervalSince1970: 1)
        )

        XCTAssertEqual(created.title, "Flipdisc frame")
        XCTAssertEqual(created.body, "Frame format needs preserved structure.")
        XCTAssertEqual(created.references.first?.href, "loom://capture/flipdisc")

        let reopened = LoomDraftStore(rootURL: root, fileManager: fm)
        XCTAssertEqual(try reopened.list().first?.id, created.id)
        XCTAssertEqual(try reopened.list().first?.references.first?.label, "flipdisc capture")
    }

    func testUpdatingDraftPreservesCreatedAtAndAdvancesUpdatedAt() throws {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? fm.removeItem(at: root) }

        let store = LoomDraftStore(rootURL: root, fileManager: fm)
        let created = try store.create(
            title: "One",
            body: "",
            now: Date(timeIntervalSince1970: 1)
        )
        let updated = try store.update(
            created,
            title: "Two",
            body: "Saved body",
            now: Date(timeIntervalSince1970: 2)
        )

        XCTAssertEqual(updated.title, "Two")
        XCTAssertEqual(updated.body, "Saved body")
        XCTAssertEqual(updated.createdAt, Date(timeIntervalSince1970: 1))
        XCTAssertEqual(updated.updatedAt, Date(timeIntervalSince1970: 2))
    }

    func testDraftReferencesPreserveExcerptMetadata() throws {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? fm.removeItem(at: root) }

        let store = LoomDraftStore(rootURL: root, fileManager: fm)
        _ = try store.create(
            title: "With source excerpt",
            references: [
                LoomDraftReference(
                    label: "Flipdisc guide",
                    href: "https://flipdisc.io",
                    sourceTitle: "Flipdisc Display Build and Software Guide",
                    excerpt: "Each frame starts with a start byte."
                )
            ],
            now: Date(timeIntervalSince1970: 1)
        )

        let reopened = try LoomDraftStore(rootURL: root, fileManager: fm).list().first
        XCTAssertEqual(reopened?.references.first?.sourceTitle, "Flipdisc Display Build and Software Guide")
        XCTAssertEqual(reopened?.references.first?.excerpt, "Each frame starts with a start byte.")
    }

    func testDraftReferencesPreserveCaptureMetadata() throws {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? fm.removeItem(at: root) }

        let store = LoomDraftStore(rootURL: root, fileManager: fm)
        _ = try store.create(
            title: "With capture",
            references: [
                LoomDraftReference(
                    label: "Flipdisc capture",
                    href: "loom://bundle/loom-render/capture/?root=abc",
                    kind: "capture",
                    sourceTitle: "flipdisc.io",
                    capturedAt: "2026-05-09T04:14:32.000Z"
                )
            ],
            now: Date(timeIntervalSince1970: 1)
        )

        let reopened = try LoomDraftStore(rootURL: root, fileManager: fm).list().first
        XCTAssertEqual(reopened?.references.first?.kind, "capture")
        XCTAssertEqual(reopened?.references.first?.capturedAt, "2026-05-09T04:14:32.000Z")
    }

    func testDraftReferencesPreserveCorpusLocationMetadata() throws {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? fm.removeItem(at: root) }

        let store = LoomDraftStore(rootURL: root, fileManager: fm)
        let created = try store.create(
            title: "With corpus location",
            references: [
                LoomDraftReference(
                    label: "Flipdisc guide",
                    href: "/wiki/flipdisc-tutorial",
                    kind: "capture",
                    sourceTitle: "Flipdisc Display Build and Software Guide",
                    category: "Web capture",
                    sourcePath: "Web/flipdisc.io/Loom.md",
                    excerpt: "Frame format keeps byte-level structure."
                )
            ],
            now: Date(timeIntervalSince1970: 1)
        )

        let markdownURL = root
            .appendingPathComponent("Drafts", isDirectory: true)
            .appendingPathComponent("\(created.id.uuidString).md", isDirectory: false)
        let markdown = try String(contentsOf: markdownURL, encoding: .utf8)
        XCTAssertTrue(markdown.contains("Category: Web capture"))
        XCTAssertTrue(markdown.contains("Source path: Web/flipdisc.io/Loom.md"))

        let reopened = try LoomDraftStore(rootURL: root, fileManager: fm).list().first
        XCTAssertEqual(reopened?.references.first?.category, "Web capture")
        XCTAssertEqual(reopened?.references.first?.sourcePath, "Web/flipdisc.io/Loom.md")

        let updated = try store.attachReference(
            LoomDraftReference(
                label: "Flipdisc duplicate",
                href: "/wiki/flipdisc-tutorial",
                category: "Web capture",
                sourcePath: "Web/flipdisc.io/Loom.md"
            ),
            now: Date(timeIntervalSince1970: 2)
        )
        XCTAssertEqual(updated.references.first?.label, "Flipdisc guide")
        XCTAssertEqual(updated.references.first?.category, "Web capture")
        XCTAssertEqual(updated.references.first?.sourcePath, "Web/flipdisc.io/Loom.md")
    }

    func testDraftReferencesPreserveArtifactStateMetadata() throws {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? fm.removeItem(at: root) }

        let artifactState = LoomDraftArtifactState(
            targetId: "frame-format",
            kind: "segment-diagram",
            label: "Frame Format",
            state: "0x80 -> 0x83 -> 0x01 -> imageData[grow] -> 0x8F",
            stateLabel: "imageData grows between address and end byte"
        )
        let store = LoomDraftStore(rootURL: root, fileManager: fm)
        _ = try store.create(
            title: "With artifact state",
            references: [
                LoomDraftReference(
                    label: "Frame Format",
                    href: "loom://bundle/loom-render/capture/?root=abc#frame-format",
                    kind: "artifact-state",
                    sourceTitle: "Flipdisc Display Build and Software Guide",
                    excerpt: "The payload expands at imageData.",
                    artifactState: artifactState
                )
            ],
            now: Date(timeIntervalSince1970: 1)
        )

        let reopened = try LoomDraftStore(rootURL: root, fileManager: fm).list().first
        XCTAssertEqual(reopened?.references.first?.kind, "artifact-state")
        XCTAssertEqual(reopened?.references.first?.artifactState, artifactState)
    }

    func testDraftsPersistReadableMarkdownSidecars() throws {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? fm.removeItem(at: root) }

        let store = LoomDraftStore(rootURL: root, fileManager: fm)
        let created = try store.create(
            title: " Flipdisc frame ",
            body: "Frame format needs preserved structure.",
            references: [
                LoomDraftReference(
                    label: "Flipdisc capture",
                    href: "loom://bundle/loom-render/capture/?root=abc",
                    kind: "capture",
                    sourceTitle: "flipdisc.io",
                    excerpt: "Each frame starts with a start byte.",
                    capturedAt: "2026-05-09T04:14:32.000Z"
                )
            ],
            now: Date(timeIntervalSince1970: 1)
        )

        let markdownURL = root
            .appendingPathComponent("Drafts", isDirectory: true)
            .appendingPathComponent("\(created.id.uuidString).md", isDirectory: false)
        let markdown = try String(contentsOf: markdownURL, encoding: .utf8)

        XCTAssertTrue(markdown.contains("# Flipdisc frame"))
        XCTAssertTrue(markdown.contains("Frame format needs preserved structure."))
        XCTAssertTrue(markdown.contains("## References"))
        XCTAssertTrue(markdown.contains("- [Flipdisc capture](loom://bundle/loom-render/capture/?root=abc)"))
        XCTAssertTrue(markdown.contains("Kind: capture"))
        XCTAssertTrue(markdown.contains("Source: flipdisc.io"))
        XCTAssertTrue(markdown.contains("Captured: 2026-05-09T04:14:32.000Z"))
        XCTAssertTrue(markdown.contains("> Each frame starts with a start byte."))
    }

    func testDraftsRecoverFromReadableMarkdownSidecarsWhenIndexIsMissing() throws {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? fm.removeItem(at: root) }

        let store = LoomDraftStore(rootURL: root, fileManager: fm)
        let created = try store.create(
            title: "Recovered draft",
            body: "Recover this body from markdown.",
            references: [
                LoomDraftReference(
                    label: "Flipdisc capture",
                    href: "loom://bundle/loom-render/capture/?root=abc",
                    kind: "capture",
                    sourceTitle: "flipdisc.io",
                    excerpt: "Each frame starts with a start byte.",
                    capturedAt: "2026-05-09T04:14:32.000Z"
                )
            ],
            now: Date(timeIntervalSince1970: 1)
        )

        let indexURL = root
            .appendingPathComponent("Drafts", isDirectory: true)
            .appendingPathComponent("drafts.json", isDirectory: false)
        try fm.removeItem(at: indexURL)

        let recovered = try LoomDraftStore(rootURL: root, fileManager: fm).list()

        XCTAssertEqual(recovered.count, 1)
        XCTAssertEqual(recovered.first?.id, created.id)
        XCTAssertEqual(recovered.first?.title, "Recovered draft")
        XCTAssertEqual(recovered.first?.body, "Recover this body from markdown.")
        XCTAssertEqual(recovered.first?.references.first?.label, "Flipdisc capture")
        XCTAssertEqual(recovered.first?.references.first?.href, "loom://bundle/loom-render/capture/?root=abc")
        XCTAssertEqual(recovered.first?.references.first?.kind, "capture")
        XCTAssertEqual(recovered.first?.references.first?.sourceTitle, "flipdisc.io")
        XCTAssertEqual(recovered.first?.references.first?.capturedAt, "2026-05-09T04:14:32.000Z")
        XCTAssertEqual(recovered.first?.references.first?.excerpt, "Each frame starts with a start byte.")
    }

    func testDraftsReadNewerMarkdownSidecarEditsWhenIndexStillExists() throws {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? fm.removeItem(at: root) }

        let store = LoomDraftStore(rootURL: root, fileManager: fm)
        let created = try store.create(
            title: "Original draft",
            body: "Original body.",
            references: [
                LoomDraftReference(label: "Original source", href: "loom://source/original")
            ],
            now: Date(timeIntervalSince1970: 1)
        )

        let draftsDirectory = root.appendingPathComponent("Drafts", isDirectory: true)
        let indexURL = draftsDirectory.appendingPathComponent("drafts.json", isDirectory: false)
        let markdownURL = draftsDirectory.appendingPathComponent("\(created.id.uuidString).md", isDirectory: false)
        let indexModifiedAt = Date()
        let sidecarModifiedAt = indexModifiedAt.addingTimeInterval(5)
        try fm.setAttributes([.modificationDate: indexModifiedAt], ofItemAtPath: indexURL.path)
        try """
        # Edited outside Loom

        Edited body from the markdown file.

        ## References
        - [Edited source](https://example.com/edited)
          Kind: source
          Source: Edited source title
          > Edited excerpt.
        """.write(to: markdownURL, atomically: true, encoding: .utf8)
        try fm.setAttributes([.modificationDate: sidecarModifiedAt], ofItemAtPath: markdownURL.path)

        let reopened = try LoomDraftStore(rootURL: root, fileManager: fm).list().first

        XCTAssertEqual(reopened?.id, created.id)
        XCTAssertEqual(reopened?.title, "Edited outside Loom")
        XCTAssertEqual(reopened?.body, "Edited body from the markdown file.")
        XCTAssertEqual(reopened?.createdAt, Date(timeIntervalSince1970: 1))
        XCTAssertEqual(reopened?.references.first?.label, "Edited source")
        XCTAssertEqual(reopened?.references.first?.href, "https://example.com/edited")
        XCTAssertEqual(reopened?.references.first?.kind, "source")
        XCTAssertEqual(reopened?.references.first?.sourceTitle, "Edited source title")
        XCTAssertEqual(reopened?.references.first?.excerpt, "Edited excerpt.")
        XCTAssertGreaterThan(reopened?.updatedAt ?? Date.distantPast, created.updatedAt)
    }

    func testAttachReferenceMergesCaptureIntoExistingDraft() throws {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? fm.removeItem(at: root) }

        let store = LoomDraftStore(rootURL: root, fileManager: fm)
        let created = try store.create(
            title: "Existing draft",
            body: "Keep this body.",
            references: [
                LoomDraftReference(label: "Original source", href: "loom://source/original")
            ],
            now: Date(timeIntervalSince1970: 1)
        )

        let updated = try store.attachReference(
            LoomDraftReference(
                label: "Flipdisc capture",
                href: "loom://bundle/loom-render/capture/?root=abc&captureAst=Loom-capture-ast.json",
                kind: "capture",
                sourceTitle: "flipdisc.io",
                capturedAt: "2026-05-09T04:14:32.000Z"
            ),
            now: Date(timeIntervalSince1970: 2)
        )
        let deduped = try store.attachReference(
            LoomDraftReference(
                label: "Duplicate label should not replace metadata",
                href: "loom://bundle/loom-render/capture/?root=abc&captureAst=Loom-capture-ast.json"
            ),
            now: Date(timeIntervalSince1970: 3)
        )

        XCTAssertEqual(updated.id, created.id)
        XCTAssertEqual(deduped.title, "Existing draft")
        XCTAssertEqual(deduped.body, "Keep this body.")
        XCTAssertEqual(deduped.references.count, 2)
        XCTAssertEqual(deduped.references.last?.label, "Flipdisc capture")
        XCTAssertEqual(deduped.references.last?.kind, "capture")
        XCTAssertEqual(deduped.references.last?.sourceTitle, "flipdisc.io")
        XCTAssertEqual(deduped.references.last?.capturedAt, "2026-05-09T04:14:32.000Z")
        XCTAssertEqual(deduped.updatedAt, Date(timeIntervalSince1970: 3))
    }

    func testRemoveReferenceDetachesOnlyThatReferenceAndUpdatesSidecar() throws {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? fm.removeItem(at: root) }

        let store = LoomDraftStore(rootURL: root, fileManager: fm)
        let created = try store.create(
            title: "Existing draft",
            body: "Keep this body.",
            references: [
                LoomDraftReference(label: "Original source", href: "loom://source/original"),
                LoomDraftReference(label: "Flipdisc capture", href: "loom://capture/flipdisc", kind: "capture")
            ],
            now: Date(timeIntervalSince1970: 1)
        )

        let updated = try store.removeReference(
            href: "loom://capture/flipdisc",
            from: created,
            now: Date(timeIntervalSince1970: 2)
        )
        let reopened = try LoomDraftStore(rootURL: root, fileManager: fm).list().first
        let sidecarURL = root
            .appendingPathComponent("Drafts", isDirectory: true)
            .appendingPathComponent("\(created.id.uuidString).md", isDirectory: false)
        let sidecar = try String(contentsOf: sidecarURL, encoding: .utf8)

        XCTAssertEqual(updated.id, created.id)
        XCTAssertEqual(updated.title, "Existing draft")
        XCTAssertEqual(updated.body, "Keep this body.")
        XCTAssertEqual(updated.references.map(\.href), ["loom://source/original"])
        XCTAssertEqual(updated.updatedAt, Date(timeIntervalSince1970: 2))
        XCTAssertEqual(reopened?.references.map(\.href), ["loom://source/original"])
        XCTAssertTrue(sidecar.contains("Original source"))
        XCTAssertFalse(sidecar.contains("Flipdisc capture"))
        XCTAssertFalse(sidecar.contains("loom://capture/flipdisc"))
    }

    func testAttachReferenceMergesArtifactStateIntoExistingReference() throws {
        let fm = FileManager.default
        let root = fm.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? fm.removeItem(at: root) }

        let store = LoomDraftStore(rootURL: root, fileManager: fm)
        _ = try store.create(
            title: "Existing draft",
            references: [
                LoomDraftReference(
                    label: "Frame Format",
                    href: "loom://bundle/loom-render/capture/?root=abc#frame-format"
                )
            ],
            now: Date(timeIntervalSince1970: 1)
        )

        let updated = try store.attachReference(
            LoomDraftReference(
                label: "Duplicate artifact state",
                href: "loom://bundle/loom-render/capture/?root=abc#frame-format",
                kind: "artifact-state",
                sourceTitle: "Flipdisc Display Build and Software Guide",
                excerpt: "The payload expands at imageData.",
                artifactState: LoomDraftArtifactState(
                    targetId: "frame-format",
                    kind: "segment-diagram",
                    label: "Frame Format",
                    state: "0x80 -> 0x83 -> 0x01 -> imageData[grow] -> 0x8F",
                    stateLabel: "imageData grows between address and end byte"
                )
            ),
            now: Date(timeIntervalSince1970: 2)
        )

        XCTAssertEqual(updated.references.count, 1)
        XCTAssertEqual(updated.references.first?.label, "Frame Format")
        XCTAssertEqual(updated.references.first?.kind, "artifact-state")
        XCTAssertEqual(updated.references.first?.sourceTitle, "Flipdisc Display Build and Software Guide")
        XCTAssertEqual(updated.references.first?.excerpt, "The payload expands at imageData.")
        XCTAssertEqual(updated.references.first?.artifactState?.targetId, "frame-format")
        XCTAssertEqual(updated.references.first?.artifactState?.stateLabel, "imageData grows between address and end byte")
    }

    func testQuoteFormatterPreservesLeadingDraftWhitespaceAndBuildsProvenance() {
        let reference = LoomDraftReference(
            label: "Flipdisc guide",
            href: "https://flipdisc.io",
            sourceTitle: "Flipdisc Display Build and Software Guide",
            excerpt: "Each frame starts with a start byte."
        )

        let body = LoomDraftQuoteFormatter.appendReferenceExcerpt(
            to: "  Frame format matters. \n\n",
            reference: reference
        )

        XCTAssertEqual(
            body,
            "  Frame format matters.\n\n> Each frame starts with a start byte.\n\nSource: Flipdisc Display Build and Software Guide"
        )
        XCTAssertEqual(
            LoomDraftQuoteFormatter.provenanceMatches(body: body, references: [reference]),
            [
                LoomDraftProvenanceMatch(
                    n: 1,
                    phrase: "Each frame starts with a start byte.",
                    label: "Flipdisc Display Build and Software Guide",
                    href: "https://flipdisc.io"
                )
            ]
        )
    }

    func testArtifactStateQuoteFormatterBuildsStateScopedProvenance() {
        let artifactState = LoomDraftArtifactState(
            targetId: "frame-format",
            kind: "segment-diagram",
            label: "Frame Format",
            state: "0x80 -> 0x83 -> 0x01 -> imageData[grow] -> 0x8F",
            stateLabel: "imageData grows between address and end byte"
        )
        let reference = LoomDraftReference(
            label: "Frame Format",
            href: "loom://capture#frame-format",
            sourceTitle: "Flipdisc Display Build and Software Guide",
            excerpt: "The payload expands at imageData.",
            artifactState: artifactState
        )

        let body = LoomDraftQuoteFormatter.appendReferenceExcerpt(
            to: "Frame format matters.",
            reference: reference
        )

        XCTAssertEqual(
            body,
            "Frame format matters.\n\n> The payload expands at imageData.\n\nSource: Flipdisc Display Build and Software Guide\nArtifact state: Frame Format · segment-diagram · frame-format · imageData grows between address and end byte"
        )
        XCTAssertEqual(
            LoomDraftQuoteFormatter.provenanceMatches(body: body, references: [reference]),
            [
                LoomDraftProvenanceMatch(
                    n: 1,
                    phrase: "The payload expands at imageData.",
                    label: "Flipdisc Display Build and Software Guide",
                    href: "loom://capture#frame-format",
                    artifactState: artifactState
                )
            ]
        )
    }

    func testDraftSourceTilesPrepareFourSourceNativeSurface() {
        let tiles = LoomDraftSourceTiles.tiles(
            from: [
                LoomDraftReference(
                    label: "Flipdisc guide",
                    href: "https://flipdisc.io",
                    kind: "source",
                    sourceTitle: "Flipdisc Display Build and Software Guide",
                    excerpt: "Each frame starts with a start byte."
                ),
                LoomDraftReference(
                    label: "Captured animation",
                    href: "loom://bundle/loom-render/capture/?root=abc",
                    kind: "capture",
                    sourceTitle: "flipdisc.io",
                    capturedAt: "2026-05-09 19:50"
                ),
                LoomDraftReference(
                    label: "Frame Format",
                    href: "loom://bundle/loom-render/capture/?root=abc#frame-format",
                    kind: "artifact-state",
                    artifactState: LoomDraftArtifactState(
                        targetId: "frame-format",
                        kind: "segment-diagram",
                        label: "Frame Format",
                        state: nil,
                        stateLabel: "imageData grows between address and end byte"
                    )
                ),
                LoomDraftReference(
                    label: "Loose URL",
                    href: "https://example.com/reference",
                    kind: "url"
                ),
                LoomDraftReference(
                    label: "Extra source that should not crowd the first writing surface",
                    href: "https://example.com/extra"
                )
            ],
            limit: 4
        )

        XCTAssertEqual(tiles.map(\.label), [
            "Flipdisc guide",
            "Captured animation",
            "Frame Format",
            "Loose URL"
        ])
        XCTAssertEqual(tiles.map(\.kindLabel), ["Source", "Capture", "Artifact state", "URL"])
        XCTAssertEqual(tiles[0].detail, "Source · Flipdisc Display Build and Software Guide")
        XCTAssertEqual(tiles[0].excerpt, "Each frame starts with a start byte.")
        XCTAssertTrue(tiles[0].canInsertQuote)
        XCTAssertEqual(tiles[1].detail, "Capture · flipdisc.io · 2026-05-09 19:50")
        XCTAssertFalse(tiles[1].canInsertQuote)
        XCTAssertEqual(
            tiles[2].detail,
            "Artifact state · Frame Format · segment-diagram · frame-format · imageData grows between address and end byte"
        )
        XCTAssertEqual(tiles[3].detail, "URL")
        XCTAssertEqual(tiles[0].reference.href, "https://flipdisc.io")
    }

    func testDraftSourceTilesNameLocalMoodleFileOrigins() {
        let tiles = LoomDraftSourceTiles.tiles(
            from: [
                LoomDraftReference(
                    label: "Moodle ECON W4 Slides",
                    href: "loom://content/econ/moodle-econ-w4-slides.pptx",
                    kind: "source",
                    sourceTitle: "Moodle ECON W4 Slides"
                ),
                LoomDraftReference(
                    label: "Problem Set 4",
                    href: "loom://content/econ/problem-set-4.pdf",
                    kind: "source",
                    sourceTitle: "Problem Set 4"
                ),
                LoomDraftReference(
                    label: "Week 4 Notes",
                    href: "loom://content/econ/week-4.md",
                    kind: "source",
                    sourceTitle: "Week 4 Notes"
                ),
                LoomDraftReference(
                    label: "Isoquant diagram",
                    href: "loom://content/econ/isoquant.png",
                    kind: "source",
                    sourceTitle: "Isoquant diagram"
                )
            ]
        )

        XCTAssertEqual(tiles.map(\.kindLabel), ["Slide deck", "PDF", "Markdown", "Image"])
        XCTAssertEqual(tiles[0].detail, "Slide deck · Moodle ECON W4 Slides")
        XCTAssertEqual(tiles[1].detail, "PDF · Problem Set 4")
    }

    func testDraftAIPromptIncludesCaptureTimestampContext() {
        let prompt = LoomDraftAIPrompt.buildDraftAIPrompt(
            title: "Flipdisc notes",
            body: "Explain the frame format.",
            references: [
                LoomDraftReference(
                    label: "Flipdisc capture",
                    href: "loom://bundle/loom-render/capture/?root=abc",
                    kind: "capture",
                    sourceTitle: "flipdisc.io",
                    excerpt: "Each frame starts with a start byte.",
                    capturedAt: "2026-05-09T04:14:32.000Z"
                )
            ]
        )

        XCTAssertTrue(prompt.contains("1. Capture: Flipdisc capture"))
        XCTAssertTrue(prompt.contains("source=flipdisc.io"))
        XCTAssertTrue(prompt.contains("capturedAt=2026-05-09T04:14:32.000Z"))
        XCTAssertTrue(prompt.contains("excerpt=Each frame starts with a start byte."))
    }

    func testDraftAIPromptIncludesRawArtifactStateData() {
        let prompt = LoomDraftAIPrompt.buildDraftAIPrompt(
            title: "Frame state",
            body: "Explain how the frame grows.",
            references: [
                LoomDraftReference(
                    label: "Frame Format",
                    href: "loom://capture#frame-format",
                    kind: "artifact-state",
                    sourceTitle: "Flipdisc Display Build and Software Guide",
                    excerpt: "The payload expands at imageData.",
                    artifactState: LoomDraftArtifactState(
                        targetId: "frame-format",
                        kind: "segment-diagram",
                        label: "Frame Format",
                        state: "0x80 -> 0x83 -> 0x01 -> imageData[grow] -> 0x8F",
                        stateLabel: "imageData grows between address and end byte"
                    )
                )
            ]
        )

        XCTAssertTrue(prompt.contains("artifactState=Frame Format · segment-diagram · frame-format · imageData grows between address and end byte"))
        XCTAssertTrue(prompt.contains("artifactStateData=0x80 -> 0x83 -> 0x01 -> imageData[grow] -> 0x8F"))
    }

    func testDraftAIPromptBoundsAttachedSourceContextForSmallLocalProviders() {
        let repeated = String(repeating: "context window filler ", count: 900)
        let prompt = LoomDraftAIPrompt.buildDraftAIPrompt(
            title: "Local provider draft",
            body: "Keep this short user sentence. \(repeated)",
            references: [
                LoomDraftReference(
                    label: "Flipdisc Display Build and Software Guide",
                    href: "https://flipdisc.io",
                    kind: "capture",
                    sourceTitle: "flipdisc.io",
                    excerpt: repeated,
                    artifactState: LoomDraftArtifactState(
                        targetId: "opening-animation",
                        kind: "canvas-replay",
                        label: "Opening animation",
                        state: repeated,
                        stateLabel: nil
                    )
                ),
                LoomDraftReference(
                    label: "ECON 3202",
                    href: "loom://source/econ-3202",
                    kind: "source",
                    excerpt: repeated
                )
            ],
            corpusHits: [
                LoomDraftCorpusHit(
                    title: "Private unrelated source",
                    href: "loom://source/private-unrelated",
                    excerpt: repeated,
                    score: 99
                )
            ]
        )

        XCTAssertLessThanOrEqual(prompt.count, 6000)
        XCTAssertTrue(prompt.contains("Flipdisc Display Build and Software Guide"))
        XCTAssertTrue(prompt.contains("ECON 3202"))
        XCTAssertTrue(prompt.contains("[truncated for provider context]"))
        XCTAssertFalse(prompt.contains(String(repeated.prefix(8000))))
    }

    func testDraftAIPromptIncludesInlineReferenceAnchors() {
        let prompt = LoomDraftAIPrompt.buildDraftAIPrompt(
            title: "Anchored notes",
            body: """
            Compare @moodle-econ-w4-slides:p7 with @thesis-draft.pdf:p23-25.
            Use @meeting-notes-mar-15.md#decisions and @flipdisc-tutorial#floyd-bayer-slider:0.4.
            """,
            references: [
                LoomDraftReference(
                    label: "Moodle ECON W4 Slides",
                    href: "loom://content/econ/moodle-econ-w4-slides.pptx",
                    kind: "source"
                ),
                LoomDraftReference(
                    label: "thesis-draft.pdf",
                    href: "loom://content/research/thesis-draft.pdf",
                    kind: "source"
                ),
                LoomDraftReference(
                    label: "meeting notes Mar 15",
                    href: "loom://content/notes/meeting-notes-mar-15.md",
                    kind: "source"
                ),
                LoomDraftReference(
                    label: "flipdisc tutorial",
                    href: "loom://bundle/loom-render/capture/?root=flipdisc",
                    kind: "capture"
                )
            ]
        )

        XCTAssertTrue(prompt.contains("Inline @references:"))
        XCTAssertTrue(prompt.contains("@moodle-econ-w4-slides:p7 | target=moodle-econ-w4-slides | anchor=slide 7 | source=Moodle ECON W4 Slides | href=loom://content/econ/moodle-econ-w4-slides.pptx"))
        XCTAssertTrue(prompt.contains("@thesis-draft.pdf:p23-25 | target=thesis-draft.pdf | anchor=pages 23-25 | source=thesis-draft.pdf | href=loom://content/research/thesis-draft.pdf"))
        XCTAssertTrue(prompt.contains("@meeting-notes-mar-15.md#decisions | target=meeting-notes-mar-15.md | anchor=heading decisions | source=meeting notes Mar 15 | href=loom://content/notes/meeting-notes-mar-15.md"))
        XCTAssertTrue(prompt.contains("@flipdisc-tutorial#floyd-bayer-slider:0.4 | target=flipdisc-tutorial | anchor=artifact-state floyd-bayer-slider:0.4 | source=flipdisc tutorial | href=loom://bundle/loom-render/capture/?root=flipdisc"))
    }

    func testDraftAIPromptResolvesShortInlineReferenceAliasesWhenUnambiguous() {
        let prompt = LoomDraftAIPrompt.buildDraftAIPrompt(
            title: "Short aliases",
            body: "Use @flipdisc for the frame-format paragraph.\n\nCompare @econ.",
            references: [
                LoomDraftReference(
                    label: "Flipdisc Display Build and Software Guide",
                    href: "https://flipdisc.io",
                    kind: "source"
                ),
                LoomDraftReference(
                    label: "ECON 3202 Week 4 Slides",
                    href: "loom://content/econ/week-4-slides.pptx",
                    kind: "source"
                ),
                LoomDraftReference(
                    label: "ECON 3202 Problem Set",
                    href: "loom://content/econ/problem-set.pdf",
                    kind: "source"
                )
            ]
        )

        XCTAssertTrue(prompt.contains("@flipdisc | target=flipdisc | source=Flipdisc Display Build and Software Guide | href=https://flipdisc.io"))
        XCTAssertTrue(prompt.contains("@econ | target=econ | source=unattached"))
    }

    func testDraftAIPromptIncludesInlineArtifactStateData() {
        let prompt = LoomDraftAIPrompt.buildDraftAIPrompt(
            title: "Frame state",
            body: "Explain @flipdisc-tutorial#frame-format:0.4.",
            references: [
                LoomDraftReference(
                    label: "Frame Format",
                    href: "loom://capture#frame-format",
                    kind: "artifact-state",
                    sourceTitle: "Flipdisc Display Build and Software Guide",
                    artifactState: LoomDraftArtifactState(
                        targetId: "frame-format",
                        kind: "segment-diagram",
                        label: "Frame Format",
                        state: "0x80 -> 0x83 -> 0x01 -> imageData[grow] -> 0x8F",
                        stateLabel: "imageData grows between address and end byte"
                    )
                )
            ]
        )

        XCTAssertTrue(prompt.contains("@flipdisc-tutorial#frame-format:0.4 | target=flipdisc-tutorial | anchor=artifact-state frame-format:0.4 | source=Flipdisc Display Build and Software Guide | href=loom://capture#frame-format"))
        XCTAssertTrue(prompt.contains("artifactState=Frame Format · segment-diagram · frame-format · imageData grows between address and end byte"))
        XCTAssertTrue(prompt.contains("artifactStateData=0x80 -> 0x83 -> 0x01 -> imageData[grow] -> 0x8F"))
    }

    func testDraftAIPromptIncludesWholeCorpusContext() {
        let prompt = LoomDraftAIPrompt.buildDraftAIPrompt(
            title: "Frame draft",
            body: "Compare frame format with RS485 wiring.",
            references: [],
            corpusHits: [
                LoomDraftCorpusHit(
                    title: "RS485 wiring notes",
                    href: "loom://content/infs/rs485-wiring.pdf",
                    category: "Imported local source",
                    excerpt: "Differential signaling and cable length limits.",
                    score: 0.82
                )
            ]
        )

        XCTAssertTrue(prompt.contains("Corpus context:"))
        XCTAssertTrue(prompt.contains("1. Corpus: RS485 wiring notes"))
        XCTAssertTrue(prompt.contains("category=Imported local source"))
        XCTAssertTrue(prompt.contains("href=loom://content/infs/rs485-wiring.pdf"))
        XCTAssertTrue(prompt.contains("excerpt=Differential signaling and cable length limits."))
        XCTAssertTrue(prompt.contains("score=0.82"))
    }

    func testDraftAIPromptIncludesAttachedReferenceLocationMetadata() {
        let prompt = LoomDraftAIPrompt.buildDraftAIPrompt(
            title: "Frame draft",
            body: "Explain the flipdisc frame format.",
            references: [
                LoomDraftReference(
                    label: "Flipdisc guide",
                    href: "/wiki/flipdisc-tutorial",
                    kind: "capture",
                    sourceTitle: "Flipdisc Display Build and Software Guide",
                    category: "Web capture",
                    sourcePath: "Web/flipdisc.io/Loom.md",
                    excerpt: "Frame format keeps byte-level structure."
                )
            ]
        )

        XCTAssertTrue(prompt.contains("1. Capture: Flipdisc guide"))
        XCTAssertTrue(prompt.contains("category=Web capture"))
        XCTAssertTrue(prompt.contains("sourcePath=Web/flipdisc.io/Loom.md"))
    }

    func testDraftAIPromptResolvesInlineReferencesFromCorpusHits() {
        let prompt = LoomDraftAIPrompt.buildDraftAIPrompt(
            title: "Corpus refs",
            body: "Use @flipdisc-tutorial#floyd-bayer-slider:0.4 beside @moodle-econ-w4-slides:p7.",
            references: [],
            corpusHits: [
                LoomDraftCorpusHit(
                    title: "Flipdisc Display Build and Software Guide",
                    href: "/wiki/flipdisc-tutorial",
                    category: "Web capture",
                    sourcePath: "Web/flipdisc.io/Loom.md",
                    score: 0.91
                ),
                LoomDraftCorpusHit(
                    title: "Moodle ECON W4 Slides",
                    href: "loom://content/econ/moodle-econ-w4-slides.pptx",
                    category: "Imported local source",
                    sourcePath: "/Users/yinyiping/Desktop/Knowledge System/UNSW/ECON 3202/W4.pptx",
                    score: 0.75
                )
            ]
        )

        XCTAssertTrue(prompt.contains("@flipdisc-tutorial#floyd-bayer-slider:0.4 | target=flipdisc-tutorial | anchor=artifact-state floyd-bayer-slider:0.4 | source=Corpus: Flipdisc Display Build and Software Guide | href=/wiki/flipdisc-tutorial | category=Web capture | sourcePath=Web/flipdisc.io/Loom.md"))
        XCTAssertTrue(prompt.contains("@moodle-econ-w4-slides:p7 | target=moodle-econ-w4-slides | anchor=slide 7 | source=Corpus: Moodle ECON W4 Slides | href=loom://content/econ/moodle-econ-w4-slides.pptx | category=Imported local source | sourcePath=/Users/yinyiping/Desktop/Knowledge System/UNSW/ECON 3202/W4.pptx"))
    }

    func testDraftAIPromptResolvesShortCorpusAliasesWhenUnambiguous() {
        let prompt = LoomDraftAIPrompt.buildDraftAIPrompt(
            title: "Corpus short aliases",
            body: "Use @flipdisc before drafting the frame section.\n\nCompare @econ.",
            references: [],
            corpusHits: [
                LoomDraftCorpusHit(
                    title: "Flipdisc Display Build and Software Guide",
                    href: "https://flipdisc.io",
                    category: "Web capture",
                    sourcePath: "Web/flipdisc.io/Loom.md"
                ),
                LoomDraftCorpusHit(
                    title: "ECON 3202 Week 4 Slides",
                    href: "loom://content/econ/week-4-slides.pptx",
                    category: "Imported local source",
                    sourcePath: "/Users/yinyiping/Desktop/Knowledge System/UNSW/ECON 3202/W4.pptx"
                ),
                LoomDraftCorpusHit(
                    title: "ECON 3202 Problem Set",
                    href: "loom://content/econ/problem-set.pdf",
                    category: "Imported local source",
                    sourcePath: "/Users/yinyiping/Desktop/Knowledge System/UNSW/ECON 3202/problem-set.pdf"
                )
            ]
        )

        XCTAssertTrue(prompt.contains("@flipdisc | target=flipdisc | source=Corpus: Flipdisc Display Build and Software Guide | href=https://flipdisc.io | category=Web capture | sourcePath=Web/flipdisc.io/Loom.md"))
        XCTAssertTrue(prompt.contains("@econ | target=econ | source=unattached"))
    }

    func testDraftAIPromptCarriesCorpusArtifactStateData() {
        let prompt = LoomDraftAIPrompt.buildDraftAIPrompt(
            title: "Corpus artifact",
            body: "Explain @flipdisc-tutorial#frame-format:0.4.",
            references: [],
            corpusHits: [
                LoomDraftCorpusHit(
                    title: "Flipdisc Display Build and Software Guide",
                    href: "/wiki/flipdisc-tutorial#frame-format",
                    category: "Web capture",
                    sourcePath: "Web/flipdisc.io/Loom.md",
                    score: 0.91,
                    artifactState: LoomDraftArtifactState(
                        targetId: "frame-format",
                        kind: "segment-diagram",
                        label: "Frame Format",
                        state: "0x80 -> 0x83 -> 0x01 -> imageData[grow] -> 0x8F",
                        stateLabel: "imageData grows between address and end byte"
                    )
                )
            ]
        )

        XCTAssertTrue(prompt.contains("1. Corpus: Flipdisc Display Build and Software Guide | category=Web capture | href=/wiki/flipdisc-tutorial#frame-format | sourcePath=Web/flipdisc.io/Loom.md | artifactState=Frame Format · segment-diagram · frame-format · imageData grows between address and end byte | artifactStateData=0x80 -> 0x83 -> 0x01 -> imageData[grow] -> 0x8F | score=0.91"))
        XCTAssertTrue(prompt.contains("@flipdisc-tutorial#frame-format:0.4 | target=flipdisc-tutorial | anchor=artifact-state frame-format:0.4 | source=Corpus: Flipdisc Display Build and Software Guide | href=/wiki/flipdisc-tutorial#frame-format | category=Web capture | sourcePath=Web/flipdisc.io/Loom.md"))
        XCTAssertTrue(prompt.contains("artifactState=Frame Format · segment-diagram · frame-format · imageData grows between address and end byte"))
        XCTAssertTrue(prompt.contains("artifactStateData=0x80 -> 0x83 -> 0x01 -> imageData[grow] -> 0x8F"))
    }

    func testDraftReferenceMentionInsertsTokenAndReference() {
        let doc = AskAIDocRef(
            id: "/wiki/flipdisc-tutorial",
            title: "Flipdisc Display Build and Software Guide",
            href: "/wiki/flipdisc-tutorial",
            category: "Web capture",
            sourcePath: "Web/flipdisc.io/Loom.md"
        )

        XCTAssertEqual(LoomDraftReferenceMention.token(for: doc), "@flipdisc-tutorial")
        XCTAssertEqual(
            LoomDraftReferenceMention.insert(
                into: "Compare ",
                selectedRange: NSRange(location: 8, length: 0),
                doc: doc
            ),
            "Compare @flipdisc-tutorial "
        )
        XCTAssertEqual(
            LoomDraftReferenceMention.reference(for: doc),
            LoomDraftReference(
                label: "Flipdisc Display Build and Software Guide",
                href: "/wiki/flipdisc-tutorial",
                kind: "capture",
                sourceTitle: "Flipdisc Display Build and Software Guide",
                category: "Web capture",
                sourcePath: "Web/flipdisc.io/Loom.md"
            )
        )

        let artifactState = LoomDraftArtifactState(
            targetId: "frame-format",
            kind: "segment-diagram",
            label: "Frame Format",
            state: "0x80 -> 0x83 -> 0x01 -> imageData[grow] -> 0x8F",
            stateLabel: "imageData grows between address and end byte"
        )
        let artifactDoc = AskAIDocRef(
            id: "/wiki/flipdisc-tutorial#frame-format",
            title: "Flipdisc Display Build and Software Guide",
            href: "/wiki/flipdisc-tutorial#frame-format",
            category: "Web capture",
            sourcePath: "Web/flipdisc.io/Loom.md",
            artifactState: artifactState
        )

        XCTAssertEqual(LoomDraftReferenceMention.token(for: artifactDoc), "@flipdisc-tutorial#frame-format:state")
        XCTAssertEqual(
            LoomDraftReferenceMention.insert(
                into: "Compare ",
                selectedRange: NSRange(location: 8, length: 0),
                doc: artifactDoc
            ),
            "Compare @flipdisc-tutorial#frame-format:state "
        )
        XCTAssertEqual(
            LoomDraftReferenceMention.reference(for: artifactDoc),
            LoomDraftReference(
                label: "Flipdisc Display Build and Software Guide",
                href: "/wiki/flipdisc-tutorial#frame-format",
                kind: "artifact-state",
                sourceTitle: "Flipdisc Display Build and Software Guide",
                category: "Web capture",
                sourcePath: "Web/flipdisc.io/Loom.md",
                artifactState: artifactState
            )
        )
    }

    func testActiveDraftReferenceMentionQueryAndRanking() {
        let active = LoomDraftReferenceMention.activeQuery(
            in: "Compare @flip",
            selectedRange: NSRange(location: 13, length: 0)
        )
        XCTAssertEqual(active?.range, NSRange(location: 8, length: 5))
        XCTAssertEqual(active?.query, "flip")

        XCTAssertNil(
            LoomDraftReferenceMention.activeQuery(
                in: "Contact me@example.com",
                selectedRange: NSRange(location: 22, length: 0)
            )
        )
        XCTAssertNil(
            LoomDraftReferenceMention.activeQuery(
                in: "Use @flipdisc, then write",
                selectedRange: NSRange(location: 15, length: 0)
            )
        )

        let docs = [
            AskAIDocRef(
                id: "/wiki/display-hardware",
                title: "Display Hardware Basics",
                href: "/wiki/display-hardware",
                category: "Imported local source"
            ),
            AskAIDocRef(
                id: "/wiki/flipdisc-tutorial",
                title: "Flipdisc Display Build and Software Guide",
                href: "/wiki/flipdisc-tutorial",
                category: "Web capture"
            ),
            AskAIDocRef(
                id: "/wiki/multimodal",
                title: "Multimodal · LLM Wiki",
                href: "/wiki/multimodal",
                category: "LLM Wiki"
            )
        ]

        XCTAssertEqual(
            LoomDraftReferenceMention.rank(query: "flip", docs: docs).map(\.href),
            ["/wiki/flipdisc-tutorial"]
        )
        XCTAssertEqual(
            LoomDraftReferenceMention.rank(query: "display", docs: docs).map(\.href),
            ["/wiki/display-hardware", "/wiki/flipdisc-tutorial"]
        )
        XCTAssertEqual(
            LoomDraftReferenceMention.rank(
                query: "imageData",
                docs: docs + [
                    AskAIDocRef(
                        id: "/wiki/flipdisc-tutorial#frame-format",
                        title: "Flipdisc Display Build and Software Guide",
                        href: "/wiki/flipdisc-tutorial#frame-format",
                        category: "Web capture",
                        artifactState: LoomDraftArtifactState(
                            targetId: "frame-format",
                            kind: "segment-diagram",
                            label: "Frame Format",
                            state: "0x80 -> 0x83 -> 0x01 -> imageData[grow] -> 0x8F",
                            stateLabel: "imageData grows between address and end byte"
                        )
                    )
                ]
            ).map(\.href),
            ["/wiki/flipdisc-tutorial#frame-format"]
        )
        XCTAssertEqual(
            LoomDraftReferenceMention.rank(
                query: "flip",
                docs: docs,
                alreadyReferenced: Set(["/wiki/flipdisc-tutorial"])
            ),
            []
        )
    }

    func testDraftReferenceMentionPredictsNextReferences() {
        let docs = [
            AskAIDocRef(
                id: "/wiki/flipdisc-tutorial",
                title: "Flipdisc Display Build and Software Guide",
                href: "/wiki/flipdisc-tutorial",
                category: "Web capture"
            ),
            AskAIDocRef(
                id: "/wiki/rs485-wiring",
                title: "RS485 Wiring Limits",
                href: "/wiki/rs485-wiring",
                category: "Imported local source"
            ),
            AskAIDocRef(
                id: "/wiki/multimodal",
                title: "Multimodal · LLM Wiki",
                href: "/wiki/multimodal",
                category: "LLM Wiki"
            )
        ]

        let predictions = LoomDraftReferenceMention.predictNext(
            title: "Frame format notes",
            body: "Compare the display frame format with RS485 wiring before explaining cable length.",
            docs: docs,
            alreadyReferenced: Set(["/wiki/flipdisc-tutorial"]),
            limit: 2
        )

        XCTAssertEqual(predictions.map(\.href), ["/wiki/rs485-wiring"])
        XCTAssertEqual(LoomDraftReferenceMention.token(for: predictions[0]), "@rs485-wiring")
        XCTAssertEqual(
            LoomDraftReferenceMention.predictNext(title: "", body: "", docs: docs),
            []
        )
    }

    func testDocReferenceIndexParsesNativeBundleSearchIndex() throws {
        // `load()` is now an async URLSession fetch from
        // `loom://bundle/search-index.json`; the corpus-shaping logic lives in
        // the pure `parse(_:)` helper, which is what this exercises (entries
        // without an href are dropped; the rest sort by title).
        let payload = """
        {
          "index": {
            "storedFields": {
              "flipdisc": {
                "title": "Flipdisc Display Build and Software Guide",
                "href": "/wiki/flipdisc-tutorial",
                "category": "Web capture"
              },
              "missingHref": {
                "title": "Ignored"
              }
            }
          }
        }
        """

        let docs = AskAIDocReferenceIndex.parse(Data(payload.utf8))

        XCTAssertEqual(docs, [
            AskAIDocRef(
                id: "/wiki/flipdisc-tutorial",
                title: "Flipdisc Display Build and Software Guide",
                href: "/wiki/flipdisc-tutorial",
                category: "Web capture"
            )
        ])
    }

    func testDraftInlineEditPromptAndApplyReplaceOnlySelectedPassage() throws {
        let body = "Opening claim.\n\nThis sentence is vague and too long.\n\nClosing claim."
        let original = "This sentence is vague and too long."
        let replacement = "This sentence is precise."
        let range = (body as NSString).range(of: original)
        let references = [
            LoomDraftReference(
                label: "Flipdisc guide",
                href: "loom://content/flipdisc-guide",
                sourceTitle: "Flipdisc Display Build and Software Guide",
                category: "Web capture",
                sourcePath: "Web/flipdisc.io/Loom.md",
                excerpt: "Frames should preserve byte structure."
            )
        ]

        let prompt = LoomDraftInlineEdit.buildPrompt(
            title: "Frame draft",
            body: body,
            selectedText: original,
            references: references
        )
        let applied = LoomDraftInlineEdit.apply(
            body: body,
            range: range,
            original: original,
            replacement: replacement
        )
        let blank = LoomDraftInlineEdit.apply(
            body: body,
            range: range,
            original: original,
            replacement: "   "
        )
        let stale = LoomDraftInlineEdit.apply(
            body: body,
            range: range,
            original: "Different selected text",
            replacement: replacement
        )

        XCTAssertTrue(prompt.contains("Inline edit request:"))
        XCTAssertTrue(prompt.contains("Selected passage:\n\(original)"))
        XCTAssertTrue(prompt.contains("Attached references:\n1. Source: Flipdisc guide"))
        XCTAssertTrue(prompt.contains("category=Web capture"))
        XCTAssertTrue(prompt.contains("sourcePath=Web/flipdisc.io/Loom.md"))
        XCTAssertTrue(prompt.contains("Return only the replacement text for the selected passage."))
        XCTAssertEqual(applied, "Opening claim.\n\nThis sentence is precise.\n\nClosing claim.")
        XCTAssertEqual(blank, body)
        XCTAssertEqual(stale, body)
    }

    func testDraftInlineEditPromptIncludesRawArtifactStateData() {
        let prompt = LoomDraftInlineEdit.buildPrompt(
            title: "Frame draft",
            body: "Explain the byte frame.",
            selectedText: "The payload changes shape.",
            references: [
                LoomDraftReference(
                    label: "Frame Format",
                    href: "loom://capture#frame-format",
                    kind: "artifact-state",
                    sourceTitle: "Flipdisc Display Build and Software Guide",
                    excerpt: "The payload expands at imageData.",
                    artifactState: LoomDraftArtifactState(
                        targetId: "frame-format",
                        kind: "segment-diagram",
                        label: "Frame Format",
                        state: "0x80 -> 0x83 -> 0x01 -> imageData[grow] -> 0x8F",
                        stateLabel: "imageData grows between address and end byte"
                    )
                )
            ]
        )

        XCTAssertTrue(prompt.contains("artifactState=Frame Format · segment-diagram · frame-format · imageData grows between address and end byte"))
        XCTAssertTrue(prompt.contains("artifactStateData=0x80 -> 0x83 -> 0x01 -> imageData[grow] -> 0x8F"))
    }

    func testDraftInlineEditPromptBoundsSourceContextForSmallLocalProviders() {
        let repeated = String(repeating: "inline provider context filler ", count: 900)
        let prompt = LoomDraftInlineEdit.buildPrompt(
            title: "Inline provider draft",
            body: "Opening sentence.\n\nRewrite @flipdisc-guide:p2 with care. \(repeated)",
            selectedText: "Rewrite this selected passage. \(repeated)",
            references: [
                LoomDraftReference(
                    label: "Flipdisc Display Build and Software Guide",
                    href: "https://flipdisc.io",
                    kind: "capture",
                    sourceTitle: "flipdisc.io",
                    excerpt: repeated
                ),
                LoomDraftReference(
                    label: "ECON 3202",
                    href: "loom://source/econ-3202",
                    kind: "source",
                    excerpt: repeated
                )
            ],
            corpusHits: [
                LoomDraftCorpusHit(
                    title: "Private unrelated source",
                    href: "loom://source/private-unrelated",
                    excerpt: repeated,
                    score: 88
                )
            ]
        )

        XCTAssertLessThanOrEqual(prompt.count, 6000)
        XCTAssertTrue(prompt.contains("Inline edit request:"))
        XCTAssertTrue(prompt.contains("Selected passage:"))
        XCTAssertTrue(prompt.contains("Flipdisc Display Build and Software Guide"))
        XCTAssertTrue(prompt.contains("ECON 3202"))
        XCTAssertTrue(prompt.contains("[truncated for provider context]"))
        XCTAssertTrue(prompt.contains("Return only the replacement text for the selected passage."))
        XCTAssertFalse(prompt.contains(String(repeated.prefix(8000))))
    }

    func testDraftInlineEditBuildsReviewableDiffHunks() {
        let hunks = LoomDraftInlineEdit.diffHunks(
            original: [
                "Opening claim.",
                "This sentence is vague.",
                "Keep this evidence.",
                "Old caveat."
            ].joined(separator: "\n"),
            replacement: [
                "Opening claim.",
                "This sentence is precise.",
                "Keep this evidence.",
                "Source caveat."
            ].joined(separator: "\n")
        )

        XCTAssertEqual(
            hunks,
            [
                LoomDraftInlineEditDiffHunk(kind: "unchanged", text: "Opening claim."),
                LoomDraftInlineEditDiffHunk(kind: "removed", text: "This sentence is vague."),
                LoomDraftInlineEditDiffHunk(kind: "added", text: "This sentence is precise."),
                LoomDraftInlineEditDiffHunk(kind: "unchanged", text: "Keep this evidence."),
                LoomDraftInlineEditDiffHunk(kind: "removed", text: "Old caveat."),
                LoomDraftInlineEditDiffHunk(kind: "added", text: "Source caveat.")
            ]
        )
        XCTAssertEqual(
            LoomDraftInlineEdit.diffHunks(original: "Same text", replacement: "Same text"),
            [LoomDraftInlineEditDiffHunk(kind: "unchanged", text: "Same text")]
        )
        XCTAssertEqual(
            LoomDraftInlineEdit.diffHunks(original: "Original text", replacement: "   "),
            []
        )
    }

    func testThinkingDraftSplitsMarkdownIntoReviewableBlocks() {
        let references = [
            LoomDraftReference(
                label: "Flipdisc guide",
                href: "loom://capture/flipdisc",
                excerpt: "Frame format starts with a start byte."
            )
        ]
        let blocks = LoomThinkingDraft.blocks(
            body: """
            # Frame plan

            Frame format starts with a start byte. Keep this sourced claim.

            - Check RS485 wiring
            - Confirm address byte

            > Source caveat belongs beside the claim.
            """,
            references: references
        )

        XCTAssertEqual(
            blocks.map { block in
                [
                    block.id,
                    block.kind,
                    block.text,
                    String(block.wordCount),
                    block.referenceHrefs.joined(separator: ",")
                ].joined(separator: "|")
            },
            [
                "heading-frame-plan|heading|# Frame plan|2|",
                "paragraph-frame-format-starts-with-a-start-byte|paragraph|Frame format starts with a start byte. Keep this sourced claim.|11|loom://capture/flipdisc",
                "list-check-rs485-wiring|list|- Check RS485 wiring\n- Confirm address byte|6|",
                "quote-source-caveat-belongs-beside-the-claim|quote|> Source caveat belongs beside the claim.|6|"
            ]
        )
    }

    func testThinkingDraftCountsExplicitReferenceTokensAsBlockReferences() {
        let references = [
            LoomDraftReference(
                label: "Flipdisc Display Build and Software Guide",
                href: "/wiki/flipdisc-tutorial",
                sourceTitle: "Flipdisc Display Build and Software Guide"
            ),
            LoomDraftReference(
                label: "Frame Format",
                href: "/wiki/flipdisc-tutorial#frame-format",
                kind: "artifact-state",
                sourceTitle: "Flipdisc Display Build and Software Guide",
                artifactState: LoomDraftArtifactState(
                    targetId: "frame-format",
                    kind: "segment-diagram",
                    label: "Frame Format",
                    state: nil,
                    stateLabel: "imageData grows between address and end byte"
                )
            )
        ]
        let body = """
        Use @flipdisc-tutorial to establish the display context.

        Then cite @flipdisc-tutorial#frame-format:state for the byte layout.
        """

        let blocks = LoomThinkingDraft.blocks(body: body, references: references)

        XCTAssertEqual(
            blocks.map(\.referenceHrefs),
            [
                ["/wiki/flipdisc-tutorial"],
                ["/wiki/flipdisc-tutorial#frame-format"]
            ]
        )
    }

    func testThinkingDraftLabelsBlockReferencesForStructurePanels() {
        let references = [
            LoomDraftReference(
                label: "Flipdisc Display Build and Software Guide",
                href: "/wiki/flipdisc-tutorial",
                sourceTitle: "Flipdisc Display Build and Software Guide"
            ),
            LoomDraftReference(
                label: "Frame Format",
                href: "/wiki/flipdisc-tutorial#frame-format",
                kind: "artifact-state",
                sourceTitle: "Flipdisc Display Build and Software Guide",
                artifactState: LoomDraftArtifactState(
                    targetId: "frame-format",
                    kind: "segment-diagram",
                    label: "Frame Format",
                    state: nil,
                    stateLabel: "imageData grows between address and end byte"
                )
            )
        ]
        let body = """
        Use @flipdisc-tutorial to establish the display context.

        Then cite @flipdisc-tutorial#frame-format:state for the byte layout.
        """
        let blocks = LoomThinkingDraft.blocks(body: body, references: references)

        XCTAssertEqual(
            LoomThinkingDraft.referenceLabels(for: blocks[0], references: references),
            ["Flipdisc Display Build and Software Guide"]
        )
        XCTAssertEqual(
            LoomThinkingDraft.referenceLabels(for: blocks[1], references: references),
            ["Frame Format · artifact state"]
        )
    }

    func testThinkingDraftAppliesBlockEditsOnlyWhenReviewedBlockStillMatches() {
        let body = """
        # Frame plan

        This paragraph is vague.

        Keep this paragraph.
        """

        XCTAssertEqual(
            LoomThinkingDraft.applyBlockEdit(
                body: body,
                blockID: "paragraph-this-paragraph-is-vague",
                original: "This paragraph is vague.",
                replacement: "This paragraph names the frame address byte."
            ),
            """
            # Frame plan

            This paragraph names the frame address byte.

            Keep this paragraph.
            """
        )
        XCTAssertEqual(
            LoomThinkingDraft.applyBlockEdit(
                body: body,
                blockID: "paragraph-this-paragraph-is-vague",
                original: "A stale paragraph.",
                replacement: "Should not apply."
            ),
            body
        )
        XCTAssertEqual(
            LoomThinkingDraft.applyBlockEdit(
                body: body,
                blockID: "paragraph-missing",
                original: "This paragraph is vague.",
                replacement: "Should not apply."
            ),
            body
        )
    }

    func testThinkingDraftAppliesMultiBlockOperationsOnlyWhenReviewedBlocksStillMatch() {
        let body = """
        # Frame plan

        This paragraph is vague.

        This paragraph repeats the same uncertainty.

        Keep this paragraph.
        """
        let replacement = "This section names the frame address byte and removes the repeated uncertainty."

        XCTAssertEqual(
            LoomThinkingDraft.applyBlockOperation(
                body: body,
                blockIDs: [
                    "paragraph-this-paragraph-is-vague",
                    "paragraph-this-paragraph-repeats-the-same-uncertainty"
                ],
                originals: [
                    "This paragraph is vague.",
                    "This paragraph repeats the same uncertainty."
                ],
                replacement: replacement
            ),
            """
            # Frame plan

            \(replacement)

            Keep this paragraph.
            """
        )
        XCTAssertEqual(
            LoomThinkingDraft.applyBlockOperation(
                body: body,
                blockIDs: [
                    "paragraph-this-paragraph-is-vague",
                    "paragraph-this-paragraph-repeats-the-same-uncertainty"
                ],
                originals: [
                    "This paragraph is vague.",
                    "A stale paragraph."
                ],
                replacement: replacement
            ),
            body
        )
        XCTAssertEqual(
            LoomThinkingDraft.applyBlockOperation(
                body: body,
                blockIDs: [
                    "paragraph-this-paragraph-is-vague",
                    "paragraph-keep-this-paragraph"
                ],
                originals: [
                    "This paragraph is vague.",
                    "Keep this paragraph."
                ],
                replacement: replacement
            ),
            body
        )
    }

    func testThinkingDraftBuildsReviewableDiffForBlockOperationsBeforeApply() {
        let body = """
        # Frame plan

        This paragraph is vague.

        This paragraph repeats the same uncertainty.

        Keep this paragraph.
        """
        let blocks = Array(LoomThinkingDraft.blocks(body: body)[1...2])

        XCTAssertEqual(
            LoomThinkingDraft.operationDiffHunks(
                blocks: blocks,
                replacement: "This section names the frame address byte and removes the repeated uncertainty."
            ),
            [
                LoomDraftInlineEditDiffHunk(kind: "removed", text: "This paragraph is vague."),
                LoomDraftInlineEditDiffHunk(kind: "removed", text: "This paragraph repeats the same uncertainty."),
                LoomDraftInlineEditDiffHunk(
                    kind: "added",
                    text: "This section names the frame address byte and removes the repeated uncertainty."
                )
            ]
        )
        XCTAssertEqual(
            LoomThinkingDraft.operationDiffHunks(blocks: blocks, replacement: "   "),
            []
        )
    }

    func testDraftFromTagCommandAndPromptUseLiteralLabels() throws {
        let command = try XCTUnwrap(LoomDraftFromTag.parseCommand(body: "/draft from #unclear"))
        XCTAssertEqual(command.token, "/draft from #unclear")
        XCTAssertEqual(command.tag, "unclear")
        XCTAssertEqual(command.kind, "fog")
        XCTAssertEqual(command.label, "Unclear")

        let cards = [
            LoomDraftFromTag.TaggedCard(
                kind: "fog",
                title: "Ambiguous claim",
                body: "This mechanism is unclear.",
                source: "Reader note"
            ),
            LoomDraftFromTag.TaggedCard(
                kind: "question",
                title: "Ignored",
                body: "Why?",
                source: "Draft board"
            )
        ]
        let lines = LoomDraftFromTag.promptLines(command: command, cards: cards)

        XCTAssertEqual(lines.count, 1)
        XCTAssertTrue(lines[0].contains("1. Unclear: Ambiguous claim"))
        XCTAssertTrue(lines[0].contains("source=Reader note"))
        XCTAssertTrue(lines[0].contains("body=This mechanism is unclear."))
        XCTAssertFalse(lines.joined(separator: "\n").contains("Question: Ignored"))
        XCTAssertFalse(lines.joined(separator: "\n").contains("fog"))

        let prompt = LoomDraftFromTag.buildPrompt(
            title: "Draft",
            body: "/draft from #unclear",
            command: command,
            cards: cards
        )

        XCTAssertTrue(prompt.contains("Draft from tag: Unclear"))
        XCTAssertTrue(prompt.contains("Current draft:\n/draft from #unclear"))
        XCTAssertTrue(prompt.contains("Tagged draft cards:\n1. Unclear: Ambiguous claim"))
        XCTAssertTrue(prompt.contains("Return only draft text that can be inserted into the body."))
    }
}

final class LoomCompilePipelineTests: XCTestCase {
    // MARK: - Compile pipeline (plans/compile-pipeline-mvp.md)

    private static let lectureMD = """
    # ECON 3202

    ## Lecture 3.pdf

    损失函数是 x² + y²，梯度是偏导数，沿负方向走一步。学习率太小慢，太大震荡。

    ### Ask · 2026-05-01 14:20
    → 梯度给出最陡上升方向，取负就是下降。
    """

    func testCompilePromptMirrorsScratchLanguageAndBoundsContext() {
        let scratch = SourceFileView.scratchForSource(file: "Lecture 3.pdf", in: Self.lectureMD)
        let askHistory = SourceFileView.archivedAskHistory(file: "Lecture 3.pdf", in: Self.lectureMD)
        // Large source to exercise the 6k bound.
        let bigSource = String(repeating: "English source sentence. ", count: 1000)
        let prompt = LoomCompilePipeline.buildPrompt(
            scratch: scratch,
            sourceExcerpt: bigSource,
            priorNotes: nil,
            askHistory: askHistory
        )
        // Chinese scratch is carried verbatim so the system prompt mirrors
        // the user's language even though the source is English.
        XCTAssertTrue(prompt.contains("损失函数是"), "scratch should ride the prompt verbatim")
        XCTAssertTrue(prompt.contains("SCRATCH"))
        XCTAssertTrue(prompt.contains("SOURCE EXCERPT"))
        // Source is bounded to the 6k char budget.
        XCTAssertLessThanOrEqual(
            prompt.count,
            scratch.count + LoomCompilePipeline.sourceCharBudget + 4000
        )
    }

    func testCompileWritebackReplacesPerSourceCompiledSection() {
        let withFirst = SourceFileView.upsertCompiledSection(
            artifact: "First compiled output.",
            file: "Lecture 3.pdf",
            sourceURL: URL(string: "loom://content/abc/Lecture%203.pdf"),
            in: Self.lectureMD,
            partial: false,
            now: Date(timeIntervalSince1970: 1)
        )
        XCTAssertTrue(withFirst.contains("### Compiled ·"))
        XCTAssertTrue(withFirst.contains("First compiled output."))

        let withSecond = SourceFileView.upsertCompiledSection(
            artifact: "Second compiled output.",
            file: "Lecture 3.pdf",
            sourceURL: URL(string: "loom://content/abc/Lecture%203.pdf"),
            in: withFirst,
            partial: false,
            now: Date(timeIntervalSince1970: 2)
        )
        // Re-compile replaces (latest-only).
        XCTAssertFalse(withSecond.contains("First compiled output."))
        XCTAssertTrue(withSecond.contains("Second compiled output."))
        // Only one compiled section remains.
        let count = withSecond.components(separatedBy: "### Compiled ·").count - 1
        XCTAssertEqual(count, 1)
    }

    func testCompileDetectionIsScopedToSourceSection() {
        let md = """
        # Page

        ## A.pdf

        Some scratch about A that is more than thirty characters long here.

        ### Compiled · 2026-05-01 10:00

        Compiled A.

        ## B.pdf

        Some scratch about B that is more than thirty characters long here.
        """
        XCTAssertTrue(SourceFileView.hasCompiledSection(file: "A.pdf", in: md))
        // B.pdf has no compiled section — detection must not bleed across.
        XCTAssertFalse(SourceFileView.hasCompiledSection(file: "B.pdf", in: md))
    }

    func testCompileErrorMessageNormalizesRateLimitAndKeepsProviderSetupErrors() {
        struct RateError: LocalizedError {
            var errorDescription: String? { "HTTP 429 rate limit exceeded" }
        }
        struct SetupError: LocalizedError {
            var errorDescription: String? { "No API key configured in Settings" }
        }
        XCTAssertEqual(
            SourceFileView.compileErrorMessage(RateError()),
            "AI provider rate-limited. Try a different provider in Settings, or wait."
        )
        XCTAssertEqual(
            SourceFileView.compileErrorMessage(SetupError()),
            "No API key configured in Settings"
        )
    }

    func testCompileFirstPulseRequiresFiftyWordsAndNoCompiledSection() {
        let fortyWords = Array(repeating: "word", count: 40).joined(separator: " ")
        let sixtyWords = Array(repeating: "word", count: 60).joined(separator: " ")
        // < 50 words → no pulse.
        XCTAssertFalse(SourceFileView.shouldShowFirstCompilePulse(
            scratch: fortyWords, hasCompiledSection: false, pulseDismissed: false))
        // ≥ 50 words, never compiled, not dismissed → pulse.
        XCTAssertTrue(SourceFileView.shouldShowFirstCompilePulse(
            scratch: sixtyWords, hasCompiledSection: false, pulseDismissed: false))
        // Already compiled → no pulse.
        XCTAssertFalse(SourceFileView.shouldShowFirstCompilePulse(
            scratch: sixtyWords, hasCompiledSection: true, pulseDismissed: false))
        // Dismissed → never returns.
        XCTAssertFalse(SourceFileView.shouldShowFirstCompilePulse(
            scratch: sixtyWords, hasCompiledSection: false, pulseDismissed: true))
    }

    func testCompileSourceNoticeOnlyAppearsWhenSourceUnavailable() {
        XCTAssertEqual(
            SourceFileView.compileSourceNotice(sourceExcerpt: nil),
            "Source file unavailable; compiled from notes only."
        )
        XCTAssertNil(SourceFileView.compileSourceNotice(sourceExcerpt: "Some source text"))
    }

    func testCompilePreviewConsumesRevealMarkersAndSummarizesShape() {
        let markdown = """
        **The loss surface**

        $$ f(x, y) = x^2 + y^2 $$

        [term: gradient | The vector of partial derivatives]

        - Step one
        - Step two
        """
        let artifact = SourceFileView.compilePreviewArtifact(markdown: markdown)
        // Reveal marker is consumed: the term name survives, the marker does not.
        XCTAssertTrue(artifact.body.contains("gradient"))
        XCTAssertFalse(artifact.body.contains("[term:"))
        // Plain-markdown render strips emphasis/list markers.
        XCTAssertTrue(artifact.body.contains("The loss surface"))
        XCTAssertFalse(artifact.body.contains("**"))
        XCTAssertNil(artifact.notice)
    }

    func testCompilePreviewMalformedStructuredOutputFallsBackToPlainMarkdown() {
        // Unclosed math block → malformed structured output.
        let markdown = "Some intro $$ f(x) = x^2 with no closing fence"
        let artifact = SourceFileView.compilePreviewArtifact(markdown: markdown)
        XCTAssertEqual(artifact.notice, "Output rendered without typesetting.")
        XCTAssertTrue(artifact.body.contains("Some intro"))
    }

    func testCompilePreviewTurnsUnsupportedMarkersIntoInlineAnnotations() {
        let markdown = """
        The model converges quickly (unsupported).

        [user noted both X=Y earlier and X=Z later]
        """
        let artifact = SourceFileView.compilePreviewArtifact(markdown: markdown)
        XCTAssertEqual(artifact.unsupportedCount, 1)
        XCTAssertEqual(artifact.contradictionCount, 1)
        XCTAssertTrue(artifact.annotations.contains { $0.contains("Unsupported claim") })
        XCTAssertTrue(artifact.annotations.contains { $0.contains("Contradictory thinking") })
        // The contradiction annotation body strips the wrapper.
        let body = SourceFileView.compilePreviewContradictionAnnotationBody(
            "[user noted both X=Y earlier and X=Z later]"
        )
        XCTAssertEqual(body, "X=Y earlier and X=Z later")
    }
}
