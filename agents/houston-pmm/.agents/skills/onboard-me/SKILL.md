---
name: onboard-me
description: Use when the user says "onboard me" / "set me up" / "let's get started" OR this is the first real task and `config/profile.json` is missing — run a tight 3-question interview to capture launch context, top competitors, and voice samples, then write to `config/`. Max 3 questions. Run once.
---

# Onboard Me

## When to use

First-run setup. The user said "onboard me," "set me up," "let's get
started," OR I'm about to do real work for the first time and
`config/profile.json` is missing. Only run ONCE unless explicitly
re-invoked.

## Principles

- **3 questions is the ceiling, not the target.** If I can get away
  with two, I do. Everything else fills in via progressive capture.
- Conversational — one question at a time, wait for the answer,
  write, move on.
- Positioning is heavy — I do NOT try to fully capture Dunford's
  five dimensions here. I get a pitch + differentiator and point the
  user at `define-positioning` for the real thing later.
- Any question the user skips, I note the field as "TBD" in config
  and will ask again just-in-time when a skill hits it.

## Steps

1. **Question 1 (Launch context):** "What are you launching next
   (or recently launched) — and who's it for, in one line?"
   - If they name a launch, create a first row in `launches.json`
     with `status: "idea"`, `audience` from their answer, a slugged
     `name`. Stamp `createdAt`, `updatedAt`.
   - If they don't have one, skip the launches.json write and note
     "no active launch" in `config/profile.json` notes.
2. **Question 2 (Competitive frame):** "Name your top 3 competitors
   and — in one line — what makes you different from them."
   - Parse competitor names into skeletal `config/competitors.json`
     rows: `{ id, slug, name, theirPosition: "TBD", ourCounter: "TBD",
     knownWeaknesses: [], lastReviewedAt: "TBD" }`.
   - Capture the differentiator sentence into a partial
     `config/positioning.json`:
     `{ icp: <from Q1>, competitiveAlternatives: <names>,
     uniqueAttributes: [<sentence>], valueThemes: [], bestForMarket:
     "TBD", elevatorPitch: "TBD", category: "TBD", lastReviewedAt:
     <now> }`. Mark it incomplete so `define-positioning` knows to
     fill in.
3. **Question 3 (Voice):** "Paste your elevator pitch and one recent
   launch post — a blog, LinkedIn, or announcement email — I'll match
   tone."
   - Update `config/positioning.json.elevatorPitch` from the pitch.
   - Write `config/voice.md` with a header `# Voice samples (captured
     {onboardedAt})` and the full launch post verbatim, separated by
     `---`.
4. **Finalize.** Write `config/profile.json` with:
   `{ userName, company, team?, role?, onboardedAt: <ISO-8601 now>,
   status: "onboarded" }`. If the user only answered 1-2 questions,
   set `status: "partial"` and note which fields are TBD.
5. **Tell the user:** "Ready. Two good first moves: `define our
   positioning` to lock the full frame, or `draft a launch brief
   for {their launch}` to get going. I'll fill in the rest as we
   work."

## Outputs

- `config/profile.json`
- `config/positioning.json` (partial — `define-positioning` fills it)
- `config/competitors.json` (skeletal — `create-battlecard` fleshes
  per competitor)
- `config/voice.md`
- Optionally: first row in `launches.json`
