---
name: summarize-voc
description: Use when the user asks "what are customers saying" / "voice of customer" / "VOC themes" / "what's the top feedback this month," OR on a monthly cadence — aggregates themes from `accounts/*/touchpoints.md`, categorizes as pain / praise / feature-request / friction, counts mentions, surfaces top-3 per category, writes `voc-themes.md` (overwrites).
---

# Summarize VOC

## When to use

- The user asks a voice-of-customer question: "what are customers
  saying about pricing," "what's the biggest pain right now," "what
  feature do people want most."
- A scheduled monthly sweep (user can say "run VOC weekly" to change
  cadence — no hard-coded interval here, the skill runs on ask).
- After a wave of QBRs or check-ins when the user wants a rollup.

## Steps

1. **Gather touchpoint text.** Read every
   `accounts/{slug}/touchpoints.md` under the agent root. Skip empty
   files. Each dated heading is a touch; the body is the content.
2. **Standalone-first.** Touchpoints are the primary source. If
   the user has separately surfaced support-channel themes into
   this agent's root (e.g. a user-maintained `support-themes.md`
   at this agent's root), fold those in too. Do NOT reach into
   other agents' filesystems — the CSM must be fully useful when
   installed solo; cross-agent composition is a later concern.
3. **Categorize each theme** into one of four buckets:
   - **Pain** — what's actively broken or painful for them
   - **Praise** — what they love; what's unlocking value
   - **Feature requests** — specific asks, named or paraphrased
   - **Friction points** — process, onboarding, UX friction that
     isn't a bug per se
   Each raw item (sentence or paragraph) maps to ONE bucket + a
   theme label (e.g. "SSO missing," "dashboard is slow," "love the
   API"). Don't invent themes — cluster by observed similarity.
4. **Count mentions + note accounts.** For each theme, track a
   mention count and the set of account slugs that surfaced it.
   A theme mentioned once is noted but doesn't make the top-3.
5. **Surface top-3 per category.** Ranked by mention count, then by
   ARR-weighted reach (sum of `accounts.json.arr` across the
   mentioning accounts). Include the account list and a verbatim
   short quote where one exists in the touchpoint text.
6. **Flag board-material signals.** If the SAME theme surfaces in
   the top-3 across multiple months (compare against the current
   `voc-themes.md` if present before overwriting), call it out at
   the top of the file. Recurring is where policy changes.
7. **Write `voc-themes.md`** (overwrite). Structure:
   ```markdown
   # Voice of Customer — {YYYY-MM-DD}

   ## Recurring signals (watch)
   {any theme in top-3 for 2+ consecutive runs}

   ## Pain (top 3)
   - **{theme}** — {N} mentions across {M} accounts
     ({slug-list}). "Verbatim quote if present."

   ## Praise (top 3)
   ...

   ## Feature requests (top 3)
   ...

   ## Friction points (top 3)
   ...

   ## Data footprint
   Touchpoint files scanned: {N}. Support themes file present: {yes/no}.
   ```
8. **Summarize in chat.** One-line: *"VOC refreshed. Top pain:
   {theme} ({N} mentions). Top request: {theme}. Full file:
   `voc-themes.md`."*

## Outputs

- `voc-themes.md` (overwritten each run)
