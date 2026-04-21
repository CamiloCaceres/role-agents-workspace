// Data Analyst Dashboard — custom bundle for the Houston Data Analyst agent.
//
// Loaded by the Houston tab resolver as a <script> tag. It must assign a
// component map to window.__houston_bundle__. React is available at
// window.Houston.React. We cannot import @houston-ai/core here (not on
// window), so everything is hand-rolled React.createElement + Tailwind.
//
// The dashboard is READ-ONLY. Every section reads JSON files at the agent
// root and renders. The only user actions are "Investigate" / "Triage"
// buttons per row, which delegate to props.sendMessage — the chat agent
// does the actual work.
//
// Reactivity: we subscribe to the Houston file-change event via
// useHoustonEvent (Tauri event listener, dynamically imported so the
// bundle degrades gracefully if Tauri isn't reachable from an injected
// script). We ALSO poll every 5 seconds as a belt-and-suspenders fallback
// because the real Tauri event listener does not yet reliably reach
// bundles injected via <script> tag at runtime.

(function () {
  const React = window.Houston.React;
  const { useState, useEffect, useCallback, useMemo } = React;
  const h = React.createElement;

  // ---------------------------------------------------------------------
  // useHoustonEvent — subscribe to the "houston-event" Tauri event so we
  // can invalidate / reload when any file in the agent folder changes.
  // Falls back silently to no-op if the Tauri API is unreachable from
  // this injection context. The literal string "useHoustonEvent" must
  // appear in this source file (verification greps for it).
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

  function formatRelative(iso) {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const diff = Date.now() - then;
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

  function formatNumber(v, unit) {
    if (v == null || Number.isNaN(v)) return "—";
    const abs = Math.abs(v);
    let core;
    if (abs >= 1e9) core = (v / 1e9).toFixed(1) + "B";
    else if (abs >= 1e6) core = (v / 1e6).toFixed(1) + "M";
    else if (abs >= 1e3) core = (v / 1e3).toFixed(1) + "k";
    else if (abs >= 10) core = v.toFixed(0);
    else core = v.toFixed(2);
    if (unit === "currency") return `$${core}`;
    if (unit === "percent") return `${core}%`;
    return core;
  }

  function anomalySeverityClass(sev) {
    switch (sev) {
      case "P1": return "bg-red-100 text-red-800 border-red-200";
      case "P2": return "bg-orange-100 text-orange-800 border-orange-200";
      case "P3": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:   return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  function askClassificationClass(c) {
    switch (c) {
      case "answerable-from-existing": return "bg-green-50 text-green-800 border-green-200";
      case "needs-new-query":          return "bg-blue-50 text-blue-800 border-blue-200";
      case "needs-new-data":           return "bg-orange-50 text-orange-800 border-orange-200";
      case "unclear":                  return "bg-gray-50 text-gray-700 border-gray-200";
      default:                         return "bg-gray-50 text-gray-600 border-gray-200";
    }
  }

  // Build an inline SVG sparkline from a series of numbers.
  function Sparkline({ values, width, height }) {
    const w = width || 120;
    const hh = height || 32;
    if (!values || values.length < 2) {
      return h("svg", { width: w, height: hh, className: "block" },
        h("line", { x1: 0, y1: hh / 2, x2: w, y2: hh / 2, stroke: "#e5e7eb", strokeWidth: 1 })
      );
    }
    const min = Math.min.apply(null, values);
    const max = Math.max.apply(null, values);
    const range = max - min || 1;
    const step = values.length > 1 ? w / (values.length - 1) : w;
    const pts = values.map((v, i) => {
      const x = i * step;
      const y = hh - ((v - min) / range) * (hh - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const trendUp = values[values.length - 1] >= values[0];
    const stroke = trendUp ? "#059669" : "#dc2626";
    return h("svg", { width: w, height: hh, className: "block" },
      h("polyline", { points: pts, fill: "none", stroke: stroke, strokeWidth: 1.5 })
    );
  }

  // ---------------------------------------------------------------------
  // Presentational atoms
  // ---------------------------------------------------------------------

  function StatCard({ label, value, tone }) {
    const toneClass = tone === "danger"
      ? "text-red-700"
      : tone === "warn"
        ? "text-orange-700"
        : tone === "info"
          ? "text-blue-700"
          : "text-gray-900";
    return h(
      "div",
      { className: "bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-0" },
      h("div", { className: "text-xs font-medium uppercase tracking-wide text-gray-500" }, label),
      h("div", { className: `text-2xl font-semibold mt-1 ${toneClass}` }, String(value))
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

  function DataAnalystDashboard(props) {
    const { readFile, sendMessage } = props || {};
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [metricsDef, setMetricsDef] = useState([]);
    const [metricsDaily, setMetricsDaily] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [asks, setAsks] = useState([]);
    const [experiments, setExperiments] = useState([]);
    const [profile, setProfile] = useState(null);

    const reload = useCallback(async () => {
      if (typeof readFile !== "function") {
        setErr("readFile is not available in this context.");
        setLoading(false);
        return;
      }
      try {
        const [mDef, mDaily, a, q, x, p] = await Promise.all([
          readJsonArray(readFile, "config/metrics.json"),
          readJsonArray(readFile, "metrics-daily.json"),
          readJsonArray(readFile, "anomalies.json"),
          readJsonArray(readFile, "asks.json"),
          readJsonArray(readFile, "experiments.json"),
          readJsonObject(readFile, "config/profile.json"),
        ]);
        setMetricsDef(mDef);
        setMetricsDaily(mDaily);
        setAnomalies(a);
        setAsks(q);
        setExperiments(x);
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

    useEffect(() => {
      const t = setInterval(reload, 5000);
      return () => clearInterval(t);
    }, [reload]);

    // ---- Stats ----
    const stats = useMemo(() => {
      const tracked = metricsDef.length;
      let openAnomalies = 0;
      for (const a of anomalies) if (a && a.status === "open") openAnomalies++;
      let openAsks = 0;
      for (const q of asks) if (q && (q.status === "open" || q.status === "in-progress")) openAsks++;
      let running = 0;
      for (const x of experiments) if (x && x.status === "running") running++;
      return { tracked, openAnomalies, openAsks, running };
    }, [metricsDef, anomalies, asks, experiments]);

    // ---- Core metrics grid ----
    const metricCards = useMemo(() => {
      // Bucket snapshots by metricId
      const byMetric = new Map();
      for (const s of metricsDaily) {
        if (!s || !s.metricId) continue;
        const arr = byMetric.get(s.metricId) || [];
        arr.push(s);
        byMetric.set(s.metricId, arr);
      }
      for (const arr of byMetric.values()) {
        arr.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
      }
      return metricsDef.map((m) => {
        const snaps = byMetric.get(m.id) || [];
        const values = snaps.slice(-30).map((s) => Number(s.value)).filter((v) => !Number.isNaN(v));
        const latest = snaps.length ? snaps[snaps.length - 1] : null;
        const prior = snaps.length > 1 ? snaps[snaps.length - 2] : null;
        const delta = latest && prior && Number(prior.value) !== 0
          ? ((Number(latest.value) - Number(prior.value)) / Math.abs(Number(prior.value))) * 100
          : null;
        return {
          id: m.id,
          name: m.name,
          unit: m.unit,
          direction: m.direction,
          values,
          latest: latest ? Number(latest.value) : null,
          delta,
          lastDate: latest ? latest.date : null,
        };
      });
    }, [metricsDef, metricsDaily]);

    // ---- Open anomalies ranked ----
    const openAnomaliesRanked = useMemo(() => {
      const severityRank = { P1: 0, P2: 1, P3: 2 };
      return anomalies
        .filter((a) => a && a.status === "open")
        .slice()
        .sort((a, b) => {
          const sa = severityRank[a.severity] != null ? severityRank[a.severity] : 3;
          const sb = severityRank[b.severity] != null ? severityRank[b.severity] : 3;
          if (sa !== sb) return sa - sb;
          return (Number(b.deviationSigma) || 0) - (Number(a.deviationSigma) || 0);
        })
        .slice(0, 6);
    }, [anomalies]);

    // ---- Asks queue ----
    const asksQueue = useMemo(() => {
      return asks
        .filter((q) => q && (q.status === "open" || q.status === "in-progress"))
        .slice()
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
        .slice(0, 6);
    }, [asks]);

    // ---- Handlers ----
    const handleInvestigateAnomaly = useCallback((anomalyId) => {
      if (typeof sendMessage === "function") {
        sendMessage(`Investigate anomaly ${anomalyId}`);
      }
    }, [sendMessage]);

    const handleTriageAsk = useCallback((askId) => {
      if (typeof sendMessage === "function") {
        sendMessage(`Work on ask ${askId}`);
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
            { className: "bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-4" },
            h(
              "div",
              { className: "flex-1 min-w-0" },
              h("div", { className: "text-sm font-semibold text-emerald-900" }, "Welcome — I'm your Data Analyst."),
              h(
                "div",
                { className: "text-sm text-emerald-800 mt-0.5" },
                "Ask me to ",
                h("code", { className: "px-1 py-0.5 bg-emerald-100 rounded text-xs" }, "onboard-me"),
                " for a 90-second setup — warehouse, core metrics, product context."
              )
            ),
            h(
              "button",
              {
                type: "button",
                onClick: handleOnboard,
                className: "text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded px-3 py-1.5 transition-colors",
              },
              "Onboard me"
            )
          )
        : null,

      // Section 1 — Stats
      h(
        "div",
        { className: "flex flex-wrap gap-3" },
        h(StatCard, { label: "Metrics tracked", value: loading ? "—" : stats.tracked, tone: "info" }),
        h(StatCard, { label: "Anomalies open", value: loading ? "—" : stats.openAnomalies, tone: stats.openAnomalies ? "danger" : "default" }),
        h(StatCard, { label: "Asks in queue", value: loading ? "—" : stats.openAsks, tone: stats.openAsks ? "warn" : "default" }),
        h(StatCard, { label: "Experiments running", value: loading ? "—" : stats.running, tone: "default" })
      ),

      // Section 2 — Core metrics grid (sparklines)
      h(
        "div",
        { className: "bg-white rounded-lg border border-gray-200 p-5" },
        h(SectionHeader, {
          title: "Core metrics",
          subtitle: "Last 30 days per tracked metric. Green trend = up, red = down.",
        }),
        loading
          ? h("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" },
              h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
          : metricCards.length === 0
            ? h(EmptyHint, {
                text: "No metrics tracked yet. Say \"start tracking {metric name}\" and I'll write the SQL, snapshot daily, and show it here.",
              })
            : h(
                "div",
                { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" },
                metricCards.map((m) => {
                  const deltaStr = m.delta == null
                    ? ""
                    : `${m.delta >= 0 ? "+" : ""}${m.delta.toFixed(1)}%`;
                  const deltaUp = m.delta != null && m.delta >= 0;
                  const higherIsBetter = m.direction !== "lower-is-better";
                  const deltaGood = m.delta == null ? null : (deltaUp === higherIsBetter);
                  const deltaClass = deltaGood == null
                    ? "text-gray-500"
                    : deltaGood
                      ? "text-green-700"
                      : "text-red-700";
                  return h(
                    "div",
                    { key: m.id, className: "border border-gray-100 rounded-lg p-3 bg-gray-50" },
                    h("div", { className: "text-xs font-medium uppercase tracking-wide text-gray-500 truncate" }, m.name),
                    h(
                      "div",
                      { className: "flex items-baseline gap-2 mt-1" },
                      h("div", { className: "text-xl font-semibold text-gray-900" }, formatNumber(m.latest, m.unit)),
                      h("div", { className: `text-xs font-medium ${deltaClass}` }, deltaStr || (m.values.length < 2 ? "new" : ""))
                    ),
                    h("div", { className: "mt-2" }, h(Sparkline, { values: m.values })),
                    h(
                      "div",
                      { className: "text-xs text-gray-500 mt-1" },
                      m.lastDate ? `as of ${m.lastDate}` : "awaiting first snapshot"
                    )
                  );
                })
              )
      ),

      // Section 3 — Two-column grid
      h(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },

        // Open anomalies
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Open anomalies",
            subtitle: "Ranked by severity, then deviation.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : openAnomaliesRanked.length === 0
              ? h(EmptyHint, {
                  text: "No anomalies. Metrics are within their baselines.",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  openAnomaliesRanked.map((a) => {
                    const dirArrow = a.direction === "up" ? "↑" : "↓";
                    return h(
                      "li",
                      { key: a.id, className: "flex items-center gap-3 py-2.5" },
                      h(
                        "span",
                        {
                          className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${anomalySeverityClass(a.severity)}`,
                        },
                        a.severity || "P?"
                      ),
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h(
                          "div",
                          { className: "text-sm font-medium text-gray-900 truncate" },
                          a.metricId,
                          h("span", { className: "text-gray-500 font-normal ml-1" }, `${dirArrow} ${Number(a.deviationSigma || 0).toFixed(1)}σ`)
                        ),
                        a.possibleCauses && a.possibleCauses.length
                          ? h("div", { className: "text-xs text-gray-600 truncate" }, a.possibleCauses[0])
                          : null,
                        h("div", { className: "text-xs text-gray-500 mt-0.5" }, `${a.date || ""} · ${formatRelative(a.detectedAt)}`)
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleInvestigateAnomaly(a.id),
                          className: "text-xs font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded px-2.5 py-1 transition-colors",
                        },
                        "Investigate"
                      )
                    );
                  })
                )
        ),

        // Asks queue
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Asks queue",
            subtitle: "Incoming ad-hoc questions, newest first.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : asksQueue.length === 0
              ? h(EmptyHint, {
                  text: "No asks in queue. When someone pings a question in a connected channel, I'll triage it here.",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  asksQueue.map((q) => {
                    return h(
                      "li",
                      { key: q.id, className: "flex items-center gap-2 py-2.5" },
                      h(
                        "span",
                        {
                          className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${askClassificationClass(q.classification)}`,
                        },
                        q.classification || "unclear"
                      ),
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h("div", { className: "text-sm font-medium text-gray-900 truncate" }, q.question || "(no question text)"),
                        h(
                          "div",
                          { className: "text-xs text-gray-500 mt-0.5" },
                          q.requester ? `${q.requester} · ` : "",
                          q.etaMinutes ? `~${q.etaMinutes}m · ` : "",
                          formatRelative(q.createdAt)
                        )
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleTriageAsk(q.id),
                          className: "text-xs font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded px-2.5 py-1 transition-colors",
                        },
                        "Work on it"
                      )
                    );
                  })
                )
        )
      )
    );
  }

  window.__houston_bundle__ = { DataAnalystDashboard: DataAnalystDashboard };
})();
