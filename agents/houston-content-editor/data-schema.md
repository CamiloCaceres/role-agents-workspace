# Content Editor — Data Schema

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
  team?: string;
  role?: string;
  onboardedAt: string;     // ISO-8601
  status: "onboarded" | "partial";
}
```
Written by: `onboard-me`. Updated by: any skill that captures a
missing field via progressive capture.

### `config/content-pillars.json`
```ts
interface ContentPillar {
  id: string;                 // UUID v4
  slug: string;               // kebab-case, unique
  name: string;               // e.g. "AI for small-business tax"
  description: string;        // one paragraph
  targetAudience: string;     // one-liner: who reads this pillar
  primaryBuyerStage: "awareness" | "consideration" | "decision" | "implementation" | "retention";
  percentOfCalendar?: number; // e.g. 40 (% of pieces this pillar gets)
}
type ContentPillars = ContentPillar[];
```
Written by: `onboard-me` (from Q1) and `plan-calendar` (progressive
capture if missing or thin). Consumed by: `plan-calendar`,
`create-seo-brief`, `edit-draft`, `analyze-performance`.

### `config/brand-voice.md`
Markdown. Captures voice via **Voice Attribute Spectrums** plus 2-5
verbatim samples. Template the agent writes:

```markdown
# Brand voice (captured {onboardedAt})

## Voice attribute spectrums

| Spectrum | Our position (1-10) | We sound like | We do NOT sound like |
|---|---|---|---|
| Formality (1=casual, 10=formal) | {n} | {phrase} | {phrase} |
| Authority (1=peer, 10=expert) | {n} | ... | ... |
| Emotion (1=neutral, 10=expressive) | {n} | ... | ... |
| Complexity (1=simple, 10=technical) | {n} | ... | ... |
| Energy (1=measured, 10=energetic) | {n} | ... | ... |
| Humor (1=serious, 10=playful) | {n} | ... | ... |
| Innovation (1=traditional, 10=cutting-edge) | {n} | ... | ... |

## Banned phrases
- "delve"
- "landscape"
- "in today's fast-paced world"
- "unlock"
- "navigate"
- {add as user corrects edits}

