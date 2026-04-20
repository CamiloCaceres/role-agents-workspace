# EA — Data Schema

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
(e.g. `plan-travel` asks for travel prefs if missing).

### `config/profile.json`
```ts
interface Profile {
  userName: string;
  email?: string;
  role?: string;
  company?: string;
  timezone: string;          // IANA, e.g. "America/Los_Angeles"
  onboardedAt: string;       // ISO-8601
  status: "onboarded" | "partial";
}
```
Written by: `onboard-me` (initial). Updated by: any skill that captures
a missing field (progressive capture).

### `config/schedule-preferences.json`
```ts
interface ScheduleWindow {
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  start: string;             // "09:00" (24h local time)
  end: string;               // "17:00"
}

interface FocusBlock extends ScheduleWindow {
  label?: string;            // e.g. "deep work", "no meetings"
}

interface BlackoutPeriod {
  startAt: string;           // ISO-8601
  endAt: string;             // ISO-8601
  reason?: string;
}

interface SchedulePreferences {
  timezone: string;
  workingHours: ScheduleWindow[];
  focusBlocks: FocusBlock[];
  blackoutPeriods: BlackoutPeriod[];
  maxMeetingsPerDay: number;
  minBufferMinutes: number;   // default 15
}
```
Written by: `onboard-me` (initial), `review-calendar` (progressive
capture when the user adjusts a preference).

### `config/vips.json`
```ts
interface Vip extends BaseRecord {
  name: string;
  email?: string;
  relationship: "investor" | "co-founder" | "board" | "customer" | "family" | "advisor" | "other";
  priorityFloor: "P1" | "P2";  // floor — triage may upgrade, never downgrade
  notes?: string;
}
type Vips = Vip[];
```
Written by: `onboard-me` (initial), `triage-inbox` (progressive capture
when an unknown sender is flagged as probably-VIP and the user
confirms).

### `config/voice.md`
Markdown. 3 sample emails the user has actually sent (one short accept,
one decline-with-reason, one delay/bump). Used as a style reference for
every outbound draft.

