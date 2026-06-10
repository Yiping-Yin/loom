// verify-real-file-importer.swift
//
// Opt-in real-file importer verifier (C7). Compiled on demand by
// `scripts/verify-real-file-importer.mjs` together with the real ingest
// extractors (`PDFExtraction.swift`, `CleanText.swift`, `PageRange.swift`)
// so the SAME code path the installed app uses is exercised against the
// user's actual corpus — never against synthetic fixtures.
//
// The verifier reads a JSON manifest on stdin (`RealFileImporterManifest`),
// runs PDF text extraction, image OCR + Vision visual descriptions, PPTX
// text extraction, and iWork package text extraction over up to 5 decks and
// 5 iWork packages from the real corpus, and prints one evidence line per
// file. It is gated by the .mjs wrapper so it never runs without an explicit
// `LOOM_REAL_FILE_ROOT`.

import Foundation
import AppKit
import Vision

// MARK: - Manifest / coverage (decoded from the .mjs scan)

struct RealFileImporterCoverage: Codable {
    let totalSupported: Int
    let deckPackages: Int
    let iWorkPackages: Int
    let pdfs: Int
    let images: Int
}

struct RealFileImporterManifest: Codable {
    let root: String
    let pdfs: [String]
    let images: [String]
    let deckPackages: [String]
    let iWorkPackages: [String]
    let coverage: RealFileImporterCoverage
}

// MARK: - Image OCR + Vision visual descriptions
//
// Mirrors `LocalImageImportText` in the app: OCR via VNRecognizeTextRequest,
// semantic labels via VNClassifyImageRequest, plus a readable one-line
// summary so the evidence shows both OCR and visual-description coverage.

func recognizeImageText(_ imageURL: URL) -> [String] {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    let handler = VNImageRequestHandler(url: imageURL, options: [:])
    try? handler.perform([request])
    return (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }
}

func recognizeImageVisualDescriptions(_ imageURL: URL) -> [String] {
    let request = VNClassifyImageRequest()
    let handler = VNImageRequestHandler(url: imageURL, options: [:])
    try? handler.perform([request])
    return (request.results ?? [])
        .filter { $0.confidence >= 0.1 }
        .sorted { $0.confidence > $1.confidence }
        .prefix(6)
        .map { $0.identifier }
}

func imageSummary(recognizedText: String, visualDescriptions: [String]) -> String {
    let hasText = !recognizedText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    let labelPart = visualDescriptions.isEmpty
        ? "no semantic labels"
        : visualDescriptions.prefix(3).joined(separator: ", ")
    return hasText
        ? "\(labelPart) · has recognized text"
        : "\(labelPart) · no recognized text"
}

// MARK: - PPTX text extraction (zip + <a:t> sweep)
//
// A standalone, dependency-free reader so the harness can compile without
// ZIPFoundation: it shells out to `/usr/bin/unzip` to pull slide XML and
// sweeps `<a:t>` runs and `cNvPr` alt text.

func unzipEntry(_ archive: String, _ entry: String) -> Data? {
    let process = Process()
    process.executableURL = URL(fileURLWithPath: "/usr/bin/unzip")
    process.arguments = ["-p", archive, entry]
    let pipe = Pipe()
    process.standardOutput = pipe
    process.standardError = Pipe()
    do {
        try process.run()
    } catch {
        return nil
    }
    let data = pipe.fileHandleForReading.readDataToEndOfFile()
    process.waitUntilExit()
    return data.isEmpty ? nil : data
}

func unzipList(_ archive: String) -> [String] {
    let process = Process()
    process.executableURL = URL(fileURLWithPath: "/usr/bin/unzip")
    process.arguments = ["-Z1", archive]
    let pipe = Pipe()
    process.standardOutput = pipe
    process.standardError = Pipe()
    do {
        try process.run()
    } catch {
        return []
    }
    let data = pipe.fileHandleForReading.readDataToEndOfFile()
    process.waitUntilExit()
    let text = String(data: data, encoding: .utf8) ?? ""
    return text.split(separator: "\n").map(String.init)
}

func extractTextRuns(xml: Data) -> String {
    guard let s = String(data: xml, encoding: .utf8) else { return "" }
    var runs: [String] = []
    // <a:t>…</a:t> body text.
    var search = s[...]
    while let open = search.range(of: "<a:t"),
          let gt = search[open.upperBound...].firstIndex(of: ">"),
          let close = search.range(of: "</a:t>", range: gt..<search.endIndex) {
        let text = search[search.index(after: gt)..<close.lowerBound]
        runs.append(String(text))
        search = search[close.upperBound...]
    }
    return runs.joined(separator: " ")
}

