# CSM — Data Schema

All records share these base fields:

```ts
interface BaseRecord {
  id: string;          // UUID v4
  createdAt: string;   // ISO-8601 UTC
  updatedAt: string;   // ISO-8601 UTC
}
```

All writes are atomic: write to a sibling `*.tmp` file, then rename onto
the target path. Never edit in-place. Never write anywhere under
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
  team?: string;
  role?: string;
  onboardedAt: string;     // ISO-8601
  status: "onboarded" | "partial";
}
```
Written by: `onboard-me`. Updated by: any skill that captures a missing
field (progressive capture).

### `config/accounts-focus.json`
```ts
interface AccountsFocus {
  tiers: {
    id: "enterprise" | "mid-market" | "smb" | string;
    label: string;
    minArr?: number;
    maxArr?: number;
  }[];
  focusTierIds: string[];                // which tiers this CSM owns
  focusList?: { name: string; domain?: string; arr?: number }[];
  notes?: string;
}
```
Written by: `onboard-me`. Consumed by: `compute-health`,
`analyze-renewal-risk`, `spot-expansion`, `daily-standup`.

### `config/health-signals.json`
```ts
interface HealthSignal {
  id: string;                             // e.g. "usage-depth"
  name: string;
  source: string;                         // free-form, e.g. "product-usage", "support-ticket-volume", "exec-engagement"
  weight: number;                         // 0-100; weights normalized at compute time
  direction: "higher-is-better" | "lower-is-better";
  thresholds: { green: number; yellow: number };   // value at/above green = Green; between yellow..green = Yellow; below yellow = Red
  unit?: string;                          // "count/week", "%", "days-since"
  notes?: string;
}
type HealthSignals = HealthSignal[];
```
Written by: `onboard-me` (initial set) + `compute-health` via
progressive capture when a referenced source lacks a signal. Consumed
by: `compute-health`, `flag-at-risk`, `analyze-renewal-risk`.

### `config/expansion-signals.json`
```ts
interface ExpansionSignal {
  id: string;                             // e.g. "seat-cap-hit"
  name: string;
  description: string;
  dataSource?: string;                    // where to look (product-usage, CRM notes)
  threshold?: string;                     // free-form trigger rule
}
type ExpansionSignals = ExpansionSignal[];
```
Written by: `onboard-me` (defaults if user doesn't specify) + user
curation over time. Consumed by: `spot-expansion`.

### `config/qbr-template.md`
Markdown. The section skeleton the user's QBR packs follow — e.g.
`## Business update`, `## Metrics vs. last quarter`, `## Wins`,
`## Challenges`, `## Asks of us`, `## Roadmap alignment`,
`## Stakeholders`.

Written by: `onboard-me`. Consumed by: `prep-qbr`.

### `config/voice.md`
Markdown. Samples of the user's writing style for customer
correspondence. Used by `draft-touchpoint` and any other drafting skill.

Written by: `onboard-me`. Updated by: `draft-touchpoint` via progressive
capture when missing.

---

## Domain data — what the agent produces

### `accounts.json` (index)
```ts
interface AccountIndex extends BaseRecord {
  slug: string;                          // kebab-case from name, unique
  name: string;
  tier: string;                          // matches a tier id in accounts-focus.json
  owner?: string;                        // CSM of record
  arr?: number;
  renewalAt?: string;                    // ISO-8601
  csm?: string;
  status: "active" | "at-risk" | "churned" | "on-hold";
  healthScore: "green" | "yellow" | "red" | "unknown";
  lastReviewedAt?: string;               // when compute-health last touched
  nextQbrAt?: string;                    // ISO-8601
  tags: string[];
}
type Accounts = AccountIndex[];
```
Written by: `compute-health` (upserts by slug; updates health + review
timestamp), `prep-qbr` (updates `nextQbrAt`), `handoff-to-ae` (does NOT
modify index — writes to expansion pipeline). Initial rows: seeded by
`onboard-me` from `config/accounts-focus.json` focus list OR pulled via
`composio search <crm>` on first run.

### `accounts/{slug}/account.json`
```ts
interface AccountDetail extends BaseRecord {
  slug: string;
  name: string;
  domain?: string;
  tier: string;
  arr?: number;
  renewalAt?: string;
  stakeholders: {
    name: string;
    role?: string;
    email?: string;
    relationship: "champion" | "economic-buyer" | "user" | "influencer" | "blocker" | "unknown";
    lastEngagedAt?: string;
    notes?: string;
  }[];
  firmographics?: { industry?: string; size?: string; region?: string };
  contract?: { startedAt?: string; termMonths?: number; autoRenew?: boolean };
  notes: string;
}
```
Written by: `compute-health` (creates on first sight), `draft-touchpoint`
(appends stakeholder engagement), `prep-qbr` (updates stakeholders).

