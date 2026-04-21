---
name: log-decision
description: Use when the user says "we decided X" / "log the decision on Y" / "capture the call we just made" OR a significant decision is detected in meeting notes — write an ADR-style record with context, alternatives considered, trade-offs, decision, consequences, and links to related initiatives. Creates `decisions/{slug}/decision.md` and appends to `decisions.json`.
---

# Log Decision

## When to use

- The user says "we decided", "log the decision on", "capture that
  call", or "ADR this."
- Pasted / connected meeting notes contain a clear decision pattern
  ("we're going with X over Y because Z").
- Offline: the user asks to review the open decision backlog — this
  skill also marks pending decisions as decided when the user
  declares them.

## Steps

1. **Resolve the subject.** From chat, extract the decision topic
   and propose a slug (kebab-case, e.g.
   `switch-pricing-to-seat-based`). Confirm briefly if ambiguous.

2. **Read `config/decision-framework.md`.** If missing, ask the
   user ONE question: *"Quick — who decides pricing / product
   strategy / hiring / structural bets in your company? Best: drop
   a RACI doc or your decision-rights page from a Composio-connected
   wiki. Otherwise paste one or two sentences — I'll expand it as
   more decisions land."* Write and continue.

3. **Decide `status`.** Based on the framework:
   - If the CEO is the decider and hasn't yet decided → `pending`.
   - If the decision is owner-scoped and the owner has decided (or
     the user is the CEO and declared it) → `decided`, with
     `decidedBy` and `decidedAt`.

4. **Check for duplicates.** Scan `decisions.json` for an existing
   slug or near-duplicate title. If one exists, update in place
   (append to `considered`, refine `rationale`, move `pending` →
   `decided` with a `decidedAt` timestamp) instead of creating a
   new record.

5. **Write the ADR** to `decisions/{slug}/decision.md`:

   ```markdown
   # Decision: {title}

   - **Status:** {pending | decided}
   - **Decided by:** {who, if decided}
   - **Decided at:** {ISO-8601, if decided}
   - **Linked initiatives:** {slugs}

   ## Context
   {1-2 paragraphs — what prompted this, what's at stake}

   ## Alternatives considered
   1. **{Option A}** — {short description}. Trade-offs: {...}.
   2. **{Option B}** — {short description}. Trade-offs: {...}.
   3. **{Option C, status-quo if relevant}** — {...}.

   ## Decision
   {the chosen path, 1 paragraph}

   ## Rationale
   {why this one over the alternatives — short, honest}

   ## Consequences
   - **Good:** {what becomes easier}
   - **Hard:** {what becomes harder}
   - **Unknowns:** {what we'll learn over time}

   ## Open questions
   {anything still TBD}
   ```

6. **Upsert in `decisions.json`** with `{ id, slug, title, summary,
   status, decidedBy?, decidedAt?, linkedInitiativeSlugs,
   considered, rationale? }`. `summary` is the one-line that shows
   in the dashboard — keep it short.

7. **Cross-link initiatives.** If the decision is linked to an
   initiative, append the decision slug into
   `initiatives/{init-slug}/init.json` → `notes` (or a dedicated
   `linkedDecisionSlugs` field if present).

8. **Sensitive matters.** If the decision touches performance,
   compensation, exits, or legal — record it but flag the chat
   summary with *"This decision is sensitive — confirm it should be
   logged in the decision index, or move it to a separate
   restricted file."* Default to logging with `summary` generalized
   (e.g. "Exec transition on {domain}" rather than named).

9. **Summarize in chat.** One sentence: what was logged, status,
   where it lives.

## Outputs

- `decisions/{slug}/decision.md` (new or overwritten)
- Upserted `decisions.json`
- Possibly updated `initiatives/{init-slug}/init.json`
- Possibly updated `config/decision-framework.md` (progressive
  capture)
