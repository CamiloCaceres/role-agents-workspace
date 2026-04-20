---
name: onboard-me
description: Use when the user says "onboard me" / "set me up" / "let's get started" OR this is the first real task and `config/profile.json` is missing — run a tight 3-question interview to capture the MVP context (ICP, product one-liner, voice samples) and write to `config/`. Max 3 questions. Run once.
---

# Onboard Me

## When to use

First-run setup. The user said "onboard me," "set me up," "let's get
started," OR I'm about to do real work for the first time and
`config/profile.json` is missing. Only run ONCE unless explicitly
re-invoked.

## Principles

- **3 questions is the ceiling, not the target.** If I can get away with
  two, I do. Everything else fills in later via progressive capture.
- Conversational — one question at a time, wait for the answer, write,
  move on.
- Any question the user skips, I note the field as "TBD" in config and
  will ask again just-in-time when a skill hits it.

## Steps

1. **Question 1 (ICP):** "In one line, who's your ICP? (industry,
   company size, role you sell to)"
   - Parse their answer into `industry[]`, `companySizeRange`,
     `titleTargets[]`. Keep `triggerSignals`, `disqualifiers`, `notes`
     empty for now — they fill in later as I do research.
   - Write `config/icp.json`.
2. **Question 2 (Product):** "In one line, what do you sell — and what's
   the 1–2 line pitch you lead with?"
   - Parse into `productName` and `oneLinePitch`. Leave
     `keyDifferentiators`, `pricingModel`, `priceRange`, `notes` empty
     (progressive capture will fill them when `draft-outreach` or
     `respond-to-objection` needs them).
   - Write `config/product.json`.
3. **Question 3 (Voice):** "Paste 2 recent outreach emails you've
   sent — I'll match your voice."
   - Capture the raw text verbatim. Add a brief header:
     `# Voice samples (captured {onboardedAt})` and separate the two
     samples with `---`.
   - Write `config/voice.md`.
4. **Finalize.** Write `config/profile.json` with:
   `{ userName, company, team?, role?, onboardedAt: <ISO-8601 now>,
   status: "onboarded" }`. If the user only answered 1–2 questions, set
   `status: "partial"` and note which fields are TBD.
5. **Tell the user:** "Ready. Ask me to research your first lead
   (`research {person} at {company}`) or design a sequence for your ICP
   (`design-sequence`). I'll fill in the rest as we go."

## Outputs

- `config/icp.json`
- `config/product.json`
- `config/voice.md`
- `config/profile.json`
