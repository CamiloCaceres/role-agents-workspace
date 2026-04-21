---
name: onboard-me
description: Use when the user says "onboard me" / "set me up" / "let's get started" OR this is the first real task and `config/profile.json` is missing — open with a modalities preamble (paste / file / URL / connected app via Composio), then run a tight 3-question interview to capture content mission + pillars, cadence + channels, and voice samples. Write to `config/`. Max 3 questions. Run once.
---

# Onboard Me

## When to use

First-run setup. The user said "onboard me," "set me up," "let's get
started," OR I'm about to do real work for the first time and
`config/profile.json` is missing. Only run ONCE unless explicitly
re-invoked.

## Principles

- **3 questions is the ceiling, not the target.** If I can get away
  with 2, I do. Everything else fills in via progressive capture.
- **Lead with a scope + modality preamble.** Users see the whole
  journey up front and can grab the right source (a CMS, a Drive
  link, a Notion doc) before answering.
- **Voice capture favors connected-inbox/CMS fidelity.** 5-10 real
  published pieces beat 2 pasted samples every time.
- Any skipped question: note "TBD" and ask again just-in-time when
  needed.

## Steps

0. **Scope + modality preamble — the FIRST message:**

   > "Let's get you set up — 3 quick questions, about 90 seconds.
   > Here's what I need to know and the easiest way to share each:
   >
   > 1. **Content mission + pillars** — in one sentence: who reads
   >    your content, why, what they should do after. Then 3-5
   >    topic pillars you want to own.
   >    *Paste, or drop your brand / content strategy doc if you
   >    have one.*
   > 2. **Cadence + channels** — how often you publish and where
   >    (blog, newsletter, LinkedIn, YouTube, podcast, etc).
   >    *Paste, or — best option — if your calendar tool (Notion,
   >    Airtable, Trello) is connected via Composio, point me at
   >    the board and I'll infer cadence.*
   > 3. **Voice samples** — two pieces of your published content:
   >    your best + a recent one. I'll calibrate your brand voice.
   >    *Best option: if your CMS (WordPress, Ghost, Webflow,
   >    Substack) or inbox is connected via Composio, say so — I'll
   >    pull 5-10 recent pieces for a richer voice model. Otherwise
   >    give me URLs or drop the files.*
   >
   > For any of these you can also drop files, share public URLs, or
   > point me at a connected app. Let's start with #1 — in one line,
   > who reads your content and what do you want them to do after?"

1. **Capture Q1 — mission + pillars.** Parse the mission sentence.
   Then ask for 3-5 pillar names in the same turn if the user didn't
   offer them ("Great — now give me 3-5 topic pillars you want to
   own. A pillar is a theme, not a keyword. For each, one line on
   who it's for."). For each pillar row, write to
   `config/content-pillars.json`:
   `{ id (UUID), slug (kebab-case), name, description,
   targetAudience, primaryBuyerStage: "awareness" (default, user can
   correct later), percentOfCalendar: <even-split default> }`.

2. **Capture Q2 — cadence + channels.** Parse the weekly rhythm and
   list of channels. If the user pointed me at a connected calendar
   tool, discover the right slug with `composio search` (keywords:
   "calendar", "content", "editorial", "notion", "airtable",
   "trello") and pull the last 60 days of scheduled items to infer
   cadence. Write `config/cadence.json` with
   `{ channels, weeklySchedule: [{day, channel}], lookAheadWeeks: 6,
   seasonalAnchors: [] }`. If any field is ambiguous, record it with
   a best-guess + "TBD" note.

3. **Capture Q3 — voice samples.** Route by modality:
   - **Connected CMS** → `composio search` for the right CMS tool,
     pull 5-10 most recent published pieces. Extract tone cues and
     bodies.
   - **URLs** → fetch each URL, extract main content (strip nav,
     ads, footers).
   - **Files** → read each file.
   - **Paste** → accept whatever the user pasted.
   Write `config/brand-voice.md` using this template (use the
   structure below verbatim; fill in the values from the samples):
   ```markdown
   # Brand voice (captured {onboardedAt})

   ## Voice attribute spectrums
   | Spectrum | Our position (1-10) | We sound like | We do NOT sound like |
   |---|---|---|---|
   | Formality (1=casual, 10=formal) | {n} | {phrase from samples} | {counter-phrase} |
   | Authority (1=peer, 10=expert) | {n} | ... | ... |
   | Emotion (1=neutral, 10=expressive) | {n} | ... | ... |
   | Complexity (1=simple, 10=technical) | {n} | ... | ... |
   | Energy (1=measured, 10=energetic) | {n} | ... | ... |
   | Humor (1=serious, 10=playful) | {n} | ... | ... |
   | Innovation (1=traditional, 10=cutting-edge) | {n} | ... | ... |

   ## Banned phrases
   - "delve"
   - "landscape"
   - "in today's fast-paced world"
   - "unlock"
   - "navigate"

   ## Verbatim samples
   ---
   {Sample 1 — title, URL or file, date, body verbatim}
   ---
   {Sample 2}
   ---
   ```
   For each spectrum, infer the position from the samples (don't ask
   the user to rank 7 dimensions — I do it and they correct it).

4. **Finalize.** Write `config/profile.json`:
   `{ userName, company, team?, role?, onboardedAt: <ISO-8601 now>,
   status: "onboarded" }`. If the user only answered 1-2 questions,
   set `status: "partial"` and note which fields are TBD.

5. **Tell the user:** "Ready. Three good first moves: `plan the
   next 6 weeks of content` to fill the calendar, `create an SEO
   brief for {keyword}` to start a piece, or drop an existing
   draft at `drafts/{slug}/draft.md` and ask me to `edit-draft`.
   I'll fill in the rest as we work."

## Outputs

- `config/profile.json`
- `config/content-pillars.json`
- `config/cadence.json`
- `config/brand-voice.md`
