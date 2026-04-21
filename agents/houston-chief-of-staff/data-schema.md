# Chief of Staff — Data Schema

All records share these base fields:

```ts
interface BaseRecord {
  id: string;          // UUID v4
  createdAt: string;   // ISO-8601 UTC
  updatedAt: string;   // ISO-8601 UTC
}
```

All writes are atomic: write to a sibling `*.tmp` file, then rename
onto the target path. Never edit in-place. Never write anywhere under
`.houston/<agent>/` — the file watcher skips those paths.

---

## Config — what the agent has learned about you

Nothing in `config/` is shipped in the repo. Files appear at runtime,
written by `onboard-me` or by progressive capture inside other skills.

### `config/profile.json`
```ts
interface Profile {
  userName: string;
  company: string;
  stage?: "seed" | "series-a" | "series-b" | "series-c" | "growth" | "public" | "other";
  headcount?: number;
  onboardedAt: string;      // ISO-8601
  status: "onboarded" | "partial";
}
```
Written by: `onboard-me`. Updated by: any skill that captures a
missing field (progressive capture).

### `config/leadership-team.json`
```ts
interface ExecTeamMember {
  id: string;               // stable slug
  name: string;
  role: string;             // e.g. "CTO", "VP Sales", "Head of Product"
  email?: string;
  domain: string;           // "engineering", "sales", "product", "finance"...
  directReports?: number;
  notes?: string;
}
type LeadershipTeam = ExecTeamMember[];
```
Written by: `onboard-me`. Consumed by: `status-rollup`,
`prep-exec-meeting`, `identify-bottleneck`, `prep-board-pack`.

### `config/strategic-priorities.json`
```ts
interface StrategicPriorities {
  horizon: "quarter" | "year";
  themes: {
    id: string;             // stable slug
    title: string;          // one-line
    owner?: string;         // exec team member id or name
    summary?: string;       // longer description
  }[];
  period?: string;          // e.g. "2026-Q2" or "2026"
}
```
Written by: `onboard-me`. Updated by: progressive capture inside
`status-rollup` and `prep-board-pack` when priorities shift.
Consumed by: `status-rollup`, `prep-board-pack`,
`draft-investor-update`, `identify-bottleneck`.

### `config/okrs.json`
```ts
interface KeyResult {
  id: string;               // stable slug
  metric: string;           // what's being measured
  target: number;
  current?: number;         // most recent captured value
  owner?: string;
  unit?: string;            // e.g. "%", "$", "users"
  cadence?: "weekly" | "monthly" | "quarterly";
}

interface Objective {
  id: string;
  objective: string;        // one-line
  owner?: string;
  period: string;           // e.g. "2026-Q2"
  state?: "on-track" | "at-risk" | "off-track";
  keyResults: KeyResult[];
}

type Okrs = Objective[];
```
Written by: `onboard-me`, `track-okr`. Consumed by: `track-okr`,
`status-rollup`, `prep-exec-meeting`, `prep-board-pack`,
`draft-investor-update`, `daily-standup`, dashboard.

### `config/meeting-cadence.json`
```ts
interface MeetingCadence {
  exec: { frequency: "weekly" | "biweekly" | "monthly"; dayOfWeek?: string };
  board: { frequency: "monthly" | "quarterly"; nextAt?: string };
  investorUpdate: { frequency: "monthly" | "quarterly"; nextDueAt?: string };
  offsite?: { frequency: "quarterly" | "biannual" | "annual" };
}
```
Written by: `onboard-me` (progressive — captured first time
`prep-exec-meeting`, `prep-board-pack`, or `draft-investor-update`
needs it). Consumed by: `prep-exec-meeting`, `prep-board-pack`,
`draft-investor-update`, `daily-standup`.

### `config/decision-framework.md`
Markdown. Plain-English description of who decides what — RACI-ish
but lightweight. When the CEO weighs in. When a decision can be
owner-only. Used to judge whether `log-decision` marks status
"pending" (CEO input needed) vs. "decided" (owner already ran it).

