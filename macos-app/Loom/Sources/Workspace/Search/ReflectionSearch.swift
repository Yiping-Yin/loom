import Foundation
import CoreGraphics
import SQLite3

/// Full-text search over the reflection workspace (build-order NEXT / P6): find
/// a note or an anchored quote across every case, and — for a quote hit — jump
/// to the source's exact page+rect via the existing `jumpToAnchor`.
enum ReflectionSearchQuery {
    /// Turn raw user input into a safe FTS5 `MATCH` expression, or nil when there
    /// is nothing to search (so callers skip an empty/invalid MATCH rather than
    /// throwing). Splits on non-word characters, lowercases, and prefix-matches
    /// each token (`term*`) for as-you-type; tokens join with a space = implicit
    /// AND. Punctuation and FTS5 operators (`" * - ( ) : ^`) never survive as
    /// syntax — they're split points, so user input can't inject an operator or
    /// crash the query.
    static func ftsMatch(from raw: String) -> String? {
        let tokens = cjkSpaced(raw.lowercased()).split { !$0.isLetter && !$0.isNumber }.map(String.init)
        guard !tokens.isEmpty else { return nil }
        return tokens.map { "\($0)*" }.joined(separator: " ")
    }

    /// Space-isolate each CJK character so `unicode61` tokenizes it individually.
    /// Applied identically at index and query time — otherwise a space-less run of
    /// CJK is a single token and only a prefix match hits, silently missing the
    /// interior word a Chinese user actually searched for.
    static func cjkSpaced(_ text: String) -> String {
        var out = ""
        out.reserveCapacity(text.count * 2)
        for ch in text {
            if ch.unicodeScalars.contains(where: isCJK) {
                out.append(" "); out.append(ch); out.append(" ")
            } else {
                out.append(ch)
            }
        }
        return out
    }

    private static let cjkRanges: [ClosedRange<UInt32>] = [
        0x3400...0x4DBF,    // CJK Unified Ideographs Extension A
        0x4E00...0x9FFF,    // CJK Unified Ideographs
        0xF900...0xFAFF,    // CJK Compatibility Ideographs
        0x3040...0x30FF,    // Hiragana + Katakana
        0xAC00...0xD7AF,    // Hangul syllables
        0x20000...0x2A6DF,  // CJK Unified Ideographs Extension B
    ]

    static func isCJK(_ scalar: Unicode.Scalar) -> Bool {
        cjkRanges.contains { $0.contains(scalar.value) }
    }
}

/// One indexable unit: a note (a hit opens the case) or an anchored quote (a hit
/// jumps to the source's page+rect via the existing anchor path).
struct SearchRecord: Equatable {
    enum Kind: String { case note, anchor }
    let kind: Kind
    let caseID: String
    let title: String
    let body: String
    let sourceID: String?   // anchor only
    let page: Int?          // anchor only
    let rect: CGRect?       // anchor only

    static func note(caseID: String, title: String, body: String) -> SearchRecord {
        SearchRecord(kind: .note, caseID: caseID, title: title, body: body,
                     sourceID: nil, page: nil, rect: nil)
    }

    static func anchor(caseID: String, quote: String,
                       sourceID: String, page: Int, rect: CGRect) -> SearchRecord {
        SearchRecord(kind: .anchor, caseID: caseID, title: "", body: quote,
                     sourceID: sourceID, page: page, rect: rect)
    }
}

/// A ranked search result. For `.anchor` hits, `sourceID`/`page`/`rect` drive
/// `jumpToAnchor`; for `.note` hits, `caseID` opens the case.
struct SearchHit: Equatable {
    let kind: SearchRecord.Kind
    let caseID: String
    let snippet: String
    let sourceID: String?
    let page: Int?
    let rect: CGRect?
}

enum ReflectionSearchError: Error, Equatable {
    case open(String)
    case exec(String)
    case prepare(String)
}

/// A SQLite FTS5 index over the reflection workspace. Pass `":memory:"` in tests,
/// a file path in the app. NOT thread-safe: the app serialises access on one
/// background queue (search must never block the editor's main thread). We index
/// LOOM's own notes/quotes (already in the workspace JSON) — never a second copy
/// of a source file, so anti-pollution holds.
final class ReflectionSearchIndex {
    private var db: OpaquePointer?

    /// SQLITE_TRANSIENT — tells SQLite to COPY bound text. Swift strings handed to
    /// `sqlite3_bind_text` are transient, so without this the bytes could be freed
    /// before the step, corrupting the row. (The classic C-interop footgun.)
    private static let transient = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

    init(path: String) throws {
        guard sqlite3_open(path, &db) == SQLITE_OK else {
            let msg = String(cString: sqlite3_errmsg(db))
            sqlite3_close(db)
            db = nil
            throw ReflectionSearchError.open(msg)
        }
        do {
            try exec("""
            CREATE VIRTUAL TABLE IF NOT EXISTS docs USING fts5(
                title, body,
                titleRaw UNINDEXED, bodyRaw UNINDEXED,
                kind UNINDEXED, caseID UNINDEXED,
                sourceID UNINDEXED, page UNINDEXED, rect UNINDEXED,
                tokenize = 'unicode61'
            );
            """)
        } catch {
            // init threw AFTER open succeeded → Swift won't call deinit, so close
            // the handle here or we leak the connection + its file lock (mirrors
            // the sqlite3_open failure path above).
            sqlite3_close(db)
            db = nil
            throw error
        }
    }

    deinit { sqlite3_close_v2(db) }

