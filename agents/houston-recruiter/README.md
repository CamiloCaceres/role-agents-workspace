# houston-recruiter

Your AI Recruiter. Sources candidates with proof-of-work signals, scores
openness-to-move, drafts outreach in your voice, runs structured
screens, coordinates interviews, and prepares handoff packs for hiring
managers. Never extends offers or rejects without your approval.

## Who this is for

Founders doing their own hiring, and the first Talent hire at a small
company. You connect your stack via Composio (any inbox, any sourcing
provider, calendar, ATS — whatever you use); the Recruiter adapts.

## Install

In Houston: **Add from GitHub** → paste this repo URL.

## First prompts

- `Onboard me` — 3-question setup (open roles, comp philosophy, voice
  samples).
- `Source candidates for {role}` — ranked candidates with proof of
  work and openness-to-move scores. Never contacts anyone.
- `Daily standup` — ranked brief: interviews today, replies to handle,
  under-pipelined reqs, stalled candidates, shortlist flags.

## Skills

- **`onboard-me`** — 3-question setup (open roles, comp philosophy,
  voice samples).
- **`define-role`** — turn a JD into a scorecard (must-haves,
  nice-to-haves, dealbreakers, target comp, hiring manager, target
  start date).
- **`source-candidates`** — ranked candidates matched against the
  scorecard, with proof-of-work artifacts and openness-to-move scoring.
- **`screen-candidate`** — pre-screen question set tied to the
  scorecard; post-screen, convert notes into ratings with evidence
  quotes.
- **`draft-candidate-outreach`** — first-touch in your voice that
  references a specific piece of their work. Never sends.
- **`classify-candidate-reply`** — classify inbound reply
  (interested / scheduling / needs-info / not-now / not-interested /
  referral / wrong-role) and route next action.
- **`schedule-interview`** — coordinate candidate + interviewer
  availability via your connected calendar, draft a prep packet, and
  create the interview record. Approval gate before invites.
- **`handoff-to-hiring-manager`** — pre-interview pack: resume
  highlights, proof-of-work summary, openness score, screening notes,
  suggested deep-dive questions, risks.
- **`draft-rejection`** — warm, specific, brand-preserving rejection.
  Never sends; never rejects without your explicit approval.
- **`draft-offer-letter`** — offer letter draft (base / equity /
  bonus) grounded on your leveling config + role scorecard. Flags for
  legal review. Never sends; never extends without approval.
- **`daily-standup`** — morning rundown ranked by leverage.

## License

MIT.
