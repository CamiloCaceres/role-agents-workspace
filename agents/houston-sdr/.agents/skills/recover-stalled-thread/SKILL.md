---
name: recover-stalled-thread
description: Use when a lead has been sequenced but not replied for N days past their last touch (default threshold: 7 days) — draft a pattern-breaking follow-up grounded on the prior thread, referencing something specific from the last outbound, with a clear low-commitment CTA. Marks the lead as needing outreach.
---

# Recover Stalled Thread

## When to use

A lead's `leads.json` row has `status: "sequenced"` and
`lastTouchedAt` is more than 7 days ago (the user can override the
threshold — e.g. "revive anything stalled over 14 days"). Either the
user asked me to sweep stalled leads or the dashboard is showing a
"Stalled" count > 0 and they asked me to act on it.

## Steps

1. **Verify the lead is actually stalled.** Read `leads.json`:
   `status === "sequenced"`, `lastTouchedAt` older than the
   threshold (default 7 days), no recent `replies.json` entry. If
   the lead has already replied (status `replied` or further), the
   right skill is `respond-to-objection` or `book-meeting`, not
   this one — stop and tell the user.
2. **Read the prior thread.** Read
   `leads/{slug}/thread.json`. Pull the last 1–2 outbound messages
   — I'll reference something specific from them to avoid sounding
   like a copy-paste bump.
3. **Pick a pattern-break angle.** Options, in rough order of
   preference:
   - A new specific signal from their company (news, hiring, launch)
     that landed since the last touch.
   - A reframe of the original pain from a different angle.
   - A short, useful artifact (benchmark, one-line insight) with no
     ask.
   - A permission-based breakup ("Should I close the loop, or is a
     15-min chat worth it?").
   Lean toward the "breakup" pattern when the lead has had 3+
   touches already — it generates the highest reply rate.
4. **Draft a ~50–80 word message** in voice from `config/voice.md`.
   Rules:
   - Reference the prior thread concretely ("Last time I sent
     over…" or "A couple weeks back I asked about…"). Do NOT
     apologize for following up.
   - One clear low-commitment CTA ("yes/no is fine," "15 min next
     week or should I close the loop?").
   - No "just checking in." No "bumping this up."
5. **Write the draft** to `leads/{slug}/outreach-draft.md`
   overwriting, standard structure (`## Channel`, `## Subject`,
   `## Body`, `## Personalization used`).
6. **Append a staged outbound row** to
   `leads/{slug}/thread.json` (`status: "draft"`).
7. **Update `leads.json`:** `nextActionAt` = now (signals the
   dashboard to surface this lead in "Needs you now" until the
   user sends or kills it).
8. **Present to the user** with the prior-thread summary so they
   can judge: "Here's what you last sent, here's my reframe. Send,
   tweak, or bury them?"

## Outputs

- `leads/{slug}/outreach-draft.md` (overwritten)
- Appended row in `leads/{slug}/thread.json`
- Updated `leads.json` row
