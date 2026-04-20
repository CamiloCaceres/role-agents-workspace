---
name: onboard-me
description: Use when the user says "onboard me" / "set me up" / "let's get started" OR this is the first real task and `config/profile.json` is missing — run a tight 3-question interview to capture the MVP context (open roles, comp philosophy, voice samples) and seed `config/`. Max 3 questions. Run once.
---

# Onboard Me

## When to use

First-run setup. The user said "onboard me," "set me up," "let's get
started," OR I'm about to do real recruiting work for the first time
and `config/profile.json` is missing. Only run ONCE unless explicitly
re-invoked.

## Principles

- **3 questions is the ceiling, not the target.** If I can get away
  with two, I do. Everything else fills in via progressive capture
  (e.g. `define-role` asks for a scorecard field if missing,
  `draft-candidate-outreach` asks for a voice sample if missing).
- Conversational — one question at a time, wait for the answer,
  write, move on.
- Any field the user skips, I mark "TBD" in config and will ask
  again just-in-time when a skill hits it.

## Steps

1. **Question 1 (Open roles):** "Paste the JDs for your currently-open
   roles, or describe them in one line each."
   - For each role the user names, compute a slug
     (`kebab-case(title)`) and stub `roles/{slug}/brief.md` with
     whatever JD text was pasted (or a one-line placeholder). Do
     NOT write scorecards yet — `define-role` fills those in.
   - Upsert a row into `roles.json` per role with
     `status: "open"`, `title`, `slug`. Timestamp `createdAt` /
     `updatedAt`.
2. **Question 2 (Comp philosophy):** "What's your comp philosophy —
   leveling framework, bands, equity approach?"
   - Parse into `framework` (e.g. "Radford", "Levels.fyi tier 3",
     "internal"), `bands` (array of `{ level, base, bonus?,
     equityRange? }` — free-form if the user is loose), and
     `equityRange`. Keep `principles` as a short bulleted list of
     philosophy notes ("top-of-market cash, mid equity", etc).
   - Write `config/leveling.json`. If any field is TBD, leave it
     empty — progressive capture will ask later.
3. **Question 3 (Voice):** "Paste 2 recent outreach emails and 1
   rejection you've sent so I can match your voice."
   - Capture the raw text verbatim. Structure `config/voice.md` as:
     ```markdown
     # Voice samples (captured {onboardedAt})

     ## Outreach samples

     ### Outreach 1
     ...
     ---
     ### Outreach 2
     ...

     ## Rejection sample
     ...
     ```
4. **Finalize.** Write `config/profile.json` with:
   `{ userName, company, team?, onboardedAt: <ISO-8601 now>,
   status: "onboarded" }`. If the user answered only 1–2 questions,
   set `status: "partial"` and note which fields are TBD.
5. **Tell the user:** "Ready. Ask me to `source candidates for
   {role}` or `daily standup` to get going. I'll fill in the rest
   as we go."

## Outputs

- `config/profile.json`
- `config/leveling.json`
- `config/voice.md`
- `roles/{slug}/brief.md` for each role the user described
- Upserted rows in `roles.json`
