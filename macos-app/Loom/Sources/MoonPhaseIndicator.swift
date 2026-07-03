//
//  MoonPhaseIndicator.swift
//  Loom
//
//  The moon-phase progress arc — LOOM's loading language, distilled from
//  the "Many faces of the Moon" reference (2026-07-03): a thin cold light
//  travels the limb of a dark disc. Drawn natively — no video, no bitmap —
//  and it follows the system appearance (moonlight in dark, ink in light).
//  Indeterminate: the light sweeps the limb, slow and lunar.
//  Determinate: the new moon grows to a full ring.
//

import SwiftUI

struct MoonPhaseIndicator: View {
    var size: CGFloat = 16
    /// nil = indeterminate (the light sweeps the limb);
    /// 0...1 = determinate (new moon → full ring).
    var progress: Double? = nil

    @State private var sweeping = false

    private var lineWidth: CGFloat { max(1.4, size * 0.09) }
    private var limbLight: Color { Color.primary.opacity(0.85) }
    private var limbGlow: Color { Color.primary.opacity(0.5) }

    var body: some View {
        ZStack {
            // The night side: a quiet system-tinted disc.
            Circle()
                .fill(.quaternary)
            // The light on the limb.
            if let progress {
                Circle()
                    .trim(from: 0, to: CGFloat(min(max(progress, 0.02), 1)))
                    .stroke(limbLight, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .shadow(color: limbGlow, radius: size * 0.14)
            } else {
                Circle()
                    .trim(from: 0, to: 0.22)
                    .stroke(limbLight, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                    .shadow(color: limbGlow, radius: size * 0.14)
                    .rotationEffect(.degrees(sweeping ? 360 : 0))
                    .animation(.linear(duration: 2.6).repeatForever(autoreverses: false), value: sweeping)
            }
        }
        .frame(width: size, height: size)
        .onAppear { sweeping = true }
        .accessibilityLabel(progress == nil ? "Working" : "Progress")
    }
}
