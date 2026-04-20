---
name: draft-offer-letter
description: Use when a candidate is at the offer stage (e.g. "make an offer to {candidate}" / "draft the offer for X") — produce the offer letter draft (base / equity / bonus breakdown plus letter body) grounded on leveling config + role scorecard + candidate context, flag it for legal review, and record the offer. Never sends. Never extends without explicit approval.
---

# Draft Offer Letter

## When to use

The user said "make an offer to {candidate}" / "draft the offer for
X" / "push {candidate} to offer." I draft; I flag for legal review;
the user approves; the user (or an approved send path) extends the
offer. I NEVER extend an offer on my own.

## Principles

- **Comp comes from `config/leveling.json` + role scorecard, not
  vibes.** If the role's level doesn't map cleanly to a band, I
  stop and ask.
- **Legal review is required.** I stamp the draft `legalReviewRequired: true`.
- **Never disclose offer to the candidate without approval.** Even a
  verbal warm-up requires the user to say "yes, share the
  numbers."

## Steps

1. **Verify the user's intent.** Read back: "Offer to {name} for
   {role} at {level}?" Wait for confirmation.
2. **Gather context.** Read:
   - `candidates/{slug}/candidate.json`
   - `candidates/{slug}/screen-notes.md` (for any comp signals
     the candidate shared)
   - `candidates/{slug}/thread.json`
   - `roles/{roleSlug}/scorecard.json` (target comp)
   - `config/leveling.json` (framework, bands, equity approach)
   - `config/profile.json` (company + legal name if captured)
3. **Map the level.** Match the role's `level` to a band in
   `config/leveling.json`. If no match, ask the user ONE
   question: "What level/band are you offering {name}?" Update
   `config/leveling.json` if they name a new band.
4. **Propose the numbers.**
   - **Base:** within the band's base range; default to band
     midpoint unless the candidate disclosed a higher anchor
     (surface the anchor and let the user decide).
   - **Equity:** band-matched, in the company's equity form
     (options / RSUs / phantom, per `config/leveling.json`).
     Include vesting schedule.
   - **Bonus:** band-matched if any.
   - **Sign-on:** ask the user — I don't infer sign-on from
     bands.
5. **Draft the letter body.** Sections:
   - `## Offer to {Name}` (role title, level, start date target
     from scorecard)
   - `## Compensation`
     - Base salary
     - Equity grant (type, amount, vesting)
     - Bonus (if any)
     - Sign-on (if any)
   - `## Role scope` — 3–5 bullets summarizing role outcomes
     from `roles/{roleSlug}/brief.md`. Do not paste the full JD.
   - `## What happens next` — 1-paragraph process: reply to
     confirm interest, countersigned letter, background/reference
     checks, start date.
   - `## Questions` — invite the candidate to ask; name the
     person who answers comp questions.
6. **Match voice lightly.** Offer letters should be clean and
   plain, but the CTA/close line can reflect `config/voice.md`.
7. **Write** to `candidates/{slug}/offer-draft.md`:
   ```markdown
   ## Meta
   legalReviewRequired: true
   bandUsed: {level}
   rationale: {why this number inside the band}

   ## Letter body
   (the full letter)
   ```
8. **Record the offer.** Upsert into `offers.json`:
   ```ts
   interface Offer {
     id: string;
     candidateSlug: string;
     roleId: string;
     level: string;
     base: string;
     equity: string;
     bonus?: string;
     signOn?: string;
     status: "drafted" | "legal-review" | "sent" | "accepted" | "declined" | "withdrawn";
     legalReviewRequired: boolean;
     createdAt: string;
     updatedAt: string;
   }
   ```
   Default `status: "drafted"`.
9. **Update `candidates.json`**: set `stage: "offer"`,
   `status: "offer-drafted"`, `lastTouchedAt: now`.
10. **Update `pipelines.json`** counts for the role.
11. **Flag for legal.** Tell the user the draft exists and that
    it's marked `legalReviewRequired`. Ask: "Run through legal
    first, or the user's own review?"
12. **Never send.** Even after legal review, the user (or an
    approved automation) extends the offer — not me.

## Outputs

- `candidates/{slug}/offer-draft.md` (overwritten)
- Upserted row in `offers.json`
- Updated `candidates.json` row
- Updated `pipelines.json` entry
