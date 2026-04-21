// CSM Dashboard — custom bundle for the Houston CSM agent.
//
// Loaded by the Houston tab resolver as a <script> tag. It assigns a
// component map to window.__houston_bundle__. React is available at
// window.Houston.React. We cannot import @houston-ai/core here (not on
// window), so everything is hand-rolled React.createElement + Tailwind.
//
// The dashboard is READ-ONLY. Every section reads JSON files at the
// agent root and renders. The only user action is a "Review" / "Prep"
// button per row, which delegates to props.sendMessage — the chat
// agent does the actual work.
//
// Reactivity: we subscribe to the Houston file-change event via
// useHoustonEvent (Tauri event listener, dynamically imported so the
// bundle degrades gracefully if Tauri isn't reachable from an injected
// script). We ALSO poll every 5 seconds as a belt-and-suspenders
// fallback because the Tauri event listener does not yet reliably
// reach bundles injected via <script> tag at runtime.

(function () {
  const React = window.Houston.React;
  const { useState, useEffect, useCallback, useMemo } = React;
  const h = React.createElement;

  // ---------------------------------------------------------------------
  // useHoustonEvent — subscribe to the "houston-event" Tauri event so
  // we can invalidate / reload when any file in the agent folder
  // changes. Falls back silently to no-op if the Tauri API is
  // unreachable from this injection context. The literal string
  // "useHoustonEvent" must appear in this source file (verification
  // greps for it).
  // ---------------------------------------------------------------------
  function useHoustonEvent(handler) {
    useEffect(() => {
      let unlisten;
      let cancelled = false;
      const spec = ["@tauri-apps", "api", "event"].join("/");
      try {
        import(/* @vite-ignore */ spec)
          .then((m) => {
            if (cancelled || !m || typeof m.listen !== "function") return;
            m.listen("houston-event", (e) => {
              try { handler(e.payload); } catch (_) { /* swallow */ }
            }).then((fn) => {
              if (cancelled) fn(); else unlisten = fn;
            }).catch(() => { /* fallback: caller polls */ });
          })
          .catch(() => { /* fallback: caller polls */ });
      } catch (_) {
        // Same fallback — caller polls.
      }
      return () => {
        cancelled = true;
        if (typeof unlisten === "function") {
          try { unlisten(); } catch (_) {}
        }
      };
    }, [handler]);
  }

  // ---------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------

  function safeJsonParse(raw, fallback) {
    if (raw == null || raw === "") return fallback;
    try {
      const v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch (_) {
      return fallback;
    }
  }

  async function readJsonArray(readFile, path) {
    try {
      const raw = await readFile(path);
      const parsed = safeJsonParse(raw, []);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  async function readJsonObject(readFile, path) {
    try {
      const raw = await readFile(path);
      if (raw == null || raw === "") return null;
      const parsed = safeJsonParse(raw, null);
      if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function isoToDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatRelative(iso) {
    if (!iso) return "";
    const d = isoToDate(iso);
    if (!d) return "";
    const diff = Date.now() - d.getTime();
    const abs = Math.abs(diff);
    const mins = Math.floor(abs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m${diff < 0 ? " away" : " ago"}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h${diff < 0 ? " away" : " ago"}`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d${diff < 0 ? " away" : " ago"}`;
    const months = Math.floor(days / 30);
    return `${months}mo${diff < 0 ? " away" : " ago"}`;
  }

  function daysBetween(iso) {
    const d = isoToDate(iso);
    if (!d) return null;
    return Math.floor((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  }

  function isInNextDays(iso, days) {
    const d = daysBetween(iso);
    if (d == null) return false;
    return d >= 0 && d <= days;
  }

  function isSameMonth(iso, ref) {
    const d = isoToDate(iso);
    if (!d) return false;
    const r = ref || new Date();
    return d.getFullYear() === r.getFullYear() && d.getMonth() === r.getMonth();
  }

  function healthClass(score) {
    switch (score) {
      case "green":  return "bg-green-50 text-green-800 border-green-200";
      case "yellow": return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "red":    return "bg-red-50 text-red-800 border-red-200";
      default:       return "bg-gray-50 text-gray-600 border-gray-200";
    }
  }

  function severityBadgeClass(sev) {
    switch (sev) {
      case "sev1": return "bg-red-100 text-red-800 border-red-200";
      case "sev2": return "bg-orange-100 text-orange-800 border-orange-200";
      case "sev3": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:     return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  function stageBadgeClass(stage) {
    switch (stage) {
      case "idea":        return "bg-gray-50 text-gray-700 border-gray-200";
      case "qualified":   return "bg-blue-50 text-blue-800 border-blue-200";
      case "handed-off":  return "bg-purple-50 text-purple-800 border-purple-200";
      case "won":         return "bg-green-50 text-green-800 border-green-200";
      case "lost":        return "bg-red-50 text-red-800 border-red-200";
      default:            return "bg-gray-50 text-gray-600 border-gray-200";
    }
  }

  function formatArr(n) {
    if (typeof n !== "number" || !Number.isFinite(n)) return "";
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${n}`;
  }

  function severityRank(sev) {
    return sev === "sev1" ? 0 : sev === "sev2" ? 1 : sev === "sev3" ? 2 : 3;
  }

  // ---------------------------------------------------------------------
  // Presentational atoms
  // ---------------------------------------------------------------------

  function StatCard({ label, value, tone, subtitle }) {
    const toneClass = tone === "danger"
      ? "text-red-700"
      : tone === "warn"
        ? "text-orange-700"
        : tone === "good"
          ? "text-green-700"
          : tone === "info"
            ? "text-blue-700"
            : "text-gray-900";
    return h(
      "div",
      { className: "bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-0" },
      h("div", { className: "text-xs font-medium uppercase tracking-wide text-gray-500" }, label),
      h("div", { className: `text-2xl font-semibold mt-1 ${toneClass}` }, String(value)),
      subtitle ? h("div", { className: "text-xs text-gray-500 mt-0.5 truncate" }, subtitle) : null
    );
  }

  function HealthSplitCard({ green, yellow, red, unknown }) {
    return h(
      "div",
      { className: "bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-0" },
      h("div", { className: "text-xs font-medium uppercase tracking-wide text-gray-500" }, "Account health"),
      h(
        "div",
        { className: "flex items-baseline gap-2 mt-1" },
        h("span", { className: "text-2xl font-semibold text-green-700" }, String(green)),
        h("span", { className: "text-sm text-gray-400" }, "/"),
        h("span", { className: "text-2xl font-semibold text-yellow-700" }, String(yellow)),
        h("span", { className: "text-sm text-gray-400" }, "/"),
        h("span", { className: "text-2xl font-semibold text-red-700" }, String(red))
      ),
      h(
        "div",
        { className: "text-xs text-gray-500 mt-0.5" },
        `green · yellow · red${unknown ? ` · ${unknown} unscored` : ""}`
      )
    );
  }

  function SectionHeader({ title, subtitle }) {
    return h(
      "div",
      { className: "mb-3" },
      h("h2", { className: "text-base font-semibold text-gray-900" }, title),
      subtitle ? h("p", { className: "text-sm text-gray-500 mt-0.5" }, subtitle) : null
    );
  }

  function EmptyHint({ text }) {
    return h(
      "div",
      { className: "text-sm text-gray-500 italic py-6 text-center" },
      text
    );
  }

  function SkeletonRow() {
    return h(
      "div",
      { className: "flex items-center gap-3 py-2" },
      h("div", { className: "h-4 w-12 bg-gray-100 rounded animate-pulse" }),
      h("div", { className: "h-4 w-40 bg-gray-100 rounded animate-pulse" }),
      h("div", { className: "h-4 flex-1 bg-gray-100 rounded animate-pulse" }),
      h("div", { className: "h-4 w-16 bg-gray-100 rounded animate-pulse" })
    );
  }

  // ---------------------------------------------------------------------
  // The dashboard
  // ---------------------------------------------------------------------

  function CsmDashboard(props) {
    const { readFile, sendMessage } = props || {};
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [atRisk, setAtRisk] = useState([]);
    const [renewals, setRenewals] = useState([]);
    const [expansions, setExpansions] = useState([]);
    const [profile, setProfile] = useState(null);

    const reload = useCallback(async () => {
      if (typeof readFile !== "function") {
        setErr("readFile is not available in this context.");
        setLoading(false);
        return;
      }
      try {
        const [a, r, ren, exp, p] = await Promise.all([
          readJsonArray(readFile, "accounts.json"),
          readJsonArray(readFile, "at-risk.json"),
          readJsonArray(readFile, "renewals.json"),
          readJsonArray(readFile, "expansion-pipeline.json"),
          readJsonObject(readFile, "config/profile.json"),
        ]);
        setAccounts(a);
        setAtRisk(r);
        setRenewals(ren);
        setExpansions(exp);
        setProfile(p);
        setErr(null);
      } catch (e) {
        setErr(e && e.message ? e.message : "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }, [readFile]);

    useEffect(() => { reload(); }, [reload]);

    const onEvent = useCallback((payload) => {
      if (!payload) return;
      if (payload.type === "FilesChanged" || payload.type === "files_changed") {
        reload();
      }
    }, [reload]);
    useHoustonEvent(onEvent);

    // Polling fallback: the Tauri event listener does not yet reach
    // <script>-injected bundles reliably, so we poll every 5s.
    useEffect(() => {
      const t = setInterval(reload, 5000);
      return () => clearInterval(t);
    }, [reload]);

    const accountMap = useMemo(() => {
      const map = new Map();
      for (const a of accounts) if (a && a.slug) map.set(a.slug, a);
      return map;
    }, [accounts]);

    // ---- Stats ----
    const healthCounts = useMemo(() => {
      let green = 0, yellow = 0, red = 0, unknown = 0;
      for (const a of accounts) {
        if (!a || a.status === "churned") continue;
        switch (a.healthScore) {
          case "green":  green++; break;
          case "yellow": yellow++; break;
          case "red":    red++; break;
          default:       unknown++;
        }
      }
      return { green, yellow, red, unknown };
    }, [accounts]);

    const qbrsThisWeek = useMemo(() => {
      let n = 0;
      for (const a of accounts) {
        if (!a || !a.nextQbrAt) continue;
        if (isInNextDays(a.nextQbrAt, 7)) n++;
      }
      return n;
    }, [accounts]);

    const renewalsIn90 = useMemo(() => {
      let n = 0;
      for (const r of renewals) {
        if (!r) continue;
        if (r.status === "renewed" || r.status === "churned") continue;
        if (isInNextDays(r.renewalAt, 90)) n++;
      }
      // Fallback: if renewals.json is empty but accounts have renewalAt, count from there.
      if (n === 0) {
        for (const a of accounts) {
          if (!a || a.status === "churned") continue;
          if (isInNextDays(a.renewalAt, 90)) n++;
        }
      }
      return n;
    }, [renewals, accounts]);

    const expansionMtd = useMemo(() => {
      const now = new Date();
      let n = 0;
      for (const e of expansions) {
        if (!e) continue;
        // Count anything that moved this month — handed-off, won, or newly qualified.
        const when = e.handoffSentAt || e.updatedAt || e.createdAt;
        if (!isSameMonth(when, now)) continue;
        if (e.stage === "handed-off" || e.stage === "won" || e.stage === "qualified") n++;
      }
      return n;
    }, [expansions]);

    const openSev1Count = useMemo(() => {
      let n = 0;
      for (const r of atRisk) {
        if (!r) continue;
        if (r.status !== "open" && r.status !== "in-progress") continue;
        if (r.severity === "sev1") n++;
      }
      return n;
    }, [atRisk]);

    // ---- At-risk ranking — severity asc, then ARR desc ----
    const rankedAtRisk = useMemo(() => {
      const open = atRisk.filter((r) => r && (r.status === "open" || r.status === "in-progress"));
      open.sort((a, b) => {
        const rA = severityRank(a.severity);
        const rB = severityRank(b.severity);
        if (rA !== rB) return rA - rB;
        const arrA = typeof a.arr === "number" ? a.arr : 0;
        const arrB = typeof b.arr === "number" ? b.arr : 0;
        return arrB - arrA;
      });
      return open.slice(0, 8);
    }, [atRisk]);

    // ---- Upcoming QBRs (next 4 weeks) ----
    const upcomingQbrs = useMemo(() => {
      const rows = [];
      for (const a of accounts) {
        if (!a || !a.nextQbrAt) continue;
        if (!isInNextDays(a.nextQbrAt, 28)) continue;
        rows.push(a);
      }
      rows.sort((a, b) => (a.nextQbrAt || "").localeCompare(b.nextQbrAt || ""));
      return rows.slice(0, 6);
    }, [accounts]);

    // ---- Expansion pipeline by stage ----
    const pipelineByStage = useMemo(() => {
      const stages = ["idea", "qualified", "handed-off", "won", "lost"];
      const buckets = {};
      for (const s of stages) buckets[s] = [];
      for (const e of expansions) {
        if (!e) continue;
        const s = e.stage || "idea";
        if (!buckets[s]) buckets[s] = [];
        buckets[s].push(e);
      }
      return stages.map((s) => ({ stage: s, items: buckets[s] }));
    }, [expansions]);

    // ---- Handlers ----
    const handleReviewAtRisk = useCallback((slug) => {
      if (typeof sendMessage === "function") {
        sendMessage(`Review at-risk for ${slug}`);
      }
    }, [sendMessage]);

    const handlePrepQbr = useCallback((slug) => {
      if (typeof sendMessage === "function") {
        sendMessage(`Prep QBR for ${slug}`);
      }
    }, [sendMessage]);

    const handleHandoff = useCallback((id) => {
      if (typeof sendMessage === "function") {
        sendMessage(`Hand off expansion ${id} to AE`);
      }
    }, [sendMessage]);

    const handleOnboard = useCallback(() => {
      if (typeof sendMessage === "function") {
        sendMessage("onboard-me");
      }
    }, [sendMessage]);

    const notOnboarded = !loading && profile == null;

    return h(
      "div",
      { className: "p-6 max-w-6xl mx-auto space-y-6" },

      err
        ? h(
            "div",
            { className: "bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" },
            `Dashboard error: ${err}`
          )
        : null,

      // Onboarding banner
      notOnboarded
        ? h(
            "div",
            { className: "bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center gap-4" },
            h(
              "div",
              { className: "flex-1 min-w-0" },
              h("div", { className: "text-sm font-semibold text-rose-900" }, "Welcome — I'm your CSM."),
              h(
                "div",
                { className: "text-sm text-rose-800 mt-0.5" },
                "Ask me to ",
                h("code", { className: "px-1 py-0.5 bg-rose-100 rounded text-xs" }, "onboard-me"),
                " for a 90-second setup."
              )
            ),
            h(
              "button",
              {
                type: "button",
                onClick: handleOnboard,
                className: "text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded px-3 py-1.5 transition-colors",
              },
              "Onboard me"
            )
          )
        : null,

      // Section 1 — Stats row
      h(
        "div",
        { className: "flex flex-wrap gap-3" },
        loading
          ? h(StatCard, { label: "Account health", value: "—" })
          : h(HealthSplitCard, healthCounts),
        h(StatCard, {
          label: "QBRs this week",
          value: loading ? "—" : qbrsThisWeek,
          tone: qbrsThisWeek > 0 ? "info" : "default",
        }),
        h(StatCard, {
          label: "Renewals in 90 days",
          value: loading ? "—" : renewalsIn90,
          tone: renewalsIn90 > 0 ? "warn" : "default",
        }),
        h(StatCard, {
          label: "Expansion MTD",
          value: loading ? "—" : expansionMtd,
          tone: expansionMtd > 0 ? "good" : "default",
          subtitle: openSev1Count > 0 ? `${openSev1Count} sev1 open` : undefined,
        })
      ),

      // Section 2 — At-risk accounts
      h(
        "div",
        { className: "bg-white rounded-lg border border-gray-200 p-5" },
        h(SectionHeader, {
          title: "At-risk accounts",
          subtitle: "Open + in-progress, ranked by severity then ARR.",
        }),
        loading
          ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
          : rankedAtRisk.length === 0
            ? h(EmptyHint, {
                text: "Nothing on fire. Ask me to \"compute health for my accounts\" to refresh scores, or \"what's stalled\" to sweep proactively.",
              })
            : h(
                "ul",
                { className: "divide-y divide-gray-100" },
                rankedAtRisk.map((r) => {
                  const acct = accountMap.get(r.accountSlug);
                  const name = r.accountName || (acct && acct.name) || r.accountSlug || "Unknown";
                  const arr = typeof r.arr === "number" ? r.arr : (acct && acct.arr);
                  const arrLabel = formatArr(arr);
                  return h(
                    "li",
                    { key: r.id || `at-risk-${r.accountSlug}`, className: "flex items-center gap-3 py-2.5" },
                    h(
                      "span",
                      {
                        className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${severityBadgeClass(r.severity)}`,
                      },
                      (r.severity || "sev?").toUpperCase()
                    ),
                    acct
                      ? h(
                          "span",
                          {
                            className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${healthClass(acct.healthScore)}`,
                          },
                          acct.healthScore || "—"
                        )
                      : null,
                    h(
                      "div",
                      { className: "flex-1 min-w-0" },
                      h(
                        "div",
                        { className: "text-sm font-medium text-gray-900 truncate" },
                        name,
                        arrLabel ? h("span", { className: "text-gray-500 font-normal" }, ` · ${arrLabel} ARR`) : null
                      ),
                      h("div", { className: "text-sm text-gray-600 truncate" }, r.cause || r.trigger || "—"),
                      h(
                        "div",
                        { className: "text-xs text-gray-500 mt-0.5" },
                        `opened ${formatRelative(r.openedAt || r.createdAt)}`,
                        r.proposedPlay ? ` · play: ${r.proposedPlay}` : ""
                      )
                    ),
                    h(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleReviewAtRisk(r.accountSlug),
                        className: "text-xs font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-rose-200 rounded px-2.5 py-1 transition-colors",
                      },
                      "Review"
                    )
                  );
                })
              )
      ),

      // Section 3 — Two-column grid (QBRs + Expansion pipeline)
      h(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },

        // Upcoming QBRs (next 4 weeks)
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Upcoming QBRs",
            subtitle: "Next 4 weeks, sorted by date.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : upcomingQbrs.length === 0
              ? h(EmptyHint, {
                  text: "No QBRs scheduled in the next 4 weeks. Ask me to \"prep QBR for {account}\" when you're ready.",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  upcomingQbrs.map((a) => {
                    const delta = daysBetween(a.nextQbrAt);
                    const daysLabel = delta == null
                      ? ""
                      : delta === 0
                        ? "today"
                        : delta === 1
                          ? "tomorrow"
                          : `in ${delta}d`;
                    return h(
                      "li",
                      { key: a.slug, className: "flex items-center gap-3 py-2.5" },
                      h(
                        "span",
                        {
                          className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${healthClass(a.healthScore)}`,
                        },
                        a.healthScore || "—"
                      ),
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h(
                          "div",
                          { className: "text-sm font-medium text-gray-900 truncate" },
                          a.name || a.slug,
                          typeof a.arr === "number" ? h("span", { className: "text-gray-500 font-normal" }, ` · ${formatArr(a.arr)}`) : null
                        ),
                        h(
                          "div",
                          { className: "text-xs text-gray-500 mt-0.5" },
                          daysLabel,
                          a.tier ? ` · ${a.tier}` : ""
                        )
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => handlePrepQbr(a.slug),
                          className: "text-xs font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-rose-200 rounded px-2.5 py-1 transition-colors",
                        },
                        "Prep"
                      )
                    );
                  })
                )
        ),

        // Expansion pipeline by stage
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Expansion pipeline",
            subtitle: "By stage — qualified + handed-off highlighted.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : expansions.length === 0
              ? h(EmptyHint, {
                  text: "No expansion ideas yet. Ask me to \"spot expansion\" to run a signal sweep.",
                })
              : h(
                  "div",
                  { className: "space-y-3" },
                  pipelineByStage.map((bucket) => {
                    const items = bucket.items;
                    const arrSum = items.reduce((s, it) => s + (typeof it.estimatedArrUplift === "number" ? it.estimatedArrUplift : 0), 0);
                    return h(
                      "div",
                      { key: bucket.stage, className: "border border-gray-100 rounded p-3" },
                      h(
                        "div",
                        { className: "flex items-center justify-between mb-2" },
                        h(
                          "span",
                          {
                            className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${stageBadgeClass(bucket.stage)}`,
                          },
                          bucket.stage
                        ),
                        h(
                          "div",
                          { className: "text-xs text-gray-500" },
                          `${items.length}${arrSum > 0 ? ` · ${formatArr(arrSum)} uplift` : ""}`
                        )
                      ),
                      items.length === 0
                        ? h("div", { className: "text-xs text-gray-400 italic" }, "—")
                        : h(
                            "ul",
                            { className: "space-y-1.5" },
                            items.slice(0, 4).map((e) => {
                              const actionable = bucket.stage === "qualified";
                              return h(
                                "li",
                                { key: e.id, className: "flex items-center gap-2 text-sm" },
                                h(
                                  "div",
                                  { className: "flex-1 min-w-0" },
                                  h("div", { className: "text-sm text-gray-900 truncate" }, e.title || "—"),
                                  h(
                                    "div",
                                    { className: "text-xs text-gray-500 truncate" },
                                    e.accountName || e.accountSlug || "—",
                                    typeof e.estimatedArrUplift === "number" ? ` · ${formatArr(e.estimatedArrUplift)}` : ""
                                  )
                                ),
                                actionable
                                  ? h(
                                      "button",
                                      {
                                        type: "button",
                                        onClick: () => handleHandoff(e.id),
                                        className: "text-xs font-medium text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-rose-200 rounded px-2 py-0.5 transition-colors",
                                      },
                                      "Handoff"
                                    )
                                  : null
                              );
                            })
                          )
                    );
                  })
                )
        )
      )
    );
  }

  window.__houston_bundle__ = { CsmDashboard: CsmDashboard };
})();
