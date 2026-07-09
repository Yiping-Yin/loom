import SwiftUI

/// The Today window — the daily face (charter §20 / TodayDigest). Its own
/// window for now, mirroring Review/Library; it folds into the 3-way IA
/// "Today" destination in Wave 2 (its digest + row logic already locked).
/// Loads the persisted workspace, derives the digest, and routes a row tap
/// back into the main workbench via `.loomOpenCase`.
struct TodayRootView: View {
    @Environment(\.dismissWindow) private var dismissWindow
    @State private var digest = TodayDigest(readingNow: [], openQuestions: [], recent: [])

    var body: some View {
        TodayView(digest: digest, onOpenCase: { caseID in
            NotificationCenter.default.post(
                name: .loomOpenCase, object: nil, userInfo: ["caseID": caseID])
            dismissWindow(id: TodayWindow.id)
        })
        .frame(minWidth: 460, minHeight: 480)
        // Re-derive on every appearance so reopening never shows a stale day.
        .onAppear { digest = TodayDigest.derive(from: ReflectionWorkspaceStore.load()?.cases ?? []) }
    }
}

enum TodayWindow {
    static let id = "com.loom.window.today"
}