## Verbatim samples
---
{full sample 1 — publication + date + URL + body}
---
{full sample 2}
---
```
Written by: `onboard-me`. Updated by: `edit-draft` (appends to banned
phrases when the user rejects a suggestion), `repurpose-content`
(adds sample voice when user approves derivative).

### `config/cadence.json`
```ts
interface Cadence {
  channels: ("blog" | "newsletter" | "linkedin" | "twitter" | "youtube" | "podcast" | "instagram" | "tiktok" | "substack" | "other")[];
  weeklySchedule: { day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"; channel: string }[];
  lookAheadWeeks?: number;         // default 6
  seasonalAnchors?: string[];      // e.g. ["Q1 planning", "Tax season", "Launch events"]
}
```
Written by: `onboard-me` (from Q2). Consumed by: `plan-calendar`,
`prepare-publish`, `daily-standup`.

### `config/seo-keywords.json`
```ts
interface KeywordCluster {
  id: string;
  theme: string;                   // e.g. "tax software for freelancers"
  primary: string;                 // head term
  related: string[];               // long-tail + semantic neighbors
  buyerStage: "awareness" | "consideration" | "decision";
  pillarSlug: string;              // maps to content-pillars
  lastRefreshedAt: string;
}
type SeoKeywords = KeywordCluster[];
```
Written by: `create-seo-brief` (progressive capture). Consumed by:
`plan-calendar`, `create-seo-brief`, `refresh-stale`.

### `config/publishing-checklist.md`
Markdown. The user-editable publishing gate. The agent writes a
default template on first use of `prepare-publish` and the user
tailors it. Sections:

```markdown
# Publishing checklist

## SEO gates (required)
- [ ] Title tag 50-60 chars, primary keyword in first 30
- [ ] Meta description 140-160 chars with CTA
- [ ] URL slug short, keyword-forward, kebab-case
- [ ] Canonical set
- [ ] OG image + OG title + OG description
- [ ] Internal links to at least 3 related pieces (from published.json)
- [ ] External links to sources (2+ authoritative)
- [ ] Alt text on every image
- [ ] Schema markup (Article / FAQPage / HowTo) validated

## Compliance (always checked)
- [ ] No unsubstantiated superlatives ("best," "#1," "only")
  without citation
- [ ] Required disclaimers present (affiliate, sponsored, medical,
  financial, legal — whichever apply)
- [ ] Comparative claims cite the source comparison
- [ ] No copyrighted images/quotes without attribution
- [ ] No unverified customer quotes

## Brand gates
- [ ] Voice spectrums honored (see config/brand-voice.md)
- [ ] Banned phrases removed
- [ ] CTA matches audience and buyer stage
```
Written by: `prepare-publish` (first run creates template).

---

## Domain data — what the agent produces

### `calendar.json` (index)
```ts
interface CalendarItem extends BaseRecord {
  slug: string;                    // kebab-case, unique
  title: string;
  pillarSlug: string;
  channel: string;                 // "blog" | "newsletter" | ...
  buyerStage: "awareness" | "consideration" | "decision" | "implementation" | "retention";
  status: "idea" | "briefed" | "drafting" | "editing" | "scheduled" | "published" | "archived";
  plannedDate?: string;            // ISO-8601
  keyword?: string;                // primary target keyword
  tags: string[];
  score?: number;                  // 4-factor prioritization 0-100
}
type Calendar = CalendarItem[];
```
Written by: `plan-calendar` (creates/upserts), `create-seo-brief`
(updates `status` to `briefed`), `edit-draft` (updates to `editing`),
`prepare-publish` (updates to `scheduled`).

### `drafts.json` (index)
```ts
interface DraftIndex extends BaseRecord {
  slug: string;
  title: string;
  pillarSlug: string;
  channel: string;
  status: "briefed" | "drafting" | "edited" | "ready-for-publish" | "revising";
  wordCount?: number;
  lastEditedAt?: string;
  sweepsCompleted?: number;        // 0-7, from edit-draft
  panelScore?: number;             // optional expert-panel avg, 0-10
}
type Drafts = DraftIndex[];
```
Written by: `create-seo-brief` (row created when brief exists),
`edit-draft` (updates sweep count + score), `prepare-publish`
(flips to `ready-for-publish`).

### `drafts/{slug}/brief.md`
The SEO + editorial brief for a piece. Structure:

```markdown
# Brief — {title}

## Intent
- Pillar: {pillar name}
- Buyer stage: {awareness | consideration | decision | ...}
- Type: {searchable | shareable | both}
- Channel: {blog | newsletter | ...}

## Keyword
- Primary: {head term}
- Related: {long-tail 1}, {long-tail 2}, ...
- Opportunity score: {0-100} (volume × relevance ÷ difficulty)

## SERP snapshot (top 10)
| Rank | URL | Format | Word count | Angle | Gap we can own |
|---|---|---|---|---|---|

## AI-citation audit
- Queries checked: {5-10 representative}
- Currently cited sources: {list}
- Gap for us: {where citation is missable}
- Structural cues to add: {definition blocks / comparison tables / FAQs}

## Recommended outline
- H1: {title option}
- H2: ...
- H3: ...

## Proof plan
- Required: {stats, customer quotes, demos}
- Sourced: {files or URLs already gathered}
- To source: {asks on the user}

## Quick wins (this week)
- {small addition / internal link / schema swap}

## Strategic investments (this quarter)
- {bigger work — expansion, repackaging, cluster build-out}
```
Written by: `create-seo-brief`.

### `drafts/{slug}/draft.md`
The user's (or a collaborator's) actual draft. The agent does NOT
write this from scratch — it reads it and edits it. The file must
exist before `edit-draft` runs.

Provided by: user (import / paste / connected CMS fetch).

### `drafts/{slug}/edit-pass.md`
Output of `edit-draft`. Per-sweep markup + tallies.

```markdown
# Edit pass — {title}

## Sweep scores (0-10)
| Sweep | Score | Notes |
|---|---|---|
| 1. Clarity | {n} | ... |
| 2. Voice & tone | {n} | ... |
| 3. So what | {n} | ... |
| 4. Prove it | {n} | ... |
| 5. Specificity | {n} | ... |
| 6. Heightened emotion | {n} | ... |
| 7. Zero risk | {n} | ... |

## Sweep 1 — Clarity
{line-by-line edits with reasoning}

...

## Expert panel (optional)
| Persona | Score | Top friction |
|---|---|---|
| Target reader | {n} | ... |
| Conversion copywriter | {n} | ... |
| Subject-matter skeptic | {n} | ... |

## Overused-AI-phrase flags
- Line {n}: "{phrase}" → suggested: "{replacement}"

## Claims needing citation
- "{claim}" — source: {TBD / found / missing}

## Sources preserved
- {URL or file path used in the draft — carried forward}
```
Written by: `edit-draft`.

### `drafts/{slug}/headlines.md`
5-7 headline options per channel with hook type + angle.

```markdown
# Headlines — {slug}

## Blog
1. {headline} — hook: {curiosity|story|value|contrarian} · angle: {pain|outcome|social-proof|...}
2. ...

## Newsletter subject lines
1. ...

## LinkedIn
1. ...

## Twitter/X
1. ...
```
Written by: `write-headline-variants`.

### `drafts/{slug}/publish-check.md`
Output of `prepare-publish`. Pass/fail across every checklist item
plus compliance flags.

```markdown
# Publish check — {title}

**Verdict:** {ready | blocked}
**Ready rate:** {passed / total}

## SEO gates
- [x] Title tag 50-60 chars — "{actual}"
- [ ] Meta description — MISSING
- ...

## Compliance flags
- Unsubstantiated superlatives: {list line numbers}
- Missing disclaimers: {type}
- Comparative claims needing source: {list}
- Copyright risks: {image / quote attribution gaps}

## Brand gates
- Banned phrases: {count, line numbers}
- Voice spectrum alignment: {pass | drift on {spectrum}}

## Blockers (must fix)
- ...

## Nice-to-haves (recommended)
- ...
```
Written by: `prepare-publish`.

### `published.json` (index)
```ts
interface PublishedItem extends BaseRecord {
  slug: string;
  title: string;
  pillarSlug: string;
  channel: string;
  publishedAt: string;             // ISO-8601
  url?: string;                    // live URL once known
  keyword?: string;
  lastPerformanceCheckAt?: string; // ISO-8601
  lastRefreshedAt?: string;        // ISO-8601
  status: "live" | "refreshing" | "retired";
  tags: string[];
}
type Published = PublishedItem[];
```
Written by: `prepare-publish` (promotion on user confirmation),
`analyze-performance` (updates lastPerformanceCheckAt), `refresh-stale`
(updates lastRefreshedAt + flips status).

### `published/{slug}/performance.md`
Narrative performance snapshot. Overwritten per analyze-performance
run.

```markdown
# Performance — {title}

**Published:** {date} · **Window:** {last 30d / last 90d}
**Primary channel:** {channel} · **Primary keyword:** {keyword}

## Numbers
| Metric | This window | Prior window | Change | Status |
|---|---|---|---|---|
| Sessions | ... | ... | ... | On track |
| Conversions | ... | ... | ... | ... |
| Rank (primary kw) | ... | ... | ... | ... |
| AI citations seen | ... | ... | ... | ... |

## What worked
- ...

## What underperformed
- ...

## Actions
### Quick wins (this week)
- ...
### Strategic (this quarter)
- ...
```
Written by: `analyze-performance`.

### `published/{slug}/repurposed.md`
Derivatives extracted from the piece via Content Atoms.

```markdown
# Repurposed — {title}

## Atoms extracted
1. Quotable moment — "{line}" (source: para N)
2. Story arc — {summary}
3. Tactical tip — {one-liner + context}
4. Contrarian take — {claim}
5. Data callout — {stat + source}
6. BTS — {behind-the-scenes anecdote}

## LinkedIn long-form
{150-300 word draft from atoms 1-3}

## Twitter/X thread
1/ {hook from atom 1 or 4}
2/ ...

## Newsletter feature
{300-500 words for the newsletter channel from atoms 2-3 + 5}

## Short-video script (30-60s)
- Hook: {atom 1 or 4}
- Body: {atom 3}
- CTA: {link back or subscribe}
```
Written by: `repurpose-content`.

### `repurposing-queue.json`
```ts
interface RepurposeQueueItem extends BaseRecord {
  publishedSlug: string;
  publishedTitle: string;
  derivativesPlanned: ("thread" | "newsletter" | "video-script" | "carousel" | "other")[];
  derivativesDone: ("thread" | "newsletter" | "video-script" | "carousel" | "other")[];
  status: "queued" | "drafted" | "scheduled" | "published" | "skipped";
  dueBy?: string;                  // ISO-8601 target distribution date
}
type RepurposeQueue = RepurposeQueueItem[];
```
Written by: `prepare-publish` (seeds default derivatives on first
publish), `repurpose-content` (updates done list + status).

### `refresh-queue.json`
```ts
interface RefreshCandidate extends BaseRecord {
  publishedSlug: string;
  publishedTitle: string;
  trigger: "age" | "ranking-decay" | "stale-stats" | "competitor-updated" | "ai-visibility-loss" | "manual";
  priority: "high" | "medium" | "low";
  decision?: "refresh" | "rewrite" | "archive";
  proposedScope?: string;          // one-paragraph
  status: "queued" | "scoped" | "in-progress" | "done" | "archived";
}
type RefreshQueue = RefreshCandidate[];
```
Written by: `analyze-performance` (adds candidates), `refresh-stale`
(scopes + flips status).

### `keyword-tracker.json`
```ts
interface KeywordSnapshot extends BaseRecord {
  keyword: string;
  url: string;                     // the piece targeting this keyword
  capturedAt: string;              // ISO-8601
  rank?: number;
  volume?: number;
  difficulty?: number;
  aiCitationsSeen?: number;        // 0-N in the last audit
  source: string;                  // "composio:{tool-slug}" or "manual"
}
type KeywordTracker = KeywordSnapshot[];
```
Written by: `create-seo-brief` (baseline), `analyze-performance`
(snapshots), `refresh-stale` (post-refresh re-snapshot).

### `daily-brief.md`
Morning rundown — overwritten each time `daily-standup` runs.

Written by: `daily-standup`.
