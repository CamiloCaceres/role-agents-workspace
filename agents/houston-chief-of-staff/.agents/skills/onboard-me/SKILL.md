---
name: onboard-me
description: Use when the user says "onboard me" / "set me up" / "let's get started" OR this is the first real task and `config/profile.json` is missing — open with a scope + modality preamble that tells the user WHAT I'll ask about (company context, leadership team, current-quarter OKRs) AND the easiest way to share each (connected wiki / HRIS / OKR tool via Composio / file / URL / paste), then run the tight 3-question interview and write to `config/`. Max 3 questions. Run once.
---

# Onboard Me

## When to use

First-run setup. The user said "onboard me," "set me up," "let's get
started," OR I'm about to do real work for the first time and
`config/profile.json` is missing. Only run ONCE unless explicitly
re-invoked.

## Principles

- **Lead with a scope + modality preamble.** Users need to see (a)
  what I'll ask about AND (b) the easiest way to give me each — BEFORE
  the first question. "Give me context" in the abstract is too vague.
- **3 questions is the ceiling, not the target.** Meeting cadence,
  decision framework, voice samples — all captured lazily the first
  time a skill needs them.
- **One question at a time after the preamble.** The preamble does
  the heavy lifting; each follow-up is a tight prompt.
- For each topic, suggest the **most accurate** modality available.
  Rank: connected app (Composio) > file/URL > paste.
- Any question the user skips, I note the field as "TBD" in config
  and ask again just-in-time when a skill hits it.

## Steps

### 0. Scope + modality preamble (the FIRST message)

Send exactly this (adjusted to the user's name if known):

> "Let's get you set up — 3 quick questions, about 90 seconds. Here's
> what I need to know and the easiest way to share each:
>
> 1. **Your company context** — stage, headcount, and top 3
>    strategic priorities this quarter or year. Best: if your
>    company-wiki strategy page is reachable via any
>    Composio-connected wiki, share the link and I'll extract from
>    it. Otherwise paste a description, drop your strategy deck /
>    OKR kick-off / board-deck intro, or give me a URL.
> 2. **Your leadership team** — who sits on the exec team and what
>    each owns. Best: if you've connected an HRIS via Composio
>    (roster source), tell me and I'll pull the exec roster
>    directly. Otherwise paste a brief roster, drop an org chart,
>    or link your leadership page.
> 3. **Your OKRs or current objectives** — what does "winning this
>    quarter" look like, measurably? Best: if your OKR tool (any
>    Composio-connected OKR / goals workspace) is linked, point me
>    at the workspace and I'll pull the current state. Otherwise
>    paste the OKR list, drop the OKR doc, or share a URL.
>
> For any of these you can also drop files (.pdf / .md), share
> public URLs, or point me at a connected app (Integrations tab).
>
> Let's start with #1 — what's your company context?"

The preamble ends by rolling directly into Q1 so the user can just
answer.

### 1. Capture company context

Based on the modality the user picked:

- **Connected wiki (Composio):** discover the right tool with
  `composio search wiki` (or `composio search docs`). Fetch the
  page. Extract stage, headcount, and the top 3 strategic
  priorities.
- **URL / file:** parse what you can.
- **Paste:** capture verbatim.

Write `config/strategic-priorities.json` with the themes array. If
you got them, also start `config/profile.json` with `{ userName,
company, stage, headcount }`.

Acknowledge briefly and roll into Q2: *"Got it — {company} at {stage}
with {headcount} people. Now: your leadership team?"*

### 2. Capture leadership team

Based on modality:

- **Connected HRIS (Composio):** `composio search hris` (or
  `composio search payroll`) to find the right tool. Pull the exec
  roster (title contains "Chief", "VP", "Head of", or
  direct-report-count above a threshold).
- **Paste / file:** parse into `{ name, role, domain, email? }`
  rows. Domain is the functional bucket — engineering, sales,
  product, finance, people, ops, marketing, success.
- **URL:** fetch and parse.

Write `config/leadership-team.json`.

Roll into Q3: *"Great — {N}-person exec team captured. Last one —
your OKRs?"*

### 3. Capture current-quarter OKRs

Based on modality:

- **Connected OKR tool (Composio):** `composio search okr` (or
  `composio search goals`) to find the right tool. Pull current
  objectives and their key results (metric, target, current,
  owner, unit, cadence).
- **URL / file:** parse the OKR doc.
- **Paste:** parse a bulleted list into objective stubs. If the
  user pasted objectives without key results, stub each with an
  empty `keyResults: []` and note we'll fill in on first
  `track-okr` run.

Write `config/okrs.json` — array of objectives with their key
results. Period defaults to current quarter (e.g. `"2026-Q2"`).

### 4. Finalize

Write `config/profile.json`:
`{ userName, company, stage, headcount, onboardedAt: <ISO-8601 now>,
status: "onboarded" }`. If the user skipped any question, set
`status: "partial"` and note the TBD fields so other skills ask
just-in-time.

### 5. Hand off

> "Ready. Try: **give me the weekly status rollup** for a cross-team
> snapshot, **prep the board pack for {next quarter}** when a board
> meeting is close, **log the decision we just made about X** to
> capture one, or **daily standup** anytime you want a ranked plan
> of attack. I'll ask for meeting cadence, decision framework, and
> voice samples just-in-time as we work."

## Outputs

- `config/strategic-priorities.json`
- `config/leadership-team.json`
- `config/okrs.json`
- `config/profile.json`
