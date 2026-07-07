import XCTest
@testable import Loom

/// The pure paragraph-intent grammar that lets the composer dissolve into the
/// document: classify a paragraph's intent from its leading token, and stamp a
/// paragraph with an intent (the gutter type-namer's only write). Tokens are
/// text so they survive RTFD; the renderer reads the same grammar.
final class ParagraphIntentTests: XCTestCase {
    typealias F = ReflectionDocumentFormat

    // MARK: classify
    func testPlainParagraphIsMeaning() {
        XCTAssertEqual(F.paragraphIntent(of: "The order book is a record of commitments."), .meaning)
    }
    func testQuestionPrefixIsQuestion() {
        XCTAssertEqual(F.paragraphIntent(of: "\u{2753} Where does discretion live?"), .question)
    }
    func testPrinciplePrefixIsPrinciple() {
        XCTAssertEqual(F.paragraphIntent(of: "principle: read the withdrawal, not the quote"), .principle)
    }
    func testCorrectionPrefixIsCorrectionCaseInsensitive() {
        XCTAssertEqual(F.paragraphIntent(of: "Correction: latency is not the primitive"), .correction)
    }
    func testLeadingWhitespaceStillClassifies() {
        XCTAssertEqual(F.paragraphIntent(of: "   \u{2753} why?"), .question)
    }

    // MARK: stamp
    func testStampMeaningAsQuestionAddsToken() {
        XCTAssertEqual(F.stampParagraph("Foo", as: .question), "\u{2753} Foo")
    }
    func testStampMeaningAsPrinciple() {
        XCTAssertEqual(F.stampParagraph("Foo", as: .principle), "principle: Foo")
    }
    func testStampQuestionBackToMeaningStripsToken() {
        XCTAssertEqual(F.stampParagraph("\u{2753} Foo", as: .meaning), "Foo")
    }
    func testReStampPrincipleAsQuestion() {
        XCTAssertEqual(F.stampParagraph("principle: Foo", as: .question), "\u{2753} Foo")
    }
    func testStampSameIntentIsIdempotent() {
        XCTAssertEqual(F.stampParagraph("\u{2753} Foo", as: .question), "\u{2753} Foo")
    }
    func testStampMeaningAsMeaningIsNoop() {
        XCTAssertEqual(F.stampParagraph("Foo", as: .meaning), "Foo")
    }
    func testStampPreservesLeadingWhitespace() {
        XCTAssertEqual(F.stampParagraph("  Foo", as: .question), "  \u{2753} Foo")
    }

    // MARK: leading token (for prefix-only editor stamping)
    func testLeadingTokenMeaningIsEmpty() {
        XCTAssertEqual(F.leadingIntentToken(of: "Foo bar"), "")
    }
    func testLeadingTokenQuestion() {
        XCTAssertEqual(F.leadingIntentToken(of: "\u{2753} Foo"), "\u{2753} ")
    }
    func testLeadingTokenQuestionNoSpace() {
        XCTAssertEqual(F.leadingIntentToken(of: "\u{2753}Foo"), "\u{2753}")
    }
    func testLeadingTokenPrinciple() {
        XCTAssertEqual(F.leadingIntentToken(of: "principle: Foo"), "principle: ")
    }
    func testLeadingTokenCorrectionPreservesCasing() {
        XCTAssertEqual(F.leadingIntentToken(of: "Correction: Foo"), "Correction: ")
    }
}
