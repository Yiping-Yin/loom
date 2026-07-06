import XCTest
@testable import Loom

/// The reading instrument's motion law (decision ③, owner 2026-07-06): alive
/// comes from PHYSICS (spring), never from objects in the void. These tests pin
/// the two rulers that govern every animation in LOOM — `effect` never
/// overshoots, and Reduce Motion collapses everything to instant — so the law
/// is enforced in one place instead of hand-tuned per view.
final class MotionTokensTests: XCTestCase {

    /// `effect` drives SURFACE changes (glass tint, opacity, an anchor highlight
    /// landing). A bounce on a glass tint reads as a glitch — effect must be
    /// critically damped (dampingFraction ≥ 1: no overshoot).
    func testEffectNeverOvershoots() {
        let spec = MotionTokens.spec(for: .effect, reduceMotion: false)
        XCTAssertGreaterThanOrEqual(spec.dampingFraction, 1.0)
        XCTAssertEqual(spec.kind, .spring)
    }

    /// Durations are system-derived (M3 standard band = 0.35s), not hand-tuned
    /// per view — the motion equivalent of system-first colour/material tokens.
    func testEffectResponseIsSystemDerived() {
        XCTAssertEqual(MotionTokens.spec(for: .effect, reduceMotion: false).response,
                       0.35, accuracy: 0.001)
    }

    /// `spatial` moves a SOLID (panel slide, scroll-to-anchor). It may settle
    /// with a little life, but stays controlled — never as loose as `hero`.
    func testSpatialSettlesButStaysControlled() {
        let spatial = MotionTokens.spec(for: .spatial, reduceMotion: false)
        let hero = MotionTokens.spec(for: .hero, reduceMotion: false)
        XCTAssertLessThan(spatial.dampingFraction, 1.0)
        XCTAssertGreaterThan(spatial.dampingFraction, hero.dampingFraction)
    }

    /// Reduce Motion is a CENTRAL gate: every role collapses to `.instant`.
    /// Settle is a luxury, never a precondition for understanding.
    func testReduceMotionCollapsesEveryRoleToInstant() {
        for role in [MotionRole.effect, .spatial, .hero] {
            XCTAssertEqual(MotionTokens.spec(for: role, reduceMotion: true).kind, .instant,
                           "role \(role) must be instant under Reduce Motion")
        }
    }

    /// The seam AppKit animation code consumes: `duration` is the spring
    /// response, but ZERO when Reduce Motion collapsed the spec to instant —
    /// so a fade driven by it becomes an immediate removal, not a 0s animation
    /// that could still flicker.
    func testDurationIsResponseForSpringAndZeroForInstant() {
        XCTAssertEqual(MotionTokens.spec(for: .effect, reduceMotion: false).duration,
                       0.35, accuracy: 0.001)
        XCTAssertEqual(MotionTokens.spec(for: .spatial, reduceMotion: true).duration,
                       0, accuracy: 0.001)
    }

    /// The anchor-flash fade ramp (the view schedules these steps): alpha
    /// descends monotonically from near-peak toward zero, staying within
    /// (0, peak], and the FINAL step returns nil == "remove the tint" (so the
    /// highlight fully clears rather than lingering at a faint alpha).
    func testAnchorFadeRampDescendsToRemoval() {
        let steps = 12
        let peak: CGFloat = 0.28
        XCTAssertEqual(AnchorFlashFade.alpha(atStep: 1, of: steps, peak: peak)!,
                       peak * 11.0 / 12.0, accuracy: 0.0001)
        XCTAssertNil(AnchorFlashFade.alpha(atStep: steps, of: steps, peak: peak),
                     "the final step removes the tint entirely")
        var previous = peak
        for step in 1..<steps {
            let alpha = AnchorFlashFade.alpha(atStep: step, of: steps, peak: peak)!
            XCTAssertLessThanOrEqual(alpha, previous)
            XCTAssertGreaterThan(alpha, 0)
            previous = alpha
        }
    }
}
