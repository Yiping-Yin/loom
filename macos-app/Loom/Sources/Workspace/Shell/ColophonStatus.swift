import Foundation

/// The quiet colophon signature — form A of digital-me's peripheral presence
/// (see the Siri-borrow decision: presence lives at the edge, the STATIC TEXT is
/// the source of truth, and it passes the mute-test with no motion). It reflects,
/// honestly, what the local corpus holds: sources brought in and notes written.
/// Never fake verbs, never a running glow. "Local" carries the on-device /
/// no-account reassurance; an empty workspace shows only that.
enum ColophonStatus {
    static func text(sourceCount: Int, noteCount: Int) -> String {
        var parts = ["Local"]
        if sourceCount > 0 {
            parts.append("\(sourceCount) source\(sourceCount == 1 ? "" : "s")")
        }
        if noteCount > 0 {
            parts.append("\(noteCount) note\(noteCount == 1 ? "" : "s")")
        }
        if parts.count == 1 {   // empty corpus — only the on-device reassurance
            parts.append("on-device")
        }
        return parts.joined(separator: " · ")
    }
}
