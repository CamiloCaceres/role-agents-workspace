---
name: write-headline-variants
description: Use when a draft is close to final and needs headline / subject-line / hook options — "write headlines for {slug}," "I need subject lines," "give me LinkedIn hooks" — produce 5-7 options per active channel with an explicit hook-type + angle rationale so the user can pick on reasoning, not gut. Writes to `drafts/{slug}/headlines.md`. Never publishes.
---

# Write Headline Variants

## When to use

- A draft has cleared `edit-draft` and is approaching publish.
- The user asks for headlines, titles, subject lines, LinkedIn
  hooks, or Twitter thread openers.
- Repurposing a published piece (`repurpose-content`) needs
  channel-specific hooks.

## Principles

- **5-7 per channel, not 20.** Each option must carry a distinct
  hook or angle. Duplicates of the same idea at slightly different
  word counts are not variants.
- **Rationale per option.** `hook_type + angle` so the user can
  pick on thinking, not preference.
- **Channel shape matters.** A blog H1 reads differently than a
  newsletter subject line than a LinkedIn hook than a Twitter
  opener. Don't copy-paste across channels.
- **Benefit over feature, specificity over superlative.** "The
  3-step framework I used to triple newsletter opens" beats "An
  amazing guide to growing your newsletter."

## Inputs expected

- **Required:** `drafts/{slug}/draft.md` OR
  `published/{slug}/` for repurposing.
- **Nice to have:** `drafts/{slug}/brief.md` (primary keyword +
  audience + buyer stage), `config/brand-voice.md`.

## Steps

1. **Resolve the subject.** Parse the slug. Read the draft (or
   published piece) and extract the thesis, the 2-3 strongest
   claims, the named specificity (numbers, customer names, time
   windows), and the stakes for the reader.
2. **Read intent.** Read `drafts/{slug}/brief.md` if present —
   primary keyword, audience, buyer stage, type (searchable /
   shareable). For a blog H1 in a searchable piece, the primary
   keyword belongs in the first 30 characters.
3. **Pick active channels.** From `config/cadence.json.channels`
   plus whatever the user specified. Never generate for channels
   the user doesn't publish on.
4. **Generate per channel, 5-7 options each.** Rotate through the
   hook-type + angle matrix below — no two options should share
   the same cell.

   **Hook types** (how the line grabs attention):
   - **Curiosity** — withholds a specific piece of the payoff.
     "The one mistake that cost us $40k."
   - **Story** — puts the reader into a scene.
     "I spent three months on the wrong keyword strategy."
   - **Value** — promises a specific outcome.
     "Cut newsletter unsubscribes 40% in 60 days."
   - **Contrarian** — positions against the default.
     "Most SEO advice in 2026 is obsolete. Here's what still works."

   **Angles** (what the line argues for):
   - **Pain** — the problem a real reader is living with right now.
   - **Outcome** — the measurable result after reading/acting.
   - **Social proof** — specific named adoption / result.
   - **Comparison** — us-vs-alternative or old-vs-new.
   - **Urgency** — a reason this matters now (seasonal, policy,
     market shift).
   - **Identity** — speaks to a group the reader claims ("for
     founders who do their own content").
   - **Contrarian** — takes a position most readers won't.

   Cross-combine to fill 5-7 cells per channel. Example per channel:

   **Blog H1** (weight: primary keyword in first 30 chars if
   searchable, under 65 chars total):
   - Curiosity × Pain: "..."
   - Value × Outcome: "..."
   - Story × Identity: "..."
   - Contrarian × Comparison: "..."
   - Curiosity × Social proof: "..."

   **Newsletter subject** (weight: 40-60 chars, preview text
   plays the straight-man):
   - Story × Pain: "..."
   - Curiosity × Urgency: "..."
   - ...

   **LinkedIn hook** (first line — up to ~210 chars before the
   "see more" fold):
   - Contrarian × Identity: "..."
   - Story × Outcome: "..."
   - ...

   **Twitter/X** (single-tweet opener, up to 240 chars, scroll-
   stopping):
   - Value × Comparison: "..."
   - Curiosity × Contrarian: "..."
   - ...

5. **Annotate each option.** For every headline, append:
   `— hook: {type} · angle: {angle} · why it works: {1-sentence}`.
6. **Voice gate.** Run each option against `config/brand-voice.md`
   spectrums. Flag any that drift (e.g. a playful hook for a
   brand positioned at Formality 8/10). Don't remove them — let
   the user choose; just mark "⚠ voice drift."
7. **AI-phrase sweep.** If any option contains a banned phrase
   from `config/brand-voice.md` or the baseline AI tells, rewrite
   in place before presenting — never ship a flagged headline.
8. **Write `drafts/{slug}/headlines.md`** using the data-schema.md
   template (headers per channel + numbered options each).
9. **Tell the user** which option I'd pick and why, then list the
   rest. Example: "If it were mine, I'd ship **option 2** for
   the blog H1 — Value × Outcome hits the searcher's intent + the
   primary keyword in the first 30 chars. Runners-up: 4 for
   curiosity, 6 for contrarian take."
10. **Follow-up menu:**
    - "Adjust for {channel} — more {curiosity|value|contrarian}."
    - "Swap in a different angle — {specific}."
    - "Run against {personas} — will they click?"
    - "Finalize and move on to `prepare-publish`."

## Outputs

- `drafts/{slug}/headlines.md`
