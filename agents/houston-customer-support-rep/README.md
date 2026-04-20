# houston-customer-support-rep

Your AI Customer Support Rep. Triages inbound, drafts replies in your
voice, remembers customers, tracks promises and SLAs, flags bugs and
feature requests for engineering, and turns resolved tickets into KB
drafts. Never sends without your approval.

## Who this is for

Founders, founding engineers, and small teams (1–5 people) running
their own support queue. You handle `support@` alongside your main
job and context-switch into it 8–15 times a day. You don't want a
help-desk product — you want a rep that does the invisible work so
you stay in the loop without drowning. You connect your stack via
Composio (any inbox, Stripe, Linear/GitHub, Slack — whatever you use);
the rep adapts.

## Install

In Houston: **Add from GitHub** → paste this repo URL.

## First prompts

- `Onboard me` — 3-question setup so I can start drafting in your voice.
- `Pull unread from my connected inbox and triage` — triage whatever
  has landed since you last checked.
- `Morning brief` — ranked "start here" list for your first 10 minutes.
- `Draft a reply for conversation <id>` — pulls the dossier, matches
  your voice, never sends.
- `Who is <customer>?` — one-page dossier with profile, history, open
  bugs, outstanding promises.

## Skills

- **`onboard-me`** — 3-question setup: product one-liner, tone, voice
  samples.
- **`triage-incoming`** — category (bug / how-to / feature / billing /
  account / security), priority (P1–P4 from MRR + content), SLA clock
  set, customer resolved or created.
- **`customer-dossier`** — aggregates profile, history, open bugs, open
  promises, churn signals into a one-page view.
- **`draft-reply`** — first-draft reply in your voice, grounded on the
  dossier. Writes a draft; never sends.
- **`promise-tracker`** — extracts time-bound commitments from your
  approved drafts and files them with due dates.
- **`sla-watchdog`** — ranks open conversations by response-time risk;
  flips `sla.breached` when a deadline passes.
- **`detect-bug-report`** — extracts repro + severity from messages
  containing defect signals; pattern-detects across recent tickets.
- **`capture-feature-request`** — records feature asks with customer
  attribution; dedupes; optionally syncs to Linear/GitHub via Composio.
- **`draft-article-from-ticket`** — turns a resolved, reusable ticket
  answer into a DRAFT KB article for your review.
- **`morning-briefing`** — ranked rundown: breaching SLAs, overnight
  arrivals, follow-ups due today, open churn flags.

## License

MIT.
