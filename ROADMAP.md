# Houston Role Agents — Build Roadmap

The next six role agents to build, in recommended order. Each section is a **complete build brief** — a future orchestrator session can hand any of them to a build subagent with minimal editing.

**Canonical references:**
- Structure + conventions + verification: `./role-agent-guide.md`
- Pattern reference: `agents/houston-sdr/` (the first shipped role agent)
- Legacy reference: `../solo-support-workspace/agents/inbox/bundle.js` (bundle pattern)

**Done so far:** `houston-sdr` (shipped). `houston-customer-support-rep` (shipped).

---

## Build principles (re-state)

- One agent = one **job title** a human could hold. LinkedIn test.
- **Standalone-first.** Each agent fully useful when installed alone. No `../sibling/` paths in default skills.
- **Save to** `/Users/milo/dev/taxflow/houston-skills/role-agents-workspace/agents/houston-{slug}/`. All role agents share the `role-agents-workspace` git repo — no per-agent repos. A user can install the full workspace from one GitHub URL; per-agent installs are a later concern.
- **CLAUDE.md is a short pointer** (50-100 lines) — identity + skill index + hard nos. Not a manifesto.
- **`onboard-me` is mandatory** — max 3 questions. The rest of the config fills in via **progressive capture** inside other skills (each skill asks ONE targeted question if its needed config is missing).
- **`config/` is the new directory** — separate from flat top-level domain data.
- **Composio-only external transport.** Skills never hardcode tool names.
- **Dashboard is read-only, 3 sections max**, with `useHoustonEvent` + 5s polling fallback.
- **Reserved tab ids** `dashboard`/`connections`/`settings` silently collide with app shell. Use `overview` or a content-named id.
- **Every SKILL.md description starts with "Use when…"** and names an observable trigger.

---

## Build order & rationale

| # | Role | Why this order |
|---|---|---|
| 1 | **Recruiter** | Mirrors SDR almost 1:1. Validates the "role parallel" template without a new architectural axis. Ships fast. |
| 2 | **Bookkeeper** | Opens a new axis: rules/data-heavy work, not drafting. Stresses categorization + reconciliation loops. Universal founder pain. |
| 3 | **Executive Assistant** | Universal pain. Touches calendar + inbox, which preview patterns any Exec-tier agent will reuse. |
| 4 | **PMM** | Natural teammate to SDR — battlecards feed the SDR's objection skill once "hire a team" arrives. Validates cross-agent data potential. |
| 5 | **Content Editor** | Draft-edit-publish archetype. Voice-matching pattern at full stretch. |
| 6 | **CSM** | Pairs with the Customer Support Rep you're building. Usage-signal analysis is a new pattern (not drafting, not rules — data inference). |

Build sequentially unless two are fully independent. Do not build #4 before #1 — each lesson from the prior agent tightens the template.

---

## Agent 1 — Recruiter

### Identity
- **Slug:** `recruiter`
- **Dir name:** `houston-recruiter`
- **Target path:** `/Users/milo/dev/taxflow/houston-skills/role-agents-workspace/agents/houston-recruiter/`
- **Icon (Lucide):** `UserPlus`
- **Category:** `business`
- **Color (icon.png):** emerald `#10B981`
- **Description:** "Your AI Recruiter. Sources candidates, runs structured screens, drafts outreach and rejection emails in your voice, coordinates interviews, and prepares handoff briefs for hiring managers. Never extends offers without approval; never rejects without approval."

### Persona served
Founder doing their own hiring pre-Series-A / first Talent or People hire / hiring manager supplementing a light recruiting function.

### Scope boundary (critical — prevents role bleed)
- **IS:** sourcing, pipeline management, screening, outreach, scheduling, interview coordination, candidate comms, offer/rejection drafting, handoff packs.
- **IS NOT:** a hiring decision-maker, compensation-policy setter, on-the-job reference-checker (unilaterally), or DEI strategist.

### Monday morning if this works
"Every open req has a live pipeline, every candidate has a clear next step, every rejection is drafted in my voice, interview scheduling doesn't eat 8 emails per slot."

### Hard nos (encode in CLAUDE.md)
- Never extends an offer.
- Never rejects a candidate without explicit approval.
- Never discloses comp range without approval.
- Always flags DEI pipeline signals (e.g. homogeneous shortlist).
- Always preserves candidate PII — no summaries sent to third-party channels.

### Research pointers
- Anthropic plugin reuse: **none directly** (no `knowledge-work-plugins/recruiting` exists as of writing — confirm during research phase).
- SaaS analogues: Gem, Ashby, Greenhouse, Lever, hireEZ, Welcome, Rippling ATS.
- Pain sources: r/recruiting, r/recruitinghell, LinkedIn talent community, HR leaders on Twitter.

### `onboard-me` — modalities preamble + 3 questions

Opens with the standard **modalities preamble** (see `role-agent-guide.md` — paste / file / URL / connected-apps-via-Composio). Then:

