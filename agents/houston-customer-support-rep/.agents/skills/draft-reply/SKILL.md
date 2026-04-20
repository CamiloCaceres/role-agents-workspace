---
name: draft-reply
description: Use when a triaged customer support conversation is ready for a response and no `draft.md` exists yet (or the user asks for a fresh draft) — pulls the customer dossier, matches the user's voice from `config/voice.md`, and writes `conversations/{id}/draft.md` without sending.
---

# Draft Reply

## When to use

A conversation in `conversations.json` has status `open` or
`waiting_founder`, the customer's most recent message has no
corresponding draft at `conversations/{id}/draft.md`, and the user
either asked to draft a reply or the morning brief surfaced it.
**Never call this skill to send — this agent drafts only.**

## Steps

1. **Load the thread** from `conversations/{id}/thread.json`. Identify
   the latest customer message — that's what the draft responds to.
2. **Run `customer-dossier`** for the customer on this thread. Pull:
   plan, MRR, open bugs, open followups, recent history.
3. **Read voice.** Read `config/voice.md`. If missing, ask the user
   ONE question: "Paste one recent support reply you've sent so I
   can match your voice." Write the answer to `config/voice.md` and
   continue.
4. **Read product + boundaries.** Read `config/product.json`. If
   `knownBoundaries` is empty, that's fine — defaults apply (no
   date promises, no refund promises, no roadmap commitments). If a
   new boundary is surfaced by the draft, ask the user whether to
   add it and update the file.
5. **Draft the reply in the user's voice.** Address the specific
   ask. If a bug: acknowledge, confirm repro if possible, state next
   step. If how-to: answer crisply, link to a KB article only if
   one exists in `articles.json` with `status: "published"`. If
   billing: state the facts, propose action. Never promise a date
   the user hasn't approved — say "I'll come back to you with a
   timeline." Honor every item in `knownBoundaries`.
6. **Match voice** from `config/voice.md`: greeting style, sign-off,
   sentence length, whether the user uses first name, em-dashes,
   etc. If voice is dry/direct, drop fluff. Never "I apologize for
   the inconvenience." Never corporate hedging.
7. **Append a dossier snippet** to `conversations/{id}/notes.md`
   (plan, MRR, open bugs) so the user has context when approving.
8. **Write atomically** to `conversations/{id}/draft.md`. Update the
   `conversations.json` row: `status = "waiting_founder"`,
   `lastTouchedAt = now`.
9. **Present the draft in chat** and ask: "Send this, tweak it, or
   try a different angle?" Never send.

## Outputs

- Writes `conversations/{id}/draft.md`
- Appends dossier snippet to `conversations/{id}/notes.md`
- Updates `conversations.json` row (status, lastTouchedAt)
- Optionally updates `config/voice.md` or `config/product.json` via
  progressive capture
