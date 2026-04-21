---
name: answer-question
description: Use when the user asks a data question ("how many signups this week," "top 10 customers by ARR," "what's retention looking like") — translate the question into read-only SQL against the right source in `config/data-sources.json`, introspect the relevant tables lazily into `config/schemas.json`, warn on cost BEFORE running, execute via any Composio-connected warehouse, save the query as reusable, and return the result with caveats and a run timestamp. Never runs DML.
---

# Answer Question

## When to use

The user asked a data question. Anything phrased as "how many,"
"what's," "top N by," "trend of," "compare X to Y," "why did Z change."
I translate to SQL, run it safely, and return a result I'll stand
behind.

## Hard rules

- **Read-only.** Any proposed query that contains `INSERT`, `UPDATE`,
  `DELETE`, `MERGE`, `DROP`, `CREATE`, `ALTER`, `TRUNCATE`,
  `GRANT`, or `REVOKE` is refused immediately. I tell the user the
  rule and stop.
- **Warn before executing a potentially expensive query.** Use the
  warehouse's cost / explain tool (via `composio search <warehouse>
  explain` or a DRY RUN query) to estimate scanned bytes and
  complexity. If scanned bytes > 10 GB, or the query scans a table
  larger than 100M rows without a filter on the partition/cluster
  column, warn the user: "This will scan ~X GB / Y rows — proceed?"
  and wait for explicit confirmation.
- **Every result ships with**: the exact SQL, the run timestamp, the
  row count, and any data-quality caveats (see step 6). No result
  without citations.

## Steps

1. **Identify the source.** Read `config/data-sources.json`. If
   empty or incomplete, ask the user ONE question: "Where does this
   data live? *Best — connect your warehouse via Composio and tell
   me the name. Or describe the table and I'll flag this as
   unverified until connected.*" Write and continue.

2. **Lazy schema introspection.** Read `config/schemas.json`. For
   the tables the question likely needs, if an entry is missing or
   `lastIntrospectedAt` is older than 7 days, run the warehouse's
   schema introspection tool (discover via `composio search`) to
   pull column list, types, nullability, and primary key hints.
   Append to `config/schemas.json`. If introspection is blocked
   because no warehouse is connected, ask the user to link one and
   stop — no guessing column names.

3. **Draft the SQL.** Use the dialect from
   `config/data-sources.json` (`snowflake` / `bigquery` / `redshift`
   / `databricks` / `postgres`). Prefer CTEs for readability. Apply
   partition / cluster / date filters when available. Generate a
   slug from the question purpose (kebab-case, e.g.
   `weekly-signups-last-7d`).

4. **Self-check against the hard rules.** Scan the query text for
   any forbidden keyword (case-insensitive). If found, refuse, tell
   the user, and stop.

5. **Estimate cost.** Run the warehouse's explain / dry-run tool.
   If estimated scanned bytes > 10 GB or estimated runtime > 30s:

   > "This will scan ~{bytes human} ({row estimate}) — run it?"

   Wait for confirmation. Otherwise continue.

6. **Execute via Composio.** Run the query through the connected
   warehouse tool. On success, capture result rows (cap at 10,000
   for local storage; note the real row count separately).

7. **Capture data-quality caveats.** Check the result for null
   percentages on key columns, surprisingly round numbers,
   zero-row returns where the user expected data, and ranges
   that look off (negative counts, future-dated events). List any
   in `notes.md` — never hide a concern.

8. **Save as reusable.** Write:
   - `queries/{slug}/query.sql` — the query body.
   - `queries/{slug}/result-latest.csv` — the result (up to 10k
     rows).
   - `queries/{slug}/notes.md` — purpose, parameters, schema deps,
     caveats, last-run metadata (timestamp, row count, scanned
     bytes).

   Append to `queries.json` (or update if the slug already exists)
   with `{ id, slug, purpose, author: "agent", sourceId, schemaDeps,
   tags, costWarning, lastRunAt, lastRowCount }`.

9. **Return the answer in chat.** Format:

   ```
   {plain-English answer, 1–3 sentences}

   Query: `queries/{slug}/query.sql`
   Ran at: {ISO-8601}
   Rows: {N}
   Caveats: {bulleted or "none"}
   ```

10. **Link back to an ask if relevant.** If this question was
    triggered by an entry in `asks.json`, update the ask's
    `linkedQuerySlug`, `status: "answered"`, `answeredAt`.

## Outputs

- `queries/{slug}/query.sql` (new or overwritten)
- `queries/{slug}/result-latest.csv` (overwritten)
- `queries/{slug}/notes.md` (new or overwritten)
- Updated `queries.json`
- Possibly updated `config/schemas.json` (lazy introspection)
- Possibly updated `asks.json` (when fulfilling an ask)
