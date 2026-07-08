import SwiftUI
import AppKit

/// Loom tokens — the native design-token seam.
///
/// **Contract (macOS-standards charter §5/§6, ratified 2026-07-08):**
/// system semantics first. Neutral surfaces, inks, hairlines, and state
/// colors are SYSTEM SEMANTIC COLORS (labelColor…, separatorColor,
/// windowBackground…, systemRed/Green/Orange) so they auto-adapt to
/// appearance, vibrancy on glass, and Increase Contrast. Interactive /
/// signal chrome is `Color.accentColor` — never a token from this file.
/// The ONLY sanctioned custom colors here are:
///   · `dsAnchor` / `dsAnchorNSColor` — the loom:// anchor locator cyan
///     (dynamic: #2F8CA0 light / #4BC5DE dark), reserved for anchor
///     evidence, capture receipts, and the locator glyphs;
///   · `dsThread` — deprecated in-flight-caller alias of the anchor hue,
///     scheduled for deletion once the remaining parallel-session files
///     land (charter W1-3; deletion turns relapse into a compile error).
/// The CSS-injection block at the bottom is the web-bridge mirror and
/// migrates together with `LoomWebView.themeSyncScript` (also W1-3).
enum LoomTokens {

    // MARK: - Neutral ramp → system semantic colors (charter §6)
    //
    // One definition-site change, ~370 call sites inherit. These resolve
    // from the window's effective appearance and pick up vibrancy on
    // glass + Increase Contrast for free.

    /// Root background, deepest layer.
    static let dsPaperDeep   = Color(nsColor: .underPageBackgroundColor)
    /// Default surface (one layer up from root).
    static let dsPaper       = Color(nsColor: .windowBackgroundColor)
    /// Raised surface (two layers up).
    static let dsPaperUp     = Color(nsColor: .controlBackgroundColor)
    /// Card surface (three layers up).
    static let dsPaperCard   = Color(nsColor: .quaternarySystemFill)

    /// Primary body text + iconography.
    static let dsInk1        = Color(nsColor: .labelColor)
    /// Secondary / metadata.
    static let dsInk2        = Color(nsColor: .secondaryLabelColor)
    /// Muted / chrome.
    static let dsInk3        = Color(nsColor: .tertiaryLabelColor)

    /// Hairline border · default 0.5px stroke.
    static let dsHair        = Color(nsColor: .separatorColor)
    /// Hairline border · faintest layer.
    static let dsHairFaint   = Color(nsColor: .separatorColor).opacity(0.5)

    /// @deprecated Anchor-hue alias kept ONLY for the parallel-session
    /// in-flight files that still reference it (9 call sites). Chrome uses
    /// `Color.accentColor`; anchor visuals use `dsAnchor`. Deleted in W1-3.
    static let dsThread      = Color(hex: 0x4BC5DE)
    /// The one sanctioned in-app cyan: the loom:// anchor locator (◆/◇),
    /// anchored-quote evidence, and capture receipts. Ink-discipline law
    /// (owner 2026-07-07 system-unity): cyan is RESERVED for the anchor
    /// family — all other chrome uses `Color.accentColor`. Dynamic pair
    /// per charter §5: #2F8CA0 in light (contrast on white paper/PDF),
    /// #4BC5DE in dark.
    static let dsAnchor      = Color(nsColor: dsAnchorNSColor)
    /// AppKit-side dynamic anchor color for NSView drawing / text
    /// attributes (PDF locator bar, capture flash receipts).
    static let dsAnchorNSColor: NSColor = NSColor(name: nil) { appearance in
        let isDark = appearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
        return NSColor.fromHex(isDark ? 0x4BC5DE : 0x2F8CA0, alpha: 1.0)
    }
    // (dsThreadMuted removed — zero callers; muted cyan invited chrome back
    // into the anchor colour.)

    // MARK: - Semantic state colors → system palette (charter §6)
    //
    // Destructive / positive / caution surfaces use the system state
    // colors so they match every other Mac app and adapt to Increase
    // Contrast. Never `Color.red` / ad-hoc hex for new code. Need a
    // de-emphasised variant? Use `.opacity(0.55)` at the call site.

