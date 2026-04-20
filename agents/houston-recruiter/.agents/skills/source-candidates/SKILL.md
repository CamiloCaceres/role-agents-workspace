---
name: source-candidates
description: Use when the user asks to source / find candidates for a specific role and a scorecard exists — via any Composio-connected sourcing provider, produce a ranked list matched against the scorecard with inlined proof-of-work (public code, writing, talks, shipped product) and openness-to-move scoring (tenure, recent role changes, recent public activity). De-dupes against existing candidates. Never contacts anyone.
---

# Source Candidates

## When to use

The user asked me to source for a role: "source for {role}," "find me
5 candidates for X," "start the top of the funnel on the CTO role."
A scorecard must exist at `roles/{slug}/scorecard.json`; if not, I
run `define-role` first.

## Principles

- **Proof-of-work beats resumes.** Public artifacts (code commits,
  published writing, conference talks, shipped product) are the
  single highest-signal input — inline a pass per candidate.
- **Openness-to-move is a separate signal.** Someone strong but
  entrenched is wasted outreach.
- **Never invent.** If a signal is inferred, say so; if it's cited,
  link the source.
- **Never contact anyone here.** This skill produces dossiers only.

## Steps

1. **Load the scorecard.** Read `roles/{slug}/scorecard.json`. If
   missing, run `define-role` first.
2. **Discover sourcing slugs.** Run `composio search` for sourcing
   providers the user has connected (profile databases, talent
   networks, alumni search, public code-host search, referral
   APIs). Do NOT hardcode provider names. If no sourcing connection
   exists, tell the user which category to connect and stop.
3. **De-dupe against existing.** Read `candidates.json`. Build a
   set of existing candidate slugs and emails for this `roleId` so
   I don't re-source someone already in the pipe.
4. **Search by must-haves.** Translate each `mustHave` rubric into
   a query the connected provider accepts. Fetch the top matches,
   cap at 25 raw leads per query to keep latency reasonable. Merge
   and de-dupe by email + canonical profile URL.
5. **For each candidate, run a proof-of-work pass.** Look for
   public artifacts relevant to the role — code repositories,
   commits, pull requests, technical writing, conference talks,
   podcast appearances, patents, shipped product credits. For each
   artifact: record URL, a 1-line summary, and the must-have or
   nice-to-have it supports. Aim for 2–3 artifacts per candidate.
   If I can't find any, flag `proofOfWork: "thin"` — don't invent.
6. **Score openness-to-move (0–100).** Heuristics:
   - **Tenure** — currently-in-role 12–36mo scores highest.
     <12mo = unlikely to move, penalize. >36mo = ready but may
     have equity cliffs, neutral.
   - **Recent role changes** — frequent jumps in last 3y = higher
     openness.
   - **Recent public activity** — new blog/talks/side projects = +.
   - **Employer signals** — recent layoffs, RTO mandates,
     IPO-lockup-expiring, leadership turnover = +.
   - **Life-stage proxies** — only use publicly stated signals
     (e.g. "just moved to NYC" in a recent post). Never infer from
     demographics.
   Write the score + 1-line rationale naming the top driver.
7. **Score scorecard fit (0–100).** Grade each `mustHave` /
   `niceToHave` against proof-of-work evidence. Penalize hard for
   unmet must-haves; bonus for nice-to-haves with evidence.
8. **Compose the ranked list.** Rank primarily by fit score, with
   openness as tiebreaker. Cap at 10 candidates in the first pass
   so the user can review without fatigue.
9. **Check for homogeneous shortlist.** If the top 10 appear to
   share a narrow background signal (e.g. all from the same prior
   employer, all same alma mater, all from one geography), flag
   this loud in the summary: "Shortlist is homogeneous on X —
   want me to broaden?" Do NOT use demographic inference for this
   check — use the visible professional-background signals only.
10. **Write per-candidate files.** For each candidate, compute
    `slug = kebab-case(name + "-" + currentCompany)`. Write:
    - `candidates/{slug}/candidate.json` — dossier:
      `{ id, slug, name, title, currentCompany, email?, linkedin?,
      resumeUrl?, workHistory, roleId, source, scorecardFit,
      opennessScore, proofOfWork: "rich" | "thin", createdAt,
      updatedAt }`
    - `candidates/{slug}/signals.md` — human-readable:
      `## Proof of work` (bulleted artifacts with URLs),
      `## Openness to move` (score + driver),
      `## Scorecard notes` (mustHave-by-mustHave grading).
11. **Upsert `candidates.json`.** One index row per candidate:
    `{ id, slug, name, role: role.title, roleId, source, status:
    "new", stage: "sourced", fit: scorecardFit, lastTouchedAt:
    createdAt, nextActionAt: null, tags }`.
12. **Update `pipelines.json`.** Recompute counts per stage for
    this `roleId`. Write `{ roleId, counts: { sourced, screened,
    interview, offer }, lastTouchedAt }`.
13. **Tell the user** how many I added, the top 3 by fit, and ask:
    "Want me to draft outreach to any of these, or broaden the
    search?"

## Outputs

- `candidates/{slug}/candidate.json` per new candidate
- `candidates/{slug}/signals.md` per new candidate
- Upserted rows in `candidates.json`
- Updated `pipelines.json` entry for the role
