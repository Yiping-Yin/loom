# Carved-glass moon — Blender modeling pipeline

Real glass optics for the LOOM moon (owner directive 2026-07-04:
"用建模…一个我们要的月亮和周边光影效果").

- `moon_model.py` — headless Cycles scene: glass slab (IOR 1.5) facing
  camera, frosted dark moon disc with procedural crater bump behind it,
  DISK area backlight slightly larger than the disc (the blazing limb
  ring comes from parallax spill), cool front fill for surface texture,
  dark floor receiving the transmitted light pool, near-black world.
- Bloom is a PIL post-pass (threshold → gaussian ×2 → screen), since the
  Blender 5 compositor node-group API changed.

Run:
  blender --background --python moon_model.py -- OUT.png [samples] [res]

Roles:
- Renders are the DESIGN MASTER (ground truth) for calibrating the
  procedural SwiftUI `MoonGlassRelief` (instrument room — bitmaps banned
  there by contract pins).
- High-res renders are legal STAGE assets (About / History / marketing).

`moon_master_v5.png` — the accepted iteration-5 master (768px/200spl).
