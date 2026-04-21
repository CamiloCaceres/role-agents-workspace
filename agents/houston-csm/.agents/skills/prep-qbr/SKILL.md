---
name: prep-qbr
description: Use when a QBR is scheduled within 14 days OR the user says "prep QBR for {account}" / "build the QBR pack" — assemble `accounts/{slug}/qbr-pack.md` following `config/qbr-template.md`, populated from account detail, health, touchpoints, and any linked expansion ideas.
---

# Prep QBR

## When to use

- The user asks "prep QBR for {account}."
- `accounts.json.nextQbrAt` for any account is within the next 14
  days (default window — user can override by saying "prep QBRs for
  the next 30 days"). `daily-standup` surfaces these.
- The user uploads fresh metrics and wants a new pack cut against
  them.

## Steps

1. **Read `config/qbr-template.md`.** If missing, ask the user ONE
   targeted question: *"I don't have your QBR template yet — best:
   drop a sample QBR deck or a Drive/Notion URL; otherwise paste the
   section headings you use."* Write `config/qbr-template.md` and
   continue.
2. **Resolve the account.** From chat or from the nextQbrAt sweep.
   Read `accounts/{slug}/account.json` (stakeholders, contract,
   firmographics, notes). If missing, bootstrap it from
   `accounts.json` + any connected CRM via `composio search <crm>`.
3. **Pull health.** Read `accounts/{slug}/health.json` (most
   recent). If stale (> 14 days) or absent, tell the user and
   suggest running `compute-health` first — but don't block; note
   "metrics as of {computedAt}" in the pack.
4. **Pull recent touchpoints.** Read `accounts/{slug}/touchpoints.md`
   if it exists — surface the last 2-3 meaningful touches into the
   QBR's history section.
5. **Pull expansion context.** Scan `expansion-pipeline.json` for
   entries with `accountSlug == slug` and stage in `[idea,
   qualified]`. Also read `accounts/{slug}/expansion-ideas.md` if it
   exists. Mention them under a "Growth opportunities" section
   (whatever the template calls it) — never under "commits."
6. **Assemble the pack.** For each section heading in
   `config/qbr-template.md`, fill it from the data above. Leave
   sections marked `{TBD — user fills}` if no data supports them
   (never fabricate). Cite sources inline where useful (e.g.
   "Product-usage, last 28 days" — no need to embed the query, just
   the provenance).
7. **Respect roadmap discipline.** Under "Roadmap alignment" (or
   equivalent), reference only things the user has already approved.
   Never write "we'll ship X in Q3" — the CLAUDE.md rule bites here.
   If the template section needs a roadmap update and you don't
   have one, note `{TBD — confirm with product}`.
8. **Write atomically** to `accounts/{slug}/qbr-pack.md`,
   overwriting any prior pack. Update
   `accounts/{slug}/account.json` if new stakeholders surfaced, and
   bump `accounts.json` with `nextQbrAt` if the user provided a
   date.
9. **Summarize in chat.** One-line: *"QBR pack drafted for {name} —
   `accounts/{slug}/qbr-pack.md`. Risks to call out: {top-2}. Want
   me to draft the pre-QBR email?"* (Hands off cleanly to
   `draft-touchpoint` for the cover note.)

## Outputs

- `accounts/{slug}/qbr-pack.md` (overwritten)
- `accounts/{slug}/account.json` (updated if new stakeholders)
- `accounts.json` (updated `nextQbrAt`, `updatedAt`)
