import SwiftUI

/// The Digital Me destination shell — charter §20: all three top-level
/// destinations live in the MAIN window's sidebar; separate windows are for
/// supplemental surfaces only. Built unwired in W0-11: today it simply hosts
/// the same owner dossier the You window shows (LoomDossierRootView), so
/// W2-2 can slot it into the sidebar without inventing a second dossier
/// implementation. The owner hierarchy (2026-07-08): Education / Experience /
/// Hobby are CLASSIFICATIONS of one knowledge base — this view is where that
/// presentation eventually folds into the main window.
struct DigitalMeDestinationView: View {
    var body: some View {
        LoomDossierRootView()
            .accessibilityElement(children: .contain)
            .accessibilityLabel("Digital Me")
    }
}
