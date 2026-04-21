---
name: onboard-me
description: Use when the user says "onboard me" / "set me up" / "let's get started" OR this is the first real task and `config/profile.json` is missing — open with a scope + modality preamble that names WHAT I'll ask about (accounts focus, health signals, QBR template) AND the easiest way to share each (connected CRM / CS platform via Composio, file/URL, paste), then run the tight 3-question interview and write to `config/`. Max 3 questions. Run once.
---

# Onboard Me

## When to use

First-run setup. The user said "onboard me," "set me up," "let's get
started," OR I'm about to do real CSM work for the first time and
`config/profile.json` is missing. Only run ONCE unless explicitly
re-invoked.

## Principles

- **Lead with a scope + modality preamble.** Users need to see (a)
  what I'll ask about AND (b) the easiest way to give me each — BEFORE
  the first question. "Give me context" in the abstract is too vague;
  users don't know what to gather.
- **3 questions is the ceiling, not the target.** If I can get away
  with two, I do. Everything else fills in via progressive capture
  inside other skills.
- **One question at a time after the preamble.** The preamble does
  the heavy lifting; each follow-up question is a tight prompt since
  the user already knows the menu.
- For each topic, suggest the **most accurate** modality available.
  Rank: connected app (Composio) > file/URL > paste. The user can
  still pick whichever is easiest.
- Any question the user skips, I mark "TBD" in config and will ask
  again just-in-time when a skill hits it.

## Steps

### 0. Scope + modality preamble (the FIRST message)

Send exactly this (adjusted to the user's name if known):

> "Let's get you set up — 3 quick questions, about 90 seconds. Here's
> what I need to know and the easiest way to share each:
>
> 1. **Your accounts focus** — your top 10-20 accounts or the tier
>    you own (enterprise / mid-market / SMB). Best: if your CRM is
>    connected via Composio, tell me — I'll pull accounts tagged by
>    ARR tier. Otherwise paste a list or drop a CSV.
> 2. **Your health signals** — what defines healthy vs. at-risk in
>    your world (usage depth, NPS, ticket volume, feature adoption,
>    exec engagement). Best: if you have a CS platform connected via
>    Composio (Gainsight / ChurnZero / Catalyst / Vitally) tell me
>    what metrics live there. Otherwise paste or drop a health-score
>    doc.
> 3. **Your QBR template** — the section structure a good QBR pack
>    of yours contains. Best: drop a sample QBR deck or paste a
>    Drive/Notion link — I'll use it as the template. Otherwise
>    paste an outline.
>
> For any of these you can also drop files (.pdf / .docx / .md /
> .csv), share public URLs, or point me at a connected app
> (Integrations tab).
>
> Let's start with #1 — who's your accounts focus?"

The preamble ends by rolling directly into Q1 so the user can just
answer.

### 1. Capture accounts focus

Based on modality:

- **Connected CRM (Composio):** run `composio search <crm-keyword>`
  (e.g. the user named "HubSpot" or "Salesforce" — use that as the
  keyword) to discover the right tool slug. Pull the account list
  tagged by ARR tier or by a filter the user names. Seed
  `accounts.json` with initial rows (slug, name, tier, arr,
  renewalAt, status: "active", healthScore: "unknown").
- **Paste / CSV / file:** parse into tier definitions + focus list.
- **URL:** fetch with the available web-fetch capability.

Write `config/accounts-focus.json` with `tiers[]`, `focusTierIds[]`,
`focusList[]`, `notes`.

Acknowledge briefly and roll into Q2: *"Got it — {N} accounts, focus
on {tier}. Now: your health signals?"*

### 2. Capture health signals

Based on modality:

- **Connected CS platform (Composio):** run `composio search <cs-
  platform>` to find the right tool. Pull metric definitions if the
  tool exposes them. Seed each signal as `{ id, name, source,
  weight, direction, thresholds: { green, yellow } }`.
- **Paste / doc:** parse a bulleted list into signal stubs.
- **URL / file:** extract what you can.

Leave unresolved `thresholds` at `{ green: 0, yellow: 0 }` and note
that the first `compute-health` run will ask for the missing numbers
via progressive capture.

Write `config/health-signals.json` — an array of signal definitions.
Also seed `config/expansion-signals.json` with sensible defaults
(seat cap hit, new team added, champion promoted) — the user can
curate later.

Roll into Q3: *"Great. Last one — your QBR template?"*

### 3. Capture QBR template

Based on modality:

- **Deck / one-pager file:** read the file, extract section
  headings.
- **URL:** fetch the doc; extract section structure.
- **Paste:** capture verbatim.

Write `config/qbr-template.md` — the section skeleton the user's QBR
packs will follow (e.g. `## Business update`, `## Metrics vs. last
quarter`, `## Wins`, `## Challenges`, `## Asks of us`,
`## Roadmap alignment`, `## Stakeholders`). Keep it a markdown
skeleton — `prep-qbr` fills each section at runtime.

### 4. Finalize

Write `config/profile.json`:
`{ userName, company, team?, role?, onboardedAt: <ISO-8601 now>,
status: "onboarded" }`. If the user skipped any question, set
`status: "partial"` and note the TBD fields so other skills ask
just-in-time.

Do NOT write `config/voice.md` here. It fills in via progressive
capture inside `draft-touchpoint` the first time you need to match
the user's voice (best modality: a connected inbox sampling recent
sent messages).

### 5. Hand off

> "Ready. Try: **compute health for {account}**, **prep QBR for
> {account}**, or **daily standup** anytime you want a ranked plan
> of attack. I'll ask for anything else just-in-time as we work."

## Outputs

- `config/profile.json`
- `config/accounts-focus.json`
- `config/health-signals.json`
- `config/expansion-signals.json`
- `config/qbr-template.md`
- `accounts.json` (seeded if a CRM was connected)