Written by: `onboard-me` (initial). Updated by: `draft-email-response`
via progressive capture when the user nudges tone ("more casual", "more
direct") — a new sample is appended.

### `config/response-templates.md`
Markdown. Headings by response type (accept, decline, delay, intro,
thank-you) with the user's approved response patterns underneath.

Written by: user over time (the agent proposes entries via
`draft-email-response`; the user approves before append). Consumed by:
`draft-email-response`.

### `config/travel-prefs.json`
```ts
interface TravelPrefs {
  airline?: string;
  seat?: "aisle" | "window" | "middle";
  loyalty?: { airline?: string; hotel?: string };
  hotelChain?: string;
  dietaryNeeds?: string;
  accessibility?: string;
  notes?: string;
}
```
Written by: `plan-travel` via progressive capture on first trip.

### `config/expense-categories.json`
```ts
interface ExpenseCategory {
  id: string;
  name: string;                 // e.g. "Travel — flights", "Software — SaaS"
  rules: {
    matchVendor?: string;       // case-insensitive substring
    matchKeyword?: string;      // case-insensitive substring in memo/description
  }[];
}
type ExpenseCategories = ExpenseCategory[];
```
Written by: `log-expense` via progressive capture (first time it sees a
new vendor or when categories are missing).

---

## Domain data — what the agent produces

### `inbox-queue.json` (index)
```ts
interface InboxItem extends BaseRecord {
  threadId: string;              // external provider id
  from: string;                  // email address
  fromName?: string;
  subject: string;
  snippet?: string;
  receivedAt: string;            // ISO-8601
  classification:
    | "VIP"
    | "action-required"
    | "FYI"
    | "noise"
    | "schedule-meeting"
    | "gatekeep-request"
    | "unclassified";
  classificationConfidence: number;   // 0-100
  sensitiveParty?: "investor" | "co-founder" | "spouse" | "lawyer" | "board" | null;
  status: "pending" | "needs-review" | "drafted" | "done" | "dismissed";
  draftStatus?: "none" | "pending" | "awaiting-send" | "sent" | "dismissed";
  draftedAt?: string;
  notes?: string;
}
type InboxQueue = InboxItem[];
```
Written by: `triage-inbox` (creates + classifies), `draft-email-response`
(updates `draftStatus`, `draftedAt`), `daily-standup` (read-only).

### `meetings-today.json` (projection of today's calendar)
```ts
interface MeetingProjection extends BaseRecord {
  externalEventId: string;
  title: string;
  startAt: string;               // ISO-8601
  endAt: string;                 // ISO-8601
  channel?: "video" | "phone" | "in-person";
  location?: string;
  attendees: { name?: string; email?: string; status?: "accepted" | "tentative" | "declined" | "unknown" }[];
  prepReady: boolean;
  prepPath?: string;             // e.g. "meetings/2026-04-20/prep.md"
  isVip: boolean;
  conflictIds?: string[];        // ids in calendar-conflicts.json if any
}
type MeetingsToday = MeetingProjection[];
```
Written by: `review-calendar` (full refresh), `daily-standup` (refresh),
`prep-meeting` (updates `prepReady` + `prepPath`).

### `calendar-conflicts.json` (index)
```ts
interface CalendarConflict extends BaseRecord {
  type: "overbook" | "missing-buffer" | "focus-block-clash" | "vip-unprotected" | "no-prep";
  startAt: string;
  endAt: string;
  relatedEventIds: string[];
  description: string;
  status: "open" | "acknowledged" | "resolved";
}
type CalendarConflicts = CalendarConflict[];
```
Written by: `review-calendar`.

### `meetings/{date}/prep.md`
One-page meeting brief. Sections: `## Meeting`, `## Attendees`,
`## Context`, `## Prior threads`, `## Suggested agenda`, `## Desired
outcome`. Date format `YYYY-MM-DD`. Overwritten each time
`prep-meeting` runs for that event.

Written by: `prep-meeting`.

### `drafts/{threadId}/draft.md`
Current outbound reply draft for a thread. Sections: `## Thread`,
`## Recipient`, `## Subject`, `## Body`, `## Template used`,
`## Voice match`, `## Sensitivity flag`. Overwritten each time.

Written by: `draft-email-response`.

### `scheduling/{threadId}/proposal.md`
Active scheduling negotiation. Sections: `## Counterparty`,
`## Proposed times` (3 options with timezones), `## Constraints
honored` (focus blocks, max-per-day, etc.), `## Draft message`,
`## Status` (draft | sent | counter-proposed | confirmed).

Written by: `schedule-meeting`. Overwritten on each iteration.

### `followups.json` (index)
```ts
interface Followup extends BaseRecord {
  threadId?: string;               // source thread
  promiseTo: string;               // name of person promised
  promiseToEmail?: string;
  company?: string;
  description: string;             // e.g. "Send deck draft"
  summary?: string;
  promisedAt: string;              // ISO-8601 — when the promise was made
  dueAt: string;                   // ISO-8601 — when I should act
  status: "open" | "snoozed" | "done" | "cancelled";
  lastRemindedAt?: string;
  completionDraftPath?: string;    // drafts/{threadId}/draft.md if applicable
}
type Followups = Followup[];
```
Written by: `track-followup` (creates). Updated by: `handle-followup`
(status flips, lastRemindedAt), `daily-standup` (read-only).

### `travel/{trip-id}/trip.md`
Top-level trip summary. Sections: `## Trip`, `## Dates`,
`## Destinations`, `## Purpose`, `## Key meetings`, `## Open
questions`.

Written by: `plan-travel`.

### `travel/{trip-id}/itinerary.md`
Booked legs + search criteria for unbooked legs. Sections:
`## Flights`, `## Hotels`, `## Ground`, `## Search criteria (pending
booking)`.

Written by: `plan-travel`.

### `travel/{trip-id}/packing.md`
Checklist adapted to destination weather, trip type, and
`config/travel-prefs.json`.

Written by: `plan-travel`.

### `expenses.json` (index)
```ts
interface Expense extends BaseRecord {
  vendor: string;
  amount: number;                  // in minor units (cents)
  currency: string;                // ISO-4217, e.g. "USD"
  chargedAt: string;               // ISO-8601 date
  categoryId?: string;             // FK to config/expense-categories.json
  categoryName?: string;
  tripId?: string;                 // FK to travel/{trip-id}/ if associated
  memo?: string;
  source: "receipt-forward" | "manual" | "finance-integration";
  sourceRef?: string;              // external id if available
  status: "captured" | "reconciled" | "disputed";
}
type Expenses = Expense[];
```
Written by: `log-expense` (creates + categorizes).

### `priority-list.md`
Morning priority list — overwritten each time `daily-standup` runs.
Shorter than `daily-brief.md`; ranks the top ~8 actions across inbox,
follow-ups, meetings, drafts.

Written by: `daily-standup`.

### `daily-brief.md`
Full morning rundown — overwritten each time `daily-standup` runs.

Written by: `daily-standup`.
