# Houston Role Agents — Build Guide

You are a Claude Code session asked to **build a Houston role agent**: an AI agent that represents a single **hireable job role** (SDR, CFO, Paralegal, Recruiter, PMM, Controller, CSM, Bookkeeper, etc.). This guide is your spec.

You do **not** do big work in the main session. You orchestrate: dispatch subagents for research, design, and build where parallelism helps, then consolidate.

---

## TL;DR

1. **One agent = one job title a human could hold.** If someone would put it on their LinkedIn, it's a role. "Marketing" is not a role. "PMM" is.
2. **Each agent is a standalone product.** Fully useful when installed alone — no sibling assumptions, no cross-agent paths in default skills. All role agents live together in **one** workspace repo (`role-agents-workspace`) so installs, testing, and iteration happen in one place. Later, "hire a team" bundles will compose them, and any single agent can be extracted to its own repo if a standalone install ever needs it.
3. **Three parts:** a short pointer-style `CLAUDE.md`, focused `SKILL.md`s that do the work, a read-only overview `bundle.js`. Data lives in per-agent JSON + markdown files. Plus a new convention: a `config/` dir that captures what the agent learns about the user progressively.

---

## What a role agent is — and what it is not

**It IS:** a hireable specialist. Each agent has the scope of a single human job: narrow enough to be recognizable, broad enough to do useful work alone. Today users install the whole `role-agents-workspace` and use the agents they want; over time, individual agents may also ship as standalone installs. Either way the agent is **self-contained** — you could lift one out and it would still work.

**It is NOT:** a function-themed bundle of sub-agents. Do not build "Sales" as one agent — that's a team. Do not build "Marketing" — that's a function. Build the roles inside those functions: `sdr`, `ae`, `sales-ops` / `pmm`, `content-marketer`, `growth-marketer`.

**Granularity test:** if you would hire two different people for it, it's two roles. A **Controller** and a **Bookkeeper** share accounting software but their jobs and outputs are different. Two agents. An **SDR** and **BDR** are the same role (same job, same outputs, different titles across companies). One agent.

---

## When to use this guide

Use this guide when the user says any of:

- "Build me an agent for \[role\]"
- "I want to hire an \[role\]"
- "Create a \[role\] that \[does X\]"
- "We need a \[role\] agent for our catalog"

If the user asks for a **vertical workspace** (e.g. "build me a legal workspace"), use the older **`vertical-orchestrator-brief.md`** instead — that's a different product shape (function-named agents tightly coupled by cross-agent data). Role agents are the go-forward pattern; workspaces are legacy until "hire a team" ships.

---

## The three-part contract

Every role agent has exactly three parts. Keep them cleanly separated.

### 1. LLM guidance (markdown)
- `CLAUDE.md` — short pointer-style identity + skill index + hard nos. Target 50–80 lines. **Not** a manifesto.
- `.agents/skills/<name>/SKILL.md` — focused how-to skills with YAML frontmatter. One skill = one purpose. Descriptions start with "Use when…" and name an observable trigger.

### 2. Data (local filesystem)
- **`config/`** — the agent's learned context about the user (ICP, pricing, voice samples, chart of accounts, etc.). Populated by `onboard-me` and by progressive capture inside other skills.
- **Flat top-level JSON files** at agent root (e.g. `leads.json`, `deals.json`, `matters.json`) — dashboard-fast indexes.
- **Regular subfolders** at agent root (e.g. `leads/{slug}/lead.json`) — per-entity detail.
- Never under `.houston/<agent>/` — the Houston file watcher (`crates/houston-tauri/src/agent_watcher.rs`) skips those paths and dashboards won't react.
- Every record: `id` (UUID v4), `createdAt`, `updatedAt` (ISO-8601 UTC), plus domain fields.
- Atomic writes: temp-file + rename.

