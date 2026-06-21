import type { BeginnerProfile } from '../profile/beginner-profile';

export type Star = { id: string; label: string; x: number; y: number; magnitude: number };
export type Constellation = { stars: Star[]; comet: Star | null };

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

function place(seed: string): { x: number; y: number } {
  const h = hash(seed);
  return { x: 8 + (h % 84), y: 8 + ((h >>> 8) % 84) };
}

/** One ambient star per completed identity area; the heaviest area becomes a comet. */
export function constellationFor(p: BeginnerProfile): Constellation {
  // Real BeginnerProfile keys used:
  //   p.home.name          — home.name (string, empty = unfilled)
  //   p.home.headline      — home.headline (string, empty = unfilled)
  //   p.about.summary      — about.summary (string, always present, empty = unfilled)
  //   p.education          — EducationEntry[] (always present, empty = unfilled)
  //   p.experience         — ExperienceEntry[] (always present, empty = unfilled)
  // No optional chaining needed: all fields are guaranteed by emptyBeginnerProfile().
  const areas = [
    { id: 'name',       label: p.home.name || 'You',      filled: !!p.home.name,         weight: 1 },
    { id: 'headline',   label: p.home.headline || 'Focus', filled: !!p.home.headline,     weight: 1 },
    { id: 'about',      label: 'About',                    filled: !!p.about.summary,     weight: 1 },
    { id: 'education',  label: 'Education',                filled: p.education.length > 0, weight: 2 },
    { id: 'experience', label: 'Experience',               filled: p.experience.length > 0, weight: 2 },
  ];

  const stars: Star[] = areas
    .filter((a) => a.filled)
    .map((a) => ({ id: a.id, label: a.label, ...place(a.id + ':' + a.label), magnitude: a.weight }));

  const comet = stars.length
    ? stars.reduce((m, s) => (s.magnitude > m.magnitude ? s : m), stars[0])
    : null;

  return { stars, comet };
}
