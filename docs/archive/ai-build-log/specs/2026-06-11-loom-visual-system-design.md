# Loom Visual System — Design Spec (v1)

_2026-06-11. Supersedes the ad-hoc champagne-gold and the pure-#FCD535 "Binance" passes. Those rounds were executed before the concept was locked; this spec is the locked concept and every surface is rebuilt to it once._

## 0. The problem with what exists

The earlier work read as **toy**, not premium, because it applied *symbols* of quality (bold letters, pure-saturated yellow fills, `backdrop-filter` blur) without a concept. The user's diagnosis: "no design ingenuity," "your use of yellow is still crude," "too surface." Reference for the target quality: Apple.com / visionOS, and a low-saturation cool data-terminal. The premium in those comes from **realism, depth, luminance-layering, and colour used only as information** — never decoration.

## 1. The concept (巧思): The Evidence Desk

Loom is not a site of cards. It is a **lit desk of real, dimensional artifacts** resting on cool-black. Every credential is a believable object: a document casts a soft shadow and sits in slight perspective; a screen recedes into depth with a faint glow; a surface has real material and edge-light. The only connective tissue is a single **thread of light** (the weft) that links an artifact to its source when attended to — the interface is the loom, the evidence are the woven threads. Form binds to meaning: "weaving scattered knowledge into one source-backed identity."

## 2. Foundation — cool-black, luminance-layered

**Structure is carried by luminance + light, never by colour.** This is the single most important rule.

### Canvas & ink ramp (cool-black, a hair of blue undertone — NOT neutral black, NOT navy)
```
--ink-0  #07090C   page base (deepest)
--ink-1  #0A0D11   page / ambient
--ink-2  #0F1318   recessed
--ink-3  #161B22   surface / panel
--ink-4  #1E242D   elevated surface
--ink-5  #2A323D   raised / hover
--line   #232A33   hairline (1px, cool grey)
--line-soft #1A1F27 inner divider
--text-1 #E6E9EE   primary
--text-2 #9BA3AE   secondary
--text-3 #5E6671   tertiary / eyebrows / captions
```

### Accents — precious, sparse, information-only
- **Champagne gold `--gold #C8A24A`** (bright highlight `#E3C56A`). The brand mark. **Watch-hand discipline:** total gold area on any screen < 5%. NEVER a fill of a container / pill / badge / card. Gold appears ONLY as: (a) a 1–2px hairline or active underline; (b) one small mark/dot; (c) a single thin numeral or word at a key moment; (d) a faint glow. The rejected "1 · S" solid-yellow pill is the canonical anti-pattern — banned.
- **Comet-cyan `--cyan #4BC5DE`** — signal/data only (Digital Me, QBook charts, the thread-of-light, "thinking" states). Never a fill.
- **Market `--up #3FB37A` / `--down #E06A6A`** — desaturated; ONLY on price/PnL numerals and mini-sparklines, tiny area.
- No saturated primaries anywhere. Avatars/marks = neutral monograms on `--ink-4`, not coloured discs.

### Light (this is what makes it "real," not flat)
One global **key light, top-left**. Every raised surface gets: a 1px top/left specular highlight (`rgba(255,255,255,0.05)`), and a long soft bottom shadow (`0 24px 60px rgba(0,0,0,0.55)`). Consistency of light direction across the whole site is ~half of the premium.

### Glass — real optics, not a blur
A glass pane = `backdrop-filter: blur(28px) saturate(110%)` **+** 1px specular top edge (light on the bevel) **+** an inner bottom shadow (thickness) **+** a faint refraction tint sampled cool from beneath **+** the long float shadow above. Layered, it reads as visionOS glass. Used on chrome/nav/floating panels, sparingly.

### Type
Cormorant Garamond for display **only**, large, tight tracking, weight 500 — used sparingly. Body: a precise neutral sans (Inter/system), weights 300/450. Eyebrows/data/numerals: one mono, uppercase, wide tracking, `--text-3`. Never bold-everything; hierarchy by size + weight + space, not heaviness.

### Realism rules (the concept in practice)
- Documents → real paper: soft drop shadow, slight perspective, warm-neutral sheet on the cool-black desk.
- Screens (QBook terminal) → shown in receding 3D perspective with reflection + faint glow.
- Cards → real material: a near-flat cool gradient sheen + edge light, never a flat colour block.
- Thread-of-light → a thin cyan/gold light line connects an artifact to its source on focus/hover.

## 3. Four scene light-environments (same tokens, different "lighting rig")

| Scene | Mood | Base | Accent budget | Material |
|-------|------|------|---------------|----------|
| **Cover / Home** | still, luxe, first impression | deepest `--ink-0`, max whitespace | gold ~2 touches, no cyan | hero artifacts (CV, terminal) with real shadow + perspective; soft single key light |
| **Digital Me** | alive, intelligent, signal | `--ink-1` + faint cool ambient glow | cyan data-signal + the thread-of-light; gold on active only | glass panels feel "live"; subtle shimmer; the ask flow lights up |
| **Archive (About/Education/Experience)** | restrained, credible, document-forward | lifted `--ink-2`, neutral | gold only on verified marks; minimal | material dialed DOWN so documents/evidence read clearly |
| **QBook (terminal)** | cold, dense, professional | darkest, highest density | market up/down + cyan chart lines on data only; gold on active control | terminal-grade; hairline dividers; small precise type; zero decoration |

## 4. Application & sequencing

- Implement as CSS custom-property layers: one `:root` foundation (the ramp + accents + light + glass mixins), then per-scene overrides (a `data-scene` attribute or per-route class) adjusting base ink, accent budget, ambient glow, material strength.
- Replace every champagne-gold and pure-#FCD535 value across globals.css (.lcv, .vd-section-page), AboutClient.module.css, DigitalMeRoleOS.module.css, AskYiping.module.css, the support pages, the QBook replica (kill the yellow-fill leaderboard pills → quiet mono rank + neutral monogram avatars), the README screenshots, the deck, and the app icon (the icon's flat-yellow L is also a toy — re-cut to the watch-hand discipline: a thinner gold mark, more luminance, less fill).
- **Contract-test safety:** many tests pin class names, hex tokens, and theme assertions (night-chrome-theme, quiet-horizon-layout, globals-compatibility, the home/section tests). Change visual values only; keep class names/structure; update pinned colour/theme assertions in lockstep; keep `npm run test:contracts` + typecheck + build green.
- **Process:** lock this spec → writing-plans → implement ONCE (after the in-flight QBook round finishes, to avoid concurrent edits) → verify by screenshotting every surface at 1488/1920 and judging against this spec → refresh README/deck/icon → push.

## 5. Anti-patterns (banned)
Solid-colour filled pills/badges/cards (esp. yellow). Saturated primary discs. Bold-everything type. `backdrop-filter` blur with no specular/thickness/shadow (fake glass). Colour used as decoration in structure areas. Accent-line under titles. More than ~5% gold area.
