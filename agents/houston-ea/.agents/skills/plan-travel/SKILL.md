---
name: plan-travel
description: Use when the user mentions an upcoming trip / flights to book / an event requiring travel / "I'm going to {city}" — read `config/travel-prefs.json` (ask one question if missing), assemble a trip summary, itinerary draft with flight and hotel search criteria, and a packing checklist. Writes drafts; never books.
---

# Plan Travel

## When to use

The user mentioned a trip, a conference they're attending, a customer
visit requiring flights, or said "plan my travel to X." I produce a
planning pack; any booking happens via a Composio-connected travel
provider ONLY with explicit user approval.

## Steps

1. **Clarify the trip.** Extract: destination(s), dates (or date
   range), purpose (customer / conference / personal / off-site),
   traveling-with (solo / team). If dates are missing and material,
   ask ONE question.
2. **Read travel prefs.** Read `config/travel-prefs.json`. If missing,
   ask the user ONE question: "What are your travel defaults —
   preferred airline, seat (aisle/window), hotel chain, dietary needs,
   accessibility?" Write the answer to `config/travel-prefs.json` and
   continue.
3. **Read schedule.** Read `config/schedule-preferences.json` to
   honor timezone and check for conflicts over the trip window.
4. **Resolve travel connections (optional).** Use `composio search`
   to check for connected travel providers (Navan-like / TripActions-
   like / generic flight+hotel search) and note which categories are
   available. Do NOT hardcode. If no travel provider is connected,
   proceed with search criteria only and note that the user will book
   manually.
5. **Generate trip id.** `{YYYY-MM-DD}-{destination-slug}` — e.g.
   `2026-05-12-sfo`.
6. **Write `travel/{trip-id}/trip.md`** with sections:
   ```markdown
   ## Trip
   {purpose} — {destination}

   ## Dates
   Depart {YYYY-MM-DD} — Return {YYYY-MM-DD}

   ## Destinations
   - {city}, {country} — {nights}

   ## Purpose
   {1–2 lines}

   ## Key meetings
   - {date} — {attendee/event} — {prep status}

   ## Open questions
   - ...
   ```
7. **Write `travel/{trip-id}/itinerary.md`** with sections:
   ```markdown
   ## Flights
   ### Outbound
   - Search criteria: {origin} → {dest}, {date}, {seat pref},
     {airline pref}, {max stops}, {price ceiling if user
     mentioned}
   - Candidate options (if a provider is connected): {list}

   ### Return
   - ...

   ## Hotels
   - Search criteria: {chain pref}, {nights}, {neighborhood near
     key meetings}, {price ceiling}
   - Candidate options: {list}

   ## Ground
   - Airport → hotel → meetings
   - Preferred mode: {ride-share / rental / public}

   ## Pending bookings
   - [ ] Outbound flight
   - [ ] Return flight
   - [ ] Hotel
   - [ ] Ground transport
   ```
8. **Write `travel/{trip-id}/packing.md`** — checklist adapted to
   destination weather (use best guess from destination + dates),
   trip type (formal customer visit vs. conference vs. offsite),
   and `config/travel-prefs.json` (dietary, accessibility notes).
   Sections: `## Essentials`, `## Work`, `## Clothing`, `## Health &
   toiletries`, `## Destination-specific`.
9. **Tell the user.** "Trip pack ready in `travel/{trip-id}/`. Want
   me to propose flight options via {provider} once you confirm dates,
   or are you booking yourself? Also — should I block your calendar
   during the trip?"

## Outputs

- `travel/{trip-id}/trip.md`
- `travel/{trip-id}/itinerary.md`
- `travel/{trip-id}/packing.md`
- Possibly written `config/travel-prefs.json` on first run
