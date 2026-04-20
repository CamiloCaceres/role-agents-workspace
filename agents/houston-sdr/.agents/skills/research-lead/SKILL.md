---
name: research-lead
description: Use when the user asks to research / build a dossier / assemble context on a specific person or company (e.g. "research Jane Doe at Acme" or "who is [company]") — fetch public info via any Composio-connected data source (LinkedIn via connected providers, the company website, recent news, funding data), compile firmographics + tech stack + role/tenure + 2-3 pain hypotheses tied to role and company stage, and write a dossier.
---

# Research Lead

## When to use

The user named a person + company (or just a company) and wants a
dossier before I touch them. Also run me automatically when another
skill (`draft-outreach`, `book-meeting`) needs dossier context and
`leads/{slug}/lead.json` is missing.

## Context shortcuts (the user can give me more than just a name)

If the user has more than "name + company," remind them I can use it:
- **A LinkedIn URL** — I'll fetch their profile.
- **The company website URL** — I'll scrape positioning + news + hiring.
- **A file** — a CSV / vCard / dossier doc they already have.
- **A connected CRM via Composio** — if they've linked HubSpot /
  Salesforce / Attio, I'll pull any existing record first so I don't
  duplicate effort.
Mention this once if the user's input was sparse ("research Acme"),
then proceed with whatever they gave.

## Steps

1. **Resolve the lead.** Identify name + company from the user's input.
   Compute `slug = kebab-case(name + "-" + company)`. Check
   `leads.json` — if the slug already exists and was researched in the
   last 14 days, load the existing dossier and summarize it for the
   user instead of re-fetching.
2. **Create the minimal index row** if missing. Upsert into
   `leads.json` with `status: "new"`, `priority: "P3"` (temporary —
   ICP fit will adjust it in step 7), `source`, and basic fields.
3. **Discover enrichment tool slugs.** Run `composio search` for the
   categories I need — company firmographics, news/signals, and
   role/profile enrichment. Do NOT hardcode tool names. If no relevant
   connection exists for a given category, note the gap in the dossier
   sources list ("no enrichment source connected for X") and keep going
   with what I have.
4. **Fetch firmographics** via the connected enrichment provider:
   industry, headcount, funding (round + date), HQ, tech stack if
   detected. Capture source URL + `fetchedAt` for each.
5. **Fetch role context** via the connected profile provider:
   current title, tenure, prior companies, visible responsibilities.
   Capture source URLs.
6. **Fetch recent signals** — last 60 days of news, blog posts,
   podcast appearances, job postings from their company. Rank the top
   3 by outbound-relevance (hiring a role that signals a new problem,
   funding = growth pain, exec comment on a pain we solve).
7. **Score ICP fit** against `config/icp.json`:
   - **GREEN** — industry match + size in range + title in
     `titleTargets`. Bump priority to P2.
   - **YELLOW** — partial match (e.g. wrong title but right company).
     Keep P3.
   - **RED** — hits a `disqualifier` or clear mismatch. Downgrade to
     P3 and tell the user they may want to skip this one.
8. **Draft 2–3 pain hypotheses** grounded on role + company stage +
   recent signals. NEVER invent — if signals are thin, say so and
   fall back to role-generic pains ("VP Eng at Series B typically
   struggles with X"). Each hypothesis: 1–2 sentences, cite the
   evidence line if any.
9. **Write `leads/{slug}/lead.json`** (full structured dossier —
   firmographics, roleContext, painHypotheses, icpFit, sources, notes).
10. **Write `leads/{slug}/dossier.md`** — human-readable summary with
    sections: `## Snapshot`, `## Role context`, `## Recent signals`,
    `## Pain hypotheses`, `## Sources`.
11. **Update `leads.json`**: set `status: "researched"`, set
    `priority` from ICP fit, stamp `updatedAt`.
12. **Tell the user** the dossier is ready and offer the next step:
    "Want me to draft outreach?" or "Want me to enroll them in a
    sequence?"

## Outputs

- Upserted row in `leads.json`
- `leads/{slug}/lead.json`
- `leads/{slug}/dossier.md`