### 3. UI (custom React dashboard, observer-only)
- **Read-only.** Dashboards visualize state; they don't mutate. Actions come via chat.
- Subscribes to `houston-event` via `useHoustonEvent` (with a 5s polling fallback — see field notes).
- Simple. Three sections max. Use Tailwind + `React.createElement` (no JSX, no imports).
- One dashboard per agent — the role's "mission control."

---

## Where agents live on disk

All role agents live inside the **`role-agents-workspace`** repo, alongside the legacy vertical workspaces. All share one git repo — no per-agent repos.

```
houston-skills/
├── role-agents-workspace/                    # ← role agents live here (one repo)
│   ├── workspace.json
│   ├── README.md
│   ├── ROADMAP.md
│   ├── role-agent-guide.md                   # this file
│   └── agents/
│       ├── houston-sdr/
│       ├── houston-customer-support-rep/
│       ├── houston-ea/
│       ├── houston-pmm/
│       ├── houston-recruiter/
│       └── ...                               # future agents
├── legal-workspace/                          # legacy vertical workspaces
├── marketing-workspace/
└── solo-support-workspace/
```

When you build a new role, create it at **`/Users/milo/dev/taxflow/houston-skills/role-agents-workspace/agents/houston-{role-slug}/`** and commit to the workspace repo. Do **not** initialize a nested git repo inside the agent directory — the workspace is the single source of truth, which makes testing and iterating across agents fast (one `git pull`, no submodule choreography).

## File tree

What you ship (inside `houston-skills/role-agents-workspace/agents/houston-{role-slug}/`):

```
houston-{role-slug}/                         # repo root
├── houston.json                              # manifest (solo install)
├── CLAUDE.md                                 # short pointer
├── bundle.js                                 # overview dashboard (IIFE)
├── icon.png                                  # 256×256
├── data-schema.md                            # documents JSON files
├── README.md                                 # install + "try these first"
├── .gitignore
└── .agents/skills/
    ├── onboard-me/SKILL.md                   # MANDATORY — 2–3 question setup
    ├── {capability-1}/SKILL.md
    ├── {capability-2}/SKILL.md
    └── ...
```

