# LOOM Mass-Market Product Strategy — the 3 pillars as Gather → Build → Represent

**Date:** 2026-06-20
**Source:** synthesized from a 4-agent codebase map (drafts / compounding portfolio / Digital Me / positioning).

## Goal
Make LOOM a mass-market product on three pillars: **(1) information & thinking drafts, (2) a compounding knowledge/works/experience portfolio, (3) Digital Me** — a visualized personal "calling-card" of capability.

## The unifying insight: the 3 pillars are ONE loop
Don't ship three tools with three mental models (today's problem). Ship one loop:
- **GATHER** (Pillar 1 — drafts/notes/material): capture thinking + drop material, conversation-first.
- **BUILD** (Pillar 2 — compounding portfolio): that material auto-compounds into evidence-backed identity pages (About / Education / Experience / Works) that interlink and strengthen as more is added (复利).
- **REPRESENT** (Pillar 3 — Digital Me): the profile **answers questions about you, cited from your own gathered material** — a shareable "digital you."

**One-line promise:** *Turn your scattered knowledge into a verifiable identity that answers for you.* ("Your AI knows you because you showed it.")

## Why mass-market — the moat vs alternatives
- vs **LinkedIn / Carrd / Read.cv** (static profiles): LOOM **answers questions**, with proof.
- vs **Notion** (manual docs): LOOM **auto-compounds + represents** — you don't maintain it.
- vs **generic AI chatbots** (ungrounded, hallucinate): LOOM **cites your real material and refuses when unsupported**.

The defensible core = **grounded, source-cited representation of you, built with near-zero effort.**

## The strong base that already exists (grounded in code)
- **Pillar 1:** `app/draft` (markdown drafting w/ source anchors + citations), `lib/note/*` (append-only Note primitive), `lib/capture/from-selection.ts`, `components/FreeInput.tsx` (built but dormant — `/today` redirects away), localStorage draft store.
- **Pillar 2:** `lib/new-loom/verified-dossier-home.ts` (the dossier/evidence model), `/sources` + `/knowledge` (indexed library), the Sources→Draft→Answer pipeline, **PR #43** (proof-optional beginner About/Education/Experience/Home that render from a localStorage profile — DONE).
- **Pillar 3 (the moat already half-built):** `app/digital-me` (Role-OS UI), and crucially **`app/api/ask` + `lib/new-loom/ask-yiping.ts`** already do **real grounded, cited answering** — `cite-only-real-ids`, refuse-when-unsupported, ≥2 resolvable artifacts/question, SSE streaming — currently over *Yiping's* corpus. The hard part exists.

## The core gap → what makes it mass-market
Everything is hardcoded to one person, assumes you arrive with material, and uses forms. To generalize:
1. **Conversation-first onboarding + auto-extract** (résumé/LinkedIn → scaffold), replacing the 5-step form.
2. **Proof-optional rendering** (works with zero files — PR #43 already did most of this).
3. **Digital Me's cited Q&A over the *beginner's own* gathered material** (not the hardcoded corpus) — the moat, generalized.
4. **Shareability** (public URL / downloadable card) — the viral loop.
5. **Gather→Build→Represent narrative on home** so newcomers grasp the loop (home copy currently assumes prior knowledge).
6. **Ongoing capture** (quick-jot `/today`) — the daily-use compounding habit.

## Recommended roadmap (sequence — each phase is demoable)
**★ Critical first slice (the moat, thinnest):** generalize `ask-yiping`'s grounded+cited answering to run over a **beginner's uploaded material** — drop 1 doc → ask 1 question → a correct, *cited* answer. Proves the differentiator on anyone's data; reuses `ask-yiping.ts` + ingest. If this isn't good, nothing else matters.
- **P-A — Conversation-first onboarding + auto-extract:** chat interview + résumé/LinkedIn extraction → scaffolds the profile (PR #43 pages become the *output*, not a form).
- **P-B — Digital Me live "ask-me" on the beginner's profile:** wire the Ask widget to the beginner's own gathered sources, cited.
- **P-C — Shareability:** public `/digital-me/:slug` + downloadable postcard / view-only link.
- **P-D — Home loop narrative + proof-optional polish:** show Gather→Build→Represent; reframe copy to "your knowledge → your identity → your AI."
- **P-E — Daily capture loop:** restore `/today` `FreeInput` + a Cmd-J quick-jot → free-floating `Note`s that later surface in drafts/answers (the compounding habit).

## Disposition of prior work
- **PR #43** (proof-optional beginner pages + localStorage profile) = the rendering substrate for BUILD/REPRESENT output. **Keep it.** The *form framing* is superseded by conversation-first onboarding (P-A).
- **QBook** (`/optibook`) = a Pillar-2 portfolio artifact / Pillar-3 evidence — already polished + deployed.
