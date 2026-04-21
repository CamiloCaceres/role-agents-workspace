---
name: onboard-me
description: Use when the user says "onboard me" / "set me up" / "let's get started" OR this is the first real task and `config/profile.json` is missing — open with a scope + modality preamble that tells the user WHAT I'll ask about (data sources, core metrics, product + users) AND the easiest way to share each (connected warehouse via Composio / file / URL / paste), then run the tight 3-question interview and write to `config/`. Max 3 questions. Run once.
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
- **3 questions is the ceiling, not the target.** Data introspection
  (full table lists, column types, row counts) happens lazily on first
  query — don't try to capture the schema up front.
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
> 1. **Your data sources** — where your data lives (warehouse like
>    Snowflake / BigQuery / Redshift / Databricks; product DB; SaaS
>    connectors). Best: if you've connected a warehouse via Composio,
>    tell me — I'll introspect schemas lazily as questions land.
>    Otherwise paste a list of key tables, drop a schema doc, or
>    describe the stack.
> 2. **Your core metrics** — what "success" means in your business
>    (MRR / DAU / activation / conversion / retention / NPS). Paste
>    a metric tree, drop your Looker / Mode / Hex dashboard URL or
>    screenshot, or — if a metric-layer tool (dbt semantic layer,
>    Cube, LightDash) is connected via Composio — point me at it and
>    I'll pull definitions.
> 3. **Your product + users** — what you build, who uses it, what
>    engagement means here. Paste a short description, give me your
>    website URL and I'll infer, or drop a product one-pager.
>
> For any of these you can also drop files (.pdf / .md / .csv),
> share public URLs, or point me at a connected app (Integrations
> tab).
>
> Let's start with #1 — where does your data live?"

The preamble ends by rolling directly into Q1 so the user can just
answer.

### 1. Capture data sources

Based on the modality the user picked:

- **Connected warehouse (Composio):** run `composio search
  <warehouse>` to discover the tool slug(s). Verify connectivity with
  a trivial `SELECT 1` roundtrip. Record each source in
  `config/data-sources.json` with `{ id, type: "warehouse", dialect,
  name, connection: { via: "composio", toolSlug } }`. Do NOT
  introspect the full schema — that happens lazily on first query.
- **Paste / typed list:** capture the table names and stack
  description into `config/data-sources.json` with
  `connection: { via: "described", notes: <text> }`. Note in
  `config/profile.json` that we'll need the warehouse connected for
  most real work.
- **URL / file:** parse what you can; the same shape as above.

Acknowledge briefly and roll into Q2: *"Got it — {dialect} warehouse
connected. Now: your core metrics?"*

### 2. Capture core metrics

Based on modality:

- **Metric-layer tool connected (Composio):** run `composio search
  dbt` / `composio search cube` / `composio search lightdash` to find
  the right tool. Pull metric definitions. For each, capture
  `{ id, name, definition, sqlSnippet, sourceId, cadence,
  direction, unit }` into `config/metrics.json`. Leave `thresholds`
  empty (progressive capture later).
- **URL / screenshot / dashboard export:** parse metric names, and
  if possible, units and definitions. If SQL isn't available, flag
  the metric as `"sqlSnippet": ""` and note we'll write SQL when we
  `track-metric`.
- **Paste:** parse a simple bulleted list into metric stubs.

Write `config/metrics.json` — an array of metric definitions.

Roll into Q3: *"Great. Last one — tell me about your product and
users."*

### 3. Capture business context

Based on modality:

- **URL:** fetch the site with the connected web-fetch tool;
  extract product description, user personas, and anything about
  what "engagement" means.
- **File:** read the file.
- **Paste:** capture verbatim.

Write `config/business-context.md` with headings:

```markdown
# Product
{one-paragraph description}

# Users
{primary personas and how they engage}

# Engagement definition
{what a "successful session" / "active user" / "engaged customer"
means in this business}
```

### 4. Finalize

Write `config/profile.json`:
`{ userName, company, team?, role?, onboardedAt: <ISO-8601 now>,
status: "onboarded" }`. If the user skipped any question, set
`status: "partial"` and note the TBD fields so other skills ask
just-in-time.

### 5. Hand off

> "Ready. Try: **how many signups did we get this week** for an
> ad-hoc question, **start tracking MRR daily** to register a
> metric, or **daily standup** anytime you want a ranked plan of
> attack. I'll ask for anything else just-in-time as we work."

## Outputs

- `config/data-sources.json`
- `config/metrics.json`
- `config/business-context.md`
- `config/profile.json`
