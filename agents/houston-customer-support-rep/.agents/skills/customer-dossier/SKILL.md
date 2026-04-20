---
name: customer-dossier
description: Use when drafting a reply for a specific customer, or when the user asks "who is this customer" / "tell me about X" — aggregates profile, history, open conversations, open followups, open bug candidates, and open feature requests into a one-page dossier and refreshes `customers/{slug}/profile.json` if Composio data has changed.
---

# Customer Dossier

## When to use

- `draft-reply` calls this before drafting.
- The user asks about a specific customer by name, email, or company.
- After a Composio-sourced profile refresh (e.g. a billing-provider
  plan change) to keep the local profile current.

## Steps

1. **Resolve the customer slug** from whatever the user provided
   (email, name, company). Check `customers.json`. If no match, say
   so — do not invent.
2. **(Optional) Refresh from Composio.** If the user asked to refresh,
   use `composio search` to find billing and CRM lookup slugs for the
   customer's linked accounts. Pull plan, MRR, LTV, signup date.
   Update `customers/{slug}/profile.json` atomically.
3. **Aggregate the dossier in memory:**
   - Profile: name, company, plan, MRR, LTV, signup date, tags, notes.
   - Open conversations: filter `conversations.json` where
     `customerSlug` matches AND `status != "resolved"`.
   - Open followups: filter `followups.json` where `customerSlug`
     matches AND `status == "open"`.
   - Open bug candidates: filter `bug-candidates.json` where
     `customerSlug` matches OR `affectedCustomerSlugs` contains the
     slug AND `status != "dismissed"`.
   - Open feature requests: filter `feature-requests.json` where
     `requestingCustomerSlugs` contains the slug AND `roadmapStatus
     in {"requested","planned"}`.
   - Recent history: last 5 events from `customers/{slug}/history.json`.
4. **Produce the one-page dossier in chat.** Sections in this order:
   header (name / company / plan / MRR / tags), open conversations,
   outstanding promises, open bugs, open feature asks, recent history.

## Outputs

- Returns the dossier to chat
- Optionally refreshes `customers/{slug}/profile.json` and updates
  the corresponding `customers.json` row
