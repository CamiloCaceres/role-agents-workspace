# Role Agents Workspace

A Houston workspace of **hireable role agents** — each one represents a single job title a human could hold. Install the whole workspace to staff up a solo founder's back office, or extract any agent into its own installation; each is fully useful on its own.

## Who this is for

Founders and small teams (2-10 people) who want a set of narrow, recognizable specialists — not a generic assistant. Each agent does the shape of one person's job: the invisible work (drafting, triage, tracking, research) so your human attention goes to the judgment calls. "I need a PMM" → use the PMM agent. "I need an EA" → use the EA. Mix and match.

## The agents

### SDR — outbound sales
Prospects, researches leads, drafts outreach in your voice, runs sequences, triages replies, and books warm meetings — hands them off to you at the meeting-booked moment. Never sends without approval; never closes. Skills: `onboard-me`, `research-lead`, `draft-outreach`, `design-sequence`, `classify-reply`, `respond-to-objection`, `recover-stalled-thread`, `book-meeting`, `handoff-to-ae`, `daily-standup`.

### Customer Support Rep — inbound support
Triages inbound, drafts replies in your voice, tracks promises and SLAs, surfaces bugs and feature requests for engineering, and turns resolved tickets into KB drafts. Never sends without approval; never closes bugs or publishes articles on its own. Skills: `onboard-me`, `triage-incoming`, `draft-reply`, `promise-tracker`, `sla-watchdog`, `detect-bug-report`, `capture-feature-request`, `draft-article-from-ticket`, `customer-dossier`, `morning-briefing`.

### Executive Assistant — calendar + inbox + priorities
Triages inbox, guards your calendar, prepares meeting briefs, tracks follow-ups, handles travel prep, and gives you a ranked priority list each morning. Never sends replies or invites without approval; never commits on your behalf.

### PMM — product marketing
Drafts launch briefs, builds battlecards, writes sales one-pagers, analyzes win-loss, designs messaging tests, and monitors competitors. Arms Sales with fresh positioning. Never publishes externally without approval.

### Recruiter — sourcing + screening + coordination
Sources candidates with proof-of-work signals, scores openness-to-move, drafts outreach in your voice, runs structured screens, coordinates interviews, and prepares handoff packs for hiring managers. Never extends offers or rejects without approval.

### Data Analyst — SQL + metrics + anomalies + experiments
Writes SQL against your warehouse, tracks core metrics daily, detects anomalies against 7d/28d baselines, analyzes experiments with lift / significance / guardrails, drafts dashboard specs for your BI tool, and triages inbound ad-hoc data asks into a prioritized queue. Read-only against your warehouse; never drops data; never runs expensive queries without warning; never claims more than the data supports. Skills: `onboard-me`, `answer-question`, `track-metric`, `detect-anomaly`, `analyze-experiment`, `build-dashboard-spec`, `audit-data-quality`, `triage-ask`, `document-query`, `daily-standup`.

### CSM — account health + QBRs + renewals + expansion
Scores account health against your weighted signals, preps QBR packs from your template, flags at-risk accounts with severity and proposed plays, spots expansion opportunities from usage signals, drafts voice-matched customer touchpoints, analyzes renewal risk inside the 90-day window, and hands qualified expansion to your AE. Pairs naturally with the Customer Support Rep (tickets feed into health). Never closes expansions, never commits to roadmap, never discloses churn-risk scoring externally. Skills: `onboard-me`, `compute-health`, `flag-at-risk`, `prep-qbr`, `spot-expansion`, `draft-touchpoint`, `analyze-renewal-risk`, `summarize-voc`, `handoff-to-ae`, `daily-standup`.

## Design rules (built in)

- **One agent = one job title.** If you'd put it on LinkedIn, it's a role. "Marketing" is not a role. "PMM" is.
- **Standalone-first.** Every agent fully useful on its own. No `../sibling/` paths in default skills — you can install just one and it works.
- **Composio-only external transport.** Gmail, Slack, LinkedIn, HubSpot, Apollo, Intercom, Carta, Rippling, DocuSign, whatever — all reached via [Composio](https://composio.dev). No per-tool configuration. The agents discover tool slugs with `composio search`.
- **`onboard-me` is mandatory, max 3 questions.** Then **progressive capture** — each skill asks ONE targeted question if its needed config is missing. No 30-minute intake.
- **Dashboards are read-only, 3 sections max.** Actions flow through chat. The UI visualizes state; it doesn't mutate.
- **Never sends, never commits, never closes.** Every agent drafts, proposes, flags — the human approves.
- **Data at agent root.** Never under `.houston/<agent>/` (Houston's file watcher skips that path and dashboards stop reacting).

## Install

In Houston: **Add from GitHub** → paste this repo URL. Houston installs all five agents and creates a workspace under `~/Documents/Houston/Role Agents Workspace/`.

First-run: every agent starts with empty indexes (seeded via `agentSeeds`), so dashboards render clean empty states that point you at what to try first. Run `onboard-me` inside any agent to set up that specific role — the 3-question interview captures the minimum context it needs to start.

## Try these first

**SDR:** `Onboard me` · `Research {person} at {company}` · `Draft outreach to {lead}` · `Daily standup`
**Customer Support Rep:** `Onboard me` · `Triage my inbox` · `Morning briefing` · `Draft a reply to {ticket}`
**Executive Assistant:** `Onboard me` · `Give me my priorities for today` · `Brief me on my next meeting`
**PMM:** `Onboard me` · `Build a battlecard for {competitor}` · `Draft the launch brief for {feature}`
**Recruiter:** `Onboard me` · `Source candidates for {role}` · `Screen {candidate} for {role}`
**Data Analyst:** `Onboard me` · `How many signups this week?` · `Start tracking MRR daily` · `How did the checkout experiment do?`
**CSM:** `Onboard me` · `Compute health for my accounts` · `Prep QBR for {account}` · `What's at risk this week?`

## Structure

```
role-agents-workspace/
├── workspace.json
├── README.md
├── ROADMAP.md                  # upcoming role agents (Bookkeeper, CSM, ...)
├── role-agent-guide.md         # build guide for new role agents
└── agents/
    ├── houston-sdr/
    ├── houston-customer-support-rep/
    ├── houston-ea/
    ├── houston-pmm/
    ├── houston-recruiter/
    ├── houston-data-analyst/
    └── houston-csm/
```

Each agent directory contains `houston.json`, `CLAUDE.md`, `bundle.js`, `icon.png`, `data-schema.md`, `README.md`, and `.agents/skills/<name>/SKILL.md`.

## Extending

To add a new role agent, read `role-agent-guide.md`. The guide covers: role definition, the three-part contract (markdown guidance + filesystem data + read-only dashboard), `onboard-me` + progressive capture, the verification checklist, and field notes from past builds. `ROADMAP.md` lists the next role agents queued for build with complete briefs.

## License

MIT.