    /// Destructive — delete / cancel / error states.
    static let dsAlert        = Color(nsColor: .systemRed)

    /// Positive — confirmations, complete states.
    static let dsSuccess      = Color(nsColor: .systemGreen)

    // (dsInfo/dsInfoMuted removed — zero callers, and a cyan "info" tint
    // conflated the semantic state colour with the reserved anchor cyan.
    // New informational chrome should use Color.accentColor.
    // dsAlertMuted/dsSuccessMuted/dsWarningMuted removed — zero callers.)

    /// Caution — warnings, unsaved/attention states.
    static let dsWarning      = Color(nsColor: .systemOrange)

    // MARK: - Design System v1.0 · hex string constants
    //
    // Mirror of the canonical `ds*` palette as `#RRGGBB` strings, for
    // cases where a Swift surface needs to inject the value into a
    // JS / CSS template literal (e.g. `LoomWebView.themeSyncScript`).
    // These MUST stay byte-equal to the SwiftUI `Color(hex: ...)`
    // values above — they're the same source of truth surfaced two
    // ways. Changing one requires changing the other.
    //
    // Light-mode hex constants are kept here even though SwiftUI tokens
    // currently default to dark values (light mode deferred per plan
    // open question #1). The legacy `themeSyncScript` palette had
    // distinct light/dark values; preserving that split here lets the
    // refactor be strictly substitution-equivalent rather than a
    // visual change.

    /// Dark-mode root background (`dsPaperDeep`).  Evidence Desk --ink-0.
    static let dsPaperDeepHexDark   = "#07090C"
    /// Dark-mode primary ink (`dsInk1`).  Evidence Desk --text-1.
    static let dsInk1HexDark        = "#E6E9EE"
    /// Dark-mode secondary ink (`dsInk2`).  Evidence Desk --text-2.
    static let dsInk2HexDark        = "#9BA3AE"
    /// Dark-mode chrome / muted (`dsInk3`).  Evidence Desk --text-3.
    static let dsMutedHexDark       = "#5E6671"
    /// Comet-ice accent (same in both modes).  Evidence Desk --gold alias.
    static let dsThreadHex          = "#4BC5DE"
    /// Comet accent · text-pair, brighter highlight for dark backgrounds.
    static let dsThreadTextHexDark  = "#8AF7E6"

    /// Light-mode equivalents — cool-neutral counterparts of the Evidence
    /// Desk ramp (no warm paper), so light mode shares the same temperature.
    static let dsPaperDeepHexLight  = "#EEF1F4"
    static let dsInk1HexLight       = "#1A1F26"
    static let dsInk2HexLight       = "#46505B"
    static let dsMutedHexLight      = "#8A929C"
    static let dsThreadTextHexLight = "#2F7384"

    // MARK: - Legacy aliases (backward compat)
    //
    // The old token names kept their call sites; values now point at the
    // canonical `ds*` palette so existing surfaces pick up Design System
    // v1.0 colors without per-view edits. Where an alias used to be
    // dynamic (light + dark), it stays dynamic — the dark value is
    // re-pointed at the canonical token, the light value is left as-is
    // until light mode is derived (open question #1 in the plan).
    //
    // NOTE on the paper/paperDeep naming swap: legacy `paper` was the
    // deepest tone (0x1A1815) and `paperDeep` was one step up (0x221E18),
    // which inverts the canonical naming. Per plan instruction "prefer
    // the new canonical", aliases now follow canonical semantics:
    // `paper` = canonical `dsPaper` (default surface), `paperDeep` =
    // canonical `dsPaperDeep` (root). This is a deliberate visual shift
    // surfaces will pick up automatically.

    /// @deprecated Use `dsPaper`.
    static let paper      = dsPaper
    /// @deprecated Use `dsPaperDeep`.
    static let paperDeep  = dsPaperDeep
    /// @deprecated Use `dsInk1`.
    static let ink        = dsInk1
    /// @deprecated Use `dsInk2`.
    static let ink2       = dsInk2
    /// @deprecated Use `dsInk3`.
    static let ink3       = dsInk3
    /// @deprecated Use `dsInk3`.
    static let muted      = dsInk3
    /// @deprecated Use `dsHair`.
    static let hair       = dsHair
    /// @deprecated Use `dsHairFaint`.
    static let hairFaint  = dsHairFaint