1. "Paste the JDs for your currently-open roles, describe them in one line each, *or — best option — point me at your ATS (Greenhouse, Lever, Ashby) via Composio and I'll pull them, OR drop a Notion/Drive link to your roles doc.*"
2. "What's your comp philosophy — leveling framework, bands, equity approach? *Paste, or drop your leveling doc / comp bands spreadsheet / Notion comp page.*"
3. "Paste 2 recent outreach emails and 1 rejection you've sent. *Best option: if you've connected Gmail/Outlook via Composio, tell me — I'll pull 20-30 recent candidate messages for a tighter voice calibration.*"

### Config files (all populated at runtime)
- `config/profile.json` — `{ userName, company, team, onboardedAt, status }`
- `config/roles.json` — array of `{ id, title, level, location, remote, jd, hiringManagerEmail, targetStartDate, status }`
- `config/leveling.json` — `{ framework: "manual" | "levels.fyi" | "radford" | "custom", bands: [{level, baseRange, equityRange}], principles: string }`
- `config/voice.md` — 2 outreach samples + 1 rejection sample
- `config/rejection-templates.md` — library (role-appropriate, brand-preserving)
- `config/screening-rubric.json` — per-role must-haves, nice-to-haves, dealbreakers

### Domain data
- `candidates.json` (index) — `{ id, slug, name, role, roleId, source, status, stage, fit, email, linkedin, lastTouchedAt, nextActionAt, tags }`
- `candidates/{slug}/candidate.json` — full dossier: resume, work history, links, notes
- `candidates/{slug}/thread.json` — message history (outbound/inbound, channel)
- `candidates/{slug}/screening-notes.md` — structured screen notes
- `candidates/{slug}/rejection-draft.md` — in-flight rejection draft
- `candidates/{slug}/offer-draft.md` — offer letter draft when at offer stage
- `candidates/{slug}/hiring-manager-pack.md` — handoff pack
- `pipelines.json` — per-role pipeline view
- `interviews.json` — scheduled + past interviews
- `offers.json` — out-for-signature status
- `daily-brief.md` — morning standup output

### Skills (10)
1. **onboard-me** — 3 questions, writes config.
2. **source-candidates** — Use when the user opens a new req or asks to source for a named role — propose candidate list matching the JD via any Composio-connected sourcing provider; de-dupe against existing `candidates.json`.
3. **screen-candidate** — Use when a candidate has been contacted or sent in a resume — produce structured screening notes against the role's rubric (must-haves, nice-to-haves, risk flags).
4. **draft-candidate-outreach** — Use when the user asks to reach out to a specific candidate — write a warmer-than-SDR personalized outreach grounded on the candidate's background and the role; match voice from `config/voice.md`.
5. **schedule-interview** — Use when a candidate confirms interest and an interview slot is needed — coordinate candidate + interviewer availability via any Composio-connected calendar; send candidate prep materials (company overview, process map, interviewer bios).
6. **classify-candidate-reply** — Use when an inbound reply arrives from a candidate via any Composio-connected inbox — classify as interested / scheduling / needs-info / not-now / not-interested / referral / wrong-role; append to thread; route next action.
7. **draft-rejection** — Use when the user marks a candidate as "reject" — produce a warm, specific, brand-preserving rejection email; never sends.
8. **draft-offer-letter** — Use when a candidate is at the offer stage — produce the offer letter draft from `config/leveling.json` + role context; flag for legal review.
9. **handoff-to-hiring-manager** — Use when a candidate is advancing to hiring-manager interview — assemble a pre-interview pack with resume highlights, screening notes, suggested questions, and risk flags.
10. **daily-standup** — Use when the user opens the app or asks for a morning brief — rank: interviews today, replies to classify, at-risk candidates (gone quiet), open reqs without enough pipeline.

### Dashboard — 3 sections
- **Stats row (4 cards):** Open reqs · Active candidates · Interviews this week · Offers out.
- **Section 2:** **Pipeline by role** — per open req: count at each stage (sourced → screened → interview → offer), stalled-count flag.
- **Section 3 (two-column grid):** Left = upcoming interviews (next 7 days). Right = candidates stalled > 5 days.

### Teammates (C-era composition)
- **People Ops** (onboarding new hires after signed offer)
- **EA** (calendar coordination)
- **Technical Recruiter** (specialization split if ever needed)

---

## Agent 2 — Bookkeeper

### Identity
- **Slug:** `bookkeeper`
- **Dir name:** `houston-bookkeeper`
- **Target path:** `/Users/milo/dev/taxflow/houston-skills/role-agents-workspace/agents/houston-bookkeeper/`
- **Icon (Lucide):** `Calculator`
- **Category:** `business`
- **Color (icon.png):** amber `#F59E0B`
- **Description:** "Your AI Bookkeeper. Categorizes transactions against your chart of accounts, reconciles bank and credit card statements, prepares monthly close checklists, tracks 1099 contractors, flags anomalies, and surfaces cash snapshots. Never files filings, never sends payments, never changes GL structure without approval."

### Persona served
Founder doing their own books pre-finance-hire / fractional Controller / CFO delegate.

