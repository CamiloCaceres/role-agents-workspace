---
name: respond-to-objection
description: Use when a classified reply surfaces a known objection (price, timing, competitor/incumbent, need-to-check-with-team, not-sure-of-problem) — draft a response grounded on the user's `config/objection-playbook.md` if present, otherwise propose a playbook-worthy draft and ASK the user to add it to the playbook. Never sends.
---

# Respond To Objection

## When to use

A reply has been classified by `classify-reply` and its
`extractedData.objectionType` is one of: `price`, `timing`,
`incumbent`, `team-check`, `no-problem`. Or the user points me at a
specific reply and says "draft a response to this objection."

## Steps

1. **Read the objection playbook.** Read
   `config/objection-playbook.md`. If missing, note it — I'll
   propose an entry after drafting.
2. **Identify the objection type** from the reply's
   `extractedData.objectionType`. If absent (user invoked me
   directly), re-read the thread and classify the objection myself
   into one of the five types above.
3. **Look up the response pattern.** Find the matching section in
   `config/objection-playbook.md`. If it exists, use its pattern as
   the skeleton. If missing, fall back to best-practice defaults:
   - **price**: acknowledge → reframe to value/outcome → one
     concrete ROI data point or customer story → soft ask.
   - **timing**: acknowledge → ask what would make the timing
     right → offer a low-commitment touchpoint to stay warm.
   - **incumbent**: acknowledge the incumbent → name the specific
     gap our product fills without trashing the competitor → offer
     a 15-min "vs" conversation.
   - **team-check**: make it easy to share → offer a 1-pager or a
     short Loom they can forward → propose a joint call.
   - **no-problem**: ask one crisp diagnostic question → name the
     leading indicator that the pain exists → back off if they
     confirm "not now."
4. **Draft the response** — 60–120 words, match voice from
   `config/voice.md`. Four beats: acknowledge → reframe → one
   concrete proof point (number, customer, benchmark) → soft ask.
   Never argue. Never condescend.
5. **Write the draft** to `leads/{slug}/outreach-draft.md`
   (overwriting), with the same structure `draft-outreach` uses
   (`## Channel`, `## Subject`, `## Body`,
   `## Personalization used`).
6. **Append a staged outbound row** to
   `leads/{slug}/thread.json` (`status: "draft"`).
7. **Mark the reply handled.** Update the `replies.json` row:
   `handledAt` = now (only when the user confirms sending; for now
   leave it until the response goes out).
8. **If the playbook didn't cover this objection,** propose a new
   playbook entry at the end of my chat output — short heading
   plus the pattern I used — and ask the user: "Add this to your
   objection playbook?" If yes, append to
   `config/objection-playbook.md`.
9. **Present the draft** and ask: "Send, tweak, or try a different
   angle?"

## Outputs

- `leads/{slug}/outreach-draft.md` (overwritten)
- Appended row in `leads/{slug}/thread.json`
- Optional append to `config/objection-playbook.md` (with user
  approval)