    // (Night ink-wash family removed — zero callers since the web-era
    // surfaces retired.)

    // MARK: - Inks — cool-black base; `thread` is AI/selection/focus.
    //
    // Comet accents (thread/threadHi) stay static — they're the accent in both
    // modes and read fine on both paper and night. The state tones
    // (rose/sage/ochre/gold/indigo/plum) need lift in dark mode or status
    // text collapses to ~2-3:1 contrast against 0x1A1815. Dark values align
    // with `globals.css` `--tint-*` dark overrides so native badges + web
    // chrome share the same palette.
    //
    // Design System v1.0: `thread` and `threadHi` both alias canonical
    // `dsThread` (#4BC5DE). The old gold value is gone; single source of
    // truth for comet accent going forward.

    /// @deprecated Anchor-hue alias for in-flight parallel-session callers
    /// only (see `dsThread`). Everything editable migrated to
    /// `Color.accentColor` / `dsAnchor` in charter W0-1. Deleted in W1-3.
    static let thread   = Color(hex: 0x4BC5DE)
    static let ochre    = Color(nsColor: .systemOrange)
    static let rose     = Color(nsColor: .systemRed)
    static let sage     = Color(nsColor: .systemGreen)
    // (threadHi / gold / indigo / plum / umber removed — zero code callers;
    // threadHi and indigo were cyan-family leak inviters.)

    // MARK: - Type stacks — same cascade as the web for cross-surface consistency.

    static let serifStack   = #"\"EB Garamond\", \"Iowan Old Style\", \"Palatino Linotype\", Georgia, serif"#
    static let displayStack = #"\"Cormorant Garamond\", \"EB Garamond\", \"Iowan Old Style\", serif"#
    static let sansStack    = #"\"Inter\", -apple-system, BlinkMacSystemFont, \"SF Pro Text\", system-ui, sans-serif"#
    static let scriptStack  = #"\"Caveat\", \"Homemade Apple\", \"Bradley Hand\", \"Segoe Print\", cursive"#
    static let monoStack    = #"\"JetBrains Mono\", \"SF Mono\", ui-monospace, Menlo, monospace"#

    /// Native-side display serif. Charter §17: `Font.custom("Cormorant
    /// Garamond")` was a lie — the font is not bundled, so every call
    /// silently fell back to SF sans. System serif (New York) is the
    /// standard, Apple-tuned-for-reading face.
    static func display(size: CGFloat, italic: Bool = false, weight: Font.Weight = .regular) -> Font {
        let base = Font.system(size: size, weight: weight, design: .serif)
        return italic ? base.italic() : base
    }

    /// Native-side body serif — same §17 fix as `display(size:)`.
    static func serif(size: CGFloat, italic: Bool = false, weight: Font.Weight = .regular) -> Font {
        let base = Font.system(size: size, weight: weight, design: .serif)
        return italic ? base.italic() : base
    }

    static func sans(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        Font.system(size: size, weight: weight) // Inter falls back to SF
    }

    static func mono(size: CGFloat) -> Font {
        Font.system(size: size, design: .monospaced)
    }

    // MARK: - Design System v1.0 · type ladder
    //
    // Mirrors the 7-level type ladder from the plan (display-1/2/3, body,
    // caption, eyebrow, mono). SwiftUI surfaces consume these via
    // `Text("...").font(DSType.body.font)`. The `DSType` enum lives at the
    // file scope below the `LoomTokens` enum to keep the API flat:
    // `DSType.display1` rather than `LoomTokens.DSType.display1`.

    // MARK: - Design System v1.0 · spacing scale (8pt grid)
    //
    // Mirrors the 6-step spacing scale from the plan. Use `DSSpace.md.value`
    // anywhere a CGFloat is expected.

    // (Motion durations: use MotionTokens — it carries the Reduce-Motion
    // gate required by charter §18. The old DSMotion enum is deleted.)

    // MARK: - Design System v1.0 · corner radii

    // (Type/Space/Motion/Radius are top-level enums declared below for a
    // flat call-site API; see end of file.)

    // MARK: - Web → CSS variable injection

