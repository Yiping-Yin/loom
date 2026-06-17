# LOOM History page — "Descent" redesign

**Date:** 2026-06-14
**Status:** Approved (verbal), implementing.
**Scope:** `/product-history` only. Files under `components/product-history/**` + one moon asset under `public/loom/history/`. No commits without explicit ask. Contracts (`npm run test:contracts`) stay green.

## Concept (the spine)

One vertical journey: **an identity in space, resting on the evidence it's built from.** The hero is deep space — the Digital Me (astronaut) meeting its memory (the moon), the origin "first contact." Scrolling **lands** the page at a horizon where space resolves into the grounded archive (the real sources/versions). "History" = looking back down the strata you're made of. **Cyan is the only colour** — the signal of a living mind in the void.

Tokens: `--signature-cyan #4BC5DE`, `--signature-cyan-hi #8AF7E6`, data cyan `#6CE7F2`. Everything else stays photographic black-and-white.

## 1 · Hero — the space

- **Moon:** sharp, vast, center-right, dramatic B&W. Source a higher-resolution moon (or stop the filter/keying from softening it) so it stays crisp; size it to read as a crisp orb, not a fuzzy balloon.
- **Astronaut (Digital Me):** smaller than memory; in front of the moon's right limb; suit pressed into the black (only head + visor lit).
- **"History":** italic display masthead, left, aligned to the 299 content column, soft atmospheric shadow for legibility over the moon.
- **Cyan meteor:** one thin cyan streak across the upper void, slow + occasional (~10s cycle), glowing head + fading tail. Pure CSS, loops.
- **Visor LOOM:** a scan sweep *draws* the mark on arrival; the **OO (eyes) settle glowing cyan with a slow breathing pulse**; L + M stay white. Desktop hover re-triggers; touch stays lit.

## 2 · The landing — the hinge

A **horizon hairline** (faint cyan glow) where space meets ground; the hero's deep-space gradient resolves into the archive tone; the **timeline strip sits on that horizon** as the first stratum.

## 3 · The grounded archive — the evidence

The already-polished editorial page (aligned titles at the column, unified headline tier, AA-legible ink), reframed as the ground. The mark band ("LOOM" → L·OO·M) leads, with its **OO subtly cyan** to rhyme with the visor.

## 4 · Colour & motion discipline

Cyan only (meteor, visor OO, mark OO, hairline ticks, hover). All motion is CSS, static-export-safe, and fully disabled under `prefers-reduced-motion`.

## Build order

1. Sharper moon asset (source/regenerate; verify crisp at display size).
2. Hero composition (moon size/position, astronaut size/position) — refine to the above.
3. Horizon landing (hero → archive transition).
4. Cyan meteor animation.
5. Visor LOOM scan-reveal + cyan OO breathing pulse.
6. Mark band OO → cyan.
7. `prefers-reduced-motion` pass + cyan-discipline audit.
8. Verify: desktop + mobile renders, `npm run test:contracts`.
