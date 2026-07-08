import Foundation
import CoreGraphics
import SwiftUI
import AppKit

/// The centre-document reading instrument's motion vocabulary (decision ③,
/// owner 2026-07-06). Alive comes from PHYSICS (a spring), never from an OBJECT
/// placed in the central void — that is why the "轮回" hero was deleted. A tiny,
/// named set of specs, each derived from the system's own animation bands, so
/// motion stays consistent across the three-column workspace and — for the
/// first time — is unit-testable in isolation (pure values; the view layer
/// turns a `MotionSpec` into a SwiftUI `Animation`).
enum MotionRole {
    /// A surface change — glass tint, opacity, an anchor highlight landing.
    /// Never overshoots (a bounce on a tint reads as a glitch).
    case effect
    /// A solid moving — panel slide, scroll-to-anchor. May settle with a little
    /// controlled life.
    case spatial
    /// A rare emphasis moment — a meaningful arrival (a quote landing in the
    /// note). The only role allowed real bounce; used sparingly (the 10%).
    case hero
}

enum MotionKind: Equatable {
    case spring
    /// Reduce Motion collapses every role to this — no settle, no travel.
    case instant
}

/// A resolved, assertable spring description. The resolver stays pure so its
/// law can be tested; only the view boundary converts it to an `Animation`.
struct MotionSpec: Equatable {
    let response: Double         // seconds — a system-derived duration band
    let dampingFraction: Double  // ≥ 1 == critically damped (no overshoot)
    let kind: MotionKind

    /// Duration a time-based animation (e.g. an AppKit tint fade) should use —
    /// the spring response, but zero when Reduce Motion collapsed us to instant.
    var duration: Double { kind == .instant ? 0 : response }
}

/// The alpha ramp of the anchor-landing flash fade — pure so the ramp math is
/// testable; the view layer schedules the steps and re-addresses the tint (the
/// scheduling + range tracking is inherently view-state glue, not unit-tested).
enum AnchorFlashFade {
    /// Tint alpha at `step` (1…steps) of a linear fade from `peak` to 0, or nil
    /// at the final step — nil means "remove the tint entirely", not "alpha 0".
    static func alpha(atStep step: Int, of steps: Int, peak: CGFloat) -> CGFloat? {
        guard step < steps else { return nil }   // final step: remove, don't linger at a faint alpha
        return peak * CGFloat(steps - step) / CGFloat(steps)
    }
}

enum MotionTokens {
    static func spec(for role: MotionRole, reduceMotion: Bool) -> MotionSpec {
        // Reduce Motion is the central accessibility gate: every role collapses
        // to instant. Settle is a luxury, never a precondition for understanding.
        if reduceMotion { return MotionSpec(response: 0, dampingFraction: 1, kind: .instant) }
        switch role {
        // M3-derived duration bands (system-first): standard / emphasized / long.
        // Damping climbs from hero (some bounce) to effect (critically damped):
        // a surface change must never overshoot; a hero arrival may breathe.
        case .effect:  return MotionSpec(response: 0.35, dampingFraction: 1.0,  kind: .spring)
        case .spatial: return MotionSpec(response: 0.5,  dampingFraction: 0.85, kind: .spring)
        case .hero:    return MotionSpec(response: 0.65, dampingFraction: 0.7,  kind: .spring)
        }
    }
}


/// View-boundary helper for charter §18: every spatial/attention animation
/// passes this gate. SwiftUI does NOT honor Reduce Motion for you — a nil
/// animation collapses the change to instant, which is the system contract.
enum LoomMotion {
    static func gated(_ animation: Animation?) -> Animation? {
        NSWorkspace.shared.accessibilityDisplayShouldReduceMotion ? nil : animation
    }
}
