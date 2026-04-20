# Customer Support Rep — Data Schema

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
(e.g. `draft-reply` asks for voice samples if missing).

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

### `config/product.json`
```ts
interface Product {
  productName: string;
  oneLinePitch: string;
  supportedChannels: string[];    // free-form: ["gmail", "intercom", etc.]
  knownBoundaries: string[];      // things the rep should never promise
  notes: string;
}
```
Written by: `onboard-me`. Consumed by: `draft-reply`,
`capture-feature-request`, `draft-article-from-ticket`.

### `config/voice.md`
Markdown. 2 sample replies the founder has actually sent to customers.
Used as a style reference for every drafted reply.

Written by: `onboard-me`. Updated by: `draft-reply` via progressive
capture when missing.

### `config/sla-policy.json`
```ts
interface SlaPolicy {
  firstReplyHours: { P1: number; P2: number; P3: number; P4: number };
  nextUpdateHours: { P1: number; P2: number; P3: number; P4: number };
  vipMrrCents: number;            // customers >= this MRR auto-floor P2
  vipFloorPriority: "P1" | "P2";
}
```
Defaults: firstReply { P1: 1, P2: 4, P3: 24, P4: 72 }, nextUpdate
{ P1: 4, P2: 24, P3: 72, P4: 168 }, vipMrrCents 50000 (≥ $500/mo),
vipFloorPriority "P2". Written by: `onboard-me` (seeds defaults on
first run) or updated when the user changes policy in chat.
Consumed by: `triage-incoming`, `sla-watchdog`.

---

## Domain data — what the agent produces

### `conversations.json` (index)
```ts
interface ConversationIndex extends BaseRecord {
  customerSlug: string;           // foreign key into customers.json
  subject: string;
  channel: "email" | "intercom" | "front" | "helpscout" | "zendesk" | "slack" | "other";
  status: "open" | "waiting_customer" | "waiting_founder" | "resolved" | "snoozed";
  priority: "P1" | "P2" | "P3" | "P4";
  category: "bug" | "how-to" | "feature" | "billing" | "account" | "security" | "other";
  vip: boolean;
  lastTouchedAt: string;
  sla: {
    firstReplyDueAt?: string;
    nextUpdateDueAt?: string;
    breached: boolean;
  };
  tags: string[];
}
type Conversations = ConversationIndex[];
```
Written by: `triage-incoming` (create/update), `draft-reply` (status,
lastTouchedAt), `sla-watchdog` (flips `sla.breached`).

### `conversations/{id}/thread.json`
```ts
interface ThreadMessage {
  id: string;
  from: "customer" | "founder" | "agent_draft";
  author: string;
  sentAt: string;
  bodyText: string;
  bodyHtml?: string;
  externalId?: string;
}

interface ThreadFile {
  conversationId: string;
  messages: ThreadMessage[];
}
```
Written by: `triage-incoming` (creates/appends), Composio-driven fetchers.

### `conversations/{id}/draft.md`
Plain markdown. Current reply draft awaiting founder approval.
Overwritten each time a new draft is generated.

Written by: `draft-reply`.

### `conversations/{id}/notes.md`
Plain markdown. Internal context, commitments, dossier snippets.

Written by: `draft-reply` (dossier snippet), `promise-tracker`
(commitments).

---

### `customers.json` (index)
```ts
interface CustomerIndex extends BaseRecord {
  slug: string;                   // kebab-case slug (also the folder name)
  email: string;
  name: string;
  company?: string;
  plan?: string;
  mrr?: number;                   // in USD cents
  tags: string[];                 // e.g. ["vip", "design-partner", "trial"]
}
type Customers = CustomerIndex[];
```
Written by: `triage-incoming` (on first contact from new email),
`customer-dossier` (on refresh).

### `customers/{slug}/profile.json`
```ts
interface CustomerProfile extends BaseRecord {
  slug: string;
  email: string;
  name: string;
  company?: string;
  plan?: string;
  mrr?: number;
  signupAt?: string;
  lifetimeValue?: number;         // USD cents
  notes: string;
  linkedAccounts: {
    stripeCustomerId?: string;
    intercomUserId?: string;
    [key: string]: string | undefined;
  };
  tags: string[];
}
```
Written by: `customer-dossier`.

### `customers/{slug}/history.json`
```ts
interface CustomerHistoryEvent {
  id: string;
  at: string;
  kind: "conversation" | "plan_change" | "payment" | "bug_reported" | "feature_requested" | "note";
  summary: string;
  conversationId?: string;
  refId?: string;
}

interface CustomerHistory {
  slug: string;
  events: CustomerHistoryEvent[];
}
```
Written by: `triage-incoming`, `customer-dossier`, `detect-bug-report`,
`capture-feature-request`.

---

### `followups.json`
```ts
interface Followup extends BaseRecord {
  conversationId: string;
  customerSlug: string;
  promise: string;                // verbatim commitment text
  dueAt: string;                  // ISO-8601 UTC
  status: "open" | "done" | "cancelled";
  completedAt?: string;
}
type Followups = Followup[];
```
Written by: `promise-tracker`.

### `bug-candidates.json`
```ts
interface BugCandidate extends BaseRecord {
  conversationId: string;
  customerSlug: string;
  summary: string;                // one-sentence description
  repro: string[];                // ordered steps
  severity: "critical" | "high" | "medium" | "low";
  affectedCustomerSlugs: string[];
  status: "new" | "investigating" | "filed" | "dismissed";
  externalTrackerId?: string;     // set when you file to Linear/GitHub via Composio
}
type BugCandidates = BugCandidate[];
```
Written by: `detect-bug-report`.

### `feature-requests.json`
```ts
interface FeatureRequest extends BaseRecord {
  title: string;
  summary: string;
  requestingCustomerSlugs: string[];  // attributed
  roadmapStatus: "requested" | "planned" | "shipped" | "declined";
  linearId?: string;
  githubIssueUrl?: string;
  relatedConversationIds: string[];
}
type FeatureRequests = FeatureRequest[];
```
Written by: `capture-feature-request`.

### `articles.json` (index)
```ts
interface ArticleIndexEntry extends BaseRecord {
  slug: string;                   // kebab-case, also the folder name
  title: string;
  type: "how-to" | "troubleshooting" | "faq" | "known-issue" | "reference";
  status: "draft" | "published" | "archived";
  version: number;
  sourceTicketIds: string[];
}
type Articles = ArticleIndexEntry[];
```
Written by: `draft-article-from-ticket`.

### `articles/{slug}/article.md`
The article body. Plain markdown.

Written by: `draft-article-from-ticket`.

### `articles/{slug}/meta.json`
```ts
interface ArticleMeta {
  slug: string;
  status: "draft" | "published" | "archived";
  version: number;
  sourceTicketIds: string[];
  lastVerifiedAt?: string;
  needsReview: boolean;
}
```
Written by: `draft-article-from-ticket`.

### `morning-brief.md`
Plain markdown. Overwritten each morning. Ranked "start here" list.

Written by: `morning-briefing`.
