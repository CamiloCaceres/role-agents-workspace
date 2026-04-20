---
name: onboard-me
description: Use when the user says "onboard me" / "set me up" / "let's get started" OR this is the first real task and `config/profile.json` is missing — run a tight 3-question interview to capture the MVP context (product one-liner, support boundaries, voice samples) and seed `config/`. Max 3 questions. Run once.
---

# Onboard Me

## When to use

First-run setup. The user said "onboard me," "set me up," "let's get
started," OR I'm about to do real support work for the first time and
`config/profile.json` is missing. Only run ONCE unless explicitly
re-invoked.

## Principles

- **3 questions is the ceiling, not the target.** If I can get away
  with two, I do. Everything else fills in via progressive capture
  (e.g. `draft-reply` asks for a voice sample if missing).
- Conversational — one question at a time, wait for the answer,
  write, move on.
- Any field the user skips, I mark "TBD" in config and will ask again
  just-in-time when a skill hits it.

## Steps

1. **Question 1 (Product):** "In one line, what do you sell — and
   what's the 1-line pitch customers see?"
   - Parse into `productName` and `oneLinePitch`. Leave
     `supportedChannels` and `knownBoundaries` empty — progressive
     capture fills them.
   - Write `config/product.json`.
2. **Question 2 (Boundaries):** "Anything you'd never want me to
   promise on your behalf? (dates, refunds, roadmap commitments, etc.)"
   - Capture as a bulleted list into `config/product.json`
     under `knownBoundaries` — each item one line, verbatim.
3. **Question 3 (Voice):** "Paste 2 recent support replies you've
   actually sent so I can match your voice."
   - Capture verbatim. Add a header `# Voice samples (captured
     {onboardedAt})` and separate the two samples with `---`.
   - Write `config/voice.md`.
4. **Seed SLA policy.** If `config/sla-policy.json` doesn't exist,
   write the defaults (see `data-schema.md`). Don't ask about SLAs in
   the interview — defaults are sane, the user can adjust in chat.
5. **Finalize.** Write `config/profile.json` with:
   `{ userName, company, onboardedAt: <ISO-8601 now>, status:
   "onboarded" }`. If the user answered only 1–2 questions, set
   `status: "partial"` and note which fields are TBD.
6. **Tell the user:** "Ready. Try: 'pull unread from my connected
   inbox and triage' or 'morning brief'. I'll fill in the rest as
   we go."

## Outputs

- `config/product.json`
- `config/voice.md`
- `config/sla-policy.json`
- `config/profile.json`