### Scope boundary
- **IS:** transaction categorization, reconciliation, monthly close prep, 1099 tracking, expense-policy enforcement, cash-flow snapshots, vendor analysis.
- **IS NOT:** a tax filer, a payment approver, a COA designer, a forecast-maker (that's FP&A), or an auditor.

### Monday morning if this works
"Every transaction is categorized right, reconciliations match, the monthly close runs from a clear checklist, I see cash and burn at a glance, anomalies surface before they compound."

### Hard nos
- Never sends payments or initiates transfers.
- Never files tax forms or regulatory filings.
- Never modifies the chart of accounts without explicit approval.
- Flags anomalies above the materiality threshold; never silently re-categorizes against rules.
- Preserves audit trail — every re-categorization logs the previous state.

### Research pointers
- Anthropic plugin reuse: none exists today; check `knowledge-work-plugins/finance` if added later.
- SaaS analogues: QuickBooks, Xero, Pilot, Bench, Ramp, Mercury.
- Pain sources: r/Accounting, r/Bookkeeping, founder-focused finance newsletters (Runway, Mostly Metrics), Mercury + Ramp blogs.

### `onboard-me` — modalities preamble + 3 questions

Opens with the standard **modalities preamble** (see `role-agent-guide.md`). Then:

1. "What accounting system do you use, and what's your chart of accounts? *Best option: if you've connected QuickBooks / Xero / NetSuite via Composio, tell me — I'll pull the COA directly. Otherwise paste, or drop a COA export (.csv / .xlsx / .pdf).*"
2. "Fiscal year-end, monthly close cadence, and materiality threshold (the dollar amount below which you don't sweat precision). *Paste, or drop your close checklist / accounting policy doc if you have one.*"
3. "Any non-obvious categorization rules? (e.g. 'Amazon is Office Supplies unless keyword says otherwise', 'AWS is COGS not Infra'). *Paste, drop your categorization rules doc, or if you have a spreadsheet of known vendors → default categories, share the link.*"

### Config files
- `config/profile.json`
- `config/coa.json` — chart of accounts (array of `{ code, name, type, parent }`)
- `config/fiscal.json` — `{ yearEnd, closeCadence: "monthly" | "quarterly", materialityCents }`
- `config/categorization-rules.json` — array of `{ id, matchVendor?, matchKeyword?, matchAmountRange?, accountCode, confidence }`
- `config/vendors.json` — known vendors with default category + notes
- `config/expense-policy.md` — what's in/out of policy

### Domain data
- `transactions.json` (recent-index, last 90 days for dashboard speed)
- `transactions/{yyyy-mm}/transactions.json` — monthly full file
- `reconciliations.json` — per-account reconciliation status per period
- `closes.json` — monthly close log with checklist state
- `closes/{yyyy-mm}/checklist.md` — this month's close checklist
- `anomalies.json` — open anomalies flagged for review
- `1099-tracking.json` — contractors + YTD totals + W-9 status
- `cash-snapshot.md` — overwritten each day
- `vendor-summary.md` — optional output

### Skills (10)
1. **onboard-me** — 3 questions, writes config.
2. **categorize-transactions** — Use when new uncategorized transactions land from any Composio-connected accounting system — propose categories using rules + vendor history; flag low-confidence items for review; apply high-confidence only after explicit approval.
3. **reconcile-account** — Use when a bank or credit card statement is imported or the user asks to reconcile — match statement lines to book entries, flag discrepancies, produce a reconciliation worksheet.
4. **close-month** — Use when a month-end approaches or the user asks to "close the books for {month}" — drive a checklist (accruals, prepaids, depreciation, intercompany, bank-rec done), surface gaps, write `closes/{yyyy-mm}/checklist.md`.
5. **flag-anomaly** — Use when transactions exceed materiality threshold, duplicate-payment patterns appear, round-number-suspicious amounts hit, or a new-vendor pattern emerges — open an anomaly record for review.
6. **track-1099-contractors** — Use when a vendor is flagged 1099-eligible or year-end approaches — aggregate YTD, surface W-9 gaps, produce the 1099 readiness roster.
7. **cash-snapshot** — Use when the user asks "where's cash" / "how's burn" / "runway" — compute current cash across accounts, 30-day burn, months runway; write `cash-snapshot.md`.
8. **vendor-summary** — Use when the user asks about spend with a specific vendor or vendor category — aggregate spend YTD, frequency, categorization consistency, flag uncategorized.
9. **expense-policy-check** — Use when expenses are imported — flag out-of-policy items (alcohol above limit, personal travel, unapproved categories).
10. **daily-standup** — Use when the user opens the app — rank: uncategorized count, unreconciled accounts, open anomalies, upcoming close deadline.

### Dashboard
- **Stats row (4 cards):** Uncategorized txns · Unreconciled accounts · Open anomalies · Days to close.
- **Section 2:** **Current month P&L mini** — top 5 income accounts, top 5 expense accounts, net.
- **Section 3 (two-column grid):** Left = uncategorized transactions (top 8). Right = open anomalies.

### Teammates (C-era)
- **Controller** (policy tier-up)
- **FP&A** (forecasting)
- **AR / Collections** (invoicing)

---

## Agent 3 — Executive Assistant

### Identity
- **Slug:** `ea`
- **Dir name:** `houston-ea`
- **Target path:** `/Users/milo/dev/taxflow/houston-skills/role-agents-workspace/agents/houston-ea/`
- **Icon (Lucide):** `CalendarCheck`
- **Category:** `productivity`
- **Color (icon.png):** indigo `#6366F1`
- **Description:** "Your AI Executive Assistant. Triages inbox, guards your calendar, prepares meeting briefs, tracks follow-ups, handles travel prep, and gives you a ranked priority list each morning. Never sends replies or invites without approval; never commits to anything on your behalf."

### Persona served
Founder or exec with no human EA / busy operator wearing multiple hats / small-team founder drowning in calendar and inbox.

### Scope boundary
- **IS:** inbox triage, calendar review, meeting prep briefs, follow-up tracking, travel prep, expense capture, priority lists.
- **IS NOT:** a personal assistant for home life (unless user explicitly wants that), a decision-maker, a substitute for the user in critical comms.

### Monday morning if this works
"My calendar is right-sized (focus blocks respected, buffer where I need it), my inbox is triaged with drafts queued, and I know exactly what's most important today."

### Hard nos
- Never sends calendar invites on the user's behalf without approval.
- Never replies to a message without approval.
- Never shares calendar/email content externally.
- Flags sensitive-party messages (investor, co-founder, spouse, lawyer) for user attention before drafting.

### Research pointers
- Anthropic plugin reuse: Gmail / Google Calendar connectors from the broader plugin ecosystem.
- SaaS analogues: Motion, Clockwise, Reclaim, Superhuman, Clara, xAI.
- Pain sources: r/productivity, Superhuman / Clockwise blogs, every founder Twitter thread about inbox zero.

### `onboard-me` — modalities preamble + 3 questions

Opens with the standard **modalities preamble** (see `role-agent-guide.md`). Then:

1. "Your ideal week structure — focus blocks, meeting days, no-meeting days, working hours, timezone. *Paste, or — best option — if your calendar is connected via Composio, I can scan your last 30 days and infer the patterns; you just correct them.*"
2. "Your top 5-10 VIPs I should never make wait (investors, co-founders, key customers, spouse, direct reports). *Paste names/emails, drop a list file, or point me at a Contacts source you've connected (iCloud/Google Contacts/HubSpot).*"
3. "I need to match your writing voice. *Best option: tell me you've connected Gmail / Outlook and I'll pull 20-30 recent sent messages. Otherwise paste 3 typical emails — a short accept, a decline-with-reason, a delay request.*"

### Config files
- `config/profile.json`
- `config/schedule-preferences.json` — `{ timezone, workingHours, focusBlocks: [{day, start, end}], blackoutPeriods, maxMeetingsPerDay }`
- `config/vips.json` — array of `{ name, email, relationship, priorityFloor }`
- `config/voice.md` — 3 sample emails
- `config/response-templates.md` — accept / decline-with-reason / delay / introduction / thank-you variants
- `config/travel-prefs.json` — airline, seat, loyalty, accessibility notes

### Domain data
- `inbox-queue.json` — triaged items awaiting user action
- `calendar-conflicts.json` — detected scheduling issues (overbooks, no-buffer, missing prep)
- `meetings/{date}/prep.md` — pre-meeting briefs
- `followups.json` — promises the user made; extracted from sent emails
- `priority-list.md` — overwritten daily, top-N today
- `travel/{trip-id}/trip.md` — itinerary + packing checklist + receipts
- `daily-brief.md` — morning standup output

### Skills (10)
1. **onboard-me** — 3 questions.
2. **triage-inbox** — Use when the user asks to triage / when new mail is fetched via any Composio-connected inbox — classify each as VIP / action-required / FYI / noise / auto-reply; produce draft responses for common types; never sends.
3. **draft-email-response** — Use when the user wants a specific reply drafted — produce in user voice; match template if one fits.
4. **review-calendar** — Use when the user asks to look at the week / the day / rebalance — scan the next 7 days, flag overbooks, missing buffer, missing prep, VIP slots that should be protected.
5. **prep-meeting** — Use when a calendar event is within 24 hours and has no prep file yet — assemble a one-page brief: attendees + context + suggested agenda + prior relevant email threads.
6. **schedule-meeting** — Use when the user asks to book something — propose 3 times respecting focus blocks and timezone; handle back-and-forth; add event once confirmed (with approval).
7. **track-followup** — Use when the user sends an outbound promising an action ("I'll send this Tuesday", "circling back next week") — extract the commitment + due date to `followups.json`.
8. **handle-followup** — Use when a tracked follow-up is due — remind user; propose a draft that honors the promise.
9. **plan-travel** — Use when the user mentions a trip / flights to book / an event abroad — assemble itinerary draft, flight-and-hotel search criteria, packing checklist from `travel-prefs.json`.
10. **daily-standup** — Use when the user opens the app — produce priority list: urgent VIPs, today's meetings with prep status, follow-ups due, open drafts, calendar conflicts.

### Dashboard
- **Stats row (4 cards):** Inbox queue · Meetings today · Follow-ups due · VIP touches pending.
- **Section 2:** **Priority queue** — top 10 items ranked (VIP messages > follow-ups due today > today's meetings with no prep > drafts awaiting send).
- **Section 3 (two-column grid):** Left = today's calendar with prep-status chips. Right = follow-ups due this week.

### Teammates (C-era)
- **Chief of Staff** (cross-team status roll-ups)
- **Any agent** (EA is meta — coordinates other agents' meetings and messages)

---

## Agent 4 — PMM (Product Marketing Manager)

### Identity
- **Slug:** `pmm`
- **Dir name:** `houston-pmm`
- **Target path:** `/Users/milo/dev/taxflow/houston-skills/role-agents-workspace/agents/houston-pmm/`
- **Icon (Lucide):** `Megaphone`
- **Category:** `business`
- **Color (icon.png):** violet `#8B5CF6`
- **Description:** "Your AI Product Marketing Manager. Drafts launch briefs, creates battlecards, writes sales one-pagers, analyzes win-loss, tests messaging, and monitors competitors. Arms Sales with fresh positioning. Never publishes externally without approval."

### Persona served
Early-stage founder doing their own marketing / first PMM hire / head of product owning positioning pre-marketing-team.

### Scope boundary
- **IS:** launches, positioning, battlecards, sales enablement, messaging tests, win-loss analysis, competitor monitoring.
- **IS NOT:** content calendar owner (that's Content Editor), paid ads owner (that's Paid Ads), designer, brand strategist from zero.

### Monday morning if this works
"Every launch has a complete brief. Sales has fresh one-pagers per competitor. Win/loss insights feed the next positioning test. Competitor moves don't surprise me."

### Hard nos
- Never publishes competitive content externally without user approval.
- Never invents customer quotes.
- Always cites the source for a competitor claim.
- Flags positioning drift if new messaging contradicts the config.

### Research pointers
- Anthropic plugin reuse: `sales/skills/competitive-intelligence` (battlecard pattern) + `sales/skills/account-research`.
- SaaS analogues: Klue, Crayon, Loopio, Gong, Similarweb.
- Pain sources: Product Marketing Alliance, April Dunford's content, Lenny's Newsletter PMM posts.

### `onboard-me` — modalities preamble + 3 questions

Opens with the standard **modalities preamble** (see `role-agent-guide.md`). Then:

1. "What are you launching next (or recently launched) and who's it for? *Paste a description, drop a PRD / launch plan, or point me at the launch doc in Notion / Drive / Linear.*"
2. "Your top 3 competitors and your differentiated position in one line. *Paste, drop a positioning doc or battlecard, or — best option — give me their website URLs and your website URL; I'll do the initial analysis and you correct it.*"
3. "Your current elevator pitch + one recent launch post. *Paste, drop the pitch deck / launch email, or give me URLs to the product page + the latest blog/launch post.*"

### Config files
- `config/profile.json`
- `config/positioning.json` — `{ icp, problem, category, differentiators: [], elevatorPitch }`
- `config/competitors.json` — array of `{ id, name, url, segment, theirPosition, ourCounter, knownWeaknesses, lastUpdated }`
- `config/voice.md` — tone samples
- `config/launch-cadence.json` — `{ cadence, gates, channels, launchTemplate }`

### Domain data
- `launches.json` (index) — `{ id, slug, name, status, launchDate, audience }`
- `launches/{slug}/brief.md` — full launch brief
- `launches/{slug}/one-pager.md` — sales-facing
- `launches/{slug}/email.md` — announcement email draft
- `launches/{slug}/social.md` — LinkedIn + Twitter variants
- `competitors.json` — same as config but includes activity log
- `competitors/{slug}/battlecard.md` — full battlecard
- `competitors/{slug}/activity-log.md` — recent updates
- `win-loss.json` — extracted themes from deal notes / interviews
- `messaging-tests.json` — live tests and results
- `daily-brief.md`

### Skills (10)
1. **onboard-me** — 3 questions.
2. **draft-launch-brief** — Use when the user names an upcoming or current launch — produce a full brief: target segment, problem, positioning, key messages, channels, assets checklist, success metrics.
3. **create-battlecard** — Use when the user asks "battlecard for {competitor}" or a new competitor is added to `config/competitors.json` — produce an interactive battlecard: their positioning, our counter, landmines, objection responses, when to walk away.
4. **write-sales-one-pager** — Use when a launch reaches sales-enablement stage or the user asks for a one-pager for a specific segment — write a one-page sales doc with positioning, use cases, proof points, FAQs.
5. **draft-launch-email** — Use when a launch date is set — produce the customer-facing announcement email in brand voice.
6. **draft-launch-social** — Use when a launch needs social distribution — produce LinkedIn long-form + Twitter thread variants.
7. **analyze-win-loss** — Use when deal notes or interview transcripts are uploaded / the user says "what did we learn from Q3 losses" — extract themes, quantify frequency, surface actionable positioning changes.
8. **test-messaging** — Use when the user wants to test a new angle — produce 2-3 messaging variants with predicted best-fit segment + recommended test design.
9. **monitor-competitor** — Use when a competitor appears in the news, releases a feature, or adjusts pricing — update `competitors/{slug}/activity-log.md` and flag downstream impacts (battlecard updates, sales alerts).
10. **daily-standup** — Use when the user opens the app — rank launches in flight, battlecards stale > 30 days, competitor moves this week, active messaging tests.

### Dashboard
- **Stats row (4 cards):** Active launches · Battlecards fresh (<30d) · Win-loss insights this qtr · Messaging tests live.
- **Section 2:** **Launch pipeline** — upcoming by date, status chip, asset-checklist completion %.
- **Section 3 (two-column grid):** Left = competitor activity (last 14 days). Right = recent win-loss themes.

### Teammates (C-era)
- **SDR** (consumes battlecards via progressive-capture of `config/objections.json`)
- **AE** (consumes one-pagers)
- **Content Editor** (launch comms distribution)

---

## Agent 5 — Content Editor

### Identity
- **Slug:** `content-editor`
- **Dir name:** `houston-content-editor`
- **Target path:** `/Users/milo/dev/taxflow/houston-skills/role-agents-workspace/agents/houston-content-editor/`
- **Icon (Lucide):** `FileText`
- **Category:** `business`
- **Color (icon.png):** teal `#14B8A6`
- **Description:** "Your AI Content Editor. Plans the calendar, edits drafts to your brand voice, writes SEO briefs, runs the publishing checklist, and repurposes published pieces into derivatives. Never publishes without approval; never plagiarizes."

### Persona served
Founder doing their own content / marketing manager wearing multiple hats / solo content owner at an early-stage startup.

### Scope boundary
- **IS:** calendar planning, draft editing, SEO briefing, publishing prep, repurposing, performance review, stale-content refresh.
- **IS NOT:** writing long-form from zero (needs a brief or rough draft as input), paid distribution, brand strategy design.

### Monday morning if this works
"Calendar is full 6 weeks out. Every draft hits brand voice. Every piece is SEO-optimized. Publish-day is a checklist, not a scramble."

### Hard nos
- Never publishes without approval.
- Never plagiarizes; preserves sources in edited drafts.
- Flags overused AI phrases ("delve", "landscape", "in today's fast-paced world").
- Flags claims that need citations.

### Research pointers
- Anthropic plugin reuse: none directly (check if `knowledge-work-plugins/content` exists).
- SaaS analogues: Grammarly Business, Copy.ai, Jasper, Surfer SEO, Clearscope, Frase, Ahrefs.
- Pain sources: r/SEO, r/content_marketing, Every, Lenny's content posts.

### `onboard-me` — modalities preamble + 3 questions

Opens with the standard **modalities preamble** (see `role-agent-guide.md`). Then:

1. "Content mission in one sentence — who reads it, why, what should they do after? *Paste, or drop your brand / content strategy doc if you have one.*"
2. "Publishing cadence and primary channels (blog, newsletter, LinkedIn, YouTube). *Paste, or if your calendar tool (Notion, Airtable, Trello) is connected via Composio, point me at the board and I'll infer cadence.*"
3. "Two pieces of your published content — your best + a recent one — so I can calibrate brand voice. *Best option: give me the URLs and I'll fetch. Or drop files. Or — if your CMS (WordPress, Ghost, Webflow, Substack) is connected via Composio — tell me and I'll sample 5-10 recent pieces for a richer voice model.*"

### Config files
- `config/profile.json`
- `config/brand-voice.md` — style guide + voice samples + banned phrases
- `config/content-pillars.json` — `[{ id, name, description, target-audience }]`
- `config/seo-keywords.json` — target keywords + clusters
- `config/cadence.json` — weekly publishing schedule
- `config/publishing-checklist.md` — pre-publish requirements

### Domain data
- `calendar.json` (index) — scheduled + draft + idea items
- `drafts.json` (index)
- `drafts/{slug}/draft.md` — current draft
- `drafts/{slug}/edit-pass.md` — editor's markup
- `drafts/{slug}/seo-brief.md` — keyword + SERP + outline
- `published.json`
- `repurposing-queue.json` — pieces awaiting derivative creation
- `keyword-tracker.json` — ranking snapshots
- `daily-brief.md`

### Skills (10)
1. **onboard-me** — 3 questions.
2. **plan-calendar** — Use when the user asks to fill / refresh the content calendar — propose 4-8 weeks of content from pillars + seasonal + SEO gaps; write to `calendar.json`.
3. **create-seo-brief** — Use when a new piece is starting or the user provides a keyword — assemble keyword data, SERP analysis (top 10), outline suggestion, entities to cover.
4. **edit-draft** — Use when a draft exists in `drafts/{slug}/draft.md` and the user asks to edit — apply brand voice, tighten prose, flag weak sections, preserve sources; write to `drafts/{slug}/edit-pass.md`.
5. **write-headline-variants** — Use when a draft is close to final and needs headlines — produce 5-7 headline options per channel with rationale.
6. **prepare-publish** — Use when a piece is approved for publish — run the publishing checklist (meta title/description, OG images, internal links, CTA, canonical); flag missing items.
7. **repurpose-content** — Use when a piece is published — draft 3 derivatives (social thread, newsletter feature, short video script).
8. **analyze-performance** — Use when the user asks "what's working" or on a scheduled cadence — from traffic + engagement data via any Composio-connected analytics provider, surface top and bottom quartile + themes.
9. **refresh-stale** — Use when a piece > 6 months old has ranking decay OR on a manual sweep — propose update scope + new sections.
10. **daily-standup** — Use when the user opens the app — list drafts in progress, pieces ready to publish, repurposing queue, refresh candidates.

### Dashboard
- **Stats row (4 cards):** Calendar weeks filled · Drafts in progress · Published this month · Stale pieces (>6mo).
- **Section 2:** **Content calendar (next 4 weeks)** — grid by week with item cards.
- **Section 3 (two-column grid):** Left = drafts in review. Right = repurposing queue + stale pieces needing refresh.

### Teammates (C-era)
- **PMM** (launch comms)
- **SEO Specialist** (keyword research tier-up)
- **Social Media Manager** (distribution)

---

## Agent 6 — Customer Success Manager (CSM)

### Identity
- **Slug:** `csm`
- **Dir name:** `houston-csm`
- **Target path:** `/Users/milo/dev/taxflow/houston-skills/role-agents-workspace/agents/houston-csm/`
- **Icon (Lucide):** `HeartHandshake`
- **Category:** `business`
- **Color (icon.png):** rose `#F43F5E`
- **Description:** "Your AI Customer Success Manager. Scores account health, preps QBRs, flags at-risk accounts, spots expansion opportunities, and drafts check-ins. Pairs with a Customer Support Rep (tactical tickets) to cover the full relationship. Never closes expansions (hand off to AE); never commits to roadmap."

### Persona served
Early CS hire / account manager / founder still owning post-sale relationships / CSM running a light book of 20-50 accounts.

### Scope boundary
- **IS:** health scoring, QBR prep, renewal readiness, expansion spotting, check-in drafting, voice-of-customer aggregation, handoff to AE on expansion.
- **IS NOT:** ticket-handler (that's the Support Rep), expansion-closer (that's AE), roadmap-setter, implementation/onboarding specialist.

### Monday morning if this works
"Every account has a current health score. Upcoming renewals have QBR packs drafted. Expansion cues surface before I'd notice them. At-risk accounts are on my radar this week, not next quarter."

### Hard nos
- Never commits to roadmap items ("we'll build that in Q3" is forbidden unless user approves).
- Never makes pricing or contract decisions unilaterally.
- Never discloses churn-risk scoring to the customer.
- Always flags high-value at-risk accounts within 24 hours of a signal change.

### Research pointers
- Anthropic plugin reuse: partial patterns from `sales/skills/account-research` for account context.
- SaaS analogues: Gainsight, ChurnZero, Catalyst, Totango, Vitally, Planhat.
- Pain sources: r/CustomerSuccess, Gainsight Pulse content, CS Collective, Lincoln Murphy's writing.

### `onboard-me` — modalities preamble + 3 questions

Opens with the standard **modalities preamble** (see `role-agent-guide.md`). Then:

1. "Your top 10-20 accounts, or segments (enterprise / mid-market / SMB) and which tier you focus on. *Best option: if your CRM (HubSpot / Salesforce) is connected via Composio, tell me — I'll pull the account list tagged by ARR tier. Otherwise paste or drop a CSV.*"
2. "Signals that define healthy vs. at-risk in your world — usage depth, NPS, ticket volume, feature adoption, exec engagement. *Paste, drop your health-score doc, or if you have a dashboard (Gainsight / ChurnZero / a custom Looker board) tell me what metrics live there so I can plan the progressive capture.*"
3. "Your typical QBR structure — sections your best QBR pack contains. *Paste an outline, drop a sample QBR deck, or give me a link to one in Drive/Notion — I'll use it as the template.*"

### Config files
- `config/profile.json`
- `config/accounts-focus.json` — tier definitions + focus list
- `config/health-signals.json` — weighted signals `[{name, source, weight, thresholds}]`
- `config/qbr-template.md` — the section structure for QBRs
- `config/voice.md` — for check-in drafting
- `config/expansion-signals.json` — what suggests expansion (usage caps hit, new team additions, champion promoted)

### Domain data
- `accounts.json` (index) — `{ id, slug, name, tier, owner, arr, renewalAt, csm, status, healthScore, lastReviewedAt }`
- `accounts/{slug}/account.json` — full account detail + stakeholders
- `accounts/{slug}/health.json` — current score + signal breakdown + trend
- `accounts/{slug}/qbr-pack.md` — upcoming QBR doc
- `accounts/{slug}/expansion-ideas.md` — spotted opportunities
- `accounts/{slug}/touchpoints.md` — check-in log
- `renewals.json` — upcoming renewals 90d view
- `at-risk.json` — open at-risk flags with trend
- `expansion-pipeline.json` — ideas → qualified → handed-off-to-AE
- `voc-themes.md` — aggregated voice of customer
- `daily-brief.md`

### Skills (10)
1. **onboard-me** — 3 questions.
2. **compute-health** — Use when usage/support/engagement data is refreshed OR the user asks to recompute — apply `config/health-signals.json` weights, produce a Green/Yellow/Red score per account with signal breakdown, update `accounts/{slug}/health.json`.
3. **flag-at-risk** — Use when a health score drops a tier OR a signal crosses a threshold — open an at-risk record with cause summary, propose a play (exec check-in, feature walkthrough, discount save).
4. **prep-qbr** — Use when a QBR is scheduled within 14 days OR the user asks "prep QBR for {account}" — assemble the pack per `config/qbr-template.md` (metrics, wins, asks, risks, roadmap alignment).
5. **spot-expansion** — Use when usage patterns match an expansion signal (seat cap hit, new team on platform, champion promoted) OR on a weekly sweep — propose expansion idea + supporting data.
6. **draft-touchpoint** — Use when the user needs to reach out (check-in, QBR follow-up, renewal reminder, congratulations on milestone) — write in voice, match the occasion.
7. **analyze-renewal-risk** — Use when renewals are within 90 days — surface per-account risk factors (usage trend, champion tenure, exec engagement) and propose plays.
8. **summarize-voc** — Use when the user asks "what are customers saying about X" OR on a monthly cadence — aggregate feedback themes from touchpoints and support cross-reads (if Support Rep agent is installed), produce `voc-themes.md`.
9. **handoff-to-ae** — Use when an expansion idea is qualified (customer confirmed interest or budget exists) — pack context for the AE: account state, expansion rationale, stakeholders, proposed pricing anchor, risks.
10. **daily-standup** — Use when the user opens the app — rank: health changes, QBRs this week, renewals in next 30/60/90 days, at-risk escalations, expansion pipeline movement.

### Dashboard
- **Stats row (4 cards):** Accounts healthy / warning / at-risk · QBRs this week · Renewals in 90 days · Expansion MTD.
- **Section 2:** **At-risk accounts** — ranked by ARR × severity.
- **Section 3 (two-column grid):** Left = upcoming QBRs (next 4 weeks). Right = expansion pipeline by stage.

### Teammates (C-era)
- **Customer Support Rep** (ticket signals feed into health)
- **AE** (expansion handoffs)
- **Onboarding Specialist** (first-90-days handoff in reverse — Onboarder → CSM)

---

## How to dispatch a build

For any of the above, an orchestrator session follows the role-agent-guide.md phase workflow:

1. **Phase 1 (lock the role)** is already done — the spec above IS the lock.
2. **Phase 2 (research)** — 3 parallel subagents (Anthropic plugin fit check, day-in-the-life, pain + skill candidates). Still useful even with a spec — it surfaces real-world specifics.
3. **Phase 3 (design)** — already captured inline. Adjust after research if needed.
4. **Phase 4 (build)** — dispatch a single build subagent with an inline prompt assembled from the section above + the `houston-sdr` patterns as reference.
5. **Phase 5 (verify)** — the 12-row matrix from `role-agent-guide.md`.
6. **Phase 6 (ship)** — commit to the workspace repo (`role-agents-workspace/`). No per-agent `gh repo create` — the workspace is the install unit.

## Verification reminder

Every agent built must pass:
- JSON manifests parse
- Bundle evals in Node shim and exports the expected component
- `useHoustonEvent` present + `setInterval(reload, 5000)` polling fallback
- No reserved tab ids (`dashboard` / `connections` / `settings`)
- Every SKILL.md description starts with "Use when…"
- `onboard-me` present, body references "3 questions"
- No cross-agent paths (`../sibling/`) in default skills
- No `.houston/<agent>/` data writes
- CLAUDE.md between 50-100 lines (pointer style)
- `agentSeeds` covers every file `bundle.js` reads at mount

## After these 6

The next candidates to plan (not yet specced):
- **AE Assistant** (prep + follow-up + note-taking; full AE is out of scope)
- **SEO Specialist** (audits + keyword research + internal-linking)
- **Paid Ads Manager** (campaign setup + creative rotation + spend monitoring)
- **Controller** (Bookkeeper tier-up: reporting, compliance, AP/AR oversight)
- **Technical Writer** (docs, release notes, API refs)
- **Paralegal** (role-form that supersedes the legal workspace)
- **Sales Engineer** (security questionnaires + RFP drafting — slot natural)
- **Onboarding Specialist** (first-90-days customer onboarding, pairs with CSM)
- **Data Analyst** (SQL + dashboards + ad-hoc insights)
- **Chief of Staff** (cross-team status + OKR tracking)

That's a 20-agent catalog target. Once you have ~10, the "hire a team" composition story starts to write itself.
