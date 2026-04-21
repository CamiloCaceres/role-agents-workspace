---
name: identify-bottleneck
description: Use when a status rollup shows a recurring theme OR the user asks "what's stuck" / "what's blocking progress" / "where are we losing time" — surface cross-team bottlenecks with a hypothesis (why it's stuck), a proposed owner to unblock, and the impact on linked OKRs or initiatives. Append to `bottlenecks.json`.
---

# Identify Bottleneck

## When to use

- The user asks "what's stuck," "what's blocking progress," "why
  aren't we moving on X."
- The latest `status-rollups/{yyyy-mm-dd}/rollup.md` shows the same
  risk or ask repeating from the prior rollup.
- An OKR flipped to off-track and the linked initiative also slipped.

## Steps

1. **Gather evidence from the last 4 weeks:**
   - The 4 most recent `status-rollups/{yyyy-mm-dd}/rollup.md` files.
   - `initiatives.json` + each at-risk / off-track initiative's
     `initiatives/{slug}/init.json` — scan `risks`, `asks`, and
     `crossTeamDependencies`.
   - `okr-tracker.json` — any KR off-track across two or more
     consecutive snapshots is a bottleneck candidate.
   - `decisions.json` — any decision `status === "pending"` older
     than 14 days is a decision-latency bottleneck.

2. **Cluster recurring themes.** Group evidence by shared owner,
   shared cross-team dependency, or shared OKR. The bottleneck is
   the cluster — not an individual incident.

3. **For each cluster, form a hypothesis** (1-2 sentences). Examples:
   - "Hiring in engineering is bottlenecked on the CTO's interview
     calendar — 3 initiatives are waiting on the same reviewer."
   - "Pricing changes are blocked on a pending decision from week
     of {date} — 2 launches are staged behind it."
   - "Data access across Product and Marketing is duplicating work
     — both teams are writing the same SQL in different BI tools."

4. **Propose an owner to unblock.** Use
   `config/leadership-team.json` to map the bottleneck's domain to
   the right exec. For cross-team bottlenecks, the owner is
   whichever exec owns the blocking resource (e.g. CTO for
   engineering-calendar constraint), not the downstream exec.

5. **Quantify impact.** List `impactOnOkrIds` (objectives blocked)
   and `impactOnInitiativeSlugs` (initiatives stalled). Keep citation
   tight — evidence strings should reference real paths (rollup
   files, initiative slugs, decision slugs).

6. **Dedupe against open bottlenecks.** Read `bottlenecks.json`. If
   a cluster matches an existing open bottleneck (same proposed
   owner + overlapping impact set), update in place — add new
   evidence, refine hypothesis — do NOT create a duplicate.

7. **Write** new bottlenecks to `bottlenecks.json` with
   `{ id, slug, title, hypothesis, proposedOwner, impactOnOkrIds,
   impactOnInitiativeSlugs, status: "open", evidence, createdAt,
   updatedAt }`.

8. **Hand off in chat.** Structure:

   ```
   {N} bottleneck(s) identified.

   1. **{title}** — proposed owner: {owner}.
      Hypothesis: {hypothesis}
      Blocks: {N} OKR(s), {M} initiative(s).
      Evidence: {citations}

   2. ...

   Want me to draft a nudge to {proposed owner} for #1?
   (handoff to draft-comms)
   ```

9. **Sensitive-matter routing.** If a hypothesis names a specific
   person as the bottleneck (performance / capacity), do not land
   that language in `bottlenecks.json`. Generalize to
   role-and-process language ("engineering interview capacity")
   and flag the specifics to the CEO in chat only.

## Outputs

- Appended / updated `bottlenecks.json`