    /// Inject Loom Vellum tokens as CSS variables on `:root`, plus load the
    /// Google Fonts we need, at document-start. The web app can then reference
    /// `var(--loom-paper)`, `var(--loom-serif)`, etc., and inherit the native
    /// palette with zero per-component edits.
    ///
    /// For production the fonts should be bundled (offline + App Store), but
    /// for now the Google stylesheet is fine — same cascade the design files
    /// use, identical WKWebView rendering.
    static let cssInjectionScript: String = """
    (() => {
      try {
        if (!document.getElementById('loom-tokens-css')) {
          const style = document.createElement('style');
          style.id = 'loom-tokens-css';
          style.textContent = `
            :root {
              /* Evidence Desk — cool-black luminance ramp + comet ice. */
              --loom-paper: #10141A;
              --loom-paper-deep: #07090C;
              --loom-paper-shade: #161B22;
              --loom-ink: #E6E9EE;
              --loom-ink-2: #9BA3AE;
              --loom-ink-3: #5E6671;
              --loom-muted: #5E6671;
              --loom-hair: rgba(230,233,238,0.10);
              --loom-hair-faint: rgba(230,233,238,0.05);

              --loom-night: #07090C;
              --loom-candle: #E6E9EE;
              --loom-candle-2: #9BA3AE;

              --loom-thread: #4BC5DE;
              --loom-thread-hi: #8AF7E6;
              --loom-gold: #4BC5DE;
              --loom-ochre: #DDBA6A;
              --loom-rose: #E06A6A;
              --loom-sage: #3FB37A;
              --loom-indigo: #4BC5DE;
              --loom-plum: #9090B0;
              --loom-umber: #2A323D;

              --loom-serif: "EB Garamond", "Iowan Old Style", "Palatino Linotype", Georgia, serif;
              --loom-display: "Cormorant Garamond", "EB Garamond", "Iowan Old Style", serif;
              --loom-sans: "Inter", -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
              --loom-script: "Caveat", "Homemade Apple", "Bradley Hand", "Segoe Print", cursive;
              --loom-mono: "JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace;
            }
            body {
              font-feature-settings: "kern", "liga", "onum";
            }
            .loom-smallcaps {
              font-variant: small-caps;
              letter-spacing: 0.08em;
            }
            /* NOTE: the former "Vellum chrome sweep" (which forced every
               uppercase element into serif small-caps book typography) was
               removed for the Evidence Desk system. Evidence Desk eyebrow /
               section labels ARE intentionally small uppercase mono with wide
               letter-spacing; the old override fought that. The web app now
               owns its own type ramp via globals.css — no native override. */
          `;
          document.head.appendChild(style);
        }
        /*
         * Font strategy: rely on the system-font fallback chain
         * declared in globals.css (`--serif`, `--display`, `--sans`,
         * `--mono`). macOS ships "New York" (custom serif, Catalina+)
         * and "Iowan Old Style" which are both close-enough to EB
         * Garamond / Cormorant for Vellum identity, plus "SF Pro Text"
         * (sans), "SF Mono" (mono). Zero CDN round-trip, zero
         * offline-fallback surprise.
         *
         * Previously we injected a Google Fonts <link> that pulled in
         * EB Garamond + Cormorant + Inter + JetBrains Mono + Caveat.
         * Removed 2026-04-22 (night) because: (1) the sandboxed app
         * can't always reach the CDN, (2) the fallback chain already
         * carries the identity, (3) App Store review prefers
         * self-contained apps over runtime network dependencies for
         * chrome. Can re-enable under an opt-in flag later if needed.
         */
      } catch (_) {}
    })();

    /* Breathing Margins — idle detection. After 4s with no
       mousemove/scroll/keydown/pointerdown, tag <body> with
       `loom-idle`. Any activity clears the class immediately.
       Passive listeners so scrolling stays 60fps. */
    (() => {
      try {
        if (window.__loomIdleInstalled) return;
        window.__loomIdleInstalled = true;
        const IDLE_MS = 4000;
        let timer = null;
        const setIdle = () => {
          if (document.body) document.body.classList.add('loom-idle');
        };
        const wakeUp = () => {
          if (document.body) document.body.classList.remove('loom-idle');
          if (timer) clearTimeout(timer);
          timer = setTimeout(setIdle, IDLE_MS);
        };
        const opts = { passive: true };
        window.addEventListener('mousemove', wakeUp, opts);
        window.addEventListener('scroll', wakeUp, opts);
        window.addEventListener('keydown', wakeUp, opts);
        window.addEventListener('pointerdown', wakeUp, opts);
        wakeUp();
      } catch (_) {}
    })();

    /* Spatial Continuity — animated scroll restore for /wiki/* and
       /knowledge/* pages. Reads saved offset from localStorage,
       jumps 120px short, then smooth-scrolls to the saved position
       so the return feels like finding your place. Saves on
       scroll-stop (400ms debounce). */
    (() => {
      try {
        const path = location.pathname;
        if (!/^\\/wiki\\//.test(path) && !/^\\/knowledge\\//.test(path)) return;
        const key = 'loom:scroll:' + path;
        const saved = parseInt(localStorage.getItem(key) || '0', 10);
        if (saved > 0) {
          const start = Math.max(0, saved - 120);
          window.scrollTo({ top: start, behavior: 'instant' });
          requestAnimationFrame(() => {
            window.scrollTo({ top: saved, behavior: 'smooth' });
          });
        }
        let t = null;
        window.addEventListener('scroll', () => {
          clearTimeout(t);
          t = setTimeout(() => {
            localStorage.setItem(key, String(Math.floor(window.scrollY)));
          }, 400);
        }, { passive: true });
      } catch (_) {}
    })();
    """
}

