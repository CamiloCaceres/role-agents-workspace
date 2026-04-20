---
name: handoff-to-hiring-manager
description: Use when a candidate is advancing to a hiring-manager round and the user asks to prep the hiring manager — assemble a pre-interview pack with resume highlights, proof-of-work summary, openness score, screening notes, suggested deep-dive questions, and risk flags. Writes the pack; candidate PII stays inside the agent root.
---

# Handoff To Hiring Manager

## When to use

A candidate has cleared the recruiter screen, the scorecard verdict
was `advance`, and an interview is scheduled with the hiring manager.
The user said "prep the hiring manager for {candidate}" or "send the
handoff for X."

## Steps

1. **Verify stage.** Read `candidates.json` — the candidate's
   `stage` should be `"interview"` and `screenVerdict` should be
   `"advance"`. If not, tell the user and stop.
2. **Gather context.** Read:
   - `candidates/{slug}/candidate.json` (dossier)
   - `candidates/{slug}/signals.md` (proof-of-work + openness)
   - `candidates/{slug}/screen-notes.md` (ratings + evidence
     quotes + verdict)
   - `candidates/{slug}/thread.json` (any candidate-surfaced
     context — questions asked, concerns raised)
   - `roles/{roleSlug}/scorecard.json` (so the pack maps to what
     the manager committed to hire against)
3. **Identify the load-bearing quotes.** From the screen notes and
   thread, pull 2–3 direct quotes where the candidate demonstrated
   a must-have — don't paraphrase; quote.
4. **Note risks.** Collate:
   - `mixed` or `no` scorecard ratings from the screen
   - Openness-to-move caveats (e.g. "has equity cliff in 4 months")
   - Any `needs-info` questions the candidate asked that aren't
     yet answered
   - Any homogeneous-shortlist flag for this role that the
     manager should hear about now, not after the decision
5. **Write `candidates/{slug}/hiring-manager-pack.md`:**
   ```markdown
   # Handoff — {name}, {current title at current company}
   For: {hiring manager name} — {role title} interview on
   {scheduled-at}.

   ## Snapshot
   - Current role, years in industry, location
   - Openness to move: {score}/100 — {top driver}
   - Scorecard fit: {fitScore}/100 — {1-line summary}

   ## Resume highlights
   - 3–5 bullets of verified prior experience (company, impact,
     dates)

   ## Proof of work
   - 2–3 artifacts with URLs and 1-line summaries, each mapped
     to the must-have it supports

   ## Screen takeaways
   - Must-have ratings table with direct evidence quotes
   - Overall verdict + rationale

   ## Risks / watch-outs
   - ...

   ## Suggested deep-dive questions (5)
   - 5 pointed, behavioral, tuned to this candidate's gaps /
     nice-to-haves. Each ties to a scorecard item.

   ## Open candidate questions to address
   - Anything the candidate asked that the manager should be
     prepared to answer (careful with comp — defer to the user).
   ```
6. **Update `candidates.json`**: stamp
   `hiringManagerPackSentAt` (even if the pack lives on disk only
   for now — the user decides how to deliver it). Keep `stage`
   unchanged.
7. **Tell the user** where the pack lives and ask how to deliver
   it: "Leave on disk, email to {hiring-manager}, or drop a
   message in your connected team channel?" Whatever they pick,
   I route via the connected transport — `composio search` it
   first. **Do not paste candidate PII (resume, contact info,
   dossier text) into any external channel** — link to the pack
   or attach the file; don't copy the body.

## Outputs

- `candidates/{slug}/hiring-manager-pack.md`
- Updated `candidates.json` row
