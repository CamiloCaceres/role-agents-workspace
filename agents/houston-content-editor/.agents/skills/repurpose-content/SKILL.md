---
name: repurpose-content
description: Use when a piece is published and needs distribution derivatives — "repurpose {slug}," "turn this into a thread," "pull clips from this post" — extract Content Atoms (quotable moment, story arc, tactical tip, contrarian take, data callout, BTS) and draft channel-specific derivatives (LinkedIn long-form, Twitter/X thread, newsletter feature, short-video script). Writes to `published/{slug}/repurposed.md`. Never publishes.
---

# Repurpose Content

## When to use

- A piece just cleared `prepare-publish` and a
  `repurposing-queue.json` row was seeded.
- The user names a published piece and asks to turn it into a
  thread, LinkedIn post, newsletter feature, video script, or
  carousel.
- On a weekly sweep: the user says "what should I repurpose this
  week" — I pull from `repurposing-queue.json` and propose next
  pieces to derivative.

## Principles

- **Content Atoms first, derivatives second.** Never draft a
  thread from scratch — extract the atoms, then assemble.
- **One atom can feed multiple channels.** A data callout can
  anchor a LinkedIn post AND a tweet AND the hook for a video.
- **Derivatives are not excerpts.** A standalone atom-driven post
  should hold up without the original piece. If it needs "read
  the full post to understand this," it's an excerpt — rewrite.
- **Voice transfers, shape changes.** LinkedIn reads more formal
  than Twitter; newsletter reads warmer than blog. Apply the
  tone-by-channel matrix from `edit-draft`.
- **Never invent.** Atoms must be traceable to the source piece
  (line number or section). No new stats, no new customer names.

## Inputs expected

- **Required:** `published/{slug}/` OR `drafts/{slug}/draft.md`
  (if repurposing pre-publish at user's request), plus
  `config/brand-voice.md`.
- **Nice to have:** `config/cadence.json` (for channel list),
  `published/{slug}/performance.md` (winners get more derivatives).

## Steps

1. **Resolve the source.** Parse the slug. Read the published
   piece (or draft). Load `config/brand-voice.md` and
   `config/cadence.json.channels`.
2. **Extract Content Atoms — 5-10 per piece.** Taxonomy:
   1. **Quotable moment** — a single sentence from the piece
      that stands on its own. Verbatim. Cite source paragraph.
   2. **Story arc** — a mini narrative from the piece (setup →
      conflict → outcome) in 2-3 sentences.
   3. **Tactical tip** — a concrete, actionable one-liner the
      reader can apply today.
   4. **Contrarian take** — a claim that pushes against the
      default assumption in the space.
   5. **Data callout** — a specific stat + source. "36% of X,"
      "up from 12% in 2024." Always cite.
   6. **BTS (behind-the-scenes)** — an anecdote about how the
      piece / product / experiment was made. Humanizes.
   Also acceptable when present: **framework/mental model**,
   **list of N** (extracted from a listicle piece).
3. **Write the atom inventory** to `published/{slug}/repurposed.md`
   using the data-schema.md template. Each atom cites the source
   paragraph/line.
4. **Decide derivative set.** Default from `config/cadence.json`:
   - If channels include LinkedIn → LinkedIn long-form.
   - If channels include Twitter/X → thread + single-tweet
     alternate.
   - If channels include newsletter → newsletter feature.
   - If channels include YouTube/TikTok/Instagram reels → short-
     video script.
   - If channels include Instagram → carousel outline (if the user
     opts in).
   The user can override ("just the thread this time").
5. **Draft each derivative from atoms:**

   **LinkedIn long-form** (150-300 words, scroll-friendly line
   breaks):
   - Hook: atom 1 (quotable) OR atom 4 (contrarian).
   - Body: atom 2 (story) + atom 3 (tactic).
   - Proof: atom 5 (data callout).
   - CTA: link to the original piece or a direct ask.

   **Twitter/X thread** (6-10 tweets, 240 chars each):
   - 1/ Hook — atom 4 (contrarian) or atom 1 (quotable).
   - 2/ Problem setup — from the original piece's framing.
   - 3-4/ Story or tactic — atom 2 or atom 3.
   - 5/ Proof — atom 5 (data).
   - 6/ BTS — atom 6 (humanize).
   - 7/ Payoff restated.
   - 8/ CTA + link.
   Plus a **single-tweet alternate** for users who scroll past
   threads.

   **Newsletter feature** (300-500 words, warmer tone):
   - Open with atom 2 (story arc).
   - Middle: atom 3 (tactic) + atom 5 (data).
   - Close: atom 6 (BTS) + link-back + one-line reader ask.

   **Short-video script** (30-60 seconds):
   - 0-3s hook: atom 4 (contrarian) or atom 1 (quotable).
   - 3-25s body: atom 3 (tactic) — specific, demonstrable.
   - 25-45s payoff: atom 5 (data) or atom 2 (outcome).
   - 45-60s CTA: subscribe / follow / link in bio.
   Format: `[SHOT] / [SPEAKER LINE] / [ON-SCREEN TEXT]`.

   **Carousel** (if requested, 5-8 slides):
   - Slide 1: hook (atom 1 or 4).
   - Slides 2-N: atom 3 (tactic) broken into steps.
   - Final slide: CTA.

6. **Voice & ban-phrase sweep** on every derivative. Same
   spectrums, same banned list. Flag + rewrite before presenting.
7. **Update state.**
   - Append all derivatives to `published/{slug}/repurposed.md`.
   - Update `repurposing-queue.json` row:
     `derivativesDone` → push each channel drafted.
     `status` → `"drafted"` (or `"published"` after user confirms
     distribution on their own).
   - If all planned derivatives are done, flip `status` to
     `"published"` once user confirms.
8. **Tell the user:** "Drafted {N} derivatives from {M} atoms.
   I'd ship the LinkedIn first — atom 4 hits hardest for your
   ICP. Want me to run headline variants on the thread hook, or
   move to the next piece in the queue?"
9. **Follow-up menu:**
   - "Another angle on the thread — swap atom 4 for atom 1."
   - "Write a follow-up piece from atom {N}."
   - "Queue distribution via my connected social scheduler."
     (Only drafts the payload; user approves send.)
   - "Show me the next piece in the repurposing queue."

## Outputs

- `published/{slug}/repurposed.md`
- Updated row in `repurposing-queue.json`
