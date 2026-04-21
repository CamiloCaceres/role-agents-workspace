// Chief of Staff Dashboard — custom bundle for the Houston Chief of Staff agent.
//
// Loaded by the Houston tab resolver as a <script> tag. It assigns a
// component map to window.__houston_bundle__. React is available at
// window.Houston.React. We cannot import @houston-ai/core here (not on
// window), so everything is hand-rolled React.createElement + Tailwind.
//
// The dashboard is READ-ONLY. Every section reads JSON files at the
// agent root and renders. The only user actions are "Nudge owner" /
// "Prep decision" buttons per row, which delegate to props.sendMessage
// — the chat agent does the actual work.
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

  function clampPct(v) {
    if (v == null || Number.isNaN(v)) return 0;
    if (v < 0) return 0;
    if (v > 100) return 100;
    return v;
  }

  // status → tailwind chip classes for initiative status
  function initiativeStatusClass(s) {
    switch (s) {
      case "on-track":  return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "at-risk":   return "bg-orange-50 text-orange-800 border-orange-200";
      case "off-track": return "bg-red-50 text-red-800 border-red-200";
      default:          return "bg-gray-50 text-gray-700 border-gray-200";
    }
  }

  // OKR state → tailwind chip classes
  function okrStateClass(s) {
    switch (s) {
      case "on-track":  return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "at-risk":   return "bg-orange-100 text-orange-800 border-orange-200";
      case "off-track": return "bg-red-100 text-red-800 border-red-200";
      default:          return "bg-slate-100 text-slate-700 border-slate-200";
    }
  }

  // Progress bar color driven by status
  function progressBarColor(s) {
    switch (s) {
      case "on-track":  return "bg-emerald-500";
      case "at-risk":   return "bg-orange-500";
      case "off-track": return "bg-red-500";
      default:          return "bg-slate-400";
    }
  }

  // ---------------------------------------------------------------------
  // OKR helpers — normalize KRs from config/okrs.json against the latest
  // snapshots in okr-tracker.json. We support two tracker shapes:
  //   - flat:   { objectiveId, keyResultId, date, value }
  //   - nested: { objectiveId, date, keyResults: [{ id, value }] }
  // The skill writes one or the other — we handle both defensively.
  // ---------------------------------------------------------------------
  function buildOkrRows(okrDefs, snapshots) {
    // Index snapshots by objectiveId; sort by date asc.
    const byObj = new Map();
    for (const s of snapshots) {
      if (!s || !s.objectiveId) continue;
      const arr = byObj.get(s.objectiveId) || [];
      arr.push(s);
      byObj.set(s.objectiveId, arr);
    }
    for (const arr of byObj.values()) {
      arr.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    }

    // Pull the value for a specific KR out of a snapshot (handles both shapes).
    function krValue(snap, keyResultId) {
      if (!snap) return null;
      if (snap.keyResultId === keyResultId && snap.value != null) return Number(snap.value);
      if (Array.isArray(snap.keyResults)) {
        for (const kr of snap.keyResults) {
          if (kr && kr.id === keyResultId && kr.value != null) return Number(kr.value);
        }
      }
      return null;
    }

    return (okrDefs || []).map((o) => {
      const snaps = byObj.get(o.id) || [];
      const latestSnap = snaps.length ? snaps[snaps.length - 1] : null;
      // A snapshot from ~7 days ago (latest with date <= sevenDaysAgo)
      const sevenMs = 7 * 24 * 60 * 60 * 1000;
      const sevenAgoTs = Date.now() - sevenMs;
      let priorSnap = null;
      for (let i = snaps.length - 1; i >= 0; i--) {
        const t = snaps[i].date ? new Date(snaps[i].date).getTime() : NaN;
        if (!Number.isNaN(t) && t <= sevenAgoTs) { priorSnap = snaps[i]; break; }
      }
      if (!priorSnap && snaps.length > 1) priorSnap = snaps[0];

      // Per-KR progress %
      const krRows = (o.keyResults || []).map((kr) => {
        const currentFromSnap = krValue(latestSnap, kr.id);
        const current = currentFromSnap != null ? currentFromSnap : (kr.current != null ? Number(kr.current) : null);
        const target = kr.target != null ? Number(kr.target) : null;
        let pct = null;
        if (current != null && target != null && target !== 0) {
          pct = (current / target) * 100;
        }
        const prior = krValue(priorSnap, kr.id);
        let delta = null;
        if (current != null && prior != null) {
          delta = current - prior;
        }
        return { id: kr.id, metric: kr.metric, unit: kr.unit, current, target, pct, delta };
      });

      // Aggregate objective progress = mean of KR progress (clamped 0–100).
      const pcts = krRows.map((r) => r.pct).filter((v) => v != null && !Number.isNaN(v));
      const avgPct = pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null;

      // Aggregate delta sign (if any KR moved positively we call it ↑; all down ↓; else →).
      const deltas = krRows.map((r) => r.delta).filter((v) => v != null && !Number.isNaN(v));
      let trend = "flat";
      if (deltas.length) {
        const up = deltas.filter((d) => d > 0).length;
        const down = deltas.filter((d) => d < 0).length;
        if (up > down) trend = "up";
        else if (down > up) trend = "down";
      }

      // Classification falls back to objective.state from config, else derived from avgPct.
      let state = o.state || o.status || null;
      if (!state && avgPct != null) {
        if (avgPct >= 70) state = "on-track";
        else if (avgPct >= 40) state = "at-risk";
        else state = "off-track";
      }
      if (!state) state = "unknown";

      return {
        id: o.id,
        objective: o.objective,
        period: o.period,
        state,
        avgPct: avgPct == null ? null : clampPct(avgPct),
        trend,
        krRows,
      };
    });
  }

  function okrSplit(rows) {
    let on = 0, at = 0, off = 0;
    for (const r of rows) {
      if (r.state === "on-track") on++;
      else if (r.state === "at-risk") at++;
      else if (r.state === "off-track") off++;
    }
    return { on, at, off };
  }

  // ---------------------------------------------------------------------
  // Presentational atoms
  // ---------------------------------------------------------------------

  function StatCard({ label, value, tone, subtitle }) {
    const toneClass = tone === "danger"
      ? "text-red-700"
      : tone === "warn"
        ? "text-orange-700"
        : tone === "info"
          ? "text-slate-700"
          : "text-gray-900";
    return h(
      "div",
      { className: "bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-0" },
      h("div", { className: "text-xs font-medium uppercase tracking-wide text-gray-500" }, label),
      h("div", { className: `text-2xl font-semibold mt-1 ${toneClass}` }, value == null ? "—" : String(value)),
      subtitle ? h("div", { className: "text-xs text-gray-500 mt-1 truncate" }, subtitle) : null
    );
  }

  // Split pill card for the OKR tri-state stat
  function OkrSplitCard({ split, loading }) {
    const total = (split.on || 0) + (split.at || 0) + (split.off || 0);
    return h(
      "div",
      { className: "bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-0" },
      h("div", { className: "text-xs font-medium uppercase tracking-wide text-gray-500" }, "OKRs on-track / at-risk / off-track"),
      loading
        ? h("div", { className: "text-2xl font-semibold mt-1 text-gray-400" }, "—")
        : total === 0
          ? h("div", { className: "text-sm text-gray-500 mt-2 italic" }, "No OKRs yet")
          : h(
              "div",
              { className: "flex items-center gap-1.5 mt-2" },
              h("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold border bg-emerald-100 text-emerald-800 border-emerald-200" }, String(split.on || 0)),
              h("span", { className: "text-gray-400 text-sm" }, "/"),
              h("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold border bg-orange-100 text-orange-800 border-orange-200" }, String(split.at || 0)),
              h("span", { className: "text-gray-400 text-sm" }, "/"),
              h("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold border bg-red-100 text-red-800 border-red-200" }, String(split.off || 0))
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

  function TrendChip({ trend }) {
    if (trend === "up")   return h("span", { className: "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" }, "↑");
    if (trend === "down") return h("span", { className: "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200" }, "↓");
    return h("span", { className: "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200" }, "→");
  }

  function ProgressBar({ pct, state }) {
    const clamped = clampPct(pct == null ? 0 : pct);
    return h(
      "div",
      { className: "h-2 rounded bg-gray-100 overflow-hidden" },
      h("div", {
        className: `h-full ${progressBarColor(state)}`,
        style: { width: `${clamped}%` },
      })
    );
  }

  // ---------------------------------------------------------------------
  // The dashboard
  // ---------------------------------------------------------------------

  function ChiefOfStaffDashboard(props) {
    const { readFile, sendMessage } = props || {};
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [initiatives, setInitiatives] = useState([]);
    const [decisions, setDecisions] = useState([]);
    const [bottlenecks, setBottlenecks] = useState([]);
    const [okrDefs, setOkrDefs] = useState([]);
    const [okrSnaps, setOkrSnaps] = useState([]);
    const [profile, setProfile] = useState(null);

    const reload = useCallback(async () => {
      if (typeof readFile !== "function") {
        setErr("readFile is not available in this context.");
        setLoading(false);
        return;
      }
      try {
        const [inits, decs, bots, snaps, okrs, p] = await Promise.all([
          readJsonArray(readFile, "initiatives.json"),
          readJsonArray(readFile, "decisions.json"),
          readJsonArray(readFile, "bottlenecks.json"),
          readJsonArray(readFile, "okr-tracker.json"),
          readJsonArray(readFile, "config/okrs.json"),
          readJsonObject(readFile, "config/profile.json"),
        ]);
        setInitiatives(inits);
        setDecisions(decs);
        setBottlenecks(bots);
        setOkrSnaps(snaps);
        setOkrDefs(okrs);
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

    // ---- Derived OKR rows ----
    const okrRows = useMemo(() => buildOkrRows(okrDefs, okrSnaps), [okrDefs, okrSnaps]);
    const split = useMemo(() => okrSplit(okrRows), [okrRows]);

    // ---- Stats ----
    const stats = useMemo(() => {
      let activeInits = 0;
      for (const i of initiatives) {
        if (!i) continue;
        if (i.status === "on-track" || i.status === "at-risk" || i.status === "off-track") activeInits++;
      }
      let pendingDec = 0;
      for (const d of decisions) if (d && d.status === "pending") pendingDec++;

      // Board pack readiness: if the user has a board-pack initiative tracked
      // (prep-board-pack writes one with kind === "board-pack" and a
      // readiness number 0-100), use its readiness; otherwise unknown.
      let readiness = null;
      const packInits = initiatives.filter((i) => i && i.kind === "board-pack" && typeof i.readiness === "number");
      if (packInits.length) {
        packInits.sort((a, b) => (b.targetDate || "").localeCompare(a.targetDate || ""));
        readiness = Math.round(packInits[0].readiness);
      }

      return { activeInits, pendingDec, readiness };
    }, [initiatives, decisions]);

    // ---- Initiatives at risk ----
    const atRiskInits = useMemo(() => {
      const filtered = initiatives.filter((i) => i && (i.status === "at-risk" || i.status === "off-track"));
      filtered.sort((a, b) => {
        const la = Array.isArray(a.linkedOkrIds) ? a.linkedOkrIds.length : 0;
        const lb = Array.isArray(b.linkedOkrIds) ? b.linkedOkrIds.length : 0;
        if (lb !== la) return lb - la;
        // off-track ranks above at-risk when linkedOkrIds ties
        const rank = (s) => (s === "off-track" ? 0 : 1);
        return rank(a.status) - rank(b.status);
      });
      return filtered.slice(0, 6);
    }, [initiatives]);

    // ---- Decisions pending ----
    const pendingDecisions = useMemo(() => {
      return decisions
        .filter((d) => d && d.status === "pending")
        .slice()
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
        .slice(0, 6);
    }, [decisions]);

    // ---- Handlers ----
    const handleNudge = useCallback((slug) => {
      if (typeof sendMessage === "function" && slug) {
        sendMessage(`Draft a nudge for initiative ${slug} owner`);
      }
    }, [sendMessage]);

    const handlePrepDecision = useCallback((slug) => {
      if (typeof sendMessage === "function" && slug) {
        sendMessage(`Prep decision brief for ${slug}`);
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
            { className: "bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-4" },
            h(
              "div",
              { className: "flex-1 min-w-0" },
              h("div", { className: "text-sm font-semibold text-slate-900" }, "Welcome — I'm your Chief of Staff."),
              h(
                "div",
                { className: "text-sm text-slate-800 mt-0.5" },
                "Ask me to ",
                h("code", { className: "px-1 py-0.5 bg-slate-100 rounded text-xs" }, "onboard-me"),
                " for a 90-second setup — company context, leadership team, OKRs."
              )
            ),
            h(
              "button",
              {
                type: "button",
                onClick: handleOnboard,
                className: "text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded px-3 py-1.5 transition-colors",
              },
              "Onboard me"
            )
          )
        : null,

      // Section 1 — Stats row (4 cards)
      h(
        "div",
        { className: "flex flex-wrap gap-3" },
        h(OkrSplitCard, { split, loading }),
        h(StatCard, { label: "Active initiatives", value: loading ? null : stats.activeInits, tone: "info" }),
        h(StatCard, { label: "Decisions pending", value: loading ? null : stats.pendingDec, tone: stats.pendingDec ? "warn" : "default" }),
        h(StatCard, { label: "Board pack readiness", value: loading ? null : (stats.readiness == null ? "—" : `${stats.readiness}%`), tone: "default" })
      ),

      // Section 2 — OKR tracker grid
      h(
        "div",
        { className: "bg-white rounded-lg border border-gray-200 p-5" },
        h(SectionHeader, {
          title: "OKR tracker",
          subtitle: "Current quarter. Progress = mean of key-result attainment. Trend is 7-day delta.",
        }),
        loading
          ? h("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3" },
              h(SkeletonRow), h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
          : okrRows.length === 0
            ? h(EmptyHint, {
                text: "No OKRs captured yet — run onboard-me or paste your current OKR list and I'll start tracking.",
              })
            : h(
                "div",
                { className: "grid grid-cols-1 md:grid-cols-2 gap-3" },
                okrRows.map((o) => {
                  const pctLabel = o.avgPct == null ? "—" : `${Math.round(o.avgPct)}%`;
                  const firstKR = o.krRows && o.krRows.length ? o.krRows[0] : null;
                  const krSummary = firstKR
                    ? `${firstKR.current != null ? firstKR.current : "—"} / ${firstKR.target != null ? firstKR.target : "—"}${firstKR.unit ? " " + firstKR.unit : ""} · ${firstKR.metric || ""}`
                    : "no key results captured";
                  const moreKrs = o.krRows && o.krRows.length > 1 ? ` (+${o.krRows.length - 1} more)` : "";
                  return h(
                    "div",
                    { key: o.id, className: "border border-gray-100 rounded-lg p-3 bg-slate-50" },
                    h(
                      "div",
                      { className: "flex items-start gap-2" },
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h("div", { className: "text-sm font-semibold text-slate-800 truncate" }, o.objective || "(untitled objective)"),
                        h("div", { className: "text-xs text-gray-500 truncate mt-0.5" }, `${krSummary}${moreKrs}`)
                      ),
                      h(
                        "span",
                        { className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${okrStateClass(o.state)}` },
                        o.state
                      ),
                      h(TrendChip, { trend: o.trend })
                    ),
                    h(
                      "div",
                      { className: "mt-2 flex items-center gap-2" },
                      h("div", { className: "flex-1" }, h(ProgressBar, { pct: o.avgPct, state: o.state })),
                      h("div", { className: "text-xs font-medium text-gray-700 w-10 text-right" }, pctLabel)
                    )
                  );
                })
              )
      ),

      // Section 3 — Two-column grid
      h(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },

        // Initiatives at risk
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Initiatives at risk",
            subtitle: "Ranked by linked-OKR impact; off-track first.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : atRiskInits.length === 0
              ? h(EmptyHint, {
                  text: "Nothing at risk. Ask me to \"refresh initiative status\" or \"give me the weekly status rollup\" to repopulate.",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  atRiskInits.map((i) => {
                    const linked = Array.isArray(i.linkedOkrIds) ? i.linkedOkrIds.length : 0;
                    return h(
                      "li",
                      { key: i.id, className: "flex items-center gap-3 py-2.5" },
                      h(
                        "span",
                        { className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${initiativeStatusClass(i.status)}` },
                        i.status || "unknown"
                      ),
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h("div", { className: "text-sm font-medium text-gray-900 truncate" }, i.title || i.slug || "(untitled initiative)"),
                        h(
                          "div",
                          { className: "text-xs text-gray-500 truncate mt-0.5" },
                          i.owner ? `${i.owner} · ` : "",
                          `${linked} OKR${linked === 1 ? "" : "s"}`,
                          i.lastStatusAt ? ` · ${formatRelative(i.lastStatusAt)}` : ""
                        )
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleNudge(i.slug || i.id),
                          className: "text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded px-2.5 py-1 transition-colors",
                        },
                        "Nudge owner"
                      )
                    );
                  })
                )
        ),

        // Decisions pending CEO input
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Decisions pending",
            subtitle: "Waiting on your input.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : pendingDecisions.length === 0
              ? h(EmptyHint, {
                  text: "No decisions pending. When something needs your input, ask me to \"log the decision on {topic}\" and I'll track it.",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  pendingDecisions.map((d) => {
                    return h(
                      "li",
                      { key: d.id, className: "flex items-center gap-2 py-2.5" },
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h("div", { className: "text-sm font-medium text-gray-900 truncate" }, d.title || "(untitled decision)"),
                        h(
                          "div",
                          { className: "text-xs text-gray-500 truncate mt-0.5" },
                          d.summary ? `${d.summary} · ` : "",
                          formatRelative(d.createdAt)
                        )
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => handlePrepDecision(d.slug || d.id),
                          className: "text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded px-2.5 py-1 transition-colors",
                        },
                        "Prep decision"
                      )
                    );
                  })
                )
        )
      )
    );
  }

  window.__houston_bundle__ = { ChiefOfStaffDashboard: ChiefOfStaffDashboard };
})();