### `accounts/{slug}/health.json`
```ts
interface HealthBreakdown {
  signalId: string;
  value: number;
  status: "green" | "yellow" | "red";
  note?: string;                          // e.g. "down 40% vs 28d avg"
}

interface HealthRecord extends BaseRecord {
  accountSlug: string;
  computedAt: string;                     // ISO-8601
  score: "green" | "yellow" | "red";
  weightedScore: number;                  // 0-100
  trend: "up" | "flat" | "down" | "unknown";
  breakdown: HealthBreakdown[];
  notes: string;
}
```
Written by: `compute-health`.

### `accounts/{slug}/qbr-pack.md`
Markdown. The upcoming (or most recent) QBR pack assembled per
`config/qbr-template.md`. Overwritten each time `prep-qbr` runs for
this account.

Written by: `prep-qbr`.

### `accounts/{slug}/expansion-ideas.md`
Markdown. Log of spotted expansion opportunities with dates, signal
trigger, proposed motion, qualification status. Appended by
`spot-expansion`.

### `accounts/{slug}/touchpoints.md`
Markdown. Chronological log of customer touches (check-ins, QBRs,
renewal reminders, milestone congrats, executive outreach). Appended
by `draft-touchpoint` when a draft is approved and recorded as sent.

### `accounts/{slug}/renewal-risk.md`
Markdown. Risk analysis for an upcoming renewal — risk factors,
proposed plays, timeline. Overwritten by `analyze-renewal-risk`.

### `at-risk.json` (index)
```ts
interface AtRiskIndex extends BaseRecord {
  accountSlug: string;
  accountName: string;
  severity: "sev1" | "sev2" | "sev3";   // sev1 = board-material, sev2 = meaningful, sev3 = watch
  arr?: number;
  cause: string;                          // one-line summary
  trigger: string;                        // which signal fired
  proposedPlay: string;                   // one-line
  status: "open" | "in-progress" | "resolved" | "churned";
  openedAt: string;                       // ISO-8601
  resolvedAt?: string;
}
type AtRisk = AtRiskIndex[];
```
Written by: `flag-at-risk`. Updated by: `compute-health` (auto-resolve
when health returns to Green for N consecutive computes),
`draft-touchpoint` (marks `in-progress` once an outreach draft exists).

### `renewals.json` (index)
```ts
interface RenewalIndex extends BaseRecord {
  accountSlug: string;
  accountName: string;
  renewalAt: string;                     // ISO-8601
  arr?: number;
  confidence: "high" | "medium" | "low" | "unknown";
  risks: string[];                        // one-liners; detail in accounts/{slug}/renewal-risk.md
  plays: string[];                        // proposed actions
  status: "upcoming" | "in-motion" | "renewed" | "churned";
  lastAnalyzedAt?: string;
}
type Renewals = RenewalIndex[];
```
Written by: `analyze-renewal-risk`. Updated by: `draft-touchpoint`
(pushes into `in-motion` once reminder goes out).

### `expansion-pipeline.json` (index)
```ts
interface ExpansionIdea extends BaseRecord {
  accountSlug: string;
  accountName: string;
  title: string;                          // e.g. "Add design seats"
  signal: string;                         // e.g. "seat cap hit 3 weeks"
  stage: "idea" | "qualified" | "handed-off" | "won" | "lost";
  estimatedArrUplift?: number;
  stakeholder?: string;                   // champion email/name
  aeOwner?: string;                       // once handed off
  handoffSentAt?: string;
  notes?: string;
}
type ExpansionPipeline = ExpansionIdea[];
```
Written by: `spot-expansion` (creates ideas in `idea` stage, qualifies
in `qualified` stage when user confirms). Updated by: `handoff-to-ae`
(sets `stage: "handed-off"`, `aeOwner`, `handoffSentAt`).

### `voc-themes.md`
Rolling markdown log of customer-voice themes aggregated across
touchpoints and (if a Support Rep agent is installed) shared customer
signals. Overwritten each time `summarize-voc` runs.

### `daily-brief.md`
Morning rundown — overwritten each time `daily-standup` runs.

---

## Cross-agent reads

None in the default skill set. If a user installs the Customer Support
Rep agent alongside, `summarize-voc` CAN opportunistically check for a
sibling agent's surfaced themes file — but the skill must handle
absence gracefully and never fail if the sibling isn't present. This
keeps the CSM standalone-installable.
