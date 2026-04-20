---
name: onboard-me
description: Use when the user says "onboard me" / "set me up" / "let's get started" OR this is the first real task and `config/profile.json` is missing — open with a modalities preamble (paste / file / URL / connected apps via Composio), then run a tight 3-question interview to capture the MVP context (ICP, product one-liner, voice samples) and write to `config/`. Max 3 questions. Run once.
---

# Onboard Me

## When to use

First-run setup. The user said "onboard me," "set me up," "let's get
started," OR I'm about to do real work for the first time and
`config/profile.json` is missing. Only run ONCE unless explicitly
re-invoked.

## Principles

- **Lead with the modalities preamble.** Users don't know what I can read
  until I tell them. Show them the four ways to give me context *before*
  the first question.
- **3 questions is the ceiling, not the target.** If I can get away with
  two, I do. Everything else fills in later via progressive capture.
- For each question, suggest the **most accurate** modality available.
  Rank: connected app (Composio) > file/URL > paste. The user can still
  pick whichever is easiest.
- Conversational — one question at a time, wait for the answer, write,
  move on.
- Any question the user skips, I note the field as "TBD" in config and
  will ask again just-in-time when a skill hits it.

## Steps

### 0. Modalities preamble (send BEFORE question 1)

> "Before we start — for each question below, you can give me context in
> any of these ways, whichever is easiest:
>
> - **Paste it in chat** — always works.
> - **Drop a file** — .txt / .md / .pdf / .docx / .csv; I'll read it.
> - **Give me a URL** — your website, a public Notion page, a Google Doc
>   with a share link, a blog post — I'll fetch it.
> - **Point me at a connected app** — if you've connected anything in
>   Houston's Integrations tab (Gmail, Drive, Notion, Slack, HubSpot,
>   Apollo, LinkedIn, etc.) via Composio, tell me and I'll pull directly.
>
> For each question I'll suggest the most accurate option. Ready?"

Wait for acknowledgement, then proceed.

### 1. Question 1 — ICP

> "In one line, who's your ICP (industry, company size, role you sell to)?
> *Best option: paste here, OR give me your website URL or pricing page —
> I'll infer from it. If you have an ICP doc (Notion, Google Doc, .pdf,
> .docx), drop it or share the link.*"

- If the user gives a URL, fetch via Composio (discover with
  `composio search web fetch` or the equivalent — don't hardcode).
- If a file, read it.
- If a connected-app pointer ("it's in my Drive"), fetch via the connected
  provider.
- Parse the source into `industry[]`, `companySizeRange`,
  `titleTargets[]`. Keep `triggerSignals`, `disqualifiers`, `notes` empty
  for now — they fill in later as I do research.
- Write `config/icp.json`.

### 2. Question 2 — Product

> "In one line, what do you sell — and what's the 1–2 line pitch you lead
> with? *Best option: give me your website URL and I'll extract the pitch
> + any key differentiators. Or drop a deck / one-pager / landing page
> export.*"

- Fetch / read as appropriate.
- Parse into `productName` and `oneLinePitch`. If I got a website or
  deck, I can often also extract `keyDifferentiators[]` — do that. Leave
  `pricingModel`, `priceRange`, `notes` empty unless surfaced (progressive
  capture will fill them when `draft-outreach` or `respond-to-objection`
  needs them).
- Write `config/product.json`.

### 3. Question 3 — Voice (best option: connected inbox)

> "Last one — I need to match your writing voice. Three options, ranked
> by accuracy:
>
> 1. **Best: connected inbox.** If you've linked Gmail / Outlook / your
>    email via Composio, tell me — I'll pull your last 20–30 sent messages
>    for a tight voice calibration.
> 2. **Good: drop files.** .eml exports, or a .txt / .md file with 5–10
>    of your emails.
> 3. **Okay: paste 2 recent outreach emails here in chat.**"

- If user picks (1): use `composio search <keyword>` to find the right
  search/list tool (e.g., Gmail sent folder search), fetch 20–30 sent
  messages, extract tone cues, write a condensed voice brief to
  `config/voice.md` with 3–5 illustrative verbatim samples.
- If user picks (2) or (3): capture the raw text verbatim. Header:
  `# Voice samples (captured {onboardedAt})`; separate samples with `---`.
- Either way, write `config/voice.md`.

### 4. Finalize

- Write `config/profile.json`:
  `{ userName, company, team?, role?, onboardedAt: <ISO-8601 now>,
  status: "onboarded" }`. If the user only answered 1–2 questions, set
  `status: "partial"` and note which fields are TBD so other skills know
  to ask again just-in-time.

### 5. Hand off

> "Ready. Ask me to **research your first lead** (`research {person} at
> {company}`), **design a sequence** for your ICP (`design-sequence`),
> or **run the daily standup**. I'll ask for anything else just-in-time
> as we work."

## Outputs

- `config/icp.json`
- `config/product.json`
- `config/voice.md`
- `config/profile.json`