private extension Color {
    init(hex: UInt32, opacity: Double = 1.0) {
        self.init(
            .sRGB,
            red:   Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >>  8) & 0xFF) / 255,
            blue:  Double( hex        & 0xFF) / 255,
            opacity: opacity
        )
    }

    /// Build a `Color` that flips between two sRGB values based on the
    /// effective `NSAppearance`. Bridges through `NSColor` because SwiftUI
    /// has no first-party "dynamic color by appearance" init on macOS yet.
    static func dynamic(light: UInt32, dark: UInt32) -> Color {
        Color(nsColor: NSColor(name: nil) { appearance in
            let isDark = appearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
            return NSColor.fromHex(isDark ? dark : light, alpha: 1.0)
        })
    }

    /// Same as `dynamic(light:dark:)` but with per-mode opacity — used by
    /// hair/hairFaint where both tone and translucency flip between modes.
    static func dynamicAlpha(light: UInt32, lightAlpha: CGFloat,
                             dark: UInt32, darkAlpha: CGFloat) -> Color {
        Color(nsColor: NSColor(name: nil) { appearance in
            let isDark = appearance.bestMatch(from: [.darkAqua, .aqua]) == .darkAqua
            return NSColor.fromHex(isDark ? dark : light,
                                   alpha: isDark ? darkAlpha : lightAlpha)
        })
    }
}

private extension NSColor {
    static func fromHex(_ hex: UInt32, alpha: CGFloat) -> NSColor {
        NSColor(
            srgbRed: CGFloat((hex >> 16) & 0xFF) / 255,
            green:   CGFloat((hex >>  8) & 0xFF) / 255,
            blue:    CGFloat( hex        & 0xFF) / 255,
            alpha:   alpha
        )
    }
}

// MARK: - Design System v1.0 · type ladder

/// Seven-step type ladder — mirrors `lib/loom-design-system.ts` and the
/// `globals-v2.css` utility classes (`.display-1 / .display-2 / .display-3
/// / .body / .caption / .eyebrow / .mono`). The plan describes the system
/// as "6-step ladder, 3 families" but enumerates 7 named slots; we keep all
/// 7 here so SwiftUI surfaces have a 1:1 mapping with web utility classes.
///
/// SwiftUI's `Font.system(size:weight:design:)` cascade picks the system
/// serif (New York / Iowan Old Style) for `.serif` design and SF Mono for
/// `.monospaced`, which matches the same fallback chain the webview uses
/// when EB Garamond / IBM Plex Mono aren't bundled. Bundled-font path can
/// be wired in via `LoomTokens.serif(...)` / `.display(...)` later without
/// touching call sites.
enum DSType {
    case display1
    case display2
    case display3
    case body
    case caption
    case eyebrow
    case mono

