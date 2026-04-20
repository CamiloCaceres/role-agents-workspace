---
name: define-role
description: Use when the user says "open a req for {role}" / "new role: {title}" / hands over a JD with no scorecard — interview the user on must-haves, nice-to-haves, dealbreakers, target comp, hiring-manager identity, and target start date, then write the role brief and scorecard.
---

# Define Role

## When to use

The user wants to open a requisition or refine one that exists only as
a JD. I detect this when the user says "open a req," "new role,"
"define the scorecard for X," or when another skill (`source-candidates`,
`screen-candidate`) needs `roles/{slug}/scorecard.json` and it's
missing.

## Principles

- The scorecard is the source of truth. Every downstream skill grades
  against it.
- Never invent dealbreakers — if the user didn't say it, don't assume
  it.

## Steps

1. **Resolve the role.** Parse the role title from the user. Compute
   `slug = kebab-case(title)`. Check `roles.json` — if the slug
   exists, load the existing brief and scorecard and ask the user
   what to update instead of overwriting blindly.
2. **Capture the brief.** If the user pasted a JD, write it verbatim
   to `roles/{slug}/brief.md` (preserve sections). If they described
   the role in prose, reformat into `## Mission`, `## Outcomes`,
   `## Responsibilities`, `## Requirements`, `## About us` — ask the
   user to fill blanks later if unclear.
3. **Read `config/leveling.json`.** If missing, ask ONE question:
   "What's the level and target comp range for this role?" Write
   into `config/leveling.json` under the matching band and continue.
4. **Interview for the scorecard — in ONE message, not serially.**
   Ask for:
   - 3–5 **must-haves** (hard requirements the candidate must
     demonstrably have)
   - 3–5 **nice-to-haves** (bonuses that differentiate)
   - 1–3 **dealbreakers** (automatic disqualifiers)
   - **target comp** for this role (base + equity + bonus if any)
   - **hiring manager** (name + email)
   - **target start date** (ISO-8601 or rough "end of Q2")
   - **location / remote** policy
5. **Build the scorecard.** Write
   `roles/{slug}/scorecard.json`:
   ```ts
   interface Scorecard {
     id: string;
     slug: string;
     title: string;
     level: string;
     mustHaves: { label: string; rubric: string }[];
     niceToHaves: { label: string; rubric: string }[];
     dealbreakers: string[];
     targetComp: { base: string; equity?: string; bonus?: string };
     hiringManager: { name: string; email: string };
     targetStartDate: string;
     location: string;
     remote: "remote" | "hybrid" | "onsite";
   }
   ```
   Each `rubric` is a one-line operational definition of the signal
   I should look for (e.g. "shipped production React at series B+
   scale, verifiable via GitHub or case study").
6. **Upsert `roles.json`.** Add/update the index row:
   `{ id, slug, title, level, location, remote, hiringManagerEmail,
   targetStartDate, status: "open" }`. Stamp `createdAt` /
   `updatedAt`.
7. **Tell the user** the scorecard is ready and tee up the next
   step: "Want me to source candidates for this role now?"

## Outputs

- `roles/{slug}/brief.md` (overwritten or created)
- `roles/{slug}/scorecard.json`
- Upserted row in `roles.json`
- Possibly updated `config/leveling.json` (progressive capture)
