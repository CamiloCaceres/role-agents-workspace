---
name: onboard-me
description: Use when the user says "onboard me" / "set me up" / "get started" OR this is the first real task and `config/profile.json` is missing — run a tight 3-question interview to capture the MVP context (ideal week, VIPs, voice samples) and write to `config/`. Max 3 questions. Run once.
---

# Onboard Me

## When to use

First-run setup. The user said "onboard me," "set me up," "let's get
started," OR I'm about to do real work for the first time and
`config/profile.json` is missing. Only run ONCE unless explicitly
re-invoked.

## Principles

- **3 questions is the ceiling, not the target.** If I can get away
  with two, I do. Everything else fills in later via progressive
  capture.
- Conversational — one question at a time, wait for the answer, write,
  move on.
- Any question the user skips, I note the field as "TBD" in config and
  will ask again just-in-time when a skill hits it.

## Steps

1. **Question 1 (Ideal week):** "What's your ideal week — focus
   blocks, meeting days, working hours, timezone?"
   - Parse into `timezone` (IANA — default to the user's local if
     unclear), `workingHours[]`, `focusBlocks[]` with `{day, start,
     end}`, and sensible defaults: `maxMeetingsPerDay: 5`,
     `minBufferMinutes: 15`, `blackoutPeriods: []`.
   - Write `config/schedule-preferences.json`.
2. **Question 2 (VIPs):** "Who are your top 5–10 VIPs I should never
   make wait? Name + relationship (investor / co-founder / board /
   customer / advisor / family) is enough. Paste emails too if
   handy."
   - For each row, create a `Vip` entry with `id` (UUID v4),
     `priorityFloor: "P1"` for investor / co-founder / spouse / board,
     `"P2"` otherwise. Unknown email is fine — progressive capture in
     `triage-inbox` will learn it.
   - Write `config/vips.json`.
3. **Question 3 (Voice):** "Paste 3 typical emails you've recently
   sent — a short accept, a decline-with-reason, and a delay/bump. I'll
   match your voice."
   - Capture raw text verbatim. Header: `# Voice samples (captured
     {onboardedAt})`. Separate the three samples with `---` and label
     each: `## Accept`, `## Decline (with reason)`, `## Delay / bump`.
   - Write `config/voice.md`.
4. **Finalize.** Write `config/profile.json` with `{ userName, email?,
   role?, company?, timezone, onboardedAt: <ISO-8601 now>, status:
   "onboarded" }`. If the user only answered 1–2 questions, set
   `status: "partial"` and note which fields are TBD.
5. **Tell the user:** "Ready. Ask me for a `Daily standup` to see
   what's on your plate, or `Triage my inbox` to clear the queue. I'll
   fill in the rest as we go."

## Outputs

- `config/schedule-preferences.json`
- `config/vips.json`
- `config/voice.md`
- `config/profile.json`