    /// Point size for the slot.
    var size: CGFloat {
        switch self {
        case .display1: return 32
        case .display2: return 22
        case .display3: return 16
        case .body:     return 16
        case .caption:  return 13
        case .eyebrow:  return 11
        case .mono:     return 13
        }
    }

    /// Line height multiplier (matches CSS `line-height` from the plan).
    var lineHeight: CGFloat {
        switch self {
        case .display1: return 1.15
        case .display2: return 1.20
        case .display3: return 1.30
        case .body:     return 1.62
        case .caption:  return 1.45
        case .eyebrow:  return 1.00
        case .mono:     return 1.55
        }
    }

    /// Weight for the slot. `display-1` is 400; everything else 400 or 500
    /// per the plan's type table.
    var weight: Font.Weight {
        switch self {
        case .display1: return .regular   // 400
        case .display2: return .medium    // 500
        case .display3: return .medium    // 500
        case .body:     return .regular   // 400
        case .caption:  return .regular   // 400
        case .eyebrow:  return .medium    // 500
        case .mono:     return .regular   // 400
        }
    }

    /// Italic by default for display 1/2 and caption (per plan).
    var isItalic: Bool {
        switch self {
        case .display1, .display2, .caption: return true
        case .display3, .body, .eyebrow, .mono: return false
        }
    }

    /// Font family family-class (SwiftUI `Font.Design`).
    /// `--display` and `--serif` both resolve to `.serif` on the native
    /// side — SwiftUI's serif design covers both Cormorant- and Charter-
    /// shaped requirements at the slot's weight/size. `.monospaced` for
    /// mono. Sans is unused in this ladder.
    var fontDesign: Font.Design {
        switch self {
        case .display1, .display2, .display3,
             .body, .caption, .eyebrow:
            return .serif
        case .mono:
            return .monospaced
        }
    }

    /// Letter-spacing tracking (CSS `letter-spacing` em → SwiftUI tracking
    /// pts at this slot's size). Eyebrow is the only slot with non-zero
    /// tracking per the plan: `0.16em` at 11pt = ~1.76pt.
    var tracking: CGFloat {
        switch self {
        case .eyebrow: return 0.16 * 11
        default:       return 0
        }
    }
}

extension DSType {
    /// Convenience SwiftUI `Font` for the slot. Italics applied via
    /// `.italic()` modifier. Tracking is applied separately on the
    /// `Text` (use `.tracking(DSType.eyebrow.tracking)` at the call site
    /// for eyebrow labels).
    var font: Font {
        let base = Font.system(size: size, weight: weight, design: fontDesign)
        return isItalic ? base.italic() : base
    }
}

// MARK: - Design System v1.0 · spacing (8pt grid)

/// Six-step spacing scale — matches `--space-xs` … `--space-2xl` in the
/// CSS token file. Use `.value` to read the raw `CGFloat` for layout APIs:
/// `VStack(spacing: DSSpace.md.value)` / `.padding(DSSpace.lg.value)`.
enum DSSpace: CGFloat {
    case xs  = 4    // 0.25rem
    case sm  = 8    // 0.5rem
    case md  = 16   // 1rem
    case lg  = 24   // 1.5rem
    case xl  = 40   // 2.5rem
    case xxl = 64   // 4rem  — CGFloat-friendly name for `2xl`

    /// Raw `CGFloat` value of the token.
    var value: CGFloat { rawValue }
}

// (DSMotion removed — zero callers; motion timing lives in MotionTokens,
// which carries the Reduce-Motion gate the charter §18 requires.)


// MARK: - Design System v1.0 · corner radii

/// Three-step radius scale — sm (chips), md (cards), lg (sheets). Use
/// `.cornerRadius(DSRadius.md.value)` or
/// `.clipShape(RoundedRectangle(cornerRadius: DSRadius.lg.value))`.
enum DSRadius: CGFloat {
    case sm = 4     // chips, small buttons
    case md = 8     // cards, surfaces
    case lg = 12    // sheets, full panels

    /// Raw `CGFloat` value of the token.
    var value: CGFloat { rawValue }
}
