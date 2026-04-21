---
name: edit-draft
description: Use when a draft exists at `drafts/{slug}/draft.md` and the user asks to edit / review / tighten / improve it — run the Seven Sweeps pass (Clarity → Voice & Tone → So What → Prove It → Specificity → Heightened Emotion → Zero Risk), flag overused AI phrases, preserve sources, and optionally score via an expert panel. Writes to `drafts/{slug}/edit-pass.md`. Never rewrites the piece from zero.
---

# Edit Draft

## When to use

- `drafts/{slug}/draft.md` exists and the user says "edit this,"
  "tighten this," "review the draft," "pass over this," or "give
  me an editor's markup."
- A draft just landed from a connected CMS and is ready for a
  voice + quality pass before publish.
- The user hands me a file or URL and asks for an edit pass — save
  it to `drafts/{slug}/draft.md` first.

## Principles

- **I edit, I don't rewrite.** The draft is the user's (or a
  writer's) voice. My job is to sharpen, not replace.
- **Seven sweeps, one dimension per pass.** Mixing sweeps loses
  discipline. Each pass looks for ONE thing.
- **Later sweeps may revise earlier sweeps.** Sweep 6 might soften a
  line sweep 1 tightened. That's fine — revisit.
- **No AI tells.** "Delve," "landscape," "navigate," "unlock," "in
  today's fast-paced world," "game-changer," "robust," "seamless,"
  "cutting-edge" (unless it's literally the topic). Flag every
  occurrence with a specific replacement.
- **Preserve sources.** Every citation, link, and quote in the
  input must carry forward. If I remove one, I say why.
- **Cite claims or flag them.** A sentence that makes a numerical
  claim without a source is a blocker.

## Inputs expected

- **Required:** `drafts/{slug}/draft.md`, `config/brand-voice.md`.
- **Nice to have:** `drafts/{slug}/brief.md` (for intent),
  `config/content-pillars.json` (for audience + buyer stage).

## Steps

1. **Resolve the draft.** Parse the slug. Read `drafts/{slug}/draft.md`.
   If missing, ask the user to drop it at that path or paste the
   body in chat (I'll write it for them).
2. **Read voice.** Read `config/brand-voice.md`. If missing, ask:
   "I don't have your brand voice yet — paste 2-3 recent pieces or,
   best option, point me at your connected CMS and I'll pull 5-10."
   Write `config/brand-voice.md` before proceeding.
3. **Read brief (if present).** `drafts/{slug}/brief.md` gives me
   intent (searchable/shareable, buyer stage, pillar). Calibrate
   expectations.
4. **Run Seven Sweeps.** ONE dimension per sweep. For each, score
   the draft 0-10 and list specific line edits with reasoning.
   1. **Clarity** — every sentence understandable on first read.
      Cut filler, unpack jargon, clarify pronouns. Score: how much
      cognitive load the reader pays for no value.
   2. **Voice & Tone** — does each paragraph sit at the brand-voice
      spectrums? Flag drift. Channel-aware: a blog post reads
      differently than a newsletter or LinkedIn post — consult the
      tone-by-channel reference below.
   3. **So What** — every claim/fact/example carries consequence
      for the reader. Flag sentences that exist but don't move the
      reader forward.
   4. **Prove It** — every claim that needs a citation has one.
      Flag "many," "most," "studies show," "typically," unnamed
      benchmarks, round numbers without a source.
   5. **Specificity** — concrete nouns, real numbers, named
      examples replace vague descriptors. "Customers love X" →
      "3 of 5 enterprise customers renewed early in Q4."
   6. **Heightened Emotion** — the reader feels the stakes. Not
      melodrama — precise, earned emotion. Where could a specific
      anecdote do the work a generic line is doing?
   7. **Zero Risk** — removed surprises that break the reader's
      trust: over-promises, unclear pricing, hidden caveats,
      required-but-undisclosed context, unverifiable stats.
5. **Overused-AI-phrase sweep.** Scan the WHOLE draft for the
   banned-phrase list in `config/brand-voice.md` and the baseline
   AI tells (delve, landscape, navigate, unlock, seamless,
   game-changer, cutting-edge, in today's fast-paced world,
   etc.). For every hit, record `{ line number, exact phrase,
   suggested replacement rooted in the draft's own content }`.
6. **Sources preserved check.** Enumerate every link, quote, and
   citation in the input. Verify each carries into the edit
   proposal. If any was dropped, note it + why.
7. **Claims-needing-citation list.** Any numerical claim, ranking,
   comparative superlative, or industry statement without a source
   → blocker. List each with the exact sentence.
8. **Optional — Expert Panel (only when user asks or score avg
   < 7).** Reread from 3-4 personas:
   - Target reader (most important — use `buyerStage` from brief).
   - Conversion copywriter (is the CTA earned?).
   - Subject-matter skeptic (what would a power-user or expert
     call BS on?).
   - Optional: brand strategist (does it reinforce or erode the
     pillar?).
   Each scores 0-10 and names the top 1-2 points of friction.
   Average score, write to `drafts.json.panelScore`.
9. **Tone-by-channel reference** (consulted in Sweep 2):
   | Channel | Tone adjustment | Example |
   |---|---|---|
   | Blog / long-form | Default brand voice; room to breathe | — |
   | Newsletter | Warmer, first-person, tight | "Here's what I saw this week..." |
   | LinkedIn | Slightly more formal, hook-first, benefit-led | "The mistake most founders make with X..." |
   | Twitter/X | Punchy, opinion-first, compression | "X is overrated. Here's why." |
   | Sales-adjacent | Claim-proof-CTA structure, comparative OK | — |
   | Support-adjacent | Clear, stepwise, zero marketing | — |
10. **Write `drafts/{slug}/edit-pass.md`** using the data-schema.md
    template. Include:
    - Per-sweep score table (1-7).
    - Per-sweep markup (line-level edits with reasoning).
    - Expert panel table (if run).
    - Overused-AI-phrase flags with replacements.
    - Claims-needing-citation list.
    - Sources-preserved confirmation.
11. **Update state.**
    - Upsert `drafts.json` row: `status: "edited"` (or
      `"revising"` if there are blocking claims), increment
      `sweepsCompleted` to 7, update `wordCount`,
      `lastEditedAt: now`, set `panelScore` if run.
    - Do NOT touch `drafts/{slug}/draft.md` — edits are proposals,
      applied on user approval only.
12. **Tell the user.** Surface the lowest-scoring sweep as the
    headline issue + one concrete fix. Example: "Sweep 4 (Prove It)
    scored 5/10 — six claims need citations. Top fix: {specific
    paragraph}." Offer the follow-up menu:
    - "Apply all approved edits to `draft.md`."
    - "Expert panel re-read."
    - "Help me source the missing citations."
    - "Move on to `write-headline-variants`."

## Outputs

- `drafts/{slug}/edit-pass.md`
- Updated row in `drafts.json`
- Possible append to `config/brand-voice.md` banned-phrases list
  (when the user rejects a suggestion and marks a phrase as
  always-allowed or always-banned)
