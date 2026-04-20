# PMM — Data Schema

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
written by `onboard-me`, `define-positioning`, or by progressive capture
inside other skills (e.g. `draft-launch-brief` asks for launch cadence
if missing).

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
field via progressive capture.

### `config/positioning.json`
```ts
interface Positioning {
  icp: string;                          // who we serve, in one line
  category: string;                     // the frame of reference
  competitiveAlternatives: string[];    // what they'd use if we didn't exist (incl. status quo)
  uniqueAttributes: string[];           // what only we have
  valueThemes: { theme: string; proof: string }[];  // the customer-outcome themes + proof
  bestForMarket: string;                // the market segment we're obviously best for
  elevatorPitch: string;                // one paragraph max
  notCategory?: string;                 // what we are NOT, to sharpen the frame
  lastReviewedAt: string;               // ISO-8601
}
```
Written by: `onboard-me` (partial, from Q2-Q3) and `define-positioning`
(full). Consumed by: `draft-launch-brief`, `create-battlecard`,
`write-sales-one-pager`, `draft-launch-content`, `test-messaging`,
`analyze-win-loss`.

### `config/competitors.json`
```ts
interface Competitor {
  id: string;
  slug: string;                         // kebab-case, unique
  name: string;
  url?: string;
  segment?: string;                     // e.g. "enterprise", "SMB", "technical"
  theirPosition: string;
  ourCounter: string;
  knownWeaknesses: string[];
  lastReviewedAt: string;
}
type Competitors = Competitor[];
```
Written by: `onboard-me` (skeletal entries from Q2), `create-battlecard`
(full), `monitor-competitor` (updates).

### `config/voice.md`
Markdown. 2-3 samples — elevator pitch, recent launch post, blog or
newsletter — used as a style reference for every drafting skill.

Written by: `onboard-me`. Updated by: `draft-launch-content`,
`write-sales-one-pager` via progressive capture when missing.

### `config/launch-cadence.json`
```ts
interface LaunchCadence {
  cadence: "monthly" | "quarterly" | "per-feature" | "ad-hoc";
  gates: string[];                      // approval steps, e.g. ["ceo-sign-off", "legal-review"]
  channels: ("email" | "linkedin" | "twitter" | "blog" | "producthunt" | "webinar" | "other")[];
  launchTemplate?: string;              // path to a template in the repo
  notes?: string;
}
```
Written by: `draft-launch-brief` (progressive capture on first run).
Consumed by: `draft-launch-brief`, `draft-launch-content`.

### `config/brand-boundaries.md`
Markdown. Two headings: `## We say` and `## We don't say`. Words,
phrases, and framing we use or avoid. Used by every drafting skill.

Written by: user; proposed-entries come from `test-messaging` and
`draft-launch-content`. Consumed by: every drafting skill.

---

## Domain data — what the agent produces

### `launches.json` (index)
```ts
interface LaunchIndex extends BaseRecord {
  slug: string;                         // kebab-case from name, unique
  name: string;
  audience: string;                     // one-line: who it's for
  status: "idea" | "brief" | "content-drafted" | "launched" | "post-launch" | "archived";
  phase: "internal" | "alpha" | "beta" | "early-access" | "full" | "post";
  launchDate?: string;                  // ISO-8601
  assetsComplete?: number;              // % 0-100
  tags: string[];
}
type Launches = LaunchIndex[];
```
Written by: `draft-launch-brief` (creates / updates brief status),
`write-sales-one-pager`, `draft-launch-content` (updates
`assetsComplete`).

### `launches/{slug}/brief.md`
Full launch brief: target segment, problem, positioning anchor, key
messages, channel plan, asset checklist, success metrics, phase plan.

Written by: `draft-launch-brief`.

### `launches/{slug}/one-pager.md`
Sales-facing one-pager: positioning, use cases, proof points, FAQs,
objection responses. Segment-specific when asked.

Written by: `write-sales-one-pager`.

### `launches/{slug}/email.md`
Announcement email draft — subject options + preview + body.

Written by: `draft-launch-content`.

### `launches/{slug}/social.md`
LinkedIn long-form + Twitter/X thread variants with hook options.

Written by: `draft-launch-content`.

### `launches/{slug}/assets.json`
```ts
interface AssetChecklistItem {
  id: string;
  label: string;                        // e.g. "announcement email", "sales one-pager"
  owner: "pmm" | "designer" | "eng" | "founder" | "external";
  status: "todo" | "drafted" | "approved" | "published";
  path?: string;                        // repo-relative, if the file exists
}
type AssetChecklist = AssetChecklistItem[];
```
Written by: `draft-launch-brief` (creates), `write-sales-one-pager` /
`draft-launch-content` (update status as each asset lands).

### `battlecards.json` (index)
```ts
interface BattlecardIndex extends BaseRecord {
  competitorSlug: string;
  competitorName: string;
  segment?: string;                     // "enterprise", "SMB", etc.
  version: number;
  lastRefreshedAt: string;              // ISO-8601
  stalenessDays: number;                // derived at write
  status: "fresh" | "stale" | "urgent";
}
type Battlecards = BattlecardIndex[];
```
Written by: `create-battlecard` (creates/refreshes). `monitor-competitor`
flips `status` to `stale` / `urgent` when activity invalidates it.

### `battlecards/{competitor-slug}/battlecard.md`
Full battlecard: their positioning, our counter, landmines, objection
responses, when to walk away, approved talk-tracks.

Written by: `create-battlecard`.

### `competitor-activity.json`
```ts
interface CompetitorEvent extends BaseRecord {
  competitorSlug: string;
  type: "product-release" | "pricing-change" | "funding" | "leadership-change" | "content" | "other";
  headline: string;                     // one line
  sourceUrl: string;
  impact: "high" | "medium" | "low";
  downstream: string[];                 // e.g. ["battlecard-refresh", "sales-alert"]
}
type CompetitorActivity = CompetitorEvent[];
```
Written by: `monitor-competitor`.

### `competitors/{slug}/activity-log.md`
Human-readable chronological log per competitor.

Written by: `monitor-competitor`.

### `win-loss.json`
```ts
interface WinLossTheme extends BaseRecord {
  theme: string;                        // e.g. "procurement-review-too-long"
  outcome: "win" | "loss" | "mixed";
  frequencyPct: number;                 // % of deals where theme appeared
  sampleSize: number;
  representativeQuote: string;          // verbatim if available
  quoteSource: string;                  // path or reference
  positioningImplication?: string;
  period: string;                       // e.g. "2026-Q1"
}
type WinLossThemes = WinLossTheme[];
```
Written by: `analyze-win-loss`.

### `win-loss/{period}/analysis.md`
Narrative per-period analysis: what we won, what we lost, themes,
proposed positioning and messaging changes.

Written by: `analyze-win-loss`.

### `messaging-tests.json`
```ts
interface MessagingTest extends BaseRecord {
  hypothesis: string;
  variants: { label: string; message: string; predictedSegment: string }[];
  testDesign: "landing-page" | "email-subject" | "ad" | "sales-pitch" | "other";
  surface: string;                      // e.g. "home hero", "pricing page"
  status: "proposed" | "live" | "analyzing" | "concluded";
  winner?: string;                      // variant label
  notes?: string;
}
type MessagingTests = MessagingTest[];
```
Written by: `test-messaging`.

### `messaging-tests/{id}/plan.md`
Test plan doc: hypothesis, variants in full, test design, segment,
success metric, runtime estimate.

Written by: `test-messaging`.

### `daily-brief.md`
Morning rundown — overwritten each time `daily-standup` runs.

Written by: `daily-standup`.