Written by: `onboard-me` (progressive — captured first time
`log-decision` runs and can't classify a decision). Consumed by:
`log-decision`, `prep-exec-meeting`.

### `config/voice.md`
Markdown. 3-5 verbatim samples of CEO writing style (all-hands
message, investor update paragraph, crisp Slack note). Used by every
drafting skill.

Written by: `onboard-me`, or progressive capture the first time
`draft-comms` / `draft-investor-update` runs. Consumed by:
`draft-comms`, `draft-investor-update`, `prep-board-pack`.

---

## Domain data — what the agent produces

### `initiatives.json` (index)
```ts
interface InitiativeIndex extends BaseRecord {
  slug: string;                              // kebab-case
  title: string;
  owner?: string;                            // exec team member id or name
  status: "on-track" | "at-risk" | "off-track";
  kind?: "standard" | "board-pack";          // board-pack kind surfaces readiness on the dashboard
  readiness?: number;                        // 0-100, only populated when kind === "board-pack"
  startedAt?: string;
  targetDate?: string;
  linkedOkrIds: string[];
  lastStatusAt?: string;                     // when status last updated
}
type Initiatives = InitiativeIndex[];
```
Written by: `status-rollup`, `prep-board-pack` (writes a
`kind: "board-pack"` record tracking readiness), progressive
capture elsewhere. Consumed by: `status-rollup`,
`prep-exec-meeting`, `prep-board-pack`, `draft-investor-update`,
`identify-bottleneck`, `daily-standup`, dashboard.

### `initiatives/{slug}/init.json`
```ts
interface InitiativeDetail extends BaseRecord {
  slug: string;
  title: string;
  owner?: string;
  status: "on-track" | "at-risk" | "off-track";
  history: { at: string; status: string; note?: string }[];
  risks: string[];
  asks: string[];                            // what the initiative needs from leadership
  crossTeamDependencies: string[];           // other teams / exec domains it depends on
  linkedOkrIds: string[];
  notes?: string;
}
```
Written by: `status-rollup` (creates / updates on each rollup),
`prep-board-pack`. Consumed by: `status-rollup`,
`identify-bottleneck`, `prep-exec-meeting`.

### `initiatives/{slug}/status.md`
Latest status report for this initiative, overwritten each time
status is refreshed. Markdown — wins / risks / asks / next.

Written by: `status-rollup`.

### `status-rollups/{yyyy-mm-dd}/rollup.md`
Weekly exec-level rollup, one file per run. Markdown with sections
per team domain. Cites initiatives by slug.

Written by: `status-rollup`. Consumed by: `prep-exec-meeting`,
`draft-investor-update`, `identify-bottleneck`.

### `decisions.json` (index)
```ts
interface DecisionIndex extends BaseRecord {
  slug: string;                              // kebab-case
  title: string;
  summary?: string;                          // one-liner, shown on the dashboard
  status: "pending" | "decided";
  decidedBy?: string;
  decidedAt?: string;
  linkedInitiativeSlugs?: string[];
  considered?: string[];                     // alternative options considered
  rationale?: string;                        // only when decided
}
type Decisions = DecisionIndex[];
```
Written by: `log-decision`. Consumed by: `log-decision`,
`prep-exec-meeting`, `daily-standup`, dashboard.

### `decisions/{slug}/decision.md`
ADR-style decision record. Sections: context, alternatives,
trade-offs, decision, consequences, open questions.

Written by: `log-decision`. Consumed by: `prep-board-pack`,
`prep-exec-meeting`.

### `board-packs/{yyyy-qq}/board-pack.md`
Quarterly board pack draft. Sections: business update, metrics,
OKRs, wins, challenges, asks. Cites source queries / rollups.

Written by: `prep-board-pack`.

### `board-packs/{yyyy-qq}/investor-update.md`
Monthly or quarterly investor update draft in CEO voice. Narrative
with: TL;DR, metrics, wins, lessons, asks.

Written by: `draft-investor-update`.

### `okr-tracker.json`
Snapshots of OKR progress over time. Used by the dashboard to compute
7-day-delta trends.

```ts
interface OkrSnapshot {
  id: string;                                // snapshot uuid
  objectiveId: string;
  date: string;                              // YYYY-MM-DD
  // Either a single-KR row (flat shape)...
  keyResultId?: string;
  value?: number;
  // ...or a full set of KRs captured together (nested shape).
  keyResults?: { id: string; value: number }[];
  state?: "on-track" | "at-risk" | "off-track";
  createdAt: string;
}
type OkrTracker = OkrSnapshot[];
```
Written by: `track-okr` (appends on each refresh). Consumed by:
`track-okr`, `status-rollup`, `prep-board-pack`,
`draft-investor-update`, dashboard.

### `bottlenecks.json`
```ts
interface Bottleneck extends BaseRecord {
  slug: string;
  title: string;
  hypothesis: string;                        // why it's stuck, 1-2 lines
  proposedOwner?: string;
  impactOnOkrIds: string[];
  impactOnInitiativeSlugs: string[];
  status: "open" | "in-progress" | "resolved" | "deferred";
  evidence: string[];                        // citations: rollup file paths, decision slugs
  resolvedAt?: string;
  resolutionNote?: string;
}
type Bottlenecks = Bottleneck[];
```
Written by: `identify-bottleneck`. Consumed by: `status-rollup`,
`prep-exec-meeting`, `daily-standup`.

### `comms-drafts/{slug}/draft.md`
Draft of a CEO comm (all-hands, team update, sensitive people
comm, external correspondence). Sits in `comms-drafts/` until
approved and sent by the CEO through their own channels.

Written by: `draft-comms`.

### `daily-brief.md`
Morning rundown — overwritten each time `daily-standup` runs.

Written by: `daily-standup`.
