---
name: draft-outreach
description: Use when the user asks to draft a first-touch or follow-up to a specific lead (e.g. "draft outreach to Jane" or "write a cold email to Acme") — read the dossier, read `config/voice.md` + `config/product.json`, write a message in the user's voice grounded on the prospect's role and 1-2 ranked pain hypotheses. Produce a single channel-appropriate draft (email OR LinkedIn OR call opener). Never sends.
---

# Draft Outreach

## When to use

The user named a lead and asked for a first-touch or follow-up draft.
Default channel is email unless the user says otherwise (LinkedIn DM,
connect note, InMail, or call opener). I write the draft; I never
send.

## Steps

1. **Load the dossier.** Read `leads/{slug}/lead.json`. If missing,
   run `research-lead` first — I need the role, company stage, and
   pain hypotheses before I can personalize.
2. **Read voice.** Read `config/voice.md`. If missing, ask the user
   ONE question: "Quick — I need a voice sample. *Best option: if
   you've connected Gmail / Outlook via Composio, tell me and I'll
   pull your last 20-30 sent messages. Otherwise paste one recent
   outreach, or drop a .eml / .txt file with a few samples.*"
   Capture whichever modality the user picks, write to
   `config/voice.md`, continue.
3. **Read product context.** Read `config/product.json`. If missing
   `oneLinePitch`, ask ONE question: "One-line pitch for your
   product? *Paste it, give me your website URL and I'll extract it,
   or drop a pitch deck / one-pager.*" Write and continue.
4. **Pick the channel.** Default email. If the user asked for
   LinkedIn, further disambiguate: connect note (≤300 chars) or
   InMail (treat like a short email). Call opener = spoken script
   ≤20 seconds.
5. **Draft structure.**
   - **Email:** Subject ≤8 words, lowercase-first preferred, no
     clickbait. Body ≤120 words. 4 beats: (1) specific trigger hook
     ("saw you're hiring 3 platform engineers"), (2) 1 ranked pain
     tied to their role, (3) 1-sentence value claim grounded in
     `config/product.json`, (4) soft low-commitment CTA ("worth 15
     min next week to compare notes?"). No "I hope this finds you
     well," no "quick question," no "just circling back."
   - **LinkedIn connect note:** ≤300 chars. Lead with a genuine
     reason for connecting (specific trigger), drop the pitch. The
     follow-up DM is where the pitch goes.
   - **LinkedIn InMail:** Like email, tighter. ≤80 words.
   - **Call opener:** ≤20 seconds spoken. State who I am, why I'm
     calling (specific trigger), ask for 30 seconds.
6. **Match voice.** Mirror the `config/voice.md` samples: sentence
   length, punctuation, greeting/signoff, first-person style. If
   the user's voice is dry/direct, drop fluff. If warm, keep it
   warm.
7. **Personalization self-check.** Every draft MUST contain at
   least one of: a trigger from `leads/{slug}/lead.json` recent
   signals, a quoted pain hypothesis, or a specific role reference.
   If the dossier is thin, say so to the user and propose I dig
   deeper before drafting.
8. **Write the draft** to `leads/{slug}/outreach-draft.md` with
   sections:
   ```markdown
   ## Channel
   email | linkedin-connect | linkedin-inmail | call-opener

   ## Subject
   (email/InMail only)

   ## Body

   ## Personalization used
   - trigger: ...
   - pain: ...
   - voice match: ...
   ```
9. **Append a staged outbound row** to `leads/{slug}/thread.json`
   with `direction: "outbound"`, `status: "draft"`, `sentAt` = null,
   and the same body.
10. **Update `leads.json`** row: `lastTouchedAt` = now,
    `status: "sequenced"` if it was "researched" or "new".
11. **Present the draft to the user** in chat and ask: "Send this,
    tweak it, or try a different angle?" Never send on my own.

## Outputs

- `leads/{slug}/outreach-draft.md` (overwritten)
- Appended row in `leads/{slug}/thread.json`
- Updated `leads.json` row
