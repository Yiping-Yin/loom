import XCTest
@testable import Loom

/// Wiki-migration steps 4/5: the native spine decoder + the capture chain's
/// pure pieces. The manifest shape is a cross-boundary contract with
/// scripts/build-wiki-manifest.ts (pinned there by tests/wiki-manifest.test.ts).
final class WikiCurriculumTests: XCTestCase {

    private let fixture = """
    {
      "generatedFrom": "lib/nav.ts",
      "version": 1,
      "sections": ["Start", "Finetuning"],
      "chapters": [
        { "slug": "llm101n", "title": "LLM101n Overview", "section": "Start",
          "order": 0, "positionInSection": 1, "sectionSize": 1, "href": "/wiki/llm101n" },
        { "slug": "lora", "title": "13 · LoRA", "section": "Finetuning",
          "order": 1, "positionInSection": 1, "sectionSize": 2, "href": "/wiki/lora" },
        { "slug": "dpo", "title": "DPO", "section": "Finetuning",
          "order": 2, "positionInSection": 2, "sectionSize": 2, "href": "/wiki/dpo" }
      ]
    }
    """

    func testManifestDecodesAndRefusesFutureVersions() throws {
        let manifest = try WikiCurriculum.load(from: Data(fixture.utf8))
        XCTAssertEqual(manifest.chapters.count, 3)
        XCTAssertEqual(manifest.sections, ["Start", "Finetuning"])

        let future = fixture.replacingOccurrences(of: "\"version\": 1", with: "\"version\": 2")
        XCTAssertThrowsError(try WikiCurriculum.load(from: Data(future.utf8)))
    }

    func testRailSectionsGroupBySectionInManifestOrderChaptersInReadingOrder() throws {
        let manifest = try WikiCurriculum.load(from: Data(fixture.utf8))
        let rail = WikiCurriculum.railSections(in: manifest)
        XCTAssertEqual(rail.map(\.section), ["Start", "Finetuning"], "sections in manifest order")
        XCTAssertEqual(rail[0].chapters.map(\.slug), ["llm101n"])
        XCTAssertEqual(rail[1].chapters.map(\.slug), ["lora", "dpo"], "chapters in reading order")
    }

    func testRomanFolioAndFolioLine() throws {
        XCTAssertEqual(WikiCurriculum.romanFolio(1), "i")
        XCTAssertEqual(WikiCurriculum.romanFolio(3), "iii")
        XCTAssertEqual(WikiCurriculum.romanFolio(4), "iv")
        XCTAssertEqual(WikiCurriculum.romanFolio(9), "ix")
        XCTAssertEqual(WikiCurriculum.romanFolio(14), "xiv")

        let manifest = try WikiCurriculum.load(from: Data(fixture.utf8))
        XCTAssertEqual(WikiCurriculum.folioLine(for: manifest.chapters[2]), "finetuning · ii of ii")
    }

    func testNeighborsWalkTheSpineWithNilEdges() throws {
        let manifest = try WikiCurriculum.load(from: Data(fixture.utf8))
        let first = WikiCurriculum.neighbors(of: "llm101n", in: manifest)
        XCTAssertNil(first.prev)
        XCTAssertEqual(first.next?.slug, "lora")
        let last = WikiCurriculum.neighbors(of: "dpo", in: manifest)
        XCTAssertEqual(last.prev?.slug, "lora")
        XCTAssertNil(last.next)
        let unknown = WikiCurriculum.neighbors(of: "nope", in: manifest)
        XCTAssertNil(unknown.prev)
        XCTAssertNil(unknown.next)
    }

    func testWikiCapturePayloadBuilderShapesTitleURLAndLanding() throws {
        let payload = NavigationBridgeHandler.makeWikiCapturePayload(
            selection: "  The reward model disappears.  ",
            slug: "dpo",
            articleTitle: "DPO",
            sectionHeading: "Key idea",
            fragment: "key-idea"
        )
        let unwrapped = try XCTUnwrap(payload)
        XCTAssertEqual(unwrapped.title, "DPO § Key idea")
        XCTAssertEqual(unwrapped.url, "loom://bundle/wiki/dpo.html#key-idea")
        XCTAssertEqual(unwrapped.selection, "The reward model disappears.")
        // Landing fix (design graft ③): bundled wiki pages land Web/wiki/,
        // never a "bundle" pseudo-domain.
        XCTAssertEqual(unwrapped.domain, "wiki")

        XCTAssertNil(NavigationBridgeHandler.makeWikiCapturePayload(
            selection: "   ", slug: "dpo", articleTitle: "DPO",
            sectionHeading: nil, fragment: nil))
        XCTAssertNil(NavigationBridgeHandler.makeWikiCapturePayload(
            selection: "text", slug: "", articleTitle: "DPO",
            sectionHeading: nil, fragment: nil))
    }

    func testWikiAnchorLabelReadsAsBookVocabulary() {
        let anchor = CaptureAnchor.web(
            rootID: UUID(), rootLabel: "Study",
            domain: "wiki",
            sourceURL: "loom://bundle/wiki/dpo.html#key-idea",
            title: "DPO § Key idea"
        )
        XCTAssertEqual(anchor.label, "Wiki · DPO § Key idea")
        XCTAssertEqual(anchor.pathHint, "Web / wiki / Loom.md")
    }

    func testWikiAnchorParagraphIsRecognizedAsEvidence() {
        // Wiki quotes carry loom://anchor links like PDF quotes do — the
        // evidence-altitude detector accepts them with no special casing.
        let storage = NSTextStorage(string: "A quoted derivation ◇")
        storage.addAttribute(
            .link,
            value: "loom://anchor?src=wiki/dpo&frag=key-idea",
            range: NSRange(location: storage.length - 1, length: 1)
        )
        XCTAssertTrue(ReflectionDocumentFormat.isAnchorParagraph(storage, at: 0))
    }
}
