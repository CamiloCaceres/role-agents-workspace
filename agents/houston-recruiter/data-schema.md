# Recruiter — Data Schema

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
written by `onboard-me` or by progressive capture inside other skills
(e.g. `draft-candidate-outreach` asks for voice samples if missing).

### `config/profile.json`
```ts
interface Profile {
  userName: string;
  company: string;
  team?: string;
  onboardedAt: string;     // ISO-8601
  status: "onboarded" | "partial";
}
```
Written by: `onboard-me`. Updated by: any skill that captures a missing
field (progressive capture).

### `config/leveling.json`
```ts
interface LevelingBand {
  level: string;                       // e.g. "IC3", "L5", "Staff"
  base: string;                        // range or midpoint, free-form
  bonus?: string;
  equityRange?: string;                // e.g. "0.10-0.25%"
}

interface Leveling {
  framework: string;                   // e.g. "Radford", "internal", "Levels.fyi tier 3"
  bands: LevelingBand[];
  equityRange: string;                 // company-wide philosophy
  principles: string[];                // "top-of-market cash, mid equity", etc.
}
```
Written by: `onboard-me`. Updated by: `define-role` (progressive
capture of a new band), `draft-offer-letter` (progressive capture
when a role's level doesn't map).

### `config/voice.md`
Markdown. 2 recent outreach samples + 1 rejection sample the user has
actually sent. Reference for every draft I produce.

Written by: `onboard-me`. Updated by: `draft-candidate-outreach`,
`draft-rejection` via progressive capture when missing.

### `config/rejection-templates.md` (optional)
Markdown. User-approved rejection patterns per scenario
(scorecard-miss, level-mismatch, timing, fit-concerns, late-stage).

Written by: the user over time (the agent proposes entries via
`draft-rejection`; the user approves before append). Consumed by:
`draft-rejection`.

---

## Domain data — what the agent produces

### `roles.json` (index)
```ts
interface RoleIndex extends BaseRecord {
  slug: string;                        // kebab-case(title), unique
  title: string;
  level?: string;
  location?: string;
  remote?: "remote" | "hybrid" | "onsite";
  hiringManagerEmail?: string;
  targetStartDate?: string;            // ISO-8601 or rough marker
  status: "open" | "on-hold" | "filled" | "cancelled";
}
type Roles = RoleIndex[];
```
Written by: `onboard-me` (stub), `define-role` (full row).

### `roles/{slug}/brief.md`
Human-readable role brief (JD). Written by: `onboard-me` (stub) and
`define-role`.

### `roles/{slug}/scorecard.json`
```ts
interface ScorecardItem {
  label: string;
  rubric: string;                      // one-line operational definition
}

interface Scorecard extends BaseRecord {
  slug: string;
  title: string;
  level: string;
  mustHaves: ScorecardItem[];
  niceToHaves: ScorecardItem[];
  dealbreakers: string[];
  targetComp: { base: string; equity?: string; bonus?: string };
  hiringManager: { name: string; email: string };
  targetStartDate: string;
  location: string;
  remote: "remote" | "hybrid" | "onsite";
}
```
Written by: `define-role`. Consumed by: `source-candidates`,
`screen-candidate`, `draft-candidate-outreach`,
`handoff-to-hiring-manager`, `draft-offer-letter`.

### `candidates.json` (index)
```ts
interface CandidateIndex extends BaseRecord {
  slug: string;                        // kebab-case(name + currentCompany)
  name: string;
  role: string;                        // denormalized role title for fast rendering
  roleId: string;
  source: "sourced" | "inbound" | "referral" | "resurrected" | "other";
  status:
    | "new"
    | "outreach-drafted"
    | "replied"
    | "needs-info"
    | "not-now"
    | "not-interested"
    | "wrong-role"
    | "rejection-drafted"
    | "offer-drafted"
    | "hired";
  stage: "sourced" | "screened" | "interview" | "offer" | "hired" | "passed";
  fit: number;                         // 0-100 scorecard fit
  lastTouchedAt?: string;
  nextActionAt?: string;
  tags: string[];
  // Optional progressive fields:
  screenVerdict?: "advance" | "hold" | "pass";
  hiringManagerPackSentAt?: string;
  outstandingQuestion?: string;
}
type Candidates = CandidateIndex[];
```
Written by: `source-candidates` (creates), `draft-candidate-outreach`
(status), `classify-candidate-reply`, `screen-candidate`,
`schedule-interview`, `handoff-to-hiring-manager`, `draft-rejection`,
`draft-offer-letter`, `daily-standup`.

### `candidates/{slug}/candidate.json`
```ts
interface WorkHistoryEntry {
  company: string;
  title: string;
  startedAt?: string;
  endedAt?: string;
  summary?: string;
}

interface CandidateDetail extends BaseRecord {
  slug: string;
  name: string;
  title?: string;
  currentCompany?: string;
  email?: string;
  linkedin?: string;
  resumeUrl?: string;
  workHistory: WorkHistoryEntry[];
  roleId: string;
  source: "sourced" | "inbound" | "referral" | "resurrected" | "other";
  scorecardFit: number;                // 0-100
  opennessScore: number;               // 0-100
  proofOfWork: "rich" | "thin";
  tags: string[];
  notes: string;
}
```
Written by: `source-candidates` (creates). Updated by: any skill that
enriches context (`screen-candidate`, `classify-candidate-reply`,
`schedule-interview`).

