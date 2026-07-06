//
//  MoonPhaseIndicator.swift
//  Loom
//
//  The moon-phase progress arc — LOOM's loading language, distilled from
//  the "Many faces of the Moon" reference (2026-07-03): a blade-thin cold
//  light grazes the limb of a near-invisible disc, swelling at its center
//  and dying to nothing at both ends, with an atmospheric bloom around the
//  bright core. Drawn natively — no video, no bitmap — and it follows the
//  system appearance (moonlight in dark, ink in light).
//  Indeterminate: the grazing light sweeps the limb, slow and lunar.
//  Determinate: the new moon grows to a full ring.
//

import SwiftUI

struct MoonPhaseIndicator: View {
    var size: CGFloat = 16
    /// nil = indeterminate (the light sweeps the limb);
    /// 0...1 = determinate (new moon → full ring).
    var progress: Double? = nil

    @State private var sweeping = false
    @State private var waxing = false

    private var coreWidth: CGFloat { max(0.9, size * 0.04) }
    private var light: Color { Color.primary }

    var body: some View {
        ZStack {
            // The night side: barely there — the disc is sensed, not seen.
            Circle()
                .fill(.quinary)
            if let progress {
                let p = CGFloat(min(max(progress, 0.02), 1))
                ring(to: p, width: coreWidth * 4, opacity: 0.22)
                    .blur(radius: coreWidth * 2)
                ring(to: p, width: coreWidth, opacity: 0.95)
            } else {
                // Three bodies of one light: atmospheric bloom, halo, and
                // the blade core — all tapering to nothing at both ends.
                // The crescent WAXES AND WANES while it travels ("many
                // faces of the moon"): the gradient peak stays at 0.15,
                // so a short arc keeps only the dim rising side — the
                // light shrinks and dims in the same breath. Sweep (2.6s)
                // and breath (3.9s) run out of phase, so every pass
                // around the limb shows a different face.
                ZStack {
                    grazingArc(width: coreWidth * 6, opacity: 0.25)
                        .blur(radius: coreWidth * 2.4)
                    grazingArc(width: coreWidth * 2.6, opacity: 0.55)
                        .blur(radius: coreWidth * 0.9)
                    grazingArc(width: coreWidth, opacity: 1)
                }
                .rotationEffect(.degrees(sweeping ? 360 : 0))
                .animation(.linear(duration: 2.6).repeatForever(autoreverses: false), value: sweeping)
            }
        }
        .frame(width: size, height: size)
        .onAppear {
            sweeping = true
            withAnimation(.easeInOut(duration: 3.9).repeatForever(autoreverses: true)) {
                waxing = true
            }
        }
        .accessibilityLabel(progress == nil ? "Working" : "Progress")
    }

    private func ring(to: CGFloat, width: CGFloat, opacity: Double) -> some View {
        Circle()
            .trim(from: 0, to: to)
            .stroke(light.opacity(opacity), style: StrokeStyle(lineWidth: width, lineCap: .round))
            .rotationEffect(.degrees(-90))
    }

    /// The grazing light: brightest at its middle, gone at both ends —
    /// the angular gradient tapers the brightness along the crescent, and
    /// the animated trim breathes the crescent between a faint whisper
    /// (0.07, only the dim rising side of the gradient) and a full wide
    /// blade (0.30).
    private func grazingArc(width: CGFloat, opacity: Double) -> some View {
        Circle()
            .trim(from: 0, to: waxing ? 0.30 : 0.07)
            .stroke(
                AngularGradient(
                    gradient: Gradient(stops: [
                        .init(color: light.opacity(0), location: 0),
                        .init(color: light.opacity(opacity), location: 0.15),
                        .init(color: light.opacity(0), location: 0.30),
                        .init(color: light.opacity(0), location: 1),
                    ]),
                    center: .center,
                    startAngle: .degrees(0),
                    endAngle: .degrees(360)
                ),
                style: StrokeStyle(lineWidth: width, lineCap: .butt)
            )
    }
}
