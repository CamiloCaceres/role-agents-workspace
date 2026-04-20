---
name: draft-candidate-outreach
description: Use when the user asks to reach out to a specific sourced candidate (e.g. "draft outreach to {candidate}" or "message Jane about the senior eng role") — read the candidate's dossier + signals + voice samples + role brief, write a first-touch that references a specific piece of their work, and save the draft. Never sends.
---

# Draft Candidate Outreach

## When to use

The user named a sourced candidate and asked for a first-touch
message. I draft; I never send. Candidate PII stays inside the
agent root — I do not paste the candidate's info into any external
channel.

## Steps

1. **Load the dossier.** Read
   `candidates/{slug}/candidate.json` and
   `candidates/{slug}/signals.md`. If either is missing, run
   `source-candidates` first so I have proof-of-work to personalize
   with.
2. **Load the role brief.** Read `roles/{roleSlug}/brief.md` and
   `roles/{roleSlug}/scorecard.json` to ground the value prop.
3. **Read voice.** Read `config/voice.md`. If missing, ask the
   user ONE question: "Paste one recent outreach you've sent so I
   can match your voice." Write it and continue.
4. **Pick the channel.** Default email. If the user asked for a
   connected-profile-network message or a referral-network DM,
   tighten accordingly (≤300 chars for a connect note, ≤80 words
   for an InMail-equivalent).
5. **Draft structure — email default.**
   - Subject: ≤8 words, specific reference to their work (e.g.
     "Your talk on X" beats "Interested in a role at Y").
   - Body ≤130 words, 4 beats:
     1. Specific reference to a piece of their proof-of-work from
        `signals.md` (quote the artifact, name it).
     2. Why that made me think of this specific role — tie to
        the scorecard must-have the artifact satisfies.
     3. 1-line company / role snapshot grounded in
        `roles/{roleSlug}/brief.md` + `config/leveling.json`
        (leveling, NOT comp figures — I never disclose comp in
        first touch).
     4. Soft low-commitment CTA (e.g. "open to a 20-min intro
        next week?").
   - No "I hope this finds you well," no "quick question," no
     reliance on generic recruiter phrases.
6. **Match voice.** Mirror `config/voice.md` — sentence length,
   greeting, signoff. If the user's voice is warm, keep it warm;
   if dry, drop fluff.
7. **Personalization self-check.** Every draft MUST reference at
   least one specific artifact from `signals.md`. If
   `proofOfWork: "thin"` on the candidate dossier, tell the user
   the personalization will be weak and suggest I dig deeper
   before drafting.
8. **Never disclose comp range.** Even if the user's voice sample
   included a number — the user must explicitly approve comp
   disclosure.
9. **Write** to `candidates/{slug}/outreach-draft.md`:
   ```markdown
   ## Channel
   email | connect-note | inmail

   ## Subject
   ...

   ## Body
   ...

   ## Personalization used
   - artifact referenced: {title, url}
   - scorecard tie-in: {must-have label}
   - voice match: {notes}
   ```
10. **Append a staged outbound row** to
    `candidates/{slug}/thread.json` with
    `direction: "outbound"`, `status: "draft"`, `sentAt: null`,
    and the same body.
11. **Update `candidates.json`** row: `lastTouchedAt: now`,
    `status: "outreach-drafted"`.
12. **Present to the user** in chat and ask: "Send this, tweak
    it, or try a different angle?" Never send on my own.

## Outputs

- `candidates/{slug}/outreach-draft.md` (overwritten)
- Appended row in `candidates/{slug}/thread.json`
- Updated `candidates.json` row