### `candidates/{slug}/signals.md`
Human-readable signals file:
`## Proof of work` (bulleted artifacts with URLs),
`## Openness to move` (score + driver),
`## Scorecard notes`.

Written by: `source-candidates`.

### `candidates/{slug}/outreach-draft.md`
Current outbound draft (first-touch, needs-info response, scheduling
reply — whichever is most recent). Overwritten each call.

Written by: `draft-candidate-outreach`, `classify-candidate-reply`
(needs-info response), `schedule-interview` (scheduling reply).

### `candidates/{slug}/thread.json`
```ts
interface ThreadMessage {
  id: string;
  direction: "outbound" | "inbound";
  channel: "email" | "connect-note" | "inmail" | "other";
  sentAt: string | null;
  subject?: string;
  body: string;
  externalId?: string;
  status?: "draft" | "sent" | "delivered" | "replied";
  classification?: string;             // present on inbound rows
}

interface Thread {
  candidateSlug: string;
  messages: ThreadMessage[];
}
```
Written by: `draft-candidate-outreach` (staged outbound),
`classify-candidate-reply` (inbound).

### `candidates/{slug}/screen-notes.md`
Pre-screen question set OR post-screen ratings + evidence quotes +
overall verdict. Overwritten between pre and post.

Written by: `screen-candidate` (both paths).

### `candidates/{slug}/interview-{n}.json`
```ts
interface Interview extends BaseRecord {
  candidateSlug: string;
  roleId: string;
  round: number;
  scheduledAt: string;                 // ISO-8601
  durationMinutes: number;
  channel: "video" | "phone" | "in-person";
  interviewer: string;
  interviewers?: string[];
  status: "scheduled" | "confirmed" | "held" | "no-show" | "cancelled";
  prepPacketPath: string;
  externalCalendarEventId?: string;
}
```
Written by: `schedule-interview`.

### `candidates/{slug}/interview-{n}-prep.md`
Candidate-facing prep packet (company overview, process map,
interviewer bios, suggested prep). Written by: `schedule-interview`.

### `candidates/{slug}/hiring-manager-pack.md`
Pre-interview pack for the hiring manager (snapshot, resume highlights,
proof of work, screen takeaways, risks, deep-dive questions, open
candidate questions).

Written by: `handoff-to-hiring-manager`.

### `candidates/{slug}/rejection-draft.md`
Warm, specific rejection draft with scenario tag, subject, body, and
the specific reference used for warmth.

Written by: `draft-rejection`.

### `candidates/{slug}/offer-draft.md`
Offer letter draft: meta (legal-review flag, band used, rationale) +
letter body (compensation, role scope, next steps, questions).

Written by: `draft-offer-letter`.

### `pipelines.json` (index)
```ts
interface PipelineEntry extends BaseRecord {
  roleId: string;
  counts: {
    sourced: number;
    screened: number;
    interview: number;
    offer: number;
  };
  lastTouchedAt?: string;
}
type Pipelines = PipelineEntry[];
```
Written by: `source-candidates`, `screen-candidate`,
`schedule-interview`, `draft-offer-letter`, `daily-standup`.

### `interviews.json` (index)
```ts
interface InterviewIndex extends BaseRecord {
  candidateSlug: string;
  roleId: string;
  round: number;
  scheduledAt: string;
  durationMinutes: number;
  channel: "video" | "phone" | "in-person";
  interviewer: string;
  status: "scheduled" | "confirmed" | "held" | "no-show" | "cancelled";
}
type Interviews = InterviewIndex[];
```
Written by: `schedule-interview`. Updated by: `handoff-to-hiring-manager`
(when the manager is added).

### `offers.json` (index)
```ts
interface OfferIndex extends BaseRecord {
  candidateSlug: string;
  roleId: string;
  level: string;
  base: string;
  equity: string;
  bonus?: string;
  signOn?: string;
  status: "drafted" | "legal-review" | "sent" | "accepted" | "declined" | "withdrawn";
  legalReviewRequired: boolean;
}
type Offers = OfferIndex[];
```
Written by: `draft-offer-letter`. Updated by the user via chat when the
offer moves through legal / sent / accepted.

### `at-risk.json`
```ts
interface AtRiskEntry {
  slug: string;
  name: string;
  role: string;
  roleId: string;
  stage: string;
  lastTouchedAt: string;
  daysSinceTouch: number;
}
type AtRisk = AtRiskEntry[];
```
Written by: `daily-standup` (recomputed each morning).

### `daily-brief.md`
Morning rundown — overwritten each time `daily-standup` runs.

Written by: `daily-standup`.
