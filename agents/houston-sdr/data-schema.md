# SDR — Data Schema

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
written by `onboard-me` or by progressive capture inside other skills
(e.g. `draft-outreach` asks for voice samples if missing).

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

### `config/icp.json`
```ts
interface Icp {
  industry: string[];
  companySizeRange: string;            // e.g. "50-500", "Series A-C"
  titleTargets: string[];              // e.g. ["VP Engineering", "CTO"]
  triggerSignals: string[];            // e.g. ["recent Series B", "hiring platform eng"]
  disqualifiers: string[];             // e.g. ["sub-10 headcount", "consulting firms"]
  notes: string;
}
```
Written by: `onboard-me`. Consumed by: `research-lead`, `design-sequence`,
`daily-standup`.

### `config/product.json`
```ts
interface Product {
  productName: string;
  oneLinePitch: string;
  keyDifferentiators: string[];
  pricingModel: "per-seat" | "flat" | "usage" | "other";
  priceRange: string;                  // free-form — e.g. "$20-80k ACV"
  notes: string;
}
```
Written by: `onboard-me`. Consumed by: `draft-outreach`,
`respond-to-objection`.

### `config/voice.md`
Markdown. 2–3 sample emails the user has actually sent. Used as a
style reference for every outbound draft.

Written by: `onboard-me`. Updated by: `draft-outreach` via progressive
capture when missing.

### `config/objection-playbook.md`
Markdown. Headings by objection type (price, timing, incumbent,
need-to-check-with-team, not-sure-of-problem) with the user's approved
response patterns underneath.

Written by: user over time (the agent proposes entries via
`respond-to-objection`; the user approves before append). Consumed by:
`respond-to-objection`.

### `config/sequences-library.json`
```ts
interface SequenceTemplate {
  id: string;
  name: string;
  audience: string;                    // ICP slice description
  channelMix: ("email" | "linkedin" | "call")[];
  stepCount: number;
  notes: string;
}
type SequencesLibrary = SequenceTemplate[];
```
Written by: `design-sequence` when the user asks to save a cadence as
reusable. Consumed by: `design-sequence` (suggests existing templates
before proposing new ones).

---

## Domain data — what the agent produces

### `leads.json` (index)
```ts
interface LeadIndex extends BaseRecord {
  slug: string;                        // kebab-case from name+company, unique
  name: string;
  title?: string;
  company: string;
  companyDomain?: string;
  email?: string;
  linkedinUrl?: string;
  source: "cold-list" | "inbound" | "referral" | "resurrected" | "other";
  status:
    | "new"
    | "researched"
    | "sequenced"
    | "replied"
    | "meeting-booked"
    | "handed-off"
    | "not-interested"
    | "unsubscribed"
    | "dead";
  priority: "P1" | "P2" | "P3";
  sequenceId?: string;
  lastTouchedAt?: string;
  nextActionAt?: string;
  tags: string[];
}
type Leads = LeadIndex[];
```
Written by: `research-lead` (creates), `draft-outreach` (updates
`lastTouchedAt`, `status: sequenced`), `classify-reply` (updates status
on reply), `book-meeting`, `handoff-to-ae`, `recover-stalled-thread`.

### `leads/{slug}/lead.json`
```ts
interface LeadDetail extends BaseRecord {
  slug: string;
  name: string;
  title?: string;
  company: string;
  companyDomain?: string;
  email?: string;
  linkedinUrl?: string;
  firmographics?: {
    industry?: string;
    size?: string;
    funding?: string;
    hq?: string;
    techStack?: string[];
  };
  roleContext?: {
    tenureMonths?: number;
    priorCompanies?: string[];
    responsibilities?: string[];
  };
  painHypotheses: string[];            // 2-3 ranked
  icpFit: "GREEN" | "YELLOW" | "RED";
  sources: { label: string; url: string; fetchedAt: string }[];
  notes: string;
}
```
Written by: `research-lead`.

### `leads/{slug}/dossier.md`
Human-readable dossier of the lead. Written by: `research-lead`.

### `leads/{slug}/outreach-draft.md`
Current outbound draft (markdown: `## Subject`, `## Body`, `## Channel`,
`## Personalization used`). Overwritten each time.

Written by: `draft-outreach`, `respond-to-objection`,
`recover-stalled-thread`, `book-meeting`.

### `leads/{slug}/thread.json`
```ts
interface ThreadMessage {
  id: string;
  direction: "outbound" | "inbound";
  channel: "email" | "linkedin" | "call";
  sentAt: string;                      // ISO-8601
  subject?: string;
  body: string;
  externalId?: string;
  status?: "draft" | "sent" | "delivered" | "opened" | "replied";
}

interface Thread {
  leadSlug: string;
  messages: ThreadMessage[];
}
```
Written by: `draft-outreach` (staged outbound rows), `classify-reply`
(inbound messages).

### `leads/{slug}/handoff.md`
AE handoff pack. Written by: `handoff-to-ae`.

### `sequences.json` (index)
```ts
interface SequenceIndex extends BaseRecord {
  name: string;
  audience: string;                    // ICP slice description
  stepCount: number;
  channelMix: ("email" | "linkedin" | "call")[];
  status: "active" | "paused" | "archived";
  leadCount: number;
}
type Sequences = SequenceIndex[];
```
Written by: `design-sequence`.

### `sequences/{id}/sequence.json`
```ts
interface SequenceStep {
  dayOffset: number;                   // days from enrollment
  channel: "email" | "linkedin" | "call";
  intent: "open" | "pattern-break" | "value-add" | "breakup";
  templateSnippet: string;             // not final copy — draft-outreach writes that
  conditions?: string;                 // e.g. "only if no reply by day 2"
}

interface SequenceDefinition extends BaseRecord {
  sequenceId: string;
  name: string;
  audience: string;
  steps: SequenceStep[];
}
```
Written by: `design-sequence`.

### `replies.json` (index)
```ts
interface ReplyIndex extends BaseRecord {
  leadSlug: string;
  channel: "email" | "linkedin";
  classification:
    | "interested"
    | "not-now"
    | "not-interested"
    | "out-of-office"
    | "unsubscribe"
    | "referral"
    | "wrong-person"
    | "auto-reply"
    | "unclassified";
  intentConfidence: number;            // 0-100
  needsAction: boolean;
  extractedData?: {
    returnDate?: string;               // OOO — ISO-8601
    referralName?: string;
    referralEmail?: string;
    objectionType?: string;
  };
  handledAt?: string;
}
type Replies = ReplyIndex[];
```
Written by: `classify-reply`. Updated by: `respond-to-objection`,
`book-meeting` (sets `handledAt`).

### `meetings.json` (index)
```ts
interface MeetingIndex extends BaseRecord {
  leadSlug: string;
  scheduledAt: string;                 // ISO-8601
  durationMinutes: number;
  channel: "video" | "phone" | "in-person";
  aeOwner?: string;                    // email or name
  status:
    | "scheduled"
    | "confirmed"
    | "held"
    | "no-show"
    | "rescheduled"
    | "cancelled";
  handoffSent: boolean;
}
type Meetings = MeetingIndex[];
```
Written by: `book-meeting`. Updated by: `handoff-to-ae`
(`handoffSent: true`).

### `daily-brief.md`
Morning rundown — overwritten each time `daily-standup` runs.

Written by: `daily-standup`.
