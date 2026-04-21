# houston-csm

Your AI Customer Success Manager. Scores account health, preps QBRs,
flags at-risk accounts, spots expansion opportunities, and drafts
check-ins in your voice. Pairs naturally with a Customer Support Rep
(tickets) to cover the full post-sale relationship. Never closes
expansions — hands qualified opportunities to your AE. Never commits
to roadmap.

## Who this is for

Early-stage CS hires, account managers, and founders still owning
post-sale relationships — running a light book (20–50 accounts) where
human attention should go to the save conversations and expansion
calls, not the health spreadsheet and QBR doc scramble. You connect
your stack via Composio (CRM, CS platform, product-usage store,
inbox, calendar); the CSM adapts.

## Install

In Houston: **Add from GitHub** → paste the workspace repo URL.

## First prompts

- `Onboard me` — 3-question setup: accounts focus, health signals,
  QBR template.
- `Compute health for my accounts` — score everyone Green / Yellow /
  Red with signal breakdowns.
- `Prep QBR for {account}` — assemble the pack per your template.
- `What's at risk this week?` — ranked by ARR × severity.
- `Daily standup` — what needs your attention today.

## Skills

- **`onboard-me`** — 3-question setup: top accounts, health signals,
  QBR template. Writes `config/`.
- **`compute-health`** — score each account against your weighted
  signals; Green / Yellow / Red with per-signal breakdown and trend.
- **`flag-at-risk`** — open an at-risk record when a health tier drops
  or a signal crosses threshold; propose a play (exec check-in,
  feature walkthrough, discount save).
- **`prep-qbr`** — assemble the QBR pack per your template: metrics,
  wins, asks, risks, roadmap alignment, stakeholder notes.
- **`spot-expansion`** — surface expansion ideas when usage matches an
  expansion signal (seat caps hit, new team on the platform, champion
  promoted) or on a weekly sweep.
- **`draft-touchpoint`** — write check-ins, QBR follow-ups, renewal
  reminders, milestone congrats. Voice-matched, never sends.
- **`analyze-renewal-risk`** — for renewals inside 90 days, surface
  risk factors (usage trend, champion tenure, exec engagement) and
  propose plays.
- **`summarize-voc`** — aggregate customer feedback themes from
  touchpoints (and tickets, if a Support Rep agent is installed).
- **`handoff-to-ae`** — pack qualified expansion context for the AE:
  account state, rationale, stakeholders, pricing anchor, risks.
- **`daily-standup`** — ranked plan: health changes, QBRs this week,
  renewals in 30 / 60 / 90 days, at-risk escalations, expansion moves.

## License

MIT.
