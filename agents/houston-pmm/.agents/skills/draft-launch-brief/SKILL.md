---
name: draft-launch-brief
description: Use when the user names an upcoming or in-progress launch — "draft a launch brief for {thing}," "plan the launch," "we're shipping X next month" — produce a full brief covering audience, problem, positioning anchor, key messages, channel plan, asset checklist, success metrics, and phase plan. Writes to `launches/{slug}/brief.md` and seeds the asset checklist. Never publishes.
---

# Draft Launch Brief

## When to use

The user names a launch (product, feature, major update) and wants a
plan. Also run me automatically when `draft-launch-content` or
`write-sales-one-pager` is called and `launches/{slug}/brief.md` is
missing.

## Steps

1. **Resolve the launch.** Parse name + audience (if given). Compute
   `slug = kebab-case(name)`. Check `launches.json` — if the slug
   already exists, load the existing brief and ask: "Update in place
   or start fresh?"
2. **Load positioning.** Read `config/positioning.json`. If missing
   or `status` says partial, stop and ask the user: "Positioning
   isn't locked yet — want me to run `define-positioning` first?"
   If they say no, proceed with whatever positioning exists and note
   the gap in the brief.
3. **Load launch cadence.** Read `config/launch-cadence.json`. If
   missing, ask progressively: "What channels do you usually launch
   on? What gates does the launch need to clear (legal, CEO
   sign-off)?" Write the answer to `config/launch-cadence.json`.
4. **Read the latest win-loss themes** (`win-loss.json`) and active
   tests (`messaging-tests.json`) — anything current should inform
   the key messages.
5. **Draft the brief** in `launches/{slug}/brief.md` with this
   structure:
   ```markdown
   # Launch brief — {name}

   ## One-line
   {what we're launching, for whom, why now}

   ## Audience
   Primary: {best-for segment from positioning, narrowed for this launch}
   Secondary: {adjacent segments that benefit}

   ## Problem
   {the job-to-be-done or pain the launch addresses — tied to the
   positioning's value themes}

   ## Positioning anchor
   Category: {from positioning}
   Competitive frame: {the alternatives the customer is weighing}
   Unique angle for this launch: {1-2 sentences}

   ## Key messages (3)
   1. {headline message — the one thing if they read nothing else}
   2. {second pillar}
   3. {third pillar}

   ## Proof points
   - {customer quote / benchmark / demo moment / data}
   - ...

   ## Channel plan
   | Channel | Moment | Owner | Asset needed |
   |---------|--------|-------|--------------|
   | {email} | launch-day | pmm | announcement email |
   | ... | ... | ... | ... |

   ## Asset checklist
   - [ ] announcement email
   - [ ] launch blog post
   - [ ] LinkedIn long-form
   - [ ] Twitter thread
   - [ ] sales one-pager
   - [ ] updated battlecards (list affected competitors)
   - [ ] demo video / GIFs
   - [ ] website hero update
   - [ ] in-app announcement
   - [ ] {add or remove based on launch-cadence channels}

   ## Phase plan
   {internal / alpha / beta / early-access / full — whichever phases
   apply. Dates if committed, otherwise "TBD" ranges.}

   ## Success metrics
   - Leading: {signups, demo requests, page views}
   - Lagging: {pipeline generated, revenue, adoption}

   ## Risks / landmines
   - {anything that could tank the launch — competitor launch overlap,
     messaging untested, pricing sensitivity}
   ```
6. **Write the asset checklist** as structured data to
   `launches/{slug}/assets.json` — one row per checklist item with
   `status: "todo"`, `owner`, and the filename it maps to (so the
   dashboard can show real completion %).
7. **Upsert `launches.json`** with `status: "brief"`, `phase` from
   the plan, `launchDate` if committed, `assetsComplete: 0`, tags.
8. **Tell the user** the brief is ready. Offer next actions: "Want
   me to draft the announcement content (`draft-launch-content`),
   the sales one-pager (`write-sales-one-pager`), or refresh
   competitor battlecards?"

## Outputs

- `launches/{slug}/brief.md`
- `launches/{slug}/assets.json`
- Upserted row in `launches.json`
- Possible write to `config/launch-cadence.json` (progressive capture)
