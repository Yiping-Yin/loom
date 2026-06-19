# LOOM Beginner Profile Onboarding — Design

**Date:** 2026-06-19
**Status:** Design (approved direction)
**Repo:** `LOOM` (Next 16 / React 19, local-first app; macOS app loads it over `loom://`).

## Context & goal

LOOM's identity pages — Home (`app/HomeClient.tsx`), About (`app/about/AboutClient.tsx`), Education (`app/education/page.tsx`), Experience (`app/experience/page.tsx`) — render from a rich, evidence-linked **"verified dossier"** model (`lib/new-loom/verified-dossier-home.ts`, ~1160 lines: artifacts/PDFs, file badges, UNSW course folders, `/verified-sources` links). That model is hand-authored and specific to the owner. The existing `app/onboarding` flow only points LOOM at a documents folder to ingest — it does **not** let a person input identity info.

**Goal:** let any single beginner populate their own LOOM identity pages without coding, via a guided wizard, and have the **polished pages render gracefully** from just the basics (no evidence files required).

### Non-goals (YAGNI)
- **Single-tenant, local.** No accounts, no server-side multi-user storage, no auth. One profile per LOOM instance (same model as `content-root`/`coworks` local state).
- **No evidence pipeline.** The wizard captures text only (no artifact/PDF uploads, no course-folder linking). Evidence/artifacts remain an owner-level, hand-authored capability.
- **The owner's existing dossier is untouched.** With no beginner profile present, pages render exactly as today.

## Data model — `BeginnerProfile` (new, evidence-free)

New `lib/profile/beginner-profile.ts` (types + a `BeginnerProfile` default/empty):
```ts
export type ProfileLink = { label: 'LinkedIn' | 'GitHub' | 'Website' | string; href: string };
export type EducationEntry = { institution: string; qualification: string; field?: string; start?: string; end?: string; notes?: string };
export type ExperienceEntry = { role: string; organization: string; start?: string; end?: string; location?: string; bullets: string[] };
export type BeginnerProfile = {
  version: 1;
  home: { name: string; headline: string };
  about: { summary: string; links: ProfileLink[] };
  education: EducationEntry[];
  experience: ExperienceEntry[];
};
```
Plain JSON, all sections optional-tolerant (empty arrays / empty strings render as "not provided" → hidden, not broken).

## Persistence — local, mirrors existing patterns

- `lib/profile/profile-store.ts` — `readBeginnerProfile(): Promise<BeginnerProfile | null>` and `writeBeginnerProfile(p)`, storing JSON at `path.join(loomUserDataRoot(), 'beginner-profile.json')`. Mirror `lib/coworks-store.ts` exactly (same `loomUserDataRoot()` from `lib/paths.ts`, same read-try/catch→null, `JSON.stringify(..., null, 2)`).
- `app/api/profile/route.ts` — `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`; `GET` returns the stored profile (or `null`), `POST` validates shape and writes it. Mirror `app/api/content-root/route.ts` structure.

## Graceful rendering — reuse the polished pages

A resolver decides the source per page load: **if a `BeginnerProfile` exists on disk, render from it; else render the existing verified-dossier** (so the owner's LOOM is byte-identical to today).

- Each route's **server `page.tsx`** reads the profile via the store (server-side), picks the source (profile vs dossier), and passes the resolved data down to the presentational component (e.g. `AboutClient`); the client components stay presentational. The profile-driven branch maps `BeginnerProfile` → those existing components, **omitting evidence-only elements** (FileBadge, artifact links, course folders, `/verified-sources` CTAs) when the profile has none.
- Where a page section has no profile data (e.g. no experience entries), render a tasteful empty state, not a crash.
- The owner's rich dossier remains the shipped default and the live example until a beginner saves a profile (which overrides it).
- Keep the existing `LoomGlobalNav` and page chrome; only the data source + evidence-optionality change.

## Wizard — extend `app/onboarding`

A beginner-friendly multi-step flow (new sub-route, e.g. `app/onboarding/profile/` + `ProfileWizardClient.tsx`, leaving the existing folder-ingest onboarding intact):
- Steps: **Home** (name, headline) → **About** (summary, links) → **Education** (add/remove entries) → **Experience** (add/remove entries, bullet list) → **Review/Preview** → **Save**.
- Clear labels + example placeholders + optional fields; add/remove rows for education/experience; a live preview of the resulting page styling where feasible.
- Save → `POST /api/profile`; on success route to `/about` (or Home) so the user immediately sees their polished page.
- Loads any existing profile on entry (edit/resume).

## Phased build (sizable — one spec, phased plan)
- **P1 — schema + persistence:** `beginner-profile.ts`, `profile-store.ts`, `app/api/profile/route.ts` (+ a contract test for round-trip read/write).
- **P2 — graceful rendering:** resolver + profile-driven branch in Home/About/Education/Experience with evidence-optional rendering and empty states; owner-dossier fallback verified unchanged.
- **P3 — wizard UI:** the multi-step `ProfileWizardClient` writing through `/api/profile`, with live preview and edit/resume.

## Verification
- `npm run typecheck` and `npm run test:contracts` green; add contract tests: (a) profile store round-trips; (b) each page renders from a sample `BeginnerProfile` without evidence and shows no FileBadge/artifact elements; (c) with no profile, pages still render the dossier (owner path unchanged).
- Manual: complete the wizard on a fresh profile → `/about`,`/education`,`/experience`,`/` show the entered content, polished, no broken evidence widgets.
- Build on CI (per repo norms; cold local builds can stall — verify on CI).

## Risks & rollback
Additive: new lib + API + a profile-driven branch guarded by "profile exists." With no profile present, behavior is unchanged (owner safe). Local-only persistence: `beginner-profile.json` lives under `loomUserDataRoot()` (outside the repo, like `coworks.json`), so it's never committed. Revert via git.
