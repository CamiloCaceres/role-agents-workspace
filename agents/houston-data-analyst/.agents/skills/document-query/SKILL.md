---
name: document-query
description: Use when an ad-hoc query has produced a useful result and is worth saving for reuse ("save this query," "document this for next time," "add to the library") — capture purpose, parameters, schema deps, caveats, and last-run metadata into `queries/{slug}/`; update `queries.json` so the next time someone asks the same thing, `triage-ask` can classify it as `answerable-from-existing`.
---

# Document Query

## When to use

The user said "save this," "document this," "add to the library," OR
a recurring ad-hoc question keeps hitting `answer-question` with the
same shape — it's ready for a permanent entry. `answer-question`
already saves every query it runs, but that version is a thin record;
this skill promotes a query to a fully-documented library entry.

## Steps

1. **Identify the source query.** Either the user named a slug /
   pointed at a recent query, or I infer from the most-recent
   `queries.json` entry.

2. **Confirm purpose.** Read `queries/{slug}/notes.md`. If the
   purpose is vague ("ad-hoc"), ask the user ONE question:
   "Give me a one-line purpose — what question does this
   answer?"

3. **Parameterize.** Inspect the SQL for hardcoded dates, IDs, or
   segment names that should be parameters. Replace them with
   `{{placeholder}}` markers and document each in notes. The raw
   SQL saved by `answer-question` stays in
   `queries/{slug}/query.sql` but is updated to the parameterized
   form.

4. **Capture caveats.** Re-read `notes.md` and add any caveats
   that the user mentioned in chat (e.g. "excludes internal
   users," "runs slow on the old partition scheme," "uses a view
   that refreshes weekly").

5. **Tags.** Pick 2-4 short tags (e.g. `["growth", "signups",
   "weekly"]`) so `triage-ask` can match future questions
   quickly.

6. **Update `queries.json`.** Set `author: "user"` if this was
   promoted from an ad-hoc, update `purpose`, `tags`,
   `schemaDeps` (introspect the SQL for referenced tables),
   `costWarning` (from `answer-question`'s last-run metadata).

7. **Rewrite `notes.md`** using this template:

   ```markdown
   # Query: {slug}
   {purpose — one line}

   ## Parameters
   - `{{date}}` — default: today; e.g. `2024-06-01`
   - `{{segment}}` — e.g. `"enterprise"` | `"smb"`

   ## Schema dependencies
   - `schema.table` — columns used
   - ...

   ## Caveats
   - {anything a future reader needs to know}

   ## Last run
   {ISO-8601} — {row count} rows, {scanned bytes if known}
   ```

8. **Report.** Tell the user where the documented query lives and
   a suggested invocation: "Run `answer-question` with {slug}
   and any parameters to re-execute — or I'll auto-match it
   next time someone asks {purpose}."

## Outputs

- `queries/{slug}/query.sql` (updated to parameterized form)
- `queries/{slug}/notes.md` (overwritten)
- Updated `queries.json` row