    /// Replace all records for a case (delete + insert in one transaction) so
    /// re-indexing a case never leaves stale rows behind.
    func replace(caseID: String, with records: [SearchRecord]) throws {
        try exec("BEGIN;")
        do {
            try deleteRows(caseID: caseID)
            for record in records { try insert(record) }
            try exec("COMMIT;")
        } catch {
            try? exec("ROLLBACK;")
            throw error
        }
    }

    /// Ranked search: FTS5 `MATCH` ordered by bm25 (title weighted 10× body).
    /// Returns [] for an empty/whitespace query. Anchor hits carry the jump
    /// payload (sourceID/page/rect); note hits carry just the caseID to open.
    func search(_ raw: String, limit: Int = 30) throws -> [SearchHit] {
        guard let match = ReflectionSearchQuery.ftsMatch(from: raw) else { return [] }
        let sql = """
        SELECT kind, caseID, titleRaw, bodyRaw, sourceID, page, rect
        FROM docs WHERE docs MATCH ? ORDER BY bm25(docs, 10.0, 1.0) LIMIT ?;
        """
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            throw ReflectionSearchError.prepare(lastError())
        }
        defer { sqlite3_finalize(stmt) }
        sqlite3_bind_text(stmt, 1, match, -1, Self.transient)
        // Clamp: a negative limit would become SQLite's "unbounded" (LIMIT -1),
        // and limit > Int32.max would trap Int32(_:). Invalid input → no rows.
        sqlite3_bind_int(stmt, 2, Int32(max(0, min(limit, Int(Int32.max)))))
        var hits: [SearchHit] = []
        while sqlite3_step(stmt) == SQLITE_ROW {
            let kind = SearchRecord.Kind(rawValue: text(stmt, 0)) ?? .note
            let title = text(stmt, 2)
            let body = text(stmt, 3)
            let sourceID = text(stmt, 4)
            let isAnchor = kind == .anchor
            hits.append(SearchHit(
                kind: kind,
                caseID: text(stmt, 1),
                snippet: title.isEmpty ? body : title,
                sourceID: isAnchor && !sourceID.isEmpty ? sourceID : nil,
                page: isAnchor ? Int(text(stmt, 5)) : nil,
                rect: isAnchor ? Self.decodeRect(text(stmt, 6)) : nil
            ))
        }
        return hits
    }

    // MARK: - SQLite plumbing

    private func exec(_ sql: String) throws {
        var err: UnsafeMutablePointer<CChar>?
        guard sqlite3_exec(db, sql, nil, nil, &err) == SQLITE_OK else {
            let msg = err.map { String(cString: $0) } ?? lastError()
            sqlite3_free(err)
            throw ReflectionSearchError.exec(msg)
        }
    }

    private func deleteRows(caseID: String) throws {
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, "DELETE FROM docs WHERE caseID = ?;", -1, &stmt, nil) == SQLITE_OK else {
            throw ReflectionSearchError.prepare(lastError())
        }
        defer { sqlite3_finalize(stmt) }
        sqlite3_bind_text(stmt, 1, caseID, -1, Self.transient)
        guard sqlite3_step(stmt) == SQLITE_DONE else { throw ReflectionSearchError.exec(lastError()) }
    }

    private func insert(_ r: SearchRecord) throws {
        let sql = """
        INSERT INTO docs (title, body, titleRaw, bodyRaw, kind, caseID, sourceID, page, rect)
        VALUES (?,?,?,?,?,?,?,?,?);
        """
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            throw ReflectionSearchError.prepare(lastError())
        }
        defer { sqlite3_finalize(stmt) }
        // Indexed columns carry the CJK-spaced form (for tokenization); the *Raw
        // columns carry the original text (for display / snippet).
        sqlite3_bind_text(stmt, 1, ReflectionSearchQuery.cjkSpaced(r.title), -1, Self.transient)
        sqlite3_bind_text(stmt, 2, ReflectionSearchQuery.cjkSpaced(r.body), -1, Self.transient)
        sqlite3_bind_text(stmt, 3, r.title, -1, Self.transient)
        sqlite3_bind_text(stmt, 4, r.body, -1, Self.transient)
        sqlite3_bind_text(stmt, 5, r.kind.rawValue, -1, Self.transient)
        sqlite3_bind_text(stmt, 6, r.caseID, -1, Self.transient)
        sqlite3_bind_text(stmt, 7, r.sourceID ?? "", -1, Self.transient)
        sqlite3_bind_text(stmt, 8, r.page.map(String.init) ?? "", -1, Self.transient)
        sqlite3_bind_text(stmt, 9, Self.encodeRect(r.rect), -1, Self.transient)
        guard sqlite3_step(stmt) == SQLITE_DONE else { throw ReflectionSearchError.exec(lastError()) }
    }

    private func lastError() -> String { String(cString: sqlite3_errmsg(db)) }

    private func text(_ stmt: OpaquePointer?, _ col: Int32) -> String {
        guard let c = sqlite3_column_text(stmt, col) else { return "" }
        return String(cString: c)
    }

    static func encodeRect(_ r: CGRect?) -> String {
        guard let r else { return "" }
        return "\(r.origin.x),\(r.origin.y),\(r.size.width),\(r.size.height)"
    }

    static func decodeRect(_ s: String) -> CGRect? {
        let p = s.split(separator: ",").compactMap { Double($0) }
        guard p.count == 4 else { return nil }
        return CGRect(x: p[0], y: p[1], width: p[2], height: p[3])
    }
}