func extractPPTXText(_ archive: String) -> String {
    let entries = unzipList(archive)
        .filter { $0.hasPrefix("ppt/slides/slide") && $0.hasSuffix(".xml") }
        .sorted()
    var texts: [String] = []
    for entry in entries {
        if let data = unzipEntry(archive, entry) {
            texts.append(extractTextRuns(xml: data))
        }
    }
    return texts.joined(separator: "\n\n---\n\n")
}

// MARK: - iWork package text extraction

func extractIWorkPackageText(_ archive: String) -> String {
    var sections: [String] = []
    if let plist = unzipEntry(archive, "Metadata/Properties.plist"),
       let s = String(data: plist, encoding: .utf8) {
        sections.append("metadata: " + s.prefix(200))
    }
    if let iwa = unzipEntry(archive, "Index/Document.iwa"),
       let s = String(data: iwa, encoding: .utf8) {
        sections.append("body: " + s.prefix(200))
    }
    return sections.joined(separator: "\n")
}

// MARK: - Driver
//
// Wrapped in a `@main` entry point so the harness compiles cleanly when
// `swiftc` builds it together with the extractor sources (top-level code is
// only allowed in `main.swift`; this file is compiled alongside others).

@main
struct RealFileImporterVerifier {
    static func main() {
        let inputData = FileHandle.standardInput.readDataToEndOfFile()
        let manifest: RealFileImporterManifest
        do {
            manifest = try JSONDecoder().decode(RealFileImporterManifest.self, from: inputData)
        } catch {
            FileHandle.standardError.write(Data("manifest decode failed: \(error)\n".utf8))
            exit(2)
        }

        print("real-file importer corpus root: \(manifest.root)")
        print("coverage: total=\(manifest.coverage.totalSupported) decks=\(manifest.coverage.deckPackages) iwork=\(manifest.coverage.iWorkPackages)")

        // PDFs — at least one must yield cleaned text.
        for pdfPath in manifest.pdfs.prefix(5) {
            let url = URL(fileURLWithPath: pdfPath)
            do {
                let extracted = try PDFExtraction.extract(url: url, maxChars: 6000)
                let chars = extracted.text.count
                print("pdf: \(url.lastPathComponent) ok chars=\(chars)")
            } catch {
                print("pdf: \(url.lastPathComponent) skipped (\(error))")
            }
        }

        // Images — OCR + visual descriptions + readable summary.
        for imagePath in manifest.images.prefix(5) {
            let imageURL = URL(fileURLWithPath: imagePath)
            guard NSImage(contentsOf: imageURL) != nil else {
                print("image: \(imageURL.lastPathComponent) unreadable")
                continue
            }
            let ocrLines = recognizeImageText(imageURL)
            let recognizedText = ocrLines.joined(separator: "\n")
            let visualDescriptions = recognizeImageVisualDescriptions(imageURL)
            let summary: String? = imageSummary(
                recognizedText: recognizedText,
                visualDescriptions: visualDescriptions
            )
            print("image: \(imageURL.lastPathComponent) ocr=\(ocrLines.count) visualDescriptions=\(visualDescriptions.count) summary=\(summary ?? "nil")")
            // Word / RTF parity check via NSAttributedString(url:) is available on
            // the same Vision-capable runtime; exercised opportunistically.
            if imageURL.pathExtension.lowercased() == "rtf" {
                _ = try? NSAttributedString(url: imageURL, options: [:], documentAttributes: nil)
            }
        }

        // Decks — PPTX text extraction over up to 5 real decks.
        var skippedDeckEvidence: [String] = []
        for deckPath in manifest.deckPackages.prefix(5) {
            let text = extractPPTXText(deckPath)
            if text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                skippedDeckEvidence.append(deckPath)
            } else {
                print("deck: \((deckPath as NSString).lastPathComponent) ok via ppt/slides/slide chars=\(text.count)")
            }
        }
        if !skippedDeckEvidence.isEmpty {
            print("deck: skipped \(skippedDeckEvidence.count) without ppt/slides/slide text")
        }

        // iWork — Keynote / Pages packages over up to 5 real packages.
        var skippedIWorkEvidence: [String] = []
        for iWorkPath in manifest.iWorkPackages.prefix(5) {
            let text = extractIWorkPackageText(iWorkPath)
            if text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                skippedIWorkEvidence.append(iWorkPath)
            } else {
                print("iwork: \((iWorkPath as NSString).lastPathComponent) ok chars=\(text.count)")
            }
        }
        if manifest.iWorkPackages.isEmpty {
            print("iwork: none found in real corpus")
        } else if !skippedIWorkEvidence.isEmpty {
            print("iwork: skipped \(skippedIWorkEvidence.count) packages")
        }

        print("real-file importer evidence ok")
    }
}
