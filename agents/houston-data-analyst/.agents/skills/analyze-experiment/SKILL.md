---
name: analyze-experiment
description: Use when an experiment ends, the user asks "how did test X do," or the user asks to analyze an A/B test — read the hypothesis and variant data, compute observed lift per variant, statistical significance (p-value), confidence interval, minimum detectable effect, and check guardrail metrics; write a structured readout to `experiments/{slug}/readout.md` with an explicit recommendation (ship / kill / iterate / inconclusive-extend). Never recommends shipping without significance.
---

# Analyze Experiment

## When to use

The user says "experiment X ended," "analyze the checkout test," "how
did the {variant} do," or ends a running experiment by updating its
status. I compute the statistical picture and write a readout with a
clear recommendation.

## Steps

1. **Read framework.** Read `config/experiments-framework.md`. If
   missing, ask ONE question: "Quick — what's your default
   significance threshold (95% / 99%), minimum detectable effect,
   and any guardrail metrics you want every experiment to check?
   *Paste, drop a stats doc, or tell me you want the sensible
   defaults (95% / 5% MDE / the primary metric's guardrails I'll
   propose).*" Write the answer and continue.

2. **Load experiment metadata.** Read `experiments.json` and find
   the index entry. If missing, create one from the user's
   description (`slug`, `hypothesis`, `variants`, `primaryMetric`,
   `guardrailMetrics`, `startDate`, `endDate`, `status`).

3. **Pull variant-level data.** Use the connected warehouse tool
   (Composio) to run a read-only SQL query that returns
   per-variant counts and metric values. If the user provided a
   CSV / pasted table, parse that instead. Either way, capture:

   - `n_variant` (sample size per variant)
   - Observed primary-metric value per variant
   - Optionally per-variant guardrail values

4. **Compute lift.** For each non-control variant:
   `lift = (variantValue - controlValue) / controlValue`. Record
   the absolute delta and the percent lift.

5. **Compute significance.** Choose the right test:
   - Binomial / conversion rate → two-proportion z-test (or
     chi-squared for more than 2 variants).
   - Continuous metric (revenue, minutes) → Welch's t-test (two
     variants) or ANOVA (more).
   Report `p` and the two-sided 95% (or framework-configured)
   confidence interval on the lift.

6. **Compute minimum detectable effect.** Given the observed
   sample size and control variance, what's the smallest lift
   this experiment could have detected at 80% power? Report in the
   same units as lift. If MDE is larger than the observed lift,
   the experiment is likely under-powered — flag it.

7. **Check guardrail metrics.** For each guardrail, compute the
   same lift / p / CI. Flag any guardrail with a statistically
   significant move in the wrong direction — that blocks a ship
   recommendation even if the primary metric won.

8. **Decide recommendation.**
   - **Ship** — primary lift positive and `p < threshold` AND no
     guardrail broken.
   - **Kill** — primary lift negative and `p < threshold`, OR
     primary lift positive but a guardrail breached.
   - **Iterate** — lift is positive but `p > threshold` AND MDE
     suggests the test was underpowered → redesign with larger
     sample.
   - **Inconclusive — extend** — directionally positive, not sig,
     MDE says more time helps.

9. **Write the readout** to `experiments/{slug}/readout.md`:

   ```markdown
   # Experiment: {slug}
   {one-line hypothesis}

   ## Design
   Variants: control, {variant-a}, ...
   Primary metric: {metric}
   Guardrails: {list}
   Duration: {start} → {end} ({N days})
   Sample size: n_control = {N}, n_variant = {N}

   ## Primary metric result
   | Variant | n | Observed | Lift | 95% CI | p |
   |---|---|---|---|---|---|
   | control | ... | ... | — | — | — |
   | variant-a | ... | ... | +X% | [lo, hi] | 0.0XX |

   ## Guardrails
   (same table shape — only include rows with notable movement)

   ## Minimum detectable effect
   At 80% power with observed variance, this experiment could
   detect lifts of ≥ {MDE}. Observed lift: {lift}.

   ## Recommendation
   **{SHIP | KILL | ITERATE | INCONCLUSIVE-EXTEND}**
   {2–3 sentence rationale tying lift + significance + guardrails
   + MDE to the call.}

   ## Caveats
   - {any data-quality flags}
   - {any exposure-imbalance flags}
   - {any metric-freshness flags}
   ```

10. **Update the index.** Set `experiments.json` entry to
    `status: "analyzed"`. Record `sampleSize`.

11. **Never say "directionally positive" as a ship signal.** If
    the primary lift is positive but not significant, the
    recommendation is ITERATE or INCONCLUSIVE — not SHIP.

## Outputs

- `experiments/{slug}/readout.md` (new or overwritten)
- Updated `experiments.json`
- New or updated `queries/experiment-{slug}/query.sql` (the variant
  SQL, saved for rerun)
- Possibly updated `config/experiments-framework.md` (progressive
  capture)
