---
name: onboard-me
description: Use when the user says "onboard me" / "set me up" / "let's get started" OR this is the first real task and `config/profile.json` is missing — open with a scope + modality preamble that tells the user WHAT I'll ask about (ICP, product, voice) AND the easiest way to share each (paste / file / URL / connected apps via Composio), then run the tight 3-question interview and write to `config/`. Max 3 questions. Run once.
---

# Onboard Me

## When to use

First-run setup. The user said "onboard me," "set me up," "let's get
started," OR I'm about to do real work for the first time and
`config/profile.json` is missing. Only run ONCE unless explicitly
re-invoked.

## Principles

- **Lead with a scope + modality preamble.** Users need to see (a) what
  I'll ask about AND (b) the easiest way to give me each — BEFORE the
  first question. "Give me context" in the abstract is too vague; users
  don't know what to gather.
- **3 questions is the ceiling, not the target.** If I can get away with
  two, I do. Everything else fills in later via progressive capture.
- **One question at a time after the preamble.** The preamble does the
  heavy lifting; each follow-up question is a tight prompt since the
  user already knows the menu.
- For each topic, suggest the **most accurate** modality available.
  Rank: connected app (Composio) > file/URL > paste. The user can still
  pick whichever is easiest.
- Any question the user skips, I note the field as "TBD" in config and
  will ask again just-in-time when a skill hits it.

## Steps

### 0. Scope + modality preamble (the FIRST message)

Send exactly this (adjusted to the user's name if known):

> "Let's get you set up — 3 quick questions, about 90 seconds. Here's
> what I need to know and the easiest way to share each:
>
> 1. **Your ICP** — who you sell to (industry, company size, title).
>    Paste a description, OR give me your pricing / about-page URL and
>    I'll infer it, OR drop an ICP doc.
> 2. **Your product** — what you sell and how you pitch it. Best: give
>    me your website URL and I'll extract the pitch. Or drop a deck /
>    one-pager, or paste.
> 3. **Your voice** — so I sound like you when drafting outreach. Best:
>    if you've connected Gmail / Outlook via Composio, tell me and I'll
>    pull 20–30 of your recent sent messages for a tight voice match.
>    Otherwise paste 2–3 emails you've sent or drop a .txt / .eml file.
>
> For any of these you can also drop files (.pdf / .docx / .md / .csv),
> share public URLs, or point me at a connected app (Integrations tab).
>
> Let's start with #1 — who's your ICP?"

The preamble ends by rolling directly into Q1 so the user can just answer.

### 1. Capture ICP

Based on the modality the user picks:
- **Paste / typed description:** parse directly.
- **URL:** use `composio search` to discover the right web-fetch tool;
  fetch the page; extract ICP signals (target segment on pricing pages,
  customer quotes on about pages).
- **File:** read with the available file-read capability.

Parse into `industry[]`, `companySizeRange`, `titleTargets[]`. Keep
`triggerSignals`, `disqualifiers`, `notes` empty for now — progressive
capture fills them later.

Write `config/icp.json`.

Acknowledge briefly and roll into Q2: *"Got it — {ICP one-line}. Now:
your product + pitch?"*

### 2. Capture Product

Based on modality:
- **URL:** fetch the site; extract the headline pitch, key features,
  and any pricing model/differentiators visible.
- **Deck / one-pager:** read the file.
- **Paste:** parse directly.

Parse into `productName` and `oneLinePitch`. If the source surfaced
`keyDifferentiators[]`, capture them too. Leave `pricingModel`,
`priceRange`, `notes` empty unless visible (progressive capture later).

Write `config/product.json`.

Roll into Q3: *"Great. Last one — how should I calibrate your voice?"*

### 3. Capture Voice

The user picked one of three paths:
- **Connected inbox:** use `composio search` to find the sent-folder
  list/search tool for their inbox provider; fetch the 20–30 most
  recent sent messages the user wrote. Extract tone cues (greeting,
  sign-off, sentence length, use of em-dashes, warmth/dryness). Write
  a condensed voice brief to `config/voice.md` with 3–5 illustrative
  verbatim samples.
- **File:** read the file; capture raw samples.
- **Paste:** capture the pasted text verbatim.

Either way, write `config/voice.md` with a header
`# Voice samples (captured {onboardedAt})` and `---` between samples.

### 4. Finalize

Write `config/profile.json`:
`{ userName, company, team?, role?, onboardedAt: <ISO-8601 now>,
status: "onboarded" }`. If the user skipped any question, set
`status: "partial"` and note the TBD fields so other skills ask
just-in-time.

### 5. Hand off

> "Ready. Try: **research {person} at {company}** for a first dossier,
> **design-sequence** for a cadence tuned to your ICP, or **daily
> standup** anytime you want a ranked plan of attack. I'll ask for
> anything else just-in-time as we work."

## Outputs

- `config/icp.json`
- `config/product.json`
- `config/voice.md`
- `config/profile.json`