What the agent writes at runtime (on the user's machine, under `~/Documents/Houston/{workspace}/{agent}/`):

```
{agent-root}/
├── config/                                   # learned context
│   ├── profile.json                          # user's name, team, company
│   ├── {role-specific}.json                  # e.g. icp.json, coa.json, voice.md
│   └── ...
├── {domain-index}.json                       # e.g. leads.json (fast index)
├── {entity}/{slug}/{entity}.json             # per-entity detail
└── {narrative}.md                            # e.g. daily-brief.md
```

---

## Phase-by-phase workflow

At every **USER CHECKPOINT**, stop and wait for explicit approval.

### Phase 1 — Lock the role

Before any research, extract from the user:

1. **The role** (the job title a human could hold).
2. **Who the user is** (are they the hirer? are they one of the current people doing this? what's their team size / company stage?).
3. **What "done" looks like** — one sentence describing the week if this agent works.
4. **Any hard nos** (e.g. "never send without approval", "must flag privilege", "privileged data stays local").

**USER CHECKPOINT:** Restate in 3 bullets. Wait for confirmation.

### Phase 2 — Research (parallel subagents)

Dispatch 3 `Task` subagents in parallel (one message, three calls). Each reports ≤500 words.

1. **Day-in-the-life research** — what does a real person in this role actually do hour-by-hour? What tools do they touch? What are the handoffs?
2. **Pain point research** — concrete time sinks ranked by frequency. Real sources: job forums, subreddits, trade association content, talks, competing-SaaS marketing pages (they describe pains accurately even if tool-biased).
3. **Skill analogues** — look at competing products, templates, agency offerings serving this role. Collect 15–25 candidate skill descriptions.

Synthesize into a research memo (kept in-session, not written to disk). Every skill description must start with "Use when…" and name an observable trigger.

**USER CHECKPOINT:** Present the memo. Iterate on corrections.

### Phase 3 — Design

Propose:
- **Name** (role title, match the LinkedIn form).
- **One-line job description**.
- **Scope boundary** — what this agent does NOT do. Critical for role coherence: an SDR does NOT close deals.
- **Data objects owned** (3–8 max).
- **Skills** (target 6–10). Always include `onboard-me` as the first.
- **Dashboard sections** (3 max). What JSON does each read?

Err toward **fewer, focused skills**. One skill per atomic capability. A skill doing three things is three skills.

**USER CHECKPOINT:** Present the design. Wait for approval.

### Phase 4 — Build

Dispatch ONE `Task` subagent to build the agent end-to-end (or do it yourself if simple). It writes every file in the tree. Do not nest subagents deep — the build subagent should not dispatch further subagents.

### Phase 5 — Verify

Run the verification matrix (see **Verification checklist** below) and report to the user.

### Phase 6 — Package & hand off

1. Confirm the agent lives at `/Users/milo/dev/taxflow/houston-skills/role-agents-workspace/agents/houston-{role}/`.
2. Update `role-agents-workspace/workspace.json` — add the new `houston-{role}` to the `agents` array.
3. Update `role-agents-workspace/README.md` — add a short section describing the new role (alongside the other agents).
4. Concise per-agent `README.md` inside the agent dir — who it's for, the skills list. No per-agent install one-liner (the workspace is the install unit).
5. Commit to the workspace repo: `cd role-agents-workspace && git add agents/houston-{role} workspace.json README.md && git commit -m "feat: add houston-{role} role agent"`.
6. Print the install string: **Houston → Add from GitHub → paste the `role-agents-workspace` repo URL**. The user gets every agent in the workspace at once.

---

## File specs (with templates)

### `houston.json`

```json
{
  "id": "sdr",
  "name": "SDR",
  "description": "Your Sales Development Rep — prospects, researches, drafts outreach in your voice, runs sequences, qualifies replies. Never sends without approval; never closes (hands warm meetings to you).",
  "icon": "UserRound",
  "category": "business",
  "author": "Houston Role Agents",
  "tags": ["sales", "sdr", "outbound", "prospecting"],
  "tabs": [
    { "id": "overview", "label": "Overview", "customComponent": "SdrDashboard" },
    { "id": "activity", "label": "Activity", "builtIn": "board", "badge": "activity" },
    { "id": "files", "label": "Files", "builtIn": "files" },
    { "id": "integrations", "label": "Integrations", "builtIn": "integrations" }
  ],
  "defaultTab": "overview",
  "agentSeeds": {
    "leads.json": "[]",
    "sequences.json": "[]",
    "replies.json": "[]"
  }
}
```

Rules:
- `id` = role slug. `name` = role title.
- **First tab `id` must NEVER be `dashboard`, `connections`, or `settings`** — those collide with app shell state. Use `overview`, `home`, or a content-named id like `leads` / `matters`.
- `agentSeeds` must map **every file the dashboard reads on mount** to `"[]"`. Prevents a toast flood on first open (the Tauri invoke wrapper shows an error toast for every `read_agent_file` that 404s; without seeds a dashboard reading 5 files fires 5 error toasts).
- Include `files`, `activity`, `integrations` built-in tabs. Always.

### `CLAUDE.md` (short pointer style)

Target 50–80 lines. Five sections, each short.

```markdown
# I'm your SDR

1-line mission: who I am, what I do.
1-line boundary: what I won't do.

## To start

Either run `onboard-me` for a 90-second setup, or just give me work — I'll
ask for what I need as I go. I learn by doing.

## My skills

- `onboard-me` — 2–3 questions so I can start working.
- `research-lead` — given a name + company, build a quick dossier.
- `draft-outreach` — first-touch message in your voice.
- `sequence` — propose a 3-touch follow-up cadence.
- `triage-replies` — classify responses (interested / not-now / not-interested / unsubscribe).
- `book-meeting` — draft the booking message with your availability.
- `daily-standup` — what I did yesterday, what's next.

## Composio is my only transport

Every external tool — Gmail, LinkedIn, Apollo, HubSpot, Outreach, Slack —
flows through Composio. I discover tool slugs with `composio search` and
execute by slug. If a connection is missing, I tell you which app to link
and stop — no workarounds.

## Data rules

- My data lives at my agent root, never under `.houston/<agent>/`.
- Config I've learned about you: `config/{...}.json`.
- Domain data I produce: `leads.json`, `sequences.json`, `replies.json`,
  plus `leads/{slug}/lead.json` for details.
- Writes are atomic (temp-file + rename).

## What I never do

- Send anything without your approval.
- Invent facts about companies or people — I tell you when research is thin.
- Make pricing promises.
- Close deals (that's yours).
- Write anywhere under `.houston/`.
```

That's the whole file. If it's longer than ~80 lines, you're manifesto-ing. Cut.

### `config/` — the new convention

`config/` is where the agent stores **what it has learned about the user's context**, separate from **what it has produced as domain data**.

Common files:

- `config/profile.json` — user name, team, company, their role, preferred tone.
- `config/{role-specific}.json` — role's core context. Examples:
  - SDR: `icp.json`, `objections.json`, `pricing.json`, `voice.md`
  - CFO: `chart-of-accounts.json`, `fiscal-year.json`, `materiality.json`
  - Paralegal: `client-roster.json`, `matter-types.json`, `filing-templates.json`
  - Recruiter: `hiring-plan.json`, `team-culture.md`, `interview-rubrics.json`
- `config/voice.md` — markdown samples of the user's writing style. Every agent that drafts messages benefits from this.

Rules:
- Everything in `config/` is written by the agent itself (never shipped in the repo). The `agentSeeds` field in `houston.json` does NOT seed config files — they don't exist until `onboard-me` or a progressive-capture skill writes them.
- Skills that need config MUST gracefully handle missing files. Read → if absent, ask the user one targeted question → write → continue.
- Document every config file in `data-schema.md` with when it gets written.

### `onboard-me` skill (mandatory — template)

Every `onboard-me` MUST open with a **scope + modality preamble** before the first question. The preamble has two jobs:

1. **Tell the user what I'll ask about** (the three topics, by name — "Your ICP, Your Product, Your Voice"). A generic "let me gather context" is too abstract; users don't know what to prepare.
2. **Tell the user the easiest modality per topic** (best option ranked first — usually connected-app > URL/file > paste). A generic list of "you can paste or drop a file" leaves them guessing.

Combining these means the preamble IS the roadmap. The user sees the whole journey upfront, can grab a deck or a URL they want to share, and the follow-up questions become short ("Great — your product + pitch?") because the menu is already known.

`.agents/skills/onboard-me/SKILL.md`:

```markdown
---
name: onboard-me
description: Use when the user explicitly asks to "onboard" me or "set me up," or on the very first real task when no config files exist yet — open with a modalities preamble that teaches the user what I can read (paste / file / URL / connected apps via Composio), then run a tight 90-second interview (3 questions maximum) to capture the minimum context needed to start working, then write to `config/`.
---

# Onboard Me

## When to use

First-run setup. The user said "onboard me", "set me up", "let's get started",
or I'm about to do real work for the first time and `config/profile.json` is
missing. Only run ONCE unless explicitly re-invoked.

## Principles

- **Lead with a scope + modality preamble.** Users need to see (a) what I'll
  ask about AND (b) the easiest way to give me each — BEFORE the first
  question. "Give me context" in the abstract is too vague.
- Max 3 questions. Get the minimum to start working, not everything.
- **One question at a time after the preamble.** The preamble does the heavy
  lifting; follow-up questions are short ("Got it — your product + pitch?")
  because the user already knows the menu.
- Rank modalities: connected app (Composio) > file/URL > paste.
- Any skipped question: note "TBD" and ask again just-in-time when needed.

## Steps

0. **Scope + modality preamble — the FIRST message (names each topic AND its best modality, then rolls into Q1):**

   > "Let's get you set up — 3 quick questions, about 90 seconds. Here's what
   > I need to know and the easiest way to share each:
   >
   > 1. **{Topic 1}** — {one-line of what this is}. {Best modality + fallbacks}.
   > 2. **{Topic 2}** — {one-liner}. {Best modality + fallbacks}.
   > 3. **{Topic 3}** — {one-liner}. {Best modality + fallbacks — voice
   >    topics usually favor a connected inbox via Composio}.
   >
   > For any of these you can also drop files, share public URLs, or point
   > me at a connected app. Let's start with #1 — {Q1 inline}?"

1. **Capture topic 1** based on the modality the user picked — parse paste,
   fetch URL, read file, or call the Composio tool (`composio search` to
   discover the right slug). Write `config/{file}.json`. Acknowledge briefly
   and roll into Q2.
2. **Capture topic 2** same pattern. Roll into Q3.
3. **Capture topic 3** same pattern. For voice, if the user took the
   connected-inbox route, use `composio search` to find the sent-folder
   list/search tool and fetch 20–30 recent sent messages; extract tone cues
   and write 3–5 verbatim samples to `config/voice.md`.
4. Write `config/profile.json` with `{ name, onboardedAt, status: "onboarded" }`.
   Use `"partial"` if any question was skipped.
5. Hand off: "Ready. Try: {first-useful-action}. I'll ask for anything else
   just-in-time."

## Outputs

- `config/{role-specific}.json`
- `config/voice.md`
- `config/profile.json`
```

**3 questions is the ceiling, not the target.** If you can get away with 2, do it.

**The scope + modality preamble is non-negotiable.** Shipping `onboard-me` that asks for "context" without naming the topics AND the best modality per topic produces confused users — they don't know what to prepare. Every role agent starts this way.

### Progressive config capture (pattern for other skills)

Every skill that consumes config must handle missing values gracefully. When asking a just-in-time question, **mention the best modality** — don't assume the user knows they can drop a file or point to a connected app:

```markdown
## Steps

1. Read `config/icp.json`. If missing or incomplete, ask the user:
   "Quick — in one line, who's your ICP? *Paste it, or give me a URL to your
   pricing/about page and I'll infer it.*" Write the answer to
   `config/icp.json`. Continue.
2. Read `config/voice.md`. If missing, ask: "Paste one recent email you've sent
   so I can match your voice — *or, if you've connected your inbox via
   Composio, just say so and I'll pull recent sent messages directly*."
   Write. Continue.
3. {actual skill work}
```

This pattern means:
- Day 1 is immediately useful (no 30-minute intake).
- The agent learns WHAT IT NEEDS WHEN IT NEEDS IT.
- The same question is never asked twice — it's cached in `config/`.

### Domain skills

Same shape as any Houston skill:

```markdown
---
name: draft-outreach
description: Use when the user asks to draft a first-touch outreach message to a specific lead — pulls the lead's dossier from `leads/{slug}/lead.json` (or runs `research-lead` first if missing), reads `config/icp.json` and `config/voice.md`, and writes the draft to `leads/{slug}/outreach-draft.md`. Never sends.
---

# Draft Outreach

## When to use
...

## Steps
1. ...
2. ...

## Outputs
- `leads/{slug}/outreach-draft.md`
- Updates `leads.json` entry (lastDraftedAt)
```

Rules:
- Descriptions start with "Use when…" and name an observable trigger.
- One skill = one purpose.
- No cross-agent paths. Every file reference inside the agent's own root.
- Tool-agnostic vocab. Say "via any Composio-connected inbox," not "via Gmail."
- List the exact files written under **Outputs**.

**Skill duplication across roles is fine.** An SDR's `draft-outreach` and a Recruiter's `draft-candidate-message` may share 80% of logic — do NOT factor out. Each is tuned to role voice and priors, and lives in its agent's own skill dir. The skill name can be identical across agents; they're independent files in independent directories within the workspace.

### `data-schema.md`

Same structure as in the workspace pattern, but **simpler** — no cross-agent reads in the default skill set. Document every file the agent reads or writes with a TypeScript-style interface and a "written by" line pointing at the skill(s) that populate it.

Separate two sections: **Config** (what the agent learns) and **Domain data** (what the agent produces).

### `bundle.js` (the dashboard)

**Hand-crafted IIFE. No Vite build step. No JSX. No imports.** React is accessed via `window.Houston.React`. Copy the structure from `solo-support-workspace/agents/inbox/bundle.js` or any `legal-workspace/agents/*/bundle.js` — they're the canonical references.

Required:
- `const React = window.Houston.React; const h = React.createElement;`
- A `useHoustonEvent` hook that dynamically-imports `@tauri-apps/api/event` (use the `["@tauri-apps","api","event"].join("/")` trick so Vite doesn't try to resolve it) + a **5s `setInterval` polling fallback** (currently required — see field notes).
- The literal string `useHoustonEvent` must appear in source (verification greps for it).
- Destructure ONLY `{ readFile, sendMessage }` from props. Ignore `workspace` / `agent` / any other prop keys (they churn at runtime).
- `window.__houston_bundle__ = { ComponentName: Component };` at the end, and `ComponentName` must match `customComponent` in `houston.json`.
- Three sections max. Include a "welcome / not onboarded yet" state that shows if `config/profile.json` is missing — and inline the prompt "Ask me to onboard-me to get started."

### `icon.png`

256×256 solid-color PNG via stdlib Python (no Pillow):

```bash
python3 -c "
import struct, zlib
size=256; color=(0x2B,0x3F,0x6E)  # pick a color per role
raw=b''
for y in range(size):
    raw+=b'\\x00'
    for x in range(size): raw+=bytes(color)
data=zlib.compress(raw)
def chunk(t,d):
    crc=zlib.crc32(d, zlib.crc32(t))
    return struct.pack('>I',len(d))+t+d+struct.pack('>I',crc)
png=b'\\x89PNG\\r\\n\\x1a\\n'
png+=chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
png+=chunk(b'IDAT', data)
png+=chunk(b'IEND', b'')
open('icon.png','wb').write(png)
"
```

### `README.md`

Keep it punchy. Template:

```markdown
# houston-sdr

Your AI Sales Development Rep. Prospects, researches leads, drafts outreach
in your voice, runs sequences, and qualifies replies. Never sends without
your approval. Hands warm meetings to you.

## Who this is for

Founders and sales leaders who are either doing outbound themselves today or
want an AI SDR alongside a small team. You connect your stack via Composio
(Gmail, LinkedIn, Apollo, HubSpot — whatever you use); the SDR adapts.

## Install

In Houston: **Add from GitHub** → paste this repo URL.

## First prompts

- `Onboard me` — 3-question setup so I can start drafting in your voice.
- `Research {person} at {company}` — quick dossier with likely pain points.
- `Draft outreach to {lead}` — first-touch in your voice.
- `Daily standup` — what happened yesterday, what's queued next.

## Skills

{list with one-liners}

## License

MIT.
```

---

## Patterns to follow

- **CLAUDE.md is a pointer.** If you're tempted to explain *how* something works in CLAUDE.md, stop — that's what SKILL.md is for.
- **`onboard-me` is mandatory and short.** Every role agent has it. 3 questions max.
- **Progressive config capture.** Never batch-interview beyond onboard-me.
- **Dashboard is read-only.** Actions come via chat. `sendMessage("…")` on a button is allowed for "kick the agent" shortcuts but never for data mutation.
- **Three sections max per dashboard.** Stats row → primary list → secondary detail or secondary list.
- **Empty states are mandatory.** Every section has a helpful empty state that tells the user what to ask to populate it.
- **Composio-agnostic skills.** Talk in verbs ("fetch from the connected inbox"), never tool nouns ("fetch from Gmail").
- **Tool-agnostic examples in CLAUDE.md.** Role-specific tool lists can appear in prose but skills must not hardcode tool names.
- **Reserved tab ids:** `dashboard`, `connections`, `settings` silently collide with app shell. Use `overview`, `home`, or a content-named id.

---

## Anti-patterns (don't do these)

- **Do not put data under `.houston/<agent>/`.** The file watcher skips it; dashboards won't react.
- **Do not bundle `@houston-ai/core`** into the IIFE — it's not exposed to bundle scope at runtime. Use `window.Houston.React.createElement` + Tailwind only.
- **Do not import React** at build time. `const React = window.Houston.React` at runtime.
- **Do not use Vite's `create-app/templates/custom/`** — its default config outputs ESM which will not load. Hand-craft the IIFE.
- **Do not ship agents with cross-agent paths** (`../sibling/*.json`) in the default skill set. Each role is standalone.
- **Do not build "team" agents.** Sales, Marketing, Legal are teams. Build the roles inside them.
- **Do not write a 200-line CLAUDE.md.** If you have that much to say, it belongs in SKILL.md bodies.
- **Do not skip onboard-me** to "save complexity." The 3-question interview is the core UX — without it the agent is generic.
- **Do not front-load onboarding past 3 questions.** It's a tax on hiring the agent. Learn by doing.
- **Do not polish the dashboard past three sections.** More sections = more cognitive load, and the user has chat for anything complex.
- **Do not invent Houston APIs.** The custom-component contract passes `{ readFile, writeFile, listFiles, sendMessage }`. Everything else is out of scope.
- **Do not ask the user to copy-paste terminal output.** Read the log files (`~/.houston/logs/{backend,frontend}.log`) yourself.

---

## Verification checklist

Run these at the end of every agent build. All must pass before handing off.

| # | Check | How |
|---|-------|-----|
| 1 | `houston.json` parses and has `id`, `name`, `tabs`, at least one `customComponent` tab | `python3 -c "import json; json.load(open('houston.json'))"` |
| 2 | First tab `id` is NOT `dashboard` / `connections` / `settings` | grep |
| 3 | Bundle loads in Node shim and exports the `customComponent` name | `node -e "global.window={Houston:{React:{createElement:()=>null,useState:()=>[null,()=>{}],useEffect:()=>{},useCallback:f=>f,useMemo:f=>f()}}}; eval(require('fs').readFileSync('bundle.js','utf8')); console.log(Object.keys(window.__houston_bundle__))"` |
| 4 | `bundle.js` contains the literal string `useHoustonEvent` | grep |
| 5 | `bundle.js` contains a `setInterval` polling fallback (currently required) | grep |
| 6 | Every SKILL.md `description` starts with `Use when` and names an observable trigger | grep `^description: Use when` |
| 7 | `onboard-me` skill exists and its body mentions "3 questions" or fewer | read |
| 8 | No path references `.houston/<agent>/` (except in prose telling the agent never to use it) | grep |
| 9 | No skill body references `../{sibling}/` paths | grep |
| 10 | `agentSeeds` covers every file the dashboard reads on mount | read bundle.js `readFile(...)` calls → check each against `agentSeeds` keys |
| 11 | Every config file is documented in `data-schema.md` with "written by" | read |
| 12 | README lists install path + 3 first prompts | read |

Report the matrix to the user before calling it done.

---

## Field notes from past runs

- **Seed every file the dashboard reads on mount.** Houston's invoke wrapper shows an error toast for every `read_agent_file` miss — even if the bundle catches the exception. A dashboard reading 5 un-seeded files shows 5 toasts on first open. Add every mount-read file to `agentSeeds` with `"[]"`.

- **Reserved tab ids will silently hijack your agent.** `dashboard`, `connections`, `settings` match app-shell `viewMode` and the app never renders your tab. Use `overview`, `home`, or a content-named id.

- **IIFE bundles only; `@houston-ai/core` is not on `window`.** The runtime loader injects `bundle.js` as a raw `<script>` tag. Only `window.Houston.React` / `ReactDOM` / `jsxRuntime` are exposed. You get Tailwind classes + `React.createElement` and that's it.

- **`useHoustonEvent` alone is not enough today — add 5s polling.** Dynamic `import("@tauri-apps/api/event")` currently fails inside script-injected bundles. Keep the `useHoustonEvent` pattern (Phase 6 greps for it, documents intent) AND add a `setInterval(reload, 5000)` fallback. Strictly violates "no polling" but without it the dashboard is static on arrival.

- **`CustomTabProps` shape churns — destructure only the functions.** Older docs mention `workspace: { id, name, folderPath }`. Runtime actually passes `agent` + `agentDef`. Ignore the object keys. Destructure only `{ readFile, writeFile, listFiles, sendMessage }`.

- **Composio as universal transport collapses per-tool skill sprawl.** Don't write `gmail-triage` + `outlook-triage` + `slack-triage`. Write one `triage-inbound` that fetches "via any Composio-connected channel" and points to `composio search <keyword>`. One skill file adapts to whatever is connected.

- **Autonomous mode collapses Phase 3 + 4.** When the user waives checkpoints ("go autonomous", "I trust you"), fold design into build: one subagent per agent, inline the full spec (identity + skills + data + dashboard sections), let it write every file end-to-end. One parallel build subagent finishes in ~5 minutes.

- **Python stdlib writes valid PNGs without Pillow.** ~15 lines of `struct` + `zlib` produce a 256×256 solid-color PNG. Works on any macOS / Linux runner without setup.

- **Phase 6 greps are necessary but not sufficient.** Finding `useHoustonEvent` in source confirms intent, not that reactivity fires. Manual verification in a running Houston is the only way to confirm end-to-end. Add that step when a local Houston is available.

- **Skill-description quality is enforceable upfront.** Telling build subagents in the prompt *"any description that doesn't start with 'Use when…', name an observable trigger, and match the role's scope is a failed skill — reject your own work"* produces clean first drafts. Post-hoc rework of weak descriptions is slow; preventing them is free.

- **CLAUDE.md bloat kills agent behavior.** A 200-line CLAUDE.md leads the model into manifestic preamble on every task. A 60-line pointer keeps it tool-oriented. If your CLAUDE.md crosses 100 lines, move content into skills.

- **Onboarding scope creep kills hiring.** A 10-question `onboard-me` is a UX tax the user won't pay. Gate at 3. Fill the rest via progressive capture.

- **Roles over functions.** If the user asks for "a marketing agent," push back gently: "PMM? Growth? Content? SEO? Each is a separate role." Don't build composite agents — they become the old function-workspace pattern and lose the "hire a human" clarity.

---

## Done criteria

A role agent is done when:

1. The directory `houston-skills/role-agents-workspace/agents/houston-{role}/` exists with all 7 required files + at minimum `onboard-me` and 5 domain skills.
2. Every item in the **Verification checklist** passes green.
3. The user has seen and approved the final file tree.
4. `workspace.json` and the workspace `README.md` are updated to include the new agent.
5. The agent + workspace metadata are committed to the `role-agents-workspace` repo (no per-agent repo, no per-agent `git init`).
6. You've printed the install one-liner to the user (the workspace repo URL — not a per-agent URL).

---

## Starter prompt

If the user starts you up and hasn't given a role yet, ask:

> "Which role are we building? A job title a real human could hold — e.g. 'SDR', 'Controller', 'Paralegal', 'Technical Recruiter'. If you have a specific user in mind (you, a customer), tell me about them too."

Then proceed to Phase 1.
